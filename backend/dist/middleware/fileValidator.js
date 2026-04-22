"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUploadedFiles = exports.validateMagicBytes = exports.SIZE_LIMITS = void 0;
const fs_1 = __importDefault(require("fs"));
const fileUtils_1 = require("../utils/fileUtils");
const MAGIC_SIGNATURES = {
    'image/jpeg': [{ bytes: [0xFF, 0xD8, 0xFF], offset: 0 }],
    'image/png': [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 }],
    'image/gif': [{ bytes: [0x47, 0x49, 0x46, 0x38], offset: 0 }],
    'image/webp': [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }], // RIFF....WEBP
    'image/bmp': [{ bytes: [0x42, 0x4D], offset: 0 }],
    'video/mp4': [
        { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp box
        { bytes: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], offset: 0 },
    ],
    'video/webm': [{ bytes: [0x1A, 0x45, 0xDF, 0xA3], offset: 0 }],
    'video/quicktime': [{ bytes: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], offset: 4 }],
    'video/x-msvideo': [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }], // RIFF
    'audio/mpeg': [
        { bytes: [0xFF, 0xFB], offset: 0 },
        { bytes: [0xFF, 0xF3], offset: 0 },
        { bytes: [0xFF, 0xF2], offset: 0 },
        { bytes: [0x49, 0x44, 0x33], offset: 0 }, // ID3 tag
    ],
    'audio/wav': [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }], // RIFF....WAVE
    'audio/ogg': [{ bytes: [0x4F, 0x67, 0x67, 0x53], offset: 0 }], // OggS
    'audio/flac': [{ bytes: [0x66, 0x4C, 0x61, 0x43], offset: 0 }], // fLaC
    'audio/mp4': [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
    'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 }], // %PDF
};
// Size limits per file type (in bytes)
exports.SIZE_LIMITS = {
    image: 20 * 1024 * 1024, // 20MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024, // 50MB
    document: 20 * 1024 * 1024, // 20MB
};
/**
 * Read first N bytes from a file
 */
const readMagicBytes = async (filePath, count = 16) => {
    const fd = await fs_1.default.promises.open(filePath, 'r');
    try {
        const buf = Buffer.alloc(count);
        await fd.read(buf, 0, count, 0);
        return buf;
    }
    finally {
        await fd.close();
    }
};
/**
 * Check if a file's magic bytes match the declared MIME type
 */
const validateMagicBytes = async (filePath, declaredMime) => {
    const signatures = MAGIC_SIGNATURES[declaredMime];
    // If we have no signature for this type, allow it (e.g. text/plain)
    if (!signatures)
        return { valid: true };
    try {
        const magic = await readMagicBytes(filePath, 16);
        const matched = signatures.some((sig) => {
            const slice = magic.slice(sig.offset, sig.offset + sig.bytes.length);
            return sig.bytes.every((byte, i) => {
                if (sig.mask) {
                    return (slice[i] & sig.mask[i]) === (byte & sig.mask[i]);
                }
                return slice[i] === byte;
            });
        });
        if (!matched) {
            return {
                valid: false,
                reason: `File content does not match declared type ${declaredMime}. Possible spoofed extension.`,
            };
        }
        return { valid: true };
    }
    catch {
        return { valid: false, reason: 'Could not read file for validation' };
    }
};
exports.validateMagicBytes = validateMagicBytes;
/**
 * Get file category from mime type
 */
const getMimeCategory = (mime) => {
    if (mime.startsWith('image/'))
        return 'image';
    if (mime.startsWith('video/'))
        return 'video';
    if (mime.startsWith('audio/'))
        return 'audio';
    return 'document';
};
/**
 * Middleware: validate uploaded files using magic bytes + per-type size limits
 * Run this AFTER multer
 */
const validateUploadedFiles = async (req, res, next) => {
    const normalizeFiles = (files, file) => {
        if (Array.isArray(files))
            return files;
        if (files && typeof files === 'object')
            return Object.values(files).flat();
        if (file)
            return [file];
        return [];
    };
    const files = normalizeFiles(req.files, req.file);
    if (files.length === 0) {
        next();
        return;
    }
    const invalidFiles = [];
    const filesToCleanup = [];
    for (const file of files) {
        filesToCleanup.push(file.path);
        const category = getMimeCategory(file.mimetype);
        const sizeLimit = exports.SIZE_LIMITS[category];
        // Check per-type size limit
        if (file.size > sizeLimit) {
            invalidFiles.push(`${file.originalname}: exceeds ${category} size limit (${Math.round(sizeLimit / 1024 / 1024)}MB)`);
            continue;
        }
        // Validate magic bytes
        const magicResult = await (0, exports.validateMagicBytes)(file.path, file.mimetype);
        if (!magicResult.valid) {
            invalidFiles.push(`${file.originalname}: ${magicResult.reason}`);
        }
    }
    if (invalidFiles.length > 0) {
        // Cleanup all temp files
        await (0, fileUtils_1.deleteFiles)(filesToCleanup);
        res.status(400).json({
            success: false,
            message: 'File validation failed',
            errors: invalidFiles,
        });
        return;
    }
    next();
};
exports.validateUploadedFiles = validateUploadedFiles;
//# sourceMappingURL=fileValidator.js.map