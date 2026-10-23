from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.kural import Kural
from app.config import settings

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        count = db.query(Kural).count()
        db_status = "connected" if count == 1330 else f"incomplete ({count}/1330 records)"
    except Exception as e:
        count = 0
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if count == 1330 else "degraded",
        "app_name": settings.APP_NAME,
        "database": {
            "status": db_status,
            "total_kurals": count,
            "expected_kurals": 1330
        },
        "ai_provider": {
            "configured_provider": settings.AI_PROVIDER,
            "has_api_key": bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY),
            "mode": "hybrid-llm" if (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY) else "built-in-grounded-engine"
        }
    }
