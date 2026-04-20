import { GenerateContentStreamResult } from '@google/generative-ai';
import { VideoFrame } from './videoService';
import { DocumentPage } from './documentService';
export interface GeminiMessage {
    role: 'user' | 'model';
    content: string;
    imageParts?: Array<{
        base64: string;
        mimeType: string;
    }>;
}
export interface AnalysisResult {
    summary: string;
    description?: string;
    tags?: string[];
    sentiment?: string;
    keyMoments?: Array<{
        timestamp: number;
        description: string;
    }>;
    structuredData?: Record<string, unknown>;
    extractedText?: string;
    chartData?: Record<string, unknown>;
}
export declare const analyzeImage: (imagePath: string, prompt?: string) => Promise<AnalysisResult>;
export declare const performOCR: (imagePath: string) => Promise<{
    summary: string;
    extractedText: string;
}>;
export declare const analyzeVideoFrames: (frames: VideoFrame[], duration: number) => Promise<AnalysisResult>;
export declare const analyzeDocument: (text: string) => Promise<AnalysisResult>;
export declare const analyzeDocumentPages: (pages: DocumentPage[], question?: string) => Promise<AnalysisResult>;
export declare const extractStructuredData: (pages: DocumentPage[], extractionType?: string) => Promise<AnalysisResult>;
export declare const analyzeChart: (imagePath: string) => Promise<AnalysisResult>;
export declare const analyzeTranscription: (transcriptionText: string, prompt?: string) => Promise<AnalysisResult>;
export declare const answerTemporalVideoQuestion: (frames: VideoFrame[], question: string) => Promise<AnalysisResult>;
export declare const chatWithContext: (messages: GeminiMessage[], systemPrompt?: string) => Promise<string>;
export declare const streamChatWithContext: (messages: GeminiMessage[], systemPrompt?: string) => Promise<GenerateContentStreamResult>;
export declare const summarizeConversationContext: (context: string) => Promise<string>;
export declare const compareMedia: (items: Array<{
    type: string;
    content: string | {
        base64: string;
        mimeType: string;
    };
}>, prompt?: string) => Promise<string>;
//# sourceMappingURL=geminiService.d.ts.map