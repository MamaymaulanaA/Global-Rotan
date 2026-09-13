'use client';

import { ArrowRight, ClipboardPlus, Eye } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import { toast } from 'sonner';
import { buttonClasses } from '@/components/ui/button';
import { SmartImage } from '@/components/ui/smart-image';
import { Link, useRouter } from '@/i18n/navigation';
import { primaryImage, productBadges, secondaryImage } from '@/lib/product';
import { cn, localized } from '@/lib/utils';
import { useInquiry } from '@/stores/inquiry';
import type { Locale, ProductCardData } from '@/types/domain';
import { FavoriteButton } from './favorite-button';
import { PriceTag } from './price-tag';
import { ProductBadges } from './product-badges';
import { preloadQuickView } from './quick-view-loader';
import { useQuickView } from './use-quick-view';

interface ProductCardProps {
  product: ProductCardData;
  index?: number;
  priority?: boolean;
  sizes?: string;
}

export function ProductCard({ product, index = 0, priority = false, sizes }: ProductCardProps) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const openQuickView = useQuickView((s) => s.open);
  const addItem = useInquiry((s) => s.add);

  const name = localized(product, 'name', locale);
  const category = product.category ? localized(product.category, 'name', locale) : null;
  const image = primaryImage(product);
  const hover = secondaryImage(product);
  const href = `/products/${product.slug}`;

  const addToInquiry = () => {
    // Products with color/size options are configured in Quick View before adding.
    if (product.option_count > 0) {
      openQuickView(product.slug);
      return;
    }
    addItem({
      product_id: product.id,
      slug: product.slug,
      sku: product.sku,
      name_en: product.name_en,
      name_id: product.name_id,
      image_url: image?.url ?? null,
      color_id: null,
      color_name_en: null,
      color_name_id: null,
      color_hex: null,
      size_id: null,
      size_label_en: null,
      size_label_id: null,
      finishing: '',
      quantity: Math.max(1, product.moq),
      note: '',
      unit_price_usd: product.base_price_usd,
      price_idr: product.price_idr,
      price_display_type: product.price_display_type,
      moq: product.moq,
    });
    toast.success(t('addedToInquiry'), {
      description: name,
      action: { label: t('viewInquiry'), onClick: () => router.push('/inquiry') },
    });
  };

  return (
    <article
      className="group @container relative flex h-full flex-col"
      data-reveal
      style={{ '--reveal-delay': `${Math.min(index, 8) * 60}ms` } as CSSProperties}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sand">
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
          <SmartImage
            src={image?.url}
            alt={localized(image, 'alt', locale) || name}
            fill
            priority={priority}
            sizes={sizes ?? '(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw'}
            className={cn('img-zoom object-cover', hover && 'group-hover:opacity-0')}
            fallbackLabel={t('noImage')}
          />
          {hover && (
            <SmartImage
              src={hover.url}
              alt=""
              fill
              sizes={sizes ?? '(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw'}
              className="img-zoom object-cover opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
            />
          )}
        </Link>

        <ProductBadges badges={productBadges(product)} className="pointer-events-none absolute left-2.5 top-2.5 flex max-w-[calc(100%-4rem)] flex-wrap gap-1.5" />

        <div className="absolute right-2 top-2">
          <FavoriteButton productId={product.id} productName={name} />
        </div>

        <button
          type="button"
          onClick={() => openQuickView(product.slug)}
          onPointerEnter={preloadQuickView}
          onFocus={preloadQuickView}
          aria-label={t('quickViewOf', { name })}
          className={cn(
            'absolute bottom-2 right-2 inline-flex size-11 items-center justify-center gap-2 rounded-full border-line bg-surface/95 text-[0.875rem] font-semibold text-ink transition-all duration-300',
            '[@media(hover:hover)]:bottom-3 [@media(hover:hover)]:left-3 [@media(hover:hover)]:right-3 [@media(hover:hover)]:h-11 [@media(hover:hover)]:w-auto [@media(hover:hover)]:rounded-md',
            '[@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:translate-y-0 [@media(hover:hover)]:focus-visible:opacity-100',
            'hover:bg-surface',
          )}
        >
          <Eye className="size-5" strokeWidth={1.75} aria-hidden />
          <span className="hidden [@media(hover:hover)]:inline">{t('quickView')}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {category && <p className="text-[0.75rem] font-medium uppercase tracking-[0.1em] text-muted">{category}</p>}
        <h3 className="mt-1 font-display text-[1.0625rem] font-medium leading-snug text-ink sm:text-[1.125rem]">
          <Link href={href} className="rounded-sm transition-colors hover:text-gold-ink">
            {name}
          </Link>
        </h3>
        <PriceTag usd={product.base_price_usd} idr={product.price_idr} type={product.price_display_type} className="mt-2" />

        <div className="mt-auto grid grid-cols-1 gap-2 pt-4 @[19rem]:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={addToInquiry}
            className={buttonClasses({ variant: 'dark', size: 'sm', className: 'px-3' })}
          >
            <ClipboardPlus className="size-4" strokeWidth={1.9} aria-hidden />
            {t('addToInquiryShort')}
          </button>
          <Link href={href} className={buttonClasses({ variant: 'outline', size: 'sm', className: 'gap-1.5 px-3' })}>
            {t('viewDetails')}
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[4/5] w-full rounded-md" />
      <div className="skeleton mt-4 h-3 w-1/3" />
      <div className="skeleton mt-2 h-5 w-4/5" />
      <div className="skeleton mt-3 h-5 w-2/5" />
      <div className="skeleton mt-4 h-11 w-full" />
    </div>
  );
}
