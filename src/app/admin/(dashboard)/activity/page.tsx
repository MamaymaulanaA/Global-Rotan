import { Activity, SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ActivityTimeline, type ActivityItem } from '@/components/admin/activity-timeline';
import { QuerySearch } from '@/components/admin/query-search';
import { AdminPageHeader, Card, EmptyPanel, FilterBar, Pager } from '@/components/admin/ui';
import { buttonClasses } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { requireAdminPage } from '@/lib/admin/auth';

export const metadata: Metadata = { title: 'Admin Activity' };
const PAGE_SIZE = 30;

const ENTITY_LABEL: Record<string, string> = {
  product: 'Products',
  product_image: 'Product images',
  product_colors: 'Product colors',
  product_sizes: 'Product sizes',
  product_variants: 'Product variants',
  inquiry: 'Inquiries',
  message: 'Messages',
  category: 'Categories',
  collection: 'Collections',
  testimonial: 'Testimonials',
  settings: 'Settings',
  media: 'Media',
  profile: 'Users',
  session: 'Sign-ins',
};

type Search = { q?: string; entity?: string; page?: string };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Search> }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  let query = admin.supabase
    .from('activity_logs')
    .select('id, actor_email, action, entity_type, summary, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (sp.entity && /^[a-z_]{2,40}$/.test(sp.entity)) query = query.eq('entity_type', sp.entity);
  if (sp.q) {
    const term = sp.q.replace(/[%_*\\(),."']/g, ' ').trim();
    if (term) query = query.or(`summary.ilike.%${term}%,actor_email.ilike.%${term}%`);
  }
  const { data, count, error } = await query;
  const rows = (data ?? []) as ActivityItem[];
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const filtered = Boolean(sp.q || sp.entity);
  const qs = (patch: Partial<Search>) => `/admin/activity?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]).toString()}`;

  return (
    <>
      <AdminPageHeader title="Admin activity" description="A read-only log of changes made in the dashboard." back={{ href: '/admin', label: 'Overview' }} />

      <FilterBar>
        <QuerySearch id="activity-q" label="Search activity" defaultValue={sp.q} placeholder="Search summary or admin email" className="col-span-2 md:w-auto md:flex-1" />
        <label htmlFor="activity-entity" className="sr-only">
          Area
        </label>
        <Select id="activity-entity" name="entity" defaultValue={sp.entity ?? ''} controlSize="sm" className="md:w-48">
          <option value="">All areas</option>
          {Object.entries(ENTITY_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonClasses({ variant: 'dark', size: 'sm' })}>
          Apply
        </button>
      </FilterBar>

      {error && <p className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-danger">{error.message}</p>}

      <Card title={`${count ?? 0} entries`} icon={Activity}>
        {rows.length ? (
          <ActivityTimeline items={rows} />
        ) : filtered ? (
          <EmptyPanel
            icon={SearchX}
            title="No activity matches these filters"
            action={
              <Link href="/admin/activity" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyPanel icon={Activity} title="No activity recorded yet" description="Changes to products, inquiries and settings will be listed here." />
        )}
      </Card>

      <Pager page={page} pageCount={pageCount} total={count ?? undefined} hrefFor={(p) => qs({ page: String(p) })} />
    </>
  );
}
