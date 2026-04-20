export interface ProcessedImage {
    buffer: Buffer;
    base64: string;
    mimeType: string;
    width: number;
    height: number;
    size: number;
}
export interface ImageMetadata {
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
}
/**
 * Resize and compress image for LLM processing
 * Never sends large images to Gemini — always resizes first
 */
export declare const processImageForAI: (inputPath: string) => Promise<ProcessedImage>;
/**
 * Process image from buffer
 */
export declare const processImageBufferForAI: (inputBuffer: Buffer) => Promise<ProcessedImage>;
/**
 * Generate thumbnail from image
 */
export declare const generateThumbnail: (inputPath: string, outputPath: string, size?: number) => Promise<string>;
/**
 * Generate thumbnail from buffer
 */
export declare const generateThumbnailBuffer: (inputPath: string, size?: number) => Promise<Buffer>;
/**
 * Get image metadata
 */
export declare const getImageMetadata: (inputPath: string) => Promise<ImageMetadata>;
/**
 * Convert image file to base64 for Gemini (with resize)
 */
export declare const imageFileToBase64: (filePath: string) => Promise<{
    base64: string;
    mimeType: string;
}>;
/**
 * Save buffer to temp file
 */
export declare const saveBufferToTemp: (buffer: Buffer, filename: string) => Promise<string>;
//# sourceMappingURL=imageService.d.ts.map