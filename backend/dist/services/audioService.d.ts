export interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
    speaker?: string;
    confidence?: number;
}
export interface TranscriptionResult {
    text: string;
    language?: string;
    duration?: number;
    segments?: TranscriptionSegment[];
    formattedWithTimestamps: string;
}
export interface AudioAnalysis {
    transcription: TranscriptionResult;
    summary: string;
    actionItems: string[];
    keyTopics: string[];
    sentiment: string;
    speakerCount?: number;
    speakers?: Record<string, string>;
    decisions?: string[];
    language?: string;
}
export declare const transcribeAudio: (audioPath: string, language?: string) => Promise<TranscriptionResult>;
export declare const applySpeakerDiarization: (transcription: TranscriptionResult) => Promise<TranscriptionResult>;
export declare const analyzeAudioFull: (audioPath: string, userPrompt?: string, language?: string, enableDiarization?: boolean) => Promise<AudioAnalysis>;
export declare const analyzeAudioFromUrl: (url: string, userPrompt?: string, language?: string) => Promise<AudioAnalysis>;
declare const formatWithTimestamps: (segments: TranscriptionSegment[], fallback: string) => string;
export { formatWithTimestamps as formatTranscriptionWithTimestamps };
//# sourceMappingURL=audioService.d.ts.map