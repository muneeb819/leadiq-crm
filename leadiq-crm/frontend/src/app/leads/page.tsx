'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import LeadTable from '@/components/leads/LeadTable';
import { useLeads } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Bot } from 'lucide-react';
import api from '@/lib/api';

export default function LeadsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [discovering, setDiscovering] = useState(false);

  const { data, isLoading, mutate } = useLeads({ ...(search && { search }), ...(status && { status }) });
  const leads = data || [];

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      await api.post('/agents/discover', { query: 'SaaS founders and CTOs' });
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div>
      <Header title="Leads" subtitle={`${leads.length} leads in your CRM`} />
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input className="pl-9" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            className="border rounded-md px-3 py-2 text-sm bg-white"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST','NURTURING'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button variant="outline" onClick={() => mutate()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleDiscover} disabled={discovering} className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50">
            <Bot className={`w-4 h-4 ${discovering ? 'animate-spin' : ''}`} />
            {discovering ? 'Discovering...' : 'AI Discover'}
          </Button>
          <Button onClick={() => router.push('/leads/new')} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading leads...</p>
            </div>
          ) : (
            <LeadTable leads={leads} onRefresh={mutate} />
          )}
        </div>
      </div>
    </div>
  );
}
