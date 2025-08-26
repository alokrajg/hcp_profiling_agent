import os
import csv
import json
import requests
import pandas as pd
import re
import xml.etree.ElementTree as ET
import gender_guesser.detector as gender
from dotenv import load_dotenv
from openai import AzureOpenAI
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Initialize gender detector
d = gender.Detector(case_sensitive=False)

# Load environment variables
load_dotenv()

# ========= SETUP AZURE OPENAI CLIENT =========
AZURE_API_KEY = os.getenv("AZURE_API_KEY", "your-key-here")
AZURE_API_BASE = os.getenv("AZURE_API_BASE", "https://axtria-institute-training.openai.azure.com/")
AZURE_API_VERSION = os.getenv("AZURE_API_VERSION", "2024-12-01-preview")
DEPLOYMENT_NAME = os.getenv("DEPLOYMENT_NAME", "gpt-4o-mini")

client = AzureOpenAI(
    api_key=AZURE_API_KEY,
    api_version=AZURE_API_VERSION,
    azure_endpoint=AZURE_API_BASE
)
DEPLOYMENT_NAME = os.getenv("DEPLOYMENT_NAME")

# =======================
# Base Agent
# =======================
class Agent:
    def run(self, npi, profile):
        raise NotImplementedError

    def call_llm(self, prompt):
        # Check if Azure OpenAI is properly configured
        if not AZURE_API_KEY or AZURE_API_KEY == "your-key-here":
            print("[WARNING] Azure OpenAI not configured - using fallback data")
            return None
            
        try:
            resp = client.chat.completions.create(
                model=DEPLOYMENT_NAME,
                messages=[
                    {"role": "system", "content": "You are a structured data processing agent."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0
            )
            return resp.choices[0].message.content
        except Exception as e:
            print(f"[ERROR] LLM call failed: {e}")
            print("[INFO] Using fallback data instead of AI analysis")
            return None


# =======================
# Agent 1: NPI Registry
# =======================
class NPIAgent(Agent):
    PROMPT = "You are an HCP profile cleaner. Clean and standardize the following NPI registry data:\n\n{data}"

    def run(self, npi, profile):
        try:
            url = f"https://npiregistry.cms.hhs.gov/api/?number={npi}&version=2.1"
            resp = requests.get(url, verify=False).json()

            if "results" in resp:
                result = resp["results"][0]
                profile["npi"] = npi
                profile["First_Name"] = result['basic'].get('first_name', '')
                profile["Last_Name"] = result['basic'].get('last_name', '')
                profile["full_name"] = f"{profile['First_Name']} {profile['Last_Name']}".strip()
                profile["Education"] = result['basic'].get('credential', '')

                # Gender inference
                first_name = result['basic'].get('first_name', '')
                gender_value = result['basic'].get('gender', '')
                if not gender_value and first_name:
                    guess = d.get_gender(first_name)
                    if guess in ["male", "mostly_male"]:
                        gender_value = "Male"
                    elif guess in ["female", "mostly_female"]:
                        gender_value = "Female"
                profile["Gender"] = gender_value

                profile["specialty"] = result["taxonomies"][0].get("desc", "")
                profile["Practice_City"] = result['addresses'][0].get('city', '')
                profile["Practice_State"] = result['addresses'][0].get('state', '')
                profile["location"] = f"{result['addresses'][0].get('city', '')}, {result['addresses'][0].get('state', '')}"

        except Exception as e:
            print(f"NPI Agent error for {npi}: {e}")
        return profile

# =======================
# Prompt for LLM research evaluation
# =======================
research_prompt_template = """
You are an expert research analyst specializing in healthcare publications.

HCP Profile Data:
- Full Name: {full_name}
- Publication Years: {publication_years}
- Top Publication Journals: {top_publication_journals}
- Top Publication Titles: {top_publication_titles}
- Total Publications: {num_publications}

Instructions:
1. For each journal in Top Publication Journals, classify it into one of the following tiers based on impact, reputation, and relevance:
   - "High-impact" (widely recognized, top-tier journals)
   - "Medium-impact" (well-regarded, specialized journals)
   - "Low-impact" (niche or lesser-known journals)
2. Consider publication year: recent publications in high-impact journals weigh more heavily.
3. Compute a "Research Prestige Score" (0-100) reflecting quantity and quality of publications.
4. Highlight the top 3 most influential publications from Top Publication Titles.
5. Return output ONLY in JSON format:

{{
    "journal_classification": [
        {{"journal": "Journal Name 1", "tier": "High-impact"}},
        {{"journal": "Journal Name 2", "tier": "Medium-impact"}},
        {{"journal": "Journal Name 3", "tier": "Low-impact"}}
    ],
    "research_prestige_score": 0,
    "top_influential_publications": ["Title 1", "Title 2", "Title 3"]
}}
"""

# =======================
# PubMed Agent
# =======================
def clean_affiliations(raw_affiliations: list, max_affiliations: int = 5) -> list:
    """
    Cleans a list of raw affiliation strings and returns up to max_affiliations unique entries.
    """
    clean_list = []
    seen = set()

    for aff in raw_affiliations:
        if not aff:
            continue
        # Remove emails
        aff = re.sub(r"\S+@\S+", "", aff)
        # Remove years like 2019, 2020, etc.
        aff = re.sub(r"\b(19|20)\d{2}\b", "", aff)
        # Normalize spaces and strip punctuation
        aff = re.sub(r"\s+", " ", aff).strip(" ,.;")

        if aff and aff.lower() not in seen:
            seen.add(aff.lower())
            clean_list.append(aff)

    return clean_list[:max_affiliations]


class PubMedAgent(Agent):
    def run(self, npi, profile):
        if not profile.get("full_name"):
            return profile
        try:
            parts = profile["full_name"].split()
            if len(parts) < 2:
                return profile

            lastname, firstname = parts[-1], parts[0]

            # Step 1: Search PubMed
            search_url = (
                f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
                f"?db=pubmed&term={lastname}+{firstname}[Author]&retmode=json&retmax=20"
            )
            search_resp = requests.get(search_url).json()
            pmids = search_resp.get("esearchresult", {}).get("idlist", [])

            if not pmids:
                return profile

            # Step 2: Get article metadata with Efetch (for affiliations)
            efetch_url = (
                f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
                f"?db=pubmed&id={','.join(pmids)}&retmode=xml"
            )
            efetch_resp = requests.get(efetch_url).text

            root = ET.fromstring(efetch_resp)

            publications = []
            years, affiliations = [], []

            for article in root.findall(".//PubmedArticle"):
                pmid = article.findtext(".//PMID")

                title = article.findtext(".//ArticleTitle")
                journal = article.findtext(".//Journal/Title")
                pub_date = article.findtext(".//PubDate/Year") or ""
                
                # Collect authors + affiliations
                author_list = []
                for author in article.findall(".//Author"):
                    name = []
                    if author.find("ForeName") is not None:
                        name.append(author.find("ForeName").text)
                    if author.find("LastName") is not None:
                        name.append(author.find("LastName").text)
                    fullname = " ".join(name).strip()
                    if fullname:
                        author_list.append(fullname)

                    # Affiliations
                    for aff in author.findall(".//AffiliationInfo/Affiliation"):
                        if aff.text:
                            affiliations.append(aff.text.strip())

                publications.append({
                    "pmid": pmid,
                    "title": title,
                    "date": pub_date,
                    "journal": journal,
                    "authors": author_list
                })

                if pub_date and pub_date.isdigit():
                    years.append(int(pub_date))

            # Step 3: Populate profile
            profile["num_publications"] = len(publications)
            if years:
                profile["publication_years"] = f"{min(years)}–{max(years)}"
            profile["affiliations"] = list(set(affiliations))  # unique affiliations

            # ✅ Clean + keep only top 5 affiliations
            profile["affiliations"] = clean_affiliations(affiliations, max_affiliations=5)

            # Step 4: Store top publications separately
            top_pubs = publications[:5]
            profile["top_publication_titles"] = [p["title"] for p in top_pubs if p.get("title")]
            profile["top_publication_journals"] = [p["journal"] for p in top_pubs if p.get("journal")]

        except Exception as e:
            print(f"[ERROR] PubMed Agent error for {npi} ({profile.get('full_name')}): {e}")

        return profile

    
    
# =======================
# Extended Agent with Impact Score
# =======================
class PubMedAgentWithImpact(PubMedAgent):
    def run(self, npi, profile):
        profile = super().run(npi, profile)  # Scrape PubMed data first

        # Only call LLM if there are top publications
        if profile.get("top_publication_journals"):
            llm_response = self.call_llm(
                research_prompt_template.format(
                    full_name=profile.get("full_name", ""),
                    publication_years=profile.get("publication_years", ""),
                    top_publication_journals=", ".join(profile.get("top_publication_journals", [])),
                    top_publication_titles=", ".join(profile.get("top_publication_titles", [])),
                    num_publications=profile.get("num_publications", 0),
                )
            )
            if llm_response:
                try:
                    impact_data = json.loads(llm_response)
                    profile["journal_classification"] = impact_data.get("journal_classification", [])
                    profile["research_prestige_score"] = impact_data.get("research_prestige_score", 0)
                    profile["top_influential_publications"] = impact_data.get("top_influential_publications", [])
                except Exception as e:
                    print(f"[ERROR] Parsing LLM output: {e}")
                    profile["journal_classification"] = []
                    profile["research_prestige_score"] = 0
                    profile["top_influential_publications"] = []
        else:
            profile["journal_classification"] = []
            profile["research_prestige_score"] = 0
            profile["top_influential_publications"] = []

        return profile


# =======================
# Prompt for LLM research evaluation
# =======================
clinical_trials_prompt_template = """
You are an expert clinical research analyst.

HCP Clinical Trials Data:
- Full Name: {full_name}
- Total Trials: {total_trials}
- Active Trials: {active_trials}
- Completed Trials: {completed_trials}
- Conditions: {conditions}
- Interventions: {interventions}
- Role: {role}

Instructions:
1. Assess the HCP’s involvement in clinical trials.
2. Highlight leadership roles (Principal Investigator, Study Chair, etc.).
3. Classify overall engagement as: "High", "Medium", or "Low".
4. Provide 2–3 sentences summarizing their clinical research impact.
5. Return ONLY in JSON format:

{{
    "trial_involvement": "High/Medium/Low",
    "leadership_roles": ["Role 1", "Role 2"],
    "impact_summary": "Concise summary here."
}}
"""


# =======================
# Agent 3: ClinicalTrials
# =======================
def fetch_clinical_trials(full_name, max_trials=5):
    """Return up to max_trials trials for a given HCP"""
    if not full_name:
        return []

    from urllib.parse import quote_plus
    full_name_encoded = quote_plus(full_name)

    url = (
        f"https://clinicaltrials.gov/api/query/study_fields"
        f"?expr={full_name_encoded}"
        f"&fields=NCTId,Condition,Intervention,OverallStatus,LeadSponsorName"
        f"&min_rnk=1&max_rnk=50&fmt=json"
    )
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200 or not resp.text.strip():
            print(f"[WARNING] No trials found or empty response for {full_name}")
            return []

        try:
            data = resp.json()
        except json.JSONDecodeError:
            print(f"[WARNING] Response not valid JSON for {full_name}: {resp.text[:200]}")
            return []

        studies = data.get("StudyFieldsResponse", {}).get("StudyFields", [])
        return studies[:max_trials]

    except requests.RequestException as e:
        print(f"[ERROR] Fetching trials for {full_name}: {e}")
        return []


# =======================
# ClinicalTrialsAgent
# =======================
class ClinicalTrialsAgent(Agent):
    """
    Fetch clinical trial info for an HCP and summarize involvement.
    """
    def run(self, npi, profile):
        full_name = profile.get("full_name")
        if not full_name:
            profile["trial_involvement"] = "None"
            profile["leadership_roles"] = []
            profile["impact_summary"] = ""
            return profile

        # Step 1: Fetch trials
        trials = fetch_clinical_trials(full_name)
        profile["total_trials"] = len(trials)
        profile["active_trials"] = len([t for t in trials if t.get("OverallStatus", [""])[0] == "Active"])
        profile["completed_trials"] = len([t for t in trials if t.get("OverallStatus", [""])[0] == "Completed"])
        profile["conditions"] = list({t.get("Condition", [""])[0] for t in trials if t.get("Condition")})
        profile["interventions"] = list({t.get("Intervention", [""])[0] for t in trials if t.get("Intervention")})
        profile["roles"] = ["Investigator"]  # Default role

        # Step 2: Call LLM only if there are trials
        if profile["total_trials"] > 0:
            llm_input = clinical_trials_prompt_template.format(
                full_name=full_name,
                total_trials=profile["total_trials"],
                active_trials=profile["active_trials"],
                completed_trials=profile["completed_trials"],
                conditions=", ".join(profile["conditions"]),
                interventions=", ".join(profile["interventions"]),
                role=", ".join(profile["roles"]),
            )
            llm_response = self.call_llm(llm_input)

            if llm_response and llm_response.strip():
                try:
                    trial_data = json.loads(llm_response.strip())
                    profile["trial_involvement"] = trial_data.get("trial_involvement", "Unknown")
                    profile["leadership_roles"] = trial_data.get("leadership_roles", [])
                    profile["impact_summary"] = trial_data.get("impact_summary", "")
                except json.JSONDecodeError:
                    print(f"[WARNING] LLM output not valid JSON:\n{llm_response}")
                    profile["trial_involvement"] = "Unknown"
                    profile["leadership_roles"] = []
                    profile["impact_summary"] = ""
        else:
            profile["trial_involvement"] = "None"
            profile["leadership_roles"] = []
            profile["impact_summary"] = ""

        return profile

# =======================
# Orchestrator
# =======================
def process_npi_list(npi_list, output_path="hcp_profiles.xlsx"):
    agents = [NPIAgent(), PubMedAgentWithImpact(), ClinicalTrialsAgent()]
    profiles = []

    for npi in npi_list:
        profile = {}
        for agent in agents:
            profile = agent.run(npi, profile)

        # Clean up list fields before saving
        for key, value in profile.items():
            if isinstance(value, list):
                profile[key] = ", ".join(map(str, value))  # join list into string
                
        profiles.append(profile)

    df = pd.DataFrame(profiles)
    df.to_excel(output_path, index=False)
    print(f"✅ Saved {len(profiles)} profiles to {output_path}")

# =======================
# Example Run
# =======================
if __name__ == "__main__":
    file_path = r'hcp_id.csv'
    npi_list = []
    with open(file_path, mode='r') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            npi_list.append(row['NPI'])
    process_npi_list(npi_list, output_path="hcp_profiles.xlsx")
