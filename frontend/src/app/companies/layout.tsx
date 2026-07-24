'use client';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
