import { Activity, Archive, BarChart3, Boxes, CalendarDays, CircleCheck, ClipboardList, FilePenLine, Globe2, Inbox, Mail, MessageSquare, Package, PackageSearch, Plus, RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ActivityTimeline } from '@/components/admin/activity-timeline';
import { BarList } from '@/components/admin/charts/bar-list';
import { TrendChart } from '@/components/admin/charts/trend-chart';
import { AdminPageHeader, Card, CardLink, EmptyPanel, formatDate, MetricCard, relativeTime, StatusPill } from '@/components/admin/ui';
import { buttonClasses } from '@/components/ui/button';
import { requireAdminPage } from '@/lib/admin/auth';
import { getDashboardInsights, parseRange, RANGE_KEYS, RANGE_LABEL } from '@/lib/admin/dashboard';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Overview' };

interface Overview {
  products: { total: number; published: number; draft: number; archived: number; ready_stock: number };
  inquiries: { new: number; this_month: number; total: number };
  recent_messages: { id: string; full_name: string; email: string; subject: string | null; topic: string; status: string; created_at: string }[];
  recent_activity: { id: string; actor_email: string | null; action: string; entity_type: string; summary: string | null; created_at: string }[];
}

const TOPIC_LABEL: Record<string, string> = { general: 'General question', product: 'Product question', project: 'Project / custom', export: 'Export & shipping' };


const pct = (current: number, previous: number) => (previous === 0 ? null : Math.round(((current - previous) / previous) * 100));

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const admin = await requireAdminPage();
  const range = parseRange((await searchParams).range);
  const [{ data, error }, insights, unread] = await Promise.all([
    admin.supabase.rpc('admin_overview'),
    getDashboardInsights(admin, range),
    admin.supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);
  const o = data as Overview | null;
  const name = admin.profile.full_name || admin.user.email.split('@')[0];
  const updatedAt = formatDate(new Date().toISOString(), true);

  if (error || !o) {
    return (
      <>
        <AdminPageHeader title="Overview" />
        <Card>
          <EmptyPanel
            icon={BarChart3}
            title="Statistics could not be loaded"
            description={error?.message ?? 'Unknown error'}
            action={
              <Link href="/admin" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
                <RefreshCw className="size-4" aria-hidden /> Retry
              </Link>
            }
          />
        </Card>
      </>
    );
  }

  const monthDelta = pct(insights.thisMonth, insights.lastMonthToDate);
  const periodDelta = pct(insights.total, insights.previousTotal);

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description={<>Welcome back, <span className="font-medium text-ink">{name}</span>.</>}
        meta={<>Data as of {updatedAt} WIB</>}
        actions={
          <>
            <Link href="/admin/products/new" className={buttonClasses({ variant: 'dark', size: 'sm', className: 'whitespace-nowrap px-3 sm:px-4' })}>
              <Plus className="size-4" aria-hidden /> Add Product
            </Link>
            <Link href="/admin/inquiries?status=new" className={buttonClasses({ variant: 'outline', size: 'sm', className: 'whitespace-nowrap px-3 sm:px-4' })}>
              <Inbox className="hidden size-4 min-[400px]:block" aria-hidden /> New Inquiries
              {o.inquiries.new > 0 && <span className="rounded-full bg-gold px-1.5 text-[0.75rem] leading-5 text-ink">{o.inquiries.new}</span>}
            </Link>
          </>
        }
      />

      {/* Metric cards */}
      <section aria-label="Key metrics" className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
        <MetricCard label="New inquiries" value={o.inquiries.new} icon={MessageSquare} href="/admin/inquiries?status=new" description="Awaiting first contact" emphasis={o.inquiries.new > 0} />
        <MetricCard
          label="Inquiries this month"
          value={insights.thisMonth}
          icon={CalendarDays}
          href="/admin/inquiries"
          delta={{ value: monthDelta, label: monthDelta == null ? 'No data last month' : 'vs last month to date' }}
        />
        <MetricCard label="Unread messages" value={unread.count ?? 0} icon={Mail} href="/admin/messages?status=new" description="Contact form" />
        <MetricCard label="Total products" value={o.products.total} icon={Package} href="/admin/products" description="All statuses" />
        <MetricCard label="Published" value={o.products.published} icon={CircleCheck} href="/admin/products?status=published" description="Visible on website" />
        <MetricCard label="Draft" value={o.products.draft} icon={FilePenLine} href="/admin/products?status=draft" description="Not yet published" />
        <MetricCard label="Archived" value={o.products.archived} icon={Archive} href="/admin/products?status=archived" description="Hidden from catalog" />
        <MetricCard label="Ready stock" value={o.products.ready_stock} icon={Boxes} href="/admin/products?status=published" description="Published, ready to ship" />
      </section>

      {/* Inquiry insights — one period filter scopes every chart below it */}
      <section aria-labelledby="insights-title" className="mt-8">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="insights-title" className="font-sans text-[1.0625rem] font-semibold text-ink">
              Inquiry insights
            </h2>
            <p className="text-[0.8125rem] text-muted">{insights.periodLabel}</p>
          </div>
          <nav aria-label="Statistics period" className="field-group scroll-x inline-flex max-w-full items-center gap-0.5 self-start p-0.5 pb-0.5 sm:self-auto">
            {RANGE_KEYS.map((key) => (
              <Link
                key={key}
                href={key === '30d' ? '/admin' : `/admin?range=${key}`}
                scroll={false}
                aria-current={range === key ? 'true' : undefined}
                title={RANGE_LABEL[key].long}
                className={cn(
                  'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[3px] border px-3 text-[0.8125rem] font-semibold transition-colors',
                  range === key ? 'border-espresso bg-espresso text-canvas [--color-focus:var(--color-gold)]' : 'border-transparent text-ink-soft hover:bg-hover-soft',
                )}
              >
                {RANGE_LABEL[key].short}
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card
            className="xl:col-span-2"
            title="Inquiry trend"
            description={
              <>
                <strong className="font-semibold text-ink">{insights.total}</strong> inquiries
                {periodDelta != null && (
                  <span className={cn('ml-1.5', periodDelta > 0 ? 'text-success' : periodDelta < 0 ? 'text-danger' : 'text-muted')}>
                    ({periodDelta > 0 ? '+' : ''}
                    {periodDelta}% vs previous period)
                  </span>
                )}
                {periodDelta == null && <span className="ml-1.5">· {insights.previousTotal} in previous period</span>}
              </>
            }
            icon={BarChart3}
          >
            {insights.total === 0 && insights.previousTotal === 0 ? (
              <EmptyPanel icon={BarChart3} title="No inquiries in this period" description="The trend appears as soon as customers send quotation requests." />
            ) : (
              <TrendChart
                data={insights.trend}
                currentLabel="This period"
                previousLabel="Previous period"
                ariaLabel={`Inquiry trend, ${insights.periodLabel}: ${insights.total} inquiries versus ${insights.previousTotal} in the previous period. Use arrow keys to inspect each ${RANGE_LABEL[range].unit}.`}
              />
            )}
          </Card>

          <Card title="Inquiry status" description="Inquiries received in this period" icon={ClipboardList} actions={<CardLink href="/admin/inquiries">View details</CardLink>}>
            <BarList
              rows={insights.statuses}
              dimZero
              tooltip={(row) => `${row.label}: ${row.value} (${Math.round(row.share * 100)}% of ${insights.total})`}
              empty={<EmptyPanel icon={ClipboardList} title="No status data yet" />}
            />
          </Card>

          <Card title="Most requested products" description="Ranked by number of inquiries" icon={PackageSearch} actions={<CardLink href="/admin/products">View products</CardLink>}>
            <BarList
              rows={insights.products}
              valueSuffix={(v) => (v === 1 ? 'inquiry' : 'inquiries')}
              tooltip={(row) => `${row.label}: ${row.value} inquiries · ${row.meta}`}
              empty={<EmptyPanel icon={PackageSearch} title="No product requests yet" description="Products appear here once they are added to inquiries." />}
            />
          </Card>

          <Card title="Inquiry countries" description="Share of inquiries in this period" icon={Globe2} actions={<CardLink href="/admin/inquiries">View details</CardLink>}>
            <BarList
              rows={insights.countries}
              tooltip={(row) => `${row.label}: ${row.value} of ${insights.total} inquiries`}
              empty={<EmptyPanel icon={Globe2} title="No country data yet" />}
            />
          </Card>

          <Card title="Latest messages" icon={MessageSquare} actions={<CardLink href="/admin/messages">View all</CardLink>} bodyClassName="p-0 sm:p-0">
            {o.recent_messages.length ? (
              <ul className="divide-y divide-line">
                {o.recent_messages.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/admin/messages?q=${encodeURIComponent(m.email)}`}
                      className="flex items-center gap-3 border border-transparent px-4 py-3 transition-colors hover:bg-hover-soft focus-visible:bg-hover-soft sm:px-5"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand text-[0.8125rem] font-semibold uppercase text-ink-soft" aria-hidden>
                        {m.full_name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join('')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem] font-medium text-ink">{m.full_name}</span>
                        <span className="block truncate text-[0.8125rem] text-muted">{m.subject || TOPIC_LABEL[m.topic] || m.email}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <StatusPill status={m.status} />
                        <span className="text-[0.75rem] text-muted" title={formatDate(m.created_at, true)}>
                          {relativeTime(m.created_at)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyPanel icon={MessageSquare} title="No messages yet" description="Contact form messages will appear here." />
            )}
          </Card>
        </div>
      </section>

      <section className="mt-4">
        <Card title="Recent admin activity" icon={Activity} actions={<CardLink href="/admin/activity">View all activity</CardLink>}>
          {o.recent_activity.length ? (
            <ActivityTimeline items={o.recent_activity.slice(0, 6)} />
          ) : (
            <EmptyPanel icon={Activity} title="No activity recorded yet" />
          )}
        </Card>
      </section>
    </>
  );
}
