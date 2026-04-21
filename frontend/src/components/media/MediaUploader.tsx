'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Film, Mic, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useUpload } from '@/hooks/useUpload';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { formatFileSize, formatSpeed, formatETA, cn } from '@/lib/utils';
import type { Media } from '@/types';

const TYPE_CONFIG = {
  image: { icon: Camera, label: 'Image', accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'] } },
  video: { icon: Film, label: 'Video', accept: { 'video/*': ['.mp4', '.webm', '.mov', '.avi'] } },
  audio: { icon: Mic, label: 'Audio', accept: { 'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac'] } },
  document: { icon: FileText, label: 'Document', accept: { 'application/pdf': ['.pdf'], 'text/*': ['.txt', '.csv', '.json'] } },
};

interface MediaUploaderProps {
  onUploaded?: (media: Media[]) => void;
  compact?: boolean;
}

export default function MediaUploader({ onUploaded, compact = false }: MediaUploaderProps) {
  const { uploads, uploadFiles, uploadClipboard } = useUpload();
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setError(null);
    try {
      const results = await uploadFiles(accepted);
      onUploaded?.(results);
    } catch (err: unknown) {
      const e = err as { displayMessage?: string; message?: string };
      setError(e.displayMessage || e.message || 'Upload failed');
    }
  }, [uploadFiles, onUploaded]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop: handleDrop,
    accept: Object.values(TYPE_CONFIG).reduce((acc, v) => ({ ...acc, ...v.accept }), {}),
    maxFiles: 10,
    maxSize: 100 * 1024 * 1024,
    onDropRejected: (rejections) => {
      const reasons = rejections.map((r) => {
        if (r.errors[0]?.code === 'file-too-large') return `${r.file.name}: exceeds size limit`;
        if (r.errors[0]?.code === 'file-invalid-type') return `${r.file.name}: unsupported format`;
        return r.file.name;
      });
      setError(reasons.join(' · '));
    },
  });

  useClipboardPaste({
    onPaste: async (imageData) => {
      setError(null);
      try {
        const m = await uploadClipboard(imageData);
        onUploaded?.([m]);
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e.message || 'Clipboard upload failed');
      }
    },
  });

  const activeUploads = uploads.filter((u) => u.status !== 'done');

  if (compact) {
    return (
      <div className="relative">
        <div
          {...getRootProps()}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer transition-all',
            isDragActive
              ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
              : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]'
          )}
        >
          <input {...getInputProps()} />
          <Upload size={13} />
          <span className="text-[11px] font-mono">
            {isDragActive ? 'Drop files...' : 'Attach files'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all cursor-pointer p-8 text-center group',
          isDragActive
            ? 'border-[var(--accent)] bg-[var(--accent-dim)]'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)]'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl border flex items-center justify-center transition-colors',
            isDragActive ? 'border-[var(--accent)] bg-[var(--accent-dim)]' : 'border-[var(--border-default)] bg-[var(--bg-raised)] group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-dim)]'
          )}>
            <Upload size={16} className={isDragActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--accent)]'} />
          </div>

          <div>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              {isDragActive ? 'Release to upload' : 'Drop files or click to browse'}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">
              Images · Video · Audio · Documents — max 100MB
            </p>
          </div>

          {/* Type indicators */}
          <div className="flex gap-3 mt-1">
            {Object.entries(TYPE_CONFIG).map(([key, { icon: Icon, label }]) => (
              <div key={key} className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
                <Icon size={10} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-[var(--text-dim)] font-mono">
          ctrl+v to paste screenshots
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {(error || fileRejections.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg border border-[rgba(255,77,109,0.25)] bg-[rgba(255,77,109,0.08)]"
          >
            <AlertCircle size={12} className="text-[var(--status-error)] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[var(--status-error)] font-mono flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-[var(--status-error)] opacity-60 hover:opacity-100">
              <X size={11} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress list */}
      <AnimatePresence>
        {activeUploads.map((u, i) => (
          <motion.div
            key={`${u.file.name}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-surface)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {u.status === 'error'
                  ? <AlertCircle size={12} className="text-[var(--status-error)] shrink-0" />
                  : u.status === 'done'
                    ? <CheckCircle size={12} className="text-[var(--accent)] shrink-0" />
                    : <span className="w-3 h-3 rounded-full border border-[var(--border-default)] border-t-[var(--accent)] animate-spin shrink-0" />
                }
                <span className="text-[11px] font-mono text-[var(--text-secondary)] truncate">{u.file.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">{formatFileSize(u.file.size)}</span>
                {u.status === 'uploading' && u.speed > 0 && (
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{formatSpeed(u.speed)}</span>
                )}
                {u.status === 'uploading' && u.eta > 0 && (
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">ETA {formatETA(u.eta)}</span>
                )}
                <span className="text-[10px] font-mono text-[var(--accent)] w-8 text-right">{u.progress}%</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-[var(--border-dim)] rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', u.status === 'error' ? 'bg-[var(--status-error)]' : 'bg-[var(--accent)]')}
                initial={{ width: 0 }}
                animate={{ width: `${u.progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>

            {/* Processing state */}
            {u.status === 'processing' && (
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                Processing media...
              </p>
            )}
            {u.status === 'error' && u.error && (
              <p className="text-[10px] text-[var(--status-error)] font-mono">{u.error}</p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}