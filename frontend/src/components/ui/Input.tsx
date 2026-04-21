'use client';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefix, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-medium">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-[var(--text-muted)]">{prefix}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-[var(--bg-raised)] border rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] transition-colors',
              'focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--bg-overlay)]',
              error ? 'border-[var(--status-error)]' : 'border-[var(--border-default)]',
              prefix && 'pl-9',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-[var(--status-error)]">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;