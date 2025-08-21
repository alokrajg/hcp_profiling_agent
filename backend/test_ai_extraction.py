#!/usr/bin/env python3
"""
Test AI extraction directly
"""

import asyncio
from app.services.agents import AgentTools

async def test_ai_extraction():
    """Test AI extraction directly"""
    
    print("🔍 Testing AI Extraction Directly")
    print("=" * 50)
    
    tools = AgentTools()
    npi = "1740895150"
    
    print(f"Testing NPI: {npi}")
    
    # Get raw data
    print("1. Getting NPI data...")
    npi_data = await tools.npi_lookup(npi)
    
    print("2. Getting PubMed data...")
    result = (npi_data.get("results", [{}]) or [{}])[0]
    basic = result.get("basic", {}) if isinstance(result, dict) else {}
    name_parts = [basic.get("first_name"), basic.get("last_name")]
    full_name = " ".join([p for p in name_parts if p]).strip()
    
    pubmed_data = await tools.pubmed_search(full_name)
    
    print("3. Getting web data...")
    web_data = await tools.web_search(full_name)
    
    print("4. Testing AI extraction...")
    try:
        profile = await tools.extract_structured_profile(npi, npi_data, pubmed_data, web_data)
        
        print("✅ AI Extraction Result:")
        print(f"  Full Name: {profile.get('fullName', 'N/A')}")
        print(f"  Specialty: {profile.get('specialty', 'N/A')}")
        print(f"  Affiliation: {profile.get('affiliation', 'N/A')}")
        print(f"  Location: {profile.get('location', 'N/A')}")
        print(f"  Degrees: {profile.get('degrees', 'N/A')}")
        print(f"  Recent Activity: {profile.get('recentActivity', 'N/A')}")
        print(f"  Engagement Style: {profile.get('engagementStyle', 'N/A')}")
        print(f"  Confidence: {profile.get('confidence', 'N/A')}")
        print(f"  Summary: {profile.get('summary', 'N/A')[:100]}...")
        
        # Check if this looks like AI-enhanced data
        if profile.get('recentActivity') and profile.get('recentActivity') != "":
            print("✅ AI extraction is working - data is enhanced!")
        else:
            print("⚠️ AI extraction may have fallen back to basic extraction")
            
    except Exception as e:
        print(f"❌ AI extraction failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ai_extraction())
