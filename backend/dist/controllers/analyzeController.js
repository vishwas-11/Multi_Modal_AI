"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeMultiPageDocument = exports.temporalVideoQA = exports.analyzeChartMedia = exports.structuredExtractMedia = exports.analyzeDocumentMedia = exports.analyzeAudioMedia = exports.analyzeVideoMedia = exports.ocrImageMedia = exports.analyzeImageMedia = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const Media_1 = __importDefault(require("../models/Media"));
const errorHandler_1 = require("../middleware/errorHandler");
const response_1 = require("../utils/response");
const geminiService_1 = require("../services/geminiService");
const videoService_1 = require("../services/videoService");
const audioService_1 = require("../services/audioService");
const documentService_1 = require("../services/documentService");
const fileUtils_1 = require("../utils/fileUtils");
const ensureMediaType = (res, actualType, allowedTypes) => {
    if (allowedTypes.includes(actualType))
        return true;
    (0, response_1.sendError)(res, `Invalid media type. Expected: ${allowedTypes.join(' or ')}`, 400);
    return false;
};
// ─────────────────────────────────────────
// IMAGE ANALYSIS
// ─────────────────────────────────────────
exports.analyzeImageMedia = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mediaId, prompt } = req.body;
    const media = await Media_1.default.findOne({ _id: mediaId, uploadedBy: req.user._id });
    if (!media)
        return (0, response_1.sendError)(res, 'Media not found', 404);
    if (!ensureMediaType(res, media.type, ['image']))
        return;
    const tempPath = path_1.default.join(process.cwd(), 'src/uploads', `img-${(0, uuid_1.v4)()}.jpg`);
    try {
        const response = await axios_1.default.get(media.url, { responseType: 'arraybuffer' });
        await fs_1.default.promises.writeFile(tempPath, Buffer.from(response.data));
        const analysis = await (0, geminiService_1.analyzeImage)(tempPath, prompt);
        media.analysis = { ...analysis, analyzedAt: new Date() };
        await media.save();
        (0, response_1.sendSuccess)(res, analysis);
    }
    finally {
        await (0, fileUtils_1.deleteFile)(tempPath);
    }
});
// ─────────────────────────────────────────
// OCR
// ─────────────────────────────────────────
exports.ocrImageMedia = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mediaId } = req.body;
    const media = await Media_1.default.findOne({ _id: mediaId, uploadedBy: req.user._id });
    if (!media)
        return (0, response_1.sendError)(res, 'Media not found', 404);
    if (!ensureMediaType(res, media.type, ['image']))
        return;
    const tempPath = path_1.default.join(process.cwd(), 'src/uploads', `ocr-${(0, uuid_1.v4)()}.jpg`);
    try {
        const response = await axios_1.default.get(media.url, { responseType: 'arraybuffer' });
        await fs_1.default.promises.writeFile(tempPath, Buffer.from(response.data));
        const result = await (0, geminiService_1.performOCR)(tempPath);
        media.analysis = {
            ...(media.analysis || { analyzedAt: new Date() }),
            extractedText: result.extractedText,
            analyzedAt: new Date(),
        };
        await media.save();
        (0, response_1.sendSuccess)(res, result);
    }
    finally {
        await (0, fileUtils_1.deleteFile)(tempPath);
    }
});
// ─────────────────────────────────────────
// VIDEO ANALYSIS
// ─────────────────────────────────────────
exports.analyzeVideoMedia = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mediaId, prompt } = req.body;
    const media = await Media_1.default.findOne({ _id: mediaId, uploadedBy: req.user._id });
    if (!media)
        return (0, response_1.sendError)(res, 'Media not found', 404);
    if (!ensureMediaType(res, media.type, ['video']))
        return;
    const { frames, metadata, tempDir, tempVideoPath, audioPath } = await (0, videoService_1.processVideoForAnalysis)(media.url);
    try {
        const analysis = await (0, geminiService_1.analyzeVideoFrames)(frames, metadata.duration, prompt);
        media.analysis = { ...analysis, analyzedAt: new Date() };
        await media.save();
        (0, response_1.sendSuccess)(res, analysis);
    }
    finally {
        await (0, videoService_1.cleanupVideoTemp)(tempVideoPath, tempDir, audioPath);
    }
});
// ─────────────────────────────────────────
// AUDIO ANALYSIS
// ─────────────────────────────────────────
exports.analyzeAudioMedia = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mediaId, prompt } = req.body;
    const media = await Media_1.default.findOne({ _id: mediaId, uploadedBy: req.user._id });
    if (!media)
        return (0, response_1.sendError)(res, 'Media not found', 404);
    if (!ensureMediaType(res, media.type, ['audio']))
        return;
    const audioAnalysis = await (0, audioService_1.analyzeAudioFromUrl)(media.url, prompt);
    media.analysis = {
        summary: audioAnalysis.summary,
        transcription: audioAnalysis.transcription.text,
        sentiment: audioAnalysis.sentiment,
        analyzedAt: new Date(),
    };
    await media.save();
    (0, response_1.sendSuccess)(res, media.analysis);
});
// ─────────────────────────────────────────
// DOCUMENT ANALYSIS
// ─────────────────────────────────────────
exports.analyzeDocumentMedia = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mediaId, prompt } = req.body;
    const media = await Media_1.default.findOne({ _id: mediaId, uploadedBy: req.user._id });
    if (!media)
        return (0, response_1.sendError)(res, 'Media not found', 404);
    if (!ensureMediaType(res, media.type, ['document']))
        return;
    const tempPath = await (0, documentService_1.downloadDocumentToTempWithFallback)(media.url, media.mimeType, media.publicId);
    try {
        let analysis;
        if (media.mimeType.startsWith('image/')) {
            const pages = await (0, documentService_1.processImageDocument)(tempPath);
            analysis = await (0, geminiService_1.analyzeDocumentPages)(pages, (prompt && prompt.trim()) ? prompt.trim() : 'Analyze document');
        }
        else {
            const text = await (0, documentService_1.extractTextFromDocument)(tempPath, media.mimeType);
            analysis = await (0, geminiService_1.analyzeDocument)(text, prompt);
        }
        media.analysis = { ...analysis, analyzedAt: new Date() };
        await media.save();
        (0, response_1.sendSuccess)(res, analysis);
    }
    finally {
        await (0, fileUtils_1.deleteFile)(tempPath);
    }
});
exports.structuredExtractMedia = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mediaId, extractionType = 'general' } = req.body;
    const media = await Media_1.default.findOne({ _id: mediaId, uploadedBy: req.user._id });
    if (!media)
        return (0, response_1.sendError)(res, 'Media not found', 404);
    if (!ensureMediaType(res, media.type, ['image']))
        return;
    const tempPath = await (0, documentService_1.downloadDocumentToTempWithFallback)(media.url, media.mimeType, media.publicId);
    try {
        const page = await (0, documentService_1.processDocumentImagePage)(tempPath);
        const result = await (0, geminiService_1.extractStructuredData)([page], extractionType);
        media.analysis = { ...result, analyzedAt: new Date() };
        await media.save();
        (0, response_1.sendSuccess)(res, result);
    }
    finally {
        await (0, fileUtils_1.deleteFile)(tempPath);
    }
});
exports.analyzeChartMedia = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mediaId } = req.body;
    const media = await Media_1.default.findOne({ _id: mediaId, uploadedBy: req.user._id });
    if (!media)
        return (0, response_1.sendError)(res, 'Media not found', 404);
    if (!ensureMediaType(res, media.type, ['image']))
        return;
    const tempPath = path_1.default.join(process.cwd(), 'src/uploads', `chart-${(0, uuid_1.v4)()}.jpg`);
    try {
        const response = await axios_1.default.get(media.url, { responseType: 'arraybuffer' });
        await fs_1.default.promises.writeFile(tempPath, Buffer.from(response.data));
        const result = await (0, geminiService_1.analyzeChart)(tempPath);
        media.analysis = { ...result, analyzedAt: new Date() };
        await media.save();
        (0, response_1.sendSuccess)(res, result);
    }
    finally {
        await (0, fileUtils_1.deleteFile)(tempPath);
    }
});
exports.temporalVideoQA = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mediaId, prompt } = req.body;
    const media = await Media_1.default.findOne({ _id: mediaId, uploadedBy: req.user._id });
    if (!media)
        return (0, response_1.sendError)(res, 'Media not found', 404);
    if (!ensureMediaType(res, media.type, ['video']))
        return;
    const { frames, tempDir, tempVideoPath, audioPath } = await (0, videoService_1.processVideoForAnalysis)(media.url);
    try {
        const result = await (0, geminiService_1.answerTemporalVideoQuestion)(frames, prompt || 'Describe key events over time');
        (0, response_1.sendSuccess)(res, result);
    }
    finally {
        await (0, videoService_1.cleanupVideoTemp)(tempVideoPath, tempDir, audioPath);
    }
});
exports.analyzeMultiPageDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mediaId, prompt = 'Analyze this document' } = req.body;
    const media = await Media_1.default.findOne({ _id: mediaId, uploadedBy: req.user._id });
    if (!media)
        return (0, response_1.sendError)(res, 'Media not found', 404);
    if (!ensureMediaType(res, media.type, ['document']))
        return;
    const tempPath = await (0, documentService_1.downloadDocumentToTempWithFallback)(media.url, media.mimeType, media.publicId);
    try {
        const pages = await (0, documentService_1.processImageDocument)(tempPath);
        const result = await (0, geminiService_1.analyzeDocumentPages)(pages, prompt);
        media.analysis = { ...result, analyzedAt: new Date() };
        await media.save();
        (0, response_1.sendSuccess)(res, result);
    }
    finally {
        await (0, fileUtils_1.deleteFile)(tempPath);
    }
});
//# sourceMappingURL=analyzeController.js.map