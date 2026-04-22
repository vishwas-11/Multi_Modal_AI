'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Film, Mic, FileText, ChevronRight, Loader, BarChart2, Type, Table } from 'lucide-react';
import { analyzeApi } from '@/lib/api';
import VideoPlayer from './VideoPlayer';
import AudioPlayer from './AudioPlayer';
import AnalysisCard from '@/components/analysis/AnalysisCard';
import Button from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/index';
import { cn } from '@/lib/utils';
import type { Media } from '@/types';
import toast from 'react-hot-toast';

const TYPE_ICON = { image: Camera, video: Film, audio: Mic, document: FileText };

interface MediaPreviewProps {
  media: Media;
  onAnalysisUpdate?: (media: Media) => void;
}

type AnalysisMode = 'general' | 'ocr' | 'structured' | 'chart';

export default function MediaPreview({ media, onAnalysisUpdate }: MediaPreviewProps) {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('general');
  const [extractionType, setExtractionType] = useState('general');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMedia, setLocalMedia] = useState<Media>(media);

  useEffect(() => {
    setLocalMedia(media);
    setError(null);
  }, [media]);

  const Icon = TYPE_ICON[media.type];

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;

      if (media.type === 'image') {
        if (analysisMode === 'ocr') {
          result = await analyzeApi.ocrImage(media.id);
        } else if (analysisMode === 'structured') {
          result = await analyzeApi.structuredExtract(media.id, extractionType, prompt || undefined);
        } else if (analysisMode === 'chart') {
          result = await analyzeApi.analyzeChart(media.id, prompt || undefined);
        } else {
          result = await analyzeApi.analyzeImage({ mediaId: media.id, prompt: prompt || undefined });
        }
      } else if (media.type === 'video') {
        result = await analyzeApi.analyzeVideo({ mediaId: media.id, prompt: prompt || undefined });
      } else if (media.type === 'audio') {
        result = await analyzeApi.analyzeAudio({ mediaId: media.id, prompt: prompt || undefined, enableDiarization: true });
      } else {
        result = await analyzeApi.analyzeDocument({ mediaId: media.id, prompt: prompt || undefined });
      }

      const payload = result.data.data;
      const resolvedAnalysis =
        payload?.analysis ||
        payload?.data?.analysis ||
        payload;

      const updated = { ...localMedia, hasAnalysis: true, analysis: resolvedAnalysis || localMedia.analysis };
      setLocalMedia(updated);
      onAnalysisUpdate?.(updated);
      toast.success('Analysis complete');
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      setError(e.displayMessage || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Media preview */}
      <div className="rounded-xl border border-[var(--border-dim)] bg-[var(--bg-deep)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-dim)] bg-[var(--bg-surface)]">
          <Icon size={11} className="text-[var(--text-muted)]" />
          <span className="text-[11px] font-mono text-[var(--text-secondary)] truncate flex-1">{localMedia.originalName}</span>
          <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0 border border-[var(--border-dim)] rounded px-1.5 py-0.5">{localMedia.type}</span>
        </div>

        {/* Content */}
        <div className="p-3">
          {media.type === 'image' && (
            <div className="relative group overflow-hidden rounded-lg bg-black max-h-72 flex items-center justify-center">
              <img
                src={media.url}
                alt={media.originalName}
                className="max-h-72 max-w-full object-contain"
              />
            </div>
          )}

          {media.type === 'video' && <VideoPlayer media={localMedia} />}
          {media.type === 'audio' && <AudioPlayer media={localMedia} />}

          {media.type === 'document' && (
            <div className="flex items-center gap-3 p-4 bg-[var(--bg-raised)] rounded-lg">
              <FileText size={28} className="text-[var(--text-muted)]" />
              <div>
                <p className="text-sm font-mono text-[var(--text-secondary)]">{media.originalName}</p>
                <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">{media.mimeType}</p>
              </div>
              <a href={media.url} target="_blank" rel="noreferrer" className="ml-auto text-[10px] font-mono text-[var(--accent)] hover:underline">
                Open
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Analysis controls */}
      <div className="rounded-xl border border-[var(--border-dim)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-3 py-2.5 border-b border-[var(--border-dim)] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Analysis</span>
          {localMedia.hasAnalysis && (
            <span className="text-[9px] font-mono text-[var(--accent)]">results available</span>
          )}
        </div>

        <div className="p-3 space-y-3">
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

          {/* Mode selector for images */}
          {media.type === 'image' && (
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'general', icon: Camera, label: 'Describe' },
                { id: 'ocr', icon: Type, label: 'OCR' },
                { id: 'structured', icon: Table, label: 'Extract' },
                { id: 'chart', icon: BarChart2, label: 'Chart' },
              ].map(({ id, icon: ModeIcon, label }) => (
                <button
                  key={id}
                  onClick={() => setAnalysisMode(id as AnalysisMode)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors',
                    analysisMode === id
                      ? 'bg-[var(--accent-dim)] border-[rgba(0,229,160,0.3)] text-[var(--accent)]'
                      : 'border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--border-default)]'
                  )}
                >
                  <ModeIcon size={9} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Extraction type for structured mode */}
          {media.type === 'image' && analysisMode === 'structured' && (
            <select
              value={extractionType}
              onChange={(e) => setExtractionType(e.target.value)}
              className="w-full bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="general">General extraction</option>
              <option value="invoice">Invoice</option>
              <option value="table">Table</option>
              <option value="form">Form</option>
              <option value="receipt">Receipt</option>
            </select>
          )}

          {/* Prompt */}
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Custom analysis prompt (optional)..."
              className="flex-1 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              onKeyDown={(e) => e.key === 'Enter' && runAnalysis()}
            />
            <Button onClick={runAnalysis} loading={loading} size="sm">
              {loading ? '' : <ChevronRight size={12} />}
              {loading ? 'Analyzing...' : 'Run'}
            </Button>
          </div>
        </div>
      </div>

      {/* Analysis results */}
      <AnimatePresence>
        {localMedia.analysis && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AnalysisCard media={localMedia} analysis={localMedia.analysis} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}