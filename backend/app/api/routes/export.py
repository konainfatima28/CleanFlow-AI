# backend/app/api/routes/export.py
# Download endpoints for CSV, XLSX, JSON, Pandas script, Markdown report.

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
# import numpy as np  # Imported for NaN/Inf sanitation
# import json  # Added for native JSON serialization fallbacks

from app.core.session import get
from app.services.exporter import (
    to_csv,
    to_xlsx,
    to_json,
    to_pandas_script,
    to_markdown_report,
)
from app.services.profiler import profile_dataframe

router = APIRouter()


# ─── Simple file download ─────────────────────────────────────────────────────

@router.get("/{session_id}")
def export_dataset(
    session_id: str,
    format: str = Query("csv", pattern="^(csv|xlsx|json)$")
):
    df = get(session_id)
    if df is None:
        raise HTTPException(404, "Session not found or expired.")

    if format == "csv":
        content      = to_csv(df)
        media_type   = "text/csv"
        filename     = f"cleanflow_export_{session_id[:8]}.csv"
    elif format == "xlsx":
        content      = to_xlsx(df)
        media_type   = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename     = f"cleanflow_export_{session_id[:8]}.xlsx"
    elif format == "json":
        content = to_json(df)
        media_type = "application/json"
        filename = f"cleanflow_export_{session_id[:8]}.json"
    else:
        raise HTTPException(400, "Unsupported format.")

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─── Pandas script ────────────────────────────────────────────────────────────

class ScriptRequest(BaseModel):
    original_filename: str = "dataset.csv"
    operations: list[dict] = []


@router.post("/script/{session_id}")
def export_script(session_id: str, body: ScriptRequest):
    df = get(session_id)
    if df is None:
        raise HTTPException(404, "Session not found or expired.")

    content  = to_pandas_script(
        original_filename=body.original_filename,
        operations=body.operations,
        cleaned_shape=df.shape,
    )
    filename = f"cleanflow_script_{session_id[:8]}.py"

    return Response(
        content=content,
        media_type="text/x-python",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─── Markdown report ──────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    original_session_id: str
    original_filename: str = "dataset.csv"
    log: list[dict] = []
    operations: list[dict] = []


@router.post("/report/{cleaned_session_id}")
def export_report(cleaned_session_id: str, body: ReportRequest):
    original_df = get(body.original_session_id)
    cleaned_df  = get(cleaned_session_id)

    if original_df is None or cleaned_df is None:
        raise HTTPException(404, "One or both sessions not found.")

    original_profile = profile_dataframe(original_df)
    cleaned_profile  = profile_dataframe(cleaned_df)

    content  = to_markdown_report(
        original_filename=body.original_filename,
        original_profile=original_profile,
        cleaned_profile=cleaned_profile,
        log=body.log,
        operations=body.operations,
    )
    filename = f"cleanflow_report_{cleaned_session_id[:8]}.md"

    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
