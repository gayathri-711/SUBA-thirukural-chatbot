import React, { useState } from 'react';
import { Menu, Search, BookOpen, Settings, Feather, Sparkles } from 'lucide-react';
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

  return (
    <header className="bg-gradient-to-r from-[#EDE9FE] via-[#F5F3FF] to-[#FAF8FF] border-b border-[#EDE9FE] sticky top-0 z-20 px-3 sm:px-6 py-3 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Thiruvalluvar Emblem */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-xl text-[#3B1E68] hover:bg-white/60 transition-colors md:hidden shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-full bg-white border border-[#DDD6FE] shadow-xs flex items-center justify-center text-[#6D28D9] shrink-0">
          <Feather className="w-5 h-5" />
        </div>
      </div>

      {/* Center: Lotus & SUBA Title */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center space-x-1.5 text-[#6D28D9]">
          <span className="text-lg">🪷</span>
          <span className="text-xl sm:text-2xl font-black tracking-widest text-[#3B1E68]">
            SUBA
          </span>
        </div>
        <p className="text-[11px] sm:text-xs font-medium text-slate-500">
          Your Thirukkural AI Companion
        </p>
      </div>

      {/* Right: Search / Direct Kural Jump & Settings */}
      <div className="flex items-center space-x-2">
        {/* Direct Kural Jump / Search */}
        <form onSubmit={handleJumpSubmit} className="relative hidden sm:block">
          <input
            type="number"
            min="1"
            max="1330"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder="Search Kural #..."
            className="w-32 lg:w-40 text-xs py-1.5 pl-7 pr-3 bg-white border border-[#EDE9FE] rounded-full focus:outline-hidden focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-slate-800 placeholder:text-slate-400 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </form>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenAiSettings}
          className="w-9 h-9 rounded-full bg-white border border-[#EDE9FE] shadow-xs flex items-center justify-center text-[#1E1B4B] hover:bg-slate-50 transition-colors cursor-pointer"
          title="Configure AI & Language Settings"
          aria-label="Settings"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}
