import React, { useState, useEffect, useRef } from 'react';
import { Sun, Calendar, Sparkles, Bookmark, BookmarkCheck, Copy, Check, Loader2, BookOpen, Volume2, VolumeX } from 'lucide-react';
import api from '../services/api';
import { getT } from '../utils/translations';
import { playTextAudio, stopAllAudio } from '../utils/audioPlayer';

export default function DailyKural({ onOpenModal, savedKurals, onToggleSave, language = 'auto' }) {
  const [dailyKural, setDailyKural] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [playingAudioLang, setPlayingAudioLang] = useState(null);
  const audioCtrlRef = useRef(null);

  const t = getT(language);
  const isTamil = language === 'ta';

  useEffect(() => {
    setLoading(true);
    api.getDailyKural()
      .then((data) => {
        setDailyKural(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load daily Kural:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (audioCtrlRef.current) {
        audioCtrlRef.current.stop();
      }
    };
  }, []);

  const handlePlayAudio = (targetLang) => {
    if (!dailyKural) return;

    if (playingAudioLang === targetLang) {
      if (audioCtrlRef.current) {
        audioCtrlRef.current.stop();
      }
      stopAllAudio();
      setPlayingAudioLang(null);
      return;
    }

    if (audioCtrlRef.current) {
      audioCtrlRef.current.stop();
    }
    stopAllAudio();

    let recitalText = '';
    if (targetLang === 'ta') {
      recitalText = `இன்றைய சிந்தனை: திருக்குறள் எண் ${dailyKural.kural_number}. அதிகாரம்: ${dailyKural.chapter_name_tamil}. ${dailyKural.line_1_tamil}. ${dailyKural.line_2_tamil}. டாக்டர் மு. வரதராசனார் உரை விளக்கம்: ${dailyKural.meaning_tamil}.`;
      if (dailyKural.explanation_tamil_sp) {
        recitalText += ` சாலமன் பாப்பையா வாழ்வியல் உரை: ${dailyKural.explanation_tamil_sp}.`;
      }
    } else {
      const def = dailyKural.explanation_english || dailyKural.meaning_english;
      recitalText = `Daily Inspiration: Thirukkural couplet number ${dailyKural.kural_number}. Chapter: ${dailyKural.chapter_name_english}. Couplet Translation: ${dailyKural.meaning_english}. Complete Philosophical Definition and Insights: ${def}.`;
    }

    setPlayingAudioLang(targetLang);
    audioCtrlRef.current = playTextAudio({
      text: recitalText,
      language: targetLang,
      onStart: () => setPlayingAudioLang(targetLang),
      onEnd: () => setPlayingAudioLang(null),
      onError: () => setPlayingAudioLang(null)
    });
  };

  const localeCode = isTamil ? 'ta-IN' : 'en-US';
  const todayStr = new Date().toLocaleDateString(localeCode, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleCopy = () => {
    if (!dailyKural) return;
    const text = `இன்றைய திருக்குறள் (Daily Kural #${dailyKural.kural_number})
அதிகாரம்: ${dailyKural.chapter_name_tamil} (${dailyKural.chapter_name_english})

${dailyKural.line_1_tamil}
${dailyKural.line_2_tamil}

மு. வரதராசனார் உரை:
${dailyKural.meaning_tamil}

English Translation:
${dailyKural.meaning_english}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSaved = dailyKural && savedKurals?.some((s) => s.kural_number === dailyKural.kural_number);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Top Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-300 gap-2">
        <div className="flex items-center space-x-2 text-gold-600">
          <Sun className="w-5 h-5 text-gold-500 animate-spin-slow" />
          <span className="text-xs uppercase tracking-widest font-bold">
            {t.dailyInspiration}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-forest-600 font-medium">
          <Calendar className="w-4 h-4 text-forest-500" />
          <span>{todayStr}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3 text-forest-600">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          <p className="text-sm font-medium">{t.searchingKurals}</p>
        </div>
      ) : dailyKural ? (
        <div className="space-y-6 animate-fade-in">
          {/* Main Showcase Card */}
          <div className="parchment-card rounded-3xl p-6 md:p-10 shadow-elevated border border-gold-300/50 relative overflow-hidden">
            {/* Background seal watermarking */}
            <div className="absolute right-4 bottom-4 text-gold-400/10 font-tamil text-9xl select-none pointer-events-none font-bold">
              வள்ளுவம்
            </div>

            {/* Badge & Chapter */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center space-x-2">
                <span className="px-3.5 py-1.5 rounded-xl bg-forest-800 text-gold-300 font-mono font-bold text-sm shadow-xs">
                  {t.kuralNumber} #{dailyKural.kural_number}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-forest-800 font-semibold">
                  {dailyKural.division}
                </span>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-forest-900 font-tamil block">
                  {isTamil ? `அதிகாரம் ${dailyKural.chapter_number}: ${dailyKural.chapter_name_tamil}` : `Chapter ${dailyKural.chapter_number}: ${dailyKural.chapter_name_english}`}
                </span>
                <span className="text-xs text-forest-600">
                  {isTamil ? dailyKural.chapter_name_english : dailyKural.chapter_name_tamil}
                </span>
              </div>
            </div>

            {/* The Couplet */}
            <div className="my-8 text-center bg-white/70 p-6 md:p-8 rounded-2xl border border-gold-200 shadow-inner">
              <div className="text-forest-950 font-bold text-xl md:text-2xl leading-loose kural-verse space-y-2">
                <p className="tracking-wide text-forest-950 font-bold">{dailyKural.line_1_tamil}</p>
                <p className="tracking-wide text-forest-950 font-bold">{dailyKural.line_2_tamil}</p>
              </div>

              {dailyKural.transliteration_1 && (
                <div className="mt-4 pt-4 border-t border-cream-200 text-xs text-forest-600 italic font-mono space-y-1">
                  <p>{dailyKural.transliteration_1}</p>
                  <p>{dailyKural.transliteration_2}</p>
                </div>
              )}

              {/* Audio Controls for Full Couplet & Definition */}
              <div className="mt-4 pt-3 border-t border-gold-200/80 flex flex-wrap items-center justify-center gap-2">
                {language === 'auto' ? (
                  <>
                    <button
                      type="button"
                      id="daily-audio-ta"
                      data-testid="daily-audio-ta"
                      onClick={() => handlePlayAudio('ta')}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                        playingAudioLang === 'ta'
                          ? 'bg-gold-500 text-forest-950 border-gold-400 ring-2 ring-gold-400'
                          : 'bg-white hover:bg-gold-50 border-gold-300 text-forest-900'
                      }`}
                      title="குறள் மற்றும் உரையைத் தமிழில் கேட்க"
                    >
                      {playingAudioLang === 'ta' ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-forest-950 animate-pulse" />
                          <span>{t.voiceStopAnswer}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-gold-600" />
                          <span>🔊 தமிழ் உரை (Tamil Audio)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id="daily-audio-en"
                      data-testid="daily-audio-en"
                      onClick={() => handlePlayAudio('en')}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                        playingAudioLang === 'en'
                          ? 'bg-gold-500 text-forest-950 border-gold-400 ring-2 ring-gold-400'
                          : 'bg-white hover:bg-gold-50 border-gold-300 text-forest-900'
                      }`}
                      title="Listen to full couplet and definition in English"
                    >
                      {playingAudioLang === 'en' ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-forest-950 animate-pulse" />
                          <span>{t.voiceStopAnswer}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-forest-600" />
                          <span>🔊 English Audio</span>
                        </>
                      )}
                    </button>
                  </>
                ) : language === 'en' ? (
                  <button
                    type="button"
                    id="daily-audio-en"
                    data-testid="daily-audio-en"
                    onClick={() => handlePlayAudio('en')}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                      playingAudioLang === 'en'
                        ? 'bg-gold-500 text-forest-950 border-gold-400 ring-2 ring-gold-400'
                        : 'bg-white hover:bg-gold-50 border-gold-300 text-forest-900'
                    }`}
                  >
                    {playingAudioLang === 'en' ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-forest-950 animate-pulse" />
                        <span>{t.voiceStopAnswer}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-forest-600" />
                        <span>🔊 Listen to Full Couplet & Definition</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    id="daily-audio-ta"
                    data-testid="daily-audio-ta"
                    onClick={() => handlePlayAudio('ta')}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                      playingAudioLang === 'ta'
                        ? 'bg-gold-500 text-forest-950 border-gold-400 ring-2 ring-gold-400'
                        : 'bg-white hover:bg-gold-50 border-gold-300 text-forest-900'
                    }`}
                  >
                    {playingAudioLang === 'ta' ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-forest-950 animate-pulse" />
                        <span>{t.voiceStopAnswer}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-gold-600" />
                        <span>🔊 குறள் & முழு உரையைத் தமிழில் கேட்க</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Explanations adapted to language */}
            {language === 'auto' ? (
              /* Auto Mode: BOTH Tamil Commentary AND English Definition are present */
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 shadow-xs space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-forest-800 font-tamil block">
                      📖 {t.mvMeaningLabel}:
                    </span>
                    <p className="text-sm text-forest-950 font-tamil leading-relaxed">
                      {dailyKural.meaning_tamil}
                    </p>
                  </div>

                  {dailyKural.explanation_tamil_sp && (
                    <div className="pt-2 border-t border-cream-200">
                      <span className="text-xs font-bold text-gold-800 font-tamil block mb-1">
                        {t.spMeaningLabel}:
                      </span>
                      <p className="text-xs sm:text-sm text-forest-900 font-tamil leading-relaxed">
                        {dailyKural.explanation_tamil_sp}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gold-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest-700 block">
                    🌐 {t.englishTransLabel}:
                  </span>
                  <p className="text-sm md:text-base text-forest-950 italic font-serif leading-relaxed">
                    "{dailyKural.meaning_english}"
                  </p>
                  {dailyKural.explanation_english && (
                    <p className="text-xs text-forest-700 leading-relaxed pt-1 border-t border-cream-200">
                      {dailyKural.explanation_english}
                    </p>
                  )}
                </div>
              </div>
            ) : language === 'en' ? (
              /* English Mode: English Definition & Translation */
              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-forest-700">
                    Verified English Translation (Rev. Dr. G.U. Pope):
                  </h3>
                  <p className="text-sm md:text-base text-forest-950 italic font-serif leading-relaxed bg-cream-50 p-4 rounded-xl border border-cream-200">
                    "{dailyKural.meaning_english}"
                  </p>
                </div>

                {dailyKural.explanation_english && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-forest-800">
                      English Philosophical Definition & Insights:
                    </h3>
                    <p className="text-sm text-forest-900 leading-relaxed bg-white p-4 rounded-xl border border-gold-200 shadow-xs">
                      {dailyKural.explanation_english}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Tamil Mode: Pure Tamil Commentaries */
              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-forest-700 font-tamil">
                    {t.mvMeaningLabel}
                  </h3>
                  <p className="text-sm text-forest-950 font-tamil leading-relaxed bg-white p-4 rounded-xl border border-cream-200 shadow-xs">
                    {dailyKural.meaning_tamil}
                  </p>
                </div>

                {dailyKural.explanation_tamil_sp && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-700 font-tamil">
                      {t.spMeaningLabel}
                    </h3>
                    <p className="text-sm text-forest-800 font-tamil leading-relaxed bg-gold-50/50 p-4 rounded-xl border border-gold-100">
                      {dailyKural.explanation_tamil_sp}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Daily Practical Takeaway / Reflection */}
            <div className="mt-8 p-5 rounded-2xl bg-forest-800 text-cream-100 shadow-md">
              <div className="flex items-center space-x-2 text-gold-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>{t.dailyReflectionTitle}</span>
              </div>
              <p className="text-sm text-cream-100 leading-relaxed">
                {t.dailyReflectionText}
              </p>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-cream-300 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onToggleSave(dailyKural)}
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors font-semibold ${
                    isSaved
                      ? 'bg-gold-100 text-gold-900 font-bold border border-gold-300'
                      : 'bg-white border border-cream-300 text-forest-700 hover:bg-cream-100'
                  }`}
                >
                  {isSaved ? <BookmarkCheck className="w-4 h-4 text-gold-600" /> : <Bookmark className="w-4 h-4" />}
                  <span>{isSaved ? t.savedBtn : t.saveBtn}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-white border border-cream-300 text-forest-700 hover:bg-cream-100 flex items-center space-x-1.5 transition-colors font-medium"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? t.copiedBtn : t.copyBtn}</span>
                </button>
              </div>

              <button
                onClick={() => onOpenModal(dailyKural.kural_number)}
                className="text-xs font-bold text-gold-700 hover:text-gold-900 flex items-center space-x-1"
              >
                <span>{t.detailsBtn}</span>
                <BookOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
