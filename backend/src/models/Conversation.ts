import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  mediaIds?: mongoose.Types.ObjectId[];
  timestamp: Date;
  tokens?: number;
}

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  mediaContext: mongoose.Types.ObjectId[];
  aiModel: string;
  totalTokens: number;
  contextSummary?: string;
  contextSummarizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    mediaIds: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
    timestamp: { type: Date, default: Date.now },
    tokens: Number,
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'New Conversation', maxlength: 200 },
    messages: [messageSchema],
    mediaContext: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
    aiModel: { type: String, default: 'gemini-1.5-pro' },
    totalTokens: { type: Number, default: 0 },
    contextSummary: String,
    contextSummarizedAt: Date,
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model<IConversation>('Conversation', conversationSchema);