export interface DocumentPage {
    pageNumber: number;
    imagePath: string;
    base64?: string;
    mimeType: string;
    width: number;
    height: number;
}
export interface ExtractedTable {
    headers: string[];
    rows: string[][];
    rawText: string;
    pageNumber?: number;
}
export interface DocumentMetadata {
    pageCount: number;
    mimeType: string;
    fileSize: number;
    hasText: boolean;
    documentType: 'pdf' | 'image' | 'text' | 'spreadsheet' | 'unknown';
}
/**
 * Detect document type from mime type
 */
export declare const getDocumentType: (mimeType: string) => DocumentMetadata["documentType"];
/**
 * Download document from URL to temp path
 */
export declare const downloadDocumentToTemp: (url: string, mimeType: string) => Promise<string>;
/**
 * For text documents: read and clean content
 */
export declare const extractTextFromDocument: (filePath: string, mimeType: string) => Promise<string>;
/**
 * Process a document image page for AI analysis
 * Resizes and returns base64 for Gemini
 */
export declare const processDocumentImagePage: (imagePath: string) => Promise<DocumentPage>;
/**
 * For image documents (scanned docs, whiteboard photos, etc.):
 * directly process the image as a document page
 */
export declare const processImageDocument: (filePath: string) => Promise<DocumentPage[]>;
/**
 * Parse a structured table from LLM response text
 * Handles markdown tables returned by Gemini
 */
export declare const parseMarkdownTable: (text: string) => ExtractedTable | null;
/**
 * Build multi-page context prompt for Gemini
 * Combines pages with positional context for coherent analysis
 */
export declare const buildMultiPageContextPrompt: (pageCount: number, question: string) => string;
/**
 * Build structured extraction prompt
 */
export declare const buildStructuredExtractionPrompt: (extractionType: string) => string;
/**
 * Cleanup document temp files
 */
export declare const cleanupDocumentTemp: (paths: string[]) => Promise<void>;
//# sourceMappingURL=documentService.d.ts.map