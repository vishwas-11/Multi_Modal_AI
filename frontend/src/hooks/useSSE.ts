'use client';
import { useCallback, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { chatApi } from '@/lib/api';

export const useSSE = () => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { setStreaming, appendStreamChunk, finalizeStream, addMessage, setError } = useChatStore();

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStreaming(false);
  }, [setStreaming]);

  const sendStreamMessage = useCallback((
    message: string,
    conversationId?: string,
    mediaIds?: string[]
  ) => {
    // Close any existing stream
    stopStream();

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

    es.addEventListener('conversation', (e) => {
      const data = JSON.parse(e.data);
      finalConversationId = data.conversationId;
    });

    es.addEventListener('chunk', (e) => {
      const data = JSON.parse(e.data);
      if (data.text) {
        fullContent += data.text;
        appendStreamChunk(data.text);
      }
    });

    es.addEventListener('done', () => {
      finalizeStream(fullContent, finalConversationId);
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
      stopStream();
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        stopStream();
      }
    };

    return () => stopStream();
  }, [addMessage, appendStreamChunk, finalizeStream, setStreaming, setError, stopStream]);

  return { sendStreamMessage, stopStream };
};