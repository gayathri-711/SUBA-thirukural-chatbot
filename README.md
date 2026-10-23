# SUBA — AI-Powered Thirukkural Wisdom Chatbot (சுபா)

> **Discover timeless wisdom through all 1,330 Thirukkural couplets.**  
> A full-stack, retrieval-augmented intelligence application connecting ancient Tamil philosophical counsel with real-life modern dilemmas.

---

## 🌟 Key Highlights

- **100% Authentic Source Grounding**: SUBA answers questions exclusively using verified records from all **1,330 Thirukkural couplets** across **133 chapters** and **3 divisions (முப்பால்)**. It strictly avoids hallucinating verses or fabricating Kural numbers.
- **Multilingual & Tanglish Understanding**: Supports queries in **Tamil (தமிழ்)**, **English**, and conversational **Tanglish** (e.g., *"life la success aaga enna pannanum?"*, *"kovam control panna enna pannanum?"*).
- **Hybrid Semantic Retrieval (RAG)**: Combines Tamil character n-gram morphology with sublinear TF-IDF semantic embeddings, phonetic transliteration matching, and chapter thematic boosting.
- **Works 100% Out-of-the-Box**: Includes an intelligent built-in contextual wisdom synthesizer that requires **zero paid API keys** to run locally, with optional drop-in support for Gemini, OpenAI, or Ollama.
- **Complete Tamil Literary Commentaries**: Includes classic verified commentaries by **Dr. Mu. Varadarajan**, **Solomon Pappaiah**, **Kalaignar M. Karunanidhi**, and verified English translations by **Rev. Dr. G.U. Pope & Rev. W.H. Drew**.
- **Modern Tamil Aesthetic UI**: Designed with warm ivory/cream backgrounds (`#FAF6EE`), deep forest green (`#1B4332`), and muted gold accents (`#D4AF37`) with full Tamil Unicode typography.

---

## 🏛️ Project Architecture

```
thirukural chatbot/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint & middleware
│   │   ├── config.py                # Environment configuration
│   │   ├── database.py              # SQLAlchemy database engine & session
│   │   ├── models/kural.py          # Complete Kurals table schema (1,330 couplets)
│   │   ├── schemas/kural.py         # Pydantic request & response models
│   │   ├── routers/
│   │   │   ├── chat.py              # POST /api/chat & /api/feedback
│   │   │   ├── kurals.py            # GET /api/kurals, /api/daily-kural, /api/search
│   │   │   ├── chapters.py          # GET /api/chapters (133 chapters & divisions)
│   │   │   └── health.py            # GET /api/health
│   │   ├── services/
│   │   │   ├── retrieval.py         # Dual Tamil & English TF-IDF search engine
│   │   │   ├── tanglish.py          # Tanglish & spoken Tamil concept mapper
│   │   │   └── answer_generator.py  # Grounded answer synthesizer & LLM dispatcher
│   │   └── prompts/suba_prompt.py   # Strict source grounding system prompt
│   ├── scripts/
│   │   ├── import_kurals.py         # Pipeline importing all 1,330 couplets
│   │   └── validate_dataset.py      # Rigorous integrity check (1..1330 contiguous)
│   ├── tests/
│   │   └── test_kurals.py           # 10 automated pytest suites
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example                 # Example environment variables
│   └── kurals.db                    # SQLite database (auto-generated)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          # Collapsible responsive navigation drawer
│   │   │   ├── Header.jsx           # Topbar with direct Kural jump & language toggle
│   │   │   ├── ChatWindow.jsx       # Conversational interface with composer
│   │   │   ├── MessageBubble.jsx    # User & grounded AI chat bubbles
│   │   │   ├── KuralCard.jsx        # Rich Tamil verse card with action controls
│   │   │   ├── KuralModal.jsx       # Detailed modal with multi-commentator views
│   │   │   └── QuestionSuggestions.jsx # Quick starter prompt chips
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Main interactive chat page
│   │   │   ├── BrowseKurals.jsx     # Browse & filter all 1,330 Kurals with pagination
│   │   │   ├── DailyKural.jsx       # Deterministic calendar Kural of the Day
│   │   │   ├── SavedKurals.jsx      # Bookmarks stored in localStorage
│   │   │   ├── ChatHistory.jsx      # Conversation sessions history
│   │   │   └── About.jsx            # Philosophy, architecture & dataset credits
│   │   ├── services/api.js          # REST client communicating with FastAPI
│   │   ├── App.jsx                  # Main application container & state
│   │   └── index.css                # Custom scrollbars, Tamil typography, parchment cards
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── data/
│   ├── README.md                    # Data source and license documentation
│   ├── thirukkural.json             # Authentic raw dataset (all 1,330 couplets)
│   └── detail.json                  # Structural hierarchy (133 chapters, 3 divisions)
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+

---

### 2. Backend Setup

```bash
cd backend

# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment (defaults work out of the box with zero external keys)
cp .env.example .env

# 3. Import all 1,330 Kurals into the database
python scripts/import_kurals.py

# 4. Run the data validation script
python scripts/validate_dataset.py

# 5. Start the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend server will run at:
- **API Base**: `http://127.0.0.1:8000`
- **Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/health`

---

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🧪 Automated Testing

Run the automated test suite verifying all 10 core requirements:

```bash
python -m pytest backend/tests/test_kurals.py -v
```

### Verified Test Cases:
1. `test_database_contains_exactly_1330_kurals`: Checks count == 1,330, numbers 1 to 1330 contiguous with no gaps or duplicates, and all 133 chapters exist.
2. `test_known_kural_lookup`: Verifies exact database lookups for Kural #1 and Kural #619.
3. `test_chat_query_specific_kural`: Tests querying `"What is Kural 619?"` with 1.0 relevance.
4. `test_tamil_keyword_search`: Tests `"கோபத்தை எப்படி கட்டுப்படுத்துவது?"` matches *வெகுளாமை / Restraining Anger*.
5. `test_english_keyword_search`: Tests `"How do I choose good friends?"` matches *Friendship*.
6. `test_tanglish_question_handling`: Tests `"life la success aaga enna pannanum?"` matches *ஆள்வினை உடைமை / Manly Effort*.
7. `test_no_match_gibberish_query`: Verifies ungrounded gibberish queries return an empathetic notification without hallucinating fake Kurals.
8. `test_ai_disabled_graceful_fallback`: Verifies rich contextual explanations without requiring paid API keys.
9. `test_daily_kural_endpoint`: Tests deterministic daily Kural generation.
10. `test_chapters_endpoint`: Verifies all 133 chapters and 3 divisions are correctly formatted.

---

## 🤖 Optional AI Provider Configuration

By default, SUBA runs on its built-in **Contextual Grounded Synthesizer**, requiring **no paid API keys**. 

To connect an LLM for enhanced natural-language generation, edit `backend/.env`:

### Google Gemini:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### OpenAI:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

### Local Ollama:
```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

Regardless of whether an LLM is enabled, **all couplets, verified translations, and numbers are rendered directly from immutable database records**, strictly preventing AI hallucinations.

---

## 📜 Dataset & Licensing

- **Original Verses**: Classical Tamil literature authored by sage-poet **Thiruvalluvar** (Public Domain).
- **Translations & Commentaries**: 
  - Dr. Mu. Varadarajan (Scholar commentary)
  - Rev. Dr. G. U. Pope & Rev. W. H. Drew (Classic English translations)
  - Solomon Pappaiah (Conversational Tamil commentary)
  - Kalaignar M. Karunanidhi (Modern literary Tamil commentary)
- **Dataset Source**: Open-source repository `tk120404/thirukkural` under the **MIT License**.
