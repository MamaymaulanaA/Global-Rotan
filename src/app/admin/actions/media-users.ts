'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbErrorMessage, withAdmin, type AdminResult } from '@/lib/admin/action';
import { logActivity } from '@/lib/admin/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { siteUrl } from '@/lib/utils';

const pathSchema = z
  .string()
  .min(3)
  .max(500)
  .refine((p) => !p.includes('..') && !p.startsWith('/'), 'Invalid path');

export async function deleteMediaFile(path: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!pathSchema.safeParse(path).success) return { ok: false, error: 'Invalid path' };
    const [{ count: productUses }, { data: settings }, { count: categoryUses }] = await Promise.all([
      admin.supabase.from('product_images').select('id', { count: 'exact', head: true }).eq('storage_path', path),
      admin.supabase.from('site_settings').select('key, value'),
      admin.supabase.from('categories').select('id', { count: 'exact', head: true }).ilike('image_url', `%${path}`),
    ]);
    const inSettings = JSON.stringify(settings ?? []).includes(path);
    if ((productUses ?? 0) > 0) return { ok: false, error: 'This image is used by a product. Delete it from the product page instead.' };
    if ((categoryUses ?? 0) > 0 || inSettings) return { ok: false, error: 'This image is used in categories or website settings. Replace it there first.' };
    const { error } = await admin.supabase.storage.from('media').remove([path]);
    if (error) return { ok: false, error: error.message };
    await logActivity(admin, 'delete', 'media', null, `Deleted file ${path}`);
    revalidatePath('/admin/media');
    return { ok: true, data: null, message: 'File deleted' };
  });
}

// ---------------------------------------------------------------------------
// Admin users
// ---------------------------------------------------------------------------
export async function setUserRole(userId: string, role: 'admin' | 'user'): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!z.string().uuid().safeParse(userId).success || !['admin', 'user'].includes(role)) return { ok: false, error: 'Invalid request' };
    if (userId === admin.user.id && role !== 'admin') return { ok: false, error: 'You cannot remove your own admin access.' };
    const { data, error } = await admin.supabase.from('profiles').update({ role }).eq('id', userId).select('email').single();
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, 'role', 'profile', userId, `${(data as { email: string }).email} → ${role}`);
    revalidatePath('/admin/users');
    return { ok: true, data: null, message: role === 'admin' ? 'Admin access granted' : 'Admin access removed' };
  });
}

export async function setUserActive(userId: string, active: boolean): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!z.string().uuid().safeParse(userId).success) return { ok: false, error: 'Invalid request' };
    if (userId === admin.user.id && !active) return { ok: false, error: 'You cannot deactivate your own account.' };
    const { data, error } = await admin.supabase.from('profiles').update({ is_active: active }).eq('id', userId).select('email').single();
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, active ? 'activate' : 'deactivate', 'profile', userId, `${active ? 'Activated' : 'Deactivated'} ${(data as { email: string }).email}`);
    revalidatePath('/admin/users');
    return { ok: true, data: null, message: active ? 'Account activated' : 'Account deactivated' };
  });
}

/** Sends a Supabase invitation email; the new user becomes admin after accepting. Requires the service role key (server only). */
export async function inviteAdmin(email: string, fullName: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    const parsed = z.object({ email: z.string().trim().toLowerCase().email(), fullName: z.string().trim().max(120) }).safeParse({ email, fullName });
    if (!parsed.success) return { ok: false, error: 'Enter a valid email address.' };
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' };

    const service = createServiceClient();
    const { data: existing } = await service.from('profiles').select('id').eq('email', parsed.data.email).maybeSingle();
    let userId = (existing as { id: string } | null)?.id;
    if (!userId) {
      const { data, error } = await service.auth.admin.inviteUserByEmail(parsed.data.email, {
        data: { full_name: parsed.data.fullName },
        redirectTo: siteUrl('/admin/auth/set-password'),
      });
      if (error) return { ok: false, error: error.message };
      userId = data.user?.id;
    }
    if (!userId) return { ok: false, error: 'Could not create the invitation.' };
    const { error: roleError } = await service
      .from('profiles')
      .upsert({ id: userId, email: parsed.data.email, full_name: parsed.data.fullName || null, role: 'admin', is_active: true }, { onConflict: 'id' });
    if (roleError) return { ok: false, error: roleError.message };
    await logActivity(admin, 'invite', 'profile', userId, `Invited ${parsed.data.email} as admin`);
    revalidatePath('/admin/users');
    return { ok: true, data: null, message: existing ? 'Existing user promoted to admin' : 'Invitation sent' };
  });
}
