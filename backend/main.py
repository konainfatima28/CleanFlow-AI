import os
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

port = int(os.getenv("PORT", 8000))

app = FastAPI(
    title="CleanFlow AI API",
    version="1.0.0",
)

# 1. Parse origins dynamically and include safe defaults
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,https://do-cleanflow-ai.vercel.app"
)

# Strip out trailing slashes or accidental white spaces from the domains list
ALLOWED_ORIGINS = [origin.strip().rstrip("/") for origin in raw_origins.split(",")]

# 2. Inject Robust CORS policy configurations for File Streams
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,  # Set to True to prevent preflight dropouts on cross-origin requests
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly state allowed methods
    allow_headers=["*"],  # Accept all inbound headers safely
    expose_headers=["Content-Disposition"],  # CRITICAL: Allows Vercel frontend to read file attachments
)

# 3. Application Routers
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
