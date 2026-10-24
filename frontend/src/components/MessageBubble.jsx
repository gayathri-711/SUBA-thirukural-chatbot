import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Bot,
  BookOpen,
  Volume2,
  VolumeX,
  Copy,
  Share2,
  Bookmark,
  Check,
  CheckCheck,
  Lightbulb,
  Target,
  Languages,
  Sparkles
} from 'lucide-react';
import { playTextAudio, stopAllAudio } from '../utils/audioPlayer';

export default function MessageBubble({
  message,
  onSaveKural,
  savedKurals = [],
  onOpenModal,
}) {
  const isUser = message.sender === 'user';
  const [playingAudioKey, setPlayingAudioKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const audioControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioControllerRef.current) {
        audioControllerRef.current.stop();
      }
    };
  }, []);

  const handlePlayAudio = (key, text, lang = 'ta') => {
    if (playingAudioKey === key) {
      if (audioControllerRef.current) {
        audioControllerRef.current.stop();
      }
      stopAllAudio();
      setPlayingAudioKey(null);
      return;
    }

    if (audioControllerRef.current) {
      audioControllerRef.current.stop();
    }
    stopAllAudio();

    setPlayingAudioKey(key);
    audioControllerRef.current = playTextAudio(text, {
      language: lang,
      onEnd: () => setPlayingAudioKey(null),
      onError: () => setPlayingAudioKey(null)
    });
  };

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = async (content) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SUBA — Thirukkural AI Wisdom',
          text: content
        });
      } catch (err) {
        console.warn('Share cancelled', err);
      }
    } else {
      handleCopy('share', content);
      alert('Content copied to clipboard for sharing!');
    }
  };

  // 1. User Message (Lavender Bubble with User Avatar & Checkmark)
  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="flex items-end max-w-[85%] md:max-w-[75%] space-x-2.5">
          <div className="bg-[#EDE9FE] text-[#1E1B4B] px-4 py-3 rounded-2xl rounded-br-xs shadow-xs">
            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>
            <div className="flex items-center justify-end space-x-1 mt-1 text-[#6D28D9] text-[11px] font-mono">
              <span>{message.timestamp || '12:30 PM'}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#6D28D9]" />
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#6D28D9] text-white flex items-center justify-center shrink-0 shadow-xs">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  // 2. SUBA Response (Multi-tier Pastel Card Container)
  const { kurals = [] } = message;
  const primaryKural = kurals && kurals.length > 0 ? kurals[0] : null;
  const isSaved = primaryKural && savedKurals.some((s) => s.kural_number === primaryKural.kural_number);

  const fullShareText = primaryKural
    ? `SUBA — Thirukkural AI Wisdom\n\nகுறள் ${primaryKural.kural_number} (${primaryKural.chapter_name_tamil || primaryKural.chapter_name_english}):\n${primaryKural.line_1_tamil}\n${primaryKural.line_2_tamil}\n\nபொருள்: ${primaryKural.meaning_tamil}\nEnglish: ${primaryKural.meaning_english}\n\nவிளக்கம்: ${message.text || message.answer}`
    : `SUBA — Thirukkural AI Wisdom\n\n${message.text || message.answer}`;

  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-[#EDE9FE]">
        {/* SUBA Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#4338CA]">
              <Bot className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-[#1E1B4B]">SUBA</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {message.timestamp || '12:30 PM'}
          </span>
        </div>

        {/* 1. Thirukkural Verse Card (Warm Amber Cream) */}
        {primaryKural && (
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-3.5 mb-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-[#9A3412] font-bold text-xs">
                <BookOpen className="w-4 h-4" />
                <span>Thirukkural Verse</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handlePlayAudio(
                      'verse',
                      `${primaryKural.line_1_tamil}. ${primaryKural.line_2_tamil}.`,
                      'ta'
                    )
                  }
                  className="w-7 h-7 rounded-full bg-white border border-black/5 flex items-center justify-center text-[#9A3412] hover:bg-amber-100 transition-colors shadow-xs"
                  title="Listen to Verse"
                >
                  {playingAudioKey === 'verse' ? (
                    <VolumeX className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      'verse',
                      `${primaryKural.line_1_tamil}\n${primaryKural.line_2_tamil}\nKural ${primaryKural.kural_number} | ${primaryKural.chapter_name_tamil}`
                    )
                  }
                  className="w-7 h-7 rounded-full bg-white border border-black/5 flex items-center justify-center text-[#9A3412] hover:bg-amber-100 transition-colors shadow-xs"
                  title="Copy Verse"
                >
                  {copiedKey === 'verse' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <p className="font-bold text-[#1E1B4B] text-sm leading-relaxed font-tamil">
              {primaryKural.line_1_tamil}
            </p>
            <p className="font-bold text-[#1E1B4B] text-sm leading-relaxed font-tamil">
              {primaryKural.line_2_tamil}
            </p>

            <p className="text-[11px] font-semibold text-[#78350F] mt-2 font-tamil">
              Kural {primaryKural.kural_number} | {primaryKural.chapter_name_tamil || 'கல்வி'} ({primaryKural.chapter_name_english || 'Education'})
            </p>
          </div>
        )}

        {/* 2. Meaning (Tamil) Card (Pastel Mint Green) */}
        {primaryKural && (primaryKural.meaning_tamil || primaryKural.explanation_tamil_sp) && (
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3.5 mb-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-1.5 text-[#065F46] font-bold text-xs">
                <span className="text-sm">🍃</span>
                <span>Meaning (Tamil)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handlePlayAudio(
                      'meaning-ta',
                      primaryKural.meaning_tamil || primaryKural.explanation_tamil_sp,
                      'ta'
                    )
                  }
                  className="w-7 h-7 rounded-full bg-white border border-black/5 flex items-center justify-center text-[#065F46] hover:bg-emerald-100 transition-colors shadow-xs"
                  title="Listen to Tamil Meaning"
                >
                  {playingAudioKey === 'meaning-ta' ? (
                    <VolumeX className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      'meaning-ta',
                      primaryKural.meaning_tamil || primaryKural.explanation_tamil_sp
                    )
                  }
                  className="w-7 h-7 rounded-full bg-white border border-black/5 flex items-center justify-center text-[#065F46] hover:bg-emerald-100 transition-colors shadow-xs"
                  title="Copy Tamil Meaning"
                >
                  {copiedKey === 'meaning-ta' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-[#064E3B] leading-relaxed font-tamil">
              {primaryKural.meaning_tamil || primaryKural.explanation_tamil_sp}
            </p>
          </div>
        )}

        {/* 3. Meaning (English) Card (Pastel Sky Blue) */}
        {primaryKural && primaryKural.meaning_english && (
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3.5 mb-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-1.5 text-[#1E40AF] font-bold text-xs">
                <Languages className="w-4 h-4" />
                <span>Meaning (English)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handlePlayAudio('meaning-en', primaryKural.meaning_english, 'en')
                  }
                  className="w-7 h-7 rounded-full bg-white border border-black/5 flex items-center justify-center text-[#1E40AF] hover:bg-blue-100 transition-colors shadow-xs"
                  title="Listen to English Meaning"
                >
                  {playingAudioKey === 'meaning-en' ? (
                    <VolumeX className="w-3.5 h-3.5 text-blue-700 animate-pulse" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy('meaning-en', primaryKural.meaning_english)}
                  className="w-7 h-7 rounded-full bg-white border border-black/5 flex items-center justify-center text-[#1E40AF] hover:bg-blue-100 transition-colors shadow-xs"
                  title="Copy English Meaning"
                >
                  {copiedKey === 'meaning-en' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-[#1E3A8A] leading-relaxed font-sans">
              {primaryKural.meaning_english}
            </p>
          </div>
        )}

        {/* 4. Explanation Card (Pastel Lavender) */}
        <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl p-3.5 mb-2.5">
          <div className="flex items-center space-x-1.5 text-[#6B21A8] font-bold text-xs mb-1.5">
            <Lightbulb className="w-4 h-4" />
            <span>Explanation</span>
          </div>
          <p className="text-xs text-[#4C1D95] leading-relaxed font-sans whitespace-pre-wrap">
            {message.answer || message.text}
          </p>
        </div>

        {/* 5. Key Takeaway Card (Pastel Rose / Coral) */}
        {(message.practical_takeaway ||
          message.practical_takeaway_english ||
          message.practical_takeaway_tamil) && (
          <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-xl p-3.5 mb-3.5">
            <div className="flex items-center space-x-1.5 text-[#9F1239] font-bold text-xs mb-1.5">
              <Target className="w-4 h-4" />
              <span>Key Takeaway</span>
            </div>
            <p className="text-xs text-[#881337] leading-relaxed font-semibold">
              {message.practical_takeaway ||
                message.practical_takeaway_english ||
                message.practical_takeaway_tamil}
            </p>
          </div>
        )}

        {/* 6. Bottom Action Pills (Listen All, Copy, Share, Save) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              const fullSpeech = `${primaryKural ? primaryKural.line_1_tamil + '. ' + primaryKural.line_2_tamil + '. ' : ''}${message.answer || message.text}`;
              handlePlayAudio('all', fullSpeech, 'ta');
            }}
            className="flex items-center space-x-1.5 bg-[#F3E8FF] border border-[#DDD6FE] text-[#6D28D9] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#EDE9FE] transition-colors cursor-pointer"
          >
            {playingAudioKey === 'all' ? (
              <>
                <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen All</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleCopy('all', fullShareText)}
            className="flex items-center space-x-1.5 bg-[#F3E8FF] border border-[#DDD6FE] text-[#6D28D9] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#EDE9FE] transition-colors cursor-pointer"
          >
            {copiedKey === 'all' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Copy</span>
          </button>

          <button
            type="button"
            onClick={() => handleShare(fullShareText)}
            className="flex items-center space-x-1.5 bg-[#F3E8FF] border border-[#DDD6FE] text-[#6D28D9] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#EDE9FE] transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {primaryKural && (
            <button
              type="button"
              onClick={() => onSaveKural(primaryKural)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                isSaved
                  ? 'bg-[#EDE9FE] border-[#6D28D9] text-[#4338CA]'
                  : 'bg-[#F3E8FF] border-[#DDD6FE] text-[#6D28D9] hover:bg-[#EDE9FE]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
