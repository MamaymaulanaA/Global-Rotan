import type { ProductDetail } from '@/types/domain';

const cache = new Map<string, ProductDetail>();

/** Browser-side product detail fetch shared by Quick View, favorites and the inquiry editor. */
export async function fetchProductDetail(slug: string) {
  const cached = cache.get(slug);
  if (cached) return cached;
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()).product as ProductDetail;
  cache.set(slug, data);
  return data;
}
