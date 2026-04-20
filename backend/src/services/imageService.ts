import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface ProcessedImage {
  buffer: Buffer;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
}

const MAX_DIMENSION = 1024; // Max width/height sent to Gemini
const JPEG_QUALITY = 85;

/**
 * Resize and compress image for LLM processing
 * Never sends large images to Gemini — always resizes first
 */
export const processImageForAI = async (
  inputPath: string
): Promise<ProcessedImage> => {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  const width = metadata.width || MAX_DIMENSION;
  const height = metadata.height || MAX_DIMENSION;

  // Only resize if larger than MAX_DIMENSION
  const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;

  let pipeline = image;
  if (needsResize) {
    pipeline = image.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const buffer = await pipeline
    .jpeg({ quality: JPEG_QUALITY, progressive: true })
    .toBuffer();

  const processedMeta = await sharp(buffer).metadata();

  return {
    buffer,
    base64: buffer.toString('base64'),
    mimeType: 'image/jpeg',
    width: processedMeta.width || width,
    height: processedMeta.height || height,
    size: buffer.length,
  };
};

/**
 * Process image from buffer
 */
export const processImageBufferForAI = async (
  inputBuffer: Buffer
): Promise<ProcessedImage> => {
  const metadata = await sharp(inputBuffer).metadata();

  const width = metadata.width || MAX_DIMENSION;
  const height = metadata.height || MAX_DIMENSION;

  const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;

  let pipeline = sharp(inputBuffer);
  if (needsResize) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const buffer = await pipeline
    .jpeg({ quality: JPEG_QUALITY, progressive: true })
    .toBuffer();

  const processedMeta = await sharp(buffer).metadata();

  return {
    buffer,
    base64: buffer.toString('base64'),
    mimeType: 'image/jpeg',
    width: processedMeta.width || MAX_DIMENSION,
    height: processedMeta.height || MAX_DIMENSION,
    size: buffer.length,
  };
};

/**
 * Generate thumbnail from image
 */
export const generateThumbnail = async (
  inputPath: string,
  outputPath: string,
  size = 300
): Promise<string> => {
  await sharp(inputPath)
    .resize(size, size, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toFile(outputPath);
  return outputPath;
};

/**
 * Generate thumbnail from buffer
 */
export const generateThumbnailBuffer = async (
  inputPath: string,
  size = 300
): Promise<Buffer> => {
  return sharp(inputPath)
    .resize(size, size, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toBuffer();
};

/**
 * Get image metadata
 */
export const getImageMetadata = async (inputPath: string): Promise<ImageMetadata> => {
  const meta = await sharp(inputPath).metadata();
  const stats = fs.statSync(inputPath);

  return {
    width: meta.width || 0,
    height: meta.height || 0,
    format: meta.format || 'unknown',
    size: stats.size,
    hasAlpha: meta.hasAlpha || false,
  };
};

/**
 * Convert image file to base64 for Gemini (with resize)
 */
export const imageFileToBase64 = async (
  filePath: string
): Promise<{ base64: string; mimeType: string }> => {
  const processed = await processImageForAI(filePath);
  return {
    base64: processed.base64,
    mimeType: processed.mimeType,
  };
};

/**
 * Save buffer to temp file
 */
export const saveBufferToTemp = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  const tempPath = path.join(process.cwd(), 'src/uploads', filename);
  await fs.promises.writeFile(tempPath, buffer);
  return tempPath;
};