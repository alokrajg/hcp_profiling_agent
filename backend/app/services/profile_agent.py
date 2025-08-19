import os
from typing import List, Dict, Any

import httpx
from duckduckgo_search import DDGS
from tenacity import retry, stop_after_attempt, wait_exponential

from ..models import HCPProfile

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


class ProfileAgent:
	NPI_ENDPOINT = "https://npiregistry.cms.hhs.gov/api/"

	def __init__(self) -> None:
		self.http = httpx.AsyncClient(timeout=30)

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
	async def fetch_npi(self, npi: str) -> Dict[str, Any]:
		params = {"number": npi, "enumeration_type": "NPI-1", "version": 2.1}
		r = await self.http.get(self.NPI_ENDPOINT, params=params)
		r.raise_for_status()
		return r.json()

	def search_web(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
		results: List[Dict[str, str]] = []
		with DDGS() as ddgs:
			for i, res in enumerate(ddgs.text(query, max_results=max_results)):
				results.append({"title": res.get("title", ""), "href": res.get("href", ""), "body": res.get("body", "")})
				if i + 1 >= max_results:
					break
		return results

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
	async def fetch_pubmed_count(self, full_name: str) -> int:
		if not full_name:
			return 0
		params = {"db": "pubmed", "term": full_name, "retmode": "json"}
		r = await self.http.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", params=params)
		r.raise_for_status()
		data = r.json()
		try:
			return int(data.get("esearchresult", {}).get("count", 0))
		except Exception:  # noqa: BLE001
			return 0

	async def generate_profiles(self, npi_list: List[str], max_results_per_source: int) -> List[HCPProfile]:
		profiles: List[HCPProfile] = []
		for npi in npi_list:
			try:
				npi_data = await self.fetch_npi(npi)
			except Exception:
				npi_data = {}

			result = (npi_data.get("results", [{}]) or [{}])[0]
			basic = result.get("basic", {}) if isinstance(result, dict) else {}
			taxonomies = result.get("taxonomies", []) if isinstance(result, dict) else []
			practice_locations = result.get("addresses", []) if isinstance(result, dict) else []

			name_parts = [
				basic.get("name_prefix"),
				basic.get("first_name"),
				basic.get("middle_name"),
				basic.get("last_name"),
			]
			full_name = " ".join([p for p in name_parts if p]).strip() or f"NPI {npi}"

			specialty = ""
			if taxonomies:
				primary = next((t for t in taxonomies if t.get("primary") is True), taxonomies[0])
				specialty = primary.get("desc", "") or primary.get("code", "")

			location = ""
			affiliation = ""
			if practice_locations:
				loc = next((a for a in practice_locations if a.get("address_purpose") == "LOCATION"), practice_locations[0])
				city = loc.get("city", "")
				state = loc.get("state", "")
				location = ", ".join([s for s in [city, state] if s])
				affiliation = loc.get("organization_name", "") or loc.get("address_1", "")

			# safe optional practiceLocations
			pl = result.get("practiceLocations")
			if isinstance(pl, list) and pl:
				candidate = pl[0] or {}
				affiliation = affiliation or candidate.get("name", "") or candidate.get("organization_name", "")

			degrees = basic.get("credential") or "MD"

			pubs = await self.fetch_pubmed_count(full_name)
			web_results = self.search_web(f"{full_name} {specialty} LinkedIn Twitter profile hospital", max_results=max_results_per_source)

			linkedin_url = next((r["href"] for r in web_results if "linkedin.com" in r.get("href", "")), None)
			twitter_handle = None
			for r in web_results:
				body = (r.get("body") or "") + " " + (r.get("title") or "")
				if "@" in body and "twitter" in body.lower():
					candidate = body.split("@")[1].split()[0].strip().strip(",.()")
					if candidate and len(candidate) < 30:
						twitter_handle = f"@{candidate}"
						break

			profile = HCPProfile(
				id=npi,
				fullName=full_name,
				specialty=specialty or "",
				affiliation=affiliation or "",
				location=location or "",
				degrees=degrees,
				socialMediaHandles={"twitter": twitter_handle, "linkedin": linkedin_url},
				followers={"twitter": None, "linkedin": None},
				topInterests=[specialty] if specialty else [],
				recentActivity="",
				publications=max(pubs, 0),
				engagementStyle="",
				confidence=85,
				summary=f"Publicly available details compiled for {full_name}.",
			)
			profiles.append(profile)
		return profiles
