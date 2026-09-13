import { ArrowRight, CalendarClock, Container, FileText, Handshake, Package, PackageOpen } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { CSSProperties } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { CtaBand } from '@/components/ui/cta-band';
import { PageHeader } from '@/components/ui/page-header';
import { SmartImage } from '@/components/ui/smart-image';
import { Accordion } from '@/components/ui/tabs';
import { contentValue, getSiteSettings } from '@/lib/data/settings';
import { pageMetadata } from '@/lib/seo';
import { jsonLd } from '@/lib/seo';
import type { Locale } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/export', title: t('export'), description: t('exportDescription'), image: '/demo/site/export.svg' });
}

export default async function ExportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tn, settings] = await Promise.all([getTranslations('export'), getTranslations('nav'), getSiteSettings()]);
  const content = settings.content.export;
  const faq = t.raw('faq') as { q: string; a: string }[];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <>
      <PageHeader
        locale={locale}
        crumbs={[{ label: tn('customExport') }, { label: tn('exportInfo') }]}
        eyebrow={t('eyebrow')}
        title={contentValue(content, 'title', locale, t('title'))}
        description={contentValue(content, 'description', locale, t('description'))}
      />

      <section className="section-y">
        <div className="container-page">
          <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-sand lg:aspect-[21/9]" data-reveal>
            <SmartImage src={content?.image || '/demo/site/export.svg'} alt="" fill priority sizes="100vw" className="object-cover" />
          </div>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
            {(
              [
                ['moq', Package],
                ['container', Container],
                ['packing', PackageOpen],
                ['documents', FileText],
                ['terms', Handshake],
                ['leadtime', CalendarClock],
              ] as const
            ).map(([key, Icon], index) => (
              <li key={key} className="bg-canvas p-7" data-reveal style={{ '--reveal-delay': `${index * 50}ms` } as CSSProperties}>
                <Icon className="size-7 text-gold-ink" strokeWidth={1.4} aria-hidden />
                <h2 className="mt-4 text-[1.25rem]">{t(`sections.${key}.title`)}</h2>
                <p className="mt-2 text-[0.9375rem]">{t(`sections.${key}.text`)}</p>
              </li>
            ))}
          </ul>
          <ButtonLink href="/shipping-export" variant="link" className="mt-6" iconRight={<ArrowRight className="size-4" aria-hidden />}>
            {t('detailLink')}
          </ButtonLink>
        </div>
      </section>

      <section className="border-t border-line bg-surface section-y">
        <div className="container-narrow">
          <h2 className="text-h2" data-reveal>
            {t('faqTitle')}
          </h2>
          <div className="mt-8">
            <Accordion items={faq.map((f, i) => ({ id: `faq-${i}`, title: f.q, content: <p>{f.a}</p> }))} />
          </div>
        </div>
      </section>

      <CtaBand
        title={t('ctaTitle')}
        text={t('ctaText')}
        actions={
          <>
            <ButtonLink href="/request-quote" size="lg">
              {tn('requestQuote')}
            </ButtonLink>
            <ButtonLink href="/contact?topic=export" size="lg" variant="outline-light">
              {tn('contact')}
            </ButtonLink>
          </>
        }
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqLd)} />
    </>
  );
}
