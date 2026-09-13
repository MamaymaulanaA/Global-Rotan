'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';
import { useRecentlyViewed } from '@/stores/recently-viewed';
import type { ProductCardData } from '@/types/domain';
import { ProductCard } from './product-card';

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const t = useTranslations('product');
  const hydrated = useHydrated();
  const ids = useRecentlyViewed((s) => s.ids);
  const [items, setItems] = useState<ProductCardData[]>([]);

  const wanted = ids.filter((id) => id !== excludeId).slice(0, 4);
  const key = wanted.join(',');

  useEffect(() => {
    if (!hydrated || !key) {
      setItems([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/products/by-ids?ids=${key}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items: ProductCardData[] }) => {
        const order = key.split(',');
        setItems([...data.items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [hydrated, key]);

  if (!items.length) return null;

  return (
    <section className="border-t border-line py-14 lg:py-20" aria-labelledby="recently-viewed">
      <h2 id="recently-viewed" className="text-h2">
        {t('recentlyViewed')}
      </h2>
      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {items.map((product, index) => (
          <li key={product.id}>
            <ProductCard product={product} index={index} sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 48vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
