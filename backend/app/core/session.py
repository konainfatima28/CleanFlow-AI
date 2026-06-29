import pandas as pd
from typing import Dict

# In-memory store: session_id → DataFrame
_store: Dict[str, pd.DataFrame] = {}

def save(session_id: str, df: pd.DataFrame):
    _store[session_id] = df

def get(session_id: str) -> pd.DataFrame | None:
    return _store.get(session_id)

def delete(session_id: str):
    _store.pop(session_id, None)