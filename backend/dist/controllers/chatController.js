"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportConversation = exports.clearConversation = exports.regenerateLastResponse = exports.deleteConversation = exports.getConversation = exports.getConversations = exports.streamChat = exports.chat = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Media_1 = __importDefault(require("../models/Media"));
const errorHandler_1 = require("../middleware/errorHandler");
const response_1 = require("../utils/response");
const geminiService_1 = require("../services/geminiService");
const imageService_1 = require("../services/imageService");
const fileUtils_1 = require("../utils/fileUtils");
const audioService_1 = require("../services/audioService");
const videoService_1 = require("../services/videoService");
const tokenCounter_1 = require("../utils/tokenCounter");
const exportService_1 = require("../services/exportService");
const mongoose_1 = __importDefault(require("mongoose"));
const SYSTEM_PROMPT = `You are a powerful multimodal AI assistant. You can analyze images, videos, audio, documents, and answer questions about them.

Capabilities:
- Visual Q&A: Describe, analyze, and answer questions about images
- Video analysis: Understand video content, identify key moments, describe scenes
- Audio: Work with transcriptions, identify speakers, extract action items
- Documents: Extract text, tables, structured data from scanned documents
- Comparison: Compare multiple media files simultaneously

Guidelines:
- Be accurate and specific when referencing media content
- Use timestamps when discussing video/audio content
- Reference page numbers when discussing documents
- If you're unsure about something in an image, say so clearly
- Format responses with markdown for better readability`;
const MAX_HISTORY = 20;
// ─── Helpers ─────────────────────────────────────────────────────────────────
const prepareMediaForGemini = async (mediaIds, userId) => {
    const imageParts = [];
    const textParts = [];
    const tempFiles = [];
    for (const mediaId of mediaIds) {
        const media = await Media_1.default.findOne({ _id: mediaId, uploadedBy: userId });
        if (!media)
            continue;
        if (media.type === 'image') {
            const tempPath = path_1.default.join(process.cwd(), 'src/uploads', `chat-${(0, uuid_1.v4)()}.jpg`);
            tempFiles.push(tempPath);
            try {
                const resp = await axios_1.default.get(media.url, { responseType: 'arraybuffer', timeout: 30000 });
                await fs_1.default.promises.writeFile(tempPath, Buffer.from(resp.data));
                const processed = await (0, imageService_1.processImageForAI)(tempPath);
                imageParts.push({ base64: processed.base64, mimeType: processed.mimeType });
            }
            catch { }
        }
        else {
            if (!media.analysis) {
                try {
                    if (media.type === 'audio') {
                        const audioAnalysis = await (0, audioService_1.analyzeAudioFromUrl)(media.url);
                        media.analysis = {
                            summary: audioAnalysis.summary,
                            transcription: audioAnalysis.transcription.text,
                            sentiment: audioAnalysis.sentiment,
                            actionItems: audioAnalysis.actionItems,
                            keyTopics: audioAnalysis.keyTopics,
                            speakerCount: audioAnalysis.speakerCount,
                            speakers: audioAnalysis.speakers,
                            decisions: audioAnalysis.decisions,
                            language: audioAnalysis.language,
                            analyzedAt: new Date(),
                        };
                        await media.save();
                    }
                    else if (media.type === 'video') {
                        const { frames, metadata, tempDir, tempVideoPath, audioPath } = await (0, videoService_1.processVideoForAnalysis)(media.url);
                        try {
                            const videoAnalysis = await (0, geminiService_1.analyzeVideoFrames)(frames, metadata.duration);
                            media.analysis = { ...videoAnalysis, analyzedAt: new Date() };
                            await media.save();
                        }
                        finally {
                            await (0, videoService_1.cleanupVideoTemp)(tempVideoPath, tempDir, audioPath);
                        }
                    }
                }
                catch (err) {
                    console.warn(`Failed to auto-analyze media ${media._id}:`, err);
                }
            }
            if (!media.analysis) {
                continue;
            }
            const lines = [`[${media.type.toUpperCase()}: ${media.originalName}]`];
            if (media.analysis.summary)
                lines.push(`Summary: ${media.analysis.summary}`);
            if (media.analysis.transcription)
                lines.push(`Transcription: ${media.analysis.transcription.substring(0, 2000)}`);
            if (media.analysis.extractedText)
                lines.push(`Text: ${media.analysis.extractedText.substring(0, 2000)}`);
            if (media.analysis.actionItems?.length)
                lines.push(`Action items: ${media.analysis.actionItems.join(', ')}`);
            textParts.push(lines.join('\n'));
        }
    }
    await Promise.allSettled(tempFiles.map((f) => (0, fileUtils_1.deleteFile)(f)));
    return { imageParts, textContext: textParts.join('\n\n') };
};
const buildGeminiHistory = async (conversationId, userId, contextSummary) => {
    const conversation = await Conversation_1.default.findOne({ _id: conversationId, userId });
    if (!conversation)
        return [];
    const { messages: trimmedMessages } = (0, tokenCounter_1.trimConversationContext)(conversation.messages, contextSummary, 50000);
    return trimmedMessages.map((msg) => ({
        role: (msg.role === 'assistant' ? 'model' : 'user'),
        content: msg.content,
    }));
};
// ─── POST /api/chat ───────────────────────────────────────────────────────────
exports.chat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { message, conversationId, mediaIds = [] } = req.body;
    const userId = req.user._id;
    let conversation = conversationId
        ? await Conversation_1.default.findOne({ _id: conversationId, userId })
        : null;
    if (!conversation) {
        conversation = await Conversation_1.default.create({
            userId,
            title: message.substring(0, 80),
            messages: [],
            mediaContext: mediaIds,
        });
    }
    if ((0, tokenCounter_1.needsSummarization)(conversation.messages) && !conversation.contextSummary) {
        try {
            const summaryPrompt = (0, tokenCounter_1.buildSummaryPrompt)(conversation.messages);
            const summary = await (0, geminiService_1.summarizeConversationContext)(summaryPrompt);
            conversation.contextSummary = summary;
            conversation.contextSummarizedAt = new Date();
        }
        catch { }
    }
    const history = await buildGeminiHistory(conversation._id, userId, conversation.contextSummary);
    const { imageParts, textContext } = await prepareMediaForGemini(mediaIds, userId);
    const fullMessage = textContext
        ? `[Media context]\n${textContext}\n\n[User message]\n${message}`
        : message;
    const userMsg = {
        role: 'user',
        content: fullMessage,
        imageParts: imageParts.length > 0 ? imageParts : undefined,
    };
    const response = await (0, geminiService_1.chatWithContext)([...history, userMsg], SYSTEM_PROMPT);
    conversation.messages.push({
        role: 'user',
        content: message,
        mediaIds: mediaIds.map((id) => new mongoose_1.default.Types.ObjectId(id)),
        timestamp: new Date(),
    });
    conversation.messages.push({ role: 'assistant', content: response, timestamp: new Date() });
    if (conversation.messages.length <= 2)
        conversation.title = message.substring(0, 80);
    await conversation.save();
    (0, response_1.sendSuccess)(res, { conversationId: conversation._id, message: response, role: 'assistant' });
});
exports.streamChat = (0, errorHandler_1.asyncHandler)(async (req, res, _next) => {
    const { message, conversationId } = req.query;
    if (!message || typeof message !== 'string') {
        (0, response_1.sendError)(res, 'message query param is required', 400);
        return;
    }
    const userId = req.user._id;
    const mediaIdsRaw = typeof req.query.mediaIds === 'string' ? req.query.mediaIds : '';
    const mediaIds = mediaIdsRaw
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id && id !== 'undefined' && mongoose_1.default.Types.ObjectId.isValid(id));
    let conversation = typeof conversationId === 'string'
        ? await Conversation_1.default.findOne({ _id: conversationId, userId })
        : null;
    if (!conversation) {
        conversation = await Conversation_1.default.create({
            userId,
            title: message.substring(0, 80),
            messages: [],
            mediaContext: mediaIds.map((id) => new mongoose_1.default.Types.ObjectId(id)),
        });
    }
    if ((0, tokenCounter_1.needsSummarization)(conversation.messages) && !conversation.contextSummary) {
        try {
            const summaryPrompt = (0, tokenCounter_1.buildSummaryPrompt)(conversation.messages);
            const summary = await (0, geminiService_1.summarizeConversationContext)(summaryPrompt);
            conversation.contextSummary = summary;
            conversation.contextSummarizedAt = new Date();
        }
        catch { }
    }
    const history = await buildGeminiHistory(conversation._id, userId, conversation.contextSummary);
    const { imageParts, textContext } = await prepareMediaForGemini(mediaIds, userId);
    const fullMessage = textContext
        ? `[Media context]\n${textContext}\n\n[User message]\n${message}`
        : message;
    const userMsg = {
        role: 'user',
        content: fullMessage,
        imageParts: imageParts.length > 0 ? imageParts : undefined,
    };
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`event: conversation\ndata: ${JSON.stringify({ conversationId: conversation._id })}\n\n`);
    const stream = await (0, geminiService_1.streamChatWithContext)([...history, userMsg], SYSTEM_PROMPT);
    let combined = '';
    for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (!text)
            continue;
        combined += text;
        res.write(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`);
    }
    conversation.messages.push({
        role: 'user',
        content: message,
        mediaIds: mediaIds.map((id) => new mongoose_1.default.Types.ObjectId(id)),
        timestamp: new Date(),
    });
    conversation.messages.push({
        role: 'assistant',
        content: combined,
        timestamp: new Date(),
    });
    if (conversation.messages.length <= 2) {
        conversation.title = message.substring(0, 80);
    }
    await conversation.save();
    res.write('event: done\ndata: {}\n\n');
    res.end();
});
exports.getConversations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const conversations = await Conversation_1.default.find({ userId: req.user._id })
        .sort({ updatedAt: -1 })
        .limit(MAX_HISTORY)
        .select('title updatedAt createdAt messages');
    (0, response_1.sendSuccess)(res, conversations);
});
exports.getConversation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const conversation = await Conversation_1.default.findOne({
        _id: req.params.id,
        userId: req.user._id,
    });
    if (!conversation) {
        (0, response_1.sendError)(res, 'Conversation not found', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, conversation);
});
exports.deleteConversation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const conversation = await Conversation_1.default.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
    });
    if (!conversation) {
        (0, response_1.sendError)(res, 'Conversation not found', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, {}, 'Conversation deleted');
});
exports.regenerateLastResponse = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const conversation = await Conversation_1.default.findOne({
        _id: req.params.id,
        userId: req.user._id,
    });
    if (!conversation) {
        (0, response_1.sendError)(res, 'Conversation not found', 404);
        return;
    }
    const userMessages = conversation.messages.filter((m) => m.role === 'user');
    const lastUser = userMessages[userMessages.length - 1];
    if (!lastUser) {
        (0, response_1.sendError)(res, 'No user message to regenerate', 400);
        return;
    }
    const reply = await (0, geminiService_1.chatWithContext)([{ role: 'user', content: lastUser.content }], SYSTEM_PROMPT);
    conversation.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
    await conversation.save();
    (0, response_1.sendSuccess)(res, { message: reply });
});
exports.clearConversation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const conversation = await Conversation_1.default.findOne({
        _id: req.params.id,
        userId: req.user._id,
    });
    if (!conversation) {
        (0, response_1.sendError)(res, 'Conversation not found', 404);
        return;
    }
    conversation.messages = [];
    conversation.contextSummary = undefined;
    conversation.contextSummarizedAt = undefined;
    await conversation.save();
    (0, response_1.sendSuccess)(res, {}, 'Conversation cleared');
});
exports.exportConversation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const format = String(req.query.format || 'md');
    if (!['md', 'html'].includes(format)) {
        (0, response_1.sendError)(res, 'format must be md or html', 400);
        return;
    }
    const conversation = await Conversation_1.default.findOne({
        _id: req.params.id,
        userId: req.user._id,
    });
    if (!conversation) {
        (0, response_1.sendError)(res, 'Conversation not found', 404);
        return;
    }
    const ids = conversation.messages.flatMap((m) => m.mediaIds || []);
    const media = await Media_1.default.find({ _id: { $in: ids } });
    const mediaMap = new Map(media.map((m) => [m._id.toString(), m]));
    const content = format === 'html'
        ? (0, exportService_1.exportConversationAsHTML)(conversation, mediaMap)
        : (0, exportService_1.exportConversationAsMarkdown)(conversation, mediaMap);
    const filename = (0, exportService_1.buildExportFilename)(conversation, format);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'html' ? 'text/html' : 'text/markdown');
    res.status(200).send(content);
});
//# sourceMappingURL=chatController.js.map