"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSummaryPrompt = exports.needsSummarization = exports.trimConversationContext = exports.calculateTotalTokens = exports.estimateMessageTokens = exports.estimateTokens = void 0;
// Rough token estimation: ~4 chars per token for English
const CHARS_PER_TOKEN = 4;
// Gemini 1.5 Pro context window = 1M tokens, but we use a safe working limit
const SAFE_TOKEN_LIMIT = 800000;
const MAX_HISTORY_TOKENS = 50000; // Reserve for conversation history
const SUMMARY_THRESHOLD = 40000; // Summarize when history exceeds this
/**
 * Estimate token count for a string
 */
const estimateTokens = (text) => {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
};
exports.estimateTokens = estimateTokens;
/**
 * Estimate tokens for a message (including any media context overhead)
 */
const estimateMessageTokens = (msg) => {
    let tokens = (0, exports.estimateTokens)(msg.content);
    // Each image reference in a message costs ~258 tokens (Gemini image overhead)
    if (msg.mediaIds && msg.mediaIds.length > 0) {
        tokens += msg.mediaIds.length * 258;
    }
    return tokens;
};
exports.estimateMessageTokens = estimateMessageTokens;
/**
 * Calculate total token usage for a message array
 */
const calculateTotalTokens = (messages) => {
    return messages.reduce((sum, msg) => sum + (0, exports.estimateMessageTokens)(msg), 0);
};
exports.calculateTotalTokens = calculateTotalTokens;
/**
 * Intelligently trim conversation history to stay within token limits.
 * Strategy:
 * 1. Keep the last N messages always (most recent context is most important)
 * 2. If total tokens still exceed limit, drop oldest messages first
 * 3. Inject a summary message when we drop history
 */
const trimConversationContext = (messages, existingSummary, maxTokens = MAX_HISTORY_TOKENS) => {
    if (messages.length === 0) {
        return { messages: [], wasTrimmed: false, droppedCount: 0, summaryAdded: false };
    }
    const totalTokens = (0, exports.calculateTotalTokens)(messages);
    if (totalTokens <= maxTokens) {
        return { messages, wasTrimmed: false, droppedCount: 0, summaryAdded: false };
    }
    // Always keep the last 6 messages (3 exchanges) regardless
    const ALWAYS_KEEP = 6;
    const recentMessages = messages.slice(-ALWAYS_KEEP);
    const olderMessages = messages.slice(0, -ALWAYS_KEEP);
    let trimmed = [...recentMessages];
    let droppedCount = 0;
    let summaryAdded = false;
    // Try to fit older messages within remaining budget
    const recentTokens = (0, exports.calculateTotalTokens)(recentMessages);
    let remainingBudget = maxTokens - recentTokens;
    // If there's a pre-existing summary, add it first (costs some tokens)
    if (existingSummary) {
        const summaryTokens = (0, exports.estimateTokens)(existingSummary);
        if (summaryTokens < remainingBudget) {
            const summaryMessage = {
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
    const olderToAdd = [];
    for (let i = olderMessages.length - 1; i >= 0; i--) {
        const msgTokens = (0, exports.estimateMessageTokens)(olderMessages[i]);
        if (remainingBudget - msgTokens > 0) {
            olderToAdd.unshift(olderMessages[i]);
            remainingBudget -= msgTokens;
        }
        else {
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
exports.trimConversationContext = trimConversationContext;
/**
 * Check if conversation needs summarization
 */
const needsSummarization = (messages) => {
    return (0, exports.calculateTotalTokens)(messages) > SUMMARY_THRESHOLD;
};
exports.needsSummarization = needsSummarization;
/**
 * Build a prompt to generate a conversation summary
 */
const buildSummaryPrompt = (messages) => {
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
exports.buildSummaryPrompt = buildSummaryPrompt;
//# sourceMappingURL=tokenCounter.js.map