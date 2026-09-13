import { Package, Plus, SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductRowActions } from '@/components/admin/product-row-actions';
import { QuerySearch } from '@/components/admin/query-search';
import { AdminPageHeader, EmptyPanel, EmptyRow, FilterBar, formatDate, MobileList, Pager, StatusPill, TableWrap, td, th, thead, tr } from '@/components/admin/ui';
import { buttonClasses } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { SmartImage } from '@/components/ui/smart-image';
import { requireAdminPage } from '@/lib/admin/auth';
import { formatUsd } from '@/lib/currency';

export const metadata: Metadata = { title: 'Products' };
const PAGE_SIZE = 20;

type Search = { q?: string; status?: string; category?: string; page?: string };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  let query = admin.supabase
    .from('products')
    .select('id, slug, sku, name_en, status, availability, base_price_usd, price_display_type, is_featured, updated_at, category:categories(name_en), images:product_images(url, is_primary, sort_order, color_id)', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (sp.q) {
    const term = sp.q.toLowerCase().replace(/[%_*\\(),."']/g, ' ').trim();
    if (term) query = query.ilike('search_text', `%${term}%`);
  }
  if (sp.status && ['draft', 'published', 'archived'].includes(sp.status)) query = query.eq('status', sp.status);
  if (sp.category && /^[0-9a-f-]{36}$/.test(sp.category)) query = query.eq('category_id', sp.category);

  const [{ data, count, error }, { data: categories }] = await Promise.all([query, admin.supabase.from('categories').select('id, name_en').order('sort_order')]);
  const rows = (data ?? []) as unknown as {
    id: string;
    slug: string;
    sku: string;
    name_en: string;
    status: 'draft' | 'published' | 'archived';
    availability: string;
    base_price_usd: number | null;
    price_display_type: string;
    is_featured: boolean;
    updated_at: string;
    category: { name_en: string } | null;
    images: { url: string; is_primary: boolean; sort_order: number; color_id: string | null }[];
  }[];
  type Row = (typeof rows)[number];
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const filtered = Boolean(sp.q || sp.status || sp.category);
  const qs = (patch: Partial<Search>) => {
    const params = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/products?${params.toString()}`;
  };

  const priceOf = (p: Row) =>
    p.base_price_usd != null && !['contact', 'wholesale_request'].includes(p.price_display_type) ? formatUsd(Number(p.base_price_usd)) : <span className="text-muted">On request</span>;
  const thumbOf = (p: Row) => [...p.images].filter((i) => !i.color_id).sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];

  const empty = filtered ? (
    <EmptyPanel
      icon={SearchX}
      title="No products match these filters"
      description="Try a different keyword, status or category."
      action={
        <Link href="/admin/products" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
          Clear filters
        </Link>
      }
    />
  ) : (
    <EmptyPanel
      icon={Package}
      title="No products yet"
      description="Add your first product to start building the catalog."
      action={
        <Link href="/admin/products/new" className={buttonClasses({ variant: 'dark', size: 'sm' })}>
          <Plus className="size-4" aria-hidden /> Add product
        </Link>
      }
    />
  );

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={`${count ?? 0} products`}
        actions={
          <Link href="/admin/products/new" className={buttonClasses({ variant: 'dark', size: 'sm', className: 'col-span-2' })}>
            <Plus className="size-4" aria-hidden /> Add product
          </Link>
        }
      />

      <FilterBar>
        <QuerySearch id="product-search" label="Search products" defaultValue={sp.q} placeholder="Search name or SKU" className="col-span-2 md:w-auto md:min-w-[16rem] md:flex-1" />
        <label className="sr-only" htmlFor="product-status">
          Status
        </label>
        <Select id="product-status" name="status" defaultValue={sp.status ?? ''} controlSize="sm" className="md:w-40">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
        <label className="sr-only" htmlFor="product-category">
          Category
        </label>
        <Select id="product-category" name="category" defaultValue={sp.category ?? ''} controlSize="sm" className="md:w-52">
          <option value="">All categories</option>
          {((categories ?? []) as { id: string; name_en: string }[]).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_en}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonClasses({ variant: 'outline', size: 'sm', className: 'col-span-2 md:col-auto' })}>
          Apply filters
        </button>
      </FilterBar>

      {error && <p className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-danger">{error.message}</p>}

      <TableWrap className="hidden md:block">
        <table className="w-full min-w-[720px]">
          <thead className={thead}>
            <tr>
              <th className={th}>Product</th>
              <th className={`${th} hidden lg:table-cell`}>Category</th>
              <th className={th}>Price</th>
              <th className={th}>Status</th>
              <th className={`${th} hidden xl:table-cell`}>Availability</th>
              <th className={`${th} hidden lg:table-cell`}>Updated</th>
              <th className={`${th} w-16 text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && <EmptyRow colSpan={7}>{empty}</EmptyRow>}
            {rows.map((p) => {
              const image = thumbOf(p);
              return (
                <tr key={p.id} className={tr}>
                  <td className={td}>
                    <Link href={`/admin/products/${p.id}`} className="group flex items-center gap-3 rounded-md border border-transparent">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-md border border-line bg-sand">
                        <SmartImage src={image?.url} alt="" fill sizes="48px" className="object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-ink group-hover:text-gold-ink">{p.name_en}</span>
                        <span className="block text-[0.8125rem] text-muted">
                          {p.sku}
                          {p.is_featured && ' · Featured'}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className={`${td} hidden lg:table-cell`}>{p.category?.name_en ?? '—'}</td>
                  <td className={`${td} whitespace-nowrap tabular-nums`}>{priceOf(p)}</td>
                  <td className={td}>
                    <StatusPill status={p.status} />
                  </td>
                  <td className={`${td} hidden whitespace-nowrap text-[0.875rem] xl:table-cell`}>{p.availability === 'ready_stock' ? 'Ready Stock' : 'Made to Order'}</td>
                  <td className={`${td} hidden whitespace-nowrap text-[0.875rem] text-muted lg:table-cell`}>{formatDate(p.updated_at)}</td>
                  <td className={`${td} text-right`}>
                    <ProductRowActions id={p.id} slug={p.slug} sku={p.sku} name={p.name_en} status={p.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>

      <MobileList>
        {rows.length === 0 && <li className="rounded-lg border border-line bg-surface">{empty}</li>}
        {rows.map((p) => {
          const image = thumbOf(p);
          return (
            <li key={p.id} className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3">
              <Link href={`/admin/products/${p.id}`} className="flex min-w-0 flex-1 items-start gap-3 rounded-md border border-transparent">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-md border border-line bg-sand">
                  <SmartImage src={image?.url} alt="" fill sizes="64px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{p.name_en}</span>
                  <span className="block truncate text-[0.8125rem] text-muted">
                    {p.sku} · {p.category?.name_en ?? 'Uncategorized'}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem]">
                    <StatusPill status={p.status} />
                    <span className="tabular-nums text-ink">{priceOf(p)}</span>
                  </span>
                </span>
              </Link>
              <ProductRowActions id={p.id} slug={p.slug} sku={p.sku} name={p.name_en} status={p.status} />
            </li>
          );
        })}
      </MobileList>

      <Pager page={page} pageCount={pageCount} total={count ?? undefined} hrefFor={(p) => qs({ page: String(p) })} />
    </>
  );
}
