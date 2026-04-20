"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareMedia = exports.summarizeConversationContext = exports.streamChatWithContext = exports.chatWithContext = exports.answerTemporalVideoQuestion = exports.analyzeTranscription = exports.analyzeChart = exports.extractStructuredData = exports.analyzeDocumentPages = exports.analyzeDocument = exports.analyzeVideoFrames = exports.performOCR = exports.analyzeImage = void 0;
const generative_ai_1 = require("@google/generative-ai");
const imageService_1 = require("./imageService");
const documentService_1 = require("./documentService");
// ─────────────────────────────────────────
// CLIENT SETUP
// ─────────────────────────────────────────
let client;
let visionModel;
let textModel;
const getClient = () => {
    if (!client) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not set');
        }
        client = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
            model: 'gemini-1.5-pro',
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
const analyzeImage = async (imagePath, prompt) => {
    const model = getVisionModel();
    const processed = await (0, imageService_1.processImageForAI)(imagePath);
    const result = await model.generateContent([
        {
            inlineData: {
                data: processed.base64,
                mimeType: processed.mimeType,
            },
        },
        {
            text: prompt ||
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
exports.analyzeImage = analyzeImage;
// ─────────────────────────────────────────
// OCR
// ─────────────────────────────────────────
const performOCR = async (imagePath) => {
    const model = getVisionModel();
    const processed = await (0, imageService_1.processImageForAI)(imagePath);
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
exports.performOCR = performOCR;
// ─────────────────────────────────────────
// VIDEO ANALYSIS
// ─────────────────────────────────────────
const analyzeVideoFrames = async (frames, duration) => {
    const model = getVisionModel();
    const parts = [
        { text: `Video duration: ${duration}s. Frames follow.` },
    ];
    for (const frame of frames) {
        if (!frame.processed)
            continue;
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
exports.analyzeVideoFrames = analyzeVideoFrames;
// ─────────────────────────────────────────
// DOCUMENT ANALYSIS
// ─────────────────────────────────────────
const analyzeDocument = async (text) => {
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
exports.analyzeDocument = analyzeDocument;
const analyzeDocumentPages = async (pages, question = 'Analyze this document') => {
    const model = getVisionModel();
    const parts = [{ text: `Document has ${pages.length} page(s). ${question}` }];
    for (const page of pages) {
        if (!page.base64)
            continue;
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
exports.analyzeDocumentPages = analyzeDocumentPages;
const extractStructuredData = async (pages, extractionType = 'general') => {
    const prompt = (0, documentService_1.buildStructuredExtractionPrompt)(extractionType);
    return (0, exports.analyzeDocumentPages)(pages, prompt);
};
exports.extractStructuredData = extractStructuredData;
const analyzeChart = async (imagePath) => {
    return (0, exports.analyzeImage)(imagePath, `Analyze this chart and return JSON:
{
  "summary": "",
  "chartData": {},
  "insights": []
}`);
};
exports.analyzeChart = analyzeChart;
const analyzeTranscription = async (transcriptionText, prompt = 'Summarize this transcription') => {
    const model = getTextModel();
    const result = await model.generateContent(`${prompt}\n\nTranscript:\n${transcriptionText.substring(0, 50000)}`);
    return {
        summary: result.response.text(),
        description: result.response.text(),
    };
};
exports.analyzeTranscription = analyzeTranscription;
const answerTemporalVideoQuestion = async (frames, question) => {
    const model = getVisionModel();
    const parts = [{ text: `Answer the question about this video timeline: ${question}` }];
    for (const frame of frames) {
        if (!frame.processed)
            continue;
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
exports.answerTemporalVideoQuestion = answerTemporalVideoQuestion;
// ─────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────
const chatWithContext = async (messages, systemPrompt) => {
    const model = getVisionModel();
    const history = messages.slice(0, -1).map((m) => ({
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
    const result = await chat.sendMessage(last.content);
    return result.response.text();
};
exports.chatWithContext = chatWithContext;
const streamChatWithContext = async (messages, systemPrompt) => {
    const model = getVisionModel();
    const history = messages.slice(0, -1).map((m) => ({
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
    return chat.sendMessageStream(last.content);
};
exports.streamChatWithContext = streamChatWithContext;
const summarizeConversationContext = async (context) => {
    const model = getTextModel();
    const result = await model.generateContent(`Summarize this conversation context in <= 250 words:\n\n${context.substring(0, 50000)}`);
    return result.response.text();
};
exports.summarizeConversationContext = summarizeConversationContext;
const compareMedia = async (items, prompt = 'Compare these media items') => {
    const model = getVisionModel();
    const parts = [{ text: prompt }];
    items.forEach((item, idx) => {
        parts.push({ text: `Item ${idx + 1} (${item.type})` });
        if (typeof item.content === 'string') {
            parts.push({ text: item.content });
        }
        else {
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
exports.compareMedia = compareMedia;
// ─────────────────────────────────────────
// HELPERS (IMPORTANT FIX)
// ─────────────────────────────────────────
const safeParse = (text) => {
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
    }
    catch (err) {
        console.warn('Gemini parse failed:', err);
    }
    return {
        summary: text.slice(0, 200),
        description: text,
    };
};
//# sourceMappingURL=geminiService.js.map