#!/usr/bin/env python3
"""
Debug OpenAI API and data quality
"""

import os
import asyncio
import json
from dotenv import load_dotenv

async def debug_openai_and_data():
    """Debug OpenAI API and data quality"""
    
    # Load environment variables
    load_dotenv()
    
    print("🔍 Debugging OpenAI API and Data Quality")
    print("=" * 60)
    
    # Check environment variables
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE")
    
    print(f"📋 Environment Variables:")
    print(f"  OpenAI API Key: {'✅ Set' if openai_key else '❌ Not set'}")
    print(f"  OpenAI Base: {openai_base or 'Not set'}")
    print(f"  API Key Type: {'Azure' if openai_base else 'Standard OpenAI'}")
    print(f"  API Key Preview: {openai_key[:10]}..." if openai_key else "None")
    
    # Test OpenAI API
    print(f"\n🤖 Testing OpenAI API...")
    
    try:
        from openai import AsyncOpenAI
        
        # Test standard OpenAI
        client = AsyncOpenAI(api_key=openai_key)
        
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "Hello! Please respond with 'Standard OpenAI is working!'"}
            ],
            max_tokens=50
        )
        
        print(f"✅ Standard OpenAI Response: {response.choices[0].message.content}")
        print(f"✅ Model Used: {response.model}")
        print(f"✅ Usage: {response.usage}")
        
    except Exception as e:
        print(f"❌ Standard OpenAI failed: {e}")
        
        # Try Azure OpenAI
        if openai_base:
            try:
                print(f"\n🔄 Trying Azure OpenAI...")
                base_url = openai_base.rstrip('/')
                deployment = os.getenv("OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini")
                
                client = AsyncOpenAI(
                    api_key=openai_key,
                    base_url=f"{base_url}/openai/deployments/{deployment}",
                    default_headers={
                        "api-key": openai_key,
                        "api-version": "2024-12-01-preview"
                    }
                )
                
                response = await client.chat.completions.create(
                    model=deployment,
                    messages=[
                        {"role": "user", "content": "Hello! Please respond with 'Azure OpenAI is working!'"}
                    ],
                    max_tokens=50
                )
                
                print(f"✅ Azure OpenAI Response: {response.choices[0].message.content}")
                print(f"✅ Model Used: {response.model}")
                
            except Exception as azure_error:
                print(f"❌ Azure OpenAI also failed: {azure_error}")
    
    # Test data extraction quality
    print(f"\n📊 Testing Data Extraction Quality...")
    
    try:
        from app.services.agents import AgentTools
        
        tools = AgentTools()
        
        # Test with a known NPI
        npi = "1740895150"
        print(f"Testing NPI: {npi}")
        
        # Get NPI data
        npi_data = await tools.npi_lookup(npi)
        print(f"✅ NPI Data: {len(str(npi_data))} characters")
        
        # Get PubMed data
        result = (npi_data.get("results", [{}]) or [{}])[0]
        basic = result.get("basic", {}) if isinstance(result, dict) else {}
        name_parts = [basic.get("first_name"), basic.get("last_name")]
        full_name = " ".join([p for p in name_parts if p]).strip()
        
        pubmed_data = await tools.pubmed_search(full_name)
        print(f"✅ PubMed Data: {len(str(pubmed_data))} characters")
        
        # Get web data
        web_data = await tools.web_search(full_name)
        print(f"✅ Web Data: {len(web_data)} results")
        
        # Test AI extraction
        print(f"\n🤖 Testing AI Data Extraction...")
        profile = await tools.extract_structured_profile(npi, npi_data, pubmed_data, web_data)
        
        print(f"✅ AI Extraction Result:")
        print(f"  Full Name: {profile.get('fullName', 'N/A')}")
        print(f"  Specialty: {profile.get('specialty', 'N/A')}")
        print(f"  Affiliation: {profile.get('affiliation', 'N/A')}")
        print(f"  Location: {profile.get('location', 'N/A')}")
        print(f"  Degrees: {profile.get('degrees', 'N/A')}")
        print(f"  Recent Activity: {profile.get('recentActivity', 'N/A')}")
        print(f"  Engagement Style: {profile.get('engagementStyle', 'N/A')}")
        print(f"  Confidence: {profile.get('confidence', 'N/A')}")
        print(f"  Summary: {profile.get('summary', 'N/A')[:100]}...")
        
        # Check if data is enhanced
        basic_extraction = tools._basic_profile_extraction(npi, npi_data, pubmed_data, web_data)
        
        print(f"\n📈 Data Enhancement Analysis:")
        print(f"  Basic Extraction - Recent Activity: {basic_extraction.get('recentActivity', 'N/A')}")
        print(f"  AI Extraction - Recent Activity: {profile.get('recentActivity', 'N/A')}")
        print(f"  Basic Extraction - Engagement Style: {basic_extraction.get('engagementStyle', 'N/A')}")
        print(f"  AI Extraction - Engagement Style: {profile.get('engagementStyle', 'N/A')}")
        
        if profile.get('recentActivity') != basic_extraction.get('recentActivity'):
            print(f"✅ AI is enhancing the data!")
        else:
            print(f"⚠️ AI is not providing enhanced data")
            
    except Exception as e:
        print(f"❌ Data extraction test failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_openai_and_data())
