"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchAnalyze = exports.compareMediaItems = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const Media_1 = __importDefault(require("../models/Media"));
const errorHandler_1 = require("../middleware/errorHandler");
const response_1 = require("../utils/response");
const geminiService_1 = require("../services/geminiService");
const imageService_1 = require("../services/imageService");
const fileUtils_1 = require("../utils/fileUtils");
/**
 * POST /api/compare
 * Sends all images in a single Gemini context window for accurate comparison
 */
exports.compareMediaItems = (0, errorHandler_1.asyncHandler)(async (req, res, _next) => {
    const { mediaIds, prompt } = req.body;
    const userId = req.user._id;
    const mediaItems = await Media_1.default.find({ _id: { $in: mediaIds }, uploadedBy: userId });
    if (mediaItems.length < 2) {
        (0, response_1.sendError)(res, 'At least 2 valid media items required for comparison', 400);
        return;
    }
    const comparisonItems = [];
    const tempFiles = [];
    for (const media of mediaItems) {
        if (media.type === 'image') {
            const tempPath = path_1.default.join(process.cwd(), 'src/uploads', `cmp-${(0, uuid_1.v4)()}.jpg`);
            tempFiles.push(tempPath);
            try {
                const resp = await axios_1.default.get(media.url, { responseType: 'arraybuffer', timeout: 30000 });
                await fs_1.default.promises.writeFile(tempPath, Buffer.from(resp.data));
                const processed = await (0, imageService_1.processImageForAI)(tempPath);
                comparisonItems.push({ type: 'image', content: { base64: processed.base64, mimeType: processed.mimeType } });
            }
            catch {
                // Fallback to text summary
                if (media.analysis?.summary) {
                    comparisonItems.push({ type: 'image (summary)', content: media.analysis.summary });
                }
            }
        }
        else if (media.analysis) {
            const text = [
                `File: ${media.originalName} | Type: ${media.type}`,
                media.analysis.summary ? `Summary: ${media.analysis.summary}` : '',
                media.analysis.transcription ? `Transcription: ${media.analysis.transcription.substring(0, 1000)}` : '',
                media.analysis.description ? `Description: ${media.analysis.description.substring(0, 500)}` : '',
            ].filter(Boolean).join('\n');
            comparisonItems.push({ type: media.type, content: text });
        }
        else {
            comparisonItems.push({ type: media.type, content: `[${media.type}: ${media.originalName}] — no analysis yet` });
        }
    }
    try {
        const result = await (0, geminiService_1.compareMedia)(comparisonItems, prompt);
        await (0, fileUtils_1.deleteFiles)(tempFiles);
        (0, response_1.sendSuccess)(res, {
            itemsCompared: mediaItems.length,
            mediaIds: mediaItems.map((m) => ({ id: m._id, name: m.originalName, type: m.type })),
            comparison: result,
        });
    }
    catch (err) {
        await (0, fileUtils_1.deleteFiles)(tempFiles);
        throw err;
    }
});
/**
 * POST /api/batch
 * Run the same analysis query on up to 10 images, return grid results
 */
exports.batchAnalyze = (0, errorHandler_1.asyncHandler)(async (req, res, _next) => {
    const { mediaIds, prompt = 'Describe this image in detail.' } = req.body;
    const userId = req.user._id;
    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        (0, response_1.sendError)(res, 'mediaIds array is required', 400);
        return;
    }
    if (mediaIds.length > 10) {
        (0, response_1.sendError)(res, 'Maximum 10 items per batch', 400);
        return;
    }
    const mediaItems = await Media_1.default.find({ _id: { $in: mediaIds }, uploadedBy: userId });
    if (mediaItems.length === 0) {
        (0, response_1.sendError)(res, 'No media found', 404);
        return;
    }
    const { analyzeImage } = await Promise.resolve().then(() => __importStar(require('../services/geminiService')));
    const CONCURRENCY = 3;
    const results = [];
    const tempFiles = [];
    for (let i = 0; i < mediaItems.length; i += CONCURRENCY) {
        const batch = mediaItems.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.allSettled(batch.map(async (media) => {
            if (media.type !== 'image') {
                return {
                    mediaId: media._id,
                    originalName: media.originalName,
                    type: media.type,
                    url: media.url,
                    thumbnail: media.thumbnail,
                    analysis: media.analysis || null,
                    note: 'Use /api/analyze/ endpoints for non-image types',
                };
            }
            const tempPath = path_1.default.join(process.cwd(), 'src/uploads', `batch-${(0, uuid_1.v4)()}.jpg`);
            tempFiles.push(tempPath);
            const resp = await axios_1.default.get(media.url, { responseType: 'arraybuffer', timeout: 30000 });
            await fs_1.default.promises.writeFile(tempPath, Buffer.from(resp.data));
            const analysis = await analyzeImage(tempPath, prompt);
            media.analysis = { ...analysis, analyzedAt: new Date() };
            await media.save();
            return {
                mediaId: media._id,
                originalName: media.originalName,
                type: media.type,
                url: media.url,
                thumbnail: media.thumbnail,
                analysis,
            };
        }));
        for (const r of batchResults) {
            if (r.status === 'fulfilled') {
                results.push(r.value);
            }
            else {
                results.push({ mediaId: null, originalName: 'unknown', type: 'unknown', url: '', error: r.reason?.message });
            }
        }
    }
    await (0, fileUtils_1.deleteFiles)(tempFiles);
    (0, response_1.sendSuccess)(res, {
        processed: results.length,
        prompt,
        results,
    });
});
//# sourceMappingURL=compareController.js.map