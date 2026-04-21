'use client';
import { create } from 'zustand';
import { chatApi } from '@/lib/api';
import type { Conversation, ConversationDetail, ChatMessage } from '@/types';

type ConversationApiItem = Partial<Conversation> & {
  _id?: string;
  id?: string;
  messages?: ChatMessage[];
};

const getConversationId = (conversation: ConversationApiItem): string => {
  return String(conversation.id || conversation._id || '');
};

const normalizeConversation = (conversation: ConversationApiItem): Conversation => {
  const id = getConversationId(conversation);
  const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
  const now = new Date().toISOString();

  return {
    id,
    title: conversation.title || 'Untitled conversation',
    messageCount: typeof conversation.messageCount === 'number' ? conversation.messageCount : messages.length,
    lastMessage: conversation.lastMessage || messages[messages.length - 1]?.content,
    updatedAt: conversation.updatedAt || now,
    createdAt: conversation.createdAt || now,
  };
};

interface ChatState {
  conversations: Conversation[];
  activeConversation: ConversationDetail | null;
  activeConversationId: string | null;
  isStreaming: boolean;
  streamingContent: string;
  isLoading: boolean;
  error: string | null;

  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  setActiveConversationId: (id: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  setStreaming: (streaming: boolean, content?: string) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: (fullContent: string, conversationId: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  clearConversation: (id: string) => Promise<void>;
  regenerate: (id: string) => Promise<string>;
  setError: (error: string | null) => void;
  newConversation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  activeConversationId: null,
  isStreaming: false,
  streamingContent: '',
  isLoading: false,
  error: null,

  loadConversations: async () => {
    try {
      const res = await chatApi.getConversations();
      const normalized = (res.data.data || [])
        .map((conversation) => normalizeConversation(conversation as ConversationApiItem))
        .filter((conversation) => conversation.id);
      set({ conversations: normalized });
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      set({ error: e.displayMessage || 'Failed to load conversations' });
    }
  },

  loadConversation: async (id) => {
    if (!id || id === 'undefined') {
      set({ error: 'Invalid conversation id' });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await chatApi.getConversation(id);
      set({ activeConversation: res.data.data, activeConversationId: id, isLoading: false });
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      set({ error: e.displayMessage || 'Failed to load conversation', isLoading: false });
    }
  },

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  addMessage: (message) => {
    set((state) => {
      if (!state.activeConversation) {
        const now = new Date().toISOString();
        return {
          activeConversation: {
            _id: state.activeConversationId || 'pending',
            title: message.content.substring(0, 80) || 'New Conversation',
            messages: [message],
            mediaContext: message.mediaIds || [],
            aiModel: 'gemini-1.5-pro',
            createdAt: now,
            updatedAt: now,
          },
        };
      }
      return {
        activeConversation: {
          ...state.activeConversation,
          messages: [...state.activeConversation.messages, message],
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  setStreaming: (streaming, content = '') => {
    set({ isStreaming: streaming, streamingContent: content });
  },

  appendStreamChunk: (chunk) => {
    set((state) => ({ streamingContent: state.streamingContent + chunk }));
  },

  finalizeStream: (fullContent, conversationId) => {
    const newMessage: ChatMessage = {
      role: 'assistant',
      content: fullContent,
      timestamp: new Date().toISOString(),
    };
    set((state) => {
      const conv = state.activeConversation;
      if (!conv) {
        const now = new Date().toISOString();
        return {
          isStreaming: false,
          streamingContent: '',
          activeConversationId: conversationId,
          activeConversation: {
            _id: conversationId,
            title: 'New Conversation',
            messages: [newMessage],
            mediaContext: [],
            aiModel: 'gemini-1.5-pro',
            createdAt: now,
            updatedAt: now,
          },
        };
      }
      return {
        isStreaming: false,
        streamingContent: '',
        activeConversationId: conversationId,
        activeConversation: {
          ...conv,
          _id: conversationId || conv._id,
          messages: [...conv.messages, newMessage],
          updatedAt: new Date().toISOString(),
        },
      };
    });
    // Refresh conversation list
    get().loadConversations();
    if (conversationId) get().loadConversation(conversationId);
  },

  deleteConversation: async (id) => {
    await chatApi.deleteConversation(id);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversation: state.activeConversationId === id ? null : state.activeConversation,
      activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
    }));
  },

  clearConversation: async (id) => {
    await chatApi.clearConversation(id);
    set((state) => ({
      activeConversation: state.activeConversation
        ? { ...state.activeConversation, messages: [] }
        : null,
    }));
  },

  regenerate: async (id) => {
    const res = await chatApi.regenerate(id);
    const newMsg = res.data.data as { message: string };
    set((state) => {
      if (!state.activeConversation) return state;
      const messages = [...state.activeConversation.messages];
      if (messages[messages.length - 1]?.role === 'assistant') messages.pop();
      messages.push({ role: 'assistant', content: newMsg.message, timestamp: new Date().toISOString() });
      return { activeConversation: { ...state.activeConversation, messages } };
    });
    return newMsg.message;
  },

  setError: (error) => set({ error }),

  newConversation: () => set({ activeConversation: null, activeConversationId: null, streamingContent: '' }),
}));