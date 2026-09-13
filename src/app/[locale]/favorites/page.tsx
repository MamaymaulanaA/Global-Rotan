import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FavoritesView } from '@/components/favorites/favorites-view';
import { PageHeader } from '@/components/ui/page-header';
import { pageMetadata } from '@/lib/seo';
import type { Locale } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/favorites', title: t('favorites'), noIndex: true });
}

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('favorites');
  return (
    <>
      <PageHeader locale={locale} crumbs={[{ label: t('title') }]} title={t('title')} description={t('description')} />
      <FavoritesView />
    </>
  );
}
