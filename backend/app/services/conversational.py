import re
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.kural import Kural

GREETINGS = {
    "hi", "hello", "hey", "hola", "namaste", "vanakkam", "வணக்கம்",
    "good morning", "good afternoon", "good evening", "how are you",
    "eppadi irukeenga", "epdi irukinga", "sollunga", "who are you",
    "what is your name", "what can you do", "introduce yourself",
    "unga peyar enna", "nee yaaru", "neenga yar"
}

THIRUVALLUVAR_META = {
    "who is thiruvalluvar", "who wrote thirukkural", "thiruvalluvar yaar",
    "thiruvalluvar pathi sollunga", "tell me about thiruvalluvar",
    "author of thirukkural", "what is thirukkural", "how many kurals",
    "thirukkural pathi sollunga", "structure of thirukkural", "history of thirukkural",
    "thiruvalluvar", "thirukkural", "திருவள்ளுவர் யார்", "திருக்குறள் என்றால் என்ன",
    "எத்தனை குறள்கள் உள்ளன"
}

def check_conversational_or_meta(query: str, db: Session, language: str) -> Optional[Dict[str, Any]]:
    """
    Checks if user is sending a greeting, identity inquiry, or meta-question about Thiruvalluvar/Thirukkural.
    Returns structured answer and relevant landmark Kural with full bilingual text.
    """
    clean_q = re.sub(r'[^\w\s]', '', query.strip().lower())

    is_greeting = clean_q in GREETINGS or any(clean_q.startswith(g) for g in ["hi ", "hello ", "hey ", "vanakkam ", "வணக்கம்"])
    is_meta = any(meta in clean_q for meta in THIRUVALLUVAR_META) or clean_q in THIRUVALLUVAR_META

    if not is_greeting and not is_meta:
        return None

    # Retrieve Kural #1 (Cosmic Invocation) or Kural #391 (On Learning)
    target_kural_num = 1 if is_greeting else 391
    kural_record = db.query(Kural).filter(Kural.kural_number == target_kural_num).first()

    kural_item = []
    if kural_record:
        kural_item.append({
            "kural_number": kural_record.kural_number,
            "chapter_name_tamil": kural_record.chapter_name_tamil,
            "chapter_name_english": kural_record.chapter_name_english,
            "division": kural_record.division,
            "kural_tamil": f"{kural_record.line_1_tamil}\n{kural_record.line_2_tamil}",
            "line_1_tamil": kural_record.line_1_tamil,
            "line_2_tamil": kural_record.line_2_tamil,
            "meaning_english": kural_record.meaning_english,
            "meaning_tamil": kural_record.meaning_tamil,
            "relevance_score": 1.0,
            "explanation_english": kural_record.explanation_english,
            "explanation_tamil_sp": kural_record.explanation_tamil_sp
        })

    if is_greeting:
        ans_ta = (
            "வணக்கம்! நான் **சுபா (SUBA)** — திருக்குறள் ஞான செயற்கை நுண்ணறிவு வழிகாட்டி.\n\n"
            "தெய்வப்புலவர் திருவள்ளுவர் அருளிய **1,330 திருக்குறள்களின்** ஆழமான நெறிகளைக் கொண்டு, "
            "உங்கள் அன்றாட வாழ்க்கைச் சூழல்கள், மனக்குழப்பங்கள், நட்பு, வெற்றி, தொழில், மற்றும் தனிமனித வளர்ச்சி சார்ந்த "
            "எந்தக் கேள்விக்கும் வழிகாட்டத் தயாராக உள்ளேன்.\n\n"
            "நம் உரையாடலைத் திருக்குறளின் முதற் குறளான **கடவுள் வாழ்த்து (குறள் 1)** உடன் தொடங்குவோம்!"
        )
        takeaway_ta = "வாழ்க்கை, நட்பு, கோபத்தைக் கட்டுப்படுத்துதல், முயற்சி, அல்லது கல்வி குறித்து உங்கள் வினாவை தாராளமாகக் கேளுங்கள்."

        ans_en = (
            "Vanakkam & Welcome! I am **SUBA**, your AI-powered Thirukkural wisdom assistant.\n\n"
            "I am equipped with all **1,330 couplets** composed by the ancient sage-poet **Thiruvalluvar**, "
            "organized across 133 chapters and 3 timeless divisions (Virtue, Wealth, and Love).\n\n"
            "You can ask me about real-life dilemmas—such as overcoming failure, managing anger, choosing true friends, "
            "handling toxic situations, career perseverance, or finding inner peace.\n\n"
            "As an auspicious beginning, let us reflect on **Kural #1** from the chapter *The Praise of God*."
        )
        takeaway_en = "Feel free to ask any question about work, friendships, stress, decision-making, or ethical dilemmas."

        if language == "ta":
            ans_primary = ans_ta
            takeaway_primary = takeaway_ta
        elif language == "en":
            ans_primary = ans_en
            takeaway_primary = takeaway_en
        else:
            ans_primary = (
                f"📖 **தமிழ் வழிகாட்டல்:**\n{ans_ta}\n\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                f"🌐 **English Guidance:**\n{ans_en}"
            )
            takeaway_primary = f"💡 **தமிழ்:** {takeaway_ta}\n\n✨ **English:** {takeaway_en}"

        return {
            "answer": ans_primary,
            "answer_tamil": ans_ta,
            "answer_english": ans_en,
            "practical_takeaway": takeaway_primary,
            "practical_takeaway_tamil": takeaway_ta,
            "practical_takeaway_english": takeaway_en,
            "kurals": kural_item,
            "grounded": True,
            "related_kurals": [2, 3, 4]
        }

    if is_meta:
        ans_ta = (
            "**திருக்குறள் மற்றும் திருவள்ளுவர் பற்றிய அறிமுகம்:**\n\n"
            "**திருவள்ளுவர்** இரண்டாயிரம் ஆண்டுகளுக்கு முன் வாழ்ந்த தமிழின் ஆகச்சிறந்த மெய்யியலாளர் மற்றும் தெய்வப்புலவர் ஆவார். "
            "அவர் இயற்றிய **திருக்குறள்** உலகப் பொதுமறை எனப் போற்றப்படுகிறது.\n\n"
            "**நூலின் கட்டமைப்பு:**\n"
            "• **1,330 குறள்கள்**, மொத்தம் **133 அதிகாரங்கள்** (ஒவ்வொரு அதிகாரத்திற்கும் 10 குறள்கள்).\n"
            "• **அறத்துப்பால் (Virtue)**: 38 அதிகாரங்கள் (1–380 குறள்கள்) — ஒழுக்கம், இல்லறம், அன்பு, துறவு.\n"
            "• **பொருட்பால் (Wealth & Society)**: 70 அதிகாரங்கள் (381–1080 குறள்கள்) — தலைமை, கல்வி, முயற்சி, நட்பு, நீதி.\n"
            "• **காமத்துப்பால் (Love)**: 25 அதிகாரங்கள் (1081–1330 குறள்கள்) — தூய காதல் மற்றும் மன உணர்வுகள்.\n\n"
            "சான்றாக, கல்வி அதிகாரத்தில் உள்ள **குறள் 391** பிழையற்ற கற்றலின் மேன்மையை உணர்த்துகிறது."
        )
        takeaway_ta = "திருக்குறள் எந்த ஒரு மதத்திற்கோ அல்லது காலத்திற்கோ மட்டுப்பட்டதல்ல; அது மனிதகுலம் முழுமைக்குமான வாழ்க்கை வழிகாட்டி."

        ans_en = (
            "**About Thiruvalluvar & The Thirukkural:**\n\n"
            "**Thiruvalluvar** was an ancient Tamil philosopher and poet (~2nd–5th century CE), revered as *Deiva Pulavar* (the Divine Poet). "
            "His masterwork, the **Thirukkural**, is recognized worldwide as the *Universal Code of Ethics* (*Ulaga Podhumurai*).\n\n"
            "**Structure of Thirukkural:**\n"
            "• **1,330 couplets (Kurals)** organized into **133 chapters** (10 couplets each).\n"
            "• **1. Aṟattuppāl (Virtue)**: 38 Chapters (Kurals 1–380) — Domestic duty, kindness, truth, non-violence, and forbearance.\n"
            "• **2. Poruṭpāl (Wealth & Public Life)**: 70 Chapters (Kurals 381–1080) — Leadership, education, perseverance, governance, and friendship.\n"
            "• **3. Kāmattuppāl (Love)**: 25 Chapters (Kurals 1081–1330) — The subtle psychology of romantic love and emotional harmony.\n\n"
            "As an exemplar of his philosophy on continuous learning, explore **Kural #391** below."
        )
        takeaway_en = "Learn thoroughly whatever you study, and let your practical conduct conform to your learning."

        if language == "ta":
            meta_ans = ans_ta
            meta_takeaway = takeaway_ta
        elif language == "en":
            meta_ans = ans_en
            meta_takeaway = takeaway_en
        else:
            meta_ans = (
                f"📖 **தமிழ் விளக்கம்:**\n{ans_ta}\n\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                f"🌐 **English Guidance:**\n{ans_en}"
            )
            meta_takeaway = f"💡 **தமிழ்:** {takeaway_ta}\n\n✨ **English:** {takeaway_en}"

        return {
            "answer": meta_ans,
            "answer_tamil": ans_ta,
            "answer_english": ans_en,
            "practical_takeaway": meta_takeaway,
            "practical_takeaway_tamil": takeaway_ta,
            "practical_takeaway_english": takeaway_en,
            "kurals": kural_item,
            "grounded": True,
            "related_kurals": [392, 393, 394]
        }

    return None
