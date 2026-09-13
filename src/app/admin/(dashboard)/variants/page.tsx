import { ChevronRight, SearchX, SlidersHorizontal } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { QuerySearch } from '@/components/admin/query-search';
import { AdminPageHeader, EmptyPanel, EmptyRow, FilterBar, MobileList, StatusPill, TableWrap, td, th, thead, tr } from '@/components/admin/ui';
import { VariantManager } from '@/components/admin/variant-manager';
import { buttonClasses } from '@/components/ui/button';
import { requireAdminPage } from '@/lib/admin/auth';
import type { ProductColor, ProductImage, ProductSize, ProductVariant } from '@/types/domain';

export const metadata: Metadata = { title: 'Product Variants' };

export default async function VariantsPage({ searchParams }: { searchParams: Promise<{ product?: string; q?: string }> }) {
  const admin = await requireAdminPage();
  const { product: productId, q } = await searchParams;

  if (productId && /^[0-9a-f-]{36}$/i.test(productId)) {
    const [{ data: product }, images, colors, sizes, variants] = await Promise.all([
      admin.supabase.from('products').select('id, name_en, sku').eq('id', productId).maybeSingle(),
      admin.supabase.from('product_images').select('*').eq('product_id', productId).order('sort_order'),
      admin.supabase.from('product_colors').select('*').eq('product_id', productId).order('sort_order'),
      admin.supabase.from('product_sizes').select('*').eq('product_id', productId).order('sort_order'),
      admin.supabase.from('product_variants').select('*').eq('product_id', productId).order('sort_order'),
    ]);
    const p = product as { id: string; name_en: string; sku: string } | null;
    if (p) {
      return (
        <>
          <AdminPageHeader title={`Variants · ${p.name_en}`} description={`SKU ${p.sku}`} back={{ href: '/admin/variants', label: 'All products' }} />
          <VariantManager
            productId={p.id}
            colors={(colors.data ?? []) as ProductColor[]}
            sizes={(sizes.data ?? []) as ProductSize[]}
            variants={(variants.data ?? []) as ProductVariant[]}
            images={(images.data ?? []) as ProductImage[]}
          />
        </>
      );
    }
  }

  let query = admin.supabase
    .from('products')
    .select('id, name_en, sku, status, colors:product_colors(count), sizes:product_sizes(count), variants:product_variants(count)')
    .order('name_en')
    .limit(200);
  if (q) query = query.ilike('search_text', `%${q.toLowerCase().replace(/[%_*\\(),."']/g, ' ').trim()}%`);
  const { data } = await query;
  const rows = (data ?? []) as unknown as { id: string; name_en: string; sku: string; status: string; colors: { count: number }[]; sizes: { count: number }[]; variants: { count: number }[] }[];

  const empty = q ? (
    <EmptyPanel
      icon={SearchX}
      title="No products found"
      description="Try another name or SKU."
      action={
        <Link href="/admin/variants" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
          Clear search
        </Link>
      }
    />
  ) : (
    <EmptyPanel icon={SlidersHorizontal} title="No products yet" description="Create a product first, then manage its colors, sizes and variants here." />
  );

  return (
    <>
      <AdminPageHeader title="Product Variants" description="Manage colors, color codes, sizes, dimensions, variant SKUs, price adjustments and availability." />
      <FilterBar>
        <QuerySearch id="variant-search" label="Search products" defaultValue={q} placeholder="Search name or SKU" className="col-span-2 md:w-auto md:flex-1" />
        <button type="submit" className={buttonClasses({ variant: 'outline', size: 'sm', className: 'col-span-2 md:col-auto' })}>
          Search
        </button>
      </FilterBar>

      <TableWrap className="hidden md:block">
        <table className="w-full min-w-[640px]">
          <thead className={thead}>
            <tr>
              <th className={th}>Product</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Colors</th>
              <th className={`${th} text-right`}>Sizes</th>
              <th className={`${th} text-right`}>Variants</th>
              <th className={`${th} w-12`}>
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && <EmptyRow colSpan={6}>{empty}</EmptyRow>}
            {rows.map((r) => (
              <tr key={r.id} className={tr}>
                <td className={td}>
                  <Link href={`/admin/variants?product=${r.id}`} className="font-medium text-ink hover:text-gold-ink">
                    {r.name_en}
                  </Link>
                  <span className="block text-[0.8125rem] text-muted">{r.sku}</span>
                </td>
                <td className={td}>
                  <StatusPill status={r.status} />
                </td>
                <td className={`${td} text-right tabular-nums`}>{r.colors[0]?.count ?? 0}</td>
                <td className={`${td} text-right tabular-nums`}>{r.sizes[0]?.count ?? 0}</td>
                <td className={`${td} text-right tabular-nums`}>{r.variants[0]?.count ?? 0}</td>
                <td className={`${td} text-right`}>
                  <Link
                    href={`/admin/variants?product=${r.id}`}
                    aria-label={`Manage variants for ${r.name_en}`}
                    title="Manage variants"
                    className="inline-flex size-11 items-center justify-center rounded-md border border-transparent text-muted hover:bg-hover-soft hover:text-ink"
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <MobileList>
        {rows.length === 0 && <li className="rounded-lg border border-line bg-surface">{empty}</li>}
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/variants?product=${r.id}`} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:bg-[#faf7f1]">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{r.name_en}</span>
                <span className="block text-[0.8125rem] text-muted">{r.sku}</span>
                <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-muted">
                  <StatusPill status={r.status} />
                  <span>
                    {r.colors[0]?.count ?? 0} colors · {r.sizes[0]?.count ?? 0} sizes · {r.variants[0]?.count ?? 0} variants
                  </span>
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </MobileList>
    </>
  );
}
