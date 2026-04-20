import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Media from '../models/Media';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess, sendError } from '../utils/response';
import { compareMedia } from '../services/geminiService';
import { processImageForAI } from '../services/imageService';
import { deleteFiles } from '../utils/fileUtils';

/**
 * POST /api/compare
 * Sends all images in a single Gemini context window for accurate comparison
 */
export const compareMediaItems = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    const { mediaIds, prompt } = req.body;
    const userId = req.user!._id;

    const mediaItems = await Media.find({ _id: { $in: mediaIds }, uploadedBy: userId });
    if (mediaItems.length < 2) {
      sendError(res, 'At least 2 valid media items required for comparison', 400); return;
    }

    const comparisonItems: Array<{ type: string; content: string | { base64: string; mimeType: string } }> = [];
    const tempFiles: string[] = [];

    for (const media of mediaItems) {
      if (media.type === 'image') {
        const tempPath = path.join(process.cwd(), 'src/uploads', `cmp-${uuidv4()}.jpg`);
        tempFiles.push(tempPath);
        try {
          const resp = await axios.get(media.url, { responseType: 'arraybuffer', timeout: 30000 });
          await fs.promises.writeFile(tempPath, Buffer.from(resp.data));
          const processed = await processImageForAI(tempPath);
          comparisonItems.push({ type: 'image', content: { base64: processed.base64, mimeType: processed.mimeType } });
        } catch {
          // Fallback to text summary
          if (media.analysis?.summary) {
            comparisonItems.push({ type: 'image (summary)', content: media.analysis.summary });
          }
        }
      } else if (media.analysis) {
        const text = [
          `File: ${media.originalName} | Type: ${media.type}`,
          media.analysis.summary ? `Summary: ${media.analysis.summary}` : '',
          media.analysis.transcription ? `Transcription: ${media.analysis.transcription.substring(0, 1000)}` : '',
          media.analysis.description ? `Description: ${media.analysis.description.substring(0, 500)}` : '',
        ].filter(Boolean).join('\n');
        comparisonItems.push({ type: media.type, content: text });
      } else {
        comparisonItems.push({ type: media.type, content: `[${media.type}: ${media.originalName}] — no analysis yet` });
      }
    }

    try {
      const result = await compareMedia(comparisonItems, prompt);
      await deleteFiles(tempFiles);
      sendSuccess(res, {
        itemsCompared: mediaItems.length,
        mediaIds: mediaItems.map((m) => ({ id: m._id, name: m.originalName, type: m.type })),
        comparison: result,
      });
    } catch (err) {
      await deleteFiles(tempFiles);
      throw err;
    }
  }
);

/**
 * POST /api/batch
 * Run the same analysis query on up to 10 images, return grid results
 */
export const batchAnalyze = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    const { mediaIds, prompt = 'Describe this image in detail.' } = req.body;
    const userId = req.user!._id;

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      sendError(res, 'mediaIds array is required', 400); return;
    }
    if (mediaIds.length > 10) {
      sendError(res, 'Maximum 10 items per batch', 400); return;
    }

    const mediaItems = await Media.find({ _id: { $in: mediaIds }, uploadedBy: userId });
    if (mediaItems.length === 0) { sendError(res, 'No media found', 404); return; }

    const { analyzeImage } = await import('../services/geminiService');

    const CONCURRENCY = 3;
    const results: Array<{ mediaId: unknown; originalName: string; type: string; url: string; thumbnail?: string; analysis?: unknown; error?: string }> = [];
    const tempFiles: string[] = [];

    for (let i = 0; i < mediaItems.length; i += CONCURRENCY) {
      const batch = mediaItems.slice(i, i + CONCURRENCY);

      const batchResults = await Promise.allSettled(
        batch.map(async (media) => {
          if (media.type !== 'image') {
            return {
              mediaId: media._id,
              originalName: media.originalName,
              type: media.type,
              url: media.url,
              thumbnail: media.thumbnail,
              analysis: media.analysis || null,
              note: 'Use /api/analyze/ endpoints for non-image types',
            };
          }

          const tempPath = path.join(process.cwd(), 'src/uploads', `batch-${uuidv4()}.jpg`);
          tempFiles.push(tempPath);

          const resp = await axios.get(media.url, { responseType: 'arraybuffer', timeout: 30000 });
          await fs.promises.writeFile(tempPath, Buffer.from(resp.data));
          const analysis = await analyzeImage(tempPath, prompt);

          media.analysis = { ...analysis, analyzedAt: new Date() };
          await media.save();

          return {
            mediaId: media._id,
            originalName: media.originalName,
            type: media.type,
            url: media.url,
            thumbnail: media.thumbnail,
            analysis,
          };
        })
      );

      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          results.push(r.value);
        } else {
          results.push({ mediaId: null, originalName: 'unknown', type: 'unknown', url: '', error: r.reason?.message });
        }
      }
    }

    await deleteFiles(tempFiles);

    sendSuccess(res, {
      processed: results.length,
      prompt,
      results,
    });
  }
);