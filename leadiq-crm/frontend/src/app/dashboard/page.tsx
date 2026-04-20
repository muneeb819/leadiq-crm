'use client';
import { useDashboard } from '@/hooks/useDashboard';
import KPICard from '@/components/dashboard/KPICard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, Trophy, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1','#f59e0b','#3b82f6','#8b5cf6','#10b981','#ef4444'];

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return (
    <div>
      <Header title="Dashboard" subtitle="Your business development overview" />
      <div className="p-6 grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />)}
      </div>
    </div>
  );

  const stageData = data?.byStage?.map((s: any) => ({ name: s.pipelineStage, count: s._count })) || [];
  const sourceData = data?.bySource?.map((s: any) => ({ name: s.source, count: s._count })) || [];

  return (
    <div>
      <Header title="Dashboard" subtitle="Your business development overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Leads" value={data?.kpis?.totalLeads ?? 0} icon={Users} color="text-indigo-600 bg-indigo-50" subtitle="All time" />
          <KPICard title="New This Week" value={data?.kpis?.newLeadsThisWeek ?? 0} icon={TrendingUp} color="text-blue-600 bg-blue-50" subtitle="Last 7 days" />
          <KPICard title="Won Deals" value={data?.kpis?.wonLeads ?? 0} icon={Trophy} color="text-green-600 bg-green-50" subtitle="Closed won" />
          <KPICard title="Avg Score" value={data?.kpis?.avgScore ?? 0} icon={Star} color="text-yellow-600 bg-yellow-50" subtitle="AI-powered" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Leads by Pipeline Stage</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stageData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Leads by Source</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sourceData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {sourceData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
          <ActivityFeed activities={data?.recentActivities || []} />
        </Card>
      </div>
    </div>
  );
}
