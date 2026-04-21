import { Response, NextFunction } from 'express';
import Media from '../models/Media';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadFilePathToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService';
import { getImageMetadata } from '../services/imageService';
import { getVideoMetadata } from '../services/videoService';
import { getAudioDuration } from '../services/mediaProcessor';
import {
  generateImageThumbnail,
  extractVideoPosterFrame,
  generateAudioWaveform,
  processClipboardImage,
} from '../services/mediaProcessor';
import { deleteFile } from '../utils/fileUtils';
import { getFileCategory } from '../config/multer';
import { sendSuccess, sendError } from '../utils/response';
import { MediaType } from '../models/Media';

/**
 * POST /api/upload
 */
export const uploadMedia = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[] | undefined;
    const singleFile = req.file;
    const filesToProcess = files || (singleFile ? [singleFile] : []);

    if (filesToProcess.length === 0) {
      sendError(res, 'No files provided', 400);
      return;
    }

    const userId = req.user!._id;
    const uploadedMedia = [];
    const tempPaths: string[] = [];

    for (const file of filesToProcess) {
      tempPaths.push(file.path);

      try {
        const category = getFileCategory(file.mimetype) as MediaType;

        const resourceType =
          category === 'image'
            ? 'image'
            : category === 'video'
            ? 'video'
            : category === 'audio'
            ? 'video'
            : 'raw';

        // Upload to Cloudinary
        const cloudResult = await uploadFilePathToCloudinary(file.path, {
          resource_type: resourceType,
          folder: `multimodal-ai/${category}`,
        });

        let dimensions;
        let duration;
        let thumbnail;
        let posterFrame;
        let waveformData;
        let videoMeta;

        // IMAGE
        if (category === 'image') {
          try {
            const meta = await getImageMetadata(file.path);
            dimensions = { width: meta.width, height: meta.height };

            const thumb = await generateImageThumbnail(file.path);
            thumbnail = thumb.url;
          } catch {}
        }

        // VIDEO
        if (category === 'video') {
          try {
            const meta = await getVideoMetadata(file.path);

            duration = meta.duration;
            dimensions = { width: meta.width, height: meta.height };

            const poster = await extractVideoPosterFrame(file.path, meta.duration);
            posterFrame = poster.url;
            thumbnail = poster.url;

            videoMeta = {
              fps: meta.fps,
              codec: meta.codec,
              hasAudio: meta.hasAudio,
              audioCodec: meta.audioCodec,
              frameCount: meta.frameCount,
            };
          } catch {}
        }

        // AUDIO
        if (category === 'audio') {
          try {
            duration = await getAudioDuration(file.path);
            const wf = await generateAudioWaveform(file.path);
            waveformData = { peaks: wf.peaks, duration: wf.duration };
          } catch {}
        }

        const media = await Media.create({
          fileName: file.filename,
          originalName: file.originalname,
          url: cloudResult.url,
          publicId: cloudResult.publicId,
          type: category,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: userId,
          dimensions:
            dimensions ||
            (cloudResult.width
              ? { width: cloudResult.width, height: cloudResult.height }
              : undefined),
          duration: duration || cloudResult.duration,
          thumbnail,
          posterFrame,
          waveformData,
          videoMetadata: videoMeta,
        });

        uploadedMedia.push(formatMediaResponse(media));
      } catch (err) {
        console.error(`Failed to process ${file.originalname}:`, err);
      }
    }

    await Promise.allSettled(tempPaths.map((p) => deleteFile(p)));

    if (uploadedMedia.length === 0) {
      sendError(res, 'All files failed to upload', 500);
      return;
    }

    sendSuccess(res, uploadedMedia, 'Upload successful', 201);
  }
);

/**
 * Clipboard upload
 */
export const uploadClipboardImage = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { imageData, mimeType = 'image/png' } = req.body;

    if (!imageData) {
      sendError(res, 'imageData is required', 400);
      return;
    }

    const { tempPath, size } = await processClipboardImage(imageData, mimeType);

    try {
      const cloud = await uploadFilePathToCloudinary(tempPath, {
        resource_type: 'image',
        folder: 'multimodal-ai/image',
      });

      const meta = await getImageMetadata(tempPath);
      const thumb = await generateImageThumbnail(tempPath);

      const media = await Media.create({
        fileName: `clipboard-${Date.now()}.jpg`,
        originalName: 'clipboard-image.jpg',
        url: cloud.url,
        publicId: cloud.publicId,
        type: 'image',
        mimeType: 'image/jpeg',
        size,
        uploadedBy: req.user!._id,
        dimensions: { width: meta.width, height: meta.height },
        thumbnail: thumb.url,
      });

      sendSuccess(res, formatMediaResponse(media), 'Clipboard uploaded', 201);
    } finally {
      await deleteFile(tempPath);
    }
  }
);

/**
 * LIST MEDIA
 */
export const listMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const query: any = { uploadedBy: req.user!._id };

  const media = await Media.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const normalized = media.map((item: any) => ({
    ...item.toObject(),
    id: String(item._id),
    hasAnalysis: Boolean(item.analysis),
  }));

  sendSuccess(res, normalized);
});

export const getMediaById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const media = await Media.findOne({ _id: req.params.id, uploadedBy: req.user!._id });
  if (!media) {
    sendError(res, 'Not found', 404);
    return;
  }
  sendSuccess(res, {
    ...media.toObject(),
    id: String(media._id),
    hasAnalysis: Boolean(media.analysis),
  });
});

/**
 * DELETE MEDIA
 */
export const deleteMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const media = await Media.findById(req.params.id);

  if (!media) {
    sendError(res, 'Not found', 404);
    return;
  }

  await deleteFromCloudinary(media.publicId, 'image');
  await media.deleteOne();

  sendSuccess(res, {}, 'Deleted');
});

// helper
const formatMediaResponse = (media: any) => ({
  id: media._id,
  fileName: media.fileName,
  originalName: media.originalName,
  url: media.url,
  type: media.type,
  mimeType: media.mimeType,
  size: media.size,
  dimensions: media.dimensions,
  duration: media.duration,
  thumbnail: media.thumbnail,
  posterFrame: media.posterFrame,
  waveformData: media.waveformData,
  videoMetadata: media.videoMetadata,
  hasAnalysis: Boolean(media.analysis),
  analysis: media.analysis,
  createdAt: media.createdAt,
});