from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.kural import Kural
from app.schemas.kural import KuralDetailResponse, KuralListResponse
from app.services.retrieval import retrieval_engine

router = APIRouter(prefix="/api", tags=["Kurals"])

@router.get("/kurals", response_model=KuralListResponse)
def list_kurals(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    division: Optional[str] = None,
    chapter_number: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Kural)

    if division:
        query = query.filter(Kural.division.ilike(f"%{division}%"))

    if chapter_number:
        query = query.filter(Kural.chapter_number == chapter_number)

    if search:
        search_term = search.strip()
        if search_term.isdigit():
            query = query.filter(Kural.kural_number == int(search_term))
        else:
            query = query.filter(
                or_(
                    Kural.line_1_tamil.ilike(f"%{search_term}%"),
                    Kural.line_2_tamil.ilike(f"%{search_term}%"),
                    Kural.meaning_english.ilike(f"%{search_term}%"),
                    Kural.meaning_tamil.ilike(f"%{search_term}%"),
                    Kural.chapter_name_english.ilike(f"%{search_term}%"),
                    Kural.chapter_name_tamil.ilike(f"%{search_term}%"),
                    Kural.transliteration_1.ilike(f"%{search_term}%"),
                    Kural.transliteration_2.ilike(f"%{search_term}%")
                )
            )

    total = query.count()
    pages = (total + limit - 1) // limit if total > 0 else 1
    items = query.order_by(Kural.kural_number.asc()).offset((page - 1) * limit).limit(limit).all()

    return KuralListResponse(
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        items=[k.to_dict() for k in items]
    )

@router.get("/daily-kural", response_model=KuralDetailResponse)
def get_daily_kural(db: Session = Depends(get_db)):
    """
    Returns a deterministic Kural of the Day based on the current calendar date.
    All users on the same day globally receive the exact same Kural.
    """
    today = date.today()
    # Days since epoch modulo 1330 + 1 gives contiguous deterministic cycle
    day_number = (today.toordinal() % 1330) + 1
    kural = db.query(Kural).filter(Kural.kural_number == day_number).first()
    if not kural:
        # Fallback to Kural #1 if not found
        kural = db.query(Kural).filter(Kural.kural_number == 1).first()
        if not kural:
            raise HTTPException(status_code=404, detail="No Kurals in database.")
    return kural.to_dict()

@router.get("/search")
def search_kurals(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    results, lang = retrieval_engine.search(db, query=q, top_k=limit)
    return {
        "query": q,
        "language": lang,
        "total_results": len(results),
        "results": results
    }

@router.get("/kurals/{kural_number}", response_model=KuralDetailResponse)
def get_kural_by_number(kural_number: int, db: Session = Depends(get_db)):
    if kural_number < 1 or kural_number > 1330:
        raise HTTPException(status_code=404, detail="Kural number must be between 1 and 1330.")
    kural = db.query(Kural).filter(Kural.kural_number == kural_number).first()
    if not kural:
        raise HTTPException(status_code=404, detail=f"Kural {kural_number} not found in database.")
    return kural.to_dict()

@router.get("/kurals/{kural_number}/related")
def get_related_kurals_endpoint(kural_number: int, limit: int = 3, db: Session = Depends(get_db)):
    if kural_number < 1 or kural_number > 1330:
        raise HTTPException(status_code=404, detail="Invalid Kural number.")
    
    related_ids = retrieval_engine.get_related_kurals(db, kural_number, limit=limit)
    related_items = db.query(Kural).filter(Kural.kural_number.in_(related_ids)).all()
    return {
        "kural_number": kural_number,
        "related": [k.to_dict() for k in related_items]
    }
