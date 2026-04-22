"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupVideoTemp = exports.processVideoForAnalysis = exports.downloadVideoToTemp = exports.extractAudioFromVideo = exports.processFramesForAI = exports.extractFrames = exports.getVideoMetadata = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const ffprobe_static_1 = __importDefault(require("ffprobe-static"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const imageService_1 = require("./imageService");
const fileUtils_1 = require("../utils/fileUtils");
const MAX_FRAMES = 20;
const FFMPEG_TIMEOUT_MS = 120000;
if (ffmpeg_static_1.default) {
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_static_1.default);
}
if (ffprobe_static_1.default.path) {
    fluent_ffmpeg_1.default.setFfprobePath(ffprobe_static_1.default.path);
}
/**
 * Get video metadata using ffprobe
 */
const getVideoMetadata = (videoPath) => {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                const message = err instanceof Error ? err.message : String(err);
                return reject(new Error(`FFprobe failed: ${message}`));
            }
            const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
            const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
            const format = metadata.format;
            if (!videoStream)
                return reject(new Error('No video stream found'));
            const fpsRaw = videoStream.r_frame_rate || '25/1';
            const [num, den] = fpsRaw.split('/').map(Number);
            const fps = den ? num / den : 25;
            const duration = Number(format.duration) || 0;
            resolve({
                duration,
                width: videoStream.width || 0,
                height: videoStream.height || 0,
                fps,
                bitrate: Number(format.bit_rate) || 0,
                codec: videoStream.codec_name || 'unknown',
                format: format.format_name || 'unknown',
                size: Number(format.size) || 0,
                hasAudio: !!audioStream,
                audioCodec: audioStream?.codec_name,
                frameCount: Math.floor(duration * fps),
            });
        });
    });
};
exports.getVideoMetadata = getVideoMetadata;
// ─────────────────────────────────────────
// Frame Strategies
// ─────────────────────────────────────────
const getFixedIntervalTimestamps = (duration, interval = 3) => {
    const timestamps = [];
    for (let t = 0; t < duration; t += interval) {
        timestamps.push(Math.round(t * 10) / 10);
        if (timestamps.length >= MAX_FRAMES)
            break;
    }
    if (duration > 1 && timestamps[timestamps.length - 1] < duration - 1) {
        timestamps.push(Math.round((duration - 0.5) * 10) / 10);
    }
    return timestamps;
};
const getUniformTimestamps = (duration) => {
    const interval = duration / (MAX_FRAMES + 1);
    return Array.from({ length: MAX_FRAMES }, (_, i) => Math.round(interval * (i + 1) * 10) / 10);
};
const getSceneChangeTimestamps = async (videoPath, threshold = 0.3) => {
    return new Promise((resolve) => {
        const timestamps = [];
        const nullOutput = process.platform === 'win32' ? 'NUL' : '/dev/null';
        (0, fluent_ffmpeg_1.default)(videoPath)
            .outputOptions([
            '-vf', `select='gt(scene,${threshold})',showinfo`,
            '-vsync', 'vfr',
            '-f', 'null',
        ])
            .output(nullOutput)
            .on('stderr', (line) => {
            const match = line.match(/pts_time:([\d.]+)/);
            if (match) {
                timestamps.push(parseFloat(match[1]));
            }
        })
            .on('end', () => {
            resolve([0, ...timestamps].slice(0, MAX_FRAMES));
        })
            .on('error', () => resolve([]))
            .run();
    });
};
// ─────────────────────────────────────────
// Frame Extraction
// ─────────────────────────────────────────
const extractFrameAtTimestamp = (videoPath, timestamp, outputPath) => {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(videoPath)
            .seekInput(timestamp)
            .frames(1)
            .output(outputPath)
            .outputOptions(['-vf', 'scale=1024:-1', '-q:v', '3'])
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
    });
};
const extractFrames = async (videoPath, outputDir, strategy = 'fixed_interval') => {
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    const metadata = await (0, exports.getVideoMetadata)(videoPath);
    let timestamps = [];
    if (strategy === 'scene_change') {
        timestamps = await getSceneChangeTimestamps(videoPath);
        if (timestamps.length === 0) {
            timestamps = getFixedIntervalTimestamps(metadata.duration);
        }
    }
    else if (strategy === 'uniform') {
        timestamps = getUniformTimestamps(metadata.duration);
    }
    else {
        timestamps = getFixedIntervalTimestamps(metadata.duration);
    }
    const frames = [];
    for (const ts of timestamps) {
        const framePath = path_1.default.join(outputDir, `frame-${(0, uuid_1.v4)()}-${ts}.jpg`);
        try {
            await extractFrameAtTimestamp(videoPath, ts, framePath);
            frames.push({ timestamp: ts, filePath: framePath });
        }
        catch {
            console.warn(`Skipping frame at ${ts}s`);
        }
    }
    return frames;
};
exports.extractFrames = extractFrames;
// ─────────────────────────────────────────
// AI Processing
// ─────────────────────────────────────────
const processFramesForAI = async (frames) => {
    const results = await Promise.all(frames.map(async (frame) => {
        try {
            const processed = await (0, imageService_1.processImageForAI)(frame.filePath);
            return { ...frame, processed };
        }
        catch {
            return frame;
        }
    }));
    return results.filter((f) => f.processed);
};
exports.processFramesForAI = processFramesForAI;
// ─────────────────────────────────────────
// Audio Extraction
// ─────────────────────────────────────────
const extractAudioFromVideo = (videoPath) => {
    const audioPath = path_1.default.join(process.cwd(), 'src/uploads', `audio-${(0, uuid_1.v4)()}.mp3`);
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(videoPath)
            .noVideo()
            .audioCodec('libmp3lame')
            .output(audioPath)
            .on('end', () => resolve(audioPath))
            .on('error', (err) => reject(err))
            .run();
    });
};
exports.extractAudioFromVideo = extractAudioFromVideo;
// ─────────────────────────────────────────
// Download + Full Pipeline
// ─────────────────────────────────────────
const downloadVideoToTemp = async (url) => {
    const tempPath = path_1.default.join(process.cwd(), 'src/uploads', `video-${(0, uuid_1.v4)()}.mp4`);
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await axios_1.default.get(url, {
                responseType: 'arraybuffer',
                timeout: FFMPEG_TIMEOUT_MS,
                maxRedirects: 5,
            });
            await fs_1.default.promises.writeFile(tempPath, Buffer.from(response.data));
            return tempPath;
        }
        catch (error) {
            lastError = error;
            if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 750));
            }
        }
    }
    throw lastError;
};
exports.downloadVideoToTemp = downloadVideoToTemp;
const processVideoForAnalysis = async (videoUrl) => {
    const tempVideoPath = await (0, exports.downloadVideoToTemp)(videoUrl);
    const tempDir = path_1.default.join(process.cwd(), 'src/uploads', `frames-${(0, uuid_1.v4)()}`);
    try {
        const metadata = await (0, exports.getVideoMetadata)(tempVideoPath);
        const frames = await (0, exports.processFramesForAI)(await (0, exports.extractFrames)(tempVideoPath, tempDir));
        let audioPath;
        if (metadata.hasAudio) {
            audioPath = await (0, exports.extractAudioFromVideo)(tempVideoPath);
        }
        return { frames, metadata, tempDir, tempVideoPath, audioPath };
    }
    catch (err) {
        await (0, exports.cleanupVideoTemp)(tempVideoPath, tempDir);
        throw err;
    }
};
exports.processVideoForAnalysis = processVideoForAnalysis;
const cleanupVideoTemp = async (tempVideoPath, tempDir, audioPath) => {
    await (0, fileUtils_1.deleteFile)(tempVideoPath);
    if (audioPath) {
        await (0, fileUtils_1.deleteFile)(audioPath);
    }
    if (fs_1.default.existsSync(tempDir)) {
        const files = fs_1.default.readdirSync(tempDir).map((f) => path_1.default.join(tempDir, f));
        await (0, fileUtils_1.deleteFiles)(files);
        fs_1.default.rmdirSync(tempDir);
    }
};
exports.cleanupVideoTemp = cleanupVideoTemp;
//# sourceMappingURL=videoService.js.map