"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedia = exports.getMediaById = exports.listMedia = exports.uploadClipboardImage = exports.uploadMedia = void 0;
const Media_1 = __importDefault(require("../models/Media"));
const errorHandler_1 = require("../middleware/errorHandler");
const cloudinaryService_1 = require("../services/cloudinaryService");
const imageService_1 = require("../services/imageService");
const videoService_1 = require("../services/videoService");
const mediaProcessor_1 = require("../services/mediaProcessor");
const mediaProcessor_2 = require("../services/mediaProcessor");
const fileUtils_1 = require("../utils/fileUtils");
const multer_1 = require("../config/multer");
const response_1 = require("../utils/response");
/**
 * POST /api/upload
 */
exports.uploadMedia = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const files = req.files;
    const singleFile = req.file;
    const filesToProcess = files || (singleFile ? [singleFile] : []);
    if (filesToProcess.length === 0) {
        (0, response_1.sendError)(res, 'No files provided', 400);
        return;
    }
    const userId = req.user._id;
    const uploadedMedia = [];
    const tempPaths = [];
    for (const file of filesToProcess) {
        tempPaths.push(file.path);
        try {
            const category = (0, multer_1.getFileCategory)(file.mimetype);
            const resourceType = category === 'image'
                ? 'image'
                : category === 'video'
                    ? 'video'
                    : category === 'audio'
                        ? 'video'
                        : 'raw';
            // Upload to Cloudinary
            const cloudResult = await (0, cloudinaryService_1.uploadFilePathToCloudinary)(file.path, {
                resource_type: resourceType,
                folder: `multimodal-ai/${category}`,
            });
            let dimensions;
            let duration;
            let thumbnail;
            let posterFrame;
            let waveformData;
            let videoMeta;
            // IMAGE
            if (category === 'image') {
                try {
                    const meta = await (0, imageService_1.getImageMetadata)(file.path);
                    dimensions = { width: meta.width, height: meta.height };
                    const thumb = await (0, mediaProcessor_2.generateImageThumbnail)(file.path);
                    thumbnail = thumb.url;
                }
                catch { }
            }
            // VIDEO
            if (category === 'video') {
                try {
                    const meta = await (0, videoService_1.getVideoMetadata)(file.path);
                    duration = meta.duration;
                    dimensions = { width: meta.width, height: meta.height };
                    const poster = await (0, mediaProcessor_2.extractVideoPosterFrame)(file.path, meta.duration);
                    posterFrame = poster.url;
                    thumbnail = poster.url;
                    videoMeta = {
                        fps: meta.fps,
                        codec: meta.codec,
                        hasAudio: meta.hasAudio,
                        audioCodec: meta.audioCodec,
                        frameCount: meta.frameCount,
                    };
                }
                catch { }
            }
            // AUDIO
            if (category === 'audio') {
                try {
                    duration = await (0, mediaProcessor_1.getAudioDuration)(file.path);
                    const wf = await (0, mediaProcessor_2.generateAudioWaveform)(file.path);
                    waveformData = { peaks: wf.peaks, duration: wf.duration };
                }
                catch { }
            }
            const media = await Media_1.default.create({
                fileName: file.filename,
                originalName: file.originalname,
                url: cloudResult.url,
                publicId: cloudResult.publicId,
                type: category,
                mimeType: file.mimetype,
                size: file.size,
                uploadedBy: userId,
                dimensions: dimensions ||
                    (cloudResult.width
                        ? { width: cloudResult.width, height: cloudResult.height }
                        : undefined),
                duration: duration || cloudResult.duration,
                thumbnail,
                posterFrame,
                waveformData,
                videoMetadata: videoMeta,
            });
            uploadedMedia.push(formatMediaResponse(media));
        }
        catch (err) {
            console.error(`Failed to process ${file.originalname}:`, err);
        }
    }
    await Promise.allSettled(tempPaths.map((p) => (0, fileUtils_1.deleteFile)(p)));
    if (uploadedMedia.length === 0) {
        (0, response_1.sendError)(res, 'All files failed to upload', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, uploadedMedia, 'Upload successful', 201);
});
/**
 * Clipboard upload
 */
exports.uploadClipboardImage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { imageData, mimeType = 'image/png' } = req.body;
    if (!imageData) {
        (0, response_1.sendError)(res, 'imageData is required', 400);
        return;
    }
    const { tempPath, size } = await (0, mediaProcessor_2.processClipboardImage)(imageData, mimeType);
    try {
        const cloud = await (0, cloudinaryService_1.uploadFilePathToCloudinary)(tempPath, {
            resource_type: 'image',
            folder: 'multimodal-ai/image',
        });
        const meta = await (0, imageService_1.getImageMetadata)(tempPath);
        const thumb = await (0, mediaProcessor_2.generateImageThumbnail)(tempPath);
        const media = await Media_1.default.create({
            fileName: `clipboard-${Date.now()}.jpg`,
            originalName: 'clipboard-image.jpg',
            url: cloud.url,
            publicId: cloud.publicId,
            type: 'image',
            mimeType: 'image/jpeg',
            size,
            uploadedBy: req.user._id,
            dimensions: { width: meta.width, height: meta.height },
            thumbnail: thumb.url,
        });
        (0, response_1.sendSuccess)(res, formatMediaResponse(media), 'Clipboard uploaded', 201);
    }
    finally {
        await (0, fileUtils_1.deleteFile)(tempPath);
    }
});
/**
 * LIST MEDIA
 */
exports.listMedia = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const query = { uploadedBy: req.user._id };
    const media = await Media_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    (0, response_1.sendSuccess)(res, media);
});
exports.getMediaById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const media = await Media_1.default.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!media) {
        (0, response_1.sendError)(res, 'Not found', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, media);
});
/**
 * DELETE MEDIA
 */
exports.deleteMedia = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const media = await Media_1.default.findById(req.params.id);
    if (!media) {
        (0, response_1.sendError)(res, 'Not found', 404);
        return;
    }
    await (0, cloudinaryService_1.deleteFromCloudinary)(media.publicId, 'image');
    await media.deleteOne();
    (0, response_1.sendSuccess)(res, {}, 'Deleted');
});
// helper
const formatMediaResponse = (media) => ({
    id: media._id,
    url: media.url,
    type: media.type,
    createdAt: media.createdAt,
});
//# sourceMappingURL=uploadController.js.map