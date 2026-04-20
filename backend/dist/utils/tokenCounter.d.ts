import { IMessage } from '../models/Conversation';
/**
 * Estimate token count for a string
 */
export declare const estimateTokens: (text: string) => number;
/**
 * Estimate tokens for a message (including any media context overhead)
 */
export declare const estimateMessageTokens: (msg: IMessage) => number;
/**
 * Calculate total token usage for a message array
 */
export declare const calculateTotalTokens: (messages: IMessage[]) => number;
export interface TrimmedContext {
    messages: IMessage[];
    wasTrimmed: boolean;
    droppedCount: number;
    summaryAdded: boolean;
}
/**
 * Intelligently trim conversation history to stay within token limits.
 * Strategy:
 * 1. Keep the last N messages always (most recent context is most important)
 * 2. If total tokens still exceed limit, drop oldest messages first
 * 3. Inject a summary message when we drop history
 */
export declare const trimConversationContext: (messages: IMessage[], existingSummary?: string, maxTokens?: number) => TrimmedContext;
/**
 * Check if conversation needs summarization
 */
export declare const needsSummarization: (messages: IMessage[]) => boolean;
/**
 * Build a prompt to generate a conversation summary
 */
export declare const buildSummaryPrompt: (messages: IMessage[]) => string;
//# sourceMappingURL=tokenCounter.d.ts.map