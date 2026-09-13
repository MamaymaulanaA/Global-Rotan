import type {
  ProductCardData,
  ProductColor,
  ProductDetail,
  ProductImage,
  ProductSize,
  ProductVariant,
} from '@/types/domain';

const specificity = (v: ProductVariant) => Number(v.color_id != null) + Number(v.size_id != null);

/** Most specific active variant matching a color/size combination. */
export function findVariant(variants: ProductVariant[], colorId: string | null, sizeId: string | null) {
  return (
    variants
      .filter((v) => v.is_active)
      .filter((v) => (v.color_id == null || v.color_id === colorId) && (v.size_id == null || v.size_id === sizeId))
      .sort((a, b) => specificity(b) - specificity(a))[0] ?? null
  );
}

/** Products without variant rows accept every combination. */
export function isComboAvailable(variants: ProductVariant[], colorId: string | null, sizeId: string | null) {
  if (!variants.length) return true;
  const variant = findVariant(variants, colorId, sizeId);
  return Boolean(variant && variant.availability !== 'unavailable');
}

export function isColorSelectable(product: Pick<ProductDetail, 'variants' | 'sizes'>, colorId: string, sizeId: string | null) {
  if (sizeId) return isComboAvailable(product.variants, colorId, sizeId);
  if (!product.sizes.length) return isComboAvailable(product.variants, colorId, null);
  return product.sizes.some((s) => isComboAvailable(product.variants, colorId, s.id));
}

export function isSizeSelectable(product: Pick<ProductDetail, 'variants' | 'colors'>, sizeId: string, colorId: string | null) {
  if (colorId) return isComboAvailable(product.variants, colorId, sizeId);
  if (!product.colors.length) return isComboAvailable(product.variants, null, sizeId);
  return product.colors.some((c) => isComboAvailable(product.variants, c.id, sizeId));
}

export function defaultSelection(product: Pick<ProductDetail, 'variants' | 'colors' | 'sizes'>) {
  const colors: (ProductColor | null)[] = product.colors.length ? product.colors : [null];
  const sizes: (ProductSize | null)[] = product.sizes.length ? product.sizes : [null];
  for (const color of colors) {
    for (const size of sizes) {
      if (isComboAvailable(product.variants, color?.id ?? null, size?.id ?? null)) {
        return { colorId: color?.id ?? null, sizeId: size?.id ?? null };
      }
    }
  }
  return { colorId: colors[0]?.id ?? null, sizeId: sizes[0]?.id ?? null };
}

/** Images for the selected color first, then shared images. Falls back to all images. */
export function imagesForColor<T extends Pick<ProductImage, 'color_id'>>(images: T[], colorId: string | null) {
  if (!colorId) return images.filter((i) => i.color_id == null).length ? images.filter((i) => i.color_id == null) : images;
  const colorImages = images.filter((i) => i.color_id === colorId);
  if (!colorImages.length) return images.filter((i) => i.color_id == null).length ? images.filter((i) => i.color_id == null) : images;
  return [...colorImages, ...images.filter((i) => i.color_id == null)];
}

export function primaryImage(product: Pick<ProductCardData, 'images'>) {
  return product.images.find((i) => i.is_primary && i.color_id == null) ?? product.images.find((i) => i.color_id == null) ?? product.images[0] ?? null;
}

export function secondaryImage(product: Pick<ProductCardData, 'images'>) {
  const primary = primaryImage(product);
  return product.images.filter((i) => i.color_id == null).find((i) => i.id !== primary?.id) ?? null;
}

export type BadgeKey = 'new' | 'featured' | 'best_seller' | 'ready_stock' | 'made_to_order';

export function productBadges(product: Pick<ProductCardData, 'is_new' | 'is_featured' | 'is_best_seller' | 'availability'>, max = 2) {
  const badges: BadgeKey[] = [];
  if (product.is_new) badges.push('new');
  if (product.is_best_seller) badges.push('best_seller');
  if (product.is_featured && badges.length < 1) badges.push('featured');
  badges.push(product.availability);
  return badges.slice(0, max);
}

export function unitPrice(product: Pick<ProductDetail, 'base_price_usd' | 'price_display_type'>, variant: ProductVariant | null) {
  if (product.base_price_usd == null || product.price_display_type === 'contact' || product.price_display_type === 'wholesale_request') {
    return null;
  }
  return Number(product.base_price_usd) + Number(variant?.price_adjustment_usd ?? 0);
}
