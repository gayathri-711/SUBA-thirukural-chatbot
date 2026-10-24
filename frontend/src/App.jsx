import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import KuralModal from './components/KuralModal';
import AiSettingsModal from './components/AiSettingsModal';
import FloatingChatWidget from './components/FloatingChatWidget';
import WidgetErrorBoundary from './components/WidgetErrorBoundary';

import Home from './pages/Home';
import BrowseKurals from './pages/BrowseKurals';
import DailyKural from './pages/DailyKural';
import SavedKurals from './pages/SavedKurals';
import ChatHistory from './pages/ChatHistory';
import About from './pages/About';

import api from './services/api';

const STORAGE_KEY_SESSIONS = 'suba_chat_sessions_v1';
const STORAGE_KEY_SAVED = 'suba_saved_kurals_v1';
const STORAGE_KEY_LANG = 'suba_language_v1';
const STORAGE_KEY_AI = 'suba_ai_config_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEY_LANG) || 'auto');
  const [aiConfig, setAiConfig] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AI);
      return data ? JSON.parse(data) : { provider: 'suba', apiKey: '', model: 'suba-cognitive-v1' };
    } catch {
      return { provider: 'suba', apiKey: '', model: 'suba-cognitive-v1' };
    }
  });
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [modalKuralNumber, setModalKuralNumber] = useState(null);

  // Saved Kurals state
  const [savedKurals, setSavedKurals] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SAVED);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Sessions state
  const [sessions, setSessions] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    if (sessions && sessions.length > 0) {
      return sessions[0].id;
    }
    const initialId = Date.now().toString();
    return initialId;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync savedKurals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedKurals));
    } catch (e) {
      console.error('Failed to persist saved kurals:', e);
    }
  }, [savedKurals]);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to persist sessions:', e);
    }
  }, [sessions]);

  // Sync language to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANG, language);
  }, [language]);

  // Sync AI config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AI, JSON.stringify(aiConfig));
    } catch (e) {
      console.error('Failed to persist AI config:', e);
    }
  }, [aiConfig]);

  // Check health on load
  useEffect(() => {
    api.getHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.warn('Health check failed:', err));
  }, []);

  // Get current active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || {
    id: activeSessionId,
    title: 'புதிய உரையாடல்',
    timestamp: new Date().toLocaleDateString(),
    messages: []
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
  };

  const handleToggleSaveKural = (kural) => {
    setSavedKurals((prev) => {
      const exists = prev.some((k) => k.kural_number === kural.kural_number);
      if (exists) {
        return prev.filter((k) => k.kural_number !== kural.kural_number);
      } else {
        return [
          {
            kural_number: kural.kural_number,
            chapter_name_tamil: kural.chapter_name_tamil,
            chapter_name_english: kural.chapter_name_english,
            division: kural.division,
            line_1_tamil: kural.line_1_tamil,
            line_2_tamil: kural.line_2_tamil,
            meaning_english: kural.meaning_english,
            meaning_tamil: kural.meaning_tamil,
            savedAt: new Date().toISOString()
          },
          ...prev
        ];
      }
    });
  };

  const handleClearAllSaved = () => {
    if (window.confirm('சேமிக்கப்பட்ட அனைத்து குறள்களையும் நீக்க வேண்டுமா? (Clear all saved Kurals?)')) {
      setSavedKurals([]);
    }
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newSession = {
      id: newId,
      title: 'புதிய உரையாடல்',
      timestamp: new Date().toLocaleDateString(),
      messages: []
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setActiveTab('chat');
    setError(null);
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setActiveTab('chat');
    setError(null);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          const freshId = Date.now().toString();
          setActiveSessionId(freshId);
        }
      }
      return remaining;
    });
  };

  const handleClearAllSessions = () => {
    if (window.confirm('அனைத்து உரையாடல் வரலாற்றையும் நீக்க வேண்டுமா? (Clear all chat history?)')) {
      setSessions([]);
      const newId = Date.now().toString();
      setActiveSessionId(newId);
    }
  };

  const handleSendMessage = async (text, audioUrl = null) => {
    const userMsg = {
      sender: 'user',
      text,
      audioUrl: audioUrl || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update active session with user message immediately
    let targetSessionId = activeSessionId;
    let currentMessages = activeSession.messages || [];

    setSessions((prev) => {
      const index = prev.findIndex((s) => s.id === targetSessionId);
      const isFirst = (currentMessages.length === 0);
      const sessionTitle = isFirst ? (text.slice(0, 32) + (text.length > 32 ? '...' : '')) : (prev[index]?.title || 'உரையாடல்');

      if (index === -1) {
        const newSession = {
          id: targetSessionId,
          title: sessionTitle,
          timestamp: new Date().toLocaleDateString(),
          messages: [userMsg]
        };
        return [newSession, ...prev];
      } else {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          title: updated[index].title === 'புதிய உரையாடல்' ? sessionTitle : updated[index].title,
          messages: [...updated[index].messages, userMsg]
        };
        return updated;
      }
    });

    setLoading(true);
    setError(null);

    try {
      const resp = await api.sendChatMessage(text, language, 3, aiConfig);

      const botMsg = {
        sender: 'suba',
        text: resp.answer,
        answer: resp.answer,
        answer_tamil: resp.answer_tamil,
        answer_english: resp.answer_english,
        practical_takeaway: resp.practical_takeaway,
        practical_takeaway_tamil: resp.practical_takeaway_tamil,
        practical_takeaway_english: resp.practical_takeaway_english,
        language: resp.language || language,
        kurals: resp.kurals || [],
        grounded: resp.grounded,
        related_kurals: resp.related_kurals || [],
        ai_model: resp.ai_model || 'SUBA AI Cognitive Engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === targetSessionId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            messages: [...updated[index].messages, botMsg]
          };
          return updated;
        }
        return prev;
      });
      setLoading(false);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'சுபாவிடம் இருந்து பதில் பெறுவதில் சிக்கல் ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
      setLoading(false);
    }
  };

  const handleFeedback = (question, kuralNumber, helpful) => {
    api.submitFeedback({
      question,
      kural_number: kuralNumber,
      helpful
    }).catch((err) => console.error('Feedback submit error:', err));
  };

  return (
    <div className="h-full flex overflow-hidden bg-cream-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        savedCount={savedKurals.length}
        health={health}
        language={language}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSelectKural={(num) => setModalKuralNumber(num)}
          language={language}
          onChangeLanguage={handleLanguageChange}
          health={health}
          aiConfig={aiConfig}
          onOpenAiSettings={() => setAiModalOpen(true)}
        />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {activeTab === 'chat' && (
            <Home
              messages={activeSession.messages || []}
              onSendMessage={handleSendMessage}
              loading={loading}
              error={error}
              onRetry={() => {
                const lastUser = [...(activeSession.messages || [])].reverse().find((m) => m.sender === 'user');
                if (lastUser) handleSendMessage(lastUser.text);
              }}
              onSaveKural={handleToggleSaveKural}
              savedKurals={savedKurals}
              onOpenModal={(num) => setModalKuralNumber(num)}
              onFeedback={handleFeedback}
              language={language}
            />
          )}

          {activeTab === 'browse' && (
            <BrowseKurals
              onOpenModal={(num) => setModalKuralNumber(num)}
              savedKurals={savedKurals}
              onToggleSave={handleToggleSaveKural}
              language={language}
            />
          )}

          {activeTab === 'daily' && (
            <DailyKural
              onOpenModal={(num) => setModalKuralNumber(num)}
              savedKurals={savedKurals}
              onToggleSave={handleToggleSaveKural}
              language={language}
            />
          )}

          {activeTab === 'saved' && (
            <SavedKurals
              savedKurals={savedKurals}
              onToggleSave={handleToggleSaveKural}
              onOpenModal={(num) => setModalKuralNumber(num)}
              onClearAll={handleClearAllSaved}
              language={language}
            />
          )}

          {activeTab === 'history' && (
            <ChatHistory
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              onClearAllSessions={handleClearAllSessions}
              onNewChat={handleNewChat}
              language={language}
            />
          )}

          {activeTab === 'about' && <About language={language} />}
        </main>
      </div>

      {/* Kural Full Detail Modal */}
      {modalKuralNumber && (
        <KuralModal
          kuralNumber={modalKuralNumber}
          onClose={() => setModalKuralNumber(null)}
          isSaved={savedKurals.some((s) => s.kural_number === modalKuralNumber)}
          onToggleSave={handleToggleSaveKural}
          language={language}
        />
      )}

      {/* AI Bot & Model Configuration Modal */}
      <AiSettingsModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        aiConfig={aiConfig}
        onSaveConfig={(newCfg) => setAiConfig(newCfg)}
        language={language}
      />

      {/* Floating Chatbot Widget on all other tabs (Browse, Daily, Saved, History, About) */}
      {activeTab !== 'chat' && (
        <WidgetErrorBoundary name="Chatbot Widget">
          <FloatingChatWidget
            language={language}
            aiConfig={aiConfig}
            onOpenModal={(num) => setModalKuralNumber(num)}
          />
        </WidgetErrorBoundary>
      )}
    </div>
  );
}
