export interface ThumbnailResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
}
export interface WaveformData {
    peaks: number[];
    duration: number;
    sampleRate: number;
}
export interface PosterFrameResult {
    url: string;
    publicId: string;
    timestamp: number;
}
/**
 * Generate thumbnail from image and upload to Cloudinary
 */
export declare const generateImageThumbnail: (imagePath: string, size?: number) => Promise<ThumbnailResult>;
/**
 * Extract poster frame from video (at 10% duration for a representative frame)
 */
export declare const extractVideoPosterFrame: (videoPath: string, durationSeconds: number) => Promise<PosterFrameResult>;
/**
 * Generate waveform data from audio file using FFmpeg
 * Returns normalized peak amplitude values for waveform visualization
 */
export declare const generateAudioWaveform: (audioPath: string, numSamples?: number) => Promise<WaveformData>;
/**
 * Get audio duration in seconds
 */
export declare const getAudioDuration: (audioPath: string) => Promise<number>;
/**
 * Process clipboard-pasted image data (base64 or buffer)
 * Validates and saves to temp, returns file-like object
 */
export declare const processClipboardImage: (base64Data: string, mimeType?: string) => Promise<{
    tempPath: string;
    size: number;
    mimeType: string;
}>;
/**
 * Generate thumbnail for document page image
 */
export declare const generateDocumentThumbnail: (imagePath: string) => Promise<ThumbnailResult>;
//# sourceMappingURL=mediaProcessor.d.ts.map