'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import api from '@/lib/api';

interface User { id: string; email: string; name: string; role: string; }
interface AuthCtx { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void; }

export const AuthContext = createContext<AuthCtx>({ user: null, loading: true, login: async () => {}, logout: () => {} });

export function useAuth() { return useContext(AuthContext); }

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me').then(r => setUser(r.data.data)).catch(() => localStorage.clear()).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
  };

  const logout = () => { localStorage.clear(); setUser(null); window.location.href = '/auth/login'; };

  return { user, loading, login, logout };
}
