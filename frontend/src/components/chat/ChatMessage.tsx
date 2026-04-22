'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import { Copy, Check, Camera, Film, Mic, FileText } from 'lucide-react';
import { useMediaStore } from '@/store/useMediaStore';
import { copyToClipboard, cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types';

const TYPE_ICON = { image: Camera, video: Film, audio: Mic, document: FileText };

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

function MediaAttachment({ mediaId }: { mediaId: string }) {
  const { gallery } = useMediaStore();
  const allMedia = [
    ...(gallery?.images || []),
    ...(gallery?.videos || []),
    ...(gallery?.audio || []),
    ...(gallery?.documents || []),
  ];
  const media = allMedia.find((m) => m.id === mediaId);
  if (!media) return null;

  const Icon = TYPE_ICON[media.type];
  const thumb = media.thumbnail || media.posterFrame;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-[var(--border-dim)] bg-[var(--bg-overlay)] text-[10px] font-mono text-[var(--text-muted)] w-fit">
      {thumb ? (
        <img src={thumb} alt={media.originalName} className="w-5 h-5 rounded object-cover" />
      ) : (
        <Icon size={10} />
      )}
      <span className="max-w-[120px] truncate">{media.originalName}</span>
    </div>
  );
}

export default function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    const ok = await copyToClipboard(message.content);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('group flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div className={cn('max-w-[80%] space-y-2', isUser ? 'items-end' : 'items-start')}>
        {/* Media attachments */}
        {message.mediaIds && message.mediaIds.length > 0 && (
          <div className={cn('flex flex-wrap gap-1.5', isUser ? 'justify-end' : 'justify-start')}>
            {message.mediaIds.map((id) => <MediaAttachment key={id} mediaId={id} />)}
          </div>
        )}

        {/* Message bubble */}
        <div className={cn(
          'relative rounded-xl px-4 py-3 text-sm',
          isUser
            ? 'bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-br-sm'
            : 'bg-[var(--bg-surface)] border border-[var(--border-dim)] text-[var(--text-primary)] rounded-bl-sm'
        )}>
          {/* Role label */}
          <div className={cn(
            'text-[9px] font-mono uppercase tracking-widest mb-2',
            isUser ? 'text-[var(--text-muted)] text-right' : 'text-[var(--accent)]'
          )}>
            {isUser ? 'you' : 'assistant'}
          </div>

          {isUser ? (
            <p className="text-[13px] font-mono leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-terminal">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const lang = match?.[1] || '';
                    const isBlock = className?.includes('language-');
                    if (!isBlock) {
                      return <code className={className}>{children}</code>;
                    }
                    return (
                      <div className="relative group/code">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-raised)] border-b border-[var(--border-dim)] rounded-t-md">
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">{lang}</span>
                        </div>
                        <SyntaxHighlighter
                          language={lang}
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, borderRadius: '0 0 6px 6px', background: '#161b22', fontSize: '12px' }}
                          PreTag="div"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-[var(--accent)] ml-0.5 animate-blink" />
              )}
            </div>
          )}

          {/* Copy button */}
          {!isUser && !isStreaming && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              {copied ? <Check size={11} className="text-[var(--accent)]" /> : <Copy size={11} />}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <p className={cn('text-[9px] font-mono text-[var(--text-dim)] px-1', isUser ? 'text-right' : 'text-left')}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}