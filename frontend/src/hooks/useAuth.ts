'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { isAuthenticated } from '@/lib/auth';

export const useAuth = (redirectTo = '/auth/login') => {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      router.replace(redirectTo);
    }
  }, [user, router, redirectTo]);

  return { user, isAuth: isAuthenticated() };
};

export const useGuestOnly = (redirectTo = '/app') => {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);
};