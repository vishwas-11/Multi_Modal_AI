import fs from 'fs';
import path from 'path';

/**
 * Delete a file from the filesystem safely
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.warn(`Warning: Could not delete temp file ${filePath}:`, error);
  }
};

/**
 * Delete multiple files
 */
export const deleteFiles = async (filePaths: string[]): Promise<void> => {
  await Promise.allSettled(filePaths.map((fp) => deleteFile(fp)));
};

/**
 * Delete all files in a directory matching a pattern
 */
export const cleanupDirectory = async (
  dirPath: string,
  pattern?: RegExp
): Promise<void> => {
  try {
    if (!fs.existsSync(dirPath)) return;
    const files = await fs.promises.readdir(dirPath);
    const toDelete = pattern ? files.filter((f) => pattern.test(f)) : files;
    await Promise.allSettled(
      toDelete.map((f) => deleteFile(path.join(dirPath, f)))
    );
  } catch (error) {
    console.warn(`Warning: Could not clean directory ${dirPath}:`, error);
  }
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Get temporary file path
 */
export const getTempPath = (filename: string): string => {
  return path.join(process.cwd(), 'src/uploads', filename);
};