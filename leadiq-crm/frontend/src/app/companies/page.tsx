'use client';
import useSWR from 'swr';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Globe, Users, ExternalLink } from 'lucide-react';

const fetcher = (url: string) => api.get(url).then(r => r.data.data);

export default function CompaniesPage() {
  const { data: companies, isLoading } = useSWR('/companies', fetcher);

  return (
    <div>
      <Header title="Companies" subtitle="Organizations in your CRM" />
      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(companies || []).map((company: any) => (
              <Card key={company.id} className="hover:border-indigo-300 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    {company.website && (
                      <a href={company.website} target="_blank" className="text-gray-400 hover:text-indigo-600">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{company.industry || 'Unknown industry'}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    {company.size && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{company.size}</span>}
                    {company.domain && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{company.domain}</span>}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-xs text-indigo-600 font-medium">{company._count?.leads || 0} leads</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
