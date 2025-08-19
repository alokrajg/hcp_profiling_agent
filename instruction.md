# HCP Profiling Agent — Run Guide

This project includes a Next.js frontend and a Python FastAPI backend that ingests CSV/XLSX of NPI IDs, gathers public data, and renders structured HCP profiles.

## 0) Requirements

- Node.js ≥ 18 and npm
- Python ≥ 3.11
- Git

## 1) Clone

```bash
git clone https://github.com/alokrajg/hcp_profiling_agent.git
cd hcp_profiling_agent
```

## 2) Backend (FastAPI)

From `backend/`:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

# (optional) Email dispatch
# export SMTP_HOST=...
# export SMTP_PORT=587
# export SMTP_USERNAME=...
# export SMTP_PASSWORD=...
# export EMAIL_FROM=...

uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Health check:

```bash
curl http://127.0.0.1:8001/health
```

### Backend endpoints

- GET /health – health check
- POST /ingest – form-data with `file` (CSV/XLSX) → `["<npi>", ...]`
- POST /profile – `{ "npi_list": ["<10-digit-npi>", ...] }` → array of profiles
- POST /email/dispatch – `{ to: string[], subject: string, html: string }`

CSV/XLSX must contain a column `npi` or `npi_id` with valid 10-digit NPI numbers.

## 3) Frontend (Next.js)

From repo root:

```bash
npm install
# Where the Python backend is reachable (default below)
echo 'BACKEND_URL=http://127.0.0.1:8001' > .env.local

npm run dev   # http://localhost:3000
```

The frontend calls its own Next.js API proxy (`/api/ingest`, `/api/profile`, `/api/email/dispatch`) which forwards to the FastAPI backend defined by `BACKEND_URL`.

## 4) Production (optional)

- Backend: run with a service/PM (`uvicorn app.main:app --host 0.0.0.0 --port 8001`).
- Frontend:

```bash
npm run build
npm run start   # serves on port 3000
```

## 5) Troubleshooting

- "Failed to fetch" when uploading CSV: ensure FastAPI is running and `BACKEND_URL` points to it.
- 400 on ingest: ensure your file has `npi` or `npi_id` column with valid 10-digit NPIs (no dots/spaces). The backend normalizes, but invalid IDs will be dropped.
- 500 on profile: retry with known-good NPIs (e.g., fetch a few via the NPI Registry API with state+city filters). The app includes guards for sparse registry responses.
- Can’t see all columns: the results table supports horizontal scrolling; use the bottom scrollbar.

## 6) Folder map

- `backend/` – FastAPI app (`app/main.py`, `app/services/`, `app/models.py`)
- `app/` – Next.js app routes and pages
- `lib/utils.ts` – frontend API helpers
- `components/ui/` – shared UI components, including scroll area with horizontal scrollbar

---

If you need help running on another host (separate backend/frontends), set `BACKEND_URL` on the frontend machine to the backend’s URL (e.g., `http://<backend-host>:8001`).
