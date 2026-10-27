import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.schemas.kural import ChatRequest, ChatResponse, FeedbackRequest, TranslateRequest, TranslateResponse
from app.models.kural import Kural
from app.services.retrieval import retrieval_engine
from app.services.answer_generator import generate_answer
from app.services.tanglish import detect_language, CONCEPT_SYNONYMS
from app.services.conversational import check_conversational_or_meta
from typing import Optional
router = APIRouter(prefix="/api", tags=["Chat"])

COMMON_ENGLISH_WORDS = {
    'what', 'how', 'why', 'when', 'who', 'where', 'which', 'can', 'should',
    'could', 'would', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'to',
    'in', 'on', 'at', 'by', 'for', 'with', 'about', 'life', 'people', 'human',
    'good', 'bad', 'best', 'way', 'mind', 'think', 'thought', 'feel', 'feeling',
    'my', 'me', 'i', 'you', 'your', 'we', 'our', 'they', 'their', 'someone',
    'anyone', 'world', 'live', 'living', 'thing', 'things', 'advice', 'help',
    'future', 'career', 'job', 'family', 'problem', 'situation', 'peace', 'action'
}

def is_meaningful_question(text: str) -> bool:
    if re.search(r'[\u0B80-\u0BFF]', text):
        return True
    tokens = [w.lower() for w in re.findall(r'[a-zA-Z]+', text)]
    if not tokens:
        return False
    return any(t in COMMON_ENGLISH_WORDS or t in CONCEPT_SYNONYMS for t in tokens)

def get_philosophical_anchor_kural(question: str, db: Session) -> Kural:
    q_lower = question.lower()
    if any(w in q_lower for w in ['sad', 'sorrow', 'trouble', 'pain', 'cry', 'grief', 'hardship', 'stress', 'struggle', 'depress']):
        anchor_num = 621  # இடுக்கண் அழியாமை (Smile in adversity)
    elif any(w in q_lower for w in ['work', 'effort', 'career', 'job', 'achieve', 'success', 'goal', 'action', 'hard', 'try', 'future']):
        anchor_num = 619  # ஆள்வினை உடைமை (Effort pays wage)
    elif any(w in q_lower for w in ['think', 'idea', 'decision', 'truth', 'know', 'knowledge', 'mind', 'reason', 'science', 'ai', 'clear']):
        anchor_num = 423  # அறிவுடைமை (Discerning truth)
    elif any(w in q_lower for w in ['love', 'kind', 'friend', 'care', 'help', 'heart', 'empathy', 'people']):
        anchor_num = 71   # அன்புடைமை (Love's tears)
    else:
        anchor_num = 131  # ஒழுக்கமுடைமை (Good conduct is prized higher than life)
    return db.query(Kural).filter(Kural.kural_number == anchor_num).first()

@router.post("/chat", response_model=ChatResponse)
def chat_with_suba(req: ChatRequest, db: Session = Depends(get_db)):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # 1. Determine user language preference
    # If user selected Tamil ('ta') -> give all answers in Tamil
    # If user selected English ('en') -> give all answers in English
    # If user selected Auto ('auto') -> give answers in BOTH languages
    req_lang = (req.language or "auto").strip().lower()
    if req_lang in ("ta", "tamil"):
        lang = "ta"
    elif req_lang in ("en", "english"):
        lang = "en"
    else:
        lang = "auto"

    # 2. Check for Conversational, Greeting, or Meta Questions
    meta_response = check_conversational_or_meta(question, db, lang)
    if meta_response:
        return ChatResponse(
            question=question,
            language=lang,
            answer=meta_response["answer"],
            answer_tamil=meta_response.get("answer_tamil"),
            answer_english=meta_response.get("answer_english"),
            practical_takeaway=meta_response.get("practical_takeaway"),
            practical_takeaway_tamil=meta_response.get("practical_takeaway_tamil"),
            practical_takeaway_english=meta_response.get("practical_takeaway_english"),
            kurals=meta_response["kurals"],
            grounded=meta_response["grounded"],
            related_kurals=meta_response.get("related_kurals", [])
        )

    # 3. Retrieve most relevant Kurals via hybrid search (supports Tamil, English, and Tanglish)
    matched_kurals, detected_lang = retrieval_engine.search(
        db=db,
        query=question,
        top_k=req.top_k or 3
    )

    # 4. If no direct match was retrieved, check if it's a meaningful question
    if not matched_kurals and is_meaningful_question(question):
        anchor_kural = get_philosophical_anchor_kural(question, db)
        if anchor_kural:
            matched_kurals = [{
                "kural_number": anchor_kural.kural_number,
                "chapter_name_tamil": anchor_kural.chapter_name_tamil,
                "chapter_name_english": anchor_kural.chapter_name_english,
                "division": anchor_kural.division,
                "kural_tamil": f"{anchor_kural.line_1_tamil}\n{anchor_kural.line_2_tamil}",
                "line_1_tamil": anchor_kural.line_1_tamil,
                "line_2_tamil": anchor_kural.line_2_tamil,
                "meaning_english": anchor_kural.meaning_english,
                "meaning_tamil": anchor_kural.meaning_tamil,
                "relevance_score": 0.85,
                "explanation_english": anchor_kural.explanation_english,
                "explanation_tamil_sp": anchor_kural.explanation_tamil_sp
            }]

    # 5. Generate bilingual grounded answer with ChatGPT-grade AI cognitive solution
    ans_data = generate_answer(
        question=question,
        kurals=matched_kurals,
        language=lang,
        ai_provider=req.ai_provider,
        api_key=req.api_key,
        ai_model=req.ai_model
    )

    # 6. Find related Kurals for the primary matched Kural
    related_numbers = []
    if matched_kurals:
        primary_no = matched_kurals[0]["kural_number"]
        related_numbers = retrieval_engine.get_related_kurals(db, primary_no, limit=3)

    return ChatResponse(
        question=question,
        language=lang,
        answer=ans_data["answer"],
        answer_tamil=ans_data.get("answer_tamil"),
        answer_english=ans_data.get("answer_english"),
        practical_takeaway=ans_data.get("practical_takeaway"),
        practical_takeaway_tamil=ans_data.get("practical_takeaway_tamil"),
        practical_takeaway_english=ans_data.get("practical_takeaway_english"),
        kurals=matched_kurals,
        grounded=ans_data["grounded"],
        related_kurals=related_numbers,
        ai_model=ans_data.get("ai_model", "SUBA AI Cognitive Engine")
    )

@router.post("/translate", response_model=TranslateResponse)
def translate_kural_content(req: TranslateRequest, db: Session = Depends(get_db)):
    """
    Translates response or commentary on demand to either Tamil or English.
    """
    target = req.target_language.lower().strip()
    if target not in ("ta", "en"):
        target = "ta"

    # 1. If Kural number is provided, return rich scholarly translation from DB
    if req.kural_number:
        kural = db.query(Kural).filter(Kural.kural_number == req.kural_number).first()
        if kural:
            if target == "ta":
                translated = f"{kural.meaning_tamil}\n\nஅதிகாரம்: {kural.chapter_name_tamil} ({kural.division})"
            else:
                translated = f"{kural.meaning_english}\n\nChapter: {kural.chapter_name_english} ({kural.division})"
            return TranslateResponse(
                translated_text=translated,
                source_language="en" if target == "ta" else "ta",
                target_language=target
            )

    # 2. General text translation
    text_to_translate = req.text.strip()
    if not text_to_translate:
        return TranslateResponse(
            translated_text="",
            source_language="auto",
            target_language=target
        )

    try:
        from deep_translator import MyMemoryTranslator
        src_lang = 'en-GB' if target == 'ta' else 'ta-IN'
        tgt_lang = 'ta-IN' if target == 'ta' else 'en-GB'
        translated = MyMemoryTranslator(source=src_lang, target=tgt_lang).translate(text_to_translate[:1500])
        if translated:
            return TranslateResponse(
                translated_text=translated,
                source_language="en" if target == "ta" else "ta",
                target_language=target
            )
    except Exception as e:
        print(f"Translation service error: {e}")

    return TranslateResponse(
        translated_text=text_to_translate,
        source_language="auto",
        target_language=target
    )

@router.post("/feedback")
def submit_feedback(fb: FeedbackRequest):
    print(f"Feedback received: Question='{fb.question}', Kural={fb.kural_number}, Helpful={fb.helpful}, Comment={fb.comment}")
    return {"status": "success", "message": "Feedback recorded. நன்றி!"}

from pydantic import BaseModel

class AITestRequest(BaseModel):
    provider: str  # "gemini" or "openai"
    api_key: str
    model: Optional[str] = None

@router.get("/ai/status")
def get_ai_status():
    """
    Returns current AI engine capabilities and configured models.
    """
    return {
        "status": "ready",
        "default_engine": "SUBA AI Cognitive Engine",
        "providers_supported": ["suba", "gemini", "openai"],
        "gemini_available": bool(settings.GEMINI_API_KEY),
        "openai_available": bool(settings.OPENAI_API_KEY),
        "description": "ChatGPT-style situational analysis & actionable problem-solving grounded in all 1,330 Thirukkural couplets."
    }

from app.services.ai_bot import call_live_llm

@router.post("/ai/test")
def test_ai_provider(req: AITestRequest):
    """
    Tests an external AI provider (Gemini or OpenAI) with sample Kural analysis.
    """
    sample_kurals = [{
        "kural_number": 1,
        "chapter_name_tamil": "கடவுள் வாழ்த்து",
        "chapter_name_english": "The Praise of God",
        "division": "அறத்துப்பால் - Virtue",
        "line_1_tamil": "அகர முதல எழுத்தெல்லாம் ஆதி",
        "line_2_tamil": "பகவன் முதற்றே உலகு.",
        "meaning_tamil": "எழுத்துக்கள் எல்லாம் அகரத்தை முதலாகக் கொண்டுள்ளன; அதுபோல் உலகம் கடவுளை முதலாகக் கொண்டுள்ளது.",
        "meaning_english": "As the letter A is the first of all letters, so the eternal God is first in the world."
    }]
    res = call_live_llm("test connection", sample_kurals, req.provider.lower(), req.api_key.strip(), req.model)
    if res:
        return {"status": "success", "message": f"Successfully connected to {req.provider.capitalize()} AI!"}
    else:
        raise HTTPException(status_code=400, detail=f"Failed to connect to {req.provider.capitalize()} with provided API key. Please verify your key and network.")

