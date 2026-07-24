'use client';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Search, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface AgentResult { status: 'success' | 'error'; message: string; data?: any; }

export default function AgentsPage() {
  const [query, setQuery] = useState('SaaS founders in developer tools');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [agentStatus, setAgentStatus] = useState<any>(null);

  const checkHealth = async () => {
    try {
      const { data } = await api.get('/agents/health');
      setAgentStatus(data.data);
    } catch { setAgentStatus({ status: 'unavailable' }); }
  };

  const runDiscovery = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data } = await api.post('/agents/discover', { query });
      setResult({ status: 'success', message: `Discovery complete. Found ${data.data?.count || 0} leads.`, data: data.data });
    } catch (err: any) {
      setResult({ status: 'error', message: err.response?.data?.message || 'Agent failed to run' });
    } finally { setRunning(false); }
  };

  const agents = [
    { name: 'Discovery Agent', desc: 'Finds new leads from GitHub, Product Hunt, SERP, LinkedIn', icon: Search, color: 'text-blue-600 bg-blue-50' },
    { name: 'Enrichment Agent', desc: 'Enriches lead profiles with company data and web research', icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
    { name: 'Scoring Agent', desc: 'Scores leads 0–100 using AI analysis and ICP matching', icon: Bot, color: 'text-yellow-600 bg-yellow-50' },
    { name: 'Outreach Agent', desc: 'Writes personalized cold emails and follow-ups', icon: Sparkles, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div>
      <Header title="AI Agents" subtitle="Autonomous agents powered by Claude" />
      <div className="p-6 space-y-6">
        {/* Agent Status */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={checkHealth} size="sm">Check Agent Status</Button>
          {agentStatus && (
            <span className={`text-sm font-medium ${agentStatus.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {agentStatus.status === 'ok' ? '✅ Agents online' : '❌ Agents offline'}
            </span>
          )}
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {agents.map(({ name, desc, icon: Icon, color }) => (
            <Card key={name}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Discovery Control */}
        <Card>
          <CardHeader><CardTitle className="text-base">Run Lead Discovery</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Search Query</Label>
              <Input className="mt-1" value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. SaaS founders in fintech" />
              <p className="text-xs text-gray-500 mt-1">The AI agent will search GitHub, Product Hunt, and the web for matching leads.</p>
            </div>
            <Button onClick={runDiscovery} disabled={running || !query} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              {running ? 'Running Discovery...' : 'Run Discovery Agent'}
            </Button>

            {result && (
              <div className={`flex items-start gap-3 p-4 rounded-lg ${result.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {result.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                <div>
                  <p className={`text-sm font-medium ${result.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>{result.message}</p>
                  {result.data && <p className="text-xs text-gray-600 mt-1">Check the Leads page to see the newly discovered leads.</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
