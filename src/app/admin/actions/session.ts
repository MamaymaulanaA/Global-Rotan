'use server';

import { redirect } from 'next/navigation';
import { getAdmin, logActivity } from '@/lib/admin/auth';
import { createClient } from '@/lib/supabase/server';

export async function verifyAdminSession() {
  const admin = await getAdmin();
  if (!admin) return { ok: false as const };
  await logActivity(admin, 'login', 'session', admin.user.id, `${admin.user.email} signed in`);
  return { ok: true as const };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
