# 🚀 HCP Profiling System - Quick Start Guide

## ✅ **System Status: FULLY OPERATIONAL**

The enhanced multi-agent system is now running with Azure OpenAI integration!

## 🎯 **What's Working:**

- ✅ **Azure OpenAI Integration**: Using your Azure endpoint
- ✅ **Enhanced Agents**: Comprehensive data extraction from multiple sources
- ✅ **Complete Data Structure**: All 15 required fields populated
- ✅ **Frontend Integration**: Ready to display enhanced data
- ✅ **Backend Server**: Running on port 8001

## 🚀 **Quick Start:**

### **1. Start the Backend Server**
```bash
cd backend
source .venv/bin/activate
python start_server.py
```

### **2. Start the Frontend**
```bash
# In a new terminal, from the project root
npm run dev
```

### **3. Use the System**
1. Open http://localhost:3000
2. Upload a CSV/Excel file with NPI IDs
3. Click "Start Processing" to run the enhanced agents
4. View comprehensive profiles with all data fields

## 🎯 **Enhanced Features:**

### **Comprehensive Data Extraction:**
- **NPI Registry**: Basic provider information
- **PubMed**: Academic publications search
- **Web Search**: Social media and online presence
- **AI Analysis**: Intelligent data synthesis using Azure OpenAI

### **Complete Data Structure:**
```json
{
  "npi": "1740895150",
  "fullName": "CHANTELLE AABEDI",
  "specialty": "Dentist",
  "affiliation": "Hospital Name",
  "location": "LOS ANGELES, CA",
  "degrees": "DDS, MD",
  "socialMediaHandles": {
    "twitter": "@drchantelle",
    "linkedin": "https://linkedin.com/in/chantelle"
  },
  "followers": {
    "twitter": "5000",
    "linkedin": "2000"
  },
  "topInterests": ["Dental Surgery", "Cosmetic Dentistry"],
  "recentActivity": "Published research on dental implants",
  "publications": 15,
  "engagementStyle": "Research-focused",
  "confidence": 85,
  "summary": "Professional summary...",
  "pubmed": {...},
  "web": [...]
}
```

## 🔧 **Configuration:**

### **Azure OpenAI Setup:**
- ✅ **API Key**: Configured
- ✅ **Endpoint**: https://axtria-institute-training.openai.azure.com/
- ✅ **Model**: gpt-4o-mini
- ✅ **API Version**: 2024-12-01-preview

### **Environment Variables:**
```bash
OPENAI_API_KEY=your-key
OPENAI_API_BASE=https://axtria-institute-training.openai.azure.com/
OPENAI_API_VERSION=2024-12-01-preview
OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
```

## 📊 **API Endpoints:**

- **Health Check**: `GET /health`
- **File Upload**: `POST /ingest`
- **Standard Profiling**: `POST /profile`
- **Enhanced Agents**: `POST /profile/agents` ⭐ **RECOMMENDED**
- **Email Dispatch**: `POST /email/dispatch`

## 🎉 **Ready to Use!**

The system is now fully operational with:
- 🤖 **AI-Powered Analysis**: Using Azure OpenAI
- 📊 **Comprehensive Data**: All 15 fields populated
- ⚡ **Fast Performance**: Optimized timeouts and token usage
- 🔄 **Auto-Reload**: Development-friendly with hot reloading

**Start using it now!** 🚀
