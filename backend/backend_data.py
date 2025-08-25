import os
import csv
import json
import requests
import pandas as pd
import re
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

# ========= SETUP OPENAI CLIENT =========
from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Use standard OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# =======================
# Base Agent
# =======================
class Agent:
    def run(self, npi, profile):
        raise NotImplementedError

    def call_llm(self, prompt):
        if not client:
            print("[WARNING] OpenAI client not available - using fallback data")
            return None
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a structured data processing agent."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0
            )
            return resp.choices[0].message.content
        except Exception as e:
            print(f"[ERROR] LLM call failed: {e}")
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

            # Step 2: Get metadata with esummary
            summary_url = (
                f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
                f"?db=pubmed&id={','.join(pmids)}&retmode=json"
            )
            summary_resp = requests.get(summary_url).json()
            result = summary_resp.get("result", {})

            publications = []
            years, affiliations = [], []
            for pid in pmids:
                if pid not in result: 
                    continue
                pub = result[pid]
                title = pub.get("title", "")
                pub_date = pub.get("pubdate", "")
                source = pub.get("source", "")
                authors = [a.get("name") for a in pub.get("authors", []) if "name" in a]

                publications.append({
                    "pmid": pid,
                    "title": title,
                    "date": pub_date,
                    "journal": source,
                    "authors": authors
                })
                if pub_date and pub_date[:4].isdigit():
                    years.append(int(pub_date[:4]))
                affiliations.extend([a.get("affiliation") for a in pub.get("authors", []) if a.get("affiliation")])

            # Step 3: Populate profile
            profile["num_publications"] = len(publications)
            if years:
                profile["publication_years"] = f"{min(years)}–{max(years)}"
            profile["affiliations"] = list(set([a for a in affiliations if a]))

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
class ClinicalTrialsAgent(Agent):
    def run(self, npi, profile):
        # ... fetch trial info first, save into profile ...

        if profile.get("total_trials", 0) > 0:
            llm_response = self.call_llm(
                clinical_trials_prompt_template.format(
                    full_name=profile.get("full_name", ""),
                    total_trials=profile.get("total_trials", 0),
                    active_trials=profile.get("active_trials", 0),
                    completed_trials=profile.get("completed_trials", 0),
                    conditions=", ".join(profile.get("conditions", [])),
                    interventions=", ".join(profile.get("interventions", [])),
                    role=", ".join(profile.get("roles", [])),
                )
            )
            if llm_response:
                try:
                    trial_data = json.loads(llm_response)
                    profile["trial_involvement"] = trial_data.get("trial_involvement", "Unknown")
                    profile["leadership_roles"] = trial_data.get("leadership_roles", [])
                    profile["impact_summary"] = trial_data.get("impact_summary", "")
                except Exception as e:
                    print(f"[ERROR] Parsing LLM output in ClinicalTrialsAgent: {e}")
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

def process_npis_to_data(npi_list):
    """
    Process NPIs and return the profile data as a list of dictionaries.
    This function is used by the Next.js API to get data without saving to Excel.
    """
    agents = [NPIAgent(), PubMedAgentWithImpact(), ClinicalTrialsAgent()]
    profiles = []

    for npi in npi_list:
        profile = {}
        for agent in agents:
            profile = agent.run(npi, profile)

        # Ensure all required fields are present with fallback values
        profile = ensure_profile_completeness(profile, npi)

        # Clean up list fields before returning
        for key, value in profile.items():
            if isinstance(value, list):
                profile[key] = ", ".join(map(str, value))  # join list into string
                
        profiles.append(profile)

    return profiles

def ensure_profile_completeness(profile, npi):
    """
    Ensure all required fields are present in the profile with fallback values.
    """
    # Basic profile structure with fallback values
    complete_profile = {
        "npi": npi,
        "fullName": profile.get("full_name", f"NPI {npi}"),
        "specialty": profile.get("specialty", "Specialty Not Available"),
        "affiliation": profile.get("affiliations", ""),
        "location": profile.get("location", ""),
        "degrees": profile.get("Education", ""),
        "gender": profile.get("Gender", ""),
        "publicationYears": profile.get("publication_years", ""),
        "topPublicationJournals": profile.get("top_publication_journals", ""),
        "topPublicationTitles": profile.get("top_publication_titles", ""),
        "journalClassification": profile.get("journal_classification", ""),
        "researchPrestigeScore": profile.get("research_prestige_score", 0),
        "topInfluentialPublications": profile.get("top_influential_publications", ""),
        "totalTrials": profile.get("total_trials", 0),
        "activeTrials": profile.get("active_trials", 0),
        "completedTrials": profile.get("completed_trials", 0),
        "conditions": profile.get("conditions", ""),
        "interventions": profile.get("interventions", ""),
        "roles": profile.get("roles", ""),
        "trialInvolvement": profile.get("trial_involvement", "None"),
        "leadershipRoles": profile.get("leadership_roles", ""),
        "impactSummary": profile.get("impact_summary", ""),
        # Additional fields for UI compatibility
        "socialMediaHandles": {"twitter": "", "linkedin": ""},
        "followers": {"twitter": "0", "linkedin": "0"},
        "topInterests": [],
        "recentActivity": "",
        "publications": profile.get("num_publications", 0),
        "engagementStyle": "",
        "confidence": 80,
        "summary": "",
        "pubmed": {"esearchresult": {"count": profile.get("num_publications", 0)}},
        "web": []
    }
    
    return complete_profile

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
