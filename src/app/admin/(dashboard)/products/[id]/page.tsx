import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { ProductImagesManager } from '@/components/admin/product-images-manager';
import { ProductRowActions } from '@/components/admin/product-row-actions';
import { AdminPageHeader, StatusPill } from '@/components/admin/ui';
import { VariantManager } from '@/components/admin/variant-manager';
import { buttonClasses } from '@/components/ui/button';
import { requireAdminPage } from '@/lib/admin/auth';
import { productToForm } from '@/lib/admin/product-defaults';
import type { ProductColor, ProductImage, ProductSize, ProductStatus, ProductVariant } from '@/types/domain';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: product }, { data: categories }, { data: collections }, images, colors, sizes, variants] = await Promise.all([
    admin.supabase.from('products').select('*').eq('id', id).maybeSingle(),
    admin.supabase.from('categories').select('id, name_en').order('sort_order'),
    admin.supabase.from('collections').select('id, name_en').order('sort_order'),
    admin.supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
    admin.supabase.from('product_colors').select('*').eq('product_id', id).order('sort_order'),
    admin.supabase.from('product_sizes').select('*').eq('product_id', id).order('sort_order'),
    admin.supabase.from('product_variants').select('*').eq('product_id', id).order('sort_order'),
  ]);
  if (!product) notFound();
  const row = product as Record<string, unknown> & { name_en: string; sku: string; slug: string; status: ProductStatus };

  return (
    <>
      <AdminPageHeader
        title={row.name_en}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            SKU {row.sku} <StatusPill status={row.status} />
          </span>
        }
        back={{ href: '/admin/products', label: 'Products' }}
        actions={
          <>
            {row.status === 'published' && (
              <a href={`/products/${row.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
                <ExternalLink className="size-4" aria-hidden /> View
              </a>
            )}
            <ProductRowActions id={id} slug={row.slug} sku={row.sku} name={row.name_en} status={row.status} />
          </>
        }
      />
      {created && <p className="mb-6 rounded-md bg-success-soft px-4 py-3 text-[0.9375rem] text-success">Product created. Now upload images and add colors, sizes or variants below.</p>}

      <div className="space-y-8">
        <ProductImagesManager productId={id} images={(images.data ?? []) as ProductImage[]} colors={(colors.data ?? []) as ProductColor[]} />
        <ProductForm
          productId={id}
          defaultValues={productToForm(row)}
          categories={(categories ?? []) as { id: string; name_en: string }[]}
          collections={(collections ?? []) as { id: string; name_en: string }[]}
        />
        <div>
          <h2 className="mb-4 text-2xl">Colors, sizes & variants</h2>
          <VariantManager
            productId={id}
            colors={(colors.data ?? []) as ProductColor[]}
            sizes={(sizes.data ?? []) as ProductSize[]}
            variants={(variants.data ?? []) as ProductVariant[]}
            images={(images.data ?? []) as ProductImage[]}
          />
        </div>
      </div>
    </>
  );
}
