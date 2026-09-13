'use client';

import { ArrowRight, ClipboardPlus, Heart, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PriceTag } from '@/components/product/price-tag';
import { fetchProductDetail } from '@/components/product/product-detail-client';
import { Button, ButtonLink } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Badge, EmptyState, Notice } from '@/components/ui/misc';
import { SmartImage } from '@/components/ui/smart-image';
import { useHydrated } from '@/hooks/use-hydrated';
import { Link, useRouter } from '@/i18n/navigation';
import { defaultSelection, findVariant, imagesForColor, primaryImage, unitPrice } from '@/lib/product';
import { localized } from '@/lib/utils';
import { useFavorites } from '@/stores/favorites';
import { useInquiry } from '@/stores/inquiry';
import type { Locale, ProductCardData } from '@/types/domain';

export function FavoritesView() {
  const t = useTranslations('favorites');
  const tp = useTranslations('product');
  const ta = useTranslations('availability');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const ids = useFavorites((s) => s.ids);
  const remove = useFavorites((s) => s.remove);
  const clear = useFavorites((s) => s.clear);
  const addItem = useInquiry((s) => s.add);
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const key = ids.join(',');

  useEffect(() => {
    if (!hydrated) return;
    if (!key) {
      setProducts([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/products/by-ids?ids=${key}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items: ProductCardData[] }) => {
        const order = key.split(',');
        setProducts([...data.items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)));
        setMissing(data.items.length < order.length);
      })
      .catch(() => setProducts((prev) => prev ?? []));
    return () => controller.abort();
  }, [hydrated, key]);

  const moveToInquiry = async (product: ProductCardData) => {
    setMoving(product.id);
    try {
      const detail = await fetchProductDetail(product.slug);
      const { colorId, sizeId } = defaultSelection(detail);
      const variant = findVariant(detail.variants, colorId, sizeId);
      const color = detail.colors.find((c) => c.id === colorId) ?? null;
      const size = detail.sizes.find((s) => s.id === sizeId) ?? null;
      addItem({
        product_id: detail.id,
        slug: detail.slug,
        sku: detail.sku,
        variant_sku: variant?.sku ?? null,
        name_en: detail.name_en,
        name_id: detail.name_id,
        image_url: imagesForColor(detail.images, colorId)[0]?.url ?? null,
        color_id: colorId,
        color_name_en: color?.name_en ?? null,
        color_name_id: color?.name_id ?? null,
        color_hex: color?.hex ?? null,
        size_id: sizeId,
        size_label_en: size?.label_en ?? null,
        size_label_id: size?.label_id ?? null,
        finishing: detail.finishing_options[0]?.en ?? '',
        finishing_id: detail.finishing_options[0]?.id ?? null,
        quantity: Math.max(1, detail.moq),
        note: '',
        unit_price_usd: unitPrice(detail, variant),
        price_idr: variant && Number(variant.price_adjustment_usd) ? null : detail.price_idr,
        price_display_type: detail.price_display_type,
        moq: detail.moq,
      });
      remove(product.id);
      toast.success(t('movedToInquiry'), {
        description: localized(product, 'name', locale),
        action: { label: tp('viewInquiry'), onClick: () => router.push('/inquiry') },
      });
    } catch {
      toast.error(tp('notFound'));
    } finally {
      setMoving(null);
    }
  };

  if (!hydrated || products === null) {
    return (
      <div className="container-page py-10" role="status" aria-label={tc('loading')}>
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className="flex gap-4 rounded-md border border-line bg-surface p-4">
              <div className="skeleton aspect-[4/5] w-28 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-5 w-1/2" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<Heart className="size-6" aria-hidden />}
          title={t('emptyTitle')}
          description={t('emptyText')}
          action={<ButtonLink href="/products">{t('browse')}</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-ink" aria-live="polite">
          {t('count', { count: products.length })}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)} icon={<Trash2 className="size-4" aria-hidden />}>
          {t('clearAll')}
        </Button>
      </div>
      {missing && (
        <Notice tone="info" className="mt-4">
          {t('unavailable')}
        </Notice>
      )}
      <ul className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const name = localized(product, 'name', locale);
          const image = primaryImage(product);
          return (
            <li key={product.id} className="flex gap-4 rounded-md border border-line bg-surface p-3 sm:p-4">
              <Link href={`/products/${product.slug}`} className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-sm bg-sand sm:w-32" tabIndex={-1} aria-hidden>
                <SmartImage src={image?.url} alt="" fill sizes="130px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                {product.category && <p className="text-[0.75rem] uppercase tracking-[0.1em] text-muted">{localized(product.category, 'name', locale)}</p>}
                <h2 className="mt-0.5 font-display text-[1.0625rem] leading-snug">
                  <Link href={`/products/${product.slug}`} className="hover:text-gold-ink">
                    {name}
                  </Link>
                </h2>
                <PriceTag usd={product.base_price_usd} idr={product.price_idr} type={product.price_display_type} className="mt-1.5" />
                <div className="mt-2">
                  <Badge tone={product.availability === 'ready_stock' ? 'success' : 'outline'}>{ta(product.availability)}</Badge>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-1 pt-3">
                  <Button size="sm" variant="dark" loading={moving === product.id} onClick={() => moveToInquiry(product)} icon={<ClipboardPlus className="size-4" aria-hidden />} className="w-full whitespace-nowrap px-3 sm:w-auto">
                    {t('moveToInquiry')}
                  </Button>
                  <Link href={`/products/${product.slug}`} className="inline-flex min-h-11 items-center gap-1 px-2 text-[0.875rem] font-semibold text-ink hover:underline">
                    {tp('viewDetails')} <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    aria-label={`${t('remove')}: ${name}`}
                    className="ml-auto inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-sand hover:text-danger"
                  >
                    <Trash2 className="size-[18px]" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
        title={t('clearConfirm')}
        confirmLabel={t('clearAll')}
        cancelLabel={tc('cancel')}
        closeLabel={tc('close')}
      />
    </div>
  );
}
