import uuid
import os
import io

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.core.session import save

router = APIRouter()

ALLOWED = {".csv", ".xlsx"}


@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is missing")

    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in ALLOWED:
        raise HTTPException(
            status_code=400,
            detail="Only CSV and XLSX supported",
        )

    MAX_SIZE = 25 * 1024 * 1024  # 25 MB

    contents = await file.read()
    
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum supported size is 25 MB. Please upload a CSV or a smaller Excel file.",
        )

    try:
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse file: {e}",
        )

    session_id = str(uuid.uuid4())
    save(session_id, df)

    return {
        "session_id": session_id,
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
    }
