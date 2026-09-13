'use client';

import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSite } from '@/components/providers/site-provider';
import { formatMoney, convertPrice } from '@/lib/currency';
import { isColorSelectable, isSizeSelectable } from '@/lib/product';
import { cn, formatDims, localized } from '@/lib/utils';
import type { Locale, ProductDetail } from '@/types/domain';
import type { useProductSelection } from './use-product-selection';

type Selection = ReturnType<typeof useProductSelection>;

// Option chips: always 1px border; right padding is reserved for the check icon so selecting never resizes the chip.
const optionChip = 'relative flex min-h-control-sm max-w-full rounded-md border pl-3.5 pr-8 text-left text-ink transition-colors duration-200';
const optionIdle = 'border-field-border bg-surface hover:border-field-border-hover';
const optionSelected = 'border-ink bg-selected-soft';
const optionDisabled = 'cursor-not-allowed border-dashed border-line bg-transparent text-muted hover:border-line';

export function ProductOptions({ product, selection, compact = false }: { product: ProductDetail; selection: Selection; compact?: boolean }) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;
  const { currency, usdToIdr } = useSite();

  const adjustmentFor = (colorId: string | null, sizeId: string | null) => {
    const variant = product.variants.find((v) => v.is_active && v.color_id === colorId && v.size_id === sizeId);
    const amount = Number(variant?.price_adjustment_usd ?? 0);
    if (!amount || product.price_display_type === 'contact' || product.price_display_type === 'wholesale_request') return null;
    return t('priceAdjustment', { amount: formatMoney(convertPrice(amount, currency, usdToIdr), currency) });
  };

  return (
    <div className={cn('flex flex-col', compact ? 'gap-5' : 'gap-6')}>
      {product.colors.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-[0.875rem] font-medium text-ink">
            {t('color')}:{' '}
            <span className="font-normal text-body">{selection.color ? localized(selection.color, 'name', locale) : t('selectOption')}</span>
          </legend>
          <div role="radiogroup" aria-label={t('color')} className="flex flex-wrap gap-2">
            {product.colors.map((color) => {
              const selected = selection.colorId === color.id;
              const enabled = isColorSelectable(product, color.id, selection.sizeId);
              const name = localized(color, 'name', locale);
              return (
                <button
                  key={color.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={!enabled}
                  aria-label={enabled ? name : `${name} — ${t('unavailableCombo')}`}
                  title={enabled ? name : `${name} — ${t('unavailableCombo')}`}
                  onClick={() => enabled && selection.selectColor(color.id)}
                  className={cn(
                    'relative inline-flex size-11 items-center justify-center rounded-full border bg-surface transition-colors duration-200',
                    selected ? 'border-ink' : 'border-line hover:border-field-border-hover',
                    !enabled && 'cursor-not-allowed border-dashed opacity-50 hover:border-line',
                  )}
                >
                  <span className="block size-[2.125rem] rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
                  {selected && (
                    <Check
                      className={cn('absolute size-4', ['white', 'natural', 'honey'].includes(color.family) ? 'text-ink' : 'text-white')}
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  )}
                  {!enabled && <span className="absolute h-px w-9 rotate-45 bg-ink/70" aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {product.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-[0.875rem] font-medium text-ink">{t('size')}</legend>
          <div role="radiogroup" aria-label={t('size')} className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const selected = selection.sizeId === size.id;
              const enabled = isSizeSelectable(product, size.id, selection.colorId);
              const label = localized(size, 'label', locale);
              const dims = formatDims(size, 'cm');
              const adjustment = adjustmentFor(null, size.id) ?? adjustmentFor(selection.colorId, size.id);
              return (
                <button
                  key={size.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={!enabled}
                  onClick={() => enabled && selection.selectSize(size.id)}
                  className={cn(optionChip, selected ? optionSelected : optionIdle, !enabled && optionDisabled, 'flex-col items-start py-1.5')}
                >
                  <span className="text-[0.875rem] font-semibold leading-snug">
                    <span className={cn(!enabled && 'line-through')}>{label}</span>
                    {adjustment && enabled && <span className="ml-1.5 whitespace-nowrap font-normal text-muted">{adjustment}</span>}
                  </span>
                  {!compact && dims && <span className="text-[0.75rem] leading-snug text-muted">{dims}</span>}
                  {selected && <Check className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gold-ink" strokeWidth={2.75} aria-hidden />}
                  {!enabled && <span className="sr-only">{t('unavailableCombo')}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {product.finishing_options.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-[0.875rem] font-medium text-ink">{t('finishing')}</legend>
          <div role="radiogroup" aria-label={t('finishing')} className="flex flex-wrap gap-2">
            {product.finishing_options.map((option) => {
              const selected = selection.finishing === option.en;
              return (
                <button
                  key={option.en}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selection.setFinishing(option.en)}
                  className={cn(optionChip, selected ? optionSelected : optionIdle, 'items-center text-[0.875rem] font-medium')}
                >
                  {locale === 'id' ? option.id || option.en : option.en}
                  {selected && <Check className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gold-ink" strokeWidth={2.75} aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {!selection.available && (
        <p role="status" className="rounded-md bg-danger-soft px-3 py-2 text-[0.875rem] text-danger">
          {t('variantUnavailable')}
        </p>
      )}
    </div>
  );
}
