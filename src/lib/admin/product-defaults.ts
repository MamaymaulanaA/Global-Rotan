import type { ProductInput } from '@/lib/validation/admin';

export const EMPTY_PRODUCT: ProductInput = {
  name_en: '',
  name_id: '',
  slug: '',
  sku: '',
  short_description_en: '',
  short_description_id: '',
  description_en: '',
  description_id: '',
  category_id: '',
  collection_id: '',
  base_price_usd: null,
  price_idr: null,
  price_display_type: 'starting_from',
  materials: [],
  material_detail_en: '',
  material_detail_id: '',
  finishing_en: '',
  finishing_id: '',
  finishing_options: [],
  usage: 'indoor',
  width_cm: null,
  depth_cm: null,
  height_cm: null,
  seat_height_cm: null,
  weight_kg: null,
  specs: [],
  moq: 1,
  lead_time_min_weeks: null,
  lead_time_max_weeks: null,
  availability: 'made_to_order',
  care_en: '',
  care_id: '',
  customization_en: '',
  customization_id: '',
  is_featured: false,
  is_new: true,
  is_best_seller: false,
  status: 'draft',
  sort_order: 0,
  seo_title_en: '',
  seo_title_id: '',
  meta_description_en: '',
  meta_description_id: '',
};

/** Convert a database row into form values (nulls → empty strings for text inputs). */
export function productToForm(row: Record<string, unknown>): ProductInput {
  const result: Record<string, unknown> = { ...EMPTY_PRODUCT };
  for (const key of Object.keys(EMPTY_PRODUCT)) {
    const value = row[key];
    const fallback = (EMPTY_PRODUCT as Record<string, unknown>)[key];
    if (value === null || value === undefined) result[key] = typeof fallback === 'string' ? '' : fallback;
    else if (typeof fallback === 'string' || fallback === null) result[key] = typeof value === 'number' || typeof value === 'string' ? value : String(value);
    else result[key] = value;
  }
  return result as ProductInput;
}
