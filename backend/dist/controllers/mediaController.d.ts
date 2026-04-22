import { Response, NextFunction } from 'express';
/**
 * GET /api/media/gallery
 * Session gallery: media uploaded in last 24h, grouped by type
 */
export declare const getSessionGallery: (req: import("express").Request, res: Response, next: NextFunction) => void;
/**
 * GET /api/media/:id/waveform
 * Return waveform peaks for an audio file
 */
export declare const getWaveformData: (req: import("express").Request, res: Response, next: NextFunction) => void;
/**
 * POST /api/media/cleanup
 * Manually trigger cleanup of temp files (admin/debug use)
 */
export declare const triggerCleanup: (req: import("express").Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=mediaController.d.ts.map