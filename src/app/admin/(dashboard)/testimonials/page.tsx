import type { Metadata } from 'next';
import { TaxonomyManager } from '@/components/admin/taxonomy-manager';
import { AdminPageHeader } from '@/components/admin/ui';
import { requireAdminPage } from '@/lib/admin/auth';

export const metadata: Metadata = { title: 'Testimonials' };

export default async function TestimonialsPage() {
  const admin = await requireAdminPage();
  const { data } = await admin.supabase.from('testimonials').select('*').order('sort_order');
  return (
    <>
      <AdminPageHeader
        title="Testimonials"
        description="Only publish real, verifiable feedback with the customer’s permission. Items marked as demo show a “Sample” label on the website."
      />
      <TaxonomyManager kind="testimonials" rows={(data ?? []) as { id: string }[]} />
    </>
  );
}
