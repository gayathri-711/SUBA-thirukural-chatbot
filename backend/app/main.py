import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

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

# CORS Middleware
origins = settings.cors_origin_list
if not origins or "*" in origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
