'use client';
import useSWR from 'swr';
import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(r => r.data.data);

export function useLeads(params?: Record<string, any>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return useSWR(`/leads${query}`, fetcher, { refreshInterval: 30000 });
}

export function useLead(id: string) {
  return useSWR(id ? `/leads/${id}` : null, fetcher);
}

export function useLeadStats() {
  return useSWR('/leads/stats', fetcher, { refreshInterval: 60000 });
}
