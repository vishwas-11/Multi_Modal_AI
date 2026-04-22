"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopCleanupScheduler = exports.startCleanupScheduler = exports.cleanupOldTempFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'src/uploads');
const MAX_AGE_MS = parseInt(process.env.FILE_MAX_AGE_HOURS || '24', 10) * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run every 1 hour
let cleanupTimer = null;
/**
 * Delete temp upload files older than MAX_AGE_MS
 */
const cleanupOldTempFiles = async () => {
    let deleted = 0;
    let errors = 0;
    if (!fs_1.default.existsSync(UPLOAD_DIR))
        return { deleted, errors };
    try {
        const entries = await fs_1.default.promises.readdir(UPLOAD_DIR, { withFileTypes: true });
        const now = Date.now();
        await Promise.allSettled(entries
            .filter((e) => e.isFile() && e.name !== '.gitkeep')
            .map(async (entry) => {
            const filePath = path_1.default.join(UPLOAD_DIR, entry.name);
            try {
                const stat = await fs_1.default.promises.stat(filePath);
                const ageMs = now - stat.mtimeMs;
                if (ageMs > MAX_AGE_MS) {
                    await fs_1.default.promises.unlink(filePath);
                    deleted++;
                }
            }
            catch {
                errors++;
            }
        }));
        // Also cleanup empty frame directories
        const dirs = entries.filter((e) => e.isDirectory());
        for (const dir of dirs) {
            const dirPath = path_1.default.join(UPLOAD_DIR, dir.name);
            try {
                const stat = await fs_1.default.promises.stat(dirPath);
                const ageMs = now - stat.mtimeMs;
                if (ageMs > MAX_AGE_MS) {
                    const contents = await fs_1.default.promises.readdir(dirPath);
                    await Promise.allSettled(contents.map((f) => fs_1.default.promises.unlink(path_1.default.join(dirPath, f))));
                    await fs_1.default.promises.rmdir(dirPath);
                    deleted++;
                }
            }
            catch {
                errors++;
            }
        }
    }
    catch (err) {
        console.error('Cleanup scheduler error:', err);
    }
    if (deleted > 0 || errors > 0) {
        console.log(`🧹 Cleanup: deleted ${deleted} temp files, ${errors} errors`);
    }
    return { deleted, errors };
};
exports.cleanupOldTempFiles = cleanupOldTempFiles;
/**
 * Start the periodic cleanup scheduler
 */
const startCleanupScheduler = () => {
    if (cleanupTimer)
        return; // Already running
    // Run immediately on startup, then every hour
    (0, exports.cleanupOldTempFiles)();
    cleanupTimer = setInterval(() => {
        (0, exports.cleanupOldTempFiles)();
    }, CLEANUP_INTERVAL_MS);
    // Don't block process exit
    if (cleanupTimer.unref)
        cleanupTimer.unref();
    console.log(` File cleanup scheduler started (max age: ${MAX_AGE_MS / 3600000}h)`);
};
exports.startCleanupScheduler = startCleanupScheduler;
/**
 * Stop the cleanup scheduler
 */
const stopCleanupScheduler = () => {
    if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
    }
};
exports.stopCleanupScheduler = stopCleanupScheduler;
//# sourceMappingURL=scheduler.js.map