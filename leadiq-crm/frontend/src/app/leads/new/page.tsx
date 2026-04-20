'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', title: '',
    linkedinUrl: '', githubUrl: '', source: 'MANUAL', notes: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/leads', form);
      router.push(`/leads/${data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Add New Lead" subtitle="Manually add a lead to your CRM" />
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Card>
          <CardHeader><CardTitle>Lead Information</CardTitle></CardHeader>
          <CardContent>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name *</Label><Input className="mt-1" value={form.firstName} onChange={set('firstName')} required /></div>
                <div><Label>Last Name *</Label><Input className="mt-1" value={form.lastName} onChange={set('lastName')} required /></div>
              </div>
              <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={set('email')} /></div>
              <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={set('phone')} /></div>
              <div><Label>Job Title</Label><Input className="mt-1" value={form.title} onChange={set('title')} /></div>
              <div><Label>LinkedIn URL</Label><Input className="mt-1" value={form.linkedinUrl} onChange={set('linkedinUrl')} /></div>
              <div><Label>GitHub URL</Label><Input className="mt-1" value={form.githubUrl} onChange={set('githubUrl')} /></div>
              <div>
                <Label>Source</Label>
                <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white" value={form.source} onChange={set('source')}>
                  {['MANUAL','LINKEDIN','GITHUB','PRODUCT_HUNT','SERP','REFERRAL','WEBSITE','OTHER'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Notes</Label>
                <textarea className="mt-1 w-full border rounded-md px-3 py-2 text-sm resize-none" rows={3} value={form.notes} onChange={set('notes')} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? 'Creating...' : 'Create Lead'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
