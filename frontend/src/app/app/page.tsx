'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { useMediaStore } from '@/store/useMediaStore';
import TopBar from '@/components/layout/TopBar';
import Sidebar from '@/components/layout/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import MediaPreview from '@/components/media/MediaPreview';
import ComparisonView from '@/components/analysis/ComparisonView';
import MediaUploader from '@/components/media/MediaUploader';
import { PanelLeftClose, PanelLeftOpen, Columns2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Media } from '@/types';

type RightPanel = 'chat' | 'preview' | 'compare';

export default function AppPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanel, setRightPanel] = useState<RightPanel>('chat');
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
  const { gallery, selectedMediaIds, loadGallery, updateMediaInGallery } = useMediaStore();

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const allMedia = [
    ...(gallery?.images || []),
    ...(gallery?.videos || []),
    ...(gallery?.audio || []),
    ...(gallery?.documents || []),
  ];

  // Keep preview media in sync with sidebar selection/gallery.
  useEffect(() => {
    if (selectedMediaIds.length > 0) {
      const selected = allMedia.find((item) => selectedMediaIds.includes(item.id));
      if (selected) {
        setPreviewMedia(selected);
      }
      return;
    }

    if (!previewMedia && allMedia.length > 0) {
      setPreviewMedia(allMedia[0]);
    }
  }, [allMedia, selectedMediaIds, previewMedia]);

  // Auto-switch to compare when 2+ selected
  useEffect(() => {
    if (selectedMediaIds.length >= 2 && rightPanel === 'chat') {
      // Don't auto-switch, just indicate
    }
  }, [selectedMediaIds, rightPanel]);

  return (
    <div className="h-screen bg-[var(--bg-void)] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar toggle button */}
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-4 h-10 bg-[var(--bg-raised)] border border-[var(--border-dim)] border-l-0 rounded-r flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose size={10} /> : <PanelLeftOpen size={10} />}
        </button>

        {/* Left Sidebar — media gallery */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="border-r border-[var(--border-dim)] bg-[var(--bg-surface)] flex flex-col overflow-hidden shrink-0"
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center — chat + right panel switcher */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Panel switcher bar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[var(--border-dim)] bg-[var(--bg-deep)]">
            {[
              { id: 'chat' as RightPanel, label: 'Chat' },
              { id: 'preview' as RightPanel, label: 'Preview' },
              { id: 'compare' as RightPanel, label: `Compare${selectedMediaIds.length >= 2 ? ` (${selectedMediaIds.length})` : ''}` },
            ].map(({ id, label, disabled }) => (
              <button
                key={id}
                onClick={() => !disabled && setRightPanel(id)}
                disabled={disabled}
                className={cn(
                  'px-3 py-1 text-[10px] font-mono rounded transition-colors',
                  rightPanel === id
                    ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    : disabled
                      ? 'text-[var(--text-dim)] cursor-not-allowed'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                )}
              >
                {label}
              </button>
            ))}

            <div className="flex-1" />

            {/* Quick upload toggle */}
            <button
              onClick={() => setShowUploadPanel((p) => !p)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono border transition-colors',
                showUploadPanel
                  ? 'bg-[var(--accent-dim)] border-[rgba(0,229,160,0.2)] text-[var(--accent)]'
                  : 'border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]'
              )}
            >
              <Upload size={9} />
              Upload
            </button>
          </div>

          {/* Upload panel */}
          <AnimatePresence>
            {showUploadPanel && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden border-b border-[var(--border-dim)] bg-[var(--bg-surface)]"
              >
                <div className="p-4">
                  <MediaUploader
                    onUploaded={(media) => {
                      if (media.length > 0) {
                        setPreviewMedia(media[0]);
                        setRightPanel('preview');
                        setShowUploadPanel(false);
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main panel content */}
          <div className="flex-1 overflow-hidden">
            {rightPanel === 'chat' && <ChatWindow />}

            {rightPanel === 'preview' && previewMedia && (
              <div className="h-full overflow-y-auto p-4">
                <MediaPreview
                  media={previewMedia}
                  onAnalysisUpdate={(updated) => {
                    setPreviewMedia(updated);
                    updateMediaInGallery(updated);
                  }}
                />
              </div>
            )}
            {rightPanel === 'preview' && !previewMedia && (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center space-y-2">
                  <p className="text-[11px] font-mono text-[var(--text-muted)]">No media to preview yet</p>
                  <p className="text-[10px] font-mono text-[var(--text-dim)]">Upload a file or select one from Session Files</p>
                </div>
              </div>
            )}

            {rightPanel === 'compare' && selectedMediaIds.length >= 2 && (
              <div className="h-full overflow-hidden">
                <ComparisonView
                  mediaIds={selectedMediaIds}
                  onClose={() => setRightPanel('chat')}
                />
              </div>
            )}
            {rightPanel === 'compare' && selectedMediaIds.length < 2 && (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center space-y-2">
                  <p className="text-[11px] font-mono text-[var(--text-muted)]">Select at least 2 files to compare</p>
                  <p className="text-[10px] font-mono text-[var(--text-dim)]">Use Session Files on the left to pick multiple media items</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}