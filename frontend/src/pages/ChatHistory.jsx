import React from 'react';
import { History, MessageSquare, Trash2, ArrowRight, Plus } from 'lucide-react';
import { getT } from '../utils/translations';

export default function ChatHistory({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAllSessions,
  onNewChat,
  language = 'auto'
}) {
  const t = getT(language);
  const isTamil = language === 'ta';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-300 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-forest-950 font-tamil flex items-center space-x-2">
            <History className="w-6 h-6 text-gold-500" />
            <span>{t.historyTitle}</span>
          </h1>
          <p className="text-xs text-forest-600 mt-1">
            {t.historySubtitle} • {sessions.length} {t.history}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNewChat}
            className="px-3.5 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-gold-300 text-xs font-bold shadow-xs flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.newChat}</span>
          </button>

          {sessions.length > 0 && (
            <button
              onClick={onClearAllSessions}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearHistory}</span>
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      {sessions.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-cream-300 p-8 shadow-xs">
          <History className="w-12 h-12 text-forest-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-forest-900 font-tamil">
            {t.noHistoryYet}
          </h3>
          <p className="text-xs text-forest-600 max-w-sm mx-auto mt-1 mb-4">
            {isTamil
              ? 'சுபாவிடம் நீங்கள் உரையாடும் தகவல்கள் இங்கே தானாகப் பாதுகாக்கப்படும்.'
              : 'Your chat questions and answers with SUBA are preserved here for easy reference.'}
          </p>
          <button
            onClick={onNewChat}
            className="px-4 py-2 rounded-xl bg-forest-800 text-gold-300 text-xs font-bold hover:bg-forest-700 transition-colors inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.startNewChat}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isCurrent = activeSessionId === session.id;
            const messageCount = session.messages?.length || 0;
            const firstUserMsg = session.messages?.find((m) => m.sender === 'user')?.text || session.title;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                  isCurrent
                    ? 'bg-cream-100/90 border-gold-400 shadow-card'
                    : 'bg-white border-cream-300 hover:border-gold-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0 pr-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCurrent ? 'bg-forest-800 text-gold-400' : 'bg-cream-200 text-forest-700 group-hover:bg-gold-100'
                  }`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-forest-900 truncate">
                        {session.title || t.newChat}
                      </h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-forest-800 text-gold-300 text-[10px] font-bold">
                          {t.activeNow}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-forest-600 truncate mt-0.5">
                      {firstUserMsg}
                    </p>

                    <div className="flex items-center space-x-3 mt-2 text-[11px] text-forest-500 font-mono">
                      <span>{session.timestamp || 'Today'}</span>
                      <span>•</span>
                      <span>{messageCount} {t.messagesCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="p-2 text-forest-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title={t.clearHistory}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-2 text-forest-400 group-hover:text-forest-800 group-hover:translate-x-1 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
