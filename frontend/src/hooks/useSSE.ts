'use client';
import { useCallback, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { chatApi } from '@/lib/api';

export const useSSE = () => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const partialContentRef = useRef<string>('');
  const conversationIdRef = useRef<string>('');
  const { setStreaming, appendStreamChunk, finalizeStream, addMessage, setError } = useChatStore();

  const stopStream = useCallback((opts?: { commitPartial?: boolean }) => {
    const commitPartial = opts?.commitPartial !== false;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (commitPartial && partialContentRef.current.trim().length > 0) {
      // Preserve the streamed text in the UI when user stops early.
      addMessage({
        role: 'assistant',
        content: partialContentRef.current,
        timestamp: new Date().toISOString(),
      });
    }

    partialContentRef.current = '';
    conversationIdRef.current = '';
    setStreaming(false);
  }, [addMessage, setStreaming]);

  const sendStreamMessage = useCallback((
    message: string,
    conversationId?: string,
    mediaIds?: string[]
  ) => {
    // Close any existing stream
    stopStream({ commitPartial: true });

    // Add user message to UI immediately
    addMessage({
      role: 'user',
      content: message,
      mediaIds,
      timestamp: new Date().toISOString(),
    });

    setStreaming(true, '');

    const url = chatApi.getStreamUrl(message, conversationId, mediaIds);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    let fullContent = '';
    let finalConversationId = conversationId || '';
    partialContentRef.current = '';
    conversationIdRef.current = finalConversationId;

    es.addEventListener('conversation', (e) => {
      const data = JSON.parse(e.data);
      finalConversationId = data.conversationId;
      conversationIdRef.current = finalConversationId;
    });

    es.addEventListener('chunk', (e) => {
      const data = JSON.parse(e.data);
      if (data.text) {
        fullContent += data.text;
        partialContentRef.current = fullContent;
        appendStreamChunk(data.text);
      }
    });

    es.addEventListener('done', () => {
      finalizeStream(fullContent, finalConversationId);
      partialContentRef.current = '';
      conversationIdRef.current = '';
      es.close();
      eventSourceRef.current = null;
    });

    es.addEventListener('error', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data || '{}');
        setError(data.message || 'Stream connection failed');
      } catch {
        setError('Stream connection failed');
      }
      stopStream({ commitPartial: false });
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        stopStream({ commitPartial: false });
      }
    };

    return () => stopStream();
  }, [addMessage, appendStreamChunk, finalizeStream, setStreaming, setError, stopStream]);

  return { sendStreamMessage, stopStream };
};