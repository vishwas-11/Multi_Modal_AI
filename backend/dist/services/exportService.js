"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExportFilename = exports.exportConversationAsHTML = exports.exportConversationAsMarkdown = void 0;
/**
 * Export conversation as Markdown string
 */
const exportConversationAsMarkdown = (conversation, mediaMap) => {
    const lines = [];
    const date = new Date(conversation.createdAt).toLocaleString();
    lines.push(`# ${conversation.title}`);
    lines.push(`**Date:** ${date}`);
    lines.push(`**Messages:** ${conversation.messages.length}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    for (const msg of conversation.messages) {
        const role = msg.role === 'user' ? '👤 **You**' : '🤖 **Assistant**';
        const time = new Date(msg.timestamp).toLocaleTimeString();
        lines.push(`### ${role} _(${time})_`);
        lines.push('');
        // Include media references
        if (msg.mediaIds && msg.mediaIds.length > 0) {
            for (const mediaId of msg.mediaIds) {
                const media = mediaMap.get(mediaId.toString());
                if (media) {
                    lines.push(`> 📎 *Attached: ${media.originalName} (${media.type})*`);
                    if (media.url)
                        lines.push(`> [View file](${media.url})`);
                }
            }
            lines.push('');
        }
        lines.push(msg.content);
        lines.push('');
        lines.push('---');
        lines.push('');
    }
    return lines.join('\n');
};
exports.exportConversationAsMarkdown = exportConversationAsMarkdown;
/**
 * Export conversation as structured HTML (for PDF conversion)
 */
const exportConversationAsHTML = (conversation, mediaMap) => {
    const date = new Date(conversation.createdAt).toLocaleString();
    const messageHTML = conversation.messages
        .map((msg) => {
        const isUser = msg.role === 'user';
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const bgColor = isUser ? '#f0f4ff' : '#f9f9f9';
        const label = isUser ? '👤 You' : '🤖 Assistant';
        const mediaAttachments = msg.mediaIds && msg.mediaIds.length > 0
            ? msg.mediaIds
                .map((id) => {
                const media = mediaMap.get(id.toString());
                if (!media)
                    return '';
                return `<div class="attachment">📎 ${media.originalName} (${media.type})</div>`;
            })
                .join('')
            : '';
        // Escape HTML in content, then convert newlines to <br>
        const safeContent = msg.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        return `
        <div style="background:${bgColor};padding:16px;margin:8px 0;border-radius:8px;">
          <div style="font-weight:bold;margin-bottom:8px;">${label} <span style="font-weight:normal;color:#888;font-size:12px;">${time}</span></div>
          ${mediaAttachments}
          <div>${safeContent}</div>
        </div>`;
    })
        .join('\n');
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${conversation.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
    h1 { border-bottom: 2px solid #eee; padding-bottom: 12px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
    .attachment { background: #e8f4f8; padding: 6px 10px; border-radius: 4px; font-size: 12px; margin-bottom: 8px; display: inline-block; }
  </style>
</head>
<body>
  <h1>${conversation.title}</h1>
  <div class="meta">Date: ${date} · Messages: ${conversation.messages.length}</div>
  ${messageHTML}
</body>
</html>`;
};
exports.exportConversationAsHTML = exportConversationAsHTML;
/**
 * Build filename for export
 */
const buildExportFilename = (conversation, format) => {
    const slug = conversation.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 50);
    const date = new Date(conversation.createdAt).toISOString().split('T')[0];
    return `conversation-${slug}-${date}.${format}`;
};
exports.buildExportFilename = buildExportFilename;
//# sourceMappingURL=exportService.js.map