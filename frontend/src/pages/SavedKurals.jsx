import React, { useState } from 'react';
import { Bookmark, Trash2, Search, BookOpen, Copy, Check } from 'lucide-react';
import { getT } from '../utils/translations';

export default function SavedKurals({ savedKurals, onToggleSave, onOpenModal, onClearAll, language = 'auto' }) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const t = getT(language);
  const isTamil = language === 'ta';

  const filtered = savedKurals.filter((k) => {
    const q = search.toLowerCase();
    return (
      k.kural_number.toString().includes(q) ||
      k.line_1_tamil.toLowerCase().includes(q) ||
      k.line_2_tamil.toLowerCase().includes(q) ||
      k.meaning_english.toLowerCase().includes(q) ||
      k.chapter_name_tamil.toLowerCase().includes(q) ||
      k.chapter_name_english.toLowerCase().includes(q)
    );
  });

  const handleCopy = (kural) => {
    const text = `திருக்குறள் #${kural.kural_number} (${kural.chapter_name_tamil})
${kural.line_1_tamil}
${kural.line_2_tamil}
${kural.meaning_english}`;

    navigator.clipboard.writeText(text);
    setCopiedId(kural.kural_number);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-300 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-forest-950 font-tamil flex items-center space-x-2">
            <Bookmark className="w-6 h-6 text-gold-500 fill-gold-500" />
            <span>{t.savedKuralsTitle}</span>
          </h1>
          <p className="text-xs text-forest-600 mt-1">
            {t.savedKuralsSubtitle} • {savedKurals.length} {t.saved}
          </p>
        </div>

        {savedKurals.length > 0 && (
          <button
            onClick={onClearAll}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearAll}</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      {savedKurals.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchSaved}
            className="w-full text-xs py-2.5 pl-9 pr-3 bg-white border border-cream-300 rounded-xl focus:outline-hidden focus:border-gold-500 text-forest-900"
          />
          <Search className="w-4 h-4 text-forest-400 absolute left-3 top-3" />
        </div>
      )}

      {/* Saved Kurals List */}
      {savedKurals.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-cream-300 p-8 shadow-xs">
          <Bookmark className="w-12 h-12 text-forest-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-forest-900 font-tamil">
            {t.noSavedYet}
          </h3>
          <p className="text-xs text-forest-600 max-w-sm mx-auto mt-1 leading-relaxed">
            {t.noSavedDesc}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-forest-500 text-xs">
          {t.noKuralsFound}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((kural) => (
            <div
              key={kural.kural_number}
              className="bg-white rounded-2xl p-5 border border-cream-300 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-forest-800 text-gold-300 font-mono font-bold">
                    #{kural.kural_number}
                  </span>
                  <span className="text-forest-700 text-xs font-tamil font-bold">
                    {kural.chapter_name_tamil}
                  </span>
                  <button
                    onClick={() => onToggleSave(kural)}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    title={t.clearAll}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-cream-50/70 border border-cream-200 text-forest-950 font-bold text-xs sm:text-sm kural-verse space-y-0.5">
                  <p>{kural.line_1_tamil}</p>
                  <p>{kural.line_2_tamil}</p>
                </div>

                {isTamil ? (
                  <p className="mt-2.5 text-xs text-forest-900 font-tamil leading-relaxed line-clamp-2">
                    {kural.meaning_tamil}
                  </p>
                ) : (
                  <p className="mt-2.5 text-xs text-forest-800 italic font-serif leading-relaxed line-clamp-2">
                    "{kural.meaning_english}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleCopy(kural)}
                  className="text-forest-600 hover:text-forest-900 flex items-center space-x-1 font-medium"
                >
                  {copiedId === kural.kural_number ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">{t.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.copyBtn}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onOpenModal(kural.kural_number)}
                  className="font-bold text-gold-700 hover:text-gold-900 flex items-center space-x-1"
                >
                  <span>{t.detailsBtn}</span>
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
