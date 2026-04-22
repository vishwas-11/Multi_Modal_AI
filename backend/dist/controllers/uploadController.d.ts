import { Response, NextFunction } from 'express';
/**
 * POST /api/upload
 */
export declare const uploadMedia: (req: import("express").Request, res: Response, next: NextFunction) => void;
/**
 * Clipboard upload
 */
export declare const uploadClipboardImage: (req: import("express").Request, res: Response, next: NextFunction) => void;
/**
 * LIST MEDIA
 */
export declare const listMedia: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const getMediaById: (req: import("express").Request, res: Response, next: NextFunction) => void;
/**
 * DELETE MEDIA
 */
export declare const deleteMedia: (req: import("express").Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=uploadController.d.ts.map