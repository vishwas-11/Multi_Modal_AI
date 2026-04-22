import { IMessage } from '../models/Conversation';

// Rough token estimation: ~4 chars per token for English
const CHARS_PER_TOKEN = 4;

// Gemini 1.5 Pro context window = 1M tokens, but we use a safe working limit
const SAFE_TOKEN_LIMIT = 800_000;
const MAX_HISTORY_TOKENS = 50_000;   // Reserve for conversation history
const SUMMARY_THRESHOLD = 40_000;    // Summarize when history exceeds this

/**
 * Estimate token count for a string
 */
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
};

/**
 * Estimate tokens for a message (including any media context overhead)
 */
export const estimateMessageTokens = (msg: IMessage): number => {
  let tokens = estimateTokens(msg.content);
  // Each image reference in a message costs ~258 tokens (Gemini image overhead)
  if (msg.mediaIds && msg.mediaIds.length > 0) {
    tokens += msg.mediaIds.length * 258;
  }
  return tokens;
};

/**
 * Calculate total token usage for a message array
 */
export const calculateTotalTokens = (messages: IMessage[]): number => {
  return messages.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0);
};

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
export const trimConversationContext = (
  messages: IMessage[],
  existingSummary?: string,
  maxTokens = MAX_HISTORY_TOKENS
): TrimmedContext => {
  if (messages.length === 0) {
    return { messages: [], wasTrimmed: false, droppedCount: 0, summaryAdded: false };
  }

  const totalTokens = calculateTotalTokens(messages);

  if (totalTokens <= maxTokens) {
    return { messages, wasTrimmed: false, droppedCount: 0, summaryAdded: false };
  }

  // Always keep the last 6 messages (3 exchanges) regardless
  const ALWAYS_KEEP = 6;
  const recentMessages = messages.slice(-ALWAYS_KEEP);
  const olderMessages = messages.slice(0, -ALWAYS_KEEP);

  let trimmed: IMessage[] = [...recentMessages];
  let droppedCount = 0;
  let summaryAdded = false;

  // Try to fit older messages within remaining budget
  const recentTokens = calculateTotalTokens(recentMessages);
  let remainingBudget = maxTokens - recentTokens;

  // If there's a pre-existing summary, add it first (costs some tokens)
  if (existingSummary) {
    const summaryTokens = estimateTokens(existingSummary);
    if (summaryTokens < remainingBudget) {
      const summaryMessage: IMessage = {
        role: 'assistant',
        content: `[Previous conversation summary: ${existingSummary}]`,
        timestamp: new Date(),
      };
      trimmed = [summaryMessage, ...trimmed];
      remainingBudget -= summaryTokens;
      summaryAdded = true;
    }
  }

  // Add older messages from most recent to oldest until budget runs out
  const olderToAdd: IMessage[] = [];
  for (let i = olderMessages.length - 1; i >= 0; i--) {
    const msgTokens = estimateMessageTokens(olderMessages[i]);
    if (remainingBudget - msgTokens > 0) {
      olderToAdd.unshift(olderMessages[i]);
      remainingBudget -= msgTokens;
    } else {
      droppedCount = i + 1;
      break;
    }
  }

  const finalMessages = [...olderToAdd, ...trimmed];

  return {
    messages: finalMessages,
    wasTrimmed: droppedCount > 0,
    droppedCount,
    summaryAdded,
  };
};

/**
 * Check if conversation needs summarization
 */
export const needsSummarization = (messages: IMessage[]): boolean => {
  return calculateTotalTokens(messages) > SUMMARY_THRESHOLD;
};

/**
 * Build a prompt to generate a conversation summary
 */
export const buildSummaryPrompt = (messages: IMessage[]): string => {
  const transcript = messages
    .slice(0, -4) // Summarize everything except last 2 exchanges
    .map((m) => `${m.role.toUpperCase()}: ${m.content.substring(0, 500)}`)
    .join('\n');

  return `Summarize the following conversation in 3-5 sentences, preserving:
- Key topics discussed
- Important facts or data mentioned  
- Any media that was analyzed (images, videos, documents)
- Decisions or conclusions reached

Conversation:
${transcript}

Provide ONLY the summary, no preamble.`;
};