import mongoose, { Document, Schema } from 'mongoose';

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface IAnalysis {
  summary?: string;
  description?: string;
  keyMoments?: Array<{ timestamp: number; description: string }>;
  transcription?: string;
  extractedText?: string;
  structuredData?: Record<string, unknown>;
  tags?: string[];
  sentiment?: string;
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
  duration?: number;
  dimensions?: { width: number; height: number };
  createdAt: Date;
  updatedAt: Date;
}

const analysisSchema = new Schema<IAnalysis>(
  {
    summary: String,
    description: String,
    keyMoments: [
      {
        timestamp: Number,
        description: String,
      },
    ],
    transcription: String,
    extractedText: String,
    structuredData: Schema.Types.Mixed,
    tags: [String],
    sentiment: String,
    analyzedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const mediaSchema = new Schema<IMedia>(
  {
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document'],
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    analysis: analysisSchema,
    thumbnail: String,
    duration: Number,
    dimensions: {
      width: Number,
      height: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ type: 1, uploadedBy: 1 });

export default mongoose.model<IMedia>('Media', mediaSchema);