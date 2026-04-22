/**
 * Delete a file from the filesystem safely
 */
export declare const deleteFile: (filePath: string) => Promise<void>;
/**
 * Delete multiple files
 */
export declare const deleteFiles: (filePaths: string[]) => Promise<void>;
/**
 * Delete all files in a directory matching a pattern
 */
export declare const cleanupDirectory: (dirPath: string, pattern?: RegExp) => Promise<void>;
/**
 * Get file size in human readable format
 */
export declare const formatFileSize: (bytes: number) => string;
/**
 * Get temporary file path
 */
export declare const getTempPath: (filename: string) => string;
//# sourceMappingURL=fileUtils.d.ts.map