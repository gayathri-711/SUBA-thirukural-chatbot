from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.kural import Kural
from app.schemas.kural import ChaptersResponse, ChapterItem

router = APIRouter(prefix="/api", tags=["Chapters"])

@router.get("/chapters", response_model=ChaptersResponse)
def get_chapters(db: Session = Depends(get_db)):
    # Group by chapter number
    chapters_query = (
        db.query(
            Kural.chapter_number,
            Kural.chapter_name_tamil,
            Kural.chapter_name_english,
            Kural.division,
            func.min(Kural.kural_number).label("start"),
            func.max(Kural.kural_number).label("end"),
            func.count(Kural.id).label("total")
        )
        .group_by(
            Kural.chapter_number,
            Kural.chapter_name_tamil,
            Kural.chapter_name_english,
            Kural.division
        )
        .order_by(Kural.chapter_number.asc())
        .all()
    )

    divisions = [
        "அறத்துப்பால் - Virtue",
        "பொருட்பால் - Wealth",
        "காமத்துப்பால் - Love"
    ]

    items = [
        ChapterItem(
            number=ch[0],
            name_tamil=ch[1],
            name_english=ch[2],
            transliteration="",
            division=ch[3],
            start=ch[4],
            end=ch[5],
            total_kurals=ch[6]
        )
        for ch in chapters_query
    ]

    return ChaptersResponse(
        total_chapters=len(items),
        divisions=divisions,
        chapters=items
    )
