'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Trash2, Download, RotateCcw, LogOut, Eraser } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { chatApi } from '@/lib/api';
import { formatRelativeTime, truncate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function TopBar() {
  const router = useRouter();
  const [showConversations, setShowConversations] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { conversations, activeConversation, activeConversationId, loadConversation, newConversation, deleteConversation, clearConversation, regenerate, loadConversations } = useChatStore();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleExport = (format: 'md' | 'html') => {
    if (!activeConversationId) return;
    chatApi.exportConversation(activeConversationId, format);
    setShowExport(false);
    toast.success(`Exporting as .${format}`);
  };

  const handleRegenerate = async () => {
    if (!activeConversationId) return;
    try {
      await regenerate(activeConversationId);
      toast.success('Response regenerated');
    } catch {
      toast.error('Regeneration failed');
    }
  };

  const handleClear = async () => {
    if (!activeConversationId) return;
    try {
      await clearConversation(activeConversationId);
      toast.success('Conversation cleared');
    } catch {
      toast.error('Clear failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation(id);
      toast.success('Conversation deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="flex items-center h-11 px-3 border-b border-[var(--border-dim)] bg-[var(--bg-surface)] gap-2">
      {/* New chat */}
      <button
        onClick={() => { newConversation(); setShowConversations(false); }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono rounded-lg border border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <Plus size={11} />
        New
      </button>

      {/* Conversation selector */}
      <div className="relative flex-1 max-w-xs">
        <button
          onClick={() => { setShowConversations((p) => !p); if (!showConversations) loadConversations(); }}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono rounded-lg border w-full transition-colors',
            showConversations
              ? 'border-[var(--border-default)] bg-[var(--bg-raised)] text-[var(--text-secondary)]'
              : 'border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]'
          )}
        >
          <span className="flex-1 text-left truncate">
            {activeConversation?.title || 'Select conversation'}
          </span>
          <ChevronDown size={11} className={cn('transition-transform', showConversations && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {showConversations && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto"
            >
              {conversations.length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] font-mono text-[var(--text-muted)]">No conversations yet</div>
              ) : (
                conversations.map((c, index) => (
                  <div
                    key={`${c.id || 'conversation'}-${c.updatedAt || c.createdAt || index}`}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-[var(--bg-overlay)] transition-colors',
                      activeConversationId === c.id && 'bg-[var(--accent-dim)]'
                    )}
                  >
                    <div className="flex-1 min-w-0" onClick={() => { loadConversation(c.id); setShowConversations(false); }}>
                      <p className="text-[11px] font-mono text-[var(--text-secondary)] truncate">{c.title}</p>
                      <p className="text-[9px] font-mono text-[var(--text-muted)]">{c.messageCount} msgs · {formatRelativeTime(c.updatedAt)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgba(255,77,109,0.15)] text-[var(--text-muted)] hover:text-[var(--status-error)] transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      {activeConversationId && (
        <>
          <button onClick={handleRegenerate} title="Regenerate last response" className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] transition-colors">
            <RotateCcw size={13} />
          </button>
          <button onClick={handleClear} title="Clear conversation" className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] transition-colors">
            <Eraser size={13} />
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExport((p) => !p)}
              title="Export conversation"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] transition-colors"
            >
              <Download size={13} />
            </button>
            <AnimatePresence>
              {showExport && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 overflow-hidden w-36"
                >
                  <button onClick={() => handleExport('md')} className="w-full text-left px-4 py-2.5 text-[11px] font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] transition-colors">Markdown (.md)</button>
                  <button onClick={() => handleExport('html')} className="w-full text-left px-4 py-2.5 text-[11px] font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] transition-colors">HTML (.html)</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* User + logout */}
      <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-dim)]">
        <span className="text-[10px] font-mono text-[var(--text-muted)] hidden sm:block">{user?.name}</span>
        <button onClick={handleLogout} title="Sign out" className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-[rgba(255,77,109,0.08)] transition-colors">
          <LogOut size={13} />
        </button>
      </div>
    </div>
  );
}