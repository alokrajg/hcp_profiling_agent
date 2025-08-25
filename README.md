# Healthcare AI System - HCP Profiling Agent

A comprehensive AI-powered healthcare professional (HCP) profiling system that analyzes and generates detailed profiles using multiple data sources including NPI Registry, PubMed, and Clinical Trials.

## 🚀 Features

### Core Functionality

- **AI-Powered HCP Analysis**: Comprehensive profiling using OpenAI API
- **Multi-Source Data Integration**: NPI Registry, PubMed, Clinical Trials.gov
- **Real-time Processing**: Live data extraction and analysis
- **Advanced UI**: Modern, responsive interface with detailed profile display
- **CSV Export**: Complete data export with all profile fields
- **Search & Filter**: Advanced search and sorting capabilities

### Data Sources

- **NPI Registry**: Basic professional information, credentials, location
- **PubMed**: Publication history, research impact, journal classifications
- **Clinical Trials**: Trial participation, leadership roles, conditions studied
- **AI Analysis**: Research prestige scoring, influential publications

### Profile Fields

- **Basic Info**: Name, specialty, affiliation, location, degrees, gender
- **Research Profile**: Publications, research score, publication years, top journals
- **Clinical Trials**: Total/active/completed trials, involvement level, leadership roles
- **Impact Analysis**: Research prestige score, influential publications, impact summary
- **Additional Data**: Conditions studied, interventions, roles, social media

## 📋 Prerequisites

### System Requirements

- **Node.js**: Version 18 or higher
- **Python**: Version 3.8 or higher
- **npm**: Latest version
- **Git**: For cloning the repository

### API Keys

- **OpenAI API Key**: For AI-powered analysis (optional - system works with fallback data)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd healthcare-ai-system
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up Python Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Install Additional Python Dependencies

```bash
pip install gender-guesser
```

### 5. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Optional: OpenAI API Key for enhanced analysis
OPENAI_API_KEY=your_openai_api_key_here
```

## 🚀 Running the Application

### 1. Start the Development Server

```bash
npm run dev
```

The application will be available at:

- **Local**: http://localhost:3000
- **Network**: http://localhost:3001 (if port 3000 is in use)

### 2. Access the Application

Open your browser and navigate to the local URL shown in the terminal.

## 📖 Usage Guide

### 1. Upload HCP Data

- **Drag & Drop**: Upload CSV/Excel files containing NPI numbers
- **File Format**: Files should contain a column with 10-digit NPI numbers
- **Supported Formats**: `.csv`, `.xlsx`, `.xls`

### 2. Process HCPs

- **Queue Management**: Review uploaded NPIs in the HCP Queue
- **Start Analysis**: Click "Start AI Analysis" to begin processing
- **Real-time Progress**: Monitor processing through the AI Agent Pipeline

### 3. View Results

- **Comprehensive Profiles**: View detailed HCP profiles with all data fields
- **Expandable Rows**: Click on any row to see additional details
- **Search & Filter**: Use the search bar to find specific HCPs
- **Sort Data**: Click column headers to sort by different criteria

### 4. Export Data

- **CSV Export**: Click "Export Profiles" to download complete data
- **All Fields Included**: Export contains all profile information
- **Formatted Data**: Clean, structured CSV format

## 🏗️ Project Structure

```
healthcare-ai-system/
├── app/
│   ├── api/
│   │   └── process-npis/
│   │       └── route.ts          # API endpoint for processing NPIs
│   ├── components/
│   │   └── ui/                   # UI components
│   └── page.tsx                  # Main application page
├── backend/
│   ├── backend_data.py           # Core data processing script
│   ├── requirements.txt          # Python dependencies
│   └── .venv/                    # Python virtual environment
├── lib/
│   └── utils.ts                  # Utility functions
├── public/                       # Static assets
├── package.json                  # Node.js dependencies
└── README.md                     # This file
```

## 🔧 Backend Architecture

### Core Components

- **NPIAgent**: Extracts basic professional information from NPI Registry
- **PubMedAgentWithImpact**: Analyzes publication history and research impact
- **ClinicalTrialsAgent**: Processes clinical trial participation data
- **AI Integration**: OpenAI API for enhanced analysis and scoring

### Data Processing Flow

1. **NPI Input**: Receive list of NPI numbers
2. **Registry Lookup**: Extract basic professional data
3. **Publication Analysis**: Search PubMed for research history
4. **Trial Analysis**: Check ClinicalTrials.gov for trial participation
5. **AI Enhancement**: Generate research scores and impact analysis
6. **Data Integration**: Combine all sources into comprehensive profiles

## 🎨 UI Features

### Main Sections

1. **HCP Queue**: Upload and manage NPI lists
2. **AI Agent Processing Pipeline**: Real-time processing status
3. **Comprehensive HCP Profiles**: Detailed results table

### Table Columns (30 total)

- Basic Information (Name, Specialty, Affiliation, Location, Degrees)
- Social Media & Followers
- Research Data (Publications, Research Score, Journals, Titles)
- Clinical Trials (Counts, Involvement, Leadership, Conditions)
- Additional Details (Gender, Impact Summary, Roles)

### Interactive Features

- **Expandable Rows**: Detailed view of each profile
- **Search Functionality**: Find HCPs by name, specialty, or affiliation
- **Sorting**: Sort by any column
- **Responsive Design**: Works on desktop and mobile devices

## 🔍 API Endpoints

### POST `/api/process-npis`

Processes a list of NPIs and returns comprehensive profiles.

**Request:**

```bash
curl -X POST http://localhost:3001/api/process-npis \
  -F "npis=[\"1255412813\",\"1740895150\"]"
```

**Response:**

```json
{
  "profiles": [
    {
      "npi": "1255412813",
      "fullName": "PETER A",
      "specialty": "Licensed Psychiatric Technician",
      "publications": 20,
      "researchPrestigeScore": 85,
      "publicationYears": "2025–2025",
      "trialInvolvement": "None"
      // ... additional fields
    }
  ]
}
```

## 🛡️ Error Handling

### Fallback Mechanisms

- **API Failures**: System continues with dummy data
- **Missing API Keys**: Uses basic data extraction
- **Network Issues**: Graceful degradation with cached data
- **File Upload Errors**: Clear error messages and retry options

### Data Validation

- **NPI Format**: Validates 10-digit NPI numbers
- **File Types**: Supports common spreadsheet formats
- **Data Completeness**: Ensures all required fields are present

## 🔧 Configuration

### Environment Variables

```bash
# Required for enhanced AI analysis
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Custom API endpoints
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Python Configuration

The backend script automatically handles:

- **API Key Management**: Secure environment variable usage
- **Rate Limiting**: Respects API rate limits
- **Error Recovery**: Automatic retry mechanisms
- **Data Validation**: Ensures data quality and completeness

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Common Issues

**1. Python Dependencies Not Found**

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

**2. API Key Issues**

- Ensure `.env` file exists in root directory
- Verify API key format and permissions
- Check OpenAI account status

**3. Port Already in Use**

- Application automatically uses next available port
- Check terminal output for correct URL

**4. File Upload Issues**

- Ensure file contains valid NPI numbers
- Check file format (CSV, Excel)
- Verify file size (max 10MB)

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=true npm run dev
```

## 📊 Data Sources

### NPI Registry

- **URL**: https://npiregistry.cms.hhs.gov/
- **Data**: Professional information, credentials, practice locations
- **Rate Limit**: None (public API)

### PubMed

- **URL**: https://eutils.ncbi.nlm.nih.gov/
- **Data**: Publication history, research impact
- **Rate Limit**: 10 requests per second

### ClinicalTrials.gov

- **URL**: https://clinicaltrials.gov/
- **Data**: Trial participation, leadership roles
- **Rate Limit**: None (public API)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Updates

### Recent Updates

- ✅ Integrated `backend_data.py` script as primary backend
- ✅ Added comprehensive profile fields (30 columns)
- ✅ Enhanced UI with expandable rows and detailed views
- ✅ Improved CSV export with all data fields
- ✅ Added robust error handling and fallback mechanisms
- ✅ Updated file upload to handle multiple formats
- ✅ Enhanced search and sorting capabilities

### Version History

- **v2.0**: Complete backend integration with `backend_data.py`
- **v1.0**: Initial release with basic functionality

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the API documentation
3. Create an issue in the repository
4. Contact the development team

---

**Happy HCP Profiling! 🏥✨**
