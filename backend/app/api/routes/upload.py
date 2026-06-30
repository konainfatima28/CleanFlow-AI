import uuid
import os
import io
import time

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.core.session import save

router = APIRouter()

ALLOWED = {".csv", ".xlsx"}


@router.post("")
def upload_file(file: UploadFile = File(...)):
    start = time.perf_counter()
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is missing")

    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in ALLOWED:
        raise HTTPException(
            status_code=400,
            detail="Only CSV and XLSX supported",
        )

    # Maximum upload size validation (50 MB)
    MAX_SIZE = 50 * 1024 * 1024  # 50 MB
    
    read_start = time.perf_counter()

    # ─── RAM OPTIMIZED CHUNK READ ─────────────────────────────────────────────
    # Instead of reading everything at once, we pool data stream allocations
    chunks = []
    bytes_read = 0
    
    while True:
        chunk = file.file.read(1024 * 1024)  # Read in highly efficient 1MB chunks natively
        if not chunk:
            break
        bytes_read += len(chunk)
        if bytes_read > MAX_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File too large. Maximum supported size is 50 MB.",
            )
        chunks.append(chunk)

    contents = b"".join(chunks)
    print(f"📥 Reading uploaded file took {time.perf_counter() - read_start:.2f} sec")

    try:
        parse_start = time.perf_counter()

        if ext == ".csv":
            # FIXED: Removed memory_map=True to stop file-descriptor (fileno) pointer crashes
            # low_memory=False is preserved because it stabilizes internal row type evaluation
            df = pd.read_csv(io.BytesIO(contents), low_memory=False)
        else:
            df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
        
        print(f"📊 Parsing dataset took {time.perf_counter() - parse_start:.2f} sec")

        memory_mb = df.memory_usage(deep=True).sum() / (1024 * 1024)
        print(
            f"📦 Dataset loaded: {len(df):,} rows × {len(df.columns)} columns "
            f"({memory_mb:.2f} MB in RAM)"
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse file: {e}",
        )

    save_start = time.perf_counter()

    session_id = str(uuid.uuid4())
    save(session_id, df)
    
    print(f"💾 Saving session took {time.perf_counter() - save_start:.2f} sec")
    print(f"✅ Total upload request took {time.perf_counter() - start:.2f} sec")

    return {
        "session_id": session_id,
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
    }
