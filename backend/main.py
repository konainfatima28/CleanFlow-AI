import os

port = int(os.getenv("PORT", 8000))

from app.api.routes import upload, profile, clean, export, suggestions, analytics

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import (
    upload,
    profile,
    clean,
    export,
    suggestions,
    analytics,
)

app = FastAPI(
    title="CleanFlow AI API",
    version="1.0.0",
)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(suggestions.router, prefix="/api/suggestions", tags=["Suggestions"])
app.include_router(clean.router, prefix="/api/clean", tags=["Clean"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "1.0.0",
    }
