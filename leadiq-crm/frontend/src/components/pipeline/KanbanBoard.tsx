'use client';
import { useState } from 'react';
import { PIPELINE_STAGES } from '@/lib/constants';
import { getInitials, getStatusColor } from '@/lib/utils';
import { Building2 } from 'lucide-react';
import LeadScore from '@/components/leads/LeadScore';

interface Props { data: any; onMove: (leadId: string, stage: string) => Promise<void>; }

export default function KanbanBoard({ data, onMove }: Props) {
  const [dragging, setDragging] = useState<string | null>(null);

  if (!data) return <div className="p-8 text-center text-gray-500">Loading pipeline...</div>;

  const handleDrop = async (e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    if (dragging) {
      await onMove(dragging, stageName);
      setDragging(null);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
      {PIPELINE_STAGES.map((stage) => {
        const leads: any[] = data.pipeline?.[stage.id] || [];
        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-64 bg-gray-50 rounded-lg border"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="font-medium text-sm text-gray-800">{stage.label}</span>
              </div>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{leads.length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => setDragging(lead.id)}
                  className="bg-white rounded-lg border p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {getInitials(`${lead.firstName} ${lead.lastName}`)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{lead.title || '—'}</p>
                    </div>
                    <LeadScore score={lead.score} />
                  </div>
                  {lead.company && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Building2 className="w-3 h-3" />
                      {lead.company.name}
                    </div>
                  )}
                </div>
              ))}
              {leads.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400">Drop leads here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
