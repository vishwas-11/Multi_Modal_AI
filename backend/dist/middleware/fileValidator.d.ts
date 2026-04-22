import { Request, Response, NextFunction } from 'express';
export declare const SIZE_LIMITS: Record<string, number>;
/**
 * Check if a file's magic bytes match the declared MIME type
 */
export declare const validateMagicBytes: (filePath: string, declaredMime: string) => Promise<{
    valid: boolean;
    reason?: string;
}>;
/**
 * Middleware: validate uploaded files using magic bytes + per-type size limits
 * Run this AFTER multer
 */
export declare const validateUploadedFiles: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=fileValidator.d.ts.map