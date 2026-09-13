'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbErrorMessage, withAdmin, zodFieldErrors, type AdminResult } from '@/lib/admin/action';
import { logActivity } from '@/lib/admin/auth';
import { colorSchema, productSchema, sizeSchema, variantSchema, type ProductInput } from '@/lib/validation/admin';
import { PRODUCT_STATUSES, type ProductStatus } from '@/types/domain';

const uuid = z.string().uuid();

function revalidateCatalog(productId?: string) {
  revalidatePath('/admin/products');
  if (productId) revalidatePath(`/admin/products/${productId}`);
  revalidatePath('/admin/variants');
}

export async function saveProduct(id: string | null, input: ProductInput): Promise<AdminResult<{ id: string }>> {
  return withAdmin(async (admin) => {
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: zodFieldErrors(parsed.error) };
    const values = { ...parsed.data, finishing_options: parsed.data.finishing_options, specs: parsed.data.specs, updated_by: admin.user.id };

    if (id) {
      if (!uuid.safeParse(id).success) return { ok: false, error: 'Invalid product id' };
      const { error } = await admin.supabase.from('products').update(values).eq('id', id);
      if (error) {
        const e = dbErrorMessage(error);
        return { ok: false, error: e.error, fieldErrors: 'field' in e && e.field ? { [e.field]: e.error } : undefined };
      }
      await logActivity(admin, 'update', 'product', id, `Updated product “${values.name_en}”`);
      revalidateCatalog(id);
      return { ok: true, data: { id }, message: 'Product saved' };
    }

    const { data, error } = await admin.supabase
      .from('products')
      .insert({ ...values, created_by: admin.user.id })
      .select('id')
      .single();
    if (error) {
      const e = dbErrorMessage(error);
      return { ok: false, error: e.error, fieldErrors: 'field' in e && e.field ? { [e.field]: e.error } : undefined };
    }
    const newId = (data as { id: string }).id;
    await logActivity(admin, 'create', 'product', newId, `Created product “${values.name_en}”`);
    revalidateCatalog();
    return { ok: true, data: { id: newId }, message: 'Product created' };
  });
}

export async function setProductStatus(id: string, status: ProductStatus): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(id).success || !PRODUCT_STATUSES.includes(status)) return { ok: false, error: 'Invalid request' };
    const { data, error } = await admin.supabase.from('products').update({ status, updated_by: admin.user.id }).eq('id', id).select('name_en').single();
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, status, 'product', id, `Set “${(data as { name_en: string }).name_en}” to ${status}`);
    revalidateCatalog(id);
    return { ok: true, data: null, message: `Product ${status}` };
  });
}

export async function duplicateProduct(id: string): Promise<AdminResult<{ id: string }>> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: 'Invalid product id' };
    const { data, error } = await admin.supabase.rpc('duplicate_product', { p_product_id: id });
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, 'duplicate', 'product', data as string, 'Duplicated a product as draft');
    revalidateCatalog();
    return { ok: true, data: { id: data as string }, message: 'Product duplicated as draft' };
  });
}

/** Safe delete: published products must be archived or set to draft first. Storage files are removed too. */
export async function deleteProduct(id: string, confirmSku: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: 'Invalid product id' };
    const { data: product, error: readError } = await admin.supabase.from('products').select('id, sku, name_en, status').eq('id', id).single();
    if (readError || !product) return { ok: false, error: 'Product not found' };
    const p = product as { id: string; sku: string; name_en: string; status: ProductStatus };
    if (p.status === 'published') return { ok: false, error: 'Archive or unpublish the product before deleting it.' };
    if (confirmSku.trim() !== p.sku) return { ok: false, error: 'Type the exact SKU to confirm deletion.' };

    const { data: images } = await admin.supabase.from('product_images').select('storage_path').eq('product_id', id);
    const paths = ((images ?? []) as { storage_path: string | null }[]).map((i) => i.storage_path).filter((v): v is string => Boolean(v));
    const { error } = await admin.supabase.from('products').delete().eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    if (paths.length) await admin.supabase.storage.from('media').remove(paths);
    await logActivity(admin, 'delete', 'product', id, `Deleted product “${p.name_en}” (${p.sku})`);
    revalidateCatalog();
    return { ok: true, data: null, message: 'Product deleted' };
  });
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------
const imageRowSchema = z.object({
  storage_path: z.string().min(3).max(500),
  url: z.string().url().max(1000),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

export async function addProductImages(productId: string, images: z.infer<typeof imageRowSchema>[]): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(productId).success) return { ok: false, error: 'Invalid product id' };
    const parsed = z.array(imageRowSchema).min(1).max(30).safeParse(images);
    if (!parsed.success) return { ok: false, error: 'Invalid image data' };
    const { data: existing } = await admin.supabase.from('product_images').select('sort_order, is_primary').eq('product_id', productId);
    const rows = (existing ?? []) as { sort_order: number; is_primary: boolean }[];
    const start = rows.reduce((max, r) => Math.max(max, r.sort_order + 1), 0);
    const hasPrimary = rows.some((r) => r.is_primary);
    const { error } = await admin.supabase.from('product_images').insert(
      parsed.data.map((img, i) => ({
        product_id: productId,
        storage_path: img.storage_path,
        url: img.url,
        width: img.width ?? null,
        height: img.height ?? null,
        sort_order: start + i,
        is_primary: !hasPrimary && i === 0,
        created_by: admin.user.id,
      })),
    );
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, 'upload', 'product_image', productId, `Uploaded ${parsed.data.length} image(s)`);
    revalidateCatalog(productId);
    return { ok: true, data: null, message: 'Images uploaded' };
  });
}

export async function updateProductImage(id: string, patch: { alt_en?: string; alt_id?: string; color_id?: string | null }): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    const parsed = z
      .object({ alt_en: z.string().max(200).optional(), alt_id: z.string().max(200).optional(), color_id: z.string().uuid().nullable().optional() })
      .safeParse(patch);
    if (!uuid.safeParse(id).success || !parsed.success) return { ok: false, error: 'Invalid request' };
    const { error } = await admin.supabase.from('product_images').update(parsed.data).eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    return { ok: true, data: null, message: 'Image updated' };
  });
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(productId).success || !uuid.safeParse(imageId).success) return { ok: false, error: 'Invalid request' };
    const { error: clearError } = await admin.supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId).eq('is_primary', true);
    if (clearError) return { ok: false, error: dbErrorMessage(clearError).error };
    const { error } = await admin.supabase.from('product_images').update({ is_primary: true }).eq('id', imageId).eq('product_id', productId);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    revalidateCatalog(productId);
    return { ok: true, data: null, message: 'Primary image updated' };
  });
}

export async function reorderProductImages(productId: string, orderedIds: string[]): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(productId).success || !z.array(uuid).max(60).safeParse(orderedIds).success) return { ok: false, error: 'Invalid request' };
    const results = await Promise.all(
      orderedIds.map((id, index) => admin.supabase.from('product_images').update({ sort_order: index }).eq('id', id).eq('product_id', productId)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return { ok: false, error: dbErrorMessage(failed.error).error };
    revalidateCatalog(productId);
    return { ok: true, data: null };
  });
}

export async function replaceProductImage(id: string, image: z.infer<typeof imageRowSchema>): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    const parsed = imageRowSchema.safeParse(image);
    if (!uuid.safeParse(id).success || !parsed.success) return { ok: false, error: 'Invalid request' };
    const { data: current } = await admin.supabase.from('product_images').select('storage_path, product_id').eq('id', id).single();
    const { error } = await admin.supabase
      .from('product_images')
      .update({ storage_path: parsed.data.storage_path, url: parsed.data.url, width: parsed.data.width ?? null, height: parsed.data.height ?? null })
      .eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    const old = current as { storage_path: string | null; product_id: string } | null;
    if (old?.storage_path && old.storage_path !== parsed.data.storage_path) await admin.supabase.storage.from('media').remove([old.storage_path]);
    await logActivity(admin, 'replace', 'product_image', old?.product_id ?? null, 'Replaced a product image');
    revalidateCatalog(old?.product_id);
    return { ok: true, data: null, message: 'Image replaced' };
  });
}

export async function deleteProductImage(id: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: 'Invalid request' };
    const { data } = await admin.supabase.from('product_images').select('storage_path, product_id, is_primary').eq('id', id).single();
    const row = data as { storage_path: string | null; product_id: string; is_primary: boolean } | null;
    if (!row) return { ok: false, error: 'Image not found' };
    const { error } = await admin.supabase.from('product_images').delete().eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    if (row.storage_path) await admin.supabase.storage.from('media').remove([row.storage_path]);
    if (row.is_primary) {
      const { data: next } = await admin.supabase.from('product_images').select('id').eq('product_id', row.product_id).order('sort_order').limit(1);
      const first = (next ?? [])[0] as { id: string } | undefined;
      if (first) await admin.supabase.from('product_images').update({ is_primary: true }).eq('id', first.id);
    }
    await logActivity(admin, 'delete', 'product_image', row.product_id, 'Deleted a product image');
    revalidateCatalog(row.product_id);
    return { ok: true, data: null, message: 'Image deleted' };
  });
}

// ---------------------------------------------------------------------------
// Colors, sizes, variants
// ---------------------------------------------------------------------------
async function upsertRow(table: 'product_colors' | 'product_sizes' | 'product_variants', schema: z.ZodTypeAny, input: unknown, label: string): Promise<AdminResult<{ id: string }>> {
  return withAdmin(async (admin) => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: zodFieldErrors(parsed.error) };
    const { id, ...values } = parsed.data as { id?: string; product_id: string } & Record<string, unknown>;
    const query = id
      ? admin.supabase.from(table).update(values).eq('id', id).select('id').single()
      : admin.supabase.from(table).insert(values).select('id').single();
    const { data, error } = await query;
    if (error) {
      const message = error.code === '23505' ? `This ${label} combination or SKU already exists.` : dbErrorMessage(error).error;
      return { ok: false, error: message };
    }
    await logActivity(admin, id ? 'update' : 'create', table, (values as { product_id: string }).product_id, `${id ? 'Updated' : 'Added'} ${label}`);
    revalidateCatalog((values as { product_id: string }).product_id);
    return { ok: true, data: { id: (data as { id: string }).id }, message: `${label[0].toUpperCase()}${label.slice(1)} saved` };
  });
}

export async function saveColor(input: z.input<typeof colorSchema>) {
  return upsertRow('product_colors', colorSchema, input, 'color');
}
export async function saveSize(input: z.input<typeof sizeSchema>) {
  return upsertRow('product_sizes', sizeSchema, input, 'size');
}
export async function saveVariant(input: z.input<typeof variantSchema>) {
  return upsertRow('product_variants', variantSchema, input, 'variant');
}

export async function deleteVariantEntity(table: 'product_colors' | 'product_sizes' | 'product_variants', id: string): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!['product_colors', 'product_sizes', 'product_variants'].includes(table) || !uuid.safeParse(id).success) return { ok: false, error: 'Invalid request' };
    const { data, error } = await admin.supabase.from(table).delete().eq('id', id).select('product_id').single();
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    const productId = (data as { product_id: string }).product_id;
    await logActivity(admin, 'delete', table, productId, `Deleted ${table.replace('product_', '').replace(/s$/, '')}`);
    revalidateCatalog(productId);
    return { ok: true, data: null, message: 'Deleted' };
  });
}

/** Creates any missing color × size variants for a product. */
export async function generateVariants(productId: string): Promise<AdminResult<{ created: number }>> {
  return withAdmin(async (admin) => {
    if (!uuid.safeParse(productId).success) return { ok: false, error: 'Invalid product id' };
    const [{ data: product }, { data: colors }, { data: sizes }, { data: variants }] = await Promise.all([
      admin.supabase.from('products').select('sku').eq('id', productId).single(),
      admin.supabase.from('product_colors').select('id, name_en').eq('product_id', productId).order('sort_order'),
      admin.supabase.from('product_sizes').select('id').eq('product_id', productId).order('sort_order'),
      admin.supabase.from('product_variants').select('color_id, size_id').eq('product_id', productId),
    ]);
    const c = ((colors ?? []) as { id: string; name_en: string }[]).map((x) => x) as { id: string | null; name_en: string }[];
    const s = ((sizes ?? []) as { id: string }[]).map((x) => x.id) as (string | null)[];
    const colorList = c.length ? c : [{ id: null, name_en: '' }];
    const sizeList = s.length ? s : [null];
    const existing = new Set(((variants ?? []) as { color_id: string | null; size_id: string | null }[]).map((v) => `${v.color_id}|${v.size_id}`));
    const sku = (product as { sku: string } | null)?.sku ?? 'SKU';
    const rows = [];
    for (const color of colorList) {
      for (const [si, sizeId] of sizeList.entries()) {
        if (color.id == null && sizeId == null) continue;
        if (existing.has(`${color.id}|${sizeId}`)) continue;
        rows.push({
          product_id: productId,
          color_id: color.id,
          size_id: sizeId,
          sku: `${sku}-${color.name_en ? color.name_en.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'STD'}-${si + 1}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
          availability: 'available',
        });
      }
    }
    if (rows.length) {
      const { error } = await admin.supabase.from('product_variants').insert(rows);
      if (error) return { ok: false, error: dbErrorMessage(error).error };
      await logActivity(admin, 'generate', 'product_variants', productId, `Generated ${rows.length} variant(s)`);
    }
    revalidateCatalog(productId);
    return { ok: true, data: { created: rows.length }, message: rows.length ? `${rows.length} variant(s) created` : 'All combinations already exist' };
  });
}
