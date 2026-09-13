import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { QuoteForm } from '@/components/inquiry/quote-form';
import { PageHeader } from '@/components/ui/page-header';
import { pageMetadata } from '@/lib/seo';
import type { Locale } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/request-quote', title: t('quote'), description: t('quoteDescription'), noIndex: true });
}

export default async function RequestQuotePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('quote');
  const ti = await getTranslations('inquiry');
  return (
    <>
      <PageHeader
        locale={locale}
        crumbs={[{ label: ti('title'), href: '/inquiry' }, { label: t('title') }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />
      <QuoteForm />
    </>
  );
}
