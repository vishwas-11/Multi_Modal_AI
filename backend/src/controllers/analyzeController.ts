import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Media from '../models/Media';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess, sendError } from '../utils/response';

import {
  analyzeImage,
  extractStructuredData,
  performOCR,
  analyzeChart,
  analyzeVideoFrames,
  analyzeDocumentPages,
  analyzeDocument,
  analyzeTranscription,
  answerTemporalVideoQuestion,
} from '../services/geminiService';

import {
  processVideoForAnalysis,
  cleanupVideoTemp,
} from '../services/videoService';

import { analyzeAudioFromUrl } from '../services/audioService';

import {
  downloadDocumentToTemp,
  downloadDocumentToTempWithFallback,
  extractTextFromDocument,
  processImageDocument,
  processDocumentImagePage,
} from '../services/documentService';

import { deleteFile } from '../utils/fileUtils';

// ─────────────────────────────────────────
// IMAGE ANALYSIS
// ─────────────────────────────────────────

export const analyzeImageMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mediaId, prompt } = req.body;

  const media = await Media.findOne({ _id: mediaId, uploadedBy: req.user!._id });
  if (!media) return sendError(res, 'Media not found', 404);

  const tempPath = path.join(process.cwd(), 'src/uploads', `img-${uuidv4()}.jpg`);

  try {
    const response = await axios.get(media.url, { responseType: 'arraybuffer' });
    await fs.promises.writeFile(tempPath, Buffer.from(response.data));

    const analysis = await analyzeImage(tempPath, prompt);

    media.analysis = { ...analysis, analyzedAt: new Date() };
    await media.save();

    sendSuccess(res, analysis);
  } finally {
    await deleteFile(tempPath);
  }
});

// ─────────────────────────────────────────
// OCR
// ─────────────────────────────────────────

export const ocrImageMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mediaId } = req.body;

  const media = await Media.findOne({ _id: mediaId, uploadedBy: req.user!._id });
  if (!media) return sendError(res, 'Media not found', 404);

  const tempPath = path.join(process.cwd(), 'src/uploads', `ocr-${uuidv4()}.jpg`);

  try {
    const response = await axios.get(media.url, { responseType: 'arraybuffer' });
    await fs.promises.writeFile(tempPath, Buffer.from(response.data));

    const result = await performOCR(tempPath);

    media.analysis = {
      ...(media.analysis || { analyzedAt: new Date() }),
      extractedText: result.extractedText,
      analyzedAt: new Date(),
    };

    await media.save();

    sendSuccess(res, result);
  } finally {
    await deleteFile(tempPath);
  }
});

// ─────────────────────────────────────────
// VIDEO ANALYSIS
// ─────────────────────────────────────────

export const analyzeVideoMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mediaId } = req.body;

  const media = await Media.findOne({ _id: mediaId, uploadedBy: req.user!._id });
  if (!media) return sendError(res, 'Media not found', 404);

  const { frames, metadata, tempDir, tempVideoPath, audioPath } =
    await processVideoForAnalysis(media.url);

  try {
    const analysis = await analyzeVideoFrames(frames, metadata.duration);

    media.analysis = { ...analysis, analyzedAt: new Date() };
    await media.save();

    sendSuccess(res, analysis);
  } finally {
    await cleanupVideoTemp(tempVideoPath, tempDir, audioPath);
  }
});

// ─────────────────────────────────────────
// AUDIO ANALYSIS
// ─────────────────────────────────────────

export const analyzeAudioMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mediaId } = req.body;

  const media = await Media.findOne({ _id: mediaId, uploadedBy: req.user!._id });
  if (!media) return sendError(res, 'Media not found', 404);

  const audioAnalysis = await analyzeAudioFromUrl(media.url);

  media.analysis = {
    summary: audioAnalysis.summary,
    transcription: audioAnalysis.transcription.text,
    sentiment: audioAnalysis.sentiment,
    analyzedAt: new Date(),
  };

  await media.save();

  sendSuccess(res, media.analysis);
});

// ─────────────────────────────────────────
// DOCUMENT ANALYSIS
// ─────────────────────────────────────────

export const analyzeDocumentMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mediaId } = req.body;

  const media = await Media.findOne({ _id: mediaId, uploadedBy: req.user!._id });
  if (!media) return sendError(res, 'Media not found', 404);

  const tempPath = await downloadDocumentToTempWithFallback(
    media.url,
    media.mimeType,
    media.publicId
  );

  try {
    let analysis;

    if (media.mimeType.startsWith('image/')) {
      const pages = await processImageDocument(tempPath);
      analysis = await analyzeDocumentPages(pages, 'Analyze document');
    } else {
      const text = await extractTextFromDocument(tempPath, media.mimeType);
      analysis = await analyzeDocument(text);
    }

    media.analysis = { ...analysis, analyzedAt: new Date() };
    await media.save();

    sendSuccess(res, analysis);
  } finally {
    await deleteFile(tempPath);
  }
});

export const structuredExtractMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mediaId, extractionType = 'general' } = req.body;

  const media = await Media.findOne({ _id: mediaId, uploadedBy: req.user!._id });
  if (!media) return sendError(res, 'Media not found', 404);

  const tempPath = await downloadDocumentToTempWithFallback(
    media.url,
    media.mimeType,
    media.publicId
  );

  try {
    const page = await processDocumentImagePage(tempPath);
    const result = await extractStructuredData([page], extractionType);
    media.analysis = { ...result, analyzedAt: new Date() };
    await media.save();
    sendSuccess(res, result);
  } finally {
    await deleteFile(tempPath);
  }
});

export const analyzeChartMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mediaId } = req.body;

  const media = await Media.findOne({ _id: mediaId, uploadedBy: req.user!._id });
  if (!media) return sendError(res, 'Media not found', 404);

  const tempPath = path.join(process.cwd(), 'src/uploads', `chart-${uuidv4()}.jpg`);

  try {
    const response = await axios.get(media.url, { responseType: 'arraybuffer' });
    await fs.promises.writeFile(tempPath, Buffer.from(response.data));
    const result = await analyzeChart(tempPath);
    media.analysis = { ...result, analyzedAt: new Date() };
    await media.save();
    sendSuccess(res, result);
  } finally {
    await deleteFile(tempPath);
  }
});

export const temporalVideoQA = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mediaId, prompt } = req.body;

  const media = await Media.findOne({ _id: mediaId, uploadedBy: req.user!._id });
  if (!media) return sendError(res, 'Media not found', 404);

  const { frames, tempDir, tempVideoPath, audioPath } = await processVideoForAnalysis(media.url);
  try {
    const result = await answerTemporalVideoQuestion(frames, prompt || 'Describe key events over time');
    sendSuccess(res, result);
  } finally {
    await cleanupVideoTemp(tempVideoPath, tempDir, audioPath);
  }
});

export const analyzeMultiPageDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mediaId, prompt = 'Analyze this document' } = req.body;

  const media = await Media.findOne({ _id: mediaId, uploadedBy: req.user!._id });
  if (!media) return sendError(res, 'Media not found', 404);

  const tempPath = await downloadDocumentToTempWithFallback(
    media.url,
    media.mimeType,
    media.publicId
  );
  try {
    const pages = await processImageDocument(tempPath);
    const result = await analyzeDocumentPages(pages, prompt);
    media.analysis = { ...result, analyzedAt: new Date() };
    await media.save();
    sendSuccess(res, result);
  } finally {
    await deleteFile(tempPath);
  }
});