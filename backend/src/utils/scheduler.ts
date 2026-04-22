import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'src/uploads');
const MAX_AGE_MS = parseInt(process.env.FILE_MAX_AGE_HOURS || '24', 10) * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run every 1 hour

let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Delete temp upload files older than MAX_AGE_MS
 */
export const cleanupOldTempFiles = async (): Promise<{ deleted: number; errors: number }> => {
  let deleted = 0;
  let errors = 0;

  if (!fs.existsSync(UPLOAD_DIR)) return { deleted, errors };

  try {
    const entries = await fs.promises.readdir(UPLOAD_DIR, { withFileTypes: true });
    const now = Date.now();

    await Promise.allSettled(
      entries
        .filter((e) => e.isFile() && e.name !== '.gitkeep')
        .map(async (entry) => {
          const filePath = path.join(UPLOAD_DIR, entry.name);
          try {
            const stat = await fs.promises.stat(filePath);
            const ageMs = now - stat.mtimeMs;

            if (ageMs > MAX_AGE_MS) {
              await fs.promises.unlink(filePath);
              deleted++;
            }
          } catch {
            errors++;
          }
        })
    );

    // Also cleanup empty frame directories
    const dirs = entries.filter((e) => e.isDirectory());
    for (const dir of dirs) {
      const dirPath = path.join(UPLOAD_DIR, dir.name);
      try {
        const stat = await fs.promises.stat(dirPath);
        const ageMs = now - stat.mtimeMs;
        if (ageMs > MAX_AGE_MS) {
          const contents = await fs.promises.readdir(dirPath);
          await Promise.allSettled(
            contents.map((f) => fs.promises.unlink(path.join(dirPath, f)))
          );
          await fs.promises.rmdir(dirPath);
          deleted++;
        }
      } catch {
        errors++;
      }
    }
  } catch (err) {
    console.error('Cleanup scheduler error:', err);
  }

  if (deleted > 0 || errors > 0) {
    console.log(`🧹 Cleanup: deleted ${deleted} temp files, ${errors} errors`);
  }

  return { deleted, errors };
};

/**
 * Start the periodic cleanup scheduler
 */
export const startCleanupScheduler = (): void => {
  if (cleanupTimer) return; // Already running

  // Run immediately on startup, then every hour
  cleanupOldTempFiles();

  cleanupTimer = setInterval(() => {
    cleanupOldTempFiles();
  }, CLEANUP_INTERVAL_MS);

  // Don't block process exit
  if (cleanupTimer.unref) cleanupTimer.unref();

  console.log(` File cleanup scheduler started (max age: ${MAX_AGE_MS / 3600000}h)`);
};

/**
 * Stop the cleanup scheduler
 */
export const stopCleanupScheduler = (): void => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
};