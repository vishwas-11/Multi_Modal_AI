'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/useChatStore';
import { useMediaStore } from '@/store/useMediaStore';
import { useSSE } from '@/hooks/useSSE';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import MediaUploader from '@/components/media/MediaUploader';
import { ErrorMessage } from '@/components/ui/index';

export default function ChatWindow() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showUploader, setShowUploader] = useState(false);
  const { activeConversation, activeConversationId, isStreaming, streamingContent, error, setError } = useChatStore();
  const { selectedMediaIds, clearSelection } = useMediaStore();
  const { sendStreamMessage, stopStream } = useSSE();

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, streamingContent, isStreaming]);

  const handleSend = (message: string) => {
    sendStreamMessage(message, activeConversationId || undefined, selectedMediaIds.length > 0 ? selectedMediaIds : undefined);
    clearSelection();
    setShowUploader(false);
  };

  const messages = activeConversation?.messages || [];

  return (
    <div className="flex flex-col h-full">
      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <div className="px-4 pt-3">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="w-12 h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] flex items-center justify-center">
              <div className="w-5 h-5 rounded border border-[var(--accent)] flex items-center justify-center">
                <div className="w-2 h-2 bg-[var(--accent)] rounded-sm" />
              </div>
            </div>
            <div>
              <p className="mb-1 font-display text-sm font-semibold text-[var(--text-secondary)]">Ready for analysis</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] max-w-sm">
                Upload media from the sidebar or attach files below, then ask anything about them.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-sm w-full text-[10px] font-mono text-[var(--text-muted)]">
              {[
                'List visible features in this image',
                'Transcribe and summarize this audio',
                'Extract all line items as JSON',
                'What happens at the 2-minute mark?',
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => handleSend(hint)}
                  className="text-left p-2.5 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-surface)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-raised)] transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {isStreaming && streamingContent && (
              <ChatMessage
                message={{ role: 'assistant', content: streamingContent, timestamp: new Date().toISOString() }}
                isStreaming
              />
            )}
            {isStreaming && !streamingContent && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Uploader panel */}
      <AnimatePresence>
        {showUploader && (
          <div className="border-t border-[var(--border-dim)] px-4 py-3 bg-[var(--bg-surface)]">
            <MediaUploader compact={false} />
          </div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-[var(--border-dim)] px-4 py-3 bg-[var(--bg-surface)]">
        <ChatInput
          onSend={handleSend}
          onStop={stopStream}
          isStreaming={isStreaming}
          showUploader={showUploader}
          onToggleUploader={() => setShowUploader((p) => !p)}
        />
      </div>
    </div>
  );
}
