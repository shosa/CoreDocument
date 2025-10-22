'use client';

// Force tutte le pagine dashboard a rendering dinamico
export const dynamic = 'force-dynamic';

import DashboardLayout from '@/components/Layout/DashboardLayout';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout pubblico - accesso libero senza autenticazione
  return <DashboardLayout>{children}</DashboardLayout>;
}
