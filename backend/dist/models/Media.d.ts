import mongoose, { Document } from 'mongoose';
export type MediaType = 'image' | 'video' | 'audio' | 'document';
export interface IAnalysis {
    summary?: string;
    description?: string;
    keyMoments?: Array<{
        timestamp: number;
        description: string;
    }>;
    transcription?: string;
    extractedText?: string;
    structuredData?: Record<string, unknown>;
    tables?: Array<{
        headers: string[];
        rows: string[][];
    }>;
    chartData?: Record<string, unknown>;
    tags?: string[];
    sentiment?: string;
    actionItems?: string[];
    keyTopics?: string[];
    speakerCount?: number;
    speakers?: Record<string, string>;
    decisions?: string[];
    language?: string;
    analyzedAt: Date;
}
export interface IMedia extends Document {
    _id: mongoose.Types.ObjectId;
    fileName: string;
    originalName: string;
    url: string;
    publicId: string;
    type: MediaType;
    mimeType: string;
    size: number;
    uploadedBy: mongoose.Types.ObjectId;
    analysis?: IAnalysis;
    thumbnail?: string;
    posterFrame?: string;
    waveformData?: {
        peaks: number[];
        duration: number;
    };
    duration?: number;
    dimensions?: {
        width: number;
        height: number;
    };
    videoMetadata?: {
        fps: number;
        codec: string;
        hasAudio: boolean;
        audioCodec?: string;
        frameCount: number;
        framesExtracted?: number;
        extractionStrategy?: string;
    };
    pageCount?: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IMedia, {}, {}, {}, mongoose.Document<unknown, {}, IMedia, {}, mongoose.DefaultSchemaOptions> & IMedia & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMedia>;
export default _default;
//# sourceMappingURL=Media.d.ts.map