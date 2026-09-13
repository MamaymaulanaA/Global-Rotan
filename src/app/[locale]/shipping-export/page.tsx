import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { DocumentPage } from '@/components/ui/document-page';
import { getSiteSettings } from '@/lib/data/settings';
import { pageMetadata } from '@/lib/seo';
import { localized } from '@/lib/utils';
import type { Locale } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale }> };
const UPDATED = new Date('2026-09-01');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/shipping-export', title: t('shipping'), description: t('shippingDescription') });
}

export default async function ShippingExportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format, settings] = await Promise.all([getTranslations('shipping'), getFormatter(), getSiteSettings()]);
  const sections = t.raw('sections') as { title: string; body: string }[];
  const extra = [
    localized(settings.commerce, 'production_info', locale),
    localized(settings.commerce, 'shipping_info', locale),
    localized(settings.commerce, 'moq_note', locale),
  ].filter(Boolean);

  return (
    <DocumentPage
      locale={locale}
      crumb={t('title')}
      eyebrow={t('eyebrow')}
      title={t('title')}
      intro={t('intro')}
      updated={t('updated', { date: format.dateTime(UPDATED, { dateStyle: 'long' }) })}
      sections={sections}
      footer={
        extra.length ? (
          <ul className="mt-12 space-y-2 rounded-md border border-gold/40 bg-gold-soft p-5 text-[0.9375rem] text-ink-soft">
            {extra.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        ) : null
      }
    />
  );
}
