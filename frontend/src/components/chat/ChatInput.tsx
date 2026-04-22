'use client';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Paperclip, X, Camera, Film, Mic, FileText } from 'lucide-react';
import { useMediaStore } from '@/store/useMediaStore';
import { cn } from '@/lib/utils';

const TYPE_ICON = { image: Camera, video: Film, audio: Mic, document: FileText };

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  showUploader: boolean;
  onToggleUploader: () => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming, showUploader, onToggleUploader, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedMediaIds, toggleMediaSelection, gallery } = useMediaStore();
  const uniqueSelectedMediaIds = Array.from(new Set(selectedMediaIds.map((id) => String(id))));

  const allMedia = [
    ...(gallery?.images || []),
    ...(gallery?.videos || []),
    ...(gallery?.audio || []),
    ...(gallery?.documents || []),
  ];

  const handleSubmit = useCallback(() => {
    const msg = value.trim();
    if (!msg || isStreaming || disabled) return;
    onSend(msg);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, isStreaming, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="space-y-2">
      {/* Selected media chips */}
      <AnimatePresence>
        {uniqueSelectedMediaIds.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-1.5 px-1"
          >
            {uniqueSelectedMediaIds.map((id) => {
              const media = allMedia.find((m) => m.id === id);
              if (!media) return null;
              const Icon = TYPE_ICON[media.type];
              return (
                <div key={`${media.type}:${id}`} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--accent-dim)] border border-[rgba(0,229,160,0.2)] text-[10px] font-mono text-[var(--accent)]">
                  <Icon size={9} />
                  <span className="max-w-[100px] truncate">{media.originalName}</span>
                  <button onClick={() => toggleMediaSelection(id)} className="ml-0.5 hover:opacity-70">
                    <X size={9} />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className={cn(
        'flex items-end gap-2 rounded-xl border bg-[var(--bg-raised)] px-3 py-2.5 transition-colors',
        isStreaming ? 'border-[var(--accent)] border-opacity-40' : 'border-[var(--border-default)] focus-within:border-[var(--border-strong)]'
      )}>
        {/* Attach button */}
        <button
          onClick={onToggleUploader}
          className={cn(
            'p-1.5 rounded-lg transition-colors mb-0.5 shrink-0',
            showUploader
              ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]'
          )}
          title="Attach files"
        >
          <Paperclip size={14} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'AI is responding...' : 'Ask about your media, or type a message...'}
          disabled={isStreaming || disabled}
          rows={1}
          className="flex-1 bg-transparent text-[13px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none leading-relaxed py-0.5 min-h-[22px] max-h-[160px] disabled:opacity-50"
        />

        {/* Send / Stop */}
        <button
          onClick={isStreaming ? onStop : handleSubmit}
          disabled={!isStreaming && (!value.trim() || disabled)}
          className={cn(
            'p-1.5 rounded-lg transition-all mb-0.5 shrink-0',
            isStreaming
              ? 'bg-[rgba(255,77,109,0.15)] text-[var(--status-error)] hover:bg-[rgba(255,77,109,0.25)]'
              : value.trim() && !disabled
                ? 'bg-[var(--accent)] text-[#050507] hover:opacity-90 active:scale-95'
                : 'text-[var(--text-dim)] cursor-not-allowed'
          )}
        >
          {isStreaming ? <Square size={14} /> : <Send size={14} />}
        </button>
      </div>

      <p className="text-[9px] font-mono text-[var(--text-dim)] text-center">
        Enter to send · Shift+Enter for newline · ctrl+v to paste image
      </p>
    </div>
  );
}