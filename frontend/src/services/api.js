// API Service for SUBA - Thirukkural AI Wisdom Chatbot

export const DEFAULT_MOBILE_API_URL = 'http://192.168.0.9:8000/api';

/**
 * Checks if running inside an Android APK (Capacitor or Expo WebView)
 */
export function isMobileApp() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    window.Capacitor !== undefined ||
    window.ReactNativeWebView !== undefined ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.location.hostname === 'localhost' && !['5173', '3000'].includes(window.location.port))
  );
}

export function getApiBaseUrl() {
  // 1. User configured custom URL from Settings modal
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('suba_backend_api_url');
    if (saved && saved.trim()) {
      const clean = saved.trim().replace(/\/+$/, '');
      // If running on phone and saved URL is localhost without port, don't use it
      if (isMobileApp() && (clean === 'http://localhost' || clean === 'https://localhost')) {
        // invalid for physical phone
      } else {
        return clean;
      }
    }
  }

  // 2. Build-time environment variable (e.g. from frontend/.env)
  if (import.meta.env?.VITE_API_BASE_URL) {
    const envUrl = import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '');
    if (envUrl) return envUrl;
  }

  // 3. Browser environment check
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, port, protocol } = window.location;

    // Inside mobile APK / Capacitor: NEVER return relative '/api' which points to phone's localhost
    if (isMobileApp() || protocol === 'capacitor:' || protocol === 'ionic:') {
      return DEFAULT_MOBILE_API_URL;
    }

    // Local Vite dev server on computer (port 5173 or 3000) -> use proxy
    if ((port === '5173' || port === '3000') && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return '/api';
    }

    // Remote LAN browser access (e.g. http://192.168.0.9:5173)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:8000/api`;
    }
  }

  return DEFAULT_MOBILE_API_URL;
}

export function setCustomApiBaseUrl(url) {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (url && url.trim()) {
      localStorage.setItem('suba_backend_api_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('suba_backend_api_url');
    }
  }
}

/**
 * Helper for making typed fetch requests with timeout and meaningful error handling
 */
async function fetchJson(endpoint, options = {}, timeoutMs = 15000) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      signal: controller.signal,
      ...options
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch (e) {
        // use default errorMsg
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`API Error on ${endpoint}:`, err);

    if (err.name === 'AbortError') {
      throw new Error(
        `நேரம் கடந்துவிட்டது (${timeoutMs / 1000}s). சர்வர் பதிலளிக்கவில்லை.\nRequest timed out. Please check your backend connection at ${baseUrl}`
      );
    }

    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      throw new Error(
        `சர்வர் இணைப்பு தோல்வி (Failed to connect).\n\nசேவையக முகவரி: ${baseUrl}\n\n1. கணினியில் backend இயங்குகிறதா என உறுதிப்படுத்தவும் (start_backend.bat).\n2. மொபைலும் கணினியும் ஒரே Wi-Fi இல் உள்ளனவா எனப் பார்க்கவும்.\n3. அமைப்புகள் (⚙️) சென்று உங்கள் கணினியின் IP-ஐ உள்ளிடவும்.`
      );
    }

    throw err;
  }
}

export const api = {
  // Health & Database status
  getHealth: () => fetchJson('/health'),

  // Chat with SUBA (RAG retrieval & answer generation with ChatGPT-style AI solution)
  sendChatMessage: (question, language = 'auto', top_k = 3, aiConfig = {}) =>
    fetchJson('/chat', {
      method: 'POST',
      body: JSON.stringify({
        question,
        language,
        top_k,
        ai_provider: aiConfig.provider || 'auto',
        api_key: aiConfig.apiKey || null,
        ai_model: aiConfig.model || null
      })
    }),

  // AI Model status & connection testing
  getAiStatus: () => fetchJson('/ai/status'),
  testAiProvider: (provider, apiKey, model = null) =>
    fetchJson('/ai/test', {
      method: 'POST',
      body: JSON.stringify({ provider, api_key: apiKey, model })
    }),

  // Browse all Kurals with filters & pagination
  getKurals: ({ page = 1, limit = 20, division = '', chapter_number = null, search = '' } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (division) params.append('division', division);
    if (chapter_number) params.append('chapter_number', chapter_number);
    if (search) params.append('search', search);
    return fetchJson(`/kurals?${params.toString()}`);
  },

  // Get specific Kural by number (1 to 1330)
  getKuralByNumber: (kuralNumber) => fetchJson(`/kurals/${kuralNumber}`),

  // Get deterministic Kural of the day
  getDailyKural: () => fetchJson('/daily-kural'),

  // List all 133 chapters and divisions
  getChapters: () => fetchJson('/chapters'),

  // Search Kurals
  searchKurals: (query, limit = 5) => {
    const params = new URLSearchParams({ q: query, limit });
    return fetchJson(`/search?${params.toString()}`);
  },

  // Get related Kurals
  getRelatedKurals: (kuralNumber) => fetchJson(`/kurals/${kuralNumber}/related`),

  // Translate content on demand
  translateText: (text, target_language = 'ta', kural_number = null) =>
    fetchJson('/translate', {
      method: 'POST',
      body: JSON.stringify({ text, target_language, kural_number })
    }),

  // Submit response feedback
  submitFeedback: (payload) =>
    fetchJson('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Get TTS streaming audio URL (for shorter texts)
  getTtsAudioUrl: (text, language = 'ta') =>
    `${getApiBaseUrl()}/tts?text=${encodeURIComponent(text)}&language=${language}`,

  // Fetch full TTS audio blob via POST (handles long couplet recitals and full definitions without URL limit)
  fetchTtsAudioBlob: async (text, language = 'ta') => {
    const res = await fetch(`${getApiBaseUrl()}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, language })
    });
    if (!res.ok) {
      throw new Error(`TTS server error (${res.status})`);
    }
    return await res.blob();
  }
};

export default api;
