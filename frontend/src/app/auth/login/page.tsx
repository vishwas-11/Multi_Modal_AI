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

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    try {
      await login(email, password);
      router.push('/app');
    } catch {
      // error shown from store
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center relative overflow-hidden px-4">
      {/* Grid */}
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />

      {/* Orb */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] opacity-15 pointer-events-none">
        <Orb hue={160} forceHoverState backgroundColor="#050507" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded border border-[var(--accent)] flex items-center justify-center">
              <div className="w-3 h-3 bg-[var(--accent)] rounded-sm" />
            </div>
            <span className="font-display text-sm font-bold tracking-wider text-[var(--text-primary)]">
              MODAL<span className="text-[var(--accent)]">AI</span>
            </span>
          </Link>
          <h1 className="mb-1 font-display text-2xl font-bold text-[var(--text-primary)]">Sign in</h1>
          <p className="text-xs text-[var(--text-muted)] font-mono">Access your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
          {error && <ErrorMessage message={error} onDismiss={clearError} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
              placeholder="you@domain.com"
              error={fieldErrors.email}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
              placeholder="••••••••"
              error={fieldErrors.password}
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full mt-2" loading={isLoading} size="lg">
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-5 font-mono">
          No account?{' '}
          <Link href="/auth/register" className="text-[var(--accent)] hover:underline">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
