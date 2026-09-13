import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/ui/misc';
import { PageHeader } from '@/components/ui/page-header';
import { SmartImage } from '@/components/ui/smart-image';
import { Link } from '@/i18n/navigation';
import { getCollections } from '@/lib/data/catalog';
import { pageMetadata } from '@/lib/seo';
import { localized } from '@/lib/utils';
import type { Collection, Locale } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/collections', title: t('collections'), description: t('collectionsDescription') });
}

export default async function CollectionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('meta');
  const tn = await getTranslations('nav');
  const th = await getTranslations('home.categories');
  let collections: Collection[] = [];
  try {
    collections = await getCollections();
  } catch (error) {
    console.error('[collections]', error);
  }

  return (
    <>
      <PageHeader locale={locale} crumbs={[{ label: tn('collections') }]} eyebrow={tn('collections')} title={t('collections')} description={t('collectionsDescription')} />
      <div className="container-page py-12 lg:py-16">
        {collections.length === 0 ? (
          <EmptyState title={t('collections')} />
        ) : (
          <ul className="grid gap-12 lg:gap-16">
            {collections.map((collection, index) => {
              const name = localized(collection, 'name', locale);
              return (
                <li key={collection.id} data-reveal>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className={`group grid items-center gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14 ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-sand">
                      <SmartImage src={collection.image_url} alt="" fill sizes="(min-width: 1024px) 55vw, 100vw" priority={index === 0} className="img-zoom object-cover" />
                    </div>
                    <div>
                      <p className="eyebrow">{th('productCount', { count: collection.product_count ?? 0 })}</p>
                      <h2 className="text-h2 mt-3 transition-colors group-hover:text-gold-ink">{name}</h2>
                      {localized(collection, 'tagline', locale) && <p className="mt-2 font-display text-lg text-ink-soft">{localized(collection, 'tagline', locale)}</p>}
                      <p className="mt-4">{localized(collection, 'description', locale)}</p>
                      <span className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4">
                        {th('viewCategory', { name })}
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
