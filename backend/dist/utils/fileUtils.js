"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTempPath = exports.formatFileSize = exports.cleanupDirectory = exports.deleteFiles = exports.deleteFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Delete a file from the filesystem safely
 */
const deleteFile = async (filePath) => {
    try {
        if (fs_1.default.existsSync(filePath)) {
            await fs_1.default.promises.unlink(filePath);
        }
    }
    catch (error) {
        console.warn(`Warning: Could not delete temp file ${filePath}:`, error);
    }
};
exports.deleteFile = deleteFile;
/**
 * Delete multiple files
 */
const deleteFiles = async (filePaths) => {
    await Promise.allSettled(filePaths.map((fp) => (0, exports.deleteFile)(fp)));
};
exports.deleteFiles = deleteFiles;
/**
 * Delete all files in a directory matching a pattern
 */
const cleanupDirectory = async (dirPath, pattern) => {
    try {
        if (!fs_1.default.existsSync(dirPath))
            return;
        const files = await fs_1.default.promises.readdir(dirPath);
        const toDelete = pattern ? files.filter((f) => pattern.test(f)) : files;
        await Promise.allSettled(toDelete.map((f) => (0, exports.deleteFile)(path_1.default.join(dirPath, f))));
    }
    catch (error) {
        console.warn(`Warning: Could not clean directory ${dirPath}:`, error);
    }
};
exports.cleanupDirectory = cleanupDirectory;
/**
 * Get file size in human readable format
 */
const formatFileSize = (bytes) => {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
exports.formatFileSize = formatFileSize;
/**
 * Get temporary file path
 */
const getTempPath = (filename) => {
    return path_1.default.join(process.cwd(), 'src/uploads', filename);
};
exports.getTempPath = getTempPath;
//# sourceMappingURL=fileUtils.js.map