from fastapi import APIRouter, HTTPException
from app.core.session import get
from app.services.suggestions import generate_suggestions

router = APIRouter()

@router.get("/{session_id}")
def get_suggestions(session_id: str):
    df = get(session_id)
    if df is None:
        raise HTTPException(404, "Session not found")
    return {"suggestions": generate_suggestions(df)}