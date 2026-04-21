// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Media ────────────────────────────────────────────────────────────────────
export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface VideoMetadata {
  fps: number;
  codec: string;
  hasAudio: boolean;
  audioCodec?: string;
  frameCount: number;
  framesExtracted?: number;
  extractionStrategy?: string;
}

export interface WaveformData {
  peaks: number[];
  duration: number;
}

export interface MediaAnalysis {
  summary?: string;
  description?: string;
  keyMoments?: Array<{ timestamp: number; description: string }>;
  transcription?: string;
  extractedText?: string;
  structuredData?: Record<string, unknown>;
  tables?: Array<{ headers: string[]; rows: string[][] }>;
  chartData?: Record<string, unknown>;
  tags?: string[];
  sentiment?: string;
  actionItems?: string[];
  keyTopics?: string[];
  speakerCount?: number;
  speakers?: Record<string, string>;
  decisions?: string[];
  language?: string;
  analyzedAt: string;
}

export interface Media {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  type: MediaType;
  mimeType: string;
  size: number;
  dimensions?: MediaDimensions;
  duration?: number;
  thumbnail?: string;
  posterFrame?: string;
  waveformData?: WaveformData;
  videoMetadata?: VideoMetadata;
  pageCount?: number;
  hasAnalysis: boolean;
  analysis?: MediaAnalysis;
  createdAt: string;
}

export interface SessionGallery {
  images: Media[];
  videos: Media[];
  audio: Media[];
  documents: Media[];
  total: number;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  mediaIds?: string[];
  timestamp: string;
  tokens?: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessage?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ConversationDetail {
  _id: string;
  title: string;
  messages: ChatMessage[];
  mediaContext: string[];
  aiModel: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Upload ───────────────────────────────────────────────────────────────────
export interface UploadProgress {
  file: File;
  progress: number;
  speed: number;
  eta: number;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  error?: string;
  result?: Media;
}

// ─── Analysis ─────────────────────────────────────────────────────────────────
export interface AnalysisRequest {
  mediaId: string;
  prompt?: string;
  language?: string;
  enableDiarization?: boolean;
  strategy?: 'fixed_interval' | 'scene_change' | 'uniform';
  extractionType?: 'invoice' | 'table' | 'form' | 'receipt' | 'general';
}

export interface ComparisonResult {
  itemsCompared: number;
  mediaIds: Array<{ id: string; name: string; type: string }>;
  comparison: string;
}

export interface BatchResult {
  processed: number;
  prompt: string;
  results: Array<{
    mediaId: string;
    originalName: string;
    type: string;
    url: string;
    thumbnail?: string;
    analysis?: MediaAnalysis;
    error?: string;
  }>;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}