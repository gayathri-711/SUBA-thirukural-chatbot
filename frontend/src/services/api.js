// API Service for SUBA - Thirukkural AI Wisdom Chatbot

export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('suba_backend_api_url');
    if (saved && saved.trim()) {
      // If running on phone and saved URL is localhost, ignore it to prevent fetch failed
      const isRemoteHost = window.location && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      if (!(isRemoteHost && saved.includes('localhost'))) {
        return saved.trim().replace(/\/+$/, '');
      }
    }
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  // Use same-origin relative path so requests route through the Vite proxy seamlessly
  // without CORS or port 8000 firewall blocks
  if (typeof window !== 'undefined' && window.location) {
    return '/api';
  }
  return 'http://localhost:8000/api';
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
 * Helper for making typed fetch requests with error handling
 */
async function fetchJson(endpoint, options = {}) {
  const url = `${getApiBaseUrl()}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

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
    console.error(`API Error on ${endpoint}:`, err);
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
