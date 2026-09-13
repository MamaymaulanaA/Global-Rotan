import { Handshake, HandHeart, Leaf, MessagesSquare } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { CSSProperties } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { CtaBand } from '@/components/ui/cta-band';
import { PageHeader } from '@/components/ui/page-header';
import { SmartImage } from '@/components/ui/smart-image';
import { contentValue, getSiteSettings } from '@/lib/data/settings';
import { pageMetadata } from '@/lib/seo';
import { localized } from '@/lib/utils';
import type { Locale } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/about', title: t('about'), description: t('aboutDescription') });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tn, settings] = await Promise.all([getTranslations('about'), getTranslations('nav'), getSiteSettings()]);
  const about = settings.content.about;
  const facts = (settings.content.about_facts ?? []).filter((f) => f.value);
  const story = contentValue(about, 'story_body', locale, t('storyBody'));

  return (
    <>
      <PageHeader
        locale={locale}
        crumbs={[{ label: tn('about') }]}
        eyebrow={t('eyebrow')}
        title={contentValue(about, 'title', locale, t('title'))}
        description={contentValue(about, 'description', locale, t('description'))}
      />

      <section className="section-y">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sand sm:aspect-[5/4] lg:aspect-[4/5]" data-reveal>
            <SmartImage src={about?.image || '/demo/site/weave-detail.svg'} alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
          <div>
            <h2 className="text-h2" data-reveal>
              {contentValue(about, 'story_title', locale, t('storyTitle'))}
            </h2>
            <div className="prose-rotan text-lead mt-5">
              {story.split(/\n{2,}/).map((p, i) => (
                <p key={i} data-reveal style={{ '--reveal-delay': `${i * 60}ms` } as CSSProperties}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface section-y">
        <div className="container-page">
          <h2 className="text-h2 text-center" data-reveal>
            {t('valuesTitle')}
          </h2>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ['craft', HandHeart],
                ['material', Leaf],
                ['partnership', Handshake],
                ['clarity', MessagesSquare],
              ] as const
            ).map(([key, Icon], index) => (
              <li key={key} data-reveal style={{ '--reveal-delay': `${index * 60}ms` } as CSSProperties}>
                <Icon className="size-8 text-gold-ink" strokeWidth={1.4} aria-hidden />
                <h3 className="mt-4 text-[1.25rem]">{t(`values.${key}.title`)}</h3>
                <p className="mt-2 text-[0.9375rem]">{t(`values.${key}.text`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <h2 className="text-h2" data-reveal>
            {t('factsTitle')}
          </h2>
          {facts.length ? (
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
              {facts.map((fact, index) => (
                <div key={index} className="bg-canvas p-6 lg:p-8">
                  <dt className="text-[0.875rem] text-muted">{localized(fact, 'label', locale)}</dt>
                  <dd className="mt-2 font-display text-[2.25rem] font-medium leading-none text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-4 max-w-xl text-muted">{t('factsPending')}</p>
          )}
        </div>
      </section>

      <CtaBand
        title={t('ctaTitle')}
        text={t('ctaText')}
        actions={
          <>
            <ButtonLink href="/products" size="lg">
              {tn('products')}
            </ButtonLink>
            <ButtonLink href="/contact?topic=project" size="lg" variant="outline-light">
              {tn('contact')}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
