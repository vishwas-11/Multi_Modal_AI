'use client';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2, Clock } from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';
import type { Media } from '@/types';

interface VideoPlayerProps {
  media: Media;
}

export default function VideoPlayer({ media }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(media.duration || 0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [hovered, setHovered] = useState(false);

  const keyMoments = media.analysis?.keyMoments || [];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onEnded = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('ended', onEnded);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * duration;
  };

  const seekTo = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    if (!playing) { v.play(); setPlaying(true); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] overflow-hidden">
      {/* Video */}
      <div
        className="relative bg-black aspect-video group cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={media.url}
          poster={media.posterFrame || media.thumbnail}
          className="w-full h-full object-contain"
          preload="metadata"
        />

        {/* Play/Pause overlay */}
        <motion.div
          initial={false}
          animate={{ opacity: hovered || !playing ? 1 : 0 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {!playing && (
            <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Play size={20} className="text-white ml-1" />
            </div>
          )}
        </motion.div>

        {/* Metadata overlay */}
        {media.videoMetadata && (
          <div className="absolute top-2 right-2 flex gap-1.5">
            {[
              `${media.videoMetadata.fps?.toFixed(0)}fps`,
              media.videoMetadata.codec?.toUpperCase(),
            ].filter(Boolean).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/70 text-white/70 border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-3 pt-2.5 pb-2 space-y-2 bg-[var(--bg-surface)]">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1.5 bg-[var(--bg-overlay)] rounded-full cursor-pointer group/progress"
          onClick={seek}
        >
          {/* Filled */}
          <div
            className="absolute top-0 left-0 h-full bg-[var(--accent)] rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--bg-surface)] opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 5px)` }}
          />
          {/* Key moment markers */}
          {keyMoments.map((km, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--amber)] border border-[var(--bg-surface)] cursor-pointer z-10"
              style={{ left: `calc(${(km.timestamp / duration) * 100}% - 3px)` }}
              title={`${formatDuration(km.timestamp)}: ${km.description}`}
              onClick={(e) => { e.stopPropagation(); seekTo(km.timestamp); }}
            />
          ))}
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="p-1 rounded hover:bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            {playing ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <span className="text-[10px] font-mono text-[var(--text-muted)] tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <div className="flex-1" />

          <button onClick={toggleMute} className="p-1 rounded hover:bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>

          <a href={media.url} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <Maximize2 size={12} />
          </a>
        </div>
      </div>

      {/* Key moments timeline */}
      {keyMoments.length > 0 && (
        <div className="border-t border-[var(--border-dim)] px-3 py-2 bg-[var(--bg-deep)]">
          <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Key Moments</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {keyMoments.map((km, i) => (
              <button
                key={i}
                onClick={() => seekTo(km.timestamp)}
                className={cn(
                  'shrink-0 flex items-start gap-1.5 p-2 rounded-lg border text-left transition-all max-w-[140px]',
                  Math.abs(currentTime - km.timestamp) < 3
                    ? 'border-[rgba(0,229,160,0.3)] bg-[var(--accent-dim)]'
                    : 'border-[var(--border-dim)] bg-[var(--bg-surface)] hover:border-[var(--border-subtle)]'
                )}
              >
                <Clock size={9} className="text-[var(--accent)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] font-mono text-[var(--accent)]">{formatDuration(km.timestamp)}</p>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] line-clamp-2 leading-tight">{km.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video metadata */}
      {media.videoMetadata && (
        <div className="border-t border-[var(--border-dim)] grid grid-cols-4 divide-x divide-[var(--border-dim)]">
          {[
            ['Duration', formatDuration(duration)],
            ['Resolution', media.dimensions ? `${media.dimensions.width}x${media.dimensions.height}` : '—'],
            ['FPS', media.videoMetadata.fps?.toFixed(1) || '—'],
            ['Frames', media.videoMetadata.framesExtracted ? `${media.videoMetadata.framesExtracted} extracted` : '—'],
          ].map(([label, value]) => (
            <div key={label} className="px-3 py-2 bg-[var(--bg-deep)]">
              <p className="text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-widest">{label}</p>
              <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}