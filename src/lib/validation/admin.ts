import { z } from 'zod';
import {
  AVAILABILITIES,
  COLOR_FAMILIES,
  MATERIALS,
  PRICE_DISPLAY_TYPES,
  PRODUCT_STATUSES,
  USAGES,
  VARIANT_AVAILABILITIES,
} from '@/types/domain';

const optText = (max = 5000) => z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));
const optNumber = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => (v === '' || v == null ? null : Number(v)))
  .refine((v) => v == null || (Number.isFinite(v) && v >= 0), 'Must be a positive number');
const slug = z
  .string()
  .trim()
  .min(2, 'Slug is required')
  .max(90)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');
const uuidOrNull = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v == null || /^[0-9a-f-]{36}$/i.test(v), 'Invalid id');

export const productSchema = z
  .object({
    name_en: z.string().trim().min(2, 'English name is required').max(160),
    name_id: z.string().trim().min(2, 'Indonesian name is required').max(160),
    slug,
    sku: z.string().trim().min(2, 'SKU is required').max(60).regex(/^[A-Za-z0-9._-]+$/, 'Letters, numbers, dot, dash or underscore'),
    short_description_en: optText(400),
    short_description_id: optText(400),
    description_en: optText(),
    description_id: optText(),
    category_id: uuidOrNull,
    collection_id: uuidOrNull,
    base_price_usd: optNumber,
    price_idr: optNumber,
    price_display_type: z.enum(PRICE_DISPLAY_TYPES),
    materials: z.array(z.enum(MATERIALS)).default([]),
    material_detail_en: optText(600),
    material_detail_id: optText(600),
    finishing_en: optText(300),
    finishing_id: optText(300),
    finishing_options: z.array(z.object({ en: z.string().trim().min(1).max(120), id: z.string().trim().max(120) })).max(20).default([]),
    usage: z.enum(USAGES),
    width_cm: optNumber,
    depth_cm: optNumber,
    height_cm: optNumber,
    seat_height_cm: optNumber,
    weight_kg: optNumber,
    specs: z
      .array(z.object({ label_en: z.string().trim().min(1).max(80), label_id: z.string().trim().max(80), value_en: z.string().trim().min(1).max(200), value_id: z.string().trim().max(200) }))
      .max(30)
      .default([]),
    moq: z.coerce.number().int().min(1, 'Minimum 1'),
    lead_time_min_weeks: optNumber,
    lead_time_max_weeks: optNumber,
    availability: z.enum(AVAILABILITIES),
    care_en: optText(),
    care_id: optText(),
    customization_en: optText(),
    customization_id: optText(),
    is_featured: z.boolean().default(false),
    is_new: z.boolean().default(false),
    is_best_seller: z.boolean().default(false),
    status: z.enum(PRODUCT_STATUSES),
    sort_order: z.coerce.number().int().default(0),
    seo_title_en: optText(160),
    seo_title_id: optText(160),
    meta_description_en: optText(320),
    meta_description_id: optText(320),
  })
  .refine(
    (v) => v.lead_time_min_weeks == null || v.lead_time_max_weeks == null || v.lead_time_min_weeks <= v.lead_time_max_weeks,
    { path: ['lead_time_max_weeks'], message: 'Must be greater than or equal to minimum' },
  )
  .refine((v) => v.price_display_type === 'contact' || v.price_display_type === 'wholesale_request' || v.base_price_usd != null, {
    path: ['base_price_usd'],
    message: 'Base price is required for this price display type',
  });
export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;

export const categorySchema = z.object({
  id: z.string().optional(),
  slug,
  name_en: z.string().trim().min(2).max(120),
  name_id: z.string().trim().min(2).max(120),
  description_en: optText(400),
  description_id: optText(400),
  image_url: optText(1000),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export const collectionSchema = categorySchema.extend({
  tagline_en: optText(200),
  tagline_id: optText(200),
  description_en: optText(2000),
  description_id: optText(2000),
  is_featured: z.boolean().default(false),
});

export const colorSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().uuid(),
  name_en: z.string().trim().min(1).max(80),
  name_id: z.string().trim().min(1).max(80),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a 6-digit hex color'),
  family: z.enum(COLOR_FAMILIES),
  sort_order: z.coerce.number().int().default(0),
});

export const sizeSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().uuid(),
  label_en: z.string().trim().min(1).max(80),
  label_id: z.string().trim().min(1).max(80),
  width_cm: optNumber,
  depth_cm: optNumber,
  height_cm: optNumber,
  sort_order: z.coerce.number().int().default(0),
});

export const variantSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().uuid(),
  color_id: uuidOrNull,
  size_id: uuidOrNull,
  sku: optText(80),
  material_en: optText(120),
  material_id: optText(120),
  finishing_en: optText(120),
  finishing_id: optText(120),
  price_adjustment_usd: z.coerce.number().default(0),
  availability: z.enum(VARIANT_AVAILABILITIES),
  stock_quantity: optNumber,
  image_id: uuidOrNull,
  is_active: z.boolean().default(true),
});

export const testimonialSchema = z.object({
  id: z.string().optional(),
  author_name: z.string().trim().min(2).max(120),
  author_role_en: optText(120),
  author_role_id: optText(120),
  company_name: optText(120),
  country: optText(80),
  quote_en: z.string().trim().min(5).max(800),
  quote_id: z.string().trim().min(5).max(800),
  rating: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((v) => (v === '' || v == null ? null : Number(v)))
    .refine((v) => v == null || (Number.isInteger(v) && v >= 1 && v <= 5), 'Rating must be between 1 and 5'),
  avatar_url: optText(1000),
  is_demo: z.boolean().default(false),
  is_published: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
