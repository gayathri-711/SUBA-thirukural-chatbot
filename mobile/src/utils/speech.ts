import * as Speech from 'expo-speech';

export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/[*_#~`>]+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[-=—_]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function speakText(text: string, language = 'ta'): Promise<void> {
  try {
    await Speech.stop();
    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    // Detect language if auto
    let voiceLang = 'ta-IN';
    if (language === 'en' || language === 'english') {
      voiceLang = 'en-US';
    } else if (language === 'ta' || language === 'tamil') {
      voiceLang = 'ta-IN';
    } else {
      const tamilChars = (clean.match(/[\u0B80-\u0BFF]/g) || []).length;
      const totalChars = (clean.match(/[a-zA-Z\u0B80-\u0BFF]/g) || []).length;
      voiceLang = (totalChars > 0 && tamilChars / totalChars > 0.3) ? 'ta-IN' : 'en-US';
    }

    Speech.speak(clean, {
      language: voiceLang,
      pitch: 1.0,
      rate: 0.95,
    });
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

export async function stopSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch (err) {
    console.warn('Speech stop error:', err);
  }
}

export async function isSpeaking(): Promise<boolean> {
  return await Speech.isSpeakingAsync();
}
