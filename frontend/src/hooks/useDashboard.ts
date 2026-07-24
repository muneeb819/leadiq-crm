'use client';
import useSWR from 'swr';
import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(r => r.data.data);

export function useDashboard() {
  return useSWR('/analytics/dashboard', fetcher, { refreshInterval: 60000 });
}
