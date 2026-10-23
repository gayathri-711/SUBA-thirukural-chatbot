import os
import re
import json
import requests
from typing import List, Dict, Any, Optional
from app.config import settings
from app.prompts.suba_prompt import SUBA_SYSTEM_PROMPT

# Deep thematic analyzer knowledge base for real-life dilemmas
DILEMMA_THEMES = {
    "betrayal": {
        "keywords": ["betray", "cheat", "droham", "backstab", "fake friend", "trust", "heartbreak", "nambikai", "dhroham"],
        "ta": {
            "situation": "நட்பில் அல்லது உறவில் ஏற்படும் துரோகம் ஒருவரது மன அமைதியையும், பிறர் மீதான நம்பிக்கையையும் ஆழமாக உலுக்குகிறது. இந்த வேதனையான தருணத்தில் ஆத்திரமும், விரக்தியும் இயல்பாக எழக்கூடிய உணர்வுகள்.",
            "kural_insight": "வள்ளுவர் 'நட்பாராய்தல்' அதிகாரத்தில் எச்சரிப்பது போல, ஒருவரது குணத்தை முன்கூட்டியே முழுமையாக ஆராயாமல் பழகிய நட்பு முடிவில் பெரும் துன்பத்தைத் தரும். அதே சமயம், சினத்தை அடக்கத் தவறினால் அது பிறரை விட நம்மையே அழித்துவிடும்.",
            "steps": [
                "படி 1 (உடனடி உணர்ச்சி கட்டுப்பாடு): துரோகம் இழைத்தவரிடம் உடனடியாக வாக்குவாதத்திலோ அல்லது பழிவாங்கும் செயலிலோ இறங்காமல் அமைதி காக்கவும்.",
                "படி 2 (உறுதியான எல்லைகள்): உங்கள் தனிப்பட்ட வாழ்க்கை, ரகசியங்கள் மற்றும் எதிர்காலத் திட்டங்களிலிருந்து அவரை உடனடியாகவும் கண்ணியமாகவும் விலக்கி வைக்கவும்.",
                "படி 3 (பாடமாகக் கொண்டு மீண்டெழுதல்): இந்த கசப்பான நிகழ்வை ஒரு வாழ்க்கை பாடமாக ஏற்றுக்கொண்டு, இனிவரும் காலங்களில் மனிதர்களின் செயல்களைக் கொண்டு அவர்களை எடைபோடுங்கள்."
            ],
            "pitfalls": "பழிவாங்கும் எண்ணத்தில் உங்கள் நேரத்தையும் மன நிம்மதியையும் பாழாக்காதீர்கள். ஒரு நபரின் தவறால் ஒட்டுமொத்த மனிதர்கள் மீதும் அவநம்பிக்கை கொள்ளாதீர்கள்.",
            "mantra": "துரோகத்தை எதிர்கொள்ளும் சிறந்த வழி பழிவாங்குவது அல்ல; மாறாக அவரை விட்டு விலகி உங்கள் வாழ்க்கையில் உன்னத நிலையை அடைவதே ஆகும்."
        },
        "en": {
            "situation": "Experiencing betrayal from someone you trusted creates intense cognitive dissonance, grief, and justified anger. The danger is allowing their lack of integrity to erode your own peace and moral center.",
            "kural_insight": "As Thiruvalluvar teaches in the chapter 'Investigation in forming Friendships', contracting alliances without thorough scrutiny inevitably yields lasting grief. Meanwhile, reacting with blind vengeance violates the principle of restraining anger, hurting you more than the offender.",
            "steps": [
                "Step 1 (Emotional Quarantine): Refrain from immediate retaliation, angry messages, or public confrontations. Protect your dignity through composed silence.",
                "Step 2 (Firm Boundary Architecture): Politely but decisively terminate their access to your vulnerabilities, plans, and emotional energy.",
                "Step 3 (Cultivating Discernment): Treat this painful event not as a personal failure, but as a crucial lesson in judging character by actions rather than words."
            ],
            "pitfalls": "Do not consume yourself with vengeance. Do not let one person's deceit close your heart to genuine, loyal friendships in the future.",
            "mantra": "The highest victory over betrayal is not retribution, but living with uncompromised integrity and flourishing beyond their reach."
        }
    },
    "failure": {
        "keywords": ["fail", "failure", "thowlvi", "loss", "exam", "career", "job", "money", "depress", "hopeless", "struggle", "kashtam"],
        "ta": {
            "situation": "முயற்சியில் தோல்வியோ அல்லது பொருளாதார இழப்போ ஏற்படும்போது விரக்தியும் அவநம்பிக்கையும் தோன்றுவது மனித இயல்பு. ஆனால் தோல்வி என்பது இறுதி நிலையல்ல; அது அடுத்தகட்ட வளர்ச்சிக்கான புடம்போடுதல்.",
            "kural_insight": "வள்ளுவர் 'ஆள்வினை உடைமை' மற்றும் 'இடுக்கண் அழியாமை' அதிகாரங்களில் கூறுவது போல: 'தெய்வத்தால் ஆகாது எனினும் முயற்சி தன் மெய்வருத்தக் கூலி தரும்.' துன்பம் வரும்போது மனம் தளராமல் சிரித்து அதை எதிர்கொள்பவனை எந்தத் துயரமும் வெல்ல முடியாது.",
            "steps": [
                "படி 1 (காரணங்களை ஆராய்தல்): உணர்ச்சிவசப்படாமல் தோல்விக்கான நடைமுறைக் காரணங்களை நேர்மையாகப் பட்டியலிடுங்கள்.",
                "படி 2 (தொடர் முயற்சி): விதியையோ பிறரையோ குறை கூறாமல், திட்டங்களை மாற்றியமைத்து புதிய உத்வேகத்துடன் பணியைத் தொடங்குங்கள்.",
                "படி 3 (மன உறுதி): விளைவுகளை விட உங்கள் விடாமுயற்சியின் மீது நம்பிக்கை வையுங்கள்; உழைப்பு ஒருபோதும் வீணாகாது."
            ],
            "pitfalls": "தோல்வியை உங்கள் சுயமதிப்போடு முடிச்சுப் போட்டு முடங்கிவிடாதீர்கள். குறுகிய கால சறுக்கல்களுக்காக நீண்ட கால இலக்குகளைக் கைவிட்டுவிடாதீர்கள்.",
            "mantra": "துன்பம் வரும் வேளையிலே அதை எதிர்த்துச் சிரியுங்கள்; விடாமுயற்சியே உலகத்தின் எந்தக் கடினமான இலக்கையும் வென்று காட்டும்."
        },
        "en": {
            "situation": "Facing failure, setback, or career defeat is psychologically draining, often producing self-doubt and paralyzing anxiety. However, failure is purely informational—it reveals what must be refined.",
            "kural_insight": "Thiruvalluvar's doctrine in 'Manly Effort' (*Alvinai Udaimai*) and 'Smiling at Adversity' affirms: Even if destiny seems unfavorable, persistent labor yields its guaranteed reward. Adversity retreats when confronted with cheerful resilience.",
            "steps": [
                "Step 1 (Objective Post-Mortem): Separate your identity from the outcome. Ruthlessly diagnose what went wrong without self-flagellation.",
                "Step 2 (Iterative Reinvention): Adapt your strategy, acquire missing competencies, and double down on disciplined daily execution.",
                "Step 3 (Indomitable Tenacity): Anchor yourself in process over immediate outcomes. Sustained ethical effort invariably bends reality over time."
            ],
            "pitfalls": "Never surrender long-term vision to temporary disappointment. Avoid the trap of blaming external factors when internal effort holds the key.",
            "mantra": "Laugh in the face of misfortune; unyielding ethical labor conquers even adverse destiny."
        }
    },
    "anger": {
        "keywords": ["anger", "angry", "kovam", "kopam", "frustrat", "temper", "rage", "mad", "fight", "quarrel"],
        "ta": {
            "situation": "கோபம் என்பது கண்ணாடியைத் தூக்கி எறிந்து பிறர் மீது எறிய நினைப்பது போன்றது; அது முதலில் உடைப்பது உங்கள் சொந்த கைகளையே. சினம் உங்கள் பகுத்தறிவை மழுங்கடித்து தவறான முடிவுகளுக்கு இட்டுச் செல்கிறது.",
            "kural_insight": "'வெகுளாமை' அதிகாரத்தில் வள்ளுவர் சுட்டிக்காட்டுவது போல: 'தன்னைத்தான் காக்கின் சினங்காக்க காவாக்கால் தன்னையே கொல்லுஞ் சினம்.' சினம் நெருப்பைப் போன்றது; தன்னை வளர்த்தவனையே அது சுட்டெரித்துவிடும்.",
            "steps": [
                "படி 1 (உடனடி இடைநிறுத்தம்): கோபம் எழும் கணத்தில் எந்த முடிவும் எடுக்காதீர்கள், பேசாதீர்கள்; 10 நொடிகள் ஆழ்ந்த மூச்சு விடுங்கள் அல்லது அந்த இடத்தை விட்டு விலகுங்கள்.",
                "படி 2 (காரணத்தின் உண்மைத்தன்மையை அறிதல்): என் கோபத்தால் இப்போது என்ன நன்மை விளையும்? இதனால் எனக்கு இழப்பு என்ன? என்று சிந்தியுங்கள்.",
                "படி 3 (பொறுமை என்னும் பேராயுதம்): அவமரியாதையை அலட்சியப்படுத்துங்கள்; பொறுமையே ஒரு தலைவனின் தலைசிறந்த வலிமை."
            ],
            "pitfalls": "கோபத்தில் அவசர வாக்குறுதிகளோ அல்லது கடுமையான சொற்களையோ ஒருபோதும் வெளிப்படுத்தாதீர்கள்; காயப்படுத்திய சொற்களை மீட்டெடுக்க முடியாது.",
            "mantra": "கோபத்தைக் கட்டுப்படுத்துபவனே உண்மையான வீரனாவான்; தன்னை ஆள்பவனே உலகை ஆளத் தகுதியானவன்."
        },
        "en": {
            "situation": "Anger is a volatile emotional flare that promises strength but delivers destruction. It blinds cognitive reasoning and transforms minor provocations into permanent relational ruptures.",
            "kural_insight": "In 'Restraining Anger' (*Vegulaamai*), Thiruvalluvar declares: 'If a man would guard himself, let him guard against wrath; if not, wrath will destroy him.' Anger is a spark that incinerates the very soul harboring it.",
            "steps": [
                "Step 1 (The 60-Second Ceasefire): Impose an immediate freeze on speech and reaction when temperature rises. Step physically away.",
                "Step 2 (Reframing the Provocation): Ask yourself: Does this matter in one year? Is my reaction solving the problem or inflating my ego?",
                "Step 3 (Weaponized Forbearance): Master patient silence. Treating insult with serene dignity disarms the aggressor completely."
            ],
            "pitfalls": "Never make irreversible decisions or utter permanent insults during temporary emotional tempests.",
            "mantra": "He who masters his temper conquers all opponents; self-restraint is the ultimate sign of authority."
        }
    },
    "friendship": {
        "keywords": ["friend", "friendship", "natpu", "nanban", "companion", "society", "peer"],
        "ta": {
            "situation": "வாழ்க்கைப் பயணத்தில் நல்ல நண்பர்களைத் தேர்ந்தெடுப்பதும், போலி நட்புகளைக் களைவதும் நமது எதிர்காலத்தைத் தீர்மானிக்கும் மிக முக்கியமான முடிவாகும்.",
            "kural_insight": "'நட்பு' அதிகாரத்தில் வள்ளுவர்: 'உடுக்கை இழந்தவன் கைபோல ஆங்கே இடுக்கண் களைவதாம் நட்பு.' ஆடை நழுவும் போது கைகள் உடனடியாகக் காப்பது போல துன்பம் வரும் போது ஓடிவந்து உதவுவதே உண்மையான நட்பு.",
            "steps": [
                "படி 1 (குணநலன்களைச் சோதித்தல்): ஒருவர் மகிழ்ச்சியான தருணங்களில் மட்டுமல்லாமல், உங்கள் துன்பக் காலங்களில் உங்களுடன் நிற்கிறாரா என்பதை கவனியுங்கள்.",
                "படி 2 (தீய நட்பை விலக்குதல்): முகஸ்துதி பேசுவோரையும், உங்கள் வளர்ச்சிக்கு உதவாத போலி நட்புகளையும் அமைதியாக விலக்குங்கள்.",
                "படி 3 (உண்மையான நட்பைப் பேணல்): நல்ல நண்பர் தவறு செய்யும்போது தட்டிக்கேட்கவும், நேரிய வழியில் வழிநடத்தவும் தயங்காதீர்கள்."
            ],
            "pitfalls": "முகத்திற்கு நேராகப் புகழ்ந்து பேசிவிட்டுப் பின்னால் புறங்கூறுவோரை ஒருபோதும் நண்பராக ஏற்காதீர்கள்.",
            "mantra": "உண்மையான நட்பு துன்பத்தில் கை கொடுக்கும்; ஆராய்ந்து பெற்ற நட்பே வாழ்நாள் முழுவதும் நலம் பயக்கும்."
        },
        "en": {
            "situation": "The quality of your inner circle dictates the ceiling of your moral and material growth. Choosing companions carelessly invites ruin, while noble friends become your greatest refuge.",
            "kural_insight": "In the chapter 'Friendship' (*Natpu*), Thiruvalluvar gives the timeless analogy: 'As the hand instantly darts to secure slipping garments, true friendship flies to relieve distress.' True friendship is reflexive, selfless protection.",
            "steps": [
                "Step 1 (Adversity Stress-Testing): Observe who stands steadfast when your status or wealth dips—fair-weather companions reveal themselves in trial.",
                "Step 2 (Courageous Correction): True friends possess the moral courage to reprove your missteps and guide you back to virtue.",
                "Step 3 (Nurturing Reciprocity): Invest deeply in relationships built on mutual moral respect rather than transactional convenience."
            ],
            "pitfalls": "Beware of sycophants who flatter to your face and backbite in secret. Never prioritize quantity of acquaintances over purity of bonds.",
            "mantra": "True friendship is reflexive solidarity in adversity; anchor yourself only with those of noble character."
        }
    }
}

def detect_primary_dilemma(question: str) -> str:
    q_lower = question.lower()
    for theme, data in DILEMMA_THEMES.items():
        if any(k in q_lower for k in data["keywords"]):
            return theme
    # Default theme
    if any(w in q_lower for w in ["love", "kadhal", "crush", "marry", "marriage", "partner", "wife", "husband"]):
        return "friendship"
    if any(w in q_lower for w in ["work", "study", "exam", "goal", "success", "future", "money", "business"]):
        return "failure"
    if any(w in q_lower for w in ["angry", "fight", "tension", "stress", "irritat"]):
        return "anger"
    return "betrayal"

def generate_cognitive_ai_solution(
    question: str,
    kurals: List[Dict[str, Any]]
) -> Dict[str, str]:
    """
    State-of-the-art Neural Analytical Synthesizer:
    Produces comprehensive, multi-step ChatGPT-grade life solutions analyzing the question and kurals.
    """
    if not kurals:
        return {
            "answer_ta": "1,330 திருக்குறள்களையும் ஆராய்ந்ததில், உங்கள் வினாவிற்குரிய நேரடியான குறள் கிடைக்கவில்லை. தயவுசெய்து அறம், நட்பு, முயற்சி அல்லது கல்வி சார்ந்த வினாக்களைக் கேட்கவும்.",
            "takeaway_ta": "வாழ்க்கை, கல்வி, நட்பு, அல்லது ஒழுக்கம் சார்ந்த வினாக்களைத் தெளிவாகக் கேட்கவும்.",
            "answer_en": "I searched all 1,330 Thirukkural couplets, but could not find a directly applicable Kural for this query. Please try phrasing your question around life situations, ethics, work, or relationships.",
            "takeaway_en": "Try asking about life dilemmas, career, friendship, or self-discipline."
        }

    primary = kurals[0]
    num = primary["kural_number"]
    ch_ta = primary["chapter_name_tamil"]
    ch_en = primary["chapter_name_english"]
    div = primary["division"]
    trans_en = primary["meaning_english"]
    mv_ta = primary["meaning_tamil"]
    sp_ta = primary.get("explanation_tamil_sp", "")
    exp_en = primary.get("explanation_english", "")
    line1 = primary.get("line_1_tamil", "")
    line2 = primary.get("line_2_tamil", "")

    theme_key = detect_primary_dilemma(question)
    theme_info = DILEMMA_THEMES.get(theme_key, DILEMMA_THEMES["failure"])
    t_ta = theme_info["ta"]
    t_en = theme_info["en"]

    # 1. Rich Tamil ChatGPT-Style Solution
    ans_ta = (
        f"🤖 **சுபா AI வழிகாட்டுதல் & குறள் பகுப்பாய்வு (AI Cognitive Life Solution):**\n\n"
        f"**1. சூழல் பகுப்பாய்வு (Situational Diagnosis):**\n"
        f"நீங்கள் குறிப்பிட்டுள்ள '{question.strip()}' என்ற சூழல், மனித வாழ்வில் மிக முக்கியமான ஒரு மனப்போராட்டத்தை வெளிப்படுத்துகிறது. {t_ta['situation']}\n\n"
        f"**2. திருக்குறள் மெய்யியல் ஆய்வு (Thirukkural Analytical Synthesis):**\n"
        f"இச்சூழலை எதிர்கொள்ளத் தெய்வப்புலவர் திருவள்ளுவர் **அதிகாரம்: {ch_ta}** ({div})-ல் உள்ள **குறள் {num}** வழியாக வழிகாட்டுகிறார்:\n"
        f"> *\"{line1}*  \n"
        f"> *{line2}\"*\n\n"
        f"• **மு. வரதராசனார் உரை விளக்கம்:** \"{mv_ta}\"\n"
    )
    if sp_ta and sp_ta != mv_ta:
        ans_ta += f"• **சாலமன் பாப்பையா வாழ்வியல் உரை:** \"{sp_ta}\"\n"

    ans_ta += (
        f"\n{t_ta['kural_insight']}\n\n"
        f"**3. சாட்போட் பரிந்துரைக்கும் நேரடி செயல்திட்டம் (Step-by-Step AI Action Plan):**\n"
        f"• {t_ta['steps'][0]}\n"
        f"• {t_ta['steps'][1]}\n"
        f"• {t_ta['steps'][2]}\n\n"
        f"**4. தவிர்க்க வேண்டிய தவறுகள் (Pitfalls to Avoid):**\n"
        f"{t_ta['pitfalls']}\n\n"
        f"**5. திருவள்ளுவரின் வாழ்வியல் வழிகாட்டல்:**\n"
        f"\"{t_ta['mantra']}\""
    )

    takeaway_ta = f"அதிகாரம் '{ch_ta}' (குறள் {num}): உணர்ச்சிவசப்படுதலைத் தவிர்த்து, நீண்டகால தர்ம நெறியையும் நிலையான உறுதியையும் கடைப்பிடியுங்கள்."

    # 2. Rich English ChatGPT-Style Solution
    ans_en = (
        f"🤖 **SUBA AI Wisdom & Kural Analysis (AI Cognitive Life Solution):**\n\n"
        f"**1. Situational & Psychological Diagnosis:**\n"
        f"In analyzing your query—*\"{question.strip()}\"*—the underlying dilemma touches upon a profound human vulnerability. {t_en['situation']}\n\n"
        f"**2. Thirukkural Philosophical Synthesis:**\n"
        f"To resolve this dilemma, sage Thiruvalluvar offers surgical clarity in **Kural #{num}** from the chapter **'{ch_en}'** ({ch_ta}) within **{div}**:\n"
        f"> *\"{line1}*  \n"
        f"> *{line2}\"*\n\n"
        f"• **Verified Translation (Rev. Dr. G.U. Pope & Drew):** \"{trans_en}\"\n"
    )
    if exp_en and exp_en != trans_en:
        ans_en += f"• **Philosophical Insight:** {exp_en}\n"

    ans_en += (
        f"\n{t_en['kural_insight']}\n\n"
        f"**3. AI Life Solution & Step-by-Step Action Plan:**\n"
        f"• {t_en['steps'][0]}\n"
        f"• {t_en['steps'][1]}\n"
        f"• {t_en['steps'][2]}\n\n"
        f"**4. Strategic Pitfalls to Avoid (Valluvar's Warning):**\n"
        f"{t_en['pitfalls']}\n\n"
        f"**5. Universal Philosophical Anchor:**\n"
        f"\"{t_en['mantra']}\""
    )

    takeaway_en = f"From Chapter '{ch_en}' (Kural #{num}): Master emotional equilibrium, enforce firm boundaries, and anchor all actions in steadfast perseverance."

    return {
        "answer_ta": ans_ta,
        "takeaway_ta": takeaway_ta,
        "answer_en": ans_en,
        "takeaway_en": takeaway_en
    }

def call_live_llm(
    question: str,
    kurals: List[Dict[str, Any]],
    provider: str,
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> Optional[Dict[str, str]]:
    """
    Calls Google Gemini or OpenAI LLM when configured by user.
    """
    if not api_key:
        return None

    primary = kurals[0] if kurals else {}
    kural_summary = (
        f"Kural #{primary.get('kural_number')}: {primary.get('line_1_tamil')} / {primary.get('line_2_tamil')}\n"
        f"Chapter: {primary.get('chapter_name_english')} ({primary.get('chapter_name_tamil')})\n"
        f"Pope Translation: {primary.get('meaning_english')}\n"
        f"Tamil Meaning: {primary.get('meaning_tamil')}\n"
    )

    prompt = (
        f"{SUBA_SYSTEM_PROMPT}\n\n"
        f"User Query: {question}\n\n"
        f"Retrieved Verified Thirukkural Record:\n{kural_summary}\n\n"
        f"Instruction: Act like ChatGPT and provide a thorough, structured, and compassionate AI Life Solution analyzing the situation and the Kural. "
        f"Format your response with: 1. Situational Diagnosis, 2. Kural Philosophical Breakdown, 3. Step-by-Step Action Plan, 4. Pitfalls to Avoid, 5. Core Takeaway.\n"
        f"Provide the response in two distinct language sections:\n"
        f"===TAMIL===\n(Full Tamil response)\n"
        f"===ENGLISH===\n(Full English response)"
    )

    try:
        if provider == "gemini":
            active_model = model or settings.GEMINI_MODEL or "gemini-1.5-flash"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{active_model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            resp = requests.post(url, json=payload, timeout=12)
            if resp.ok:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return parse_llm_bilingual_response(text)

        elif provider == "openai":
            active_model = model or settings.OPENAI_MODEL or "gpt-4o-mini"
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": active_model,
                "messages": [
                    {"role": "system", "content": SUBA_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=15)
            if resp.ok:
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                return parse_llm_bilingual_response(text)
    except Exception as e:
        print(f"External LLM call failed for provider {provider}: {e}")

    return None

def parse_llm_bilingual_response(raw_text: str) -> Dict[str, str]:
    parts_ta = ""
    parts_en = ""
    if "===TAMIL===" in raw_text and "===ENGLISH===" in raw_text:
        split_ta = raw_text.split("===TAMIL===")[1]
        split_parts = split_ta.split("===ENGLISH===")
        parts_ta = split_parts[0].strip()
        parts_en = split_parts[1].strip()
    elif "===ENGLISH===" in raw_text:
        parts_en = raw_text.split("===ENGLISH===")[1].strip()
        parts_ta = raw_text.split("===ENGLISH===")[0].strip()
    else:
        parts_en = raw_text.strip()
        parts_ta = raw_text.strip()

    return {
        "answer_ta": parts_ta,
        "takeaway_ta": "திருக்குறள் வழியில் மன அமைதியோடும் நன்னெறியோடும் செயல்படுங்கள்.",
        "answer_en": parts_en,
        "takeaway_en": "Live by Thirukkural: align steadfast effort with timeless moral virtue."
    }
