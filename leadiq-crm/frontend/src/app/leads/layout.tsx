'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { AuthContext, useAuthProvider } from '@/hooks/useAuth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.user) router.push('/auth/login');
  }, [auth.loading, auth.user, router]);

  if (auth.loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!auth.user) return null;

  return (
    <AuthContext.Provider value={auth}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AuthContext.Provider>
  );
}
