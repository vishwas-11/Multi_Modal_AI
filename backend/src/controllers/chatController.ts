import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Conversation from '../models/Conversation';
import Media from '../models/Media';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess, sendError } from '../utils/response';
import {
  chatWithContext,
  streamChatWithContext,
  summarizeConversationContext,
  GeminiMessage,
  analyzeVideoFrames,
} from '../services/geminiService';
import { processImageForAI } from '../services/imageService';
import { deleteFile } from '../utils/fileUtils';
import { analyzeAudioFromUrl } from '../services/audioService';
import { processVideoForAnalysis, cleanupVideoTemp } from '../services/videoService';
import {
  downloadDocumentToTempWithFallback,
  extractTextFromDocument,
} from '../services/documentService';
import {
  trimConversationContext,
  needsSummarization,
  buildSummaryPrompt,
} from '../utils/tokenCounter';
import {
  exportConversationAsMarkdown,
  exportConversationAsHTML,
  buildExportFilename,
} from '../services/exportService';
import mongoose from 'mongoose';

const SYSTEM_PROMPT = `You are a powerful multimodal AI assistant. You can analyze images, videos, audio, documents, and answer questions about them.

Capabilities:
- Visual Q&A: Describe, analyze, and answer questions about images
- Video analysis: Understand video content, identify key moments, describe scenes
- Audio: Work with transcriptions, identify speakers, extract action items
- Documents: Extract text, tables, structured data from scanned documents
- Comparison: Compare multiple media files simultaneously

Guidelines:
- Be accurate and specific when referencing media content
- Use timestamps when discussing video/audio content
- Reference page numbers when discussing documents
- If you're unsure about something in an image, say so clearly
- Format responses with markdown for better readability
- Use ONLY the provided media context for factual claims
- If information is not present in the provided context, clearly say "I can't find that in the provided media." and ask for a clearer page/section`;

const MAX_HISTORY = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getProviderErrorMessage = (err: unknown): string => {
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  ) {
    const rawMessage = (err as { message: string }).message;
    if (rawMessage.includes('[503') || rawMessage.toLowerCase().includes('service unavailable')) {
      return 'AI service is temporarily busy. Please retry in a few seconds.';
    }
    return rawMessage;
  }

  return 'AI service request failed. Please try again.';
};

const prepareMediaForGemini = async (
  mediaIds: string[],
  userId: mongoose.Types.ObjectId
): Promise<{ imageParts: Array<{ base64: string; mimeType: string }>; textContext: string }> => {
  const imageParts: Array<{ base64: string; mimeType: string }> = [];
  const textParts: string[] = [];
  const tempFiles: string[] = [];

  for (const mediaId of mediaIds) {
    const media = await Media.findOne({ _id: mediaId, uploadedBy: userId });
    if (!media) continue;

    if (media.type === 'image') {
      const tempPath = path.join(process.cwd(), 'src/uploads', `chat-${uuidv4()}.jpg`);
      tempFiles.push(tempPath);
      try {
        const resp = await axios.get(media.url, { responseType: 'arraybuffer', timeout: 30000 });
        await fs.promises.writeFile(tempPath, Buffer.from(resp.data));
        const processed = await processImageForAI(tempPath);
        imageParts.push({ base64: processed.base64, mimeType: processed.mimeType });
      } catch {}
    } else {
      if (!media.analysis) {
        try {
          if (media.type === 'audio') {
            const audioAnalysis = await analyzeAudioFromUrl(media.url);
            media.analysis = {
              summary: audioAnalysis.summary,
              transcription: audioAnalysis.transcription.text,
              sentiment: audioAnalysis.sentiment,
              actionItems: audioAnalysis.actionItems,
              keyTopics: audioAnalysis.keyTopics,
              speakerCount: audioAnalysis.speakerCount,
              speakers: audioAnalysis.speakers,
              decisions: audioAnalysis.decisions,
              language: audioAnalysis.language,
              analyzedAt: new Date(),
            };
            await media.save();
          } else if (media.type === 'video') {
            const { frames, metadata, tempDir, tempVideoPath, audioPath } =
              await processVideoForAnalysis(media.url);
            try {
              const videoAnalysis = await analyzeVideoFrames(frames, metadata.duration);
              media.analysis = { ...videoAnalysis, analyzedAt: new Date() };
              await media.save();
            } finally {
              await cleanupVideoTemp(tempVideoPath, tempDir, audioPath);
            }
          } else if (media.type === 'document') {
            const tempPath = await downloadDocumentToTempWithFallback(
              media.url,
              media.mimeType,
              media.publicId
            );
            try {
              const extractedText = await extractTextFromDocument(tempPath, media.mimeType);
              media.analysis = {
                ...(media.analysis || { analyzedAt: new Date() }),
                extractedText,
                summary: extractedText.substring(0, 500),
                analyzedAt: new Date(),
              };
              await media.save();
            } finally {
              await deleteFile(tempPath);
            }
          }
        } catch (err) {
          console.warn(`Failed to auto-analyze media ${media._id}:`, err);
        }
      }

      if (!media.analysis) {
        continue;
      }

      const lines = [`[${media.type.toUpperCase()}: ${media.originalName}]`];
      if (media.analysis.summary) lines.push(`Summary: ${media.analysis.summary}`);
      if (media.analysis.transcription) lines.push(`Transcription: ${media.analysis.transcription.substring(0, 4000)}`);
      if (media.analysis.extractedText) lines.push(`Text: ${media.analysis.extractedText.substring(0, 12000)}`);
      if (media.analysis.actionItems?.length) lines.push(`Action items: ${media.analysis.actionItems.join(', ')}`);
      textParts.push(lines.join('\n'));
    }
  }

  await Promise.allSettled(tempFiles.map((f) => deleteFile(f)));
  return { imageParts, textContext: textParts.join('\n\n') };
};

const filterOwnedMediaObjectIds = async (
  mediaIds: string[],
  userId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> => {
  const validIds = mediaIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return [];

  const owned = await Media.find({ _id: { $in: validIds }, uploadedBy: userId }).select('_id');
  return owned.map((m) => m._id);
};

const buildGeminiHistory = async (
  conversationId: mongoose.Types.ObjectId | string,
  userId: mongoose.Types.ObjectId,
  contextSummary?: string
): Promise<GeminiMessage[]> => {
  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) return [];

  const { messages: trimmedMessages } = trimConversationContext(
    conversation.messages,
    contextSummary,
    50000
  );

  return trimmedMessages.map((msg) => ({
    role: (msg.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
    content: msg.content,
  }));
};

// ─── POST /api/chat ───────────────────────────────────────────────────────────

export const chat = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { message, conversationId, mediaIds = [] } = req.body;
    const userId = req.user!._id;

    let conversation = conversationId
      ? await Conversation.findOne({ _id: conversationId, userId })
      : null;

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        title: message.substring(0, 80),
        messages: [],
        mediaContext: mediaIds,
      });
    }

    if (needsSummarization(conversation.messages) && !conversation.contextSummary) {
      try {
        const summaryPrompt = buildSummaryPrompt(conversation.messages);
        const summary = await summarizeConversationContext(summaryPrompt);
        conversation.contextSummary = summary;
        conversation.contextSummarizedAt = new Date();
      } catch {}
    }

    const history = await buildGeminiHistory(conversation._id, userId, conversation.contextSummary);
    const { imageParts, textContext } = await prepareMediaForGemini(mediaIds, userId);

    const fullMessage = textContext
      ? `[Media context]\n${textContext}\n\n[User message]\n${message}`
      : message;

    const userMsg: GeminiMessage = {
      role: 'user',
      content: fullMessage,
      imageParts: imageParts.length > 0 ? imageParts : undefined,
    };

    const response = await chatWithContext([...history, userMsg], SYSTEM_PROMPT);

    const ownedMediaIds = await filterOwnedMediaObjectIds(mediaIds, userId);
    conversation.messages.push({
      role: 'user',
      content: message,
      mediaIds: ownedMediaIds,
      timestamp: new Date(),
    });
    conversation.messages.push({ role: 'assistant', content: response, timestamp: new Date() });

    if (conversation.messages.length <= 2) conversation.title = message.substring(0, 80);
    await conversation.save();

    sendSuccess(res, { conversationId: conversation._id, message: response, role: 'assistant' });
  }
);

export const streamChat = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { message, conversationId } = req.query;
      if (!message || typeof message !== 'string') {
        sendError(res, 'message query param is required', 400);
        return;
      }

      const userId = req.user!._id;
      const mediaIdsRaw = typeof req.query.mediaIds === 'string' ? req.query.mediaIds : '';
      const mediaIds = mediaIdsRaw
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id && id !== 'undefined' && mongoose.Types.ObjectId.isValid(id));
      const ownedMediaIds = await filterOwnedMediaObjectIds(mediaIds, userId);

      let conversation =
        typeof conversationId === 'string'
          ? await Conversation.findOne({ _id: conversationId, userId })
          : null;

      if (!conversation) {
        conversation = await Conversation.create({
          userId,
          title: message.substring(0, 80),
          messages: [],
          mediaContext: ownedMediaIds,
        });
      }

      if (needsSummarization(conversation.messages) && !conversation.contextSummary) {
        try {
          const summaryPrompt = buildSummaryPrompt(conversation.messages);
          const summary = await summarizeConversationContext(summaryPrompt);
          conversation.contextSummary = summary;
          conversation.contextSummarizedAt = new Date();
        } catch {}
      }

      const history = await buildGeminiHistory(conversation._id, userId, conversation.contextSummary);
      const { imageParts, textContext } = await prepareMediaForGemini(mediaIds, userId);
      const fullMessage = textContext
        ? `[Media context]\n${textContext}\n\n[User message]\n${message}`
        : message;

      const userMsg: GeminiMessage = {
        role: 'user',
        content: fullMessage,
        imageParts: imageParts.length > 0 ? imageParts : undefined,
      };

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      res.write(`event: conversation\ndata: ${JSON.stringify({ conversationId: conversation._id })}\n\n`);

      const stream = await streamChatWithContext([...history, userMsg], SYSTEM_PROMPT);
      let combined = '';

      for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (!text) continue;
        combined += text;
        res.write(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`);
      }

      conversation.messages.push({
        role: 'user',
        content: message,
        mediaIds: ownedMediaIds,
        timestamp: new Date(),
      });
      conversation.messages.push({
        role: 'assistant',
        content: combined,
        timestamp: new Date(),
      });

      if (conversation.messages.length <= 2) {
        conversation.title = message.substring(0, 80);
      }

      await conversation.save();
      res.write('event: done\ndata: {}\n\n');
      res.end();
    } catch (err) {
      const message = getProviderErrorMessage(err);

      if (res.headersSent) {
        res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
        res.end();
        return;
      }

      sendError(res, message, 503);
    }
  }
);

export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversations = await Conversation.find({ userId: req.user!._id })
    .sort({ updatedAt: -1 })
    .limit(MAX_HISTORY)
    .select('title updatedAt createdAt messages');

  sendSuccess(res, conversations);
});

export const getConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!conversation) {
    sendError(res, 'Conversation not found', 404);
    return;
  }

  sendSuccess(res, conversation);
});

export const deleteConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversation = await Conversation.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!conversation) {
    sendError(res, 'Conversation not found', 404);
    return;
  }

  sendSuccess(res, {}, 'Conversation deleted');
});

export const regenerateLastResponse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!conversation) {
    sendError(res, 'Conversation not found', 404);
    return;
  }

  const lastUserIndex = [...conversation.messages]
    .map((m, index) => ({ role: m.role, index }))
    .reverse()
    .find((m) => m.role === 'user')?.index;

  if (lastUserIndex === undefined) {
    sendError(res, 'No user message to regenerate', 400);
    return;
  }

  const historyForRegeneration = conversation.messages
    .slice(0, lastUserIndex + 1)
    .map((msg) => ({
      role: (msg.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      content: msg.content,
    }));

  const reply = await chatWithContext(historyForRegeneration, SYSTEM_PROMPT);
  const replacement = { role: 'assistant' as const, content: reply, timestamp: new Date() };
  const assistantIndex = lastUserIndex + 1;

  if (conversation.messages[assistantIndex]?.role === 'assistant') {
    conversation.messages[assistantIndex] = replacement;
  } else {
    conversation.messages.splice(assistantIndex, 0, replacement);
  }

  // Keep only one assistant reply for the regenerated user turn.
  while (conversation.messages[assistantIndex + 1]?.role === 'assistant') {
    conversation.messages.splice(assistantIndex + 1, 1);
  }

  await conversation.save();

  sendSuccess(res, { message: reply });
});

export const clearConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!conversation) {
    sendError(res, 'Conversation not found', 404);
    return;
  }

  conversation.messages = [];
  conversation.contextSummary = undefined;
  conversation.contextSummarizedAt = undefined;
  await conversation.save();

  sendSuccess(res, {}, 'Conversation cleared');
});

export const exportConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const format = String(req.query.format || 'md') as 'md' | 'html';
  if (!['md', 'html'].includes(format)) {
    sendError(res, 'format must be md or html', 400);
    return;
  }

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    userId: req.user!._id,
  });
  if (!conversation) {
    sendError(res, 'Conversation not found', 404);
    return;
  }

  const ids = conversation.messages.flatMap((m) => m.mediaIds || []);
  const media = await Media.find({ _id: { $in: ids }, uploadedBy: req.user!._id });
  const mediaMap = new Map(media.map((m) => [m._id.toString(), m]));

  const content =
    format === 'html'
      ? exportConversationAsHTML(conversation, mediaMap)
      : exportConversationAsMarkdown(conversation, mediaMap);

  const filename = buildExportFilename(conversation, format);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', format === 'html' ? 'text/html' : 'text/markdown');
  res.status(200).send(content);
});