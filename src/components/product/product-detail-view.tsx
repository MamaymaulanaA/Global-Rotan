'use client';

import { ClipboardPlus, Clock, MessageCircle, MessageSquareText, Package, Share2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useMemo } from 'react';
import { toast } from 'sonner';
import { useSite } from '@/components/providers/site-provider';
import { Button, ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import { QuantityInput } from '@/components/ui/quantity-input';
import { Link, useRouter } from '@/i18n/navigation';
import { localized, localePath } from '@/lib/utils';
import { fillTemplate, whatsappUrl } from '@/lib/whatsapp';
import { useContactContext } from '@/stores/contact-context';
import { useInquiry } from '@/stores/inquiry';
import { useRecentlyViewed } from '@/stores/recently-viewed';
import type { Locale, ProductDetail } from '@/types/domain';
import { FavoriteButton } from './favorite-button';
import { PriceTag } from './price-tag';
import { ProductGallery } from './product-gallery';
import { ProductOptions } from './product-options';
import { useProductSelection } from './use-product-selection';

export function ProductDetailView({ product, siteOrigin }: { product: ProductDetail; siteOrigin: string }) {
  const t = useTranslations('product');
  const ta = useTranslations('availability');
  const tp = useTranslations('price');
  const tc = useTranslations('common');
  const tb = useTranslations('badges');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { whatsapp, whatsappTemplates } = useSite();
  const selection = useProductSelection(product);
  const addItem = useInquiry((s) => s.add);
  const pushRecent = useRecentlyViewed((s) => s.push);
  const setProductMessage = useContactContext((s) => s.setProductMessage);
  const qtyId = useId();
  const moqId = useId();

  const name = localized(product, 'name', locale);
  const productUrl = `${siteOrigin}${localePath(locale, `/products/${product.slug}`)}`;

  const leadTime =
    product.lead_time_min_weeks != null && product.lead_time_max_weeks != null
      ? product.lead_time_min_weeks === product.lead_time_max_weeks
        ? ta('leadTimeSingle', { weeks: product.lead_time_max_weeks })
        : ta('leadTimeRange', { min: product.lead_time_min_weeks, max: product.lead_time_max_weeks })
      : ta('leadTimeOnRequest');

  const whatsappMessage = useMemo(() => {
    const template = (locale === 'id' ? whatsappTemplates.product_id : whatsappTemplates.product_en) ?? '';
    return fillTemplate(template, {
      product_name: name,
      sku: selection.variant?.sku ?? product.sku,
      url: productUrl,
      color: selection.color ? localized(selection.color, 'name', locale) : t('whatsappFallback'),
      size: selection.size ? localized(selection.size, 'label', locale) : t('whatsappFallback'),
      quantity: selection.quantity,
    });
  }, [locale, whatsappTemplates, name, selection.variant, selection.color, selection.size, selection.quantity, product.sku, productUrl, t]);

  useEffect(() => {
    pushRecent(product.id);
  }, [product.id, pushRecent]);

  useEffect(() => {
    setProductMessage(whatsappMessage);
    return () => setProductMessage(null);
  }, [whatsappMessage, setProductMessage]);

  const add = () => {
    if (!selection.available) return;
    addItem(selection.toInquiryItem());
    toast.success(t('addedToInquiry'), {
      description: `${name} × ${selection.quantity}`,
      action: { label: t('viewInquiry'), onClick: () => router.push('/inquiry') },
    });
  };

  const share = async () => {
    const data = { title: name, text: t('shareText', { name }), url: productUrl };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(productUrl);
      toast.success(tc('linkCopied'));
    } catch {
      // user cancelled share
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
      <div className="lg:sticky lg:top-[140px] lg:self-start">
        <ProductGallery images={selection.images} productName={name} priority />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {product.category && (
            <Link href={`/products?category=${product.category.slug}`} className="eyebrow inline-flex min-h-11 items-center hover:underline">
              {localized(product.category, 'name', locale)}
            </Link>
          )}
          {product.collection && (
            <>
              <span className="text-line-strong" aria-hidden>
                /
              </span>
              <Link href={`/collections/${product.collection.slug}`} className="inline-flex min-h-11 items-center text-[0.8125rem] text-muted hover:text-ink">
                {localized(product.collection, 'name', locale)}
              </Link>
            </>
          )}
        </div>
        <h1 className="text-h1 mt-2">{name}</h1>
        <p className="mt-2 text-[0.875rem] text-muted">
          {t('sku')}: <span className="font-medium text-ink-soft">{selection.variant?.sku ?? product.sku}</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {product.is_new && <Badge tone="dark">{tb('new')}</Badge>}
          {product.is_best_seller && <Badge tone="gold">{tb('best_seller')}</Badge>}
          <Badge tone={selection.availability === 'ready_stock' ? 'success' : 'outline'}>{ta(selection.availability)}</Badge>
        </div>

        <div className="mt-5 border-y border-line py-5">
          <PriceTag usd={selection.price} idr={selection.variant && selection.variant.price_adjustment_usd ? null : product.price_idr} type={product.price_display_type} size="lg" />
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">{tp('disclaimer')}</p>
        </div>

        {localized(product, 'short_description', locale) && <p className="text-lead mt-5">{localized(product, 'short_description', locale)}</p>}

        <dl className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-line bg-surface px-4 py-3">
            <dt className="flex items-center gap-2 text-[0.8125rem] text-muted">
              <Package className="size-4" aria-hidden /> {t('minimumOrder')}
            </dt>
            <dd id={moqId} className="mt-1 font-semibold text-ink">
              {t('moqValue', { count: product.moq })}
            </dd>
          </div>
          <div className="rounded-md border border-line bg-surface px-4 py-3">
            <dt className="flex items-center gap-2 text-[0.8125rem] text-muted">
              <Clock className="size-4" aria-hidden /> {t('leadTime')}
            </dt>
            <dd className="mt-1 font-semibold text-ink">{leadTime}</dd>
          </div>
        </dl>

        <div className="mt-7">
          <ProductOptions product={product} selection={selection} />
        </div>

        <div className="mt-6">
          <label htmlFor={qtyId} className="mb-1.5 block text-[0.875rem] font-medium text-ink">
            {t('quantity')}
          </label>
          <QuantityInput
            id={qtyId}
            value={selection.quantity}
            onChange={selection.setQuantity}
            labelDecrease={t('decrease')}
            labelIncrease={t('increase')}
            describedBy={moqId}
          />
          {selection.quantity < product.moq && (
            <p className="mt-2 text-[0.8125rem] text-warning" role="status">
              {t('belowMoq', { count: product.moq })}
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={add} disabled={!selection.available} className="flex-1" icon={<ClipboardPlus className="size-5" aria-hidden />}>
            {t('addToInquiry')}
          </Button>
          <FavoriteButton productId={product.id} productName={name} withLabel className="min-h-[3.25rem]" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ButtonLink href={`/contact?topic=product&product=${product.slug}`} variant="outline" icon={<MessageSquareText className="size-4" aria-hidden />}>
            {t('askAbout')}
          </ButtonLink>
          <a
            href={whatsappUrl(whatsapp, whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-success/50 px-5 text-center text-[0.9375rem] font-semibold text-success transition-colors hover:bg-success-soft"
          >
            <MessageCircle className="size-4" aria-hidden />
            {t('whatsapp')}
          </a>
        </div>
        <button type="button" onClick={share} className="mt-4 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-semibold text-ink-soft hover:text-ink">
          <Share2 className="size-4" aria-hidden />
          {t('share')}
        </button>
      </div>
    </div>
  );
}
