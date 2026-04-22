import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IConversation, {}, {}, {}, mongoose.Document<unknown, {}, IConversation, {}, mongoose.DefaultSchemaOptions> & IConversation & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IConversation>;
export default _default;
//# sourceMappingURL=Conversation.d.ts.map