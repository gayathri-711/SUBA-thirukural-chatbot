import React, { useState } from 'react';
import { Menu, Search, BookOpen, Globe, Check } from 'lucide-react';
import { getT } from '../utils/translations';

export default function Header({
  activeTab,
  onToggleSidebar,
  onSelectKural,
  language,
  onChangeLanguage,
  health,
  aiConfig,
  onOpenAiSettings
}) {
  const [jumpInput, setJumpInput] = useState('');
  const t = getT(language);

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(jumpInput.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= 1330) {
      onSelectKural(num);
      setJumpInput('');
    }
  };

  const title = t.pageTitles[activeTab] || 'SUBA';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-cream-300 sticky top-0 z-20 px-3 sm:px-5 py-3 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-xl text-forest-800 hover:bg-cream-200 transition-colors md:hidden shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <h1 className="text-sm md:text-base font-bold text-forest-950 font-tamil truncate flex items-center gap-2">
            <span>{title}</span>
          </h1>
          <p className="text-[11px] text-forest-600 hidden sm:block truncate">
            {t.headerSubtitle}
          </p>
        </div>
      </div>

      {/* Right: Direct Kural Jump & Language Selector */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Direct Kural Jump */}
        <form onSubmit={handleJumpSubmit} className="relative hidden md:block">
          <input
            type="number"
            min="1"
            max="1330"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder={t.goToKural}
            className="w-36 lg:w-44 text-xs py-1.5 pl-7 pr-3 bg-cream-100 border border-cream-300 rounded-full focus:outline-hidden focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-forest-900 placeholder:text-forest-400"
          />
          <BookOpen className="w-3.5 h-3.5 text-forest-500 absolute left-2.5 top-2.5" />
        </form>

        {/* Dynamic Language Selector */}
        <div className="flex items-center bg-cream-100 border border-gold-300/60 rounded-full p-0.5 text-xs shadow-xs" data-testid="language-selector">
          <button
            id="lang-btn-tamil"
            data-testid="lang-btn-tamil"
            onClick={() => onChangeLanguage('ta')}
            className={`px-3 py-1 rounded-full font-bold transition-all duration-200 flex items-center space-x-1 cursor-pointer ${
              language === 'ta'
                ? 'bg-forest-800 text-gold-300 shadow-sm'
                : 'text-forest-700 hover:text-forest-950 hover:bg-cream-200'
            }`}
            title="முழுவதும் தமிழில் மாற்றுக (Translate All to Tamil)"
          >
            <span>தமிழ்</span>
            {language === 'ta' && <Check className="w-3 h-3 text-gold-400 ml-0.5" />}
          </button>

          <button
            id="lang-btn-english"
            data-testid="lang-btn-english"
            onClick={() => onChangeLanguage('en')}
            className={`px-3 py-1 rounded-full font-bold transition-all duration-200 flex items-center space-x-1 cursor-pointer ${
              language === 'en'
                ? 'bg-forest-800 text-gold-300 shadow-sm'
                : 'text-forest-700 hover:text-forest-950 hover:bg-cream-200'
            }`}
            title="Translate All to English"
          >
            <span>English</span>
            {language === 'en' && <Check className="w-3 h-3 text-gold-400 ml-0.5" />}
          </button>

          <button
            id="lang-btn-auto"
            data-testid="lang-btn-auto"
            onClick={() => onChangeLanguage('auto')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
              language === 'auto'
                ? 'bg-forest-700 text-white shadow-xs'
                : 'text-forest-500 hover:text-forest-800'
            }`}
            title="தானியங்கி மொழி கண்டறிதல் (Auto Detect)"
          >
            <span>Auto</span>
          </button>
        </div>

        {/* AI Bot Model Selector & Settings Button */}
        <button
          id="btn-open-ai-settings"
          data-testid="btn-open-ai-settings"
          onClick={onOpenAiSettings}
          className="px-2.5 sm:px-3 py-1.5 rounded-full bg-cream-100 hover:bg-gold-100 border border-gold-300/80 text-forest-900 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
          title="Configure AI Model (ChatGPT, Gemini, SUBA Engine)"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-tamil text-[11px] sm:text-xs">
            {aiConfig?.provider === 'gemini'
              ? '🤖 Gemini AI'
              : aiConfig?.provider === 'openai'
              ? '🧠 ChatGPT'
              : '⚡ SUBA AI'}
          </span>
        </button>

        {/* Database status badge */}
        <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1 bg-forest-50 border border-forest-100 rounded-full text-xs text-forest-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold">{t.kuralsReady}</span>
        </div>
      </div>
    </header>
  );
}
