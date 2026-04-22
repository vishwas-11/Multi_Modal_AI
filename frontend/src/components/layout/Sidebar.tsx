'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Film, Mic, FileText, Trash2, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { useMediaStore } from '@/store/useMediaStore';
import { formatFileSize, formatRelativeTime, cn } from '@/lib/utils';
import type { Media } from '@/types';
import toast from 'react-hot-toast';

const TYPE_ICON = {
  image: Camera,
  video: Film,
  audio: Mic,
  document: FileText,
};

interface GalleryItemProps {
  media: Media;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function GalleryItem({ media, selected, onToggle, onDelete }: GalleryItemProps) {
  const Icon = TYPE_ICON[media.type];
  const thumb = media.thumbnail || media.posterFrame;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className={cn(
        'group relative flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all',
        selected
          ? 'bg-[var(--accent-dim)] border border-[rgba(0,229,160,0.2)]'
          : 'border border-transparent hover:bg-[var(--bg-raised)]'
      )}
      onClick={onToggle}
    >
      {/* Thumbnail */}
      <div className="w-9 h-9 rounded bg-[var(--bg-overlay)] border border-[var(--border-dim)] overflow-hidden shrink-0 flex items-center justify-center">
        {thumb ? (
          <img src={thumb} alt={media.originalName} className="w-full h-full object-cover" />
        ) : (
          <Icon size={14} className="text-[var(--text-muted)]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-mono text-[var(--text-secondary)] truncate">{media.originalName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-mono text-[var(--text-muted)]">{formatFileSize(media.size)}</span>
          {media.hasAnalysis && (
            <span className="text-[9px] font-mono text-[var(--accent)]">analyzed</span>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      <div className="shrink-0">
        {selected
          ? <CheckSquare size={13} className="text-[var(--accent)]" />
          : <Square size={13} className="text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
        }
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[rgba(255,77,109,0.15)] text-[var(--text-muted)] hover:text-[var(--status-error)]"
      >
        <Trash2 size={10} />
      </button>
    </motion.div>
  );
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 py-1 mt-2 first:mt-0">
      <span className="text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-[0.15em]">{label}</span>
      <div className="flex-1 h-px bg-[var(--border-dim)]" />
      <span className="text-[9px] font-mono text-[var(--text-muted)]">{count}</span>
    </div>
  );
}

export default function Sidebar() {
  const { gallery, selectedMediaIds, isLoadingGallery, loadGallery, toggleMediaSelection, deleteMedia } = useMediaStore();

  useEffect(() => { loadGallery(); }, [loadGallery]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMedia(id);
      toast.success('File deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const allMedia = [
    ...(gallery?.images || []),
    ...(gallery?.videos || []),
    ...(gallery?.audio || []),
    ...(gallery?.documents || []),
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-dim)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.15em]">Session Files</span>
          {gallery && gallery.total > 0 && (
            <span className="text-[9px] font-mono bg-[var(--bg-raised)] text-[var(--text-muted)] px-1.5 py-0.5 rounded">{gallery.total}</span>
          )}
        </div>
        <button
          onClick={loadGallery}
          className="p-1 rounded hover:bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <RefreshCw size={11} className={isLoadingGallery ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Selected count */}
      <AnimatePresence>
        {selectedMediaIds.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 py-2 bg-[var(--accent-dim)] border-b border-[rgba(0,229,160,0.15)]"
          >
            <p className="text-[10px] font-mono text-[var(--accent)]">
              {selectedMediaIds.length} file{selectedMediaIds.length > 1 ? 's' : ''} selected — included in next message
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoadingGallery && allMedia.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-4 h-4 rounded-full border border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
          </div>
        ) : allMedia.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-[11px] font-mono text-[var(--text-muted)]">No files uploaded</p>
            <p className="text-[10px] font-mono text-[var(--text-dim)]">Files appear here after upload</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <SectionLabel label="Images" count={gallery?.images.length || 0} />
            <AnimatePresence>
              {gallery?.images.map((m) => (
                <GalleryItem key={m.id} media={m} selected={selectedMediaIds.includes(m.id)} onToggle={() => toggleMediaSelection(m.id)} onDelete={() => handleDelete(m.id)} />
              ))}
            </AnimatePresence>

            <SectionLabel label="Videos" count={gallery?.videos.length || 0} />
            <AnimatePresence>
              {gallery?.videos.map((m) => (
                <GalleryItem key={m.id} media={m} selected={selectedMediaIds.includes(m.id)} onToggle={() => toggleMediaSelection(m.id)} onDelete={() => handleDelete(m.id)} />
              ))}
            </AnimatePresence>

            <SectionLabel label="Audio" count={gallery?.audio.length || 0} />
            <AnimatePresence>
              {gallery?.audio.map((m) => (
                <GalleryItem key={m.id} media={m} selected={selectedMediaIds.includes(m.id)} onToggle={() => toggleMediaSelection(m.id)} onDelete={() => handleDelete(m.id)} />
              ))}
            </AnimatePresence>

            <SectionLabel label="Documents" count={gallery?.documents.length || 0} />
            <AnimatePresence>
              {gallery?.documents.map((m) => (
                <GalleryItem key={m.id} media={m} selected={selectedMediaIds.includes(m.id)} onToggle={() => toggleMediaSelection(m.id)} onDelete={() => handleDelete(m.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}