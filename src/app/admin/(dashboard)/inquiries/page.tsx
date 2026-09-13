import { ClipboardList, Download, SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { QuerySearch } from '@/components/admin/query-search';
import { AdminPageHeader, EmptyPanel, EmptyRow, FilterBar, formatDate, INQUIRY_STATUS_LABEL, MobileList, Pager, StatusPill, TableWrap, td, th, thead, tr } from '@/components/admin/ui';
import { buttonClasses } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { requireAdminPage } from '@/lib/admin/auth';
import { buildInquiryQuery, type InquiryFilters } from '@/lib/admin/inquiry-query';
import { formatUsd } from '@/lib/currency';
import { INQUIRY_STATUSES } from '@/types/domain';

export const metadata: Metadata = { title: 'Inquiries' };
const PAGE_SIZE = 25;

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<InquiryFilters> }) {
  const admin = await requireAdminPage();
  const filters = await searchParams;
  const page = Math.max(1, Number.parseInt(filters.page ?? '1', 10) || 1);
  const { data, count, error } = await buildInquiryQuery(
    admin,
    filters,
    'id, inquiry_number, status, full_name, company_name, email, country, customer_type, estimated_total_usd, followed_up_at, is_demo, created_at, items:inquiry_items(count)',
    { count: 'exact' },
  ).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const rows = (data ?? []) as unknown as {
    id: string;
    inquiry_number: string;
    status: string;
    full_name: string;
    company_name: string | null;
    email: string;
    country: string;
    customer_type: string;
    estimated_total_usd: number | null;
    followed_up_at: string | null;
    is_demo: boolean;
    created_at: string;
    items: { count: number }[];
  }[];
  const params = new URLSearchParams(Object.entries(filters).filter(([k, v]) => v && k !== 'page') as [string, string][]);
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const filtered = params.toString() !== '';

  const empty = filtered ? (
    <EmptyPanel
      icon={SearchX}
      title="No inquiries match these filters"
      description="Adjust the keyword, status or date range."
      action={
        <Link href="/admin/inquiries" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
          Clear filters
        </Link>
      }
    />
  ) : (
    <EmptyPanel icon={ClipboardList} title="No inquiries yet" description="Quotation requests from the website will appear here." />
  );

  return (
    <>
      <AdminPageHeader
        title="Inquiries"
        description={`${count ?? 0} ${filters.archived === '1' ? 'archived' : 'active'} inquiries`}
        actions={
          <a href={`/api/admin/inquiries/export?${params.toString()}`} className={buttonClasses({ variant: 'outline', size: 'sm', className: 'col-span-2' })}>
            <Download className="size-4" aria-hidden /> Export CSV
          </a>
        }
      />

      <FilterBar>
        <QuerySearch id="inq-q" label="Search inquiries" defaultValue={filters.q} placeholder="Number, name, email, company or country" className="col-span-2 md:w-auto md:min-w-[18rem] md:flex-1" />
        <label htmlFor="inq-status" className="sr-only">
          Status
        </label>
        <Select id="inq-status" name="status" defaultValue={filters.status ?? ''} controlSize="sm" className="col-span-2 min-[420px]:col-span-1 md:w-44">
          <option value="">All statuses</option>
          {INQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {INQUIRY_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <label className="col-span-2 flex min-h-control-sm items-center gap-2.5 px-1 text-[0.875rem] text-ink min-[420px]:col-span-1 md:order-last">
          <input type="checkbox" name="archived" value="1" defaultChecked={filters.archived === '1'} /> Show archived
        </label>
        <div className="flex flex-col gap-1">
          <label htmlFor="inq-from" className="text-[0.75rem] font-medium text-muted md:sr-only">
            From
          </label>
          <Input id="inq-from" type="date" name="from" defaultValue={filters.from} controlSize="sm" className="md:w-40" title="From date" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="inq-to" className="text-[0.75rem] font-medium text-muted md:sr-only">
            To
          </label>
          <Input id="inq-to" type="date" name="to" defaultValue={filters.to} controlSize="sm" className="md:w-40" title="To date" />
        </div>
        <button type="submit" className={buttonClasses({ variant: 'dark', size: 'sm', className: 'col-span-2 md:col-auto' })}>
          Apply
        </button>
      </FilterBar>

      {error && <p className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-danger">{error.message}</p>}

      <TableWrap className="hidden md:block">
        <table className="w-full min-w-[720px]">
          <thead className={thead}>
            <tr>
              <th className={th}>Inquiry</th>
              <th className={th}>Customer</th>
              <th className={`${th} hidden lg:table-cell`}>Country</th>
              <th className={`${th} hidden xl:table-cell text-right`}>Items</th>
              <th className={`${th} hidden lg:table-cell text-right`}>Est. value</th>
              <th className={th}>Status</th>
              <th className={th}>Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && <EmptyRow colSpan={7}>{empty}</EmptyRow>}
            {rows.map((r) => (
              <tr key={r.id} className={tr}>
                <td className={td}>
                  <Link href={`/admin/inquiries/${r.id}`} className="font-mono text-[0.875rem] font-semibold text-ink hover:text-gold-ink">
                    {r.inquiry_number}
                  </Link>
                  {(r.followed_up_at || r.is_demo) && (
                    <div className="mt-1 flex gap-1">
                      {r.followed_up_at && <StatusPill status="confirmed" label="Followed up" />}
                      {r.is_demo && <StatusPill status="negotiation" label="Demo" />}
                    </div>
                  )}
                </td>
                <td className={td}>
                  <p className="font-medium text-ink">{r.full_name}</p>
                  <p className="max-w-[16rem] truncate text-[0.8125rem] text-muted">{r.company_name ?? r.email}</p>
                </td>
                <td className={`${td} hidden lg:table-cell`}>{r.country}</td>
                <td className={`${td} hidden text-right tabular-nums xl:table-cell`}>{r.items[0]?.count ?? 0}</td>
                <td className={`${td} hidden whitespace-nowrap text-right tabular-nums lg:table-cell`}>{r.estimated_total_usd != null ? formatUsd(Number(r.estimated_total_usd)) : '—'}</td>
                <td className={td}>
                  <StatusPill status={r.status} />
                </td>
                <td className={`${td} whitespace-nowrap text-[0.875rem] text-muted`}>{formatDate(r.created_at, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <MobileList>
        {rows.length === 0 && <li className="rounded-lg border border-line bg-surface">{empty}</li>}
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/inquiries/${r.id}`} className="block rounded-lg border border-line bg-surface p-4 transition-colors hover:bg-[#faf7f1]">
              <span className="flex items-start justify-between gap-3">
                <span className="font-mono text-[0.875rem] font-semibold text-ink">{r.inquiry_number}</span>
                <StatusPill status={r.status} />
              </span>
              <span className="mt-2 block truncate font-medium text-ink">{r.full_name}</span>
              <span className="block truncate text-[0.8125rem] text-muted">
                {r.company_name ?? r.email} · {r.country}
              </span>
              <span className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-3 text-[0.8125rem] text-muted">
                <span>
                  {r.items[0]?.count ?? 0} items
                  {r.estimated_total_usd != null && <> · {formatUsd(Number(r.estimated_total_usd))}</>}
                </span>
                <span>{formatDate(r.created_at, true)}</span>
              </span>
            </Link>
          </li>
        ))}
      </MobileList>

      <Pager
        page={page}
        pageCount={pageCount}
        total={count ?? undefined}
        hrefFor={(p) => `/admin/inquiries?${new URLSearchParams({ ...Object.fromEntries(params), page: String(p) }).toString()}`}
      />
    </>
  );
}
