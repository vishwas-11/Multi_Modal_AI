import { Response, NextFunction } from 'express';
/**
 * POST /api/compare
 * Sends all images in a single Gemini context window for accurate comparison
 */
export declare const compareMediaItems: (req: import("express").Request, res: Response, next: NextFunction) => void;
/**
 * POST /api/batch
 * Run the same analysis query on up to 10 images, return grid results
 */
export declare const batchAnalyze: (req: import("express").Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=compareController.d.ts.map