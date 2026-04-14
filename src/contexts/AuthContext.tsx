'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  email: string;
}

interface AuthContextType {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  hydrated: boolean;
  userInitials: string;
  userEmail: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER: UserProfile = {
  id: '1',
  full_name: 'Alessio De Vincentis',
  avatar_url: null,
  role: 'procacciatore',
  email: 'alessio@lag8.ai',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lag8_user');
    if (stored) {
      try { setProfile(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setHydrated(true);
  }, []);

  const isAuthenticated = !!profile;

  const userInitials = useMemo(() => {
    if (!profile?.full_name) return '?';
    return profile.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [profile]);

  const userEmail = profile?.email ?? '';

  const login = useCallback(async (email: string, _password: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const user = { ...MOCK_USER, email };
    localStorage.setItem('lag8_user', JSON.stringify(user));
    setProfile(user);
    setLoading(false);
    router.push('/assistente');
  }, [router]);

  const register = useCallback(async (_email: string, _password: string, _fullName?: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lag8_user');
    setProfile(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ profile, isAuthenticated, loading, hydrated, userInitials, userEmail, login, register, logout }),
    [profile, isAuthenticated, loading, hydrated, userInitials, userEmail, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
