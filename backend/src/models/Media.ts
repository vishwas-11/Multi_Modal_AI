import mongoose, { Document, Schema } from 'mongoose';

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface IAnalysis {
  summary?: string;
  description?: string;
  keyMoments?: Array<{ timestamp: number; description: string }>;
  transcription?: string;
  extractedText?: string;
  structuredData?: Record<string, unknown>;
  tables?: Array<{ headers: string[]; rows: string[][] }>;
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

  // Media-type specific fields
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

const analysisSchema = new Schema<IAnalysis>(
  {
    summary: String,
    description: String,
    keyMoments: [{ timestamp: Number, description: String }],
    transcription: String,
    extractedText: String,
    structuredData: Schema.Types.Mixed,
    tables: [{ headers: [String], rows: [[String]] }],
    chartData: Schema.Types.Mixed,
    tags: [String],
    sentiment: String,
    actionItems: [String],
    keyTopics: [String],
    speakerCount: Number,
    speakers: Schema.Types.Mixed,
    decisions: [String],
    language: String,
    analyzedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const mediaSchema = new Schema<IMedia>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document'],
      required: true,
    },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    analysis: analysisSchema,

    thumbnail: String,
    posterFrame: String,

    waveformData: {
      peaks: [Number],
      duration: Number,
    },

    duration: Number,

    dimensions: {
      width: Number,
      height: Number,
    },

    videoMetadata: {
      fps: Number,
      codec: String,
      hasAudio: Boolean,
      audioCodec: String,
      frameCount: Number,
      framesExtracted: Number,
      extractionStrategy: String,
    },

    pageCount: Number,
  },
  { timestamps: true }
);

// Indexes for performance
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ type: 1, uploadedBy: 1 });

export default mongoose.model<IMedia>('Media', mediaSchema);