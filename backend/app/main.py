import io
import os
import re
from typing import List, Optional

import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .models import HCPProfile, BatchProfileRequest, EmailDispatchRequest
from .services.profile_agent import ProfileAgent
from .services.emailer import Emailer

app = FastAPI(title="HCP Profiling Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = ProfileAgent()
emailer = Emailer()


def _normalize_npi(raw: str) -> Optional[str]:
	if raw is None:
		return None
	# Keep only digits
	digits = re.sub(r"\D", "", str(raw))
	# If longer than 10, take the last 10 (Excel/scanner artifacts)
	if len(digits) > 10:
		digits = digits[-10:]
	# Left pad if between 8-9 digits (Excel trimming leading zeros)
	if 8 <= len(digits) < 10:
		digits = digits.zfill(10)
	# Validate final length
	return digits if len(digits) == 10 else None


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.post("/ingest")
async def ingest_hcps(file: UploadFile = File(...)) -> List[str]:
    contents = await file.read()
    try:
        if file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents), dtype=str)
        elif file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents), dtype=str)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {exc}") from exc

    lowered = {c.lower(): c for c in df.columns}
    if "npi" not in lowered and "npi_id" not in lowered:
        raise HTTPException(status_code=400, detail="Missing required column 'npi' or 'npi_id'")

    npi_column = lowered.get("npi") or lowered.get("npi_id")

    raw_values = df[npi_column].dropna().astype(str).tolist()
    normalized: List[str] = []
    for raw in raw_values:
        npi = _normalize_npi(raw)
        if npi:
            normalized.append(npi)

    if not normalized:
        raise HTTPException(status_code=400, detail="No valid 10-digit NPIs found")

    # De-duplicate preserving order
    seen = set()
    unique = []
    for n in normalized:
        if n not in seen:
            unique.append(n)
            seen.add(n)
    return unique


@app.post("/profile", response_model=List[HCPProfile])
async def profile_batch(request: BatchProfileRequest) -> List[HCPProfile]:
    if not request.npi_list:
        raise HTTPException(status_code=400, detail="npi_list cannot be empty")
    profiles = await agent.generate_profiles(request.npi_list, request.max_results_per_source)
    return profiles


@app.post("/email/dispatch")
async def dispatch_email(req: EmailDispatchRequest) -> JSONResponse:
    if not req.to or not req.subject or not req.html:
        raise HTTPException(status_code=400, detail="Missing required fields: to, subject, html")
    emailer.send_email(to=req.to, subject=req.subject, html=req.html)
    return JSONResponse({"status": "sent"})
