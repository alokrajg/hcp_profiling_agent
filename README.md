Goal: Automate the profiling of Healthcare Professionals (HCPs) and streamline stakeholder communication through Al-powered data extraction, summarization, and reporting.
Functionality: Takes a list of HCPs and autonomously collects professional data from publicly available online platforms (e.g., Linkedin, Facebook, directories).
Compiles structured profiles summarizing roles, affiliations, education, and social presence. Delivers personalized reports to stakeholders via email to support outreach, partnerships, and compliance tracking.
Agentic Actions: HCP name ingestion → Online data crawling → Profile summarization → Structured document generation → Email dispatch to stakeholders.

HCPs Profiling Info Field:
Full Name
Specialty
Affiliation
Location
Degrees
Social Media Handles
Followers (Twitter/ Linkedin)
Top Interests
Recent Activity
Publications
Engagement Style

Here is an example info:
Dr. Jane Smith
Dermatology
Mount Sinai Hospital
New York, NY
MD, PhD
@drjanesmith (Twitter),
Linkedin URL
12.5K / 3.2K
Psoriasis treatment, Al in derm
Speaker at AAD 2025
25+ on PubMed
Educational, peer-engaging

HCP Profiling Agent — AI-powered HCP profiling from NPI list (Next.js + FastAPI, no database)

Constraints:

✅ No database. Persist only to local JSON/CSV/PDF files under /backend/storage and /backend/outputs.

✅ Use LangChain with OpenAI as the LLM and built-in web tools for searching/scraping.

✅ Mirror the UI/flow in the screenshots (upload → processing pipeline → profiles → export/email).

✅ Only collect info from publicly available web pages. Respect robots.txt and site ToS. Do not bypass paywalls or login walls.

✅ Single-user MVP (no auth). Polling for status (no websockets).

🎯 Goal

Upload a CSV/XLSX of NPI IDs → the backend agent autonomously:

fetches base HCP info from public sources (NPI registry + directories),

searches/crawls public web for social + publications (LinkedIn public pages, PubMed, Google Scholar, Hospital pages, X/Twitter public pages),

compiles a structured profile per HCP,

generates stakeholder-ready PDFs and allows Export Profiles (CSV) and Email Dispatch.

🧰 Tech Stack

Frontend: Next.js (App Router, TypeScript), TailwindCSS, shadcn/ui, Framer Motion

Backend: FastAPI (Python 3.11)

AI/Agents: LangChain (ChatOpenAI), Tools:

DuckDuckGoSearchRun (no key) or TavilySearchAPIWrapper (optional TAVILY_API_KEY)

RequestsGetTool / RequestsWrapper + BeautifulSoup4 for HTML extraction

AsyncHtmlLoader / WebBaseLoader (where simple pages suffice)

PubMed via NCBI E-utilities (no key required)

Files, not DB: JSON/CSV/PDF written to /backend/storage and /backend/outputs

Email: Python smtplib (or SMTP_URL)

Excel/CSV: pandas, openpyxl, xlrd

PDF: reportlab or weasyprint (HTML→PDF)

cd /Users/alokrajgupta/Downloads/healthcare-ai-system/backend && python3 -m venv .venv && source .venv/bin/activate && python -m pip install --upgrade pip >/dev/null 2>&1 && python -m pip install -r requirements.txt | cat

cd /Users/alokrajgupta/Downloads/healthcare-ai-system/backend && source .venv/bin/activate && python -m pip install -r requirements.txt | cat

d /Users/alokrajgupta/Downloads/healthcare-ai-system/backend && source .venv/bin/activate && pkill -f "uvicorn app.main:app" || true && uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload | cat
