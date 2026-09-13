import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CatalogView } from '@/components/catalog/catalog-view';
import { Breadcrumbs } from '@/components/ui/page-header';
import { SmartImage } from '@/components/ui/smart-image';
import { parseCatalogParams } from '@/lib/catalog-params';
import { getCategories, getCollectionBySlug, searchProducts } from '@/lib/data/catalog';
import { pageMetadata } from '@/lib/seo';
import { localized } from '@/lib/utils';
import type { Locale } from '@/types/domain';

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const collection = await getCollectionBySlug(slug).catch(() => null);
  if (!collection) return { title: 'Not found', robots: { index: false } };
  return pageMetadata({
    locale,
    path: `/collections/${slug}`,
    title: localized(collection, 'name', locale),
    description: localized(collection, 'tagline', locale) || localized(collection, 'description', locale),
    image: collection.image_url,
  });
}

export default async function CollectionDetailPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();
  const tn = await getTranslations('nav');
  const th = await getTranslations('home.categories');

  const filters = parseCatalogParams(await searchParams);
  filters.collections = [collection.slug];
  let result: Awaited<ReturnType<typeof searchProducts>> | null = null;
  const categories = await getCategories().catch(() => []);
  try {
    result = await searchProducts(filters, locale);
  } catch (error) {
    console.error('[collection]', error);
  }
  const name = localized(collection, 'name', locale);

  return (
    <>
      <section className="border-b border-line bg-sand">
        <div className="container-page pb-10 pt-6 lg:pb-14 lg:pt-8">
          <Breadcrumbs locale={locale} items={[{ label: tn('collections'), href: '/collections' }, { label: name }]} />
          <div className="mt-8 grid items-center gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-14">
            <div>
              <p className="eyebrow">{th('productCount', { count: collection.product_count ?? 0 })}</p>
              <h1 className="text-h1 mt-3">{name}</h1>
              {localized(collection, 'tagline', locale) && <p className="mt-3 font-display text-xl text-ink-soft">{localized(collection, 'tagline', locale)}</p>}
              <p className="text-lead mt-4">{localized(collection, 'description', locale)}</p>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-sand-deep">
              <SmartImage src={collection.image_url} alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>
      <CatalogView filters={filters} categories={categories} collections={[]} result={result} lockedCollection={collection.slug} />
    </>
  );
}
