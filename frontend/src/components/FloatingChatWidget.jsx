import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  Minimize2,
  Maximize2,
  RotateCcw,
  BookOpen,
  Check,
  ChevronRight,
  ExternalLink,
  Volume2
} from 'lucide-react';
import api from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';
import { getT } from '../utils/translations';

const SUGGESTIONS = [
  { id: '1', label: '🤝 நட்பு', labelEn: 'Friendship', query: 'நல்ல நண்பனை எப்படி அடையாளம் காண்பது?' },
  { id: '2', label: '📚 கல்வி', labelEn: 'Knowledge', query: 'கல்வியின் முக்கியத்துவம் பற்றி வள்ளுவர் கூறுவது என்ன?' },
  { id: '3', label: '❤️ அன்பு', labelEn: 'Love', query: 'அன்பின் சிறப்பை விளக்குக' },
  { id: '4', label: '💪 முயற்சி', labelEn: 'Hard Work', query: 'விடாமுயற்சி மற்றும் உழைப்பு பற்றி குறள் என்ன கூறுகிறது?' },
  { id: '5', label: '🧘 அமைதி', labelEn: 'Peace', query: 'துன்பம் வரும் போது நாம் எப்படி நடந்து கொள்ள வேண்டும்?' },
];

export default function FloatingChatWidget({ language = 'auto', aiConfig = {}, onOpenModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'வணக்கம்! நான் சுபா (SUBA). உங்கள் வாழ்க்கைச் சூழல், கேள்விகள் அல்லது குழப்பங்களைக் கூறுங்கள் — 1,330 திருக்குறள்களின் ஞானத்துடன் வழிகாட்டுகிறேன்.\n\nAsk me about friendship, career, mental peace, or life decisions in Tamil, English, or Tanglish!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      grounded: true,
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [langPreference, setLangPreference] = useState(language);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isTamil = langPreference === 'ta';

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const handleSend = async (queryToSend) => {
    const text = (queryToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage(text, langPreference, 3, aiConfig);

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.answer || (langPreference === 'ta' ? response.answer_tamil : response.answer_english) || '',
        answer_tamil: response.answer_tamil,
        answer_english: response.answer_english,
        practical_takeaway: response.practical_takeaway || response.practical_takeaway_tamil,
        practical_takeaway_tamil: response.practical_takeaway_tamil,
        practical_takeaway_english: response.practical_takeaway_english,
        kurals: response.kurals || [],
        grounded: response.grounded,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `⚠️ சர்வர் தொடர்பு பிழை: ${err.message || 'Server error. Please ensure the backend is running.'}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          className={`bg-white border-2 border-gold-400 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-3.5 transition-all duration-300 animate-fade-in ${
            isExpanded
              ? 'w-[92vw] max-w-2xl h-[85vh]'
              : 'w-[90vw] sm:w-[420px] h-[560px] max-h-[82vh]'
          }`}
          style={{ boxShadow: '0 20px 40px -10px rgba(15, 56, 42, 0.4), 0 0 0 1px rgba(212, 175, 55, 0.4)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-950 via-forest-900 to-forest-850 px-4 py-3.5 border-b border-forest-700/80 flex items-center justify-between text-cream-100 select-none">
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-forest-800 border border-gold-400/40 flex items-center justify-center text-gold-400 shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-forest-950" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-bold text-sm text-white font-tamil">SUBA • சுபா</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/30 font-mono">
                    1,330 Kurals
                  </span>
                </div>
                <p className="text-[10px] text-cream-300">AI Thirukkural Wisdom Guide</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Language Switcher */}
              <button
                onClick={() => setLangPreference((prev) => (prev === 'ta' ? 'en' : prev === 'en' ? 'auto' : 'ta'))}
                className="px-2 py-1 rounded-lg bg-forest-800/80 hover:bg-forest-700 text-[11px] font-bold text-gold-300 border border-gold-500/30 transition-colors mr-1 cursor-pointer"
                title="Change Language"
              >
                {langPreference === 'ta' ? 'தமிழ்' : langPreference === 'en' ? 'ENG' : 'இருமொழி'}
              </button>

              {/* Expand / Minimize */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-cream-300 hover:text-white hover:bg-forest-800 transition-colors cursor-pointer"
                title={isExpanded ? 'Restore' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-cream-300 hover:text-white hover:bg-forest-800 transition-colors cursor-pointer"
                title="Close Widget"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Bar */}
          <div className="bg-cream-100/70 px-3 py-2 border-b border-cream-200/80 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSend(s.query)}
                disabled={loading}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-gold-50 text-forest-800 hover:text-forest-950 text-xs font-medium border border-cream-300 hover:border-gold-400 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-cream-50/50 to-white">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-forest-900 text-white rounded-br-xs'
                        : msg.isError
                        ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-xs'
                        : 'bg-white text-forest-900 border border-gold-200/80 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    <MarkdownRenderer content={msg.text} />

                    {/* Action Takeaway */}
                    {(msg.practical_takeaway || msg.practical_takeaway_tamil) && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-gold-50 border border-gold-200 text-forest-900">
                        <div className="flex items-center space-x-1 text-[11px] font-bold text-gold-800 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                          <span>வாழ்வியல் பாடம் (Practical Action)</span>
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed">
                          {msg.practical_takeaway_tamil || msg.practical_takeaway}
                        </p>
                      </div>
                    )}

                    {/* Referenced Kurals */}
                    {msg.kurals && msg.kurals.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-cream-200 space-y-2">
                        <div className="text-[11px] font-bold text-forest-800 flex items-center space-x-1">
                          <BookOpen className="w-3.5 h-3.5 text-gold-600" />
                          <span>ஆதாரக் குறள்கள் ({msg.kurals.length}):</span>
                        </div>

                        {msg.kurals.map((k) => (
                          <div
                            key={k.kural_number}
                            className="p-2.5 rounded-xl bg-cream-100/60 border border-cream-300/80 hover:border-gold-400 transition-all cursor-pointer group"
                            onClick={() => onOpenModal && onOpenModal(k.kural_number)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-forest-900 text-gold-300">
                                குறள் {k.kural_number}
                              </span>
                              <span className="text-[10px] text-forest-600 font-medium group-hover:text-gold-700 flex items-center gap-0.5">
                                {k.chapter_name_tamil} <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                            <p className="font-tamil font-bold text-forest-950 text-[11px] leading-snug">
                              {k.line_1_tamil}
                            </p>
                            <p className="font-tamil font-bold text-forest-950 text-[11px] leading-snug">
                              {k.line_2_tamil}
                            </p>
                            <p className="text-[10px] text-forest-700 mt-1 line-clamp-2">
                              {k.meaning_tamil || k.explanation_tamil_sp}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-forest-400 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-forest-600 bg-cream-100/70 px-3.5 py-2 rounded-2xl w-fit border border-cream-200">
                <span className="w-2 h-2 rounded-full bg-gold-500 animate-ping" />
                <span className="font-tamil font-medium text-[11px]">
                  சுபா குறள்களைத் தேடி ஆராய்கிறது...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-cream-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isTamil ? 'கேள்வி அல்லது சூழலைக் கேட்கவும்...' : 'Ask a question or life situation...'}
                className="flex-1 bg-cream-50 border border-cream-300 rounded-xl px-3.5 py-2.5 text-xs text-forest-950 placeholder-forest-400 focus:outline-hidden focus:border-gold-500 focus:bg-white transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="w-9 h-9 rounded-xl bg-forest-900 hover:bg-forest-800 disabled:opacity-40 text-gold-300 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        id="btn-floating-suba-widget"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center space-x-2.5 bg-gradient-to-r from-forest-950 via-forest-900 to-forest-850 hover:from-forest-900 hover:to-forest-800 text-cream-100 px-4 py-3 rounded-full border-2 border-gold-400 shadow-2xl hover:shadow-gold-500/25 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer active:scale-95"
        style={{
          boxShadow: '0 10px 25px -5px rgba(15, 56, 42, 0.5), 0 0 15px rgba(212, 175, 55, 0.4)'
        }}
        aria-label="Ask SUBA Thirukkural Chatbot"
      >
        {/* Animated icon circle */}
        <div className="relative w-8 h-8 rounded-full bg-forest-800 border border-gold-400/50 flex items-center justify-center text-gold-400 group-hover:rotate-12 transition-transform">
          {isOpen ? <X className="w-4 h-4 text-white" /> : <Bot className="w-4.5 h-4.5 text-gold-400" />}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-forest-950" />
        </div>

        {/* Label */}
        <div className="flex flex-col text-left pr-1">
          <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1 font-tamil">
            <span>{isTamil ? 'சுபாவிடம் கேட்க' : 'Ask SUBA'}</span>
            <span className="text-[10px] text-gold-400">✦</span>
          </span>
          <span className="text-[10px] text-cream-300 font-medium">
            {isTamil ? 'AI திருக்குறள் வழிகாட்டி' : '1,330 Kural AI'}
          </span>
        </div>
      </button>
    </div>
  );
}
