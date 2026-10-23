import React, { useState, useEffect } from 'react';
import { X, Bookmark, BookmarkCheck, Copy, Check, BookOpen, Loader2, Share2 } from 'lucide-react';
import api from '../services/api';

import { getT } from '../utils/translations';

export default function KuralModal({ kuralNumber, onClose, isSaved, onToggleSave, language = 'ta' }) {
  const [kural, setKural] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const t = getT(language);
  const isTamil = language === 'ta';

  useEffect(() => {
    if (!kuralNumber) return;
    setLoading(true);
    setError(null);
    api.getKuralByNumber(kuralNumber)
      .then((data) => {
        setKural(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load Kural details');
        setLoading(false);
      });
  }, [kuralNumber]);

  if (!kuralNumber) return null;

  const handleCopy = () => {
    if (!kural) return;
    const text = `திருக்குறள் (Kural #${kural.kural_number})
அதிகாரம்: ${kural.chapter_name_tamil} (${kural.chapter_name_english})
பிரிவு: ${kural.division}

${kural.line_1_tamil}
${kural.line_2_tamil}

மு. வரதராசனார் உரை:
${kural.meaning_tamil}

English Translation:
${kural.meaning_english}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white border border-gold-300/40 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-cream-100 px-6 py-4 border-b border-cream-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-forest-800 text-gold-300 rounded-lg font-mono font-bold text-sm">
              குறள் #{kuralNumber}
            </span>
            {kural && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cream-200 text-forest-800">
                {kural.division}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {kural && (
              <>
                <button
                  onClick={() => onToggleSave(kural)}
                  className="p-2 rounded-lg text-forest-600 hover:bg-cream-200 transition-colors"
                  title="Bookmark"
                >
                  {isSaved ? <BookmarkCheck className="w-5 h-5 text-gold-600" /> : <Bookmark className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg text-forest-600 hover:bg-cream-200 transition-colors"
                  title="Copy"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-forest-600 hover:bg-cream-200 hover:text-forest-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-forest-600">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
              <p className="text-sm font-medium">குறள் தகவல்கள் பெறப்படுகின்றன...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-rose-600">
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : kural ? (
            <>
              {/* Chapter Information */}
              <div className="text-center pb-2 border-b border-cream-200">
                <span className="text-xs uppercase tracking-wider text-forest-500 font-semibold block">
                  அதிகாரம் {kural.chapter_number}
                </span>
                <h2 className="text-xl font-bold text-forest-900 font-tamil mt-0.5">
                  {kural.chapter_name_tamil}
                </h2>
                <p className="text-xs text-forest-600 font-sans">
                  Chapter {kural.chapter_number}: {kural.chapter_name_english}
                </p>
              </div>

              {/* Original Couplet */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-cream-50 via-white to-cream-50 border border-gold-300 text-center shadow-inner">
                <div className="text-forest-950 font-bold text-lg sm:text-xl leading-loose kural-verse space-y-1">
                  <p>{kural.line_1_tamil}</p>
                  <p>{kural.line_2_tamil}</p>
                </div>

                {kural.transliteration_1 && (
                  <div className="mt-3 pt-3 border-t border-cream-200 text-xs text-forest-600 italic font-mono space-y-0.5">
                    <p>{kural.transliteration_1}</p>
                    <p>{kural.transliteration_2}</p>
                  </div>
                )}
              </div>

              {/* If Tamil mode, prioritize Tamil commentaries first */}
              {isTamil ? (
                <>
                  {/* Tamil Commentaries Section */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-forest-700 font-tamil">
                      தமிழ் உரைகள் (Tamil Commentaries)
                    </h3>

                    {/* Dr. M. Varadarajan */}
                    <div className="p-3.5 rounded-xl bg-white border border-cream-300 shadow-xs">
                      <span className="text-xs font-bold text-forest-800 font-tamil block mb-1">
                        மு. வரதராசனார் உரை (Dr. M. Varadarajan)
                      </span>
                      <p className="text-xs sm:text-sm text-forest-900 font-tamil leading-relaxed">
                        {kural.meaning_tamil}
                      </p>
                    </div>

                    {/* Solomon Pappaiah */}
                    {kural.explanation_tamil_sp && (
                      <div className="p-3.5 rounded-xl bg-cream-50/70 border border-cream-300 shadow-xs">
                        <span className="text-xs font-bold text-gold-700 font-tamil block mb-1">
                          சாலமன் பாப்பையா உரை (Solomon Pappaiah)
                        </span>
                        <p className="text-xs sm:text-sm text-forest-900 font-tamil leading-relaxed">
                          {kural.explanation_tamil_sp}
                        </p>
                      </div>
                    )}

                    {/* Kalaignar Karunanidhi */}
                    {kural.explanation_tamil_mk && (
                      <div className="p-3.5 rounded-xl bg-white border border-cream-300 shadow-xs">
                        <span className="text-xs font-bold text-forest-700 font-tamil block mb-1">
                          கலைஞர் மு. கருணாநிதி உரை (Kalaignar)
                        </span>
                        <p className="text-xs sm:text-sm text-forest-900 font-tamil leading-relaxed">
                          {kural.explanation_tamil_mk}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Verified English Translation */}
                  <div className="space-y-1.5 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-forest-700">
                      Verified English Translation (Rev. Dr. G.U. Pope & Drew)
                    </h3>
                    <p className="text-sm text-forest-900 italic font-serif leading-relaxed bg-cream-50 p-3 rounded-xl border border-cream-200">
                      "{kural.meaning_english}"
                    </p>
                    {kural.explanation_english && kural.explanation_english !== kural.meaning_english && (
                      <p className="text-xs text-forest-600 leading-relaxed pl-1 pt-1">
                        {kural.explanation_english}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Verified English Translation first */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-forest-700">
                      Verified English Translation (Rev. Dr. G.U. Pope & Drew)
                    </h3>
                    <p className="text-sm text-forest-900 italic font-serif leading-relaxed bg-cream-50 p-3 rounded-xl border border-cream-200">
                      "{kural.meaning_english}"
                    </p>
                    {kural.explanation_english && kural.explanation_english !== kural.meaning_english && (
                      <p className="text-xs text-forest-600 leading-relaxed pl-1 pt-1">
                        {kural.explanation_english}
                      </p>
                    )}
                  </div>

                  {/* Tamil Commentaries Section */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-forest-700 font-tamil">
                      Tamil Commentaries (தமிழ் உரைகள்)
                    </h3>

                    {/* Dr. M. Varadarajan */}
                    <div className="p-3.5 rounded-xl bg-white border border-cream-300 shadow-xs">
                      <span className="text-xs font-bold text-forest-800 font-tamil block mb-1">
                        Dr. M. Varadarajan (மு. வரதராசனார் உரை)
                      </span>
                      <p className="text-xs sm:text-sm text-forest-900 font-tamil leading-relaxed">
                        {kural.meaning_tamil}
                      </p>
                    </div>

                    {/* Solomon Pappaiah */}
                    {kural.explanation_tamil_sp && (
                      <div className="p-3.5 rounded-xl bg-cream-50/70 border border-cream-300 shadow-xs">
                        <span className="text-xs font-bold text-gold-700 font-tamil block mb-1">
                          Solomon Pappaiah (சாலமன் பாப்பையா உரை)
                        </span>
                        <p className="text-xs sm:text-sm text-forest-900 font-tamil leading-relaxed">
                          {kural.explanation_tamil_sp}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-cream-100 px-6 py-3 border-t border-cream-300 flex items-center justify-between text-xs text-forest-600">
          <span>{isTamil ? 'மூலம்: அங்கீகரிக்கப்பட்ட செவ்வியல் தமிழ் இலக்கியத் தரவுத்தளம்' : 'Source: Authenticated Classical Tamil Corpus & Rev. G.U. Pope Translation'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-forest-800 text-white font-medium hover:bg-forest-700 transition-colors cursor-pointer"
          >
            {isTamil ? 'மூடு (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
