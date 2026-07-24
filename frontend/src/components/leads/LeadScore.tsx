import { getScoreColor } from '@/lib/utils';

interface Props { score: number; reason?: string | null; }

export default function LeadScore({ score, reason }: Props) {
  return (
    <div className="group relative inline-flex">
      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${getScoreColor(score)}`}>
        {score}
      </span>
      {reason && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          {reason}
        </div>
      )}
    </div>
  );
}
