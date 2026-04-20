import { ProcessedImage } from './imageService';
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
/**
 * Get video metadata using ffprobe
 */
export declare const getVideoMetadata: (videoPath: string) => Promise<VideoMetadata>;
export declare const extractFrames: (videoPath: string, outputDir: string, strategy?: FrameStrategy) => Promise<VideoFrame[]>;
export declare const processFramesForAI: (frames: VideoFrame[]) => Promise<VideoFrame[]>;
export declare const extractAudioFromVideo: (videoPath: string) => Promise<string>;
export declare const downloadVideoToTemp: (url: string) => Promise<string>;
export declare const processVideoForAnalysis: (videoUrl: string) => Promise<{
    frames: VideoFrame[];
    metadata: VideoMetadata;
    tempDir: string;
    tempVideoPath: string;
    audioPath: string | undefined;
}>;
export declare const cleanupVideoTemp: (tempVideoPath: string, tempDir: string, audioPath?: string) => Promise<void>;
//# sourceMappingURL=videoService.d.ts.map