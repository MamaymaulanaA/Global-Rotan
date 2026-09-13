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
  return pageMetadata({ locale, path: '/privacy-policy', title: t('privacy') });
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format] = await Promise.all([getTranslations('legal'), getFormatter()]);
  return (
    <DocumentPage
      locale={locale}
      crumb={t('privacy.title')}
      title={t('privacy.title')}
      intro={t('privacy.intro')}
      updated={t('updated', { date: format.dateTime(UPDATED, { dateStyle: 'long' }) })}
      sections={t.raw('privacy.sections') as { title: string; body: string }[]}
      note={t('reviewNote')}
    />
  );
}
