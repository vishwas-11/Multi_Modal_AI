"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveBufferToTemp = exports.imageFileToBase64 = exports.getImageMetadata = exports.generateThumbnailBuffer = exports.generateThumbnail = exports.processImageBufferForAI = exports.processImageForAI = void 0;
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const MAX_DIMENSION = 1024; // Max width/height sent to Gemini
const JPEG_QUALITY = 85;
/**
 * Resize and compress image for LLM processing
 * Never sends large images to Gemini — always resizes first
 */
const processImageForAI = async (inputPath) => {
    const image = (0, sharp_1.default)(inputPath);
    const metadata = await image.metadata();
    const width = metadata.width || MAX_DIMENSION;
    const height = metadata.height || MAX_DIMENSION;
    // Only resize if larger than MAX_DIMENSION
    const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;
    let pipeline = image;
    if (needsResize) {
        pipeline = image.resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
        });
    }
    const buffer = await pipeline
        .jpeg({ quality: JPEG_QUALITY, progressive: true })
        .toBuffer();
    const processedMeta = await (0, sharp_1.default)(buffer).metadata();
    return {
        buffer,
        base64: buffer.toString('base64'),
        mimeType: 'image/jpeg',
        width: processedMeta.width || width,
        height: processedMeta.height || height,
        size: buffer.length,
    };
};
exports.processImageForAI = processImageForAI;
/**
 * Process image from buffer
 */
const processImageBufferForAI = async (inputBuffer) => {
    const metadata = await (0, sharp_1.default)(inputBuffer).metadata();
    const width = metadata.width || MAX_DIMENSION;
    const height = metadata.height || MAX_DIMENSION;
    const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;
    let pipeline = (0, sharp_1.default)(inputBuffer);
    if (needsResize) {
        pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
        });
    }
    const buffer = await pipeline
        .jpeg({ quality: JPEG_QUALITY, progressive: true })
        .toBuffer();
    const processedMeta = await (0, sharp_1.default)(buffer).metadata();
    return {
        buffer,
        base64: buffer.toString('base64'),
        mimeType: 'image/jpeg',
        width: processedMeta.width || MAX_DIMENSION,
        height: processedMeta.height || MAX_DIMENSION,
        size: buffer.length,
    };
};
exports.processImageBufferForAI = processImageBufferForAI;
/**
 * Generate thumbnail from image
 */
const generateThumbnail = async (inputPath, outputPath, size = 300) => {
    await (0, sharp_1.default)(inputPath)
        .resize(size, size, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toFile(outputPath);
    return outputPath;
};
exports.generateThumbnail = generateThumbnail;
/**
 * Generate thumbnail from buffer
 */
const generateThumbnailBuffer = async (inputPath, size = 300) => {
    return (0, sharp_1.default)(inputPath)
        .resize(size, size, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();
};
exports.generateThumbnailBuffer = generateThumbnailBuffer;
/**
 * Get image metadata
 */
const getImageMetadata = async (inputPath) => {
    const meta = await (0, sharp_1.default)(inputPath).metadata();
    const stats = fs_1.default.statSync(inputPath);
    return {
        width: meta.width || 0,
        height: meta.height || 0,
        format: meta.format || 'unknown',
        size: stats.size,
        hasAlpha: meta.hasAlpha || false,
    };
};
exports.getImageMetadata = getImageMetadata;
/**
 * Convert image file to base64 for Gemini (with resize)
 */
const imageFileToBase64 = async (filePath) => {
    const processed = await (0, exports.processImageForAI)(filePath);
    return {
        base64: processed.base64,
        mimeType: processed.mimeType,
    };
};
exports.imageFileToBase64 = imageFileToBase64;
/**
 * Save buffer to temp file
 */
const saveBufferToTemp = async (buffer, filename) => {
    const tempPath = path_1.default.join(process.cwd(), 'src/uploads', filename);
    await fs_1.default.promises.writeFile(tempPath, buffer);
    return tempPath;
};
exports.saveBufferToTemp = saveBufferToTemp;
//# sourceMappingURL=imageService.js.map