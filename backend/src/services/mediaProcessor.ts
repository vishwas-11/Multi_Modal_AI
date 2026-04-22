import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadFilePathToCloudinary } from './cloudinaryService';
import { deleteFile } from '../utils/fileUtils';
import type { FfprobeData } from 'fluent-ffmpeg';

export interface ThumbnailResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export interface WaveformData {
  peaks: number[];         // Normalized 0-1 amplitude values
  duration: number;        // Total duration in seconds
  sampleRate: number;      // Samples per second in the peaks array
}

export interface PosterFrameResult {
  url: string;
  publicId: string;
  timestamp: number;
}

/**
 * Generate thumbnail from image and upload to Cloudinary
 */
export const generateImageThumbnail = async (
  imagePath: string,
  size = 300
): Promise<ThumbnailResult> => {
  const thumbPath = path.join(
    process.cwd(),
    'src/uploads',
    `thumb-${uuidv4()}.jpg`
  );

  try {
    await sharp(imagePath)
      .resize(size, size, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 75, progressive: true })
      .toFile(thumbPath);

    const result = await uploadFilePathToCloudinary(thumbPath, {
      folder: 'multimodal-ai/thumbnails',
      resource_type: 'image',
    });

    return {
      url: result.url,
      publicId: result.publicId,
      width: size,
      height: size,
    };
  } finally {
    await deleteFile(thumbPath);
  }
};

/**
 * Extract poster frame from video (at 10% duration for a representative frame)
 */
export const extractVideoPosterFrame = async (
  videoPath: string,
  durationSeconds: number
): Promise<PosterFrameResult> => {
  const seekTime = Math.max(1, durationSeconds * 0.1);
  const posterPath = path.join(
    process.cwd(),
    'src/uploads',
    `poster-${uuidv4()}.jpg`
  );

  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(seekTime)
      .frames(1)
      .output(posterPath)
      .outputOptions(['-vf', 'scale=640:-1', '-q:v', '3'])
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(new Error(`Poster frame failed: ${err.message}`)))
      .run();
  });

  try {
    const result = await uploadFilePathToCloudinary(posterPath, {
      folder: 'multimodal-ai/posters',
      resource_type: 'image',
    });

    return {
      url: result.url,
      publicId: result.publicId,
      timestamp: seekTime,
    };
  } finally {
    await deleteFile(posterPath);
  }
};

/**
 * Generate waveform data from audio file using FFmpeg
 * Returns normalized peak amplitude values for waveform visualization
 */
export const generateAudioWaveform = async (
  audioPath: string,
  numSamples = 200
): Promise<WaveformData> => {
  const rawPath = path.join(
    process.cwd(),
    'src/uploads',
    `waveform-${uuidv4()}.raw`
  );

  try {
    // Extract raw PCM samples at very low sample rate for waveform
    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioPath)
        .audioChannels(1)         // Mono
        .audioFrequency(8000)     // Low sample rate sufficient for waveform
        .audioCodec('pcm_s16le')  // 16-bit signed PCM
        .format('s16le')
        .output(rawPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(new Error(`Waveform extraction failed: ${err.message}`)))
        .run();
    });

    // Read PCM bytes
    const rawBuffer = await fs.promises.readFile(rawPath);
    const samples = new Int16Array(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength / 2);

    // Downsample to numSamples peaks
    const blockSize = Math.floor(samples.length / numSamples);
    const peaks: number[] = [];
    let maxAmplitude = 0;

    for (let i = 0; i < numSamples; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, samples.length);
      let blockMax = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(samples[j]);
        if (abs > blockMax) blockMax = abs;
      }
      peaks.push(blockMax);
      if (blockMax > maxAmplitude) maxAmplitude = blockMax;
    }

    // Normalize 0-1
    const normalized = maxAmplitude > 0
      ? peaks.map((p) => Math.round((p / maxAmplitude) * 100) / 100)
      : peaks.map(() => 0);

    // Get duration from ffprobe
    const duration = await getAudioDuration(audioPath);

    return {
      peaks: normalized,
      duration,
      sampleRate: numSamples,
    };
  } finally {
    await deleteFile(rawPath);
  }
};

/**
 * Get audio duration in seconds
 */
export const getAudioDuration = (audioPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err: unknown, metadata: FfprobeData) => {
      if (err) {
        resolve(0); // Non-fatal
        return;
      }
      resolve(Number(metadata.format.duration) || 0);
    });
  });
};

/**
 * Process clipboard-pasted image data (base64 or buffer)
 * Validates and saves to temp, returns file-like object
 */
export const processClipboardImage = async (
  base64Data: string,
  mimeType = 'image/png'
): Promise<{ tempPath: string; size: number; mimeType: string }> => {
  // Strip data URL prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');

  if (buffer.length === 0) {
    throw new Error('Empty image data from clipboard');
  }

  if (buffer.length > 20 * 1024 * 1024) {
    throw new Error('Clipboard image exceeds 20MB limit');
  }

  // Process with sharp to validate and normalize
  const processed = await sharp(buffer)
    .jpeg({ quality: 90 })
    .toBuffer();

  const tempPath = path.join(
    process.cwd(),
    'src/uploads',
    `clipboard-${uuidv4()}.jpg`
  );

  await fs.promises.writeFile(tempPath, processed);

  return {
    tempPath,
    size: processed.length,
    mimeType: 'image/jpeg',
  };
};

/**
 * Generate thumbnail for document page image
 */
export const generateDocumentThumbnail = async (imagePath: string): Promise<ThumbnailResult> => {
  return generateImageThumbnail(imagePath, 400); // Slightly larger for document readability
};