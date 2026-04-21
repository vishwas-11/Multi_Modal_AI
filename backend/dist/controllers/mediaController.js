"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerCleanup = exports.getWaveformData = exports.getSessionGallery = void 0;
const Media_1 = __importDefault(require("../models/Media"));
const errorHandler_1 = require("../middleware/errorHandler");
const response_1 = require("../utils/response");
const scheduler_1 = require("../utils/scheduler");
/**
 * GET /api/media/gallery
 * Session gallery: media uploaded in last 24h, grouped by type
 */
exports.getSessionGallery = (0, errorHandler_1.asyncHandler)(async (req, res, _next) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const media = await Media_1.default.find({
        uploadedBy: req.user._id,
        createdAt: { $gte: since },
    })
        .sort({ createdAt: -1 })
        .select('originalName url type mimeType size thumbnail posterFrame waveformData duration dimensions analysis createdAt')
        .lean();
    // Group by type
    const normalized = media.map((m) => ({
        ...m,
        id: String(m._id),
        hasAnalysis: Boolean(m.analysis),
    }));
    const grouped = {
        images: normalized.filter((m) => m.type === 'image'),
        videos: normalized.filter((m) => m.type === 'video'),
        audio: normalized.filter((m) => m.type === 'audio'),
        documents: normalized.filter((m) => m.type === 'document'),
        total: media.length,
    };
    (0, response_1.sendSuccess)(res, grouped);
});
/**
 * GET /api/media/:id/waveform
 * Return waveform peaks for an audio file
 */
exports.getWaveformData = (0, errorHandler_1.asyncHandler)(async (req, res, _next) => {
    const media = await Media_1.default.findOne({ _id: req.params.id, uploadedBy: req.user._id })
        .select('type waveformData duration');
    if (!media) {
        (0, response_1.sendError)(res, 'Media not found', 404);
        return;
    }
    if (media.type !== 'audio') {
        (0, response_1.sendError)(res, 'Media is not audio', 400);
        return;
    }
    if (!media.waveformData) {
        (0, response_1.sendError)(res, 'Waveform data not yet generated. Re-upload to generate.', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, {
        peaks: media.waveformData.peaks,
        duration: media.waveformData.duration || media.duration,
    });
});
/**
 * POST /api/media/cleanup
 * Manually trigger cleanup of temp files (admin/debug use)
 */
exports.triggerCleanup = (0, errorHandler_1.asyncHandler)(async (_req, res, _next) => {
    const result = await (0, scheduler_1.cleanupOldTempFiles)();
    (0, response_1.sendSuccess)(res, result, `Cleanup completed: ${result.deleted} files deleted`);
});
//# sourceMappingURL=mediaController.js.map