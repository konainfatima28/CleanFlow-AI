# backend/app/api/routes/clean.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.session import get, save
from app.services.cleaner import apply_operations, diff_summary
from app.services.profiler import profile_dataframe

router = APIRouter()

class CleanRequest(BaseModel):
    operations: list[dict]

@router.post("/{session_id}")
def clean_dataset(session_id: str, body: CleanRequest):
    original = get(session_id)
    if original is None:
        raise HTTPException(404, "Session not found")

    result = apply_operations(original.copy(), body.operations)
    save(f"{session_id}_cleaned", result.df)

    return {
        "cleaned_session_id": f"{session_id}_cleaned",
        "log":     result.log,
        "diff":    diff_summary(original, result.df),
        "profile": profile_dataframe(result.df),
    }


