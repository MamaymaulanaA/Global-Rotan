'use client';

import { ArrowRight, ClipboardPlus, RotateCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, ButtonLink } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/misc';
import { QuantityInput } from '@/components/ui/quantity-input';
import { useRouter } from '@/i18n/navigation';
import { localized } from '@/lib/utils';
import { useInquiry } from '@/stores/inquiry';
import type { Locale, ProductDetail } from '@/types/domain';
import { FavoriteButton } from './favorite-button';
import { fetchProductDetail } from './product-detail-client';
import { PriceTag } from './price-tag';
import { ProductGallery } from './product-gallery';
import { ProductOptions } from './product-options';
import { useProductSelection } from './use-product-selection';
import { useQuickView } from './use-quick-view';

export function QuickViewHost() {
  const slug = useQuickView((s) => s.slug);
  const close = useQuickView((s) => s.close);
  const t = useTranslations('quickView');
  const tp = useTranslations('product');
  const tc = useTranslations('common');
  const hostLocale = useLocale() as Locale;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setError(false);
    setProduct(null);
    fetchProductDetail(slug)
      .then((data) => !cancelled && setProduct(data))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  return (
    <Dialog
      open={Boolean(slug)}
      onClose={close}
      title={product ? tp('quickViewOf', { name: localized(product, 'name', hostLocale) }) : tp('quickView')}
      hideTitle
      closeLabel={tc('close')}
      className="sm:max-w-4xl"
    >
      {error ? (
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <p>{t('error')}</p>
          <Button variant="outline" size="sm" icon={<RotateCcw className="size-4" aria-hidden />} onClick={() => setAttempt((a) => a + 1)}>
            {tc('retry')}
          </Button>
        </div>
      ) : !product ? (
        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2" role="status" aria-label={t('loading')}>
          <div className="skeleton aspect-[4/5] w-full" />
          <div className="space-y-4 pt-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-32" />
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-11 w-full" />
          </div>
        </div>
      ) : (
        <QuickViewContent key={product.id} product={product} onDone={close} />
      )}
    </Dialog>
  );
}

function QuickViewContent({ product, onDone }: { product: ProductDetail; onDone: () => void }) {
  const t = useTranslations('product');
  const ta = useTranslations('availability');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const selection = useProductSelection(product);
  const addItem = useInquiry((s) => s.add);
  const name = localized(product, 'name', locale);

  const add = () => {
    if (!selection.available) return;
    addItem(selection.toInquiryItem());
    toast.success(t('addedToInquiry'), {
      description: name,
      action: { label: t('viewInquiry'), onClick: () => router.push('/inquiry') },
    });
    onDone();
  };

  return (
    <div className="grid gap-6 p-4 pt-14 sm:p-6 sm:pt-14 md:grid-cols-[1fr_1.05fr] md:gap-8 md:pt-6">
      <ProductGallery images={selection.images} productName={name} compact />
      <div className="flex min-w-0 flex-col">
        {product.category && <p className="eyebrow">{localized(product.category, 'name', locale)}</p>}
        <h3 className="mt-2 text-h3 pr-8">{name}</h3>
        <p className="mt-1 text-[0.8125rem] text-muted">
          {t('sku')}: <span className="font-medium text-ink-soft">{selection.variant?.sku ?? product.sku}</span>
        </p>
        <PriceTag usd={selection.price} idr={selection.variant ? null : product.price_idr} type={product.price_display_type} size="md" layout="inline" className="mt-4" />
        {product.short_description_en && <p className="mt-3 text-[0.9375rem] leading-relaxed">{localized(product, 'short_description', locale)}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={selection.availability === 'ready_stock' ? 'success' : 'outline'}>{ta(selection.availability)}</Badge>
          <span className="text-[0.8125rem] text-muted">
            {t('minimumOrder')}: {t('moqValue', { count: product.moq })}
          </span>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <ProductOptions product={product} selection={selection} compact />
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <span className="mb-1.5 block text-[0.875rem] font-medium text-ink">{t('quantity')}</span>
            <QuantityInput value={selection.quantity} onChange={selection.setQuantity} labelDecrease={t('decrease')} labelIncrease={t('increase')} ariaLabel={t('quantity')} />
          </div>
          {selection.quantity < product.moq && <p className="basis-full text-[0.8125rem] text-warning">{t('belowMoq', { count: product.moq })}</p>}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={add} disabled={!selection.available} className="flex-1" icon={<ClipboardPlus className="size-5" aria-hidden />}>
            {t('addToInquiry')}
          </Button>
          <FavoriteButton productId={product.id} productName={name} variant="outline" className="size-12 self-start rounded-md sm:self-auto" />
        </div>
        <ButtonLink href={`/products/${product.slug}`} variant="link" onClick={onDone} className="mt-2 self-start" iconRight={<ArrowRight className="size-4" aria-hidden />}>
          {t('fullDetails')}
        </ButtonLink>
      </div>
    </div>
  );
}
