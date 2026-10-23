import os
import json
import requests
from typing import List, Dict, Any, Optional
from app.config import settings
from app.prompts.suba_prompt import SUBA_SYSTEM_PROMPT

def generate_bilingual_grounded_explanations(
    question: str,
    kurals: List[Dict[str, Any]]
) -> Dict[str, str]:
    """
    Generates high quality grounded explanations and takeaways in BOTH Tamil and English.
    """
    if not kurals:
        ans_ta = (
            "மன்னிக்கவும், உங்கள் கேள்விக்குரிய நேரடியான திருக்குறளை 1,330 குறள்களிலும் கண்டறிய முடியவில்லை. "
            "தயவுசெய்து உங்கள் கேள்வியை வேறு சொற்களில் கேட்டுப் பாருங்கள்."
        )
        takeaway_ta = "வாழ்க்கை, கல்வி, நட்பு, முயற்சி, அல்லது ஒழுக்கம் சார்ந்த கேள்விகளை தெளிவாக கேட்கவும்."

        ans_en = (
            "I carefully searched all 1,330 Thirukkural couplets, but could not find a directly applicable Kural for this specific question. "
            "Please try rephrasing your question or exploring themes such as perseverance, friendship, anger, honesty, or purpose."
        )
        takeaway_en = "Try asking about life dilemmas, friendship, self-discipline, success, leadership, or handling adversity."

        return {
            "answer_ta": ans_ta,
            "takeaway_ta": takeaway_ta,
            "answer_en": ans_en,
            "takeaway_en": takeaway_en
        }

    primary = kurals[0]
    num = primary["kural_number"]
    ch_ta = primary["chapter_name_tamil"]
    ch_en = primary["chapter_name_english"]
    div = primary["division"]
    trans_en = primary["meaning_english"]
    mv_ta = primary["meaning_tamil"]
    exp_en = primary.get("explanation_english", "")
    sp_ta = primary.get("explanation_tamil_sp", "")

    # Clean Tamil division name
    div_ta = div.split("-")[0].strip() if "-" in div else div

    # 1. Authentic Tamil Explanation
    ans_ta = (
        f"உங்கள் வினாவிற்குத் திருக்குறளின் **அதிகாரம்: {ch_ta}** ({div_ta})-ல் உள்ள **குறள் {num}** சிறந்த வழிகாட்டுகிறது.\n\n"
        f"**குறள் கருத்து விளக்கம் (டாக்டர் மு. வரதராசனார்):**\n"
        f"\"{mv_ta}\"\n\n"
    )
    if sp_ta and sp_ta != mv_ta:
        ans_ta += f"**எளிய வாழ்வியல் உரை (சாலமன் பாப்பையா):**\n\"{sp_ta}\"\n\n"

    ans_ta += (
        f"**வாழ்வியல் பொருத்தம்:**\n"
        f"வாழ்க்கையில் '{question.strip()}' என்ற சூழல் எழும்போது, நாம் உணர்ச்சிவசப்படாமல் ஆழ்ந்த அறிவோடும், "
        f"பொறுமையோடும், தர்ம நெறியோடும் செயல்பட வேண்டும் என்று திருவள்ளுவர் வழிகாட்டுகிறார்."
    )

    takeaway_ta = f"அதிகாரம் '{ch_ta}' உணர்த்தும் நெறியின்படி, உடனடி உணர்ச்சிவசப்படுதலைத் தவிர்த்து நிலையான ஒழுக்கத்துடனும் முயற்சியுடனும் செயல்படுங்கள்."

    # 2. Authentic English Explanation
    ans_en = (
        f"To address your situation, Thiruvalluvar offers profound counsel in **Kural #{num}** "
        f"from the chapter **'{ch_en}'** ({ch_ta}) within the division of **{div}**.\n\n"
        f"**Verified English Translation (Rev. Dr. G.U. Pope & Drew):**\n"
        f"\"{trans_en}\"\n\n"
    )
    if exp_en and exp_en != trans_en:
        ans_en += f"**Traditional Philosophical Insight:**\n{exp_en}\n\n"

    ans_en += (
        f"**Application to your question:**\n"
        f"In life, when faced with '{question.strip()}', Thirukkural reminds us that enduring success and inner peace "
        f"are achieved through conscious character, steadfast perseverance, and ethical wisdom rather than impulsive reactions."
    )

    takeaway_en = (
        f"In accordance with Chapter '{ch_en}', focus on long-term virtue over short-term gratification. "
        f"Anchor your decisions in steady effort and mutual respect."
    )

    return {
        "answer_ta": ans_ta,
        "takeaway_ta": takeaway_ta,
        "answer_en": ans_en,
        "takeaway_en": takeaway_en
    }

from app.services.ai_bot import generate_cognitive_ai_solution, call_live_llm

def generate_answer(
    question: str,
    kurals: List[Dict[str, Any]],
    language: str,
    ai_provider: Optional[str] = "auto",
    api_key: Optional[str] = None,
    ai_model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main answer generation dispatcher:
    Analyzes the user's dilemma and relevant Kurals like ChatGPT, providing structured
    situational diagnosis, Kural breakdown, step-by-step action plans, and warnings.
    Supports Google Gemini, OpenAI ChatGPT, and built-in SUBA Cognitive Engine.
    """
    bilingual = None
    active_model_name = "SUBA AI Cognitive Engine"

    # 1. Attempt live LLM (Gemini or OpenAI) if user configured it
    eff_provider = (ai_provider or settings.AI_PROVIDER or "auto").lower()
    eff_key = api_key or (settings.GEMINI_API_KEY if eff_provider == "gemini" else (settings.OPENAI_API_KEY if eff_provider == "openai" else None))
    
    if eff_provider in ("gemini", "openai") and eff_key:
        bilingual = call_live_llm(question, kurals, eff_provider, eff_key, ai_model)
        if bilingual:
            active_model_name = f"Google Gemini ({ai_model or 'gemini-1.5-flash'})" if eff_provider == "gemini" else f"OpenAI ChatGPT ({ai_model or 'gpt-4o-mini'})"

    # 2. If no external LLM or if call failed, use our built-in Cognitive AI Solution Engine
    if not bilingual:
        bilingual = generate_cognitive_ai_solution(question, kurals)
        active_model_name = "SUBA AI Cognitive Engine"

    # Primary answer selection based on requested language
    if language == "ta":
        primary_answer = bilingual["answer_ta"]
        primary_takeaway = bilingual["takeaway_ta"]
    elif language == "en":
        primary_answer = bilingual["answer_en"]
        primary_takeaway = bilingual["takeaway_en"]
    else:
        # User requested Auto mode: Deliver answers in BOTH Tamil and English!
        primary_answer = (
            f"📖 **தமிழ் வழிகாட்டல் (Tamil Wisdom Guidance):**\n\n"
            f"{bilingual['answer_ta']}\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"🌐 **English Guidance & Philosophical Meaning (ஆங்கில உரை):**\n\n"
            f"{bilingual['answer_en']}"
        )
        primary_takeaway = (
            f"💡 **தமிழ் வழிமுறை:** {bilingual['takeaway_ta']}\n\n"
            f"✨ **English Takeaway:** {bilingual['takeaway_en']}"
        )

    return {
        "answer": primary_answer,
        "answer_tamil": bilingual["answer_ta"],
        "answer_english": bilingual["answer_en"],
        "practical_takeaway": primary_takeaway,
        "practical_takeaway_tamil": bilingual["takeaway_ta"],
        "practical_takeaway_english": bilingual["takeaway_en"],
        "grounded": True if kurals else False,
        "ai_model": active_model_name
    }
