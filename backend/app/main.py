import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import health, chat, kurals, chapters, tts
from app.services.retrieval import retrieval_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and pre-warm retrieval engine
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        retrieval_engine.initialize(db)
    finally:
        db.close()
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="SUBA — AI Thirukkural Wisdom API",
    description="A complete RAG-powered API providing timeless wisdom from all 1,330 Thirukkural couplets.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware: allow all standard web, local Wi-Fi, and mobile WebView origins
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",
    "ionic://localhost",
]
env_origins = [o.strip() for o in settings.cors_origin_list if o.strip()]
has_wildcard = "*" in env_origins or not env_origins
allowed_list = list(dict.fromkeys(default_origins + [o for o in env_origins if o != "*"]))

if has_wildcard:
    # Use regex to allow any origin while preserving credentials compatibility
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*|^capacitor://.*|^ionic://.*",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

# Register Routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(kurals.router)
app.include_router(chapters.router)
app.include_router(tts.router)

@app.get("/")
def root():
    return {
        "message": "வணக்கம்! Welcome to SUBA — AI-Powered Thirukkural Wisdom API",
        "docs": "/docs",
        "health": "/api/health",
        "kurals_count": 1330
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
