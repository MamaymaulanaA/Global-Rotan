import type { Metadata } from 'next';
import { TaxonomyManager } from '@/components/admin/taxonomy-manager';
import { AdminPageHeader } from '@/components/admin/ui';
import { requireAdminPage } from '@/lib/admin/auth';

export const metadata: Metadata = { title: 'Collections' };

export default async function CollectionsAdminPage() {
  const admin = await requireAdminPage();
  const [{ data }, { data: products }] = await Promise.all([
    admin.supabase.from('collections').select('*').order('sort_order'),
    admin.supabase.from('products').select('collection_id'),
  ]);
  const counts: Record<string, number> = {};
  ((products ?? []) as { collection_id: string | null }[]).forEach((p) => {
    if (p.collection_id) counts[p.collection_id] = (counts[p.collection_id] ?? 0) + 1;
  });
  return (
    <>
      <AdminPageHeader title="Collections" description="Curated groups of products with their own landing page." />
      <TaxonomyManager kind="collections" rows={(data ?? []) as { id: string }[]} counts={counts} />
    </>
  );
}
