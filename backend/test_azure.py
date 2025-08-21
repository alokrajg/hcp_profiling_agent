#!/usr/bin/env python3
"""
Test Azure OpenAI connection
"""

import os
import asyncio
from openai import AsyncOpenAI

async def test_azure_openai():
    """Test Azure OpenAI connection"""
    
    # Load environment variables
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_API_BASE = os.getenv("OPENAI_API_BASE")
    OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION", "2024-12-01-preview")
    OPENAI_DEPLOYMENT_NAME = os.getenv("OPENAI_DEPLOYMENT_NAME", "gpt-4o")
    
    print("🔧 Testing Azure OpenAI Configuration")
    print("=" * 50)
    print(f"API Base: {OPENAI_API_BASE}")
    print(f"Deployment: {OPENAI_DEPLOYMENT_NAME}")
    print(f"API Version: {OPENAI_API_VERSION}")
    print(f"API Key: {OPENAI_API_KEY[:10]}..." if OPENAI_API_KEY else "Not set")
    
    if not OPENAI_API_KEY or not OPENAI_API_BASE:
        print("❌ Missing required environment variables")
        return False
    
    try:
        # Test Azure OpenAI
        print("\n🤖 Testing Azure OpenAI...")
        base_url = OPENAI_API_BASE.rstrip('/')
        client = AsyncOpenAI(
            api_key=OPENAI_API_KEY,
            base_url=f"{base_url}/openai/deployments/{OPENAI_DEPLOYMENT_NAME}",
            default_headers={
                "api-key": OPENAI_API_KEY,
                "api-version": OPENAI_API_VERSION
            }
        )
        
        response = await client.chat.completions.create(
            model=OPENAI_DEPLOYMENT_NAME,
            messages=[
                {"role": "user", "content": "Hello! Please respond with 'Azure OpenAI is working!'"}
            ],
            max_tokens=50
        )
        
        print(f"✅ Azure OpenAI Response: {response.choices[0].message.content}")
        return True
        
    except Exception as e:
        print(f"❌ Azure OpenAI failed: {e}")
        
        # Try standard OpenAI as fallback
        print("\n🔄 Trying standard OpenAI as fallback...")
        try:
            client = AsyncOpenAI(api_key=OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": "Hello! Please respond with 'Standard OpenAI is working!'"}
                ],
                max_tokens=50
            )
            print(f"✅ Standard OpenAI Response: {response.choices[0].message.content}")
            return True
            
        except Exception as fallback_error:
            print(f"❌ Standard OpenAI also failed: {fallback_error}")
            return False

if __name__ == "__main__":
    # Load .env file
    from dotenv import load_dotenv
    load_dotenv()
    
    result = asyncio.run(test_azure_openai())
    if result:
        print("\n🎉 OpenAI connection successful!")
    else:
        print("\n💥 OpenAI connection failed!")
