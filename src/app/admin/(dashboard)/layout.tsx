import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { SIDEBAR_COOKIE } from '@/lib/admin/constants';
import { requireAdminPage } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();
  const [inquiries, messages, cookieStore] = await Promise.all([
    admin.supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new').eq('is_archived', false),
    admin.supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    cookies(),
  ]);

  return (
    <AdminShell
      email={admin.user.email}
      badges={{ inquiries: inquiries.count ?? 0, messages: messages.count ?? 0 }}
      initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === 'collapsed'}
    >
      {children}
    </AdminShell>
  );
}
