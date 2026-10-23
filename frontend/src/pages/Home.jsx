import React from 'react';
import ChatWindow from '../components/ChatWindow';

export default function Home({
  messages,
  onSendMessage,
  loading,
  error,
  onRetry,
  onSaveKural,
  savedKurals,
  onOpenModal,
  onFeedback,
  language
}) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ChatWindow
        messages={messages}
        onSendMessage={onSendMessage}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onSaveKural={onSaveKural}
        savedKurals={savedKurals}
        onOpenModal={onOpenModal}
        onFeedback={onFeedback}
        language={language}
      />
    </div>
  );
}
