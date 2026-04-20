import { IConversation } from '../models/Conversation';
import { IMedia } from '../models/Media';
/**
 * Export conversation as Markdown string
 */
export declare const exportConversationAsMarkdown: (conversation: IConversation, mediaMap: Map<string, IMedia>) => string;
/**
 * Export conversation as structured HTML (for PDF conversion)
 */
export declare const exportConversationAsHTML: (conversation: IConversation, mediaMap: Map<string, IMedia>) => string;
/**
 * Build filename for export
 */
export declare const buildExportFilename: (conversation: IConversation, format: "md" | "html") => string;
//# sourceMappingURL=exportService.d.ts.map