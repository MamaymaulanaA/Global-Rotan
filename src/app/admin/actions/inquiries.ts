'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbErrorMessage, withAdmin, type AdminResult } from '@/lib/admin/action';
import { logActivity } from '@/lib/admin/auth';
import { INQUIRY_STATUSES, MESSAGE_STATUSES } from '@/types/domain';

const uuid = z.string().uuid();

const quoteSchema = z.object({
  quoted_price: z.union([z.number(), z.string()]).transform((v) => (v === '' || v == null ? null : Number(v))).refine((v) => v == null || v >= 0, 'Invalid price'),
  quoted_currency: z.enum(['USD', 'IDR']).nullable().optional(),
  shipping_estimate: z.union([z.number(), z.string()]).transform((v) => (v === '' || v == null ? null : Number(v))).refine((v) => v == null || v >= 0, 'Invalid amount'),
  quoted_moq: z.union([z.number(), z.string()]).transform((v) => (v === '' || v == null ? null : Math.round(Number(v)))).refine((v) => v == null || v >= 1, 'Invalid MOQ'),
});

export async function updateInquiryStatus(id: string, status: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(id).success || !(INQUIRY_STATUSES as readonly string[]).includes(status)) return { ok: false, error: 'Invalid request' };
    const { data, error } = await admin.supabase.from('inquiries').update({ status }).eq('id', id).select('inquiry_number').single();
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, 'status', 'inquiry', id, `Inquiry ${(data as { inquiry_number: string }).inquiry_number} → ${status.replace(/_/g, ' ')}`);
    revalidatePath('/admin/inquiries');
    revalidatePath(`/admin/inquiries/${id}`);
    return { ok: true, data: null, message: 'Status updated' };
  });
}

export async function saveInquiryQuote(id: string, input: z.input<typeof quoteSchema>): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    const parsed = quoteSchema.safeParse(input);
    if (!uuid.safeParse(id).success || !parsed.success) return { ok: false, error: parsed.success ? 'Invalid request' : parsed.error.issues[0].message };
    const { error } = await admin.supabase.from('inquiries').update(parsed.data).eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, 'quote', 'inquiry', id, 'Updated quotation details');
    revalidatePath(`/admin/inquiries/${id}`);
    return { ok: true, data: null, message: 'Quotation details saved' };
  });
}

export async function addInquiryNote(id: string, body: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    const text = body.trim();
    if (!uuid.safeParse(id).success || text.length < 1 || text.length > 4000) return { ok: false, error: 'Write a note (max 4000 characters).' };
    const { error } = await admin.supabase.from('inquiry_notes').insert({ inquiry_id: id, author_id: admin.user.id, author_email: admin.user.email, body: text });
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    revalidatePath(`/admin/inquiries/${id}`);
    return { ok: true, data: null, message: 'Note added' };
  });
}

export async function toggleInquiryFollowUp(id: string, done: boolean): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: 'Invalid request' };
    const { error } = await admin.supabase
      .from('inquiries')
      .update(done ? { followed_up_at: new Date().toISOString(), followed_up_by: admin.user.id } : { followed_up_at: null, followed_up_by: null })
      .eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, done ? 'followed_up' : 'follow_up_reset', 'inquiry', id, done ? 'Marked inquiry as followed up' : 'Cleared follow-up flag');
    revalidatePath('/admin/inquiries');
    revalidatePath(`/admin/inquiries/${id}`);
    return { ok: true, data: null, message: done ? 'Marked as followed up' : 'Follow-up flag cleared' };
  });
}

export async function archiveInquiry(id: string, archived: boolean): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: 'Invalid request' };
    const { error } = await admin.supabase.from('inquiries').update({ is_archived: archived, archived_at: archived ? new Date().toISOString() : null }).eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, archived ? 'archive' : 'unarchive', 'inquiry', id, archived ? 'Archived inquiry' : 'Restored inquiry');
    revalidatePath('/admin/inquiries');
    revalidatePath(`/admin/inquiries/${id}`);
    return { ok: true, data: null, message: archived ? 'Inquiry archived' : 'Inquiry restored' };
  });
}

export async function updateMessageStatus(id: string, status: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(id).success || !(MESSAGE_STATUSES as readonly string[]).includes(status)) return { ok: false, error: 'Invalid request' };
    const { error } = await admin.supabase.from('contact_messages').update({ status }).eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    revalidatePath('/admin/messages');
    return { ok: true, data: null, message: 'Message updated' };
  });
}

export async function deleteMessage(id: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: 'Invalid request' };
    const { error } = await admin.supabase.from('contact_messages').delete().eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, 'delete', 'message', id, 'Deleted a contact message');
    revalidatePath('/admin/messages');
    return { ok: true, data: null, message: 'Message deleted' };
  });
}
