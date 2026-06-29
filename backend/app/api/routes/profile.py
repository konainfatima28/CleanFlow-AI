from fastapi import APIRouter, HTTPException
from app.core.session import get
from app.services.profiler import profile_dataframe

router = APIRouter()

@router.get("/{session_id}")
def get_profile(session_id: str):
    df = get(session_id)
    if df is None:
        raise HTTPException(404, "Session not found")
    return profile_dataframe(df)