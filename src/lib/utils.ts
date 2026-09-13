import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Locale } from '@/types/domain';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pick the localized value of a `field_en` / `field_id` pair with English fallback. */
export function localized<T extends object>(row: T | null | undefined, field: string, locale: Locale): string {
  if (!row) return '';
  const record = row as Record<string, unknown>;
  const primary = record[`${field}_${locale}`];
  if (typeof primary === 'string' && primary.trim()) return primary;
  const fallback = record[`${field}_en`];
  return typeof fallback === 'string' ? fallback : '';
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function siteUrl(path = '') {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}${path.startsWith('/') || path === '' ? path : `/${path}`}`;
}

/** Build a locale-aware public path (English has no prefix). */
export function localePath(locale: Locale, path: string) {
  const clean = path === '/' ? '' : path;
  return locale === 'en' ? clean || '/' : `/id${clean}`;
}

export const cmToInch = (cm: number) => Math.round((cm / 2.54) * 10) / 10;
export const kgToLb = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;

export function formatDims(
  dims: { width_cm: number | null; depth_cm: number | null; height_cm: number | null },
  unit: 'cm' | 'in',
) {
  const values = [dims.width_cm, dims.depth_cm, dims.height_cm].filter((v): v is number => v != null && Number(v) > 0);
  if (!values.length) return null;
  const parts = values.map((v) => (unit === 'cm' ? Number(v).toLocaleString('en-US') : cmToInch(Number(v)).toString()));
  return `${parts.join(' × ')} ${unit}`;
}

export function isSvg(url: string | null | undefined) {
  return !!url && /\.svg(\?|$)/i.test(url);
}

export function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1).trimEnd()}…`;
}

export function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
