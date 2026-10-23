import React, { useState, useRef, useEffect } from 'react';
import { User, Sparkles, Scroll, AlertCircle, ArrowRight, Globe, Volume2, VolumeX, Mic } from 'lucide-react';
import KuralCard from './KuralCard';
import MarkdownRenderer from './MarkdownRenderer';
import { getT } from '../utils/translations';
import { playTextAudio, stopAllAudio } from '../utils/audioPlayer';

export default function MessageBubble({
  message,
  onSaveKural,
  savedKurals,
  onOpenModal,
  onSelectQuestion,
  onFeedback,
  globalLanguage = 'auto'
}) {
  const isUser = message.sender === 'user';
  // Allow per-bubble language override if user clicks the bubble's language switcher
  const [bubbleLang, setBubbleLang] = useState(null);
  const [playingAudioLang, setPlayingAudioLang] = useState(null); // 'ta' | 'en' | null
  const audioControllerRef = useRef(null);

  // When globalLanguage changes, reset per-bubble override so the entire chat adopts the chosen language
  useEffect(() => {
    setBubbleLang(null);
  }, [globalLanguage]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioControllerRef.current) {
        audioControllerRef.current.stop();
      }
    };
  }, []);

  // Determine active language: user override > global setting > message language > auto
  const activeLang = bubbleLang || (globalLanguage !== 'auto' ? globalLanguage : (message.language || 'auto'));
  const isTamil = activeLang === 'ta';
  const isEnglish = activeLang === 'en';
  const isAuto = activeLang === 'auto';
  const t = getT(isTamil ? 'ta' : 'en');

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="flex items-start max-w-[85%] md:max-w-[75%] space-x-2 flex-row-reverse space-x-reverse">
          <div className="w-8 h-8 rounded-full bg-forest-700 text-cream-100 flex items-center justify-center shrink-0 shadow-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="bg-forest-800 text-white px-4 py-3 rounded-2xl rounded-tr-xs shadow-card">
            {/* If user provided a Voice Note */}
            {message.audioUrl && (
              <div className="mb-2.5 p-2 rounded-xl bg-forest-900/80 border border-gold-300/30 flex items-center space-x-2.5">
                <Mic className="w-4 h-4 text-gold-400 shrink-0" />
                <audio controls src={message.audioUrl} className="h-7 w-44 sm:w-56" />
                <span className="text-[10px] text-gold-300 font-mono font-bold shrink-0">
                  {t.voiceNoteLabel}
                </span>
              </div>
            )}
            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>
            <span className="text-[10px] text-cream-300 block text-right mt-1 font-mono">
              {message.timestamp}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // SUBA response
  const { kurals = [], grounded = true, related_kurals = [] } = message;

  // Determine content for Tamil and English
  const isMessageAnswerTamil = Boolean(message.answer && /[\u0B80-\u0BFF]/.test(message.answer));

  let pureTamilAnswer = message.answer_tamil;
  if (!pureTamilAnswer && isMessageAnswerTamil) pureTamilAnswer = message.answer;
  if (!pureTamilAnswer && kurals && kurals.length > 0) {
    const k = kurals[0];
    pureTamilAnswer = `உங்கள் வினாவிற்குத் திருக்குறளின் அதிகாரம்: **${k.chapter_name_tamil}** (${k.division})-ல் உள்ள **குறள் ${k.kural_number}** சிறந்த வழிகாட்டுகிறது.\n\n**மு. வரதராசனார் உரை:**\n"${k.meaning_tamil}"\n\n**சாலமன் பாப்பையா உரை:**\n"${k.explanation_tamil_sp || k.meaning_tamil}"`;
  }
  if (!pureTamilAnswer) pureTamilAnswer = message.answer || message.text;

  let pureTamilTakeaway = message.practical_takeaway_tamil;
  if (!pureTamilTakeaway && isMessageAnswerTamil) pureTamilTakeaway = message.practical_takeaway;
  if (!pureTamilTakeaway && kurals && kurals.length > 0) {
    pureTamilTakeaway = `அதிகாரம் '${kurals[0].chapter_name_tamil}' உணர்த்தும் நெறியின்படி, உடனடி உணர்ச்சிவசப்படுதலைத் தவிர்த்து நேரிய வழியில் செயல்படுங்கள்.`;
  }

  let pureEnglishAnswer = message.answer_english;
  if (!pureEnglishAnswer && !isMessageAnswerTamil) pureEnglishAnswer = message.answer;
  if (!pureEnglishAnswer && kurals && kurals.length > 0) {
    const k = kurals[0];
    pureEnglishAnswer = `To address your question, Thiruvalluvar offers counsel in **Kural #${k.kural_number}** from the chapter **'${k.chapter_name_english}'** within **${k.division}**.\n\n**Verified English Translation (Rev. Dr. G.U. Pope):**\n"${k.meaning_english}"\n\n**Philosophical Insight:**\n${k.explanation_english || k.meaning_english}`;
  }
  if (!pureEnglishAnswer) pureEnglishAnswer = message.answer || message.text;

  let pureEnglishTakeaway = message.practical_takeaway_english;
  if (!pureEnglishTakeaway && !isMessageAnswerTamil) pureEnglishTakeaway = message.practical_takeaway;
  if (!pureEnglishTakeaway && kurals && kurals.length > 0) {
    pureEnglishTakeaway = `In accordance with Chapter '${kurals[0].chapter_name_english}', maintain virtue, steadfast effort, and ethical clarity.`;
  }

  // Audio Playback Handler
  const handlePlayAudio = (targetLang) => {
    if (playingAudioLang === targetLang) {
      if (audioControllerRef.current) {
        audioControllerRef.current.stop();
      }
      stopAllAudio();
      setPlayingAudioLang(null);
      return;
    }

    if (audioControllerRef.current) {
      audioControllerRef.current.stop();
    }
    stopAllAudio();

    let speechParts = [];
    if (targetLang === 'ta') {
      if (kurals && kurals.length > 0) {
        const k = kurals[0];
        speechParts.push(`திருக்குறள் அதிகாரம்: ${k.chapter_name_tamil}. குறள் எண் ${k.kural_number}. ${k.line_1_tamil}. ${k.line_2_tamil}. உரை விளக்கம்: ${k.meaning_tamil}.`);
        if (k.explanation_tamil_sp && k.explanation_tamil_sp !== k.meaning_tamil) {
          speechParts.push(`சாலமன் பாப்பையா உரை விளக்கம்: ${k.explanation_tamil_sp}.`);
        }
      }
      if (pureTamilAnswer) speechParts.push(pureTamilAnswer);
      if (pureTamilTakeaway) speechParts.push(`செயல்முறை வழிகாட்டல்: ${pureTamilTakeaway}`);
    } else {
      if (kurals && kurals.length > 0) {
        const k = kurals[0];
        const def = k.explanation_english || k.meaning_english;
        speechParts.push(`Thirukkural Chapter: ${k.chapter_name_english}. Couplet number ${k.kural_number}. Couplet Translation: ${k.meaning_english}. Complete Philosophical Definition and Meaning: ${def}.`);
      }
      if (pureEnglishAnswer) speechParts.push(pureEnglishAnswer);
      if (pureEnglishTakeaway) speechParts.push(`Practical Guidance Takeaway: ${pureEnglishTakeaway}`);
    }

    const fullSpeech = speechParts.join(' ');

    setPlayingAudioLang(targetLang);
    audioControllerRef.current = playTextAudio({
      text: fullSpeech,
      language: targetLang,
      onStart: () => setPlayingAudioLang(targetLang),
      onEnd: () => setPlayingAudioLang(null),
      onError: (err) => {
        console.warn('Playback error:', err);
        setPlayingAudioLang(null);
      }
    });
  };

  return (
    <div className="flex justify-start mb-6 animate-fade-in" data-testid="bot-message">
      <div className="flex items-start max-w-[95%] md:max-w-[88%] space-x-3">
        {/* SUBA Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-forest-950 flex items-center justify-center shrink-0 shadow-md border border-gold-300 mt-1">
          <Scroll className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-3 min-w-0">
          {/* Main Answer Container */}
          <div className="bg-white border border-cream-300 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-card text-forest-950">
            {/* Header label, Voice Player & Language Toggle */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-cream-200 gap-2 flex-wrap">
              <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                <span className="font-bold text-xs text-forest-900 tracking-wide font-tamil">
                  {isTamil ? 'சுபா ஞான வழிகாட்டி' : (isEnglish ? 'SUBA Wisdom Assistant' : 'SUBA — திருக்குறள் AI வழிகாட்டி')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 font-semibold border border-forest-100">
                  {grounded ? t.groundedBadge : (isTamil ? 'பொது வழிகாட்டல்' : 'General Guidance')}
                </span>
                <span
                  className="text-[10px] px-2.5 py-0.5 rounded-full bg-gold-100/90 text-forest-950 font-bold border border-gold-300 flex items-center space-x-1 shadow-xs"
                  title={`Analyzed via ${message.ai_model || 'SUBA AI Cognitive Engine'}`}
                >
                  <Sparkles className="w-3 h-3 text-gold-600 animate-pulse shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-none">
                    {message.ai_model || 'SUBA AI Cognitive'}
                  </span>
                </span>
              </div>

              {/* Action Buttons: Voice Output & Translation Switcher */}
              <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-1.5">
                {isAuto ? (
                  /* Auto Mode: BOTH Tamil Audio and English Audio are present! */
                  <div className="flex items-center space-x-1.5">
                    {/* Tamil Audio Button */}
                    <button
                      type="button"
                      id={`btn-voice-listen-ta-${message.id || 'ans'}`}
                      data-testid="btn-voice-listen-ta"
                      onClick={() => handlePlayAudio('ta')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer shadow-xs ${
                        playingAudioLang === 'ta'
                          ? 'bg-gold-500 text-forest-950 ring-2 ring-gold-400 font-bold'
                          : 'bg-cream-100 hover:bg-gold-100 border border-gold-300 text-forest-800'
                      }`}
                      title={playingAudioLang === 'ta' ? t.voiceStopAnswer : 'தமிழில் கேட்க (Listen in Tamil)'}
                    >
                      {playingAudioLang === 'ta' ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-forest-950 animate-pulse" />
                          <span>{t.voiceStopAnswer}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-gold-600" />
                          <span>🔊 தமிழ் உரை</span>
                        </>
                      )}
                    </button>

                    {/* English Audio Button */}
                    <button
                      type="button"
                      id={`btn-voice-listen-en-${message.id || 'ans'}`}
                      data-testid="btn-voice-listen-en"
                      onClick={() => handlePlayAudio('en')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer shadow-xs ${
                        playingAudioLang === 'en'
                          ? 'bg-gold-500 text-forest-950 ring-2 ring-gold-400 font-bold'
                          : 'bg-cream-100 hover:bg-gold-100 border border-gold-300 text-forest-800'
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
                          <span>🔊 English Audio</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : isEnglish ? (
                  /* English Mode: English Audio */
                  <button
                    type="button"
                    id={`btn-voice-listen-${message.id || 'ans'}`}
                    data-testid="btn-voice-listen"
                    onClick={() => handlePlayAudio('en')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                      playingAudioLang === 'en'
                        ? 'bg-gold-500 text-forest-950 ring-2 ring-gold-400'
                        : 'bg-cream-100 hover:bg-gold-100 border border-gold-300 text-forest-800'
                    }`}
                    title={playingAudioLang === 'en' ? t.voiceStopAnswer : 'Listen to Answer in English'}
                  >
                    {playingAudioLang === 'en' ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-forest-950 animate-pulse" />
                        <span>{t.voiceStopAnswer}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-forest-600" />
                        <span>🔊 Listen in English</span>
                      </>
                    )}
                  </button>
                ) : (
                  /* Tamil Mode: Pure Tamil Audio */
                  <button
                    type="button"
                    id={`btn-voice-listen-${message.id || 'ans'}`}
                    data-testid="btn-voice-listen"
                    onClick={() => handlePlayAudio('ta')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                      playingAudioLang === 'ta'
                        ? 'bg-gold-500 text-forest-950 ring-2 ring-gold-400'
                        : 'bg-cream-100 hover:bg-gold-100 border border-gold-300 text-forest-800'
                    }`}
                    title={playingAudioLang === 'ta' ? t.voiceStopAnswer : t.voicePlayAnswer}
                  >
                    {playingAudioLang === 'ta' ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-forest-950 animate-pulse" />
                        <span>{t.voiceStopAnswer}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-gold-600" />
                        <span>🔊 தமிழில் கேட்க</span>
                      </>
                    )}
                  </button>
                )}

                {/* Per-Bubble Language Toggle Switcher */}
                <button
                  id="bubble-lang-toggle"
                  data-testid="bubble-lang-toggle"
                  onClick={() => setBubbleLang(isTamil ? 'en' : (isEnglish ? 'ta' : (isMessageAnswerTamil ? 'en' : 'ta')))}
                  className="px-2.5 py-1 rounded-full bg-cream-100 hover:bg-gold-100 border border-gold-300/70 text-forest-800 text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
                  title={isTamil ? 'Translate response to English' : 'பதிலை தமிழில் மாற்றுக'}
                >
                  <Globe className="w-3 h-3 text-gold-600" />
                  <span>{isTamil ? 'Switch to English' : (isEnglish ? 'தமிழில் வாசிக்க' : 'தமிழுக்கு மாற')}</span>
                </button>
              </div>
            </div>

            {/* Answer Display */}
            {isAuto ? (
              /* Auto Mode: BOTH Tamil Wisdom and English Guidance are present simultaneously! */
              <div className="space-y-4">
                {/* 1. Authentic Tamil Guidance Card */}
                <div className="p-4 rounded-xl bg-cream-50/90 border border-cream-300">
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-forest-900 font-tamil mb-2 pb-1.5 border-b border-cream-200">
                    <span className="text-base">📖</span>
                    <span>தமிழ் வழிகாட்டல் (Tamil Wisdom Guidance):</span>
                  </div>
                  <MarkdownRenderer
                    content={pureTamilAnswer}
                    className="font-tamil"
                  />

                  {pureTamilTakeaway && (
                    <div className="mt-3 p-3 rounded-lg bg-gold-50/70 border border-gold-200 text-xs font-tamil text-forest-900">
                      <div className="flex items-center space-x-1.5 font-bold text-gold-800 mb-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                        <span>செயல்முறை வழிமுறை:</span>
                      </div>
                      <p className="leading-relaxed font-medium">{pureTamilTakeaway}</p>
                    </div>
                  )}
                </div>

                {/* 2. Authentic English Guidance Card */}
                <div className="p-4 rounded-xl bg-white border border-gold-200 shadow-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-forest-800 mb-2 pb-1.5 border-b border-cream-200">
                    <span className="text-base">🌐</span>
                    <span>English Guidance & Philosophical Meaning (ஆங்கில உரை):</span>
                  </div>
                  <MarkdownRenderer
                    content={pureEnglishAnswer}
                  />

                  {pureEnglishTakeaway && (
                    <div className="mt-3 p-3 rounded-lg bg-cream-50 border border-cream-300 text-xs text-forest-900">
                      <div className="flex items-center space-x-1.5 font-bold text-forest-800 mb-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                        <span>Practical Takeaway:</span>
                      </div>
                      <p className="leading-relaxed font-medium">{pureEnglishTakeaway}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : isEnglish ? (
              /* English Mode: 100% English Answer and Definition */
              <div>
                <MarkdownRenderer content={pureEnglishAnswer} />

                {pureEnglishTakeaway && (
                  <div className="mt-4 p-3.5 rounded-xl bg-gold-50/70 border border-gold-200 text-xs text-forest-900">
                    <div className="flex items-center space-x-1.5 font-bold text-gold-800 mb-1">
                      <Sparkles className="w-4 h-4 text-gold-600" />
                      <span>Practical Guidance:</span>
                    </div>
                    <p className="leading-relaxed text-forest-900 font-medium">
                      {pureEnglishTakeaway}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Tamil Mode: 100% Tamil Answer and Commentary */
              <div>
                <MarkdownRenderer
                  content={pureTamilAnswer}
                  className="font-tamil"
                />

                {pureTamilTakeaway && (
                  <div className="mt-4 p-3.5 rounded-xl bg-gold-50/70 border border-gold-200 text-xs text-forest-900 font-tamil">
                    <div className="flex items-center space-x-1.5 font-bold text-gold-800 mb-1">
                      <Sparkles className="w-4 h-4 text-gold-600" />
                      <span>{t.practicalActionLabel}</span>
                    </div>
                    <p className="leading-relaxed text-forest-900 font-medium">
                      {pureTamilTakeaway}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Retrieved Grounded Kural Cards */}
          {kurals && kurals.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-forest-800 px-1">
                <Scroll className="w-3.5 h-3.5 text-gold-500" />
                <span>{isTamil ? 'சான்றளிக்கப்பட்ட திருக்குறள்:' : (isEnglish ? 'Verified Source Couplets:' : 'சான்றளிக்கப்பட்ட திருக்குறள் (Verified Couplets):')}</span>
              </div>

              {kurals.map((kural) => {
                const isSaved = savedKurals?.some((s) => s.kural_number === kural.kural_number);
                return (
                  <KuralCard
                    key={kural.kural_number}
                    kural={kural}
                    isSaved={isSaved}
                    onToggleSave={onSaveKural}
                    onOpenModal={onOpenModal}
                    onFeedback={(num, helpful) => onFeedback && onFeedback(message.text, num, helpful)}
                    language={activeLang}
                    practicalTakeaway={null}
                  />
                );
              })}
            </div>
          ) : (
            !grounded && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  {isTamil
                    ? 'இந்த குறிப்பிட்ட வினாவிற்குத் தகுந்த நேரடித் திருக்குறள் கிடைக்கவில்லை. வேறு சொற்களைப் பயன்படுத்தி மீண்டும் கேட்டுப் பாருங்கள்.'
                    : 'A directly applicable Kural could not be found for this specific query. Please try rephrasing.'}
                </p>
              </div>
            )
          )}

          {/* Related Kurals quick links */}
          {related_kurals && related_kurals.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 pt-1 px-1">
              <span className="text-[11px] text-forest-600 font-medium">{t.relatedKuralsLabel}</span>
              {related_kurals.map((num) => (
                <button
                  key={num}
                  onClick={() => onOpenModal && onOpenModal(num)}
                  className="px-2.5 py-1 rounded-full bg-cream-100 hover:bg-gold-100 border border-cream-300 hover:border-gold-300 text-forest-800 text-[11px] font-semibold transition-colors flex items-center space-x-1"
                >
                  <span>{t.kuralNumber} #{num}</span>
                  <ArrowRight className="w-3 h-3 text-forest-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
