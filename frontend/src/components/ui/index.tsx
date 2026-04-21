'use client';
import { cn } from '@/lib/utils';
import { AlertTriangle, X } from 'lucide-react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'w-3 h-3 border', md: 'w-4 h-4 border', lg: 'w-6 h-6 border-2' };
  return (
    <span className={cn('rounded-full border-[var(--border-default)] border-t-[var(--accent)] animate-spin', s[size], className)} />
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'error' | 'info';
  className?: string;
}
export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--bg-raised)] text-[var(--text-secondary)] border-[var(--border-dim)]',
    accent:  'bg-[var(--accent-dim)] text-[var(--accent)] border-[rgba(0,229,160,0.2)]',
    warning: 'bg-[var(--amber-dim)] text-[var(--amber)] border-[rgba(245,166,35,0.2)]',
    error:   'bg-[rgba(255,77,109,0.1)] text-[var(--status-error)] border-[rgba(255,77,109,0.2)]',
    info:    'bg-[rgba(56,189,248,0.1)] text-[var(--status-info)] border-[rgba(56,189,248,0.2)]',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium font-mono border', variants[variant], className)}>
      {children}
    </span>
  );
}

// ─── ErrorMessage ─────────────────────────────────────────────────────────────
interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}
export function ErrorMessage({ message, onDismiss, className }: ErrorMessageProps) {
  return (
    <div className={cn(
      'flex items-start gap-2.5 p-3 rounded-lg border border-[rgba(255,77,109,0.25)] bg-[rgba(255,77,109,0.08)]',
      className
    )}>
      <AlertTriangle size={13} className="text-[var(--status-error)] mt-0.5 shrink-0" />
      <p className="text-xs text-[var(--status-error)] flex-1 font-mono">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-[var(--status-error)] opacity-60 hover:opacity-100">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
export function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 font-mono">
        {label}
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-[var(--border-dim)] my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <hr className="flex-1 border-[var(--border-dim)]" />
      <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
      <hr className="flex-1 border-[var(--border-dim)]" />
    </div>
  );
}