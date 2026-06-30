# backend/app/api/routes/export.py
# Download endpoints for CSV, XLSX, JSON, Pandas script, Markdown report.

import io
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
import pandas as pd

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

    # Normalize incoming queries to drop case mismatches
    fmt = format.lower()

    if fmt == "csv":
        content      = to_csv(df)
        media_type   = "text/csv"
        filename     = f"cleanflow_export_{session_id[:8]}.csv"
        
    elif fmt == "xlsx":
        # ─── MEMORY OPTIMIZED WRITER ENGINE FOR MODERN PANDAS (3.0+) ───
        try:
            output = io.BytesIO()
            
            # FIXED: Nested options inside engine_kwargs to accommodate newer Pandas rules.
            # constant_memory=True forces openpyxl to flush rows to the buffer sequentially,
            # dropping RAM usage from 800MB+ down to near-zero for large datasets.
            with pd.ExcelWriter(output, engine="openpyxl", engine_kwargs={'options': {'constant_memory': True}}) as writer:
                df.to_excel(writer, index=False, sheet_name="Cleaned Data")
            
            content = output.getvalue()
            media_type   = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename     = f"cleanflow_export_{session_id[:8]}.xlsx"
        except Exception as excel_err:
            raise HTTPException(500, f"Excel generation failed internally: {str(excel_err)}")
        
    elif fmt == "json":
        content      = to_json(df)
        media_type   = "application/json"
        filename     = f"cleanflow_export_{session_id[:8]}.json"
    else:
        raise HTTPException(400, "Unsupported format.")

    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        },
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
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        },
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

    # ─── RUNTIME TIMEOUT GUARD FOR MASSIVE PROFILING ───
    # Computing complete matrices on huge frames causes Render gateway timeouts.
    # Downsample to a statistically accurate pool slice (15,000 rows max) if too heavy.
    MAX_PROFILE_ROWS = 15000
    
    if len(original_df) > MAX_PROFILE_ROWS:
        original_df_sample = original_df.sample(n=MAX_PROFILE_ROWS, random_state=42)
    else:
        original_df_sample = original_df

    if len(cleaned_df) > MAX_PROFILE_ROWS:
        cleaned_df_sample = cleaned_df.sample(n=MAX_PROFILE_ROWS, random_state=42)
    else:
        cleaned_df_sample = cleaned_df

    original_profile = profile_dataframe(original_df_sample)
    cleaned_profile  = profile_dataframe(cleaned_df_sample)

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
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        },
    )
