'use client';

import { ArrowLeft, ArrowRight, ClipboardList, Info, Pencil, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSite } from '@/components/providers/site-provider';
import { Button, ButtonLink } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState, Notice } from '@/components/ui/misc';
import { QuantityInput } from '@/components/ui/quantity-input';
import { SmartImage } from '@/components/ui/smart-image';
import { useHydrated } from '@/hooks/use-hydrated';
import { Link } from '@/i18n/navigation';
import { hasVisiblePrice, sumLines } from '@/lib/currency';
import { useInquiry, type InquiryItem } from '@/stores/inquiry';
import type { Locale } from '@/types/domain';
import { InquiryItemEditor } from './inquiry-item-editor';

/** Estimated subtotal in the active currency (sum of rounded line totals) plus priced/unpriced counts. */
export function useInquirySummary(items: InquiryItem[]) {
  const { currency, usdToIdr } = useSite();
  const priced = items.filter((i) => hasVisiblePrice(i.price_display_type, i.unit_price_usd));
  const subtotal = sumLines(
    priced.map((i) => ({ usd: Number(i.unit_price_usd), quantity: i.quantity, idr: i.price_idr })),
    currency,
    usdToIdr,
  );
  return { subtotal, pricedCount: priced.length, unpricedCount: items.length - priced.length };
}

export function InquiryItemMeta({ item, locale }: { item: InquiryItem; locale: Locale }) {
  const t = useTranslations('inquiry');
  const rows = [
    item.color_name_en && {
      label: t('color'),
      value: (
        <span className="inline-flex items-center gap-1.5">
          {item.color_hex && <span className="size-3 rounded-full border border-black/10" style={{ backgroundColor: item.color_hex }} aria-hidden />}
          {locale === 'id' ? item.color_name_id : item.color_name_en}
        </span>
      ),
    },
    item.size_label_en && { label: t('size'), value: locale === 'id' ? item.size_label_id : item.size_label_en },
    item.finishing && { label: t('finishing'), value: locale === 'id' ? item.finishing_id || item.finishing : item.finishing },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[];
  if (!rows.length) return null;
  return (
    <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem]">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-1">
          <dt className="text-muted">{r.label}:</dt>
          <dd className="text-ink-soft">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InquiryCartView() {
  const t = useTranslations('inquiry');
  const tp = useTranslations('product');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const { format, formatAmount } = useSite();
  const items = useInquiry((s) => s.items);
  const update = useInquiry((s) => s.update);
  const remove = useInquiry((s) => s.remove);
  const restore = useInquiry((s) => s.restore);
  const clear = useInquiry((s) => s.clear);
  const [editing, setEditing] = useState<InquiryItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const { subtotal, pricedCount, unpricedCount } = useInquirySummary(items);

  if (!hydrated) {
    return (
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_380px]" role="status" aria-label={tc('loading')}>
        <div className="space-y-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="skeleton h-40 w-full" />
          ))}
        </div>
        <div className="skeleton h-72 w-full" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<ClipboardList className="size-6" aria-hidden />}
          title={t('emptyTitle')}
          description={t('emptyText')}
          action={
            <>
              <ButtonLink href="/products">{t('browse')}</ButtonLink>
              <ButtonLink href="/favorites" variant="outline">
                {tn('favorites')}
              </ButtonLink>
            </>
          }
        />
      </div>
    );
  }

  const removeItem = (item: InquiryItem) => {
    const index = items.findIndex((i) => i.key === item.key);
    remove(item.key);
    toast(t('removed'), {
      description: locale === 'id' ? item.name_id : item.name_en,
      action: { label: t('undo'), onClick: () => restore(item, index) },
    });
  };

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:py-14">
      <section aria-labelledby="inquiry-items">
        <div className="flex items-center justify-between gap-3">
          <h2 id="inquiry-items" className="font-sans text-base font-semibold text-ink">
            {t('itemsCount', { count: items.length })}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)} icon={<Trash2 className="size-4" aria-hidden />}>
            {t('clear')}
          </Button>
        </div>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {items.map((item) => {
            const name = locale === 'id' ? item.name_id : item.name_en;
            const priced = hasVisiblePrice(item.price_display_type, item.unit_price_usd);
            return (
              <li key={item.key} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5">
                <Link href={`/products/${item.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand" tabIndex={-1} aria-hidden>
                  <SmartImage src={item.image_url} alt="" fill sizes="112px" className="object-cover" />
                </Link>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-[1.0625rem] leading-snug">
                        <Link href={`/products/${item.slug}`} className="hover:text-gold-ink">
                          {name}
                        </Link>
                      </h3>
                      <p className="mt-0.5 text-[0.8125rem] text-muted">SKU {item.variant_sku ?? item.sku}</p>
                    </div>
                    <div className="flex shrink-0 -mr-2 -mt-2">
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        aria-label={`${t('editItem')}: ${name}`}
                        title={t('editItem')}
                        className="inline-flex size-11 items-center justify-center rounded-md text-ink-soft hover:bg-sand hover:text-ink"
                      >
                        <Pencil className="size-[18px]" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        aria-label={`${t('removeItem')}: ${name}`}
                        title={t('removeItem')}
                        className="inline-flex size-11 items-center justify-center rounded-md text-ink-soft hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-[18px]" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <InquiryItemMeta item={item} locale={locale} />
                  {item.note ? (
                    <p className="mt-2 rounded-sm bg-sand/70 px-2.5 py-1.5 text-[0.8125rem] text-ink-soft">
                      <span className="font-semibold">{t('notes')}:</span> {item.note}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <span className="mb-1 block text-[0.75rem] text-muted">{t('quantity')}</span>
                      <QuantityInput
                        size="sm"
                        value={item.quantity}
                        onChange={(quantity) => update(item.key, { quantity })}
                        labelDecrease={tp('decrease')}
                        labelIncrease={tp('increase')}
                        ariaLabel={`${t('quantity')}: ${name}`}
                      />
                    </div>
                    <div className="text-right">
                      {priced ? (
                        <>
                          <p className="text-[0.75rem] text-muted">
                            {t('indicativePrice')}: {format(item.unit_price_usd, item.price_idr)}
                          </p>
                          <p className="font-semibold tabular-nums text-ink">
                            <span className="sr-only">{t('lineEstimate')}: </span>
                            {format(item.unit_price_usd, item.price_idr, item.quantity)}
                          </p>
                        </>
                      ) : (
                        <p className="text-[0.875rem] font-semibold text-gold-ink">{t('priceOnRequest')}</p>
                      )}
                    </div>
                  </div>
                  {item.quantity < item.moq && <p className="mt-2 text-[0.8125rem] text-warning">{t('belowMoqWarning', { count: item.moq })}</p>}
                </div>
              </li>
            );
          })}
        </ul>
        <ButtonLink href="/products" variant="link" className="mt-4" icon={<ArrowLeft className="size-4" aria-hidden />}>
          {t('continueBrowsing')}
        </ButtonLink>
      </section>

      <aside aria-labelledby="inquiry-summary" className="lg:sticky lg:top-[140px] lg:self-start">
        <div className="rounded-md border border-line bg-surface p-5 sm:p-6">
          <h2 id="inquiry-summary" className="text-h3">
            {t('summaryTitle')}
          </h2>
          <dl className="mt-5 space-y-3 text-[0.9375rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t('itemsCount', { count: items.length })}</dt>
              <dd className="tabular-nums text-ink">{items.reduce((s, i) => s + i.quantity, 0)} pcs</dd>
            </div>
            {pricedCount > 0 && (
              <div className="flex justify-between gap-4 border-t border-line pt-3">
                <dt className="text-ink">{t('estimatedSubtotal')}</dt>
                <dd className="font-semibold tabular-nums text-ink">≈ {formatAmount(subtotal)}</dd>
              </div>
            )}
            {unpricedCount > 0 && <p className="text-[0.8125rem] text-gold-ink">+ {t('unpricedItems', { count: unpricedCount })}</p>}
          </dl>
          <Notice tone="gold" icon={<Info className="size-4" aria-hidden />} className="mt-5">
            {t('disclaimer')}
          </Notice>
          <p className="mt-3 text-[0.8125rem] text-muted">{t('notInvoice')}</p>
          <div className="mt-6 flex flex-col gap-3">
            <ButtonLink href="/request-quote" size="lg" iconRight={<ArrowRight className="size-5" aria-hidden />}>
              {t('proceed')}
            </ButtonLink>
            <ButtonLink href="/products" variant="outline">
              {t('continueBrowsing')}
            </ButtonLink>
          </div>
        </div>
      </aside>

      <InquiryItemEditor item={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
        title={t('clearConfirm')}
        confirmLabel={t('clear')}
        cancelLabel={tc('cancel')}
        closeLabel={tc('close')}
      />
    </div>
  );
}
