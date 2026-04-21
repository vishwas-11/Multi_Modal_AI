'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/index';
import dynamic from 'next/dynamic';

const Orb = dynamic(() => import('@/components/effects/Orb'), { ssr: false });

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errs.password = 'Must contain uppercase, lowercase, and number';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    try {
      await register(form.name, form.email, form.password);
      router.push('/app');
    } catch {
      // error shown from store
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] opacity-15 pointer-events-none">
        <Orb hue={160} forceHoverState backgroundColor="#050507" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded border border-[var(--accent)] flex items-center justify-center">
              <div className="w-3 h-3 bg-[var(--accent)] rounded-sm" />
            </div>
            <span className="font-display text-sm font-bold tracking-wider text-[var(--text-primary)]">
              MODAL<span className="text-[var(--accent)]">AI</span>
            </span>
          </Link>
          <h1 className="mb-1 font-display text-2xl font-bold text-[var(--text-primary)]">Create account</h1>
          <p className="text-xs text-[var(--text-muted)] font-mono">Start analyzing media with AI</p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
          {error && <ErrorMessage message={error} onDismiss={clearError} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" error={fieldErrors.name} autoComplete="name" />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@domain.com" error={fieldErrors.email} autoComplete="email" />
            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 chars, A-z, 0-9" error={fieldErrors.password} autoComplete="new-password" />
            <Input label="Confirm Password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" error={fieldErrors.confirm} autoComplete="new-password" />

            {/* Password strength hint */}
            {form.password.length > 0 && (
              <div className="flex gap-1">
                {[
                  form.password.length >= 8,
                  /[A-Z]/.test(form.password),
                  /[a-z]/.test(form.password),
                  /\d/.test(form.password),
                ].map((ok, i) => (
                  <div key={i} className={`h-0.5 flex-1 rounded transition-colors ${ok ? 'bg-[var(--accent)]' : 'bg-[var(--border-dim)]'}`} />
                ))}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" loading={isLoading} size="lg">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-5 font-mono">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
