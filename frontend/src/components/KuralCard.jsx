import React, { useState, useRef, useEffect } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  Volume2,
  VolumeX
} from 'lucide-react';
import { getT } from '../utils/translations';
import { playTextAudio, stopAllAudio } from '../utils/audioPlayer';

export default function KuralCard({
  kural,
  isSaved,
  onToggleSave,
  onOpenModal,
  onFeedback,
  language = 'auto',
  practicalTakeaway = null
}) {
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [showSecondaryLang, setShowSecondaryLang] = useState(false);
  const [playingAudioLang, setPlayingAudioLang] = useState(null); // 'ta' | 'en' | null
  const audioCtrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioCtrlRef.current) {
        audioCtrlRef.current.stop();
      }
    };
  }, []);

  const handlePlayAudio = (targetLang) => {
    // If currently playing the requested audio, stop it
    if (playingAudioLang === targetLang) {
      if (audioCtrlRef.current) {
        audioCtrlRef.current.stop();
      }
      stopAllAudio();
      setPlayingAudioLang(null);
      return;
    }

    // Stop any existing playback
    if (audioCtrlRef.current) {
      audioCtrlRef.current.stop();
    }
    stopAllAudio();

    let recitalText = '';
    if (targetLang === 'ta') {
      const divName = (kural.division || '').split('-')[0].trim();
      recitalText = `திருக்குறள் எண் ${kural.kural_number}. அதிகாரம்: ${kural.chapter_name_tamil}. பிரிவு: ${divName}. முழு குறள்: ${kural.line_1_tamil}, ${kural.line_2_tamil}. டாக்டர் மு. வரதராசனார் உரை விளக்கம்: ${kural.meaning_tamil}.`;
      if (kural.explanation_tamil_sp && kural.explanation_tamil_sp !== kural.meaning_tamil) {
        recitalText += ` சாலமன் பாப்பையா வாழ்வியல் உரை விளக்கம்: ${kural.explanation_tamil_sp}.`;
      }
      if (kural.explanation_tamil_mk && kural.explanation_tamil_mk !== kural.meaning_tamil) {
        recitalText += ` கலைஞர் உரை விளக்கம்: ${kural.explanation_tamil_mk}.`;
      }
    } else {
      const def = kural.explanation_english || kural.meaning_english;
      recitalText = `Thirukkural couplet number ${kural.kural_number}. Chapter: ${kural.chapter_name_english}, in the section of ${kural.division}. English Translation by Reverend Doctor G.U. Pope: ${kural.meaning_english}. Full Philosophical Definition and Ethical Commentary: ${def}.`;
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

  const isTamilMode = language === 'ta';
  const isEnglishMode = language === 'en';
  const isAutoMode = language === 'auto';
  const t = getT(language);

  const handleCopy = () => {
    const textToCopy = `திருக்குறள் (Kural #${kural.kural_number})
அதிகாரம்: ${kural.chapter_name_tamil} (${kural.chapter_name_english})
பிரிவு: ${kural.division}

${kural.line_1_tamil}
${kural.line_2_tamil}

மு. வரதராசனார் உரை:
${kural.meaning_tamil}

English Translation:
${kural.meaning_english}

English Definition:
${kural.explanation_english || kural.meaning_english}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedbackClick = (isHelpful) => {
    setFeedbackGiven(isHelpful);
    if (onFeedback) {
      onFeedback(kural.kural_number, isHelpful);
    }
  };

  const getDivisionBadge = (division) => {
    if (!division) return { bg: 'bg-forest-100 text-forest-800 border-forest-200', label: 'Thirukkural' };
    if (division.includes('அறத்துப்பால்') || division.includes('Virtue')) {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        label: isTamilMode ? 'அறத்துப்பால்' : (isEnglishMode ? 'Virtue' : 'Virtue • அறத்துப்பால்')
      };
    }
    if (division.includes('பொருட்பால்') || division.includes('Wealth')) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        label: isTamilMode ? 'பொருட்பால்' : (isEnglishMode ? 'Wealth' : 'Wealth • பொருட்பால்')
      };
    }
    return {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      label: isTamilMode ? 'காமத்துப்பால்' : (isEnglishMode ? 'Love' : 'Love • காமத்துப்பால்')
    };
  };

  const divBadge = getDivisionBadge(kural.division);

  return (
    <div className="rounded-2xl bg-white border border-cream-300 shadow-card hover:shadow-elevated transition-all duration-300 overflow-hidden my-3">
      {/* Top Meta Header */}
      <div className="bg-cream-50/90 px-4 py-2.5 border-b border-cream-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-forest-800 text-gold-300 font-mono font-bold text-xs tracking-wide">
            {t.kuralNumber} #{kural.kural_number}
          </span>
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${divBadge.bg}`}>
            {divBadge.label}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {kural.relevance_score && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold-500" />
              {Math.round(kural.relevance_score * 100)}% {isTamilMode ? 'பொருத்தம்' : 'Match'}
            </span>
          )}

          <span className="text-xs font-bold text-forest-900 font-tamil">
            {isEnglishMode ? (
              <>
                <span className="font-sans font-bold">{kural.chapter_name_english}</span>{' '}
                <span className="text-forest-500 font-tamil text-[11px]">({kural.chapter_name_tamil})</span>
              </>
            ) : (
              <>
                {kural.chapter_name_tamil}{' '}
                <span className="text-forest-500 font-sans font-normal text-[11px]">({kural.chapter_name_english})</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Couplet Body */}
      <div className="p-4 sm:p-5">
        {/* Original Tamil Verse & Audio Options */}
        <div className="relative p-4 rounded-xl bg-gradient-to-r from-cream-100 via-cream-50 to-cream-100 border border-gold-300/50 text-center my-1 shadow-inner group">
          <div className="text-forest-950 font-bold text-base sm:text-lg leading-loose kural-verse space-y-1">
            <p className="tracking-wide text-forest-950 font-bold">{kural.line_1_tamil}</p>
            <p className="tracking-wide text-forest-950 font-bold">{kural.line_2_tamil}</p>
          </div>

          {/* Audio Playback Controls */}
          <div className="mt-3 pt-2.5 border-t border-gold-200/60 flex flex-wrap items-center justify-center gap-2">
            {isAutoMode ? (
              /* Auto Mode: BOTH Tamil Audio and English Audio are present */
              <>
                <button
                  type="button"
                  id={`btn-kural-audio-ta-${kural.kural_number}`}
                  data-testid="btn-kural-audio-ta"
                  onClick={() => handlePlayAudio('ta')}
                  className={`px-3 py-1 rounded-lg border text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs font-semibold ${
                    playingAudioLang === 'ta'
                      ? 'bg-gold-500 text-forest-950 border-gold-400 ring-2 ring-gold-400'
                      : 'bg-white hover:bg-gold-50 border-gold-300 text-forest-900'
                  }`}
                  title={playingAudioLang === 'ta' ? t.voiceStopAnswer : 'தமிழில் கேட்க (Recite Couplet & Tamil Commentary)'}
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
                  id={`btn-kural-audio-en-${kural.kural_number}`}
                  data-testid="btn-kural-audio-en"
                  onClick={() => handlePlayAudio('en')}
                  className={`px-3 py-1 rounded-lg border text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs font-semibold ${
                    playingAudioLang === 'en'
                      ? 'bg-gold-500 text-forest-950 border-gold-400 ring-2 ring-gold-400'
                      : 'bg-white hover:bg-gold-50 border-gold-300 text-forest-900'
                  }`}
                  title={playingAudioLang === 'en' ? t.voiceStopAnswer : 'Listen in English (Recite Translation & Definition)'}
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
            ) : isEnglishMode ? (
              /* English Mode: English Audio */
              <button
                type="button"
                id={`btn-kural-audio-${kural.kural_number}`}
                data-testid={`btn-kural-audio-${kural.kural_number}`}
                onClick={() => handlePlayAudio('en')}
                className={`px-3.5 py-1 rounded-lg border text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs font-semibold ${
                  playingAudioLang === 'en'
                    ? 'bg-gold-500 text-forest-950 border-gold-400 ring-2 ring-gold-400'
                    : 'bg-white hover:bg-gold-50 border-gold-300 text-forest-900'
                }`}
                title={playingAudioLang === 'en' ? t.voiceStopAnswer : 'Listen in English'}
              >
                {playingAudioLang === 'en' ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-forest-950 animate-pulse" />
                    <span>{t.voiceStopAnswer}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-forest-600" />
                    <span>🔊 Listen in English (Couplet & Definition)</span>
                  </>
                )}
              </button>
            ) : (
              /* Tamil Mode: Pure Tamil Audio */
              <button
                type="button"
                id={`btn-kural-audio-${kural.kural_number}`}
                data-testid={`btn-kural-audio-${kural.kural_number}`}
                onClick={() => handlePlayAudio('ta')}
                className={`px-3.5 py-1 rounded-lg border text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs font-semibold ${
                  playingAudioLang === 'ta'
                    ? 'bg-gold-500 text-forest-950 border-gold-400 ring-2 ring-gold-400'
                    : 'bg-white hover:bg-gold-50 border-gold-300 text-forest-900'
                }`}
                title={playingAudioLang === 'ta' ? t.voiceStopAnswer : t.voicePlayKural}
              >
                {playingAudioLang === 'ta' ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-forest-950 animate-pulse" />
                    <span>{t.voiceStopAnswer}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-gold-600" />
                    <span>🔊 குறளைக் கேட்க (Listen in Tamil)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Definitions based on language mode */}
        {isAutoMode ? (
          /* Auto Mode: BOTH Tamil Commentary AND English Definition are present simultaneously */
          <div className="mt-4 space-y-3.5">
            {/* Tamil Commentaries Section */}
            <div className="bg-cream-50/90 p-4 rounded-xl border border-cream-300 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-forest-800 font-tamil block mb-1.5 flex items-center gap-1.5">
                <span>📖</span>
                <span>{t.mvMeaningLabel}:</span>
              </span>
              <p className="text-sm text-forest-950 font-tamil leading-relaxed">
                {kural.meaning_tamil}
              </p>

              {kural.explanation_tamil_sp && kural.explanation_tamil_sp !== kural.meaning_tamil && (
                <div className="mt-2.5 pt-2 border-t border-cream-200">
                  <span className="text-[11px] font-bold text-gold-800 font-tamil block mb-0.5">
                    {t.spMeaningLabel}:
                  </span>
                  <p className="text-xs text-forest-900 font-tamil leading-relaxed">
                    {kural.explanation_tamil_sp}
                  </p>
                </div>
              )}
            </div>

            {/* English Definition & Translation Section */}
            <div className="bg-white p-4 rounded-xl border border-gold-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-forest-700 block mb-1.5 flex items-center gap-1.5">
                <span>🌐</span>
                <span>{t.englishTransLabel}:</span>
              </span>
              <p className="text-sm text-forest-950 italic font-serif leading-relaxed">
                "{kural.meaning_english}"
              </p>

              {kural.explanation_english && (
                <div className="mt-2.5 pt-2 border-t border-cream-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest-600 block mb-0.5">
                    {t.englishDefLabel}:
                  </span>
                  <p className="text-xs text-forest-800 leading-relaxed">
                    {kural.explanation_english}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : isEnglishMode ? (
          /* English Mode: Definition is strictly in English! */
          <div className="mt-4 space-y-3">
            {/* Verified English Translation */}
            <div className="bg-cream-50 p-4 rounded-xl border border-cream-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-forest-700 block mb-1">
                Verified English Translation (Rev. Dr. G.U. Pope):
              </span>
              <p className="text-sm sm:text-base text-forest-950 italic font-serif leading-relaxed">
                "{kural.meaning_english}"
              </p>
            </div>

            {/* English Philosophical Definition */}
            <div className="bg-white p-4 rounded-xl border border-gold-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-forest-800 block mb-1">
                English Definition & Ethical Commentary:
              </span>
              <p className="text-xs sm:text-sm text-forest-900 leading-relaxed">
                {kural.explanation_english || kural.meaning_english}
              </p>
            </div>

            {/* Optional Collapsed Tamil Cross-reference */}
            <div className="pt-1">
              <button
                onClick={() => setShowSecondaryLang(!showSecondaryLang)}
                className="text-xs text-forest-600 hover:text-forest-900 font-medium flex items-center gap-1 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-gold-600" />
                <span>{showSecondaryLang ? 'Hide Tamil Commentary' : 'View Original Tamil Commentary (மு. வரதராசனார் உரை)'}</span>
                {showSecondaryLang ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showSecondaryLang && (
                <p className="mt-2 text-xs text-forest-900 font-tamil leading-relaxed bg-cream-50 p-3 rounded-lg border border-cream-200 shadow-xs">
                  {kural.meaning_tamil}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Tamil Mode: All definitions strictly in Tamil! */
          <div className="mt-4 space-y-3">
            <div className="bg-cream-50 p-4 rounded-xl border border-cream-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-forest-800 font-tamil block mb-1">
                {t.mvMeaningLabel}:
              </span>
              <p className="text-sm text-forest-950 font-tamil leading-relaxed">
                {kural.meaning_tamil}
              </p>
            </div>

            {/* Solomon Pappaiah commentary */}
            {kural.explanation_tamil_sp && kural.explanation_tamil_sp !== kural.meaning_tamil && (
              <div className="bg-gold-50/60 p-3.5 rounded-xl border border-gold-200/70">
                <span className="text-xs font-bold text-gold-800 font-tamil block mb-1">
                  {t.spMeaningLabel}:
                </span>
                <p className="text-xs sm:text-sm text-forest-900 font-tamil leading-relaxed">
                  {kural.explanation_tamil_sp}
                </p>
              </div>
            )}

            {/* Optional English Translation toggle */}
            <div className="pt-1">
              <button
                onClick={() => setShowSecondaryLang(!showSecondaryLang)}
                className="text-xs text-forest-600 hover:text-forest-900 font-medium flex items-center gap-1 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-gold-600" />
                <span>{showSecondaryLang ? t.hideEnglishTranslation : t.showEnglishTranslation}</span>
                {showSecondaryLang ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showSecondaryLang && (
                <p className="mt-2 text-xs text-forest-800 italic font-serif leading-relaxed bg-white p-3 rounded-lg border border-cream-200 shadow-xs">
                  "{kural.meaning_english}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Practical Takeaway banner */}
        {practicalTakeaway && (
          <div className="mt-4 p-3.5 rounded-xl bg-forest-50 border border-forest-200 text-xs text-forest-900">
            <div className="flex items-center space-x-1.5 font-bold text-forest-800 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              <span>{t.practicalActionLabel}</span>
            </div>
            <p className="leading-relaxed">{practicalTakeaway}</p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-4 py-2.5 bg-cream-50/70 border-t border-cream-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Save, Copy, Modal Details */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Bookmark Button */}
          <button
            onClick={() => onToggleSave(kural)}
            className={`px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors font-medium ${
              isSaved
                ? 'bg-gold-100 text-gold-900 font-bold border border-gold-300'
                : 'text-forest-700 hover:bg-cream-200 border border-transparent'
            }`}
            title={isSaved ? t.savedBtn : t.saveBtn}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4 text-gold-600" /> : <Bookmark className="w-4 h-4" />}
            <span>{isSaved ? t.savedBtn : t.saveBtn}</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg text-forest-700 hover:bg-cream-200 flex items-center space-x-1.5 transition-colors font-medium"
            title={t.copyBtn}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">{t.copiedBtn}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t.copyBtn}</span>
              </>
            )}
          </button>

          {/* Details Modal */}
          {onOpenModal && (
            <button
              onClick={() => onOpenModal(kural.kural_number)}
              className="px-2.5 py-1.5 rounded-lg text-forest-800 hover:bg-cream-200 flex items-center space-x-1.5 transition-colors font-semibold"
            >
              <BookOpen className="w-4 h-4 text-forest-600" />
              <span>{t.detailsBtn}</span>
            </button>
          )}
        </div>

        {/* Right: Feedback */}
        <div className="flex items-center space-x-1">
          <span className="text-[11px] text-forest-500 mr-1 hidden sm:inline">{t.isHelpful}</span>
          <button
            onClick={() => handleFeedbackClick(true)}
            className={`p-1.5 rounded-lg transition-colors ${
              feedbackGiven === true
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-forest-500 hover:bg-cream-200'
            }`}
            title="Helpful"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFeedbackClick(false)}
            className={`p-1.5 rounded-lg transition-colors ${
              feedbackGiven === false
                ? 'bg-rose-100 text-rose-700'
                : 'text-forest-500 hover:bg-cream-200'
            }`}
            title="Not helpful"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
