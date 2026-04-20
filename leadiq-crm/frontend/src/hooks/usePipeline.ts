'use client';
import useSWR from 'swr';
import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(r => r.data.data);

export function usePipeline() {
  const { data, mutate, isLoading, error } = useSWR('/pipeline', fetcher, { refreshInterval: 30000 });

  const moveLead = async (leadId: string, stage: string) => {
    await api.put('/pipeline/move', { leadId, stage });
    mutate();
  };

  return { data, isLoading, error, moveLead };
}
