'use client';

import { useMemo, useState } from 'react';
import { defaultSelection, findVariant, imagesForColor, isComboAvailable, unitPrice } from '@/lib/product';
import type { NewInquiryItem } from '@/stores/inquiry';
import type { ProductDetail } from '@/types/domain';

export function useProductSelection(product: ProductDetail, initial?: { colorId?: string | null; sizeId?: string | null; finishing?: string; quantity?: number }) {
  const defaults = useMemo(() => defaultSelection(product), [product]);
  const [colorId, setColorId] = useState<string | null>(initial?.colorId ?? defaults.colorId);
  const [sizeId, setSizeId] = useState<string | null>(initial?.sizeId ?? defaults.sizeId);
  const [finishing, setFinishing] = useState<string>(initial?.finishing ?? product.finishing_options[0]?.en ?? '');
  const [quantity, setQuantity] = useState<number>(initial?.quantity ?? Math.max(1, product.moq));

  const variant = useMemo(() => findVariant(product.variants, colorId, sizeId), [product.variants, colorId, sizeId]);
  const available = isComboAvailable(product.variants, colorId, sizeId);
  const price = unitPrice(product, variant);
  const color = product.colors.find((c) => c.id === colorId) ?? null;
  const size = product.sizes.find((s) => s.id === sizeId) ?? null;
  const images = useMemo(() => imagesForColor(product.images, colorId), [product.images, colorId]);
  const availability = variant?.availability === 'made_to_order' ? 'made_to_order' : product.availability;

  const selectColor = (id: string) => {
    setColorId(id);
    // Keep the size if still valid, otherwise pick the first valid one.
    if (sizeId && !isComboAvailable(product.variants, id, sizeId)) {
      const next = product.sizes.find((s) => isComboAvailable(product.variants, id, s.id));
      if (next) setSizeId(next.id);
    }
  };

  const selectSize = (id: string) => {
    setSizeId(id);
    if (colorId && !isComboAvailable(product.variants, colorId, id)) {
      const next = product.colors.find((c) => isComboAvailable(product.variants, c.id, id));
      if (next) setColorId(next.id);
    }
  };

  const finishingOption = product.finishing_options.find((f) => f.en === finishing) ?? null;

  const toInquiryItem = (note = ''): NewInquiryItem => ({
    product_id: product.id,
    slug: product.slug,
    sku: product.sku,
    variant_sku: variant?.sku ?? null,
    name_en: product.name_en,
    name_id: product.name_id,
    image_url: images[0]?.url ?? product.images[0]?.url ?? null,
    color_id: color?.id ?? null,
    color_name_en: color?.name_en ?? null,
    color_name_id: color?.name_id ?? null,
    color_hex: color?.hex ?? null,
    size_id: size?.id ?? null,
    size_label_en: size?.label_en ?? null,
    size_label_id: size?.label_id ?? null,
    finishing,
    finishing_id: finishingOption?.id || null,
    quantity,
    note,
    unit_price_usd: price,
    price_idr: variant && Number(variant.price_adjustment_usd) !== 0 ? null : product.price_idr,
    price_display_type: product.price_display_type,
    moq: product.moq,
  });

  return {
    colorId,
    sizeId,
    finishing,
    finishingOption,
    quantity,
    color,
    size,
    variant,
    available,
    price,
    images,
    availability,
    selectColor,
    selectSize,
    setFinishing,
    setQuantity,
    toInquiryItem,
  };
}
