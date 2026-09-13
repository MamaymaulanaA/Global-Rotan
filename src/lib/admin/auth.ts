import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export interface AdminContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email: string };
  profile: { id: string; email: string | null; full_name: string | null; role: string };
}

/** Returns the admin context or null. Uses getUser() (verified with Supabase Auth), never the raw cookie. */
export const getAdmin = cache(async (): Promise<AdminContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', user.id)
    .maybeSingle();
  const row = profile as { id: string; email: string | null; full_name: string | null; role: string; is_active: boolean } | null;
  if (!row || row.role !== 'admin' || !row.is_active) return null;
  return { supabase, user: { id: user.id, email: user.email ?? '' }, profile: row };
});

/** For pages: redirect to login when the visitor is not an active admin. */
export async function requireAdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login?error=unauthorized');
  return admin;
}

export class AdminAuthError extends Error {
  constructor() {
    super('not_authorized');
  }
}

/** For server actions and route handlers: throws when not an active admin. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new AdminAuthError();
  return admin;
}

export async function logActivity(
  admin: AdminContext,
  action: string,
  entityType: string,
  entityId: string | null,
  summary: string,
  metadata: Record<string, unknown> = {},
) {
  await admin.supabase.from('activity_logs').insert({
    actor_id: admin.user.id,
    actor_email: admin.user.email,
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    metadata,
  });
}
