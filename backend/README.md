# HCP Profiling Backend

A FastAPI backend for automated Healthcare Professional (HCP) profiling using AI agents and multi-source data collection.

## Features

- **File Ingestion**: Accept CSV/Excel files containing NPI IDs
- **Multi-Agent Profiling**: AI-powered data collection from multiple sources
- **Data Sources**: NPI Registry, PubMed, Web Search (DuckDuckGo)
- **Email Dispatch**: Send generated reports to stakeholders
- **LangGraph Integration**: Optional multi-agent orchestration with fallback

## Setup

1. **Create virtual environment**:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Optional: Install LangGraph for advanced agent orchestration**:

   ```bash
   pip install langgraph
   ```

4. **Set environment variables** (optional):

   ```bash
   export OPENAI_API_KEY="your-openai-key"  # For LLM-powered summarization
   ```

5. **Run the server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

## API Endpoints

### 1. Health Check

```bash
GET /health
```

### 2. File Ingestion

```bash
POST /ingest
Content-Type: multipart/form-data

# Upload CSV/Excel file with NPI column
curl -X POST http://localhost:8001/ingest \
  -F "file=@npis.csv"
```

### 3. Standard Profiling

```bash
POST /profile
Content-Type: application/json

{
  "npi_list": ["1234567890", "1982745678"],
  "max_results_per_source": 5
}
```

### 4. Multi-Agent Profiling (Recommended)

```bash
POST /profile/agents
Content-Type: application/json

{
  "npi_list": ["1234567890", "1982745678"],
  "max_results_per_source": 5
}
```

**Features of Multi-Agent Pipeline**:

- **NPI Lookup Agent**: Fetches basic provider information
- **PubMed Research Agent**: Searches for publications and research
- **Web Crawling Agent**: Finds social media profiles and online presence
- **Synthesis Agent**: Summarizes and structures the collected data

### 5. Email Dispatch

```bash
POST /email/dispatch
Content-Type: application/json

{
  "to": ["recipient@example.com"],
  "subject": "HCP Profile Report",
  "html": "<h1>Report</h1><p>Content...</p>"
}
```

## Agent Architecture

The system uses a multi-agent approach with the following components:

### Agent Tools

- **NPI Lookup**: Queries the NPI Registry API
- **PubMed Search**: Searches for academic publications
- **Web Search**: Performs general web searches using DuckDuckGo
- **Text Synthesis**: Summarizes collected information

### Orchestration

- **LangGraph** (if installed): Multi-step workflow with state management
- **Fallback**: Sequential processing if LangGraph unavailable

### Data Flow

1. **Ingestion**: Parse NPI IDs from uploaded files
2. **Collection**: Each agent collects data from their respective sources
3. **Synthesis**: Combine and summarize collected information
4. **Output**: Return structured profiles with comprehensive data

## Example Response

```json
{
  "npi": "1234567890",
  "fullName": "Dr. John Smith",
  "specialty": "Cardiology",
  "location": "New York, NY",
  "affiliation": "Mount Sinai Hospital",
  "pubmed": {
    "esearchresult": {
      "count": "15",
      "idlist": ["12345678", "87654321"]
    }
  },
  "web": [
    {
      "title": "Dr. John Smith - LinkedIn",
      "href": "https://linkedin.com/in/johnsmith",
      "body": "Cardiologist at Mount Sinai..."
    }
  ],
  "summary": "Dr. John Smith is a Cardiology specialist based in New York, NY. Affiliation: Mount Sinai Hospital."
}
```

## Error Handling

- **Invalid NPIs**: Automatically filtered out during ingestion
- **API Failures**: Retry logic with exponential backoff
- **Missing Data**: Graceful handling of sparse responses
- **Network Issues**: Timeout and connection error handling

## Development

### Adding New Agents

1. Create new tool in `AgentTools` class
2. Add agent step in LangGraph workflow
3. Update state management for new data types

### Customizing Data Sources

- Modify API endpoints in `AgentTools`
- Add new search strategies
- Implement custom data parsers

## Troubleshooting

1. **LangGraph Import Error**: Install with `pip install langgraph`
2. **API Rate Limits**: Implemented retry logic with exponential backoff
3. **CORS Issues**: Configured for all origins in development
4. **File Upload Errors**: Check file format and column names

## License

MIT License - see LICENSE file for details.
