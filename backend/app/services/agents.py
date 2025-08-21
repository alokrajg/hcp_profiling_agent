import os
from typing import Any, Dict, List, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

try:
	from langgraph.graph import START, END, StateGraph
	has_langgraph = True
except Exception:  # noqa: BLE001
	has_langgraph = False

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


class AgentTools:
	"""A set of stateless tools used by agents."""

	def __init__(self, timeout: int = 30) -> None:
		self.http = httpx.AsyncClient(timeout=timeout)

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
	async def npi_lookup(self, npi: str) -> Dict[str, Any]:
		params = {"number": npi, "enumeration_type": "NPI-1", "version": 2.1}
		r = await self.http.get("https://npiregistry.cms.hhs.gov/api/", params=params)
		r.raise_for_status()
		return r.json()

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
	async def pubmed_search(self, full_name: str) -> Dict[str, Any]:
		params = {"db": "pubmed", "term": full_name, "retmode": "json"}
		r = await self.http.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", params=params)
		r.raise_for_status()
		return r.json()

	async def web_search(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
		try:
			from ddgs import DDGS  # Try new package name first
		except ImportError:
			from duckduckgo_search import DDGS  # Fallback to old package name
		
		results: List[Dict[str, str]] = []
		with DDGS() as ddgs:
			for i, res in enumerate(ddgs.text(query, max_results=max_results)):
				results.append({"title": res.get("title", ""), "href": res.get("href", ""), "body": res.get("body", "")})
				if i + 1 >= max_results:
					break
		return results

	async def extract_structured_profile(self, npi: str, npi_data: Dict[str, Any], pubmed_data: Dict[str, Any], web_data: List[Dict[str, str]]) -> Dict[str, Any]:
		"""Use OpenAI to extract comprehensive structured profile from raw data."""
		if not OPENAI_API_KEY:
			# Fallback to basic extraction
			return self._basic_profile_extraction(npi, npi_data, pubmed_data, web_data)
		
		try:
			from openai import AsyncOpenAI
			
			# Use standard OpenAI
			client = AsyncOpenAI(api_key=OPENAI_API_KEY)
			model = "gpt-3.5-turbo"
			
			# Prepare context from all data sources
			context = self._build_analysis_context(npi, npi_data, pubmed_data, web_data)
			
			response = await client.chat.completions.create(
				model=model,
				messages=[
					{
						"role": "system",
						"content": """You are a healthcare professional profiler. Analyze the provided data and extract comprehensive information about the healthcare provider. Return a JSON object with the following structure:

{
  "fullName": "Full name of the provider",
  "specialty": "Primary specialty or specialties",
  "affiliation": "Hospital, clinic, or organization affiliation",
  "location": "City, State format",
  "degrees": "Educational degrees (MD, PhD, etc.)",
  "socialMediaHandles": {
    "twitter": "Twitter handle if found",
    "linkedin": "LinkedIn profile URL if found"
  },
  "followers": {
    "twitter": "Estimated Twitter followers",
    "linkedin": "Estimated LinkedIn connections"
  },
  "topInterests": ["Interest 1", "Interest 2", "Interest 3"],
  "recentActivity": "Recent professional activity or news",
  "publications": number,
  "engagementStyle": "Professional engagement style (e.g., 'Research-focused', 'Clinical leader', 'Educator')",
  "confidence": number (1-100),
  "summary": "Professional summary paragraph"
}

Extract as much information as possible from the provided data. If information is not available, use empty strings or 0 values. Be realistic about confidence scores based on available data."""
					},
					{
						"role": "user", 
						"content": f"Analyze this healthcare provider data and extract structured information:\n\n{context}"
					}
				],
				max_tokens=800,  # Reduced for faster response
				temperature=0.1,
				response_format={"type": "json_object"},
				timeout=30  # 30 second timeout
			)
			
			import json
			structured_data = json.loads(response.choices[0].message.content)
			
			# Ensure all required fields are present
			structured_data.update({
				"npi": npi,
				"pubmed": pubmed_data,
				"web": web_data
			})
			
			return structured_data
			
		except Exception as e:
			print(f"OpenAI extraction failed: {e}")
			print("Falling back to basic extraction...")
			
			# Fallback to basic extraction
			return self._basic_profile_extraction(npi, npi_data, pubmed_data, web_data)

	def _build_analysis_context(self, npi: str, npi_data: Dict[str, Any], pubmed_data: Dict[str, Any], web_data: List[Dict[str, str]]) -> str:
		"""Build comprehensive context for OpenAI analysis."""
		context_parts = [f"NPI ID: {npi}"]
		
		# NPI Registry data
		if npi_data.get("results"):
			result = npi_data["results"][0]
			basic = result.get("basic", {})
			context_parts.append(f"NPI Registry Data:")
			context_parts.append(f"- Name: {basic.get('first_name', '')} {basic.get('last_name', '')}")
			context_parts.append(f"- Gender: {basic.get('gender', '')}")
			context_parts.append(f"- Credentials: {basic.get('credential', '')}")
			
			# Addresses
			addresses = result.get("addresses", [])
			if addresses:
				addr = addresses[0]
				context_parts.append(f"- Location: {addr.get('city', '')}, {addr.get('state', '')}")
				context_parts.append(f"- Organization: {addr.get('organization_name', '')}")
				context_parts.append(f"- Phone: {addr.get('telephone_number', '')}")
			
			# Taxonomies (specialties)
			taxonomies = result.get("taxonomies", [])
			if taxonomies:
				context_parts.append(f"- Specialties: {', '.join([t.get('desc', '') for t in taxonomies])}")
		
		# PubMed data
		if pubmed_data.get("esearchresult", {}).get("count", "0") != "0":
			context_parts.append(f"PubMed Publications: {pubmed_data['esearchresult']['count']} papers found")
			if pubmed_data["esearchresult"].get("idlist"):
				context_parts.append(f"Publication IDs: {', '.join(pubmed_data['esearchresult']['idlist'])}")
		
		# Web search data
		if web_data:
			context_parts.append(f"Web Search Results ({len(web_data)} found):")
			for i, result in enumerate(web_data[:3]):  # Top 3 results
				context_parts.append(f"- {i+1}. {result.get('title', '')}")
				context_parts.append(f"  URL: {result.get('href', '')}")
				context_parts.append(f"  Summary: {result.get('body', '')[:200]}...")
		
		return "\n".join(context_parts)

	def _basic_profile_extraction(self, npi: str, npi_data: Dict[str, Any], pubmed_data: Dict[str, Any], web_data: List[Dict[str, str]]) -> Dict[str, Any]:
		"""Basic extraction without OpenAI."""
		result = (npi_data.get("results", [{}]) or [{}])[0]
		basic = result.get("basic", {}) if isinstance(result, dict) else {}
		addresses = result.get("addresses", []) if isinstance(result, dict) else []
		taxonomies = result.get("taxonomies", []) if isinstance(result, dict) else []
		
		# Extract basic info
		name_parts = [basic.get("first_name"), basic.get("last_name")]
		full_name = " ".join([p for p in name_parts if p]).strip() or f"NPI {npi}"
		
		location = ""
		affiliation = ""
		if addresses:
			city = addresses[0].get("city", "")
			state = addresses[0].get("state", "")
			location = ", ".join([s for s in [city, state] if s])
			affiliation = addresses[0].get("organization_name", "")
		
		specialty = ""
		if taxonomies:
			specialty = taxonomies[0].get("desc", "")
		
		degrees = basic.get("credential", "")
		
		# Count publications
		publications = 0
		if pubmed_data.get("esearchresult", {}).get("count"):
			try:
				publications = int(pubmed_data["esearchresult"]["count"])
			except:
				pass
		
		# Extract social media info and interests from web results
		social_media = {"twitter": "", "linkedin": ""}
		followers = {"twitter": "", "linkedin": ""}
		interests = []
		recent_activity = ""
		
		for result in web_data:
			title = result.get("title", "").lower()
			body = result.get("body", "").lower()
			href = result.get("href", "").lower()
			
			# Extract social media profiles
			if "linkedin" in href or "linkedin" in title:
				social_media["linkedin"] = result.get("href", "")
			elif "twitter" in href or "twitter" in title or "x.com" in href:
				social_media["twitter"] = result.get("href", "")
			
			# Extract potential interests from web content
			content = f"{title} {body}"
			if any(word in content for word in ["research", "clinical", "education", "surgery", "cardiology", "oncology", "pediatrics"]):
				interests.extend([word for word in ["research", "clinical", "education", "surgery", "cardiology", "oncology", "pediatrics"] if word in content])
			
			# Extract recent activity
			if any(word in content for word in ["recent", "latest", "new", "announced", "published"]):
				recent_activity = result.get("title", "")[:100] + "..."
		
		# Remove duplicates and limit interests
		interests = list(set(interests))[:5]
		
		# Determine engagement style based on data
		engagement_style = ""
		if pubmed_data.get("esearchresult", {}).get("count", "0") != "0":
			engagement_style = "Research-focused"
		elif social_media["linkedin"] or social_media["twitter"]:
			engagement_style = "Social media active"
		elif affiliation:
			engagement_style = "Clinical leader"
		else:
			engagement_style = "Healthcare provider"
		
		return {
			"npi": npi,
			"fullName": full_name,
			"specialty": specialty,
			"affiliation": affiliation,
			"location": location,
			"degrees": degrees,
			"socialMediaHandles": social_media,
			"followers": followers,
			"topInterests": interests,
			"recentActivity": recent_activity,
			"publications": publications,
			"engagementStyle": engagement_style,
			"confidence": 60 if full_name != f"NPI {npi}" else 20,
			"summary": f"{full_name} is a {specialty} based in {location}. Affiliation: {affiliation}.",
			"pubmed": pubmed_data,
			"web": web_data
		}

	async def synthesize_summary(self, profile: Dict[str, Any]) -> str:
		# Try to use OpenAI for better summarization if available
		if OPENAI_API_KEY:
			try:
				from openai import AsyncOpenAI
				
				# Use standard OpenAI
				client = AsyncOpenAI(api_key=OPENAI_API_KEY)
				model = "gpt-3.5-turbo"
				
				# Build context from available data
				context_parts = []
				name = profile.get("fullName", "Unknown")
				specialty = profile.get("specialty", "")
				aff = profile.get("affiliation", "")
				loc = profile.get("location", "")
				
				if name and name != "Unknown":
					context_parts.append(f"Name: {name}")
				if specialty:
					context_parts.append(f"Specialty: {specialty}")
				if aff:
					context_parts.append(f"Affiliation: {aff}")
				if loc:
					context_parts.append(f"Location: {loc}")
				
				# Add PubMed data if available
				pubmed_data = profile.get("pubmed", {})
				if pubmed_data.get("esearchresult", {}).get("count", "0") != "0":
					context_parts.append(f"PubMed Publications: {pubmed_data['esearchresult']['count']}")
				
				# Add web search data if available
				web_data = profile.get("web", [])
				if web_data:
					context_parts.append(f"Web Results: {len(web_data)} found")
				
				context = "\n".join(context_parts)
				
				response = await client.chat.completions.create(
					model=model,
					messages=[
						{
							"role": "system",
							"content": "You are a healthcare professional profiler. Create a concise, professional summary of the healthcare provider based on the available data."
						},
						{
							"role": "user", 
							"content": f"Create a professional summary for this healthcare provider:\n\n{context}"
						}
					],
					max_tokens=150,
					temperature=0.3,
					timeout=20  # 20 second timeout
				)
				
				return response.choices[0].message.content.strip()
			except Exception as e:
				print(f"OpenAI summarization failed: {e}")
				# Fall back to simple summarization
		
		# Simple heuristic summarization fallback
		name = profile.get("fullName", "Unknown")
		specialty = profile.get("specialty", "")
		aff = profile.get("affiliation", "")
		loc = profile.get("location", "")
		return f"{name} is a {specialty} based in {loc}. Affiliation: {aff}."


async def run_agents_orchestrator(npi: str) -> Dict[str, Any]:
	"""Run a comprehensive multi-step pipeline with OpenAI-powered data extraction."""
	tools = AgentTools()

	# Enhanced sequential flow with comprehensive data extraction (LangGraph has state issues)
	npi_data = await tools.npi_lookup(npi)
	# Get NPI data first to get the provider's name
	result = (npi_data.get("results", [{}]) or [{}])[0]
	basic = result.get("basic", {}) if isinstance(result, dict) else {}
	name_parts = [basic.get("first_name"), basic.get("last_name")]
	full_name = " ".join([p for p in name_parts if p]).strip()
	
	# Use provider name for better search results
	search_name = full_name if full_name else f"NPI {npi}"
	
	# Add specialty and location to make search more specific
	specialty = ""
	location = ""
	if result.get("taxonomies"):
		specialty = result["taxonomies"][0].get("desc", "")
	if result.get("addresses"):
		addr = result["addresses"][0]
		city = addr.get("city", "")
		state = addr.get("state", "")
		location = f"{city} {state}".strip()
	
	# Create more specific search queries
	specific_search = f'"{search_name}"'
	if specialty:
		specific_search += f' "{specialty}"'
	if location:
		specific_search += f' "{location}"'
	
	pubmed_data = await tools.pubmed_search(specific_search)
	web_data = await tools.web_search(f'{specific_search} healthcare provider')
	
	# Use OpenAI to extract comprehensive structured profile
	profile = await tools.extract_structured_profile(npi, npi_data, pubmed_data, web_data)
	return profile
