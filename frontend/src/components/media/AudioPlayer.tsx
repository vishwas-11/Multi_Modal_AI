'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, Volume2, VolumeX } from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';
import type { Media } from '@/types';

interface AudioPlayerProps {
  media: Media;
  onSegmentClick?: (timestamp: number) => void;
}

export default function AudioPlayer({ media, onSegmentClick }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(media.duration || media.waveformData?.duration || 0);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const peaks = media.waveformData?.peaks || [];
  const transcript = media.analysis?.transcription || '';
  const segments = transcript.split('\n').filter(Boolean).map((line) => {
    const match = line.match(/^\[?(\d+:\d+)\]?\s*(.*)/);
    if (!match) return null;
    const [m, s] = match[1].split(':').map(Number);
    return { timestamp: m * 60 + s, text: match[2], raw: line };
  }).filter(Boolean) as Array<{ timestamp: number; text: string; raw: string }>;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnded = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const seekTo = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = t;
    onSegmentClick?.(t);
  }, [onSegmentClick]);

  const restart = () => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play();
    setPlaying(true);
  };

  const cycleSpeed = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
      <audio ref={audioRef} src={media.url} preload="metadata" />

      {/* Waveform */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="relative h-16 flex items-center gap-px cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seekTo(pct * duration);
          }}
        >
          {peaks.length > 0 ? (
            peaks.map((peak, i) => {
              const pct = i / peaks.length;
              const isPast = pct * 100 < progress;
              return (
                <motion.div
                  key={i}
                  className={cn('flex-1 rounded-full min-w-[2px] transition-colors', isPast ? 'bg-[var(--accent)]' : 'bg-[var(--border-default)]')}
                  style={{ height: `${Math.max(4, peak * 100)}%` }}
                  animate={{ opacity: playing && isPast ? [0.7, 1, 0.7] : 1 }}
                  transition={{ duration: 0.8, repeat: playing && isPast ? Infinity : 0, delay: i * 0.003 }}
                />
              );
            })
          ) : (
            // Fallback: simple progress bar
            <div className="w-full h-1.5 bg-[var(--bg-overlay)] rounded-full relative">
              <div className="absolute inset-y-0 left-0 bg-[var(--accent)] rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-2.5">
          <button onClick={restart} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] transition-colors">
            <SkipBack size={12} />
          </button>

          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-[var(--accent)] text-[#050507] flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95"
          >
            {playing ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
          </button>

          <span className="text-[10px] font-mono text-[var(--text-muted)] tabular-nums flex-1">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <button
            onClick={cycleSpeed}
            className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border-dim)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {playbackRate}x
          </button>

          <button onClick={() => { setMuted(!muted); if (audioRef.current) audioRef.current.muted = !muted; }} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        </div>
      </div>

      {/* Transcript */}
      {segments.length > 0 && (
        <div className="border-t border-[var(--border-dim)]">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Transcript</span>
            <span className="text-[9px] font-mono text-[var(--text-dim)]">{segments.length} segments</span>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-[var(--border-dim)]">
            {segments.map((seg, i) => {
              const isActive = i < segments.length - 1
                ? currentTime >= seg.timestamp && currentTime < segments[i + 1].timestamp
                : currentTime >= seg.timestamp;
              return (
                <button
                  key={i}
                  onClick={() => seekTo(seg.timestamp)}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-2 text-left transition-colors',
                    isActive ? 'bg-[var(--accent-dim)]' : 'hover:bg-[var(--bg-raised)]'
                  )}
                >
                  <span className={cn('text-[9px] font-mono shrink-0 mt-0.5 tabular-nums', isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')}>
                    {formatDuration(seg.timestamp)}
                  </span>
                  <p className={cn('text-[11px] font-mono leading-relaxed', isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')}>
                    {seg.text}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}