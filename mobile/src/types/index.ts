export interface Kural {
  id?: number;
  kural_number: number;
  chapter_number?: number;
  chapter_name_tamil?: string;
  chapter_name_english?: string;
  division?: string;
  kural_tamil?: string;
  line_1_tamil?: string;
  line_2_tamil?: string;
  transliteration_1?: string;
  transliteration_2?: string;
  meaning_tamil?: string;
  meaning_english?: string;
  explanation_tamil_sp?: string;
  explanation_tamil_mk?: string;
  explanation_english?: string;
  relevance_score?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language?: string;
  answer_tamil?: string;
  answer_english?: string;
  practical_takeaway?: string;
  practical_takeaway_tamil?: string;
  practical_takeaway_english?: string;
  kurals?: Kural[];
  grounded?: boolean;
  isError?: boolean;
}

export interface ChatResponsePayload {
  question: string;
  language: string;
  answer: string;
  answer_tamil?: string;
  answer_english?: string;
  practical_takeaway?: string;
  practical_takeaway_tamil?: string;
  practical_takeaway_english?: string;
  kurals: Kural[];
  grounded: boolean;
  related_kurals?: number[];
  ai_model?: string;
}

export interface Chapter {
  number: number;
  name_tamil: string;
  name_english: string;
  transliteration: string;
  division: string;
  start: number;
  end: number;
  total_kurals: number;
}
