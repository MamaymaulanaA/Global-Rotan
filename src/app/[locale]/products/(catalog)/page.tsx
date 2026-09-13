import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CatalogView } from '@/components/catalog/catalog-view';
import { PageHeader } from '@/components/ui/page-header';
import { parseCatalogParams } from '@/lib/catalog-params';
import { getCategories, getCollections, searchProducts } from '@/lib/data/catalog';
import { pageMetadata } from '@/lib/seo';
import { localized } from '@/lib/utils';
import type { Category, Collection, Locale } from '@/types/domain';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const filtered = Object.keys(sp).some((k) => k !== 'page');
  return pageMetadata({
    locale,
    path: '/products',
    title: t('products'),
    description: t('productsDescription'),
    // Filtered/paginated variations point to the main catalog as canonical and are not indexed.
    noIndex: filtered,
  });
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('catalog');
  const tn = await getTranslations('nav');
  const filters = parseCatalogParams(await searchParams);

  let categories: Category[] = [];
  let collections: Collection[] = [];
  let result: Awaited<ReturnType<typeof searchProducts>> | null = null;
  try {
    [categories, collections, result] = await Promise.all([getCategories(), getCollections(), searchProducts(filters, locale)]);
  } catch (error) {
    console.error('[products]', error instanceof Error ? error.message : error);
  }

  const singleCategory = filters.categories.length === 1 ? categories.find((c) => c.slug === filters.categories[0]) : null;

  return (
    <>
      <PageHeader
        locale={locale}
        crumbs={singleCategory ? [{ label: tn('products'), href: '/products' }, { label: localized(singleCategory, 'name', locale) }] : [{ label: tn('products') }]}
        eyebrow={t('eyebrow')}
        title={singleCategory ? localized(singleCategory, 'name', locale) : t('title')}
        description={singleCategory ? localized(singleCategory, 'description', locale) || t('description') : t('description')}
      />
      <CatalogView filters={filters} categories={categories} collections={collections} result={result} />
    </>
  );
}
