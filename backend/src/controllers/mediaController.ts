import { Response, NextFunction } from 'express';
import Media from '../models/Media';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess, sendError } from '../utils/response';
import { cleanupOldTempFiles } from '../utils/scheduler';

/**
 * GET /api/media/gallery
 * Session gallery: media uploaded in last 24h, grouped by type
 */
export const getSessionGallery = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const media = await Media.find({
      uploadedBy: req.user!._id,
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .select('originalName url type mimeType size thumbnail posterFrame waveformData duration dimensions analysis createdAt')
      .lean();

    // Group by type
    const normalized = media.map((m: any) => ({
      ...m,
      id: String(m._id),
      hasAnalysis: Boolean(m.analysis),
    }));

    const grouped = {
      images: normalized.filter((m) => m.type === 'image'),
      videos: normalized.filter((m) => m.type === 'video'),
      audio:  normalized.filter((m) => m.type === 'audio'),
      documents: normalized.filter((m) => m.type === 'document'),
      total: media.length,
    };

    sendSuccess(res, grouped);
  }
);

/**
 * GET /api/media/:id/waveform
 * Return waveform peaks for an audio file
 */
export const getWaveformData = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    const media = await Media.findOne({ _id: req.params.id, uploadedBy: req.user!._id })
      .select('type waveformData duration');

    if (!media) { sendError(res, 'Media not found', 404); return; }
    if (media.type !== 'audio') { sendError(res, 'Media is not audio', 400); return; }

    if (!media.waveformData) {
      sendError(res, 'Waveform data not yet generated. Re-upload to generate.', 404);
      return;
    }

    sendSuccess(res, {
      peaks: media.waveformData.peaks,
      duration: media.waveformData.duration || media.duration,
    });
  }
);

/**
 * POST /api/media/cleanup
 * Manually trigger cleanup of temp files (admin/debug use)
 */
export const triggerCleanup = asyncHandler(
  async (_req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await cleanupOldTempFiles();
    sendSuccess(res, result, `Cleanup completed: ${result.deleted} files deleted`);
  }
);