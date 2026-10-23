from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

class KuralBase(BaseModel):
    kural_number: int
    chapter_number: int
    chapter_name_tamil: str
    chapter_name_english: str
    division: str
    line_1_tamil: str
    line_2_tamil: str
    meaning_tamil: str
    meaning_english: str
    keywords_tamil: Optional[str] = ""
    keywords_english: Optional[str] = ""
    source_name: Optional[str] = "Thirukkural"

class KuralDetailResponse(KuralBase):
    id: int
    couplet_tamil: str
    transliteration_1: Optional[str] = ""
    transliteration_2: Optional[str] = ""
    explanation_tamil_sp: Optional[str] = ""
    explanation_tamil_mk: Optional[str] = ""
    explanation_english: Optional[str] = ""
    iyal_tamil: Optional[str] = ""
    iyal_english: Optional[str] = ""

    model_config = ConfigDict(from_attributes=True)

class KuralSearchResult(BaseModel):
    kural_number: int
    chapter_name_tamil: str
    chapter_name_english: str
    division: str
    kural_tamil: str
    line_1_tamil: str
    line_2_tamil: str
    meaning_english: str
    meaning_tamil: str
    relevance_score: float = Field(default=0.0, ge=0.0, le=1.0)
    explanation_english: Optional[str] = ""
    explanation_tamil_sp: Optional[str] = ""

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    language: Optional[str] = "auto"
    top_k: Optional[int] = 3
    ai_provider: Optional[str] = "auto"  # "suba", "gemini", "openai", "auto"
    api_key: Optional[str] = None
    ai_model: Optional[str] = None

class ChatResponse(BaseModel):
    question: str
    language: str
    answer: str
    answer_tamil: Optional[str] = None
    answer_english: Optional[str] = None
    practical_takeaway: Optional[str] = None
    practical_takeaway_tamil: Optional[str] = None
    practical_takeaway_english: Optional[str] = None
    kurals: List[KuralSearchResult]
    grounded: bool
    related_kurals: Optional[List[int]] = []
    ai_model: Optional[str] = "SUBA AI Cognitive Engine"

class TranslateRequest(BaseModel):
    text: str
    target_language: str = "ta"  # "ta" or "en"
    kural_number: Optional[int] = None

class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str

class KuralListResponse(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    items: List[KuralDetailResponse]

class ChapterItem(BaseModel):
    number: int
    name_tamil: str
    name_english: str
    transliteration: str
    division: str
    start: int
    end: int
    total_kurals: int = 10

class ChaptersResponse(BaseModel):
    total_chapters: int
    divisions: List[str]
    chapters: List[ChapterItem]

class FeedbackRequest(BaseModel):
    question: str
    kural_number: Optional[int] = None
    helpful: bool
    comment: Optional[str] = None
