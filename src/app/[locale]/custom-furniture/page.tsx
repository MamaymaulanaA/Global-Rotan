import { Info, Layers, Palette, PencilRuler, Ruler, Shirt, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { CSSProperties } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { CtaBand } from '@/components/ui/cta-band';
import { Notice } from '@/components/ui/misc';
import { PageHeader } from '@/components/ui/page-header';
import { SmartImage } from '@/components/ui/smart-image';
import { contentValue, getSiteSettings } from '@/lib/data/settings';
import { pageMetadata } from '@/lib/seo';
import type { Locale } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/custom-furniture', title: t('custom'), description: t('customDescription'), image: '/demo/site/custom.svg' });
}

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties;

export default async function CustomFurniturePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tn, settings] = await Promise.all([getTranslations('custom'), getTranslations('nav'), getSiteSettings()]);
  const content = settings.content.custom;

  return (
    <>
      <PageHeader
        locale={locale}
        crumbs={[{ label: tn('customExport') }, { label: tn('customFurniture') }]}
        eyebrow={t('eyebrow')}
        title={contentValue(content, 'title', locale, t('title'))}
        description={contentValue(content, 'description', locale, t('description'))}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/contact?topic=project" size="lg">
            {t('primaryCta')}
          </ButtonLink>
          <ButtonLink href="/products?category=custom-furniture" size="lg" variant="outline">
            {tn('products')}
          </ButtonLink>
        </div>
      </PageHeader>

      <section className="section-y">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sand lg:sticky lg:top-[140px] lg:self-start" data-reveal>
            <SmartImage src={content?.image || '/demo/site/custom.svg'} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
          <div>
            <h2 className="text-h2" data-reveal>
              {t('optionsTitle')}
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {(
                [
                  ['dimensions', Ruler],
                  ['weave', Layers],
                  ['finish', Palette],
                  ['fabric', Shirt],
                  ['branding', Tag],
                  ['design', PencilRuler],
                ] as const
              ).map(([key, Icon], index) => (
                <li key={key} className="rounded-md border border-line bg-surface p-6" data-reveal style={delay(index * 50)}>
                  <Icon className="size-6 text-gold-ink" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-4 text-[1.2rem]">{t(`options.${key}.title`)}</h3>
                  <p className="mt-2 text-[0.9375rem]">{t(`options.${key}.text`)}</p>
                </li>
              ))}
            </ul>

            <h2 className="text-h2 mt-16" data-reveal>
              {t('processTitle')}
            </h2>
            <ol className="mt-8 space-y-0">
              {(['brief', 'proposal', 'sample', 'production', 'delivery'] as const).map((key, index, arr) => (
                <li key={key} className="relative flex gap-5 pb-8" data-reveal style={delay(index * 60)}>
                  {index < arr.length - 1 && <span className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px bg-line-strong" aria-hidden />}
                  <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-gold bg-canvas font-semibold text-gold-ink">
                    {index + 1}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="font-sans text-base font-semibold">{t(`process.${key}.title`)}</h3>
                    <p className="mt-1 text-[0.9375rem]">{t(`process.${key}.text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Notice tone="gold" icon={<Info className="size-4" aria-hidden />}>
              <strong className="font-semibold">{t('noteTitle')}:</strong> {t('note')}
            </Notice>
          </div>
        </div>
      </section>

      <CtaBand
        title={t('primaryCta')}
        text={t('description')}
        actions={
          <>
            <ButtonLink href="/contact?topic=project" size="lg">
              {t('secondaryCta')}
            </ButtonLink>
            <ButtonLink href="/request-quote" size="lg" variant="outline-light">
              {tn('requestQuote')}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
