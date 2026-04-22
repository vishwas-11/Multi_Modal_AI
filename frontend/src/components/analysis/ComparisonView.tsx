'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Film, Mic, FileText, ChevronRight, Loader } from 'lucide-react';
import { useMediaStore } from '@/store/useMediaStore';
import { compareApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/index';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn, formatFileSize } from '@/lib/utils';
import type { Media } from '@/types';
import toast from 'react-hot-toast';

const TYPE_ICON = { image: Camera, video: Film, audio: Mic, document: FileText };

interface ComparisonViewProps {
  mediaIds: string[];
  onClose?: () => void;
}

export default function ComparisonView({ mediaIds, onClose }: ComparisonViewProps) {
  const { gallery } = useMediaStore();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<Record<string, number>>({});

  const allMedia = [
    ...(gallery?.images || []),
    ...(gallery?.videos || []),
    ...(gallery?.audio || []),
    ...(gallery?.documents || []),
  ];

  const items = mediaIds.map((id) => allMedia.find((m) => m.id === id)).filter(Boolean) as Media[];

  const handleCompare = async () => {
    if (items.length < 2) { toast.error('Select at least 2 files to compare'); return; }
    setLoading(true);
    setError(null);
    setResult('');
    try {
      const res = await compareApi.compare(mediaIds, prompt || undefined);
      setResult(res.data.data.comparison);
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      setError(e.displayMessage || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const syncZoom = (id: string, val: number) => {
    if (items.every((m) => m.type === 'image')) {
      const synced: Record<string, number> = {};
      items.forEach((m) => { synced[m.id] = val; });
      setZoom(synced);
    } else {
      setZoom((p) => ({ ...p, [id]: val }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-void)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-dim)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Comparison</span>
          <span className="text-[9px] font-mono text-[var(--text-dim)] border border-[var(--border-dim)] rounded px-1.5 py-0.5">{items.length} items</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">Close</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Side-by-side media */}
        <div className={cn('grid gap-px bg-[var(--border-dim)]', items.length === 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4')}>
          {items.map((media) => {
            const Icon = TYPE_ICON[media.type];
            const thumb = media.thumbnail || media.posterFrame;
            const scale = zoom[media.id] || 1;

            return (
              <div key={media.id} className="bg-[var(--bg-deep)] flex flex-col">
                {/* Preview */}
                <div className="relative aspect-square overflow-hidden bg-black flex items-center justify-center">
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={media.originalName}
                      className="w-full h-full object-contain transition-transform"
                      style={{ transform: `scale(${scale})` }}
                    />
                  ) : thumb ? (
                    <img src={thumb} alt={media.originalName} className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                      <Icon size={24} />
                      <span className="text-[10px] font-mono">{media.type}</span>
                    </div>
                  )}

                  {/* Zoom controls for images */}
                  {media.type === 'image' && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {[1, 1.5, 2].map((z) => (
                        <button
                          key={z}
                          onClick={() => syncZoom(media.id, z)}
                          className={cn(
                            'w-5 h-5 rounded text-[9px] font-mono transition-colors',
                            scale === z ? 'bg-[var(--accent)] text-[#050507]' : 'bg-black/60 text-white/60 hover:bg-black/80'
                          )}
                        >
                          {z}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Media info */}
                <div className="px-2 py-2 border-t border-[var(--border-dim)]">
                  <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate">{media.originalName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono text-[var(--text-muted)]">{formatFileSize(media.size)}</span>
                    {media.dimensions && (
                      <span className="text-[9px] font-mono text-[var(--text-muted)]">{media.dimensions.width}×{media.dimensions.height}</span>
                    )}
                  </div>
                  {media.analysis?.summary && (
                    <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1.5 line-clamp-3 leading-relaxed">{media.analysis.summary}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Prompt + compare button */}
        <div className="p-4 border-b border-[var(--border-dim)] bg-[var(--bg-surface)] space-y-3">
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Custom comparison prompt (optional)..."
              className="flex-1 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
            />
            <Button onClick={handleCompare} loading={loading} size="md">
              <ChevronRight size={13} />
              Compare
            </Button>
          </div>

          {!result && !loading && (
            <div className="flex flex-wrap gap-2">
              {['Compare key differences', 'Which is higher quality?', 'What do these have in common?'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setPrompt(q); }}
                  className="text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border-dim)] rounded px-2.5 py-1 hover:border-[var(--border-default)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Result */}
        <div className="p-4">
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-3" />}

          {loading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader size={14} className="animate-spin text-[var(--accent)]" />
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Analyzing {items.length} items in single context window...</span>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
            >
              <div className="text-[9px] font-mono text-[var(--accent)] uppercase tracking-widest mb-3">Comparison Result</div>
              <div className="prose-terminal">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}