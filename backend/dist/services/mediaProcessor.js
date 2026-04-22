"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocumentThumbnail = exports.processClipboardImage = exports.getAudioDuration = exports.generateAudioWaveform = exports.extractVideoPosterFrame = exports.generateImageThumbnail = void 0;
const sharp_1 = __importDefault(require("sharp"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const cloudinaryService_1 = require("./cloudinaryService");
const fileUtils_1 = require("../utils/fileUtils");
/**
 * Generate thumbnail from image and upload to Cloudinary
 */
const generateImageThumbnail = async (imagePath, size = 300) => {
    const thumbPath = path_1.default.join(process.cwd(), 'src/uploads', `thumb-${(0, uuid_1.v4)()}.jpg`);
    try {
        await (0, sharp_1.default)(imagePath)
            .resize(size, size, { fit: 'cover', position: 'attention' })
            .jpeg({ quality: 75, progressive: true })
            .toFile(thumbPath);
        const result = await (0, cloudinaryService_1.uploadFilePathToCloudinary)(thumbPath, {
            folder: 'multimodal-ai/thumbnails',
            resource_type: 'image',
        });
        return {
            url: result.url,
            publicId: result.publicId,
            width: size,
            height: size,
        };
    }
    finally {
        await (0, fileUtils_1.deleteFile)(thumbPath);
    }
};
exports.generateImageThumbnail = generateImageThumbnail;
/**
 * Extract poster frame from video (at 10% duration for a representative frame)
 */
const extractVideoPosterFrame = async (videoPath, durationSeconds) => {
    const seekTime = Math.max(1, durationSeconds * 0.1);
    const posterPath = path_1.default.join(process.cwd(), 'src/uploads', `poster-${(0, uuid_1.v4)()}.jpg`);
    await new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(videoPath)
            .seekInput(seekTime)
            .frames(1)
            .output(posterPath)
            .outputOptions(['-vf', 'scale=640:-1', '-q:v', '3'])
            .on('end', () => resolve())
            .on('error', (err) => reject(new Error(`Poster frame failed: ${err.message}`)))
            .run();
    });
    try {
        const result = await (0, cloudinaryService_1.uploadFilePathToCloudinary)(posterPath, {
            folder: 'multimodal-ai/posters',
            resource_type: 'image',
        });
        return {
            url: result.url,
            publicId: result.publicId,
            timestamp: seekTime,
        };
    }
    finally {
        await (0, fileUtils_1.deleteFile)(posterPath);
    }
};
exports.extractVideoPosterFrame = extractVideoPosterFrame;
/**
 * Generate waveform data from audio file using FFmpeg
 * Returns normalized peak amplitude values for waveform visualization
 */
const generateAudioWaveform = async (audioPath, numSamples = 200) => {
    const rawPath = path_1.default.join(process.cwd(), 'src/uploads', `waveform-${(0, uuid_1.v4)()}.raw`);
    try {
        // Extract raw PCM samples at very low sample rate for waveform
        await new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(audioPath)
                .audioChannels(1) // Mono
                .audioFrequency(8000) // Low sample rate sufficient for waveform
                .audioCodec('pcm_s16le') // 16-bit signed PCM
                .format('s16le')
                .output(rawPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(new Error(`Waveform extraction failed: ${err.message}`)))
                .run();
        });
        // Read PCM bytes
        const rawBuffer = await fs_1.default.promises.readFile(rawPath);
        const samples = new Int16Array(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength / 2);
        // Downsample to numSamples peaks
        const blockSize = Math.floor(samples.length / numSamples);
        const peaks = [];
        let maxAmplitude = 0;
        for (let i = 0; i < numSamples; i++) {
            const start = i * blockSize;
            const end = Math.min(start + blockSize, samples.length);
            let blockMax = 0;
            for (let j = start; j < end; j++) {
                const abs = Math.abs(samples[j]);
                if (abs > blockMax)
                    blockMax = abs;
            }
            peaks.push(blockMax);
            if (blockMax > maxAmplitude)
                maxAmplitude = blockMax;
        }
        // Normalize 0-1
        const normalized = maxAmplitude > 0
            ? peaks.map((p) => Math.round((p / maxAmplitude) * 100) / 100)
            : peaks.map(() => 0);
        // Get duration from ffprobe
        const duration = await (0, exports.getAudioDuration)(audioPath);
        return {
            peaks: normalized,
            duration,
            sampleRate: numSamples,
        };
    }
    finally {
        await (0, fileUtils_1.deleteFile)(rawPath);
    }
};
exports.generateAudioWaveform = generateAudioWaveform;
/**
 * Get audio duration in seconds
 */
const getAudioDuration = (audioPath) => {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(audioPath, (err, metadata) => {
            if (err) {
                resolve(0); // Non-fatal
                return;
            }
            resolve(Number(metadata.format.duration) || 0);
        });
    });
};
exports.getAudioDuration = getAudioDuration;
/**
 * Process clipboard-pasted image data (base64 or buffer)
 * Validates and saves to temp, returns file-like object
 */
const processClipboardImage = async (base64Data, mimeType = 'image/png') => {
    // Strip data URL prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length === 0) {
        throw new Error('Empty image data from clipboard');
    }
    if (buffer.length > 20 * 1024 * 1024) {
        throw new Error('Clipboard image exceeds 20MB limit');
    }
    // Process with sharp to validate and normalize
    const processed = await (0, sharp_1.default)(buffer)
        .jpeg({ quality: 90 })
        .toBuffer();
    const tempPath = path_1.default.join(process.cwd(), 'src/uploads', `clipboard-${(0, uuid_1.v4)()}.jpg`);
    await fs_1.default.promises.writeFile(tempPath, processed);
    return {
        tempPath,
        size: processed.length,
        mimeType: 'image/jpeg',
    };
};
exports.processClipboardImage = processClipboardImage;
/**
 * Generate thumbnail for document page image
 */
const generateDocumentThumbnail = async (imagePath) => {
    return (0, exports.generateImageThumbnail)(imagePath, 400); // Slightly larger for document readability
};
exports.generateDocumentThumbnail = generateDocumentThumbnail;
//# sourceMappingURL=mediaProcessor.js.map