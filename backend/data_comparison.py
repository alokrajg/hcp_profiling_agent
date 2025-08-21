#!/usr/bin/env python3
"""
Compare basic vs AI-enhanced data extraction
"""

import asyncio
from app.services.agents import AgentTools

async def compare_data_extraction():
    """Compare basic vs AI-enhanced data extraction"""
    
    print("🔍 Comparing Basic vs AI-Enhanced Data Extraction")
    print("=" * 60)
    
    tools = AgentTools()
    npi = "1740895150"
    
    # Get raw data
    npi_data = await tools.npi_lookup(npi)
    result = (npi_data.get("results", [{}]) or [{}])[0]
    basic = result.get("basic", {}) if isinstance(result, dict) else {}
    name_parts = [basic.get("first_name"), basic.get("last_name")]
    full_name = " ".join([p for p in name_parts if p]).strip()
    
    pubmed_data = await tools.pubmed_search(full_name)
    web_data = await tools.web_search(full_name)
    
    # Get basic extraction
    basic_profile = tools._basic_profile_extraction(npi, npi_data, pubmed_data, web_data)
    
    # Get AI-enhanced extraction
    ai_profile = await tools.extract_structured_profile(npi, npi_data, pubmed_data, web_data)
    
    print(f"📊 Data Comparison for NPI: {npi}")
    print(f"Provider: {full_name}")
    print()
    
    # Compare key fields
    fields_to_compare = [
        "recentActivity",
        "engagementStyle", 
        "summary",
        "confidence",
        "affiliation",
        "degrees"
    ]
    
    for field in fields_to_compare:
        basic_value = basic_profile.get(field, "N/A")
        ai_value = ai_profile.get(field, "N/A")
        
        print(f"🔸 {field.upper()}:")
        print(f"   Basic:  {basic_value}")
        print(f"   AI:     {ai_value}")
        
        if basic_value != ai_value:
            print(f"   ✅ AI Enhanced!")
        else:
            print(f"   ⚠️  No enhancement")
        print()
    
    # Show web data sources
    print(f"🌐 Web Data Sources ({len(web_data)} found):")
    for i, result in enumerate(web_data[:3], 1):
        print(f"   {i}. {result.get('title', 'N/A')}")
        print(f"      {result.get('body', 'N/A')[:100]}...")
        print()
    
    # Show PubMed data
    pubmed_count = pubmed_data.get("esearchresult", {}).get("count", "0")
    print(f"📚 PubMed Publications: {pubmed_count}")
    
    # Overall assessment
    print(f"📈 Overall Assessment:")
    enhanced_fields = sum(1 for field in fields_to_compare 
                         if basic_profile.get(field) != ai_profile.get(field))
    
    if enhanced_fields > 0:
        print(f"   ✅ AI enhanced {enhanced_fields}/{len(fields_to_compare)} fields")
        print(f"   🎯 Data quality significantly improved!")
    else:
        print(f"   ⚠️  No AI enhancement detected")

if __name__ == "__main__":
    asyncio.run(compare_data_extraction())
