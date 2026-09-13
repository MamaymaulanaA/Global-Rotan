import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { DocumentPage } from '@/components/ui/document-page';
import { pageMetadata } from '@/lib/seo';
import type { Locale } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale }> };
const UPDATED = new Date('2026-09-01');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/terms', title: t('terms') });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format] = await Promise.all([getTranslations('legal'), getFormatter()]);
  return (
    <DocumentPage
      locale={locale}
      crumb={t('terms.title')}
      title={t('terms.title')}
      intro={t('terms.intro')}
      updated={t('updated', { date: format.dateTime(UPDATED, { dateStyle: 'long' }) })}
      sections={t.raw('terms.sections') as { title: string; body: string }[]}
      note={t('reviewNote')}
    />
  );
}
