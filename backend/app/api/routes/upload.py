# backend/app/api/routes/upload.py
import uuid
import os
import shutil
import tempfile
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.storage import storage_manager  # Parquet state engine reference

router = APIRouter()

ALLOWED_EXTENSIONS = {".csv", ".xlsx"}

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Matrix filename missing.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported matrix format. Only structured CSV and XLSX schemas are supported.",
        )

    # Stream the file contents directly onto the disk partition chunk-by-chunk 
    # to protect server infrastructure against random RAM peaks.
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to isolate file write stream: {e}")

    try:
        # Load structural data source using transient pandas allocations
        if ext == ".csv":
            df = pd.read_csv(temp_path)
        else:
            df = pd.read_excel(temp_path)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Matrix parsing structural exception: {e}",
        )
    finally:
        # Clean up the temporary file safely immediately after dataframe conversion
        if os.path.exists(temp_path):
            os.remove(temp_path)

    session_id = str(uuid.uuid4())
    
    # Initialize the Snappy-compressed Parquet transaction lineage tree state on disk
    storage_manager.initialize_session(session_id, df, file.filename)

    # Returns unified parameter properties that your frontend hooks match cleanly
    return {
        "session_id": session_id,
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
    }
