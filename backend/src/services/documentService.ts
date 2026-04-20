import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { deleteFile, deleteFiles } from '../utils/fileUtils';

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
export const getDocumentType = (mimeType: string): DocumentMetadata['documentType'] => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (['text/plain', 'text/csv', 'application/json'].includes(mimeType)) return 'text';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet';
  return 'unknown';
};

/**
 * Download document from URL to temp path
 */
export const downloadDocumentToTemp = async (url: string, mimeType: string): Promise<string> => {
  const ext = getExtFromMime(mimeType);
  const tempPath = path.join(process.cwd(), 'src/uploads', `doc-${uuidv4()}${ext}`);

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
    maxContentLength: 20 * 1024 * 1024,
  });

  await fs.promises.writeFile(tempPath, Buffer.from(response.data));
  return tempPath;
};

const getExtFromMime = (mime: string): string => {
  const map: Record<string, string> = {
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
export const extractTextFromDocument = async (filePath: string, mimeType: string): Promise<string> => {
  const buffer = await fs.promises.readFile(filePath);

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

/**
 * Process a document image page for AI analysis
 * Resizes and returns base64 for Gemini
 */
export const processDocumentImagePage = async (imagePath: string): Promise<DocumentPage> => {
  const MAX_DIM = 2048; // Higher res for documents to preserve text clarity

  const meta = await sharp(imagePath).metadata();
  const w = meta.width || MAX_DIM;
  const h = meta.height || MAX_DIM;

  const needsResize = w > MAX_DIM || h > MAX_DIM;
  let pipeline = sharp(imagePath);
  if (needsResize) {
    pipeline = pipeline.resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true });
  }

  const buffer = await pipeline.jpeg({ quality: 92 }).toBuffer();
  const processedMeta = await sharp(buffer).metadata();

  return {
    pageNumber: 1,
    imagePath,
    base64: buffer.toString('base64'),
    mimeType: 'image/jpeg',
    width: processedMeta.width || w,
    height: processedMeta.height || h,
  };
};

/**
 * For image documents (scanned docs, whiteboard photos, etc.):
 * directly process the image as a document page
 */
export const processImageDocument = async (filePath: string): Promise<DocumentPage[]> => {
  const page = await processDocumentImagePage(filePath);
  page.pageNumber = 1;
  return [page];
};

/**
 * Parse a structured table from LLM response text
 * Handles markdown tables returned by Gemini
 */
export const parseMarkdownTable = (text: string): ExtractedTable | null => {
  const lines = text.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) return null;

  const parseRow = (line: string): string[] =>
    line.split('|').slice(1, -1).map((cell) => cell.trim());

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

/**
 * Build multi-page context prompt for Gemini
 * Combines pages with positional context for coherent analysis
 */
export const buildMultiPageContextPrompt = (
  pageCount: number,
  question: string
): string => {
  return `You are analyzing a ${pageCount}-page document. 
Each page image is provided in order. Maintain context across all pages.

Important: 
- Reference specific page numbers when discussing content (e.g., "On page 2...")
- If a table spans multiple pages, reconstruct it completely
- For questions about the whole document, synthesize information from all pages

Question: ${question}

Analyze all provided pages and answer the question comprehensively.`;
};

/**
 * Build structured extraction prompt
 */
export const buildStructuredExtractionPrompt = (extractionType: string): string => {
  const prompts: Record<string, string> = {
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

/**
 * Cleanup document temp files
 */
export const cleanupDocumentTemp = async (paths: string[]): Promise<void> => {
  await deleteFiles(paths);
};