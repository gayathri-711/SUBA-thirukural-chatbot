// Audio Player & Voice Utilities for SUBA (Thirukkural Wisdom Chatbot)
import api from '../services/api';

let activeAudioInstance = null;

/**
 * Strips markdown symbols, asterisks, brackets, and emojis from text for clean speech synthesis
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/[*_#~`>]+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[-=—_]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Plays text audio using the backend TTS streaming endpoint with Web Speech API fallback.
 */
export function playTextAudio({ text, language = 'ta', onStart, onEnd, onError }) {
  stopAllAudio();

  const clean = cleanTextForSpeech(text);
  if (!clean) {
    if (onEnd) onEnd();
    return { stop: () => {} };
  }

  // Explicit language preference takes strict precedence
  let targetLang = 'en';
  if (language === 'ta' || language === 'tamil') {
    targetLang = 'ta';
  } else if (language === 'en' || language === 'english') {
    targetLang = 'en';
  } else {
    // Auto mode: check character distribution
    const tamilChars = (clean.match(/[\u0B80-\u0BFF]/g) || []).length;
    const totalChars = (clean.match(/[a-zA-Z\u0B80-\u0BFF]/g) || []).length;
    targetLang = (totalChars > 0 && tamilChars / totalChars > 0.3) ? 'ta' : 'en';
  }

  // If targetLang is English, remove any stray Tamil script to keep the English voice pure and natural
  let speechText = clean;
  if (targetLang === 'en') {
    const enOnly = clean.replace(/[\u0B80-\u0BFF]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (enOnly) {
      speechText = enOnly;
    }
  }

  // Keep full speech text (up to 3500 chars) so full Kural and full definition are explained
  const fullSpeechText = speechText.slice(0, 3500);

  let isCancelled = false;
  let currentBlobUrl = null;

  const controller = {
    stop: () => {
      isCancelled = true;
      if (activeAudioInstance) {
        try {
          activeAudioInstance.pause();
          activeAudioInstance.currentTime = 0;
        } catch {}
        activeAudioInstance = null;
      }
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
        currentBlobUrl = null;
      }
      if (onEnd) onEnd();
    }
  };

  // Attempt to fetch full audio via POST first (handles long texts without URL character limits)
  api.fetchTtsAudioBlob(fullSpeechText, targetLang)
    .then((blob) => {
      if (isCancelled) return;
      currentBlobUrl = URL.createObjectURL(blob);
      const audio = new Audio(currentBlobUrl);
      activeAudioInstance = audio;

      audio.onplay = () => {
        if (!isCancelled && onStart) onStart();
      };

      audio.onended = () => {
        if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl);
          currentBlobUrl = null;
        }
        activeAudioInstance = null;
        if (!isCancelled && onEnd) onEnd();
      };

      audio.onerror = (e) => {
        console.warn('Blob audio play failed, trying fallback:', e);
        if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl);
          currentBlobUrl = null;
        }
        activeAudioInstance = null;
        if (!isCancelled) {
          fallbackSpeechSynthesis(fullSpeechText, targetLang, onStart, onEnd, onError);
        }
      };

      audio.play().catch((err) => {
        console.warn('Audio play prevented or failed:', err);
        if (!isCancelled) {
          fallbackSpeechSynthesis(fullSpeechText, targetLang, onStart, onEnd, onError);
        }
      });
    })
    .catch((err) => {
      console.warn('POST TTS request failed, attempting fallback speech:', err);
      if (!isCancelled) {
        fallbackSpeechSynthesis(fullSpeechText, targetLang, onStart, onEnd, onError);
      }
    });

  return controller;
}

/**
 * Native Browser Web Speech Synthesis Fallback
 */
function fallbackSpeechSynthesis(text, lang, onStart, onEnd, onError) {
  if (!('speechSynthesis' in window)) {
    if (onError) onError(new Error('Speech synthesis not supported in this browser'));
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Select appropriate voice based on language
  const voices = window.speechSynthesis.getVoices();
  if (lang === 'ta') {
    const taVoice = voices.find((v) => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil'));
    if (taVoice) utterance.voice = taVoice;
  } else {
    const enVoice = voices.find((v) => (v.lang.startsWith('en') || v.lang.includes('US') || v.lang.includes('GB')) && !v.lang.includes('ta'));
    if (enVoice) utterance.voice = enVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = (err) => {
    if (onError) onError(err);
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stops any currently playing audio or speech
 */
export function stopAllAudio() {
  if (activeAudioInstance) {
    try {
      activeAudioInstance.pause();
      activeAudioInstance.currentTime = 0;
    } catch {}
    activeAudioInstance = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Speech Recognition Wrapper (Speech-to-Text)
 * Supports Tamil (ta-IN) and English (en-IN / en-US)
 */
export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
}

export function startSpeechRecognition({ language = 'ta', onResult, onError, onEnd }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (onError) onError(new Error('Speech recognition not supported'));
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  // Tamil ta-IN handles both formal Tamil and phonetic Tanglish exceptionally well
  recognition.lang = language === 'en' ? 'en-IN' : 'ta-IN';

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const part = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += (finalTranscript ? ' ' : '') + part;
      } else {
        interim += part;
      }
    }
    if (onResult) {
      onResult({
        final: finalTranscript.trim(),
        interim: interim.trim(),
        text: (finalTranscript + ' ' + interim).trim()
      });
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd(finalTranscript.trim());
  };

  try {
    recognition.start();
    return recognition;
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    if (onError) onError(err);
    return null;
  }
}
