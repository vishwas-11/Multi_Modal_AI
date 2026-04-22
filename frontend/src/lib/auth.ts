import Cookies from 'js-cookie';

const TOKEN_KEY = 'token';
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

export const setToken = (token: string): void => {
  Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
};

export const getToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY);
};

export const removeToken = (): void => {
  Cookies.remove(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const parseJwt = (token: string): Record<string, unknown> | null => {
  try {
    const base64 = token.split('.')[1];
    const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  return Date.now() >= (payload.exp as number) * 1000;
};