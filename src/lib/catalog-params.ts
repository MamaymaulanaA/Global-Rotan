import { PRICE_BUCKETS, type PriceBucketKey } from '@/lib/currency';
import { AVAILABILITIES, COLOR_FAMILIES, MATERIALS, type Availability, type ColorFamily, type Material } from '@/types/domain';

export const SORT_KEYS = ['featured', 'newest', 'name', 'price_asc', 'price_desc'] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export const PAGE_SIZE = 12;

export interface CatalogFilters {
  q: string;
  categories: string[];
  collections: string[];
  materials: Material[];
  colors: ColorFamily[];
  usage: 'indoor' | 'outdoor' | null;
  availability: Availability | null;
  price: PriceBucketKey | null;
  sort: SortKey;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';
const list = (value: string | string[] | undefined) =>
  first(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 20);

export function parseCatalogParams(params: RawParams): CatalogFilters {
  const sort = first(params.sort) as SortKey;
  const usage = first(params.usage);
  const availability = first(params.availability) as Availability;
  const price = first(params.price) as PriceBucketKey;
  const page = Number.parseInt(first(params.page), 10);

  return {
    q: first(params.q).slice(0, 80),
    categories: list(params.category).filter((s) => /^[a-z0-9-]+$/.test(s)),
    collections: list(params.collection).filter((s) => /^[a-z0-9-]+$/.test(s)),
    materials: list(params.material).filter((m): m is Material => (MATERIALS as readonly string[]).includes(m)),
    colors: list(params.color).filter((c): c is ColorFamily => (COLOR_FAMILIES as readonly string[]).includes(c)),
    usage: usage === 'indoor' || usage === 'outdoor' ? usage : null,
    availability: (AVAILABILITIES as readonly string[]).includes(availability) ? availability : null,
    price: PRICE_BUCKETS.some((b) => b.key === price) ? price : null,
    sort: (SORT_KEYS as readonly string[]).includes(sort) ? sort : 'featured',
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 500) : 1,
  };
}

export function filtersToSearchParams(filters: Partial<CatalogFilters>) {
  const sp = new URLSearchParams();
  if (filters.q) sp.set('q', filters.q);
  if (filters.categories?.length) sp.set('category', filters.categories.join(','));
  if (filters.collections?.length) sp.set('collection', filters.collections.join(','));
  if (filters.materials?.length) sp.set('material', filters.materials.join(','));
  if (filters.colors?.length) sp.set('color', filters.colors.join(','));
  if (filters.usage) sp.set('usage', filters.usage);
  if (filters.availability) sp.set('availability', filters.availability);
  if (filters.price) sp.set('price', filters.price);
  if (filters.sort && filters.sort !== 'featured') sp.set('sort', filters.sort);
  if (filters.page && filters.page > 1) sp.set('page', String(filters.page));
  return sp;
}

export function countActiveFilters(filters: CatalogFilters) {
  return (
    filters.categories.length +
    filters.collections.length +
    filters.materials.length +
    filters.colors.length +
    (filters.usage ? 1 : 0) +
    (filters.availability ? 1 : 0) +
    (filters.price ? 1 : 0) +
    (filters.q ? 1 : 0)
  );
}
