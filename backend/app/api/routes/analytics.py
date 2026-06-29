# backend/app/api/routes/analytics.py

from fastapi import APIRouter, HTTPException
from app.core.session import get
from app.services.analytics import generate_analytics
from app.services.profiler import profile_dataframe

router = APIRouter()


@router.get("/{session_id}")
def get_analytics(session_id: str):
    df = get(session_id)
    if df is None:
        raise HTTPException(404, "Session not found")
    return generate_analytics(df)


@router.get("/compare/{original_id}/{cleaned_id}")
def compare_sessions(original_id: str, cleaned_id: str):
    from app.services.analytics import quality_comparison
    original = get(original_id)
    cleaned  = get(cleaned_id)
    if original is None or cleaned is None:
        raise HTTPException(404, "One or both sessions not found")
    orig_profile    = profile_dataframe(original)
    cleaned_profile = profile_dataframe(cleaned)
    return quality_comparison(orig_profile, cleaned_profile)