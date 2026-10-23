import os
import sys
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import SessionLocal
from app.models.kural import Kural

client = TestClient(app)

@pytest.fixture(scope="session")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_database_contains_exactly_1330_kurals(db_session):
    """Test that the database contains exactly 1,330 unique Kural numbers without duplicates or missing entries."""
    kurals = db_session.query(Kural).all()
    assert len(kurals) == 1330, f"Expected 1,330 Kurals, but found {len(kurals)}"

    numbers = [k.kural_number for k in kurals]
    assert len(set(numbers)) == 1330, "Found duplicate Kural numbers"
    assert min(numbers) == 1, "First Kural number is not 1"
    assert max(numbers) == 1330, "Last Kural number is not 1330"

    # Verify all 133 chapters exist
    chapters = {k.chapter_number for k in kurals}
    assert len(chapters) == 133, f"Expected 133 chapters, found {len(chapters)}"

def test_known_kural_lookup():
    """Test retrieving known Kural #1 and #619 by exact endpoint and by chat query."""
    # Direct endpoint lookup
    resp1 = client.get("/api/kurals/1")
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["kural_number"] == 1
    assert "அகர முதல எழுத்தெல்லாம்" in data1["line_1_tamil"]
    assert "கடவுள் வாழ்த்து" in data1["chapter_name_tamil"]

    # Lookup Kural 619 (Effort pays bodily toil)
    resp619 = client.get("/api/kurals/619")
    assert resp619.status_code == 200
    data619 = resp619.json()
    assert data619["kural_number"] == 619
    assert "தெய்வத்தான் ஆகா தெனினும்" in data619["line_1_tamil"]
    assert "ஆள்வினை" in data619["chapter_name_tamil"]

def test_chat_query_specific_kural():
    """Test querying for a specific Kural via chat endpoint."""
    resp = client.post("/api/chat", json={"question": "What is Kural 619?"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True
    assert len(data["kurals"]) > 0
    assert data["kurals"][0]["kural_number"] == 619
    assert data["kurals"][0]["relevance_score"] == 1.0

def test_tamil_keyword_search():
    """Test semantic & keyword search with Tamil query."""
    resp = client.post("/api/chat", json={"question": "கோபத்தை எப்படி கட்டுப்படுத்துவது?", "language": "ta"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["language"] == "ta"
    assert len(data["kurals"]) > 0
    # Should retrieve Kurals from வெகுளாமை (Restraining Anger)
    top_chapters = [k["chapter_name_tamil"] for k in data["kurals"]]
    assert any("வெகுளாமை" in ch or "பொறை" in ch or "அடக்கம்" in ch for ch in top_chapters)
    assert data["grounded"] is True

def test_english_keyword_search():
    """Test search with English question on friendship."""
    resp = client.post("/api/chat", json={"question": "How do I choose good friends?", "language": "en"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["language"] == "en"
    assert len(data["kurals"]) > 0
    # Should retrieve Kurals on friendship (Friendship / Investigation in forming Friendships)
    top_chapters = [k["chapter_name_english"].lower() for k in data["kurals"]]
    assert any("friend" in ch or "natpu" in ch for ch in top_chapters)

def test_tanglish_question_handling():
    """Test question posed in Tanglish ('life la success aaga enna pannanum?')."""
    resp = client.post("/api/chat", json={"question": "life la success aaga enna pannanum?", "language": "auto"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["kurals"]) > 0
    # Should match Kurals on effort (ஆள்வினையுடைமை / Energy / Perseverance)
    kural_numbers = [k["kural_number"] for k in data["kurals"]]
    chapter_names = [k["chapter_name_english"].lower() for k in data["kurals"]]
    assert any("effort" in ch or "energy" in ch or "manly" in ch for ch in chapter_names) or any(611 <= n <= 620 for n in kural_numbers)

def test_no_match_gibberish_query():
    """Test querying gibberish where no Kural is relevant."""
    resp = client.post("/api/chat", json={"question": "xxyyzz qwertyasdfghjk 998877", "language": "en"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is False
    assert len(data["kurals"]) == 0
    assert "could not find" in data["answer"].lower() or "searched" in data["answer"].lower()

def test_ai_disabled_graceful_fallback():
    """Test that the application operates without paid API key with rich grounded explanation."""
    resp = client.post("/api/chat", json={"question": "How can I overcome failure?", "language": "en"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True
    assert len(data["answer"]) > 50
    assert data["practical_takeaway"] is not None
    assert len(data["practical_takeaway"]) > 20

def test_daily_kural_endpoint():
    """Test that daily Kural returns a valid complete record."""
    resp = client.get("/api/daily-kural")
    assert resp.status_code == 200
    data = resp.json()
    assert 1 <= data["kural_number"] <= 1330
    assert len(data["line_1_tamil"]) > 5
    assert len(data["line_2_tamil"]) > 5
    assert len(data["meaning_english"]) > 5
    assert len(data["meaning_tamil"]) > 5

def test_chapters_endpoint():
    """Test listing of all 133 chapters and divisions."""
    resp = client.get("/api/chapters")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_chapters"] == 133
    assert len(data["divisions"]) == 3
    assert len(data["chapters"]) == 133
    # Check first chapter
    assert data["chapters"][0]["number"] == 1
    assert data["chapters"][0]["name_tamil"] == "கடவுள் வாழ்த்து"
    assert data["chapters"][0]["start"] == 1
    assert data["chapters"][0]["end"] == 10

def test_greeting_and_introduction():
    """Test that greetings like 'hi' or 'hello' return an authentic warm welcome with Kural #1."""
    resp = client.post("/api/chat", json={"question": "hi"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True
    assert "SUBA" in data["answer"] or "சுபா" in data["answer"]
    assert len(data["kurals"]) > 0
    assert data["kurals"][0]["kural_number"] == 1

def test_thiruvalluvar_meta_question():
    """Test meta question 'who is thiruvalluvar?' returns comprehensive treatise overview."""
    resp = client.post("/api/chat", json={"question": "who is thiruvalluvar?"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True
    assert "1,330" in data["answer"] or "Thiruvalluvar" in data["answer"]
    assert len(data["kurals"]) > 0
    assert data["kurals"][0]["kural_number"] == 391

def test_health_and_diet_question():
    """Test health & diet query retrieves Chapter 95 (Medicine / மருந்து)."""
    resp = client.post("/api/chat", json={"question": "how to eat healthy and stay fit?"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True
    assert len(data["kurals"]) > 0
    assert any("medicine" in k["chapter_name_english"].lower() or "மருந்து" in k["chapter_name_tamil"] for k in data["kurals"])

def test_procrastination_question():
    """Test procrastination query retrieves Chapter 61 (Unsluggishness / மடி இன்மை)."""
    resp = client.post("/api/chat", json={"question": "I am procrastinating and feeling lazy"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True
    assert len(data["kurals"]) > 0
    assert any("sloth" in k["chapter_name_english"].lower() or "sluggish" in k["chapter_name_english"].lower() or "மடி" in k["chapter_name_tamil"] for k in data["kurals"])

def test_insult_forbearance_question():
    """Test dealing with insult retrieves Chapter 16 (Forbearance / பொறையுடைமை)."""
    resp = client.post("/api/chat", json={"question": "what should I do when someone insults me?"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True
    assert len(data["kurals"]) > 0
    assert any("patience" in k["chapter_name_english"].lower() or "forbearance" in k["chapter_name_english"].lower() or "பொறை" in k["chapter_name_tamil"] for k in data["kurals"])

def test_tanglish_with_tamil_preference():
    """Tanglish query with language='ta' must return answers in pure Tamil."""
    resp = client.post("/api/chat", json={"question": "Nan eppadi kovatha control panradhu?", "language": "ta"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True
    assert len(data["kurals"]) > 0
    # Must have Tamil answer and Tamil takeaway
    assert any("\u0B80" <= c <= "\u0BFF" for c in data["answer"])
    assert "வெகுளாமை" in data["answer"] or "சினம்" in data["answer"] or "பொறை" in data["answer"] or "கோபம்" in data["answer"]
    assert any("\u0B80" <= c <= "\u0BFF" for c in data["practical_takeaway"])

def test_tanglish_with_english_preference():
    """Tanglish query with language='en' must return answers in English."""
    resp = client.post("/api/chat", json={"question": "Nan eppadi kovatha control panradhu?", "language": "en"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True
    assert len(data["kurals"]) > 0
    assert "anger" in data["answer"].lower() or "forbearance" in data["answer"].lower() or "patience" in data["answer"].lower()
    assert "anger" in data["practical_takeaway"].lower() or "virtue" in data["practical_takeaway"].lower() or "effort" in data["practical_takeaway"].lower()

def test_tanglish_with_auto_preference_returns_both():
    """Tanglish query with language='auto' must deliver answers in BOTH Tamil and English."""
    resp = client.post("/api/chat", json={"question": "Nan eppadi kovatha control panradhu?", "language": "auto"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["grounded"] is True
    assert len(data["kurals"]) > 0
    # Must contain both Tamil script and English text in answer
    assert any("\u0B80" <= c <= "\u0BFF" for c in data["answer"])
    assert "English" in data["answer"] or "Thiruvalluvar" in data["answer"] or "anger" in data["answer"].lower()
    assert data["answer_tamil"] is not None
    assert data["answer_english"] is not None

def test_tts_audio_endpoint():
    """Test text-to-speech generation endpoint returns valid MP3 audio stream."""
    resp = client.get("/api/tts?text=அகர+முதல+எழுத்தெல்லாம்&language=ta")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/mpeg"
    assert len(resp.content) > 1000
