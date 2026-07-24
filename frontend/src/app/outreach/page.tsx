'use client';
import useSWR from 'swr';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Mail, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => api.get(url).then(r => r.data.data);

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  OPENED: 'bg-yellow-100 text-yellow-700',
  REPLIED: 'bg-green-100 text-green-700',
  BOUNCED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function OutreachPage() {
  const router = useRouter();
  const { data: outreaches, isLoading } = useSWR('/outreach', fetcher);

  return (
    <div>
      <Header title="Outreach" subtitle="Email campaigns and history" />
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <Button onClick={() => router.push('/outreach/compose')} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Compose Email
          </Button>
        </div>
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : !outreaches?.length ? (
            <div className="p-12 text-center">
              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No outreach yet</p>
              <p className="text-sm text-gray-400 mt-1">Use AI to draft and send personalized emails</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium text-gray-600">Subject</th>
                <th className="text-left p-3 font-medium text-gray-600">Lead</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Sent</th>
              </tr></thead>
              <tbody>
                {outreaches.map((o: any) => (
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{o.subject}</td>
                    <td className="p-3 text-gray-600">{o.lead ? `${o.lead.firstName} ${o.lead.lastName}` : '—'}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || ''}`}>{o.status}</span></td>
                    <td className="p-3 text-gray-500">{o.sentAt ? formatDate(o.sentAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
