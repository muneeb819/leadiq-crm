import { formatRelative } from '@/lib/utils';

interface Props { activities: any[]; }

const typeColors: Record<string, string> = {
  LEAD_CREATED: 'bg-blue-100 text-blue-600',
  LEAD_ENRICHED: 'bg-purple-100 text-purple-600',
  EMAIL_SENT: 'bg-green-100 text-green-600',
  STATUS_CHANGED: 'bg-yellow-100 text-yellow-600',
  NOTE_ADDED: 'bg-gray-100 text-gray-600',
};

export default function ActivityFeed({ activities }: Props) {
  if (!activities?.length) return <p className="text-gray-500 text-sm p-4">No recent activity</p>;
  return (
    <div className="space-y-3 p-4 max-h-80 overflow-y-auto">
      {activities.map((a) => (
        <div key={a.id} className="flex items-start gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 whitespace-nowrap ${typeColors[a.type] || 'bg-gray-100 text-gray-600'}`}>
            {a.type.replace('_', ' ')}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800">{a.title}</p>
            {a.lead && <p className="text-xs text-gray-500">{a.lead.firstName} {a.lead.lastName}</p>}
            <p className="text-xs text-gray-400">{formatRelative(a.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
