'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { ProductOptions } from '@/components/product/product-options';
import { PriceTag } from '@/components/product/price-tag';
import { fetchProductDetail } from '@/components/product/product-detail-client';
import { useProductSelection } from '@/components/product/use-product-selection';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/form';
import { QuantityInput } from '@/components/ui/quantity-input';
import { localized } from '@/lib/utils';
import { useInquiry, type InquiryItem } from '@/stores/inquiry';
import type { Locale, ProductDetail } from '@/types/domain';

export function InquiryItemEditor({ item, onClose }: { item: InquiryItem | null; onClose: () => void }) {
  const t = useTranslations('inquiry');
  const tc = useTranslations('common');
  const tq = useTranslations('quickView');
  const locale = useLocale() as Locale;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!item) return;
    setProduct(null);
    setError(false);
    fetchProductDetail(item.slug)
      .then(setProduct)
      .catch(() => setError(true));
  }, [item]);

  return (
    <Dialog
      open={Boolean(item)}
      onClose={onClose}
      title={item ? `${t('editItem')}: ${locale === 'id' ? item.name_id : item.name_en}` : t('editItem')}
      closeLabel={tc('close')}
      className="sm:max-w-xl"
    >
      {error ? (
        <p className="px-6 py-10 text-center">{tq('error')}</p>
      ) : !product || !item ? (
        <div className="space-y-4 p-6" role="status" aria-label={tq('loading')}>
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      ) : (
        <EditorForm key={item.key} product={product} item={item} onClose={onClose} locale={locale} />
      )}
    </Dialog>
  );
}

function EditorForm({ product, item, onClose, locale }: { product: ProductDetail; item: InquiryItem; onClose: () => void; locale: Locale }) {
  const t = useTranslations('inquiry');
  const tp = useTranslations('product');
  const update = useInquiry((s) => s.update);
  const selection = useProductSelection(product, {
    colorId: item.color_id,
    sizeId: item.size_id,
    finishing: item.finishing,
    quantity: item.quantity,
  });
  const [note, setNote] = useState(item.note);
  const noteId = useId();

  const save = () => {
    if (!selection.available) return;
    const next = selection.toInquiryItem(note.trim());
    update(item.key, next);
    toast.success(tp('updatedInquiry'), { description: localized(product, 'name', locale) });
    onClose();
  };

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <PriceTag usd={selection.price} type={product.price_display_type} layout="inline" size="md" />
      <ProductOptions product={product} selection={selection} compact />
      <div>
        <span className="mb-1.5 block text-[0.875rem] font-medium text-ink">{t('quantity')}</span>
        <QuantityInput value={selection.quantity} onChange={selection.setQuantity} labelDecrease={tp('decrease')} labelIncrease={tp('increase')} ariaLabel={t('quantity')} />
        {selection.quantity < product.moq && <p className="mt-2 text-[0.8125rem] text-warning">{t('belowMoqWarning', { count: product.moq })}</p>}
      </div>
      <div>
        <label htmlFor={noteId} className="mb-1.5 block text-[0.875rem] font-medium text-ink">
          {t('notes')}
        </label>
        <Textarea id={noteId} value={note} maxLength={1000} rows={3} onChange={(e) => setNote(e.target.value)} placeholder={t('notesPlaceholder')} />
      </div>
      <Button onClick={save} disabled={!selection.available} className="w-full">
        {t('saveItem')}
      </Button>
    </div>
  );
}
