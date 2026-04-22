"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDocumentTemp = exports.buildStructuredExtractionPrompt = exports.buildMultiPageContextPrompt = exports.parseMarkdownTable = exports.processImageDocument = exports.processDocumentImagePage = exports.extractTextFromDocument = exports.downloadDocumentToTempWithFallback = exports.downloadDocumentToTemp = exports.getDocumentType = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const fileUtils_1 = require("../utils/fileUtils");
const cloudinaryService_1 = require("./cloudinaryService");
/**
 * Detect document type from mime type
 */
const getDocumentType = (mimeType) => {
    if (mimeType === 'application/pdf')
        return 'pdf';
    if (mimeType.startsWith('image/'))
        return 'image';
    if (['text/plain', 'text/csv', 'application/json'].includes(mimeType))
        return 'text';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv')
        return 'spreadsheet';
    return 'unknown';
};
exports.getDocumentType = getDocumentType;
/**
 * Download document from URL to temp path
 */
const downloadDocumentToTemp = async (url, mimeType) => {
    const ext = getExtFromMime(mimeType);
    const tempPath = path_1.default.join(process.cwd(), 'src/uploads', `doc-${(0, uuid_1.v4)()}${ext}`);
    const response = await axios_1.default.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: 20 * 1024 * 1024,
    });
    await fs_1.default.promises.writeFile(tempPath, Buffer.from(response.data));
    return tempPath;
};
exports.downloadDocumentToTemp = downloadDocumentToTemp;
const downloadDocumentToTempWithFallback = async (url, mimeType, publicId) => {
    try {
        return await (0, exports.downloadDocumentToTemp)(url, mimeType);
    }
    catch (error) {
        if (!axios_1.default.isAxiosError(error) || error.response?.status !== 401 || !publicId) {
            throw error;
        }
        const format = getExtFromMime(mimeType).replace('.', '') || 'bin';
        try {
            const privateDownloadUrl = (0, cloudinaryService_1.getPrivateDownloadUrl)(publicId, format, 'raw', 'upload');
            return await (0, exports.downloadDocumentToTemp)(privateDownloadUrl, mimeType);
        }
        catch (fallbackError) {
            if (!axios_1.default.isAxiosError(fallbackError) || fallbackError.response?.status !== 401) {
                throw fallbackError;
            }
            // Some Cloudinary setups store restricted raw assets as authenticated delivery type.
            const authDownloadUrl = (0, cloudinaryService_1.getPrivateDownloadUrl)(publicId, format, 'raw', 'authenticated');
            return (0, exports.downloadDocumentToTemp)(authDownloadUrl, mimeType);
        }
    }
};
exports.downloadDocumentToTempWithFallback = downloadDocumentToTempWithFallback;
const getExtFromMime = (mime) => {
    const map = {
        'application/pdf': '.pdf',
        'text/plain': '.txt',
        'text/csv': '.csv',
        'application/json': '.json',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    };
    return map[mime] || '.bin';
};
/**
 * For text documents: read and clean content
 */
const extractTextFromDocument = async (filePath, mimeType) => {
    const buffer = await fs_1.default.promises.readFile(filePath);
    if (mimeType === 'text/plain' || mimeType === 'text/csv' || mimeType === 'application/json') {
        return buffer.toString('utf-8');
    }
    if (mimeType === 'application/pdf') {
        // PDF text extraction: attempt raw text parsing
        // For production, integrate pdf-parse: npm install pdf-parse
        // Here we do a best-effort byte scan for readable text
        const raw = buffer.toString('latin1');
        const textMatches = raw.match(/\(([^)]{2,200})\)/g);
        if (textMatches && textMatches.length > 10) {
            return textMatches
                .map((m) => m.slice(1, -1))
                .filter((t) => /[a-zA-Z]{3,}/.test(t))
                .join(' ')
                .substring(0, 50000);
        }
        return '[PDF — text extraction limited without pdf-parse. Image-based analysis applied.]';
    }
    return buffer.toString('utf-8', 0, Math.min(buffer.length, 50000));
};
exports.extractTextFromDocument = extractTextFromDocument;
/**
 * Process a document image page for AI analysis
 * Resizes and returns base64 for Gemini
 */
const processDocumentImagePage = async (imagePath) => {
    const MAX_DIM = 2048; // Higher res for documents to preserve text clarity
    const meta = await (0, sharp_1.default)(imagePath).metadata();
    const w = meta.width || MAX_DIM;
    const h = meta.height || MAX_DIM;
    const needsResize = w > MAX_DIM || h > MAX_DIM;
    let pipeline = (0, sharp_1.default)(imagePath);
    if (needsResize) {
        pipeline = pipeline.resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true });
    }
    const buffer = await pipeline.jpeg({ quality: 92 }).toBuffer();
    const processedMeta = await (0, sharp_1.default)(buffer).metadata();
    return {
        pageNumber: 1,
        imagePath,
        base64: buffer.toString('base64'),
        mimeType: 'image/jpeg',
        width: processedMeta.width || w,
        height: processedMeta.height || h,
    };
};
exports.processDocumentImagePage = processDocumentImagePage;
/**
 * For image documents (scanned docs, whiteboard photos, etc.):
 * directly process the image as a document page
 */
const processImageDocument = async (filePath) => {
    const page = await (0, exports.processDocumentImagePage)(filePath);
    page.pageNumber = 1;
    return [page];
};
exports.processImageDocument = processImageDocument;
/**
 * Parse a structured table from LLM response text
 * Handles markdown tables returned by Gemini
 */
const parseMarkdownTable = (text) => {
    const lines = text.split('\n').filter((l) => l.trim().startsWith('|'));
    if (lines.length < 2)
        return null;
    const parseRow = (line) => line.split('|').slice(1, -1).map((cell) => cell.trim());
    const headers = parseRow(lines[0]);
    const rows = lines
        .slice(2) // Skip separator line
        .map(parseRow)
        .filter((row) => row.length === headers.length);
    return {
        headers,
        rows,
        rawText: text,
    };
};
exports.parseMarkdownTable = parseMarkdownTable;
/**
 * Build multi-page context prompt for Gemini
 * Combines pages with positional context for coherent analysis
 */
const buildMultiPageContextPrompt = (pageCount, question) => {
    return `You are analyzing a ${pageCount}-page document. 
Each page image is provided in order. Maintain context across all pages.

Important: 
- Reference specific page numbers when discussing content (e.g., "On page 2...")
- If a table spans multiple pages, reconstruct it completely
- For questions about the whole document, synthesize information from all pages

Question: ${question}

Analyze all provided pages and answer the question comprehensively.`;
};
exports.buildMultiPageContextPrompt = buildMultiPageContextPrompt;
/**
 * Build structured extraction prompt
 */
const buildStructuredExtractionPrompt = (extractionType) => {
    const prompts = {
        invoice: `Extract all information from this invoice as JSON:
{
  "vendor": { "name": "", "address": "", "contact": "" },
  "invoice_number": "",
  "date": "",
  "due_date": "",
  "line_items": [{ "description": "", "quantity": 0, "unit_price": 0, "total": 0 }],
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "payment_terms": "",
  "notes": ""
}
Return ONLY valid JSON.`,
        table: `Extract all tables from this document as JSON arrays.
For each table found, provide:
{
  "tables": [
    {
      "title": "table title if visible",
      "headers": ["col1", "col2"],
      "rows": [["val1", "val2"]],
      "page": 1
    }
  ]
}
Return ONLY valid JSON.`,
        form: `Extract all form fields from this document as JSON:
{
  "form_title": "",
  "fields": [
    { "label": "", "value": "", "field_type": "text|checkbox|date|number" }
  ]
}
Return ONLY valid JSON.`,
        receipt: `Extract receipt information as JSON:
{
  "store": "",
  "date": "",
  "items": [{ "name": "", "quantity": 0, "price": 0 }],
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "payment_method": ""
}
Return ONLY valid JSON.`,
        general: `Extract all structured data from this document as JSON. 
Include: text content, tables (as arrays), key-value pairs, lists, dates, numbers.
Organize logically based on document layout.
Return ONLY valid JSON.`,
    };
    return prompts[extractionType] || prompts.general;
};
exports.buildStructuredExtractionPrompt = buildStructuredExtractionPrompt;
/**
 * Cleanup document temp files
 */
const cleanupDocumentTemp = async (paths) => {
    await (0, fileUtils_1.deleteFiles)(paths);
};
exports.cleanupDocumentTemp = cleanupDocumentTemp;
//# sourceMappingURL=documentService.js.map