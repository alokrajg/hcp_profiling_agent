# HCP Profiling Backend (FastAPI)

This Python backend powers the HCP profiling workflow used by the Next.js frontend. It ingests CSV/Excel of NPI IDs, gathers public data, synthesizes structured profiles, and can dispatch emails.

## Endpoints

- `GET /health` — health check
- `POST /ingest` — upload CSV/XLSX file with a column `npi` or `npi_id`. Returns parsed list of NPI strings.
- `POST /profile` — body `{ npi_list: string[], max_results_per_source?: number }` → returns array of `HCPProfile`.
- `POST /email/dispatch` — send HTML email `{ to: string[], subject: string, html: string }`.

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# export environment variables (see .env.example)
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Configure env

Create `.env` and set:

```
OPENAI_API_KEY= # optional for future LLM summarization
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
EMAIL_FROM=
```

## Notes

- Uses NPI Registry, PubMed E-utilities, and DuckDuckGo search to infer profile fields.
- The agent currently uses heuristics to extract social links/handles. You can extend with more scrapers or APIs.
- Keep the frontend UI unchanged; wire the frontend to call this backend for real data.
