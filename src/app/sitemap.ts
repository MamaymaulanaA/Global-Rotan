import type { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/data/catalog';
import { localePath, siteUrl } from '@/lib/utils';

// Regenerate hourly so new products appear without a redeploy.
export const revalidate = 3600;

const STATIC_PATHS = [
  { path: '/', priority: 1 },
  { path: '/products', priority: 0.9 },
  { path: '/collections', priority: 0.8 },
  { path: '/about', priority: 0.6 },
  { path: '/custom-furniture', priority: 0.7 },
  { path: '/export', priority: 0.7 },
  { path: '/contact', priority: 0.6 },
  { path: '/shipping-export', priority: 0.4 },
  { path: '/privacy-policy', priority: 0.2 },
  { path: '/terms', priority: 0.2 },
];

function entry(path: string, priority: number, lastModified?: string): MetadataRoute.Sitemap[number] {
  return {
    url: siteUrl(localePath('en', path)),
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    priority,
    alternates: {
      languages: {
        en: siteUrl(localePath('en', path)),
        id: siteUrl(localePath('id', path)),
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => entry(p.path, p.priority));
  try {
    const { products, collections } = await getSitemapEntries();
    products.forEach((p) => items.push(entry(`/products/${p.slug}`, 0.8, p.updated_at)));
    collections.forEach((c) => items.push(entry(`/collections/${c.slug}`, 0.7, c.updated_at)));
  } catch (error) {
    console.error('[sitemap]', error);
  }
  return items;
}
