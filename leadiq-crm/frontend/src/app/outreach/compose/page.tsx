'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Send, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function ComposeEmailPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  useEffect(() => {
    api.get('/leads').then(r => setLeads(r.data.data || []));
  }, []);

  const handleDraft = async () => {
    if (!selectedLead) return;
    setDraftLoading(true);
    try {
      const { data } = await api.post('/outreach/draft', { leadId: selectedLead });
      setSubject(data.data.subject || '');
      setBody(data.data.body || '');
    } catch (err) { console.error(err); } finally { setDraftLoading(false); }
  };

  const handleSend = async () => {
    if (!selectedLead || !subject || !body) return;
    setSendLoading(true);
    try {
      await api.post('/outreach/send', { leadId: selectedLead, subject, body });
      router.push('/outreach');
    } catch (err) { console.error(err); } finally { setSendLoading(false); }
  };

  return (
    <div>
      <Header title="Compose Email" subtitle="AI-powered personalized outreach" />
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Card>
          <CardHeader><CardTitle>New Email</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Lead</Label>
              <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white" value={selectedLead} onChange={e => setSelectedLead(e.target.value)}>
                <option value="">Choose a lead...</option>
                {leads.map((l: any) => <option key={l.id} value={l.id}>{l.firstName} {l.lastName} {l.email ? `— ${l.email}` : ''}</option>)}
              </select>
            </div>
            <Button variant="outline" onClick={handleDraft} disabled={!selectedLead || draftLoading} className="gap-2 w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50">
              {draftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {draftLoading ? 'Generating AI draft...' : 'Generate AI Draft'}
            </Button>
            <div><Label>Subject</Label><Input className="mt-1" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." /></div>
            <div>
              <Label>Body</Label>
              <textarea className="mt-1 w-full border rounded-md px-3 py-2 text-sm resize-none font-mono" rows={12} value={body} onChange={e => setBody(e.target.value)} placeholder="Email body..." />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSend} disabled={!selectedLead || !subject || !body || sendLoading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                {sendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendLoading ? 'Sending...' : 'Send Email'}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
