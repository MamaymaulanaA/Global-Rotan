/**
 * Cross-request cache for public (anonymous, cookie-less) Supabase reads.
 * Pages stay dynamic (currency cookie), but the data behind them is served from Next's
 * data cache instead of a round trip to Supabase on every request.
 * Admin mutations expire the tags immediately (see `lib/admin/revalidate.ts`);
 * `revalidate` is only a safety net for changes made outside the dashboard.
 */
export const CACHE_TAGS = {
  settings: 'public:settings',
  catalog: 'public:catalog',
} as const;

export const PUBLIC_REVALIDATE_SECONDS = 600;
