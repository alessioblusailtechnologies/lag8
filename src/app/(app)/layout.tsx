'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/sidebar/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <>
      <Sidebar />
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflowX: 'hidden' }}>
        {children}
      </main>
    </>
  );
}
