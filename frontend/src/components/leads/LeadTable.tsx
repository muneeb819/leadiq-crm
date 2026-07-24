'use client';
import Link from 'next/link';
import { formatDate, getStatusColor, getInitials } from '@/lib/utils';
import LeadScore from './LeadScore';
import { Badge } from '@/components/ui/badge';
import { Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useState } from 'react';

interface Props { leads: any[]; onRefresh: () => void; }

export default function LeadTable({ leads, onRefresh }: Props) {
  const [enriching, setEnriching] = useState<string | null>(null);

  const handleEnrich = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setEnriching(id);
    try {
      await api.post(`/leads/${id}/enrich`);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setEnriching(null);
    }
  };

  if (!leads.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">No leads yet</p>
        <p className="text-sm mt-1">Add your first lead or run an AI discovery</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 font-medium text-gray-600">Name</th>
            <th className="text-left p-3 font-medium text-gray-600">Company</th>
            <th className="text-left p-3 font-medium text-gray-600">Status</th>
            <th className="text-left p-3 font-medium text-gray-600">Source</th>
            <th className="text-left p-3 font-medium text-gray-600">Score</th>
            <th className="text-left p-3 font-medium text-gray-600">Added</th>
            <th className="text-left p-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b hover:bg-gray-50 transition-colors">
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                    {getInitials(`${lead.firstName} ${lead.lastName}`)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                    <p className="text-gray-500 text-xs">{lead.title || lead.email || '—'}</p>
                  </div>
                </div>
              </td>
              <td className="p-3 text-gray-600">{lead.company?.name || '—'}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
              </td>
              <td className="p-3 text-gray-600 text-xs">{lead.source}</td>
              <td className="p-3">
                <LeadScore score={lead.score} reason={lead.scoreReason} />
              </td>
              <td className="p-3 text-gray-500 text-xs">{formatDate(lead.createdAt)}</td>
              <td className="p-3">
                <div className="flex items-center gap-1">
                  <Link href={`/leads/${lead.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  {!lead.enriched && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-indigo-600"
                      onClick={(e) => handleEnrich(lead.id, e)}
                      disabled={enriching === lead.id}
                    >
                      <Sparkles className={`w-4 h-4 ${enriching === lead.id ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
