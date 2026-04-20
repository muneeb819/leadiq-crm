'use client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Key, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <Header title="Settings" subtitle="Manage your account and preferences" />
      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="w-4 h-4" />Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Full Name</Label><Input className="mt-1" defaultValue={user?.name} /></div>
            <div><Label>Email</Label><Input className="mt-1" type="email" defaultValue={user?.email} disabled className="bg-gray-50" /></div>
            <div><Label>Role</Label><Input className="mt-1" defaultValue={user?.role} disabled className="bg-gray-50" /></div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Key className="w-4 h-4" />API Keys</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Anthropic API Key</Label><Input className="mt-1" type="password" placeholder="sk-ant-..." /></div>
            <div><Label>SendGrid API Key</Label><Input className="mt-1" type="password" placeholder="SG...." /></div>
            <div><Label>SerpAPI Key</Label><Input className="mt-1" type="password" placeholder="Your SerpAPI key" /></div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Save API Keys</Button>
            <p className="text-xs text-gray-500">API keys are stored securely and encrypted at rest.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="w-4 h-4" />Notifications</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Notification preferences coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
