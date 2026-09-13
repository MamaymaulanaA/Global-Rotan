import type { Currency, PriceDisplayType } from '@/types/domain';

export const DEFAULT_USD_TO_IDR = 16250;
export const CURRENCY_COOKIE = 'GR_CURRENCY';

export function isCurrency(value: unknown): value is Currency {
  return value === 'USD' || value === 'IDR';
}

/** `$1,250` */
export function formatUsd(amount: number) {
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
}

/** `Rp19.500.000` */
export function formatIdr(amount: number) {
  return `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
}

/** Convert USD to IDR, rounded to the nearest Rp1.000 for estimate-style display. */
export function usdToIdr(usd: number, rate: number) {
  return Math.round((usd * rate) / 1000) * 1000;
}

export function convertPrice(
  usd: number,
  currency: Currency,
  rate: number,
  idrOverride?: number | null,
): number {
  if (currency === 'USD') return usd;
  if (idrOverride != null && Number(idrOverride) > 0) return Number(idrOverride);
  return usdToIdr(usd, rate);
}

export function formatMoney(amount: number, currency: Currency) {
  return currency === 'USD' ? formatUsd(amount) : formatIdr(amount);
}

export function formatPrice(
  usd: number | null | undefined,
  currency: Currency,
  rate: number,
  idrOverride?: number | null,
  quantity = 1,
) {
  if (usd == null) return null;
  // Convert the unit price first so line totals always equal unit × quantity.
  return formatMoney(convertPrice(Number(usd), currency, rate, idrOverride) * quantity, currency);
}

/** Sum of line totals in the active currency (each unit converted/rounded before multiplying). */
export function sumLines(lines: { usd: number; quantity: number; idr?: number | null }[], currency: Currency, rate: number) {
  return lines.reduce((sum, line) => sum + convertPrice(line.usd, currency, rate, line.idr) * line.quantity, 0);
}

export function hasVisiblePrice(type: PriceDisplayType, usd: number | null | undefined) {
  return type !== 'contact' && type !== 'wholesale_request' && usd != null;
}

/** Price buckets for catalog filtering (USD). */
export const PRICE_BUCKETS = [
  { key: '0-250', min: 0, max: 250 },
  { key: '250-500', min: 250, max: 500 },
  { key: '500-1000', min: 500, max: 1000 },
  { key: '1000-2500', min: 1000, max: 2500 },
  { key: '2500-', min: 2500, max: null },
] as const;
export type PriceBucketKey = (typeof PRICE_BUCKETS)[number]['key'];
