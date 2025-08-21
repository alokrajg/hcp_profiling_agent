#!/usr/bin/env python3
"""
Test script to debug the agents functionality.
"""

import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_agents():
    """Test the agents functionality step by step."""
    
    print("🔍 Testing Agents Functionality")
    print("=" * 40)
    
    try:
        # Test 1: Import agents
        print("1. Testing import...")
        from app.services.agents import run_agents_orchestrator
        print("✅ Import successful")
        
        # Test 2: Test with a simple NPI
        print("\n2. Testing agents with NPI...")
        result = await run_agents_orchestrator("1234567890")
        print("✅ Agents execution successful")
        print(f"Result keys: {list(result.keys())}")
        
        # Test 3: Check if all required fields are present
        print("\n3. Checking required fields...")
        required_fields = [
            "npi", "fullName", "specialty", "affiliation", "location", 
            "degrees", "socialMediaHandles", "followers", "topInterests", 
            "recentActivity", "publications", "engagementStyle", "confidence", 
            "summary", "pubmed", "web"
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in result:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"❌ Missing fields: {missing_fields}")
        else:
            print("✅ All required fields present")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_agents())
    if success:
        print("\n🎉 All tests passed!")
    else:
        print("\n💥 Tests failed!")
        sys.exit(1)
