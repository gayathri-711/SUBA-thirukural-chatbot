import React from 'react';
import {
  MessageSquare,
  BookOpen,
  Sun,
  Bookmark,
  History,
  Info,
  Plus,
  Trash2,
  X,
  Scroll
} from 'lucide-react';
import { getT } from '../utils/translations';

export default function Sidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  savedCount,
  language
}) {
  const t = getT(language);

  const navItems = [
    { id: 'chat', label: t.chat, icon: MessageSquare },
    { id: 'daily', label: t.daily, icon: Sun },
    { id: 'browse', label: t.browse, icon: BookOpen },
    { id: 'saved', label: `${t.saved} ${savedCount > 0 ? `(${savedCount})` : ''}`, icon: Bookmark },
    { id: 'history', label: t.history, icon: History },
    { id: 'about', label: t.about, icon: Info },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-forest-950/50 backdrop-blur-xs z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-forest-800 text-cream-100 flex flex-col transition-transform duration-300 ease-in-out shadow-xl md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-forest-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-forest-900 shadow-md">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display font-bold tracking-wider text-lg text-white">
                  {t.appName}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-sm bg-gold-500/20 text-gold-300 font-semibold border border-gold-500/30">AI</span>
              </div>
              <p className="text-xs text-cream-300 font-tamil">{t.appSubtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cream-300 hover:text-white hover:bg-forest-700 md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-forest-950 font-bold text-sm shadow-md transition-all duration-150 transform active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newChat}</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="px-3 py-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-forest-700 text-gold-300 font-bold shadow-xs'
                    : 'text-cream-200 hover:bg-forest-700/50 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-cream-300'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Recent Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 border-t border-forest-700/40">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold text-forest-300 uppercase tracking-wider">
              {t.recentChats}
            </span>
            <span className="text-xs text-forest-400 font-mono">
              {sessions.length}
            </span>
          </div>

          <div className="space-y-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-forest-400 px-2 py-3 italic">
                {t.noChatsYet}
              </p>
            ) : (
              sessions.slice(0, 10).map((session) => {
                const isSelected = activeSessionId === session.id;
                return (
                  <div
                    key={session.id}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-forest-700 text-white font-medium'
                        : 'text-cream-300 hover:bg-forest-700/40 hover:text-cream-100'
                    }`}
                    onClick={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-forest-400" />
                      <span className="truncate">
                        {session.title || t.newChat}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-forest-400 hover:text-rose-400 rounded transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info & status */}
        <div className="p-3 border-t border-forest-700/60 bg-forest-900/60 text-xs text-cream-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs text-cream-200">{t.kuralsVerified}</span>
            </div>
            <span className="text-forest-400 text-[10px]">v1.0</span>
          </div>
          <p className="text-[11px] text-forest-400 mt-1">
            {t.authorName}
          </p>
        </div>
      </aside>
    </>
  );
}
