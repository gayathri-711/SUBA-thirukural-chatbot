import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import api from '../services/api';
import { getT } from '../utils/translations';

export default function BrowseKurals({ onOpenModal, savedKurals, onToggleSave, language = 'auto' }) {
  const [kurals, setKurals] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pages, setPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');

  const t = getT(language);
  const isTamil = language === 'ta';

  // Load chapters once
  useEffect(() => {
    api.getChapters()
      .then((data) => setChapters(data.chapters || []))
      .catch((err) => console.error('Failed to load chapters:', err));
  }, []);

  // Fetch Kurals when page or filters change
  useEffect(() => {
    setLoading(true);
    api.getKurals({
      page,
      limit,
      division: selectedDivision,
      chapter_number: selectedChapter ? parseInt(selectedChapter, 10) : null,
      search: search.trim()
    })
      .then((data) => {
        setKurals(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching kurals:', err);
        setLoading(false);
      });
  }, [page, selectedDivision, selectedChapter, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleDivisionChange = (div) => {
    setSelectedDivision(div);
    setSelectedChapter('');
    setPage(1);
  };

  const handleChapterChange = (ch) => {
    setSelectedChapter(ch);
    setPage(1);
  };

  const filteredChapters = selectedDivision
    ? chapters.filter((c) => c.division.includes(selectedDivision.split(' ')[0]))
    : chapters;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-forest-800 to-forest-900 rounded-3xl p-6 md:p-8 text-cream-100 shadow-card border border-forest-700">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            {isTamil ? 'திருக்குறள் முழுப் பேரவை • 1,330 குறள்கள்' : 'COMPLETE THIRUKKURAL TREATISE • ALL 1,330 COUPLETS'}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold font-tamil text-white mt-1">
            {t.browseTitle}
          </h1>
          <p className="text-sm text-cream-200 mt-2 leading-relaxed">
            {t.browseSubtitle}
          </p>
        </div>

        {/* Division Selector Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: '', label: t.allDivisions },
            { id: 'அறத்துப்பால்', label: t.virtueDivision },
            { id: 'பொருட்பால்', label: t.wealthDivision },
            { id: 'காமத்துப்பால்', label: t.loveDivision },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleDivisionChange(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedDivision === tab.id
                  ? 'bg-gold-500 text-forest-950 shadow-md'
                  : 'bg-forest-700/60 hover:bg-forest-700 text-cream-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-cream-300 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full text-xs py-2 pl-9 pr-3 bg-cream-50 border border-cream-300 rounded-xl focus:outline-hidden focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-forest-900"
          />
          <Search className="w-4 h-4 text-forest-500 absolute left-3 top-2.5" />
        </form>

        {/* Chapter Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-forest-500 shrink-0" />
          <select
            value={selectedChapter}
            onChange={(e) => handleChapterChange(e.target.value)}
            className="w-full md:w-64 text-xs py-2 px-3 bg-cream-50 border border-cream-300 rounded-xl focus:outline-hidden focus:border-gold-500 text-forest-900 font-medium"
          >
            <option value="">{t.allChapters}</option>
            {filteredChapters.map((ch) => (
              <option key={ch.number} value={ch.number}>
                #{ch.number}. {isTamil ? ch.name_tamil : `${ch.name_english} (${ch.name_tamil})`}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="text-xs text-forest-600 font-medium self-end md:self-center shrink-0">
          {t.totalKuralsCount}: <span className="font-bold text-forest-900">{total}</span>
        </div>
      </div>

      {/* Kurals Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-forest-600">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          <p className="text-sm font-medium">{t.searchingKurals}</p>
        </div>
      ) : kurals.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-cream-300 p-8">
          <BookOpen className="w-10 h-10 text-forest-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-forest-900">{t.noKuralsFound}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kurals.map((kural) => {
            const isSaved = savedKurals?.some((s) => s.kural_number === kural.kural_number);
            return (
              <div
                key={kural.kural_number}
                className="bg-white rounded-2xl p-5 border border-cream-300 shadow-xs hover:shadow-card hover:border-gold-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-forest-800 text-gold-300 font-mono font-bold">
                      #{kural.kural_number}
                    </span>
                    <span className="text-forest-700 text-xs font-tamil font-bold">
                      {kural.chapter_name_tamil} • <span className="font-sans text-[11px] font-normal text-forest-500">{kural.chapter_name_english}</span>
                    </span>
                    <button
                      onClick={() => onToggleSave(kural)}
                      className="p-1 rounded-lg text-forest-500 hover:text-gold-600 transition-colors"
                      title={isSaved ? t.savedBtn : t.saveBtn}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4 text-gold-600" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Couplet */}
                  <div className="p-3 rounded-xl bg-cream-50/60 border border-cream-200 text-forest-950 font-bold text-sm kural-verse space-y-0.5">
                    <p>{kural.line_1_tamil}</p>
                    <p>{kural.line_2_tamil}</p>
                  </div>

                  {/* Definition and Meaning based on language */}
                  {language === 'ta' ? (
                    <p className="mt-3 text-xs text-forest-900 font-tamil leading-relaxed line-clamp-2">
                      {kural.meaning_tamil}
                    </p>
                  ) : language === 'en' ? (
                    <p className="mt-3 text-xs text-forest-800 italic font-serif leading-relaxed line-clamp-2">
                      "{kural.meaning_english}"
                    </p>
                  ) : (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs text-forest-900 font-tamil leading-relaxed line-clamp-2">
                        {kural.meaning_tamil}
                      </p>
                      <p className="text-xs text-forest-700 italic font-serif leading-relaxed line-clamp-2">
                        "{kural.meaning_english}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom View Button */}
                <div className="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between">
                  <span className="text-[11px] text-forest-500 font-medium">
                    {kural.division.split('-')[0].trim()}
                  </span>
                  <button
                    onClick={() => onOpenModal(kural.kural_number)}
                    className="text-xs font-bold text-gold-700 hover:text-gold-900 transition-colors flex items-center space-x-1"
                  >
                    <span>{t.detailsBtn}</span>
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pages > 1 && (
        <div className="flex items-center justify-center space-x-3 py-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white border border-cream-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream-100 text-forest-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs text-forest-800 font-bold font-mono">
            {t.pageOf} {page} / {pages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-2 rounded-xl bg-white border border-cream-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream-100 text-forest-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
