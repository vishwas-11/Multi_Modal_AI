import {
  GoogleGenerativeAI,
  GenerativeModel,
  Part,
  Content,
  GenerateContentStreamResult,
} from '@google/generative-ai';

import { VideoFrame } from './videoService';
import { processImageForAI } from './imageService';
import { DocumentPage, buildStructuredExtractionPrompt } from './documentService';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
  imageParts?: Array<{ base64: string; mimeType: string }>;
}

export interface AnalysisResult {
  summary: string;
  description?: string;
  tags?: string[];
  sentiment?: string;
  keyMoments?: Array<{ timestamp: number; description: string }>;
  structuredData?: Record<string, unknown>;
  extractedText?: string;
  chartData?: Record<string, unknown>;
}

// ─────────────────────────────────────────
// CLIENT SETUP
// ─────────────────────────────────────────

let client: GoogleGenerativeAI;
let visionModel: GenerativeModel;
let textModel: GenerativeModel;

const getClient = () => {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set');
    }
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
};

const getVisionModel = () => {
  if (!visionModel) {
    visionModel = getClient().getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    });
  }
  return visionModel;
};

const getTextModel = () => {
  if (!textModel) {
    textModel = getClient().getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });
  }
  return textModel;
};

// ─────────────────────────────────────────
// IMAGE ANALYSIS
// ─────────────────────────────────────────

export const analyzeImage = async (imagePath: string, prompt?: string) => {
  const model = getVisionModel();
  const processed = await processImageForAI(imagePath);

  const result = await model.generateContent([
    {
      inlineData: {
        data: processed.base64,
        mimeType: processed.mimeType,
      },
    },
    {
      text:
        prompt ||
        `Analyze this image and return JSON:
{
  "summary": "",
  "description": "",
  "tags": [],
  "sentiment": ""
}`,
    },
  ]);

  return safeParse(result.response.text());
};

// ─────────────────────────────────────────
// OCR
// ─────────────────────────────────────────

export const performOCR = async (imagePath: string) => {
  const model = getVisionModel();
  const processed = await processImageForAI(imagePath);

  const result = await model.generateContent([
    {
      inlineData: {
        data: processed.base64,
        mimeType: processed.mimeType,
      },
    },
    { text: 'Extract all visible text only.' },
  ]);

  return {
    summary: 'OCR completed',
    extractedText: result.response.text(),
  };
};

// ─────────────────────────────────────────
// VIDEO ANALYSIS
// ─────────────────────────────────────────

export const analyzeVideoFrames = async (
  frames: VideoFrame[],
  duration: number
): Promise<AnalysisResult> => {
  const model = getVisionModel();

  const parts: Part[] = [
    { text: `Video duration: ${duration}s. Frames follow.` },
  ];

  for (const frame of frames) {
    if (!frame.processed) continue;

    parts.push({ text: `Frame at ${frame.timestamp}s` });
    parts.push({
      inlineData: {
        data: frame.processed.base64,
        mimeType: frame.processed.mimeType,
      },
    });
  }

  const result = await model.generateContent(parts);
  return safeParse(result.response.text());
};

// ─────────────────────────────────────────
// DOCUMENT ANALYSIS
// ─────────────────────────────────────────

export const analyzeDocument = async (text: string) => {
  const model = getTextModel();

  const result = await model.generateContent(`
Analyze this document:

${text.substring(0, 50000)}

Return JSON:
{
  "summary": "",
  "tags": []
}
`);

  return safeParse(result.response.text());
};

export const analyzeDocumentPages = async (
  pages: DocumentPage[],
  question = 'Analyze this document'
): Promise<AnalysisResult> => {
  const model = getVisionModel();
  const parts: Part[] = [{ text: `Document has ${pages.length} page(s). ${question}` }];

  for (const page of pages) {
    if (!page.base64) continue;
    parts.push({ text: `Page ${page.pageNumber}` });
    parts.push({
      inlineData: {
        data: page.base64,
        mimeType: page.mimeType,
      },
    });
  }

  const result = await model.generateContent(parts);
  return safeParse(result.response.text());
};

export const extractStructuredData = async (
  pages: DocumentPage[],
  extractionType = 'general'
): Promise<AnalysisResult> => {
  const prompt = buildStructuredExtractionPrompt(extractionType);
  return analyzeDocumentPages(pages, prompt);
};

export const analyzeChart = async (imagePath: string): Promise<AnalysisResult> => {
  return analyzeImage(
    imagePath,
    `Analyze this chart and return JSON:
{
  "summary": "",
  "chartData": {},
  "insights": []
}`
  );
};

export const analyzeTranscription = async (
  transcriptionText: string,
  prompt = 'Summarize this transcription'
): Promise<AnalysisResult> => {
  const model = getTextModel();
  const result = await model.generateContent(
    `${prompt}\n\nTranscript:\n${transcriptionText.substring(0, 50000)}`
  );

  return {
    summary: result.response.text(),
    description: result.response.text(),
  };
};

export const answerTemporalVideoQuestion = async (
  frames: VideoFrame[],
  question: string
): Promise<AnalysisResult> => {
  const model = getVisionModel();
  const parts: Part[] = [{ text: `Answer the question about this video timeline: ${question}` }];

  for (const frame of frames) {
    if (!frame.processed) continue;
    parts.push({ text: `Timestamp ${frame.timestamp}s` });
    parts.push({
      inlineData: {
        data: frame.processed.base64,
        mimeType: frame.processed.mimeType,
      },
    });
  }

  const result = await model.generateContent(parts);
  return {
    summary: result.response.text(),
    description: result.response.text(),
  };
};

// ─────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────

export const chatWithContext = async (
  messages: GeminiMessage[],
  systemPrompt?: string
) => {
  const model = getVisionModel();

  const history: Content[] = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  if (systemPrompt) {
    history.unshift({
      role: 'user',
      parts: [{ text: systemPrompt }],
    });
  }

  const chat = model.startChat({ history });

  const last = messages[messages.length - 1];
  const lastParts: Part[] = [{ text: last.content }];
  if (last.imageParts?.length) {
    for (const image of last.imageParts) {
      lastParts.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      });
    }
  }

  const result = await chat.sendMessage(lastParts);
  return result.response.text();
};

export const streamChatWithContext = async (
  messages: GeminiMessage[],
  systemPrompt?: string
): Promise<GenerateContentStreamResult> => {
  const model = getVisionModel();
  const history: Content[] = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  if (systemPrompt) {
    history.unshift({
      role: 'user',
      parts: [{ text: systemPrompt }],
    });
  }

  const chat = model.startChat({ history });
  const last = messages[messages.length - 1];
  const lastParts: Part[] = [{ text: last.content }];
  if (last.imageParts?.length) {
    for (const image of last.imageParts) {
      lastParts.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      });
    }
  }

  return chat.sendMessageStream(lastParts);
};

export const summarizeConversationContext = async (context: string): Promise<string> => {
  const model = getTextModel();
  const result = await model.generateContent(
    `Summarize this conversation context in <= 250 words:\n\n${context.substring(0, 50000)}`
  );
  return result.response.text();
};

export const compareMedia = async (
  items: Array<{ type: string; content: string | { base64: string; mimeType: string } }>,
  prompt = 'Compare these media items'
): Promise<string> => {
  const model = getVisionModel();
  const parts: Part[] = [{ text: prompt }];

  items.forEach((item, idx) => {
    parts.push({ text: `Item ${idx + 1} (${item.type})` });
    if (typeof item.content === 'string') {
      parts.push({ text: item.content });
    } else {
      parts.push({
        inlineData: {
          data: item.content.base64,
          mimeType: item.content.mimeType,
        },
      });
    }
  });

  const result = await model.generateContent(parts);
  return result.response.text();
};

// ─────────────────────────────────────────
// HELPERS (IMPORTANT FIX)
// ─────────────────────────────────────────

const safeParse = (text: string): AnalysisResult => {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        summary: parsed.summary || text.slice(0, 200),
        description: parsed.description,
        tags: parsed.tags || [],
        sentiment: parsed.sentiment,
        keyMoments: parsed.keyMoments || [],
        structuredData: parsed.structuredData,
        extractedText: parsed.extractedText,
        chartData: parsed.chartData,
      };
    }
  } catch (err) {
    console.warn('Gemini parse failed:', err);
  }

  return {
    summary: text.slice(0, 200),
    description: text,
  };
};