import 'server-only';
import type { AdminContext } from './auth';
import { INQUIRY_STATUSES, type InquiryStatus } from '@/types/domain';

/*
 * Read-only aggregation for the admin Overview. Uses the admin's own session
 * (RLS applies) and existing tables only — no schema or API changes.
 * All bucketing happens in Asia/Jakarta time.
 */

const TZ = 'Asia/Jakarta';
export const RANGE_KEYS = ['7d', '30d', '90d', '12m'] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const RANGE_LABEL: Record<RangeKey, { short: string; long: string; unit: string }> = {
  '7d': { short: '7D', long: 'Last 7 days', unit: 'day' },
  '30d': { short: '30D', long: 'Last 30 days', unit: 'day' },
  '90d': { short: '13W', long: 'Last 13 weeks', unit: 'week' },
  '12m': { short: '12M', long: 'Last 12 months', unit: 'month' },
};

export interface TrendPoint {
  label: string;
  fullLabel: string;
  current: number;
  previous: number;
}

export interface BarRow {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  share: number;
  meta?: string;
  href?: string;
}

export interface DashboardInsights {
  range: RangeKey;
  periodLabel: string;
  trend: TrendPoint[];
  total: number;
  previousTotal: number;
  statuses: BarRow[];
  countries: BarRow[];
  products: BarRow[];
  thisMonth: number;
  lastMonthToDate: number;
}

const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const dayKey = (d: Date) => dayKeyFmt.format(d); // YYYY-MM-DD

const toUtcMidnight = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const addDays = (key: string, days: number) => new Date(toUtcMidnight(key) + days * 86_400_000).toISOString().slice(0, 10);
const diffDays = (a: string, b: string) => Math.round((toUtcMidnight(a) - toUtcMidnight(b)) / 86_400_000);
const monthKey = (key: string) => key.slice(0, 7);
const addMonths = (mKey: string, months: number) => {
  const [y, m] = mKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, 1));
  return date.toISOString().slice(0, 7);
};
const jakartaStartIso = (key: string) => `${key}T00:00:00+07:00`;

const shortDay = (key: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(toUtcMidnight(key)));
const longDay = (key: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(toUtcMidnight(key)));
const monthLabel = (mKey: string, withYear = false) =>
  new Intl.DateTimeFormat('en-GB', { month: 'short', ...(withYear ? { year: 'numeric' } : { year: '2-digit' }), timeZone: 'UTC' }).format(
    new Date(`${mKey}-01T00:00:00Z`),
  );

export const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  quotation_sent: 'Quotation Sent',
  negotiation: 'Negotiation',
  confirmed: 'Confirmed',
  in_production: 'In Production',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function parseRange(value: string | undefined): RangeKey {
  return (RANGE_KEYS as readonly string[]).includes(value ?? '') ? (value as RangeKey) : '30d';
}

export async function getDashboardInsights(admin: AdminContext, range: RangeKey): Promise<DashboardInsights> {
  const today = dayKey(new Date());

  // Build bucket definitions for the current period and the equal-length previous period.
  let bucketCount: number;
  let currentStart: string;
  let previousStart: string;
  let indexOf: (key: string, start: string) => number;
  let labels: { label: string; fullLabel: string }[];

  if (range === '12m') {
    bucketCount = 12;
    const currentMonth = monthKey(today);
    const firstMonth = addMonths(currentMonth, -11);
    currentStart = `${firstMonth}-01`;
    previousStart = `${addMonths(firstMonth, -12)}-01`;
    indexOf = (key, start) => {
      const [ky, km] = key.split('-').map(Number);
      const [sy, sm] = start.split('-').map(Number);
      return (ky - sy) * 12 + (km - sm);
    };
    labels = Array.from({ length: 12 }, (_, i) => {
      const m = addMonths(firstMonth, i);
      return { label: monthLabel(m), fullLabel: monthLabel(m, true) };
    });
  } else {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 91;
    const size = range === '90d' ? 7 : 1;
    bucketCount = days / size;
    currentStart = addDays(today, -(days - 1));
    previousStart = addDays(currentStart, -days);
    indexOf = (key, start) => Math.floor(diffDays(key, start) / size);
    labels = Array.from({ length: bucketCount }, (_, i) => {
      const start = addDays(currentStart, i * size);
      if (size === 1) return { label: shortDay(start), fullLabel: longDay(start) };
      const end = addDays(start, size - 1);
      return { label: shortDay(start), fullLabel: `${shortDay(start)} – ${longDay(end)}` };
    });
  }

  const monthStart = `${monthKey(today)}-01`;
  const lastMonthStart = `${addMonths(monthKey(today), -1)}-01`;
  const dayOfMonth = Number(today.slice(8, 10));
  const lastMonthSameDay = addDays(lastMonthStart, dayOfMonth - 1);
  const queryFrom = [previousStart, lastMonthStart].sort()[0];

  const [inquiriesRes, itemsRes] = await Promise.all([
    admin.supabase
      .from('inquiries')
      .select('id, created_at, status, country')
      .gte('created_at', jakartaStartIso(queryFrom))
      .order('created_at', { ascending: true })
      .limit(20000),
    admin.supabase
      .from('inquiry_items')
      .select('product_id, product_name_en, sku, quantity, inquiry_id, inquiries!inner(created_at)')
      .gte('inquiries.created_at', jakartaStartIso(currentStart))
      .limit(20000),
  ]);

  const rows = (inquiriesRes.data ?? []) as { id: string; created_at: string; status: InquiryStatus; country: string }[];
  const trend: TrendPoint[] = labels.map((l) => ({ ...l, current: 0, previous: 0 }));
  const statusCounts = new Map<InquiryStatus, number>();
  const countryCounts = new Map<string, number>();
  let total = 0;
  let previousTotal = 0;
  let thisMonth = 0;
  let lastMonthToDate = 0;

  for (const row of rows) {
    const key = dayKey(new Date(row.created_at));
    if (key >= monthStart) thisMonth += 1;
    else if (key >= lastMonthStart && key <= lastMonthSameDay) lastMonthToDate += 1;

    if (key >= currentStart && key <= today) {
      const index = indexOf(key, currentStart);
      if (index >= 0 && index < bucketCount) trend[index].current += 1;
      total += 1;
      statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
      const country = row.country?.trim() || 'Unknown';
      countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
    } else if (key >= previousStart && key < currentStart) {
      const index = indexOf(key, previousStart);
      if (index >= 0 && index < bucketCount) trend[index].previous += 1;
      previousTotal += 1;
    }
  }

  const statuses: BarRow[] = INQUIRY_STATUSES.map((status) => {
    const value = statusCounts.get(status) ?? 0;
    return {
      key: status,
      label: STATUS_LABEL[status],
      value,
      share: total ? value / total : 0,
      href: `/admin/inquiries?status=${status}`,
    };
  });

  const countries: BarRow[] = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([country, value]) => ({
      key: country,
      label: country,
      value,
      share: total ? value / total : 0,
      meta: total ? `${Math.round((value / total) * 100)}%` : undefined,
      href: `/admin/inquiries?q=${encodeURIComponent(country)}`,
    }));

  const productMap = new Map<string, { label: string; sku: string | null; productId: string | null; inquiries: Set<string>; quantity: number }>();
  for (const item of (itemsRes.data ?? []) as { product_id: string | null; product_name_en: string; sku: string | null; quantity: number; inquiry_id: string }[]) {
    const key = item.product_id ?? `name:${item.product_name_en}`;
    const entry = productMap.get(key) ?? { label: item.product_name_en, sku: item.sku, productId: item.product_id, inquiries: new Set<string>(), quantity: 0 };
    entry.inquiries.add(item.inquiry_id);
    entry.quantity += item.quantity;
    productMap.set(key, entry);
  }
  const productEntries = [...productMap.entries()].sort((a, b) => b[1].inquiries.size - a[1].inquiries.size || b[1].quantity - a[1].quantity).slice(0, 5);
  const maxRequests = productEntries[0]?.[1].inquiries.size ?? 0;
  const products: BarRow[] = productEntries.map(([key, entry]) => ({
    key,
    label: entry.label,
    sublabel: entry.sku ?? undefined,
    value: entry.inquiries.size,
    share: maxRequests ? entry.inquiries.size / maxRequests : 0,
    meta: `${entry.quantity.toLocaleString('en-US')} pcs`,
    href: entry.productId ? `/admin/products/${entry.productId}` : undefined,
  }));

  const periodLabel = `${RANGE_LABEL[range].long} · ${longDay(currentStart)} – ${longDay(today)}`;

  return { range, periodLabel, trend, total, previousTotal, statuses, countries, products, thisMonth, lastMonthToDate };
}
