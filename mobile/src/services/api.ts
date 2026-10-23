import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatResponsePayload, Kural, Chapter } from '../types';

// Default to the host PC's reachable LAN IP on local Wi-Fi
export const DEFAULT_API_URL = 'http://192.168.0.9:8000/api';
const STORAGE_KEY_API_URL = 'suba_mobile_api_url';
const STORAGE_KEY_LANGUAGE = 'suba_mobile_language';
const STORAGE_KEY_SAVED_KURALS = 'suba_saved_kurals';
const STORAGE_KEY_CHAT_HISTORY = 'suba_chat_history';

export class ApiService {
  private static cachedUrl: string | null = null;

  static async getBaseUrl(): Promise<string> {
    if (this.cachedUrl) return this.cachedUrl;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_API_URL);
      if (stored && stored.trim()) {
        this.cachedUrl = stored.trim().replace(/\/+$/, '');
        return this.cachedUrl;
      }
    } catch (e) {
      console.warn('Error reading stored API URL:', e);
    }
    this.cachedUrl = DEFAULT_API_URL;
    return this.cachedUrl;
  }

  static async setBaseUrl(url: string): Promise<void> {
    const cleaned = url.trim().replace(/\/+$/, '');
    this.cachedUrl = cleaned;
    await AsyncStorage.setItem(STORAGE_KEY_API_URL, cleaned);
  }

  static async getLanguage(): Promise<string> {
    try {
      const lang = await AsyncStorage.getItem(STORAGE_KEY_LANGUAGE);
      return lang || 'auto';
    } catch {
      return 'auto';
    }
  }

  static async setLanguage(lang: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
  }

  private static async fetchWithTimeout(endpoint: string, options: RequestInit = {}, timeoutMs = 12000): Promise<any> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        signal: controller.signal,
        ...options
      });

      clearTimeout(timer);

      if (!res.ok) {
        let errorDetail = `Server error (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson.detail) errorDetail = errJson.detail;
        } catch {}
        throw new Error(errorDetail);
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Connection timed out after ${timeoutMs / 1000}s. Please verify your PC and phone are on the same Wi-Fi.`);
      }
      if (err.message && err.message.includes('Network request failed')) {
        throw new Error(`Cannot reach server at ${baseUrl}. Please ensure FastAPI is running and check your IP address in Settings.`);
      }
      throw err;
    }
  }

  static async checkHealth(): Promise<{ healthy: boolean; message: string; database?: any }> {
    try {
      const res = await this.fetchWithTimeout('/health', { method: 'GET' }, 5000);
      return { healthy: res.status === 'healthy', message: 'Backend connected successfully!', database: res.database };
    } catch (err: any) {
      return { healthy: false, message: err.message || 'Connection failed' };
    }
  }

  static async sendChatMessage(question: string, language = 'auto', top_k = 3): Promise<ChatResponsePayload> {
    return await this.fetchWithTimeout('/chat', {
      method: 'POST',
      body: JSON.stringify({
        question,
        language,
        top_k,
        ai_provider: 'auto'
      })
    }, 20000); // 20s timeout for RAG search + analysis
  }

  static async getDailyKural(): Promise<Kural> {
    return await this.fetchWithTimeout('/daily-kural', { method: 'GET' });
  }

  static async getKurals(params: { page?: number; limit?: number; division?: string; search?: string } = {}): Promise<{ total: number; page: number; pages: number; items: Kural[] }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.division) query.append('division', params.division);
    if (params.search) query.append('search', params.search);
    return await this.fetchWithTimeout(`/kurals?${query.toString()}`, { method: 'GET' });
  }

  static async getKuralByNumber(kuralNumber: number): Promise<Kural> {
    return await this.fetchWithTimeout(`/kurals/${kuralNumber}`, { method: 'GET' });
  }

  static async getChapters(): Promise<{ total_chapters: number; divisions: string[]; chapters: Chapter[] }> {
    return await this.fetchWithTimeout('/chapters', { method: 'GET' });
  }

  static async translateText(text: string, targetLanguage = 'ta', kuralNumber?: number): Promise<string> {
    const res = await this.fetchWithTimeout('/translate', {
      method: 'POST',
      body: JSON.stringify({
        text,
        target_language: targetLanguage,
        kural_number: kuralNumber || null
      })
    });
    return res.translated_text || text;
  }

  // Saved Kurals Storage
  static async getSavedKurals(): Promise<Kural[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY_SAVED_KURALS);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  }

  static async toggleSaveKural(kural: Kural): Promise<boolean> {
    const saved = await this.getSavedKurals();
    const exists = saved.some(k => k.kural_number === kural.kural_number);
    let updated: Kural[];
    if (exists) {
      updated = saved.filter(k => k.kural_number !== kural.kural_number);
    } else {
      updated = [kural, ...saved];
    }
    await AsyncStorage.setItem(STORAGE_KEY_SAVED_KURALS, JSON.stringify(updated));
    return !exists;
  }

  // Chat History Storage
  static async getChatHistory(): Promise<any[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY_CHAT_HISTORY);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  }

  static async saveChatHistory(messages: any[]): Promise<void> {
    try {
      // Keep last 30 messages
      const sliced = messages.slice(-30);
      await AsyncStorage.setItem(STORAGE_KEY_CHAT_HISTORY, JSON.stringify(sliced));
    } catch (e) {
      console.warn('Error saving chat history:', e);
    }
  }
}
