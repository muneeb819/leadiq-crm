'use client';
import { useParams, useRouter } from 'next/navigation';
import { useLead } from '@/hooks/useLeads';
import Header from '@/components/layout/Header';
import LeadScore from '@/components/leads/LeadScore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRelative, getStatusColor } from '@/lib/utils';
import { ArrowLeft, Mail, Linkedin, Github, Building2, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: lead, isLoading, mutate } = useLead(id);
  const [enriching, setEnriching] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [draftingEmail, setDraftingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);

  const handleEnrich = async () => {
    setEnriching(true);
    try { await api.post(`/leads/${id}/enrich`); mutate(); } catch (e) { console.error(e); } finally { setEnriching(false); }
  };

  const handleScore = async () => {
    setScoring(true);
    try { await api.post(`/leads/${id}/score`); mutate(); } catch (e) { console.error(e); } finally { setScoring(false); }
  };

  const handleDraftEmail = async () => {
    setDraftingEmail(true);
    try {
      const { data } = await api.post('/outreach/draft', { leadId: id });
      setEmailDraft(data.data);
    } catch (e) { console.error(e); } finally { setDraftingEmail(false); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
    </div>
  );

  if (!lead) return (
    <div className="p-6 text-center text-gray-500">Lead not found</div>
  );

  return (
    <div>
      <Header title={`${lead.firstName} ${lead.lastName}`} subtitle={lead.title || ''} />
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 -mt-2">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{lead.firstName} {lead.lastName}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{lead.title}</p>
                  </div>
                  <LeadScore score={lead.score} reason={lead.scoreReason} />
                </div>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {lead.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" /> <a href={`mailto:${lead.email}`} className="hover:text-indigo-600">{lead.email}</a>
                  </div>
                )}
                {lead.company && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" /> {lead.company.name}
                  </div>
                )}
                {lead.linkedinUrl && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Linkedin className="w-4 h-4" /> <a href={lead.linkedinUrl} target="_blank" className="hover:text-indigo-600 truncate">{lead.linkedinUrl}</a>
                  </div>
                )}
                {lead.githubUrl && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Github className="w-4 h-4" /> <a href={lead.githubUrl} target="_blank" className="hover:text-indigo-600 truncate">{lead.githubUrl}</a>
                  </div>
                )}
                {lead.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {lead.tags.map((t: string) => <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">{t}</span>)}
                  </div>
                )}
                {lead.notes && <p className="text-gray-600 pt-2 border-t">{lead.notes}</p>}
              </CardContent>
            </Card>

            {/* AI Actions */}
            <Card>
              <CardHeader><CardTitle className="text-base">AI Actions</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleEnrich} disabled={enriching} className="gap-2">
                  {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-500" />}
                  {enriching ? 'Enriching...' : 'Enrich Profile'}
                </Button>
                <Button variant="outline" onClick={handleScore} disabled={scoring} className="gap-2">
                  {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-500" />}
                  {scoring ? 'Scoring...' : 'AI Score'}
                </Button>
                <Button variant="outline" onClick={handleDraftEmail} disabled={draftingEmail} className="gap-2">
                  {draftingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 text-green-500" />}
                  {draftingEmail ? 'Drafting...' : 'Draft Email'}
                </Button>
              </CardContent>
            </Card>

            {emailDraft && (
              <Card className="border-indigo-200">
                <CardHeader><CardTitle className="text-base text-indigo-700">AI Email Draft</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Subject</p>
                    <p className="text-sm font-medium">{emailDraft.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Body</p>
                    <pre className="text-sm whitespace-pre-wrap text-gray-700 font-sans">{emailDraft.body}</pre>
                  </div>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                    <Mail className="w-4 h-4" /> Send Email
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Source</span><span className="font-medium">{lead.source}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Stage</span><span className="font-medium capitalize">{lead.pipelineStage}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Enriched</span><span className={lead.enriched ? 'text-green-600 font-medium' : 'text-gray-500'}>{lead.enriched ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Added</span><span>{formatDate(lead.createdAt)}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
              <CardContent>
                {lead.activities?.length === 0 ? (
                  <p className="text-sm text-gray-500">No activity yet</p>
                ) : (
                  <div className="space-y-3">
                    {lead.activities?.slice(0, 5).map((a: any) => (
                      <div key={a.id} className="text-xs">
                        <p className="font-medium text-gray-700">{a.title}</p>
                        <p className="text-gray-400">{formatRelative(a.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
