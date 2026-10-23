import os
import re
import hashlib
import io
from fastapi import APIRouter, Query, HTTPException, Response
from pydantic import BaseModel
from typing import Optional
from gtts import gTTS

router = APIRouter(prefix="/api/tts", tags=["tts"])

# Create audio cache directory
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "cache", "tts_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "ta"

def clean_text_for_speech(raw: str) -> str:
    """
    Cleans markdown, emojis, asterisks, and structural markers for smooth, natural speech.
    """
    if not raw:
        return ""
    # Strip markdown bold, italics, bullets, links
    text = re.sub(r'[*_#~`>]+', ' ', raw)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Strip emojis
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)
    # Strip repetitive dashes or dividers
    text = re.sub(r'[-=—_]{2,}', ' ', text)
    # Clean whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def generate_or_get_cached_audio(text: str, language: str) -> bytes:
    clean = clean_text_for_speech(text)
    if not clean:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # Generous limit to ensure full Kural, both commentaries, and complete definition are spoken without cut-off
    if len(clean) > 4000:
        clean = clean[:4000]

    # Explicit language preference takes strict precedence
    req_lang = (language or "auto").strip().lower()
    if req_lang in ("en", "english"):
        lang = "en"
        # For pure English audio, sanitize out stray Tamil script so English TTS voice is clean
        sanitized = re.sub(r'[\u0B80-\u0BFF]+', '', clean).strip()
        clean = sanitized if sanitized else "Thirukkural wisdom and ethical guidance."
    elif req_lang in ("ta", "tamil"):
        lang = "ta"
        # For pure Tamil audio, if text is valid Tamil, use it
        sanitized = clean.strip()
        clean = sanitized if sanitized else "திருக்குறள் வாழ்வியல் நல்வழிகாட்டல்."
    else:
        # Auto mode: check script balance
        tamil_chars = len(re.findall(r'[\u0B80-\u0BFF]', clean))
        total_letters = len(re.findall(r'[a-zA-Z\u0B80-\u0BFF]', clean))
        lang = "ta" if total_letters > 0 and (tamil_chars / total_letters) > 0.3 else "en"

    cache_key = hashlib.md5(f"{lang}:{clean}".encode("utf-8")).hexdigest()
    cache_path = os.path.join(CACHE_DIR, f"{cache_key}.mp3")

    if os.path.exists(cache_path):
        with open(cache_path, "rb") as f:
            return f.read()

    try:
        fp = io.BytesIO()
        tts = gTTS(text=clean, lang=lang, slow=False)
        tts.write_to_fp(fp)
        audio_bytes = fp.getvalue()

        # Save to disk cache
        try:
            with open(cache_path, "wb") as f:
                f.write(audio_bytes)
        except Exception as e:
            print("Failed to cache audio file:", e)

        return audio_bytes
    except Exception as e:
        print(f"TTS generation error for lang={lang}: {e}")
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")

@router.get("")
def stream_tts_get(
    text: str = Query(..., description="Text to speak"),
    language: str = Query("ta", description="Language code ('ta' or 'en')")
):
    """
    Streams synthesized MP3 audio for speech synthesis.
    """
    audio_bytes = generate_or_get_cached_audio(text, language)
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": "inline; filename=speech.mp3"
        }
    )

@router.post("")
def stream_tts_post(req: TTSRequest):
    """
    Generates synthesized MP3 audio from POST payload.
    """
    audio_bytes = generate_or_get_cached_audio(req.text, req.language or "ta")
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": "inline; filename=speech.mp3"
        }
    )
