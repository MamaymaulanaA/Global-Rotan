import type { Metadata } from 'next';
import { TaxonomyManager } from '@/components/admin/taxonomy-manager';
import { AdminPageHeader } from '@/components/admin/ui';
import { requireAdminPage } from '@/lib/admin/auth';

export const metadata: Metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const admin = await requireAdminPage();
  const [{ data }, { data: products }] = await Promise.all([
    admin.supabase.from('categories').select('*').order('sort_order'),
    admin.supabase.from('products').select('category_id'),
  ]);
  const counts: Record<string, number> = {};
  ((products ?? []) as { category_id: string | null }[]).forEach((p) => {
    if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
  });
  return (
    <>
      <AdminPageHeader title="Categories" description="Categories appear on the home page, catalog filters and footer." />
      <TaxonomyManager kind="categories" rows={(data ?? []) as { id: string }[]} counts={counts} />
    </>
  );
}
