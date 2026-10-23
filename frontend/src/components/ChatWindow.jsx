import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Scroll, RefreshCw, AlertCircle, Loader2, Mic, MicOff, X, Radio } from 'lucide-react';
import MessageBubble from './MessageBubble';
import QuestionSuggestions from './QuestionSuggestions';
import { getT } from '../utils/translations';
import { startSpeechRecognition, isSpeechRecognitionSupported } from '../utils/audioPlayer';

export default function ChatWindow({
  messages,
  onSendMessage,
  loading,
  error,
  onRetry,
  onSaveKural,
  savedKurals,
  onOpenModal,
  onFeedback,
  language = 'auto'
}) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceError, setVoiceError] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const t = getT(language);
  const isTamil = language === 'ta';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      cancelVoiceRecording();
    };
  }, []);

  const startVoiceRecording = async () => {
    setVoiceError(null);
    audioChunksRef.current = [];

    let stream = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(100);
      }
    } catch (err) {
      console.warn('Microphone stream access warning:', err);
    }

    // Start speech recognition for live speech-to-text
    const recognition = startSpeechRecognition({
      language: language === 'en' ? 'en' : 'ta',
      onResult: (res) => {
        setInputText(res.text);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
      },
      onError: (err) => {
        console.warn('Speech recognition warning:', err);
      },
      onEnd: () => {
        // Recognition ended
      }
    });

    recognitionRef.current = recognition;
    setIsRecording(true);
    setRecordingDuration(0);

    timerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopAndSendVoiceRecording = () => {
    clearInterval(timerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    const currentText = inputText.trim() || (isTamil ? 'குரல் வழி வாழ்வியல் கேள்வி' : 'Voice Wisdom Question');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        let audioUrl = null;
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioUrl = URL.createObjectURL(blob);
        }

        // Release mic stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        onSendMessage(currentText, audioUrl);
        setInputText('');
        setIsRecording(false);
        setRecordingDuration(0);
      };
      mediaRecorderRef.current.stop();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      onSendMessage(currentText, null);
      setInputText('');
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const cancelVoiceRecording = () => {
    clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || loading) return;

    onSendMessage(trimmed);
    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextareaChange = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-cream-100/60 overflow-hidden relative">
      {/* Scrollable messages container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto py-8 text-center animate-fade-in">
            {/* Welcome Icon Badge */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-forest-700 text-white shadow-card mb-4 border border-gold-300">
              <Scroll className="w-8 h-8 text-cream-50" />
            </div>

            {/* Welcome Title & Subtitle */}
            <h1 className="text-2xl md:text-3xl font-bold text-forest-950 tracking-tight mb-2 font-tamil">
              {t.welcomeHeading}
            </h1>
            <p className="text-sm md:text-base text-forest-700 max-w-lg mx-auto leading-relaxed">
              {t.welcomeSubtitle}
            </p>

            <div className="inline-flex items-center space-x-2 my-4 px-3.5 py-1 bg-white border border-cream-300 rounded-full text-xs text-forest-800 shadow-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{t.kuralsReady}</span>
            </div>

            {/* Suggested Questions in active language */}
            <QuestionSuggestions
              onSelectQuestion={(q) => onSendMessage(q)}
              language={language}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                message={msg}
                onSaveKural={onSaveKural}
                savedKurals={savedKurals}
                onOpenModal={onOpenModal}
                onSelectQuestion={(q) => onSendMessage(q)}
                onFeedback={onFeedback}
                globalLanguage={language}
              />
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start space-x-3 mb-6 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-forest-800 text-gold-400 flex items-center justify-center shrink-0 shadow-md">
                  <Scroll className="w-5 h-5 animate-spin" />
                </div>
                <div className="bg-white border border-cream-300 rounded-2xl rounded-tl-xs p-4 shadow-card text-forest-800 flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gold-500" />
                  <div>
                    <p className="text-xs font-bold text-forest-900 font-tamil">
                      {t.searchingKurals}
                    </p>
                    <p className="text-[11px] text-forest-600">
                      {t.synthesizingWisdom}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message with Retry */}
            {error && (
              <div className="max-w-xl mx-auto my-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-3 py-1 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isTamil ? 'மீண்டும் முயற்சி' : 'Retry'}</span>
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer Input Area */}
      <div className="bg-white/95 backdrop-blur-md border-t border-cream-300 p-3 sm:p-4">
        {isRecording ? (
          /* Live Voice Recording Bar */
          <div className="max-w-4xl mx-auto flex items-center justify-between bg-gradient-to-r from-rose-50 via-cream-50 to-rose-50 border-2 border-rose-300/80 rounded-2xl p-3 sm:p-4 shadow-sm animate-pulse">
            <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-ping">
                <Mic className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs sm:text-sm text-rose-900 font-tamil">
                    {t.voiceRecording}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-mono font-bold text-xs">
                    {String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:{String(recordingDuration % 60).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs text-forest-800 font-medium truncate mt-0.5 font-sans">
                  {inputText ? `"${inputText}"` : (isTamil ? 'பேசுங்கள், உங்கள் குரல் எழுத்தாக மாறும்...' : 'Speak now, speech will transcribe here...')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1"
                title={t.voiceCancel}
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">{t.voiceCancel}</span>
              </button>

              <button
                type="button"
                id="btn-voice-send"
                data-testid="btn-voice-send"
                onClick={stopAndSendVoiceRecording}
                className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-700 text-gold-300 text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t.voiceRecordingStop}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Composer with Voice Input & Send */
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-end space-x-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={t.composerPlaceholder}
                className="w-full resize-none py-3 pl-4 pr-12 bg-cream-50 border border-cream-300 rounded-2xl focus:outline-hidden focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-forest-950 placeholder:text-forest-400 text-sm leading-relaxed max-h-32 transition-all font-sans"
              />
              <span className="absolute right-3 bottom-3 text-[10px] text-forest-400 font-mono hidden sm:inline">
                ↵ Enter
              </span>
            </div>

            {/* Voice Input Microphone Button */}
            <button
              type="button"
              id="btn-voice-record"
              data-testid="btn-voice-record"
              onClick={startVoiceRecording}
              disabled={loading}
              className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs border ${
                loading
                  ? 'bg-cream-200 text-forest-400 border-cream-300 cursor-not-allowed'
                  : 'bg-cream-100 hover:bg-gold-100 border-gold-300/80 text-forest-800 hover:text-gold-700 active:scale-95'
              }`}
              title={t.voiceInputBtn}
              aria-label={t.voiceInputBtn}
            >
              <Mic className="w-4 h-4 text-gold-600" />
            </button>

            {/* Submit Question Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                !inputText.trim() || loading
                  ? 'bg-cream-200 text-forest-400 cursor-not-allowed'
                  : 'bg-forest-800 hover:bg-forest-700 text-gold-300 shadow-md transform active:scale-95 cursor-pointer'
              }`}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="max-w-4xl mx-auto mt-1 flex items-center justify-between text-[11px] text-forest-500 px-2">
          <span>{t.footerNote}</span>
          <span className="font-tamil font-semibold">{t.tamilScriptureTag}</span>
        </div>
      </div>
    </div>
  );
}
