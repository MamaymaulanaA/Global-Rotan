import 'server-only';
import { cache } from 'react';
import { DEFAULT_SETTINGS, SETTINGS_KEYS } from '@/lib/settings/defaults';
import { createPublicClient } from '@/lib/supabase/public';
import type { SiteSettings } from '@/types/settings';

function merge<T extends object>(base: T, override: unknown): T {
  if (!override || typeof override !== 'object') return base;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    const current = result[key];
    if (current && typeof current === 'object' && !Array.isArray(current) && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = merge(current as object, value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from('site_settings').select('key, value').in('key', [...SETTINGS_KEYS]);
    if (error) throw error;
    const rows = (data ?? []) as { key: string; value: unknown }[];
    const settings = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, unknown>;
    for (const row of rows) {
      const key = row.key as keyof SiteSettings;
      settings[key] = merge(DEFAULT_SETTINGS[key] as object, row.value);
    }
    const result = settings as unknown as SiteSettings;
    const rate = Number(result.localization.usd_to_idr);
    result.localization.usd_to_idr = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_SETTINGS.localization.usd_to_idr;
    return result;
  } catch (error) {
    console.error('[settings] falling back to defaults:', error instanceof Error ? error.message : error);
    return DEFAULT_SETTINGS;
  }
});

/** Resolve an editable content field, falling back to the translation default. */
export function contentValue(
  fields: Record<string, unknown> | undefined,
  key: string,
  locale: string,
  fallback: string,
) {
  const value = fields?.[`${key}_${locale}`];
  return typeof value === 'string' && value.trim() ? value : fallback;
}
