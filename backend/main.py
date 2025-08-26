from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import os
import sys
from typing import List
import pandas as pd
import io

# Import our existing backend_data functionality
from updated_team_backend import process_npi_list, NPIAgent, PubMedAgentWithImpact, ClinicalTrialsAgent

app = FastAPI(
    title="Healthcare AI System - HCP Profiling API",
    description="AI-powered healthcare professional profiling system with Azure OpenAI",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://192.168.1.2:3000",
        "http://192.168.1.2:3001",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_npis_to_data(npi_list):
    """
    Process NPIs and return the profile data as a list of dictionaries.
    This function is used by the FastAPI to get data without saving to Excel.
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
        "affiliation": ", ".join(profile.get("affiliations", [])) if isinstance(profile.get("affiliations"), list) else profile.get("affiliations", ""),
        "location": profile.get("location", ""),
        "degrees": profile.get("Education", ""),
        "gender": profile.get("Gender", ""),
        "publicationYears": profile.get("publication_years", ""),
        "topPublicationJournals": ", ".join(profile.get("top_publication_journals", [])) if isinstance(profile.get("top_publication_journals"), list) else profile.get("top_publication_journals", ""),
        "topPublicationTitles": ", ".join(profile.get("top_publication_titles", [])) if isinstance(profile.get("top_publication_titles"), list) else profile.get("top_publication_titles", ""),
        "journalClassification": profile.get("journal_classification", ""),
        "researchPrestigeScore": profile.get("research_prestige_score", 0),
        "topInfluentialPublications": ", ".join(profile.get("top_influential_publications", [])) if isinstance(profile.get("top_influential_publications"), list) else profile.get("top_influential_publications", ""),
        "totalTrials": profile.get("total_trials", 0),
        "activeTrials": profile.get("active_trials", 0),
        "completedTrials": profile.get("completed_trials", 0),
        "conditions": ", ".join(profile.get("conditions", [])) if isinstance(profile.get("conditions"), list) else profile.get("conditions", ""),
        "interventions": ", ".join(profile.get("interventions", [])) if isinstance(profile.get("interventions"), list) else profile.get("interventions", ""),
        "roles": ", ".join(profile.get("roles", [])) if isinstance(profile.get("roles"), list) else profile.get("roles", ""),
        "trialInvolvement": profile.get("trial_involvement", "None"),
        "leadershipRoles": ", ".join(profile.get("leadership_roles", [])) if isinstance(profile.get("leadership_roles"), list) else profile.get("leadership_roles", ""),
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

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Healthcare AI System - HCP Profiling API",
        "version": "2.0.0",
        "status": "running",
        "backend": "updated_team_backend.py"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "backend": "FastAPI with updated_team_backend.py",
        "python_version": sys.version,
        "available_agents": ["NPIAgent", "PubMedAgentWithImpact", "ClinicalTrialsAgent"],
        "azure_openai_configured": "AZURE_API_KEY" in os.environ
    }

@app.post("/api/process-npis")
async def process_npis_endpoint(npis: List[str]):
    """
    Process a list of NPIs and return comprehensive profiles.
    This endpoint uses the updated_team_backend.py script.
    """
    try:
        if not npis or len(npis) == 0:
            raise HTTPException(status_code=400, detail="No NPIs provided")
        
        # Validate NPIs (should be 10-digit numbers)
        for npi in npis:
            if not npi.isdigit() or len(npi) != 10:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid NPI format: {npi}. NPIs must be 10-digit numbers."
                )
        
        # Process NPIs using our updated_team_backend functionality
        profiles = process_npis_to_data(npis)
        
        return {
            "profiles": profiles,
            "count": len(profiles),
            "status": "success"
        }
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error processing NPIs: {str(e)}")
        
        # Return empty profiles instead of error to maintain UI consistency
        return {
            "profiles": [],
            "count": 0,
            "status": "error",
            "message": "Processing failed, returning empty profiles"
        }

@app.post("/api/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a CSV/Excel file and extract NPIs.
    This provides an alternative to the frontend file processing.
    """
    try:
        # Check file type
        if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload CSV or Excel files."
            )
        
        # Read file content
        content = await file.read()
        
        # Parse based on file type
        if file.filename.lower().endswith('.csv'):
            # Try different encodings and handle quoted CSV files
            try:
                df = pd.read_csv(io.BytesIO(content), quotechar='"')
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(content), encoding='latin-1', quotechar='"')
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        # Extract NPIs from the dataframe
        npis = []
        
        # First, try to find NPIs in columns with 'npi' in the name (case insensitive)
        print(f"All columns in CSV: {list(df.columns)}")
        for column in df.columns:
            print(f"Checking column: '{column}' (lowercase: '{column.lower()}')")
            if 'npi' in column.lower():
                print(f"Found NPI column: {column}")
                print(f"Column values: {df[column].tolist()}")
                for value in df[column].dropna():
                    value_str = str(value).strip()
                    print(f"Processing value: '{value_str}' (type: {type(value)})")
                    # Check if it's a 10-digit number
                    if value_str.isdigit() and len(value_str) == 10:
                        npis.append(value_str)
                        print(f"Found NPI: {value_str}")
                    else:
                        print(f"Value '{value_str}' is not a valid NPI (length: {len(value_str)}, isdigit: {value_str.isdigit()})")
        
        # If no NPIs found in NPI columns, check all columns for 10-digit numbers
        if not npis:
            print("No NPIs found in NPI columns, checking all columns...")
            for column in df.columns:
                print(f"Checking column: {column}")
                for value in df[column].dropna():
                    value_str = str(value).strip()
                    if value_str.isdigit() and len(value_str) == 10:
                        npis.append(value_str)
                        print(f"Found NPI in {column}: {value_str}")
        
        print(f"Total NPIs found: {len(npis)}")
        print(f"NPIs: {npis}")
        
        # Remove duplicates
        npis = list(set(npis))
        
        if not npis:
            raise HTTPException(
                status_code=400, 
                detail="No valid NPIs found in the uploaded file."
            )
        
        return {
            "npis": npis,
            "count": len(npis),
            "filename": file.filename,
            "status": "success"
        }
        
    except Exception as e:
        print(f"Error processing uploaded file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/api/test-npi/{npi}")
async def test_single_npi(npi: str):
    """
    Test processing for a single NPI.
    Useful for debugging and testing.
    """
    try:
        if not npi.isdigit() or len(npi) != 10:
            raise HTTPException(
                status_code=400, 
                detail="Invalid NPI format. NPIs must be 10-digit numbers."
            )
        
        # Process single NPI
        profiles = process_npis_to_data([npi])
        
        if profiles:
            return {
                "npi": npi,
                "profile": profiles[0],
                "status": "success"
            }
        else:
            return {
                "npi": npi,
                "profile": None,
                "status": "no_data_found"
            }
            
    except Exception as e:
        print(f"Error testing NPI {npi}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing NPI: {str(e)}")

@app.get("/api/agents/status")
async def get_agents_status():
    """
    Check the status of all agents and their dependencies.
    """
    try:
        # Test each agent
        agents_status = {}
        
        # Test NPIAgent
        try:
            npi_agent = NPIAgent()
            agents_status["NPIAgent"] = "available"
        except Exception as e:
            agents_status["NPIAgent"] = f"error: {str(e)}"
        
        # Test PubMedAgentWithImpact
        try:
            pubmed_agent = PubMedAgentWithImpact()
            agents_status["PubMedAgentWithImpact"] = "available"
        except Exception as e:
            agents_status["PubMedAgentWithImpact"] = f"error: {str(e)}"
        
        # Test ClinicalTrialsAgent
        try:
            trials_agent = ClinicalTrialsAgent()
            agents_status["ClinicalTrialsAgent"] = "available"
        except Exception as e:
            agents_status["ClinicalTrialsAgent"] = f"error: {str(e)}"
        
        return {
            "agents": agents_status,
            "python_version": sys.version,
            "azure_openai_available": "AZURE_API_KEY" in os.environ,
            "status": "success"
        }
        
    except Exception as e:
        return {
            "agents": {},
            "error": str(e),
            "status": "error"
        }

if __name__ == "__main__":
    print("🚀 Starting Healthcare AI System - FastAPI Backend")
    print("📍 Backend will be available at: http://localhost:8001")
    print("📚 API Documentation: http://localhost:8001/docs")
    print("🔍 Health Check: http://localhost:8001/health")
    print("🔧 Using updated_team_backend.py with Azure OpenAI")
    print("=" * 60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
