'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbErrorMessage, withAdmin, zodFieldErrors, type AdminResult } from '@/lib/admin/action';
import { logActivity } from '@/lib/admin/auth';
import { categorySchema, collectionSchema, testimonialSchema } from '@/lib/validation/admin';

const uuid = z.string().uuid();
type Table = 'categories' | 'collections' | 'testimonials';
const schemas = { categories: categorySchema, collections: collectionSchema, testimonials: testimonialSchema } as const;
const labels = { categories: 'category', collections: 'collection', testimonials: 'testimonial' } as const;

export async function saveTaxonomy(table: Table, input: Record<string, unknown>): Promise<AdminResult<{ id: string }>> {
  return withAdmin(async (admin) => {
    if (!(table in schemas)) return { ok: false, error: 'Invalid request' };
    const parsed = schemas[table].safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: zodFieldErrors(parsed.error) };
    const { id, ...values } = parsed.data as { id?: string } & Record<string, unknown>;
    const query = id
      ? admin.supabase.from(table).update(values).eq('id', id).select('id').single()
      : admin.supabase.from(table).insert(table === 'testimonials' ? values : { ...values, created_by: admin.user.id }).select('id').single();
    const { data, error } = await query;
    if (error) {
      const e = dbErrorMessage(error);
      return { ok: false, error: e.error, fieldErrors: 'field' in e && e.field ? { [e.field]: e.error } : undefined };
    }
    const rowId = (data as { id: string }).id;
    const name = (values.name_en ?? values.author_name) as string;
    await logActivity(admin, id ? 'update' : 'create', labels[table], rowId, `${id ? 'Updated' : 'Created'} ${labels[table]} “${name}”`);
    revalidatePath(`/admin/${table}`);
    return { ok: true, data: { id: rowId }, message: `${labels[table][0].toUpperCase()}${labels[table].slice(1)} saved` };
  });
}

export async function deleteTaxonomy(table: Table, id: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!(table in schemas) || !uuid.safeParse(id).success) return { ok: false, error: 'Invalid request' };
    if (table !== 'testimonials') {
      const column = table === 'categories' ? 'category_id' : 'collection_id';
      const { count } = await admin.supabase.from('products').select('id', { count: 'exact', head: true }).eq(column, id);
      if ((count ?? 0) > 0) {
        return { ok: false, error: `This ${labels[table]} is used by ${count} product(s). Move those products or deactivate it instead.` };
      }
    }
    const { error } = await admin.supabase.from(table).delete().eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, 'delete', labels[table], id, `Deleted a ${labels[table]}`);
    revalidatePath(`/admin/${table}`);
    return { ok: true, data: null, message: 'Deleted' };
  });
}
