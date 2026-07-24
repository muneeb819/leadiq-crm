'use client';
import { usePipeline } from '@/hooks/usePipeline';
import KanbanBoard from '@/components/pipeline/KanbanBoard';
import Header from '@/components/layout/Header';

export default function PipelinePage() {
  const { data, isLoading, moveLead } = usePipeline();

  return (
    <div>
      <Header title="Pipeline" subtitle="Drag and drop leads between stages" />
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <KanbanBoard data={data} onMove={moveLead} />
        )}
      </div>
    </div>
  );
}
