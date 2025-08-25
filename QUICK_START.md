# 🚀 Quick Start Guide

Get the Healthcare AI System running in 5 minutes!

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install gender-guesser
cd ..
```

### 2. Start the Application

```bash
npm run dev
```

### 3. Open Browser

Navigate to: http://localhost:3000 (or 3001 if 3000 is busy)

## 📁 Test with Sample Data

Create a test file `test.csv`:

```csv
NPI
1255412813
1740895150
```

## 🎯 Quick Usage

1. **Upload File**: Drag & drop your CSV file
2. **Start Analysis**: Click "Start AI Analysis"
3. **View Results**: See comprehensive HCP profiles
4. **Export Data**: Click "Export Profiles" for CSV download

## 🔧 Optional: Add OpenAI API Key

For enhanced AI analysis, create `.env` file:

```bash
OPENAI_API_KEY=your_key_here
```

## ✅ That's It!

The system works with or without an API key - it will use fallback data if needed.

---

**Need more details?** See the full [README.md](README.md)
