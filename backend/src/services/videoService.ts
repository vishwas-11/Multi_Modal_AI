import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { processImageForAI, ProcessedImage } from './imageService';
import { deleteFiles, deleteFile } from '../utils/fileUtils';

export interface VideoFrame {
  timestamp: number;
  filePath: string;
  processed?: ProcessedImage;
  sceneChange?: boolean;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
  format: string;
  size: number;
  hasAudio: boolean;
  audioCodec?: string;
  frameCount: number;
}

export type FrameStrategy = 'fixed_interval' | 'scene_change' | 'uniform';

const MAX_FRAMES = 20;

/**
 * Get video metadata using ffprobe
 */
export const getVideoMetadata = (videoPath: string): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(new Error(`FFprobe failed: ${err.message}`));

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
      const format = metadata.format;

      if (!videoStream) return reject(new Error('No video stream found'));

      const fpsRaw = videoStream.r_frame_rate || '25/1';
      const [num, den] = fpsRaw.split('/').map(Number);
      const fps = den ? num / den : 25;

      const duration = Number(format.duration) || 0;

      resolve({
        duration,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps,
        bitrate: Number(format.bit_rate) || 0,
        codec: videoStream.codec_name || 'unknown',
        format: format.format_name || 'unknown',
        size: Number(format.size) || 0,
        hasAudio: !!audioStream,
        audioCodec: audioStream?.codec_name,
        frameCount: Math.floor(duration * fps),
      });
    });
  });
};

// ─────────────────────────────────────────
// Frame Strategies
// ─────────────────────────────────────────

const getFixedIntervalTimestamps = (duration: number, interval = 3): number[] => {
  const timestamps: number[] = [];

  for (let t = 0; t < duration; t += interval) {
    timestamps.push(Math.round(t * 10) / 10);
    if (timestamps.length >= MAX_FRAMES) break;
  }

  if (duration > 1 && timestamps[timestamps.length - 1] < duration - 1) {
    timestamps.push(Math.round((duration - 0.5) * 10) / 10);
  }

  return timestamps;
};

const getUniformTimestamps = (duration: number): number[] => {
  const interval = duration / (MAX_FRAMES + 1);
  return Array.from({ length: MAX_FRAMES }, (_, i) =>
    Math.round(interval * (i + 1) * 10) / 10
  );
};

const getSceneChangeTimestamps = async (
  videoPath: string,
  threshold = 0.3
): Promise<number[]> => {
  return new Promise((resolve) => {
    const timestamps: number[] = [];

    ffmpeg(videoPath)
      .outputOptions([
        '-vf', `select='gt(scene,${threshold})',showinfo`,
        '-vsync', 'vfr',
        '-f', 'null',
      ])
      .output('/dev/null')
      .on('stderr', (line: string) => {
        const match = line.match(/pts_time:([\d.]+)/);
        if (match) {
          timestamps.push(parseFloat(match[1]));
        }
      })
      .on('end', () => {
        resolve([0, ...timestamps].slice(0, MAX_FRAMES));
      })
      .on('error', () => resolve([]))
      .run();
  });
};

// ─────────────────────────────────────────
// Frame Extraction
// ─────────────────────────────────────────

const extractFrameAtTimestamp = (
  videoPath: string,
  timestamp: number,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timestamp)
      .frames(1)
      .output(outputPath)
      .outputOptions(['-vf', 'scale=1024:-1', '-q:v', '3'])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};

export const extractFrames = async (
  videoPath: string,
  outputDir: string,
  strategy: FrameStrategy = 'fixed_interval'
): Promise<VideoFrame[]> => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const metadata = await getVideoMetadata(videoPath);

  let timestamps: number[] = [];

  if (strategy === 'scene_change') {
    timestamps = await getSceneChangeTimestamps(videoPath);
    if (timestamps.length === 0) {
      timestamps = getFixedIntervalTimestamps(metadata.duration);
    }
  } else if (strategy === 'uniform') {
    timestamps = getUniformTimestamps(metadata.duration);
  } else {
    timestamps = getFixedIntervalTimestamps(metadata.duration);
  }

  const frames: VideoFrame[] = [];

  for (const ts of timestamps) {
    const framePath = path.join(outputDir, `frame-${uuidv4()}-${ts}.jpg`);

    try {
      await extractFrameAtTimestamp(videoPath, ts, framePath);
      frames.push({ timestamp: ts, filePath: framePath });
    } catch {
      console.warn(`Skipping frame at ${ts}s`);
    }
  }

  return frames;
};

// ─────────────────────────────────────────
// AI Processing
// ─────────────────────────────────────────

export const processFramesForAI = async (frames: VideoFrame[]) => {
  const results = await Promise.all(
    frames.map(async (frame) => {
      try {
        const processed = await processImageForAI(frame.filePath);
        return { ...frame, processed };
      } catch {
        return frame;
      }
    })
  );

  return results.filter((f) => f.processed);
};

// ─────────────────────────────────────────
// Audio Extraction
// ─────────────────────────────────────────

export const extractAudioFromVideo = (videoPath: string): Promise<string> => {
  const audioPath = path.join(
    process.cwd(),
    'src/uploads',
    `audio-${uuidv4()}.mp3`
  );

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .output(audioPath)
      .on('end', () => resolve(audioPath))
      .on('error', reject)
      .run();
  });
};

// ─────────────────────────────────────────
// Download + Full Pipeline
// ─────────────────────────────────────────

export const downloadVideoToTemp = async (url: string): Promise<string> => {
  const tempPath = path.join(process.cwd(), 'src/uploads', `video-${uuidv4()}.mp4`);

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  });

  await fs.promises.writeFile(tempPath, Buffer.from(response.data));
  return tempPath;
};

export const processVideoForAnalysis = async (
  videoUrl: string
) => {
  const tempVideoPath = await downloadVideoToTemp(videoUrl);
  const tempDir = path.join(process.cwd(), 'src/uploads', `frames-${uuidv4()}`);

  try {
    const metadata = await getVideoMetadata(tempVideoPath);
    const frames = await processFramesForAI(
      await extractFrames(tempVideoPath, tempDir)
    );

    let audioPath: string | undefined;
    if (metadata.hasAudio) {
      audioPath = await extractAudioFromVideo(tempVideoPath);
    }

    return { frames, metadata, tempDir, tempVideoPath, audioPath };
  } catch (err) {
    await cleanupVideoTemp(tempVideoPath, tempDir);
    throw err;
  }
};

export const cleanupVideoTemp = async (
  tempVideoPath: string,
  tempDir: string,
  audioPath?: string
) => {
  await deleteFile(tempVideoPath);
  if (audioPath) {
    await deleteFile(audioPath);
  }

  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir).map((f) => path.join(tempDir, f));
    await deleteFiles(files);
    fs.rmdirSync(tempDir);
  }
};