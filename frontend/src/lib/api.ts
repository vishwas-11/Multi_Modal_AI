import axios, { AxiosProgressEvent } from 'axios';
import Cookies from 'js-cookie';
import type {
  AuthResponse, Media, SessionGallery, ConversationDetail,
  Conversation, MediaAnalysis, ComparisonResult, BatchResult,
  AnalysisRequest,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error normalizer
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'An unexpected error occurred';
    error.displayMessage = message;
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post<{ success: boolean; data: AuthResponse }>('/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: AuthResponse }>('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<{ success: boolean; data: AuthResponse['user'] }>('/auth/me'),
};

// ─── Upload ───────────────────────────────────────────────────────────────────
export const uploadApi = {
  uploadFiles: (
    files: File[],
    onProgress?: (progress: number, speed: number, eta: number) => void
  ) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    let startTime = Date.now();
    let lastLoaded = 0;

    return api.post<{ success: boolean; data: Media | Media[] }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e: AxiosProgressEvent) => {
        if (!e.total) return;
        const progress = Math.round((e.loaded / e.total) * 100);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? (e.loaded - lastLoaded) / elapsed : 0;
        const remaining = e.total - e.loaded;
        const eta = speed > 0 ? remaining / speed : 0;
        lastLoaded = e.loaded;
        startTime = Date.now();
        onProgress?.(progress, speed, eta);
      },
    });
  },

  uploadClipboard: (imageData: string, mimeType?: string) =>
    api.post<{ success: boolean; data: Media }>('/upload/clipboard', { imageData, mimeType }),

  listMedia: (params?: { page?: number; limit?: number; type?: string; session?: boolean }) =>
    api.get<{ success: boolean; data: Media[] }>('/media', { params }),

  getMedia: (id: string) =>
    api.get<{ success: boolean; data: Media }>(`/media/${id}`),

  deleteMedia: (id: string) =>
    api.delete(`/media/${id}`),

  getGallery: () =>
    api.get<{ success: boolean; data: SessionGallery }>('/gallery/gallery'),

  getWaveform: (id: string) =>
    api.get<{ success: boolean; data: { peaks: number[]; duration: number } }>(`/gallery/${id}/waveform`),
};

// ─── Analysis ─────────────────────────────────────────────────────────────────
export const analyzeApi = {
  analyzeImage: (req: AnalysisRequest) =>
    api.post<{ success: boolean; data: { mediaId: string; analysis: MediaAnalysis } }>('/analyze/image', req),

  ocrImage: (mediaId: string) =>
    api.post<{ success: boolean; data: { mediaId: string; extractedText: string } }>('/analyze/image/ocr', { mediaId }),

  structuredExtract: (mediaId: string, extractionType: string, prompt?: string) =>
    api.post('/analyze/image/structured', { mediaId, extractionType, prompt }),

  analyzeChart: (mediaId: string, prompt?: string) =>
    api.post('/analyze/image/chart', { mediaId, prompt }),

  analyzeVideo: (req: AnalysisRequest) =>
    api.post<{ success: boolean; data: { mediaId: string; analysis: MediaAnalysis; framesAnalyzed: number } }>('/analyze/video', req),

  temporalVideoQA: (mediaId: string, question: string) =>
    api.post('/analyze/video/temporal-qa', { mediaId, prompt: question }),

  analyzeAudio: (req: AnalysisRequest) =>
    api.post<{ success: boolean; data: { mediaId: string; analysis: MediaAnalysis } }>('/analyze/audio', req),

  analyzeDocument: (req: AnalysisRequest) =>
    api.post<{ success: boolean; data: { mediaId: string; analysis: MediaAnalysis } }>('/analyze/document', req),

  analyzeMultiPage: (mediaIds: string[], prompt?: string) =>
    api.post('/analyze/document/multipage', { mediaIds, prompt }),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  sendMessage: (message: string, conversationId?: string, mediaIds?: string[]) =>
    api.post<{ success: boolean; data: { conversationId: string; message: string; role: string } }>(
      '/chat', { message, conversationId, mediaIds }
    ),

  getStreamUrl: (message: string, conversationId?: string, mediaIds?: string[]) => {
    const token = Cookies.get('token');
    const params = new URLSearchParams({ message });
    if (conversationId) params.set('conversationId', conversationId);
    const cleanMediaIds = (mediaIds || []).filter((id) => typeof id === 'string' && id && id !== 'undefined');
    if (cleanMediaIds.length) params.set('mediaIds', cleanMediaIds.join(','));
    if (token) params.set('token', token); // SSE can't use headers
    return `${BASE_URL}/api/chat/stream?${params.toString()}`;
  },

  getConversations: () =>
    api.get<{ success: boolean; data: Conversation[] }>('/chat/conversations'),

  getConversation: (id: string) =>
    api.get<{ success: boolean; data: ConversationDetail }>(`/chat/conversations/${id}`),

  deleteConversation: (id: string) =>
    api.delete(`/chat/conversations/${id}`),

  regenerate: (id: string) =>
    api.post(`/chat/conversations/${id}/regenerate`),

  clearConversation: (id: string) =>
    api.post(`/chat/conversations/${id}/clear`),

  exportConversation: (id: string, format: 'md' | 'html') => {
    const token = Cookies.get('token');
    window.open(`${BASE_URL}/api/chat/conversations/${id}/export?format=${format}&token=${token}`, '_blank');
  },
};

// ─── Compare & Batch ──────────────────────────────────────────────────────────
export const compareApi = {
  compare: (mediaIds: string[], prompt?: string) =>
    api.post<{ success: boolean; data: ComparisonResult }>('/compare', { mediaIds, prompt }),

  batch: (mediaIds: string[], prompt?: string) =>
    api.post<{ success: boolean; data: BatchResult }>('/batch', { mediaIds, prompt }),
};

export default api;