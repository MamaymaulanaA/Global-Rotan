import 'server-only';
import { cache } from 'react';
import { PAGE_SIZE, type CatalogFilters } from '@/lib/catalog-params';
import { PRICE_BUCKETS } from '@/lib/currency';
import { createPublicClient } from '@/lib/supabase/public';
import type {
  Category,
  Collection,
  Locale,
  ProductCardData,
  ProductDetail,
  Testimonial,
} from '@/types/domain';

export const CARD_SELECT = `
  id, slug, sku, name_en, name_id, short_description_en, short_description_id, category_id, collection_id,
  base_price_usd, price_idr, price_display_type, availability, usage, materials, moq,
  is_featured, is_new, is_best_seller, status, created_at,
  category:categories(id, slug, name_en, name_id),
  images:product_images(id, url, alt_en, alt_id, is_primary, sort_order, color_id),
  color_count:product_colors(count),
  size_count:product_sizes(count)
`;

const DETAIL_SELECT = `
  *,
  category:categories(id, slug, name_en, name_id),
  collection:collections(id, slug, name_en, name_id),
  images:product_images(*),
  colors:product_colors(*),
  sizes:product_sizes(*),
  variants:product_variants(*)
`;

const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

function normalizeCard(row: Record<string, unknown>): ProductCardData {
  const { color_count, size_count, ...rest } = row as { color_count?: { count: number }[]; size_count?: { count: number }[] };
  const product = rest as unknown as ProductCardData;
  const images = [...(product.images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  const colors = Number(color_count?.[0]?.count ?? 0);
  const sizes = Number(size_count?.[0]?.count ?? 0);
  return {
    ...product,
    option_count: colors + sizes,
    base_price_usd: product.base_price_usd == null ? null : Number(product.base_price_usd),
    price_idr: product.price_idr == null ? null : Number(product.price_idr),
    images,
  };
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = createPublicClient();
  const [{ data, error }, counts] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.rpc('category_product_counts'),
  ]);
  if (error) throw error;
  const countMap = new Map(((counts.data ?? []) as { category_id: string; product_count: number }[]).map((c) => [c.category_id, Number(c.product_count)]));
  return ((data ?? []) as Category[]).map((c) => ({ ...c, product_count: countMap.get(c.id) ?? 0 }));
});

export const getCollections = cache(async (): Promise<Collection[]> => {
  const supabase = createPublicClient();
  const [{ data, error }, counts] = await Promise.all([
    supabase.from('collections').select('*').eq('is_active', true).order('sort_order'),
    supabase.rpc('collection_product_counts'),
  ]);
  if (error) throw error;
  const countMap = new Map(((counts.data ?? []) as { collection_id: string; product_count: number }[]).map((c) => [c.collection_id, Number(c.product_count)]));
  return ((data ?? []) as Collection[]).map((c) => ({ ...c, product_count: countMap.get(c.id) ?? 0 }));
});

export const getCollectionBySlug = cache(async (slug: string) => {
  const collections = await getCollections();
  return collections.find((c) => c.slug === slug) ?? null;
});

export async function searchProducts(filters: CatalogFilters, locale: Locale) {
  const supabase = createPublicClient();
  const [categories, collections] = await Promise.all([getCategories(), getCollections()]);

  let query = supabase.from('products').select(CARD_SELECT, { count: 'exact' }).eq('status', 'published');

  if (filters.q) {
    const term = filters.q.toLowerCase().replace(/[%_*\\(),."']/g, ' ').trim();
    if (term) query = query.ilike('search_text', `%${term.replace(/\s+/g, '%')}%`);
  }
  if (filters.categories.length) {
    const ids = categories.filter((c) => filters.categories.includes(c.slug)).map((c) => c.id);
    query = query.in('category_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  }
  if (filters.collections.length) {
    const ids = collections.filter((c) => filters.collections.includes(c.slug)).map((c) => c.id);
    query = query.in('collection_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  }
  if (filters.materials.length) query = query.overlaps('materials', filters.materials);
  if (filters.colors.length) query = query.overlaps('color_families', filters.colors);
  if (filters.usage) query = query.in('usage', [filters.usage, 'both']);
  if (filters.availability) query = query.eq('availability', filters.availability);
  if (filters.price) {
    const bucket = PRICE_BUCKETS.find((b) => b.key === filters.price);
    if (bucket) {
      query = query.not('price_display_type', 'in', '(contact,wholesale_request)').gte('base_price_usd', bucket.min);
      if (bucket.max != null) query = query.lt('base_price_usd', bucket.max);
    }
  }

  switch (filters.sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'name':
      query = query.order(locale === 'id' ? 'name_id' : 'name_en', { ascending: true });
      break;
    case 'price_asc':
      query = query.order('base_price_usd', { ascending: true, nullsFirst: false }).order('name_en');
      break;
    case 'price_desc':
      query = query.order('base_price_usd', { ascending: false, nullsFirst: false }).order('name_en');
      break;
    default:
      query = query
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
  }

  const from = (filters.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) {
    // Requesting a page past the end returns a range error — treat as empty.
    if (error.code === 'PGRST103') return { items: [], total: count ?? 0, page: filters.page, pageCount: 0 };
    throw error;
  }
  const total = count ?? 0;
  return {
    items: (data ?? []).map((row) => normalizeCard(row as Record<string, unknown>)),
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export const getFeaturedProducts = cache(async (limit = 8): Promise<ProductCardData[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('is_best_seller', { ascending: false })
    .order('sort_order')
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => normalizeCard(row as Record<string, unknown>));
});

export async function getProductsByCollection(collectionId: string, limit = 24) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .eq('collection_id', collectionId)
    .order('sort_order')
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => normalizeCard(row as Record<string, unknown>));
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const supabase = createPublicClient();
  const { data, error } = await supabase.from('products').select(DETAIL_SELECT).eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const product = data as unknown as ProductDetail;
  return {
    ...product,
    base_price_usd: product.base_price_usd == null ? null : Number(product.base_price_usd),
    price_idr: product.price_idr == null ? null : Number(product.price_idr),
    finishing_options: Array.isArray(product.finishing_options) ? product.finishing_options : [],
    specs: Array.isArray(product.specs) ? product.specs : [],
    images: [...(product.images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order),
    colors: [...(product.colors ?? [])].sort(bySort),
    sizes: [...(product.sizes ?? [])].sort(bySort),
    variants: [...(product.variants ?? [])]
      .filter((v) => v.is_active)
      .map((v) => ({ ...v, price_adjustment_usd: Number(v.price_adjustment_usd ?? 0) }))
      .sort(bySort),
  };
});

export async function getRelatedProducts(product: Pick<ProductDetail, 'id' | 'category_id' | 'collection_id'>, limit = 4) {
  const supabase = createPublicClient();
  const filters = [product.category_id && `category_id.eq.${product.category_id}`, product.collection_id && `collection_id.eq.${product.collection_id}`]
    .filter(Boolean)
    .join(',');
  let query = supabase.from('products').select(CARD_SELECT).eq('status', 'published').neq('id', product.id);
  if (filters) query = query.or(filters);
  const { data, error } = await query.order('is_featured', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => normalizeCard(row as Record<string, unknown>));
}

export async function getProductsByIds(ids: string[]) {
  const clean = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 60);
  if (!clean.length) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase.from('products').select(CARD_SELECT).eq('status', 'published').in('id', clean);
  if (error) throw error;
  return (data ?? []).map((row) => normalizeCard(row as Record<string, unknown>));
}

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from('testimonials').select('*').eq('is_published', true).order('sort_order').limit(6);
  if (error) throw error;
  return (data ?? []) as Testimonial[];
});

export async function getSitemapEntries() {
  const supabase = createPublicClient();
  const [products, collections] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('status', 'published'),
    supabase.from('collections').select('slug, updated_at').eq('is_active', true),
  ]);
  return {
    products: (products.data ?? []) as { slug: string; updated_at: string }[],
    collections: (collections.data ?? []) as { slug: string; updated_at: string }[],
  };
}
