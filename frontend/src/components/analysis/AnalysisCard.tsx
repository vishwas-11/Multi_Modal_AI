'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Tag, Clock, AlertTriangle, CheckSquare, Users, Mic } from 'lucide-react';
import { Badge } from '@/components/ui/index';
import { cn, formatDuration } from '@/lib/utils';
import type { MediaAnalysis, Media } from '@/types';

interface AnalysisCardProps {
  media: Media;
  analysis: MediaAnalysis;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[var(--border-dim)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--bg-raised)] hover:bg-[var(--bg-overlay)] transition-colors"
      >
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">{title}</span>
        <ChevronDown size={11} className={cn('text-[var(--text-muted)] transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 py-3 bg-[var(--bg-surface)]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnalysisCard({ media, analysis }: AnalysisCardProps) {
  return (
    <div className="space-y-2 text-xs font-mono">
      {/* Summary */}
      {analysis.summary && (
        <Section title="Summary">
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{analysis.summary}</p>
          {analysis.sentiment && (
            <div className="mt-2">
              <Badge variant={analysis.sentiment === 'positive' ? 'accent' : analysis.sentiment === 'negative' ? 'error' : 'default'}>
                {analysis.sentiment}
              </Badge>
            </div>
          )}
        </Section>
      )}

      {/* Tags */}
      {analysis.tags && analysis.tags.length > 0 && (
        <Section title="Tags" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {analysis.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-overlay)] border border-[var(--border-dim)] text-[10px] text-[var(--text-muted)]">
                <Tag size={8} />
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Key moments (video) */}
      {analysis.keyMoments && analysis.keyMoments.length > 0 && (
        <Section title="Key Moments">
          <div className="space-y-2">
            {analysis.keyMoments.map((km, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="text-[10px] text-[var(--accent)] shrink-0 w-10 flex items-center gap-1">
                  <Clock size={8} />
                  {formatDuration(km.timestamp)}
                </span>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{km.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Action items (audio) */}
      {analysis.actionItems && analysis.actionItems.length > 0 && (
        <Section title="Action Items">
          <div className="space-y-1.5">
            {analysis.actionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckSquare size={10} className="text-[var(--accent)] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[var(--text-secondary)]">{item}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Speakers (audio diarization) */}
      {analysis.speakers && Object.keys(analysis.speakers).length > 0 && (
        <Section title={`Speakers (${analysis.speakerCount || Object.keys(analysis.speakers).length})`} defaultOpen={false}>
          <div className="space-y-1.5">
            {Object.entries(analysis.speakers).map(([spk, desc]) => (
              <div key={spk} className="flex items-start gap-2">
                <Users size={10} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-[var(--accent)]">{spk}</span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-2">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Transcription (audio) */}
      {analysis.transcription && (
        <Section title="Transcript" defaultOpen={false}>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {analysis.transcription.split('\n').map((line, i) => {
              const match = line.match(/^\[(\d+:\d+)\]\s*(.*)/);
              if (match) {
                return (
                  <div key={i} className="flex gap-2.5 py-0.5">
                    <span className="text-[10px] text-[var(--accent)] shrink-0 w-10">{match[1]}</span>
                    <p className="text-[11px] text-[var(--text-secondary)]">{match[2]}</p>
                  </div>
                );
              }
              const speakerMatch = line.match(/^(Speaker \d+) \[(\d+:\d+)\]:\s*(.*)/);
              if (speakerMatch) {
                return (
                  <div key={i} className="flex gap-2.5 py-0.5">
                    <span className="text-[10px] text-[var(--accent)] shrink-0 w-20 flex items-center gap-1">
                      <Mic size={7} />
                      {speakerMatch[1]}
                    </span>
                    <span className="text-[9px] text-[var(--text-dim)] w-10 shrink-0">{speakerMatch[2]}</span>
                    <p className="text-[11px] text-[var(--text-secondary)]">{speakerMatch[3]}</p>
                  </div>
                );
              }
              return <p key={i} className="text-[11px] text-[var(--text-secondary)]">{line}</p>;
            })}
          </div>
        </Section>
      )}

      {/* Extracted text (OCR) */}
      {analysis.extractedText && (
        <Section title="Extracted Text" defaultOpen={false}>
          <pre className="text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">{analysis.extractedText}</pre>
        </Section>
      )}

      {/* Structured data */}
      {analysis.structuredData && (
        <Section title="Structured Data" defaultOpen={false}>
          <pre className="text-[11px] text-[var(--accent)] font-mono bg-[var(--bg-raised)] rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(analysis.structuredData, null, 2)}
          </pre>
        </Section>
      )}

      {/* Key topics */}
      {analysis.keyTopics && analysis.keyTopics.length > 0 && (
        <Section title="Key Topics" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {analysis.keyTopics.map((t) => (
              <Badge key={t} variant="info">{t}</Badge>
            ))}
          </div>
        </Section>
      )}

      {/* Decisions */}
      {analysis.decisions && analysis.decisions.length > 0 && (
        <Section title="Decisions" defaultOpen={false}>
          <div className="space-y-1.5">
            {analysis.decisions.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle size={9} className="text-[var(--amber)] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[var(--text-secondary)]">{d}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}