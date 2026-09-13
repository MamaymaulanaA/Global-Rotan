'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbErrorMessage, withAdmin, type AdminResult } from '@/lib/admin/action';
import { logActivity } from '@/lib/admin/auth';
import { SETTINGS_KEYS, type SettingsKey } from '@/lib/settings/defaults';

const str = (max = 2000) => z.string().trim().max(max).optional().default('');
const url = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .default('')
  .refine((v) => !v || v.startsWith('/') || /^https?:\/\//.test(v), 'Must be a URL or a path starting with /');

const schemas: Record<SettingsKey, z.ZodTypeAny> = {
  business: z.object({
    name: z.string().trim().min(2).max(120),
    tagline_en: str(300),
    tagline_id: str(300),
    email: z.string().trim().email('Enter a valid email'),
    whatsapp: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ''))
      .refine((v) => v.length >= 8 && v.length <= 15, 'WhatsApp must be 8–15 digits including country code'),
    phone_display: str(60),
    address_en: str(400),
    address_id: str(400),
    maps_url: url,
    hours_en: str(200),
    hours_id: str(200),
    logo_url: url,
    favicon_url: url,
    socials: z.object({ instagram: url, facebook: url, linkedin: url, youtube: url, tiktok: url, pinterest: url }),
    is_demo: z.boolean().default(false),
  }),
  localization: z.object({
    default_language: z.enum(['en', 'id']),
    default_currency: z.enum(['USD', 'IDR']),
    usd_to_idr: z.coerce.number().min(1000, 'Rate looks too low').max(100000, 'Rate looks too high'),
  }),
  announcement: z.object({ enabled: z.boolean(), text_en: str(160), text_id: str(160), link: url }),
  commerce: z.object({
    moq_note_en: str(500),
    moq_note_id: str(500),
    production_info_en: str(800),
    production_info_id: str(800),
    shipping_info_en: str(1500),
    shipping_info_id: str(1500),
  }),
  seo: z.object({ title_en: str(160), title_id: str(160), description_en: str(320), description_id: str(320), og_image: url }),
  whatsapp: z.object({
    general_en: str(1000),
    general_id: str(1000),
    product_en: str(1500),
    product_id: str(1500),
    inquiry_en: str(1500),
    inquiry_id: str(1500),
  }),
  content: z.object({
    home: z.record(z.string(), z.string().max(3000)).default({}),
    about: z.record(z.string(), z.string().max(5000)).default({}),
    about_facts: z.array(z.object({ value: z.string().trim().max(40), label_en: z.string().trim().max(80), label_id: z.string().trim().max(80) })).max(8).default([]),
    custom: z.record(z.string(), z.string().max(3000)).default({}),
    export: z.record(z.string(), z.string().max(3000)).default({}),
    clients: z.array(z.object({ name: z.string().trim().max(80), logo_url: url, is_demo: z.boolean().default(false) })).max(24).default([]),
  }),
};

export async function saveSettings(key: SettingsKey, value: unknown): Promise<AdminResult> {
  return withAdmin(async (admin) => {
    if (!SETTINGS_KEYS.includes(key)) return { ok: false, error: 'Unknown settings group' };
    const parsed = schemas[key].safeParse(value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { ok: false, error: `${issue.path.join('.') || key}: ${issue.message}` };
    }
    const { error } = await admin.supabase
      .from('site_settings')
      .upsert({ key, value: parsed.data, is_public: true, updated_by: admin.user.id }, { onConflict: 'key' });
    if (error) return { ok: false, error: dbErrorMessage(error).error };
    await logActivity(admin, 'update', 'settings', null, `Updated ${key} settings`);
    revalidatePath('/', 'layout');
    return { ok: true, data: null, message: key === 'content' ? 'Content saved' : 'Settings saved' };
  });
}
