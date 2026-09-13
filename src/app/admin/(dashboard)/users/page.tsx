import { UserPlus, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { InviteAdminForm, UserRowActions } from '@/components/admin/users-client';
import { AdminPageHeader, Card, EmptyPanel, EmptyRow, formatDate, MobileList, StatusPill, TableWrap, td, th, thead, tr } from '@/components/admin/ui';
import { requireAdminPage } from '@/lib/admin/auth';

export const metadata: Metadata = { title: 'Admin Users' };

export default async function UsersPage() {
  const admin = await requireAdminPage();
  const { data } = await admin.supabase.from('profiles').select('*').order('role').order('created_at');
  const rows = (data ?? []) as { id: string; email: string | null; full_name: string | null; role: string; is_active: boolean; last_sign_in_at: string | null; created_at: string }[];
  const empty = <EmptyPanel icon={Users} title="No users yet" description="Invite an admin using the form." />;

  return (
    <>
      <AdminPageHeader title="Admin Users" description="Only accounts with the admin role and an active status can open this dashboard. Access is also enforced by Row Level Security." />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <TableWrap className="hidden md:block">
            <table className="w-full min-w-[620px]">
              <thead className={thead}>
                <tr>
                  <th className={th}>User</th>
                  <th className={th}>Role</th>
                  <th className={th}>Status</th>
                  <th className={`${th} hidden lg:table-cell`}>Last sign-in</th>
                  <th className={`${th} w-16 text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.length === 0 && <EmptyRow colSpan={5}>{empty}</EmptyRow>}
                {rows.map((u) => (
                  <tr key={u.id} className={tr}>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand text-[0.8125rem] font-semibold uppercase text-ink-soft" aria-hidden>
                          {(u.full_name || u.email || '?').slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{u.full_name || u.email}</p>
                          <p className="truncate text-[0.8125rem] text-muted">
                            {u.email}
                            {u.id === admin.user.id && ' · you'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      <StatusPill status={u.role === 'admin' ? 'new' : 'draft'} label={u.role === 'admin' ? 'Admin' : 'User'} />
                    </td>
                    <td className={td}>
                      <StatusPill status={u.is_active ? 'active' : 'inactive'} label={u.is_active ? 'Active' : 'Deactivated'} />
                    </td>
                    <td className={`${td} hidden whitespace-nowrap text-[0.875rem] text-muted lg:table-cell`}>{formatDate(u.last_sign_in_at, true)}</td>
                    <td className={`${td} text-right`}>
                      {u.id !== admin.user.id && <UserRowActions id={u.id} role={u.role} active={u.is_active} label={u.email ?? 'this user'} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          <MobileList>
            {rows.length === 0 && <li className="rounded-lg border border-line bg-surface">{empty}</li>}
            {rows.map((u) => (
              <li key={u.id} className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand text-[0.8125rem] font-semibold uppercase text-ink-soft" aria-hidden>
                  {(u.full_name || u.email || '?').slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{u.full_name || u.email}</p>
                  <p className="truncate text-[0.8125rem] text-muted">
                    {u.email}
                    {u.id === admin.user.id && ' · you'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusPill status={u.role === 'admin' ? 'new' : 'draft'} label={u.role === 'admin' ? 'Admin' : 'User'} />
                    <StatusPill status={u.is_active ? 'active' : 'inactive'} label={u.is_active ? 'Active' : 'Deactivated'} />
                  </div>
                  <p className="mt-2 text-[0.75rem] text-muted">Last sign-in {formatDate(u.last_sign_in_at, true)}</p>
                </div>
                {u.id !== admin.user.id && <UserRowActions id={u.id} role={u.role} active={u.is_active} label={u.email ?? 'this user'} />}
              </li>
            ))}
          </MobileList>
        </div>

        <Card title="Invite an admin" icon={UserPlus}>
          <InviteAdminForm />
          <p className="mt-4 text-[0.8125rem] text-muted">
            The invitee receives an email from Supabase Auth to set a password. Add <code>/admin/auth/set-password</code> to the allowed redirect URLs in Supabase Authentication settings.
          </p>
        </Card>
      </div>
    </>
  );
}
