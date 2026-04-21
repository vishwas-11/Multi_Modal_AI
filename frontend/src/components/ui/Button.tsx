'use client';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-mono font-medium rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none';

    const variants = {
      primary: 'bg-[var(--accent)] text-[#050507] hover:opacity-90 active:scale-[0.98]',
      secondary: 'bg-[var(--bg-raised)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-overlay)] active:scale-[0.98]',
      ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] active:scale-[0.98]',
      danger: 'bg-transparent text-[var(--status-error)] border border-[var(--status-error)] border-opacity-40 hover:bg-[rgba(255,77,109,0.10)] active:scale-[0.98]',
      outline: 'bg-transparent text-[var(--accent)] border border-[var(--accent)] border-opacity-50 hover:border-opacity-100 hover:bg-[var(--accent-dim)] active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-[11px] h-7',
      md: 'px-4 py-2 text-xs h-8',
      lg: 'px-5 py-2.5 text-sm h-10',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin shrink-0" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;