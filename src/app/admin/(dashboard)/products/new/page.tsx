import type { Metadata } from 'next';
import { ProductForm } from '@/components/admin/product-form';
import { AdminPageHeader } from '@/components/admin/ui';
import { requireAdminPage } from '@/lib/admin/auth';
import { EMPTY_PRODUCT } from '@/lib/admin/product-defaults';

export const metadata: Metadata = { title: 'New product' };

export default async function NewProductPage() {
  const admin = await requireAdminPage();
  const [{ data: categories }, { data: collections }] = await Promise.all([
    admin.supabase.from('categories').select('id, name_en').order('sort_order'),
    admin.supabase.from('collections').select('id, name_en').order('sort_order'),
  ]);
  return (
    <>
      <AdminPageHeader title="New product" description="Save the product first, then upload images and add colors, sizes and variants." back={{ href: '/admin/products', label: 'Products' }} />
      <ProductForm
        productId={null}
        defaultValues={EMPTY_PRODUCT}
        categories={(categories ?? []) as { id: string; name_en: string }[]}
        collections={(collections ?? []) as { id: string; name_en: string }[]}
      />
    </>
  );
}
