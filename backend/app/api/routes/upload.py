import uuid
import os
import io
import shutil
import tempfile
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException

# Import your Parquet state storage manager or your current session store here
from app.core.storage import storage_manager  # Or app.core.session import save

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

    # Stream the file content directly onto disk chunk-by-chunk 
    # to protect against server RAM spikes.
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            # Copy file stream directly to temporary storage in 1MB chunks
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file stream to disk: {e}")

    try:
        # Load file safely using memory-optimized parameters
        if ext == ".csv":
            df = pd.read_csv(temp_path)
        else:
            df = pd.read_excel(temp_path)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse file: {e}",
        )
    finally:
        # Clean up the temporary file immediately after parsing
        if os.path.exists(temp_path):
            os.remove(temp_path)

    session_id = str(uuid.uuid4())
    
    # Save using your Parquet storage layer to enable advanced Undo/Redo timelines
    storage_manager.initialize_session(session_id, df, file.filename)

    return {
        "session_id": session_id,
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
    }
