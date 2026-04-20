/**
 * Delete temp upload files older than MAX_AGE_MS
 */
export declare const cleanupOldTempFiles: () => Promise<{
    deleted: number;
    errors: number;
}>;
/**
 * Start the periodic cleanup scheduler
 */
export declare const startCleanupScheduler: () => void;
/**
 * Stop the cleanup scheduler
 */
export declare const stopCleanupScheduler: () => void;
//# sourceMappingURL=scheduler.d.ts.map