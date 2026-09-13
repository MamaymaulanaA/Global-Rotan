import {
  ArrowRight,
  Boxes,
  Globe2,
  HandHeart,
  Hammer,
  Leaf,
  PencilRuler,
  PackageCheck,
  Quote,
  ScanSearch,
  Ship,
  Sprout,
} from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { CSSProperties } from 'react';
import { ProductGrid } from '@/components/product/product-grid';
import { ButtonLink } from '@/components/ui/button';
import { Badge, SectionHeading } from '@/components/ui/misc';
import { SmartImage } from '@/components/ui/smart-image';
import { Link } from '@/i18n/navigation';
import { getCategories, getFeaturedProducts, getTestimonials } from '@/lib/data/catalog';
import { contentValue, getSiteSettings } from '@/lib/data/settings';
import { pageMetadata } from '@/lib/seo';
import { localized } from '@/lib/utils';
import type { Category, Locale, ProductCardData, Testimonial } from '@/types/domain';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const settings = await getSiteSettings();
  return pageMetadata({
    locale,
    path: '/',
    title: localized(settings.seo, 'title', locale) || t('siteTitle'),
    description: localized(settings.seo, 'description', locale) || t('siteDescription'),
    image: settings.seo.og_image,
  });
}

async function safe<T>(promise: Promise<T>, fallback: T) {
  try {
    return await promise;
  } catch (error) {
    console.error('[home]', error instanceof Error ? error.message : error);
    return fallback;
  }
}

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties;

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const [settings, categories, products, testimonials] = await Promise.all([
    getSiteSettings(),
    safe(getCategories(), [] as Category[]),
    safe(getFeaturedProducts(8), [] as ProductCardData[]),
    safe(getTestimonials(), [] as Testimonial[]),
  ]);
  const home = settings.content.home;
  const c = (key: string, fallback: string) => contentValue(home, key, locale, fallback);

  const customCategory = categories.find((cat) => cat.slug === 'custom-furniture');
  const gridCategories = categories.filter((cat) => cat.slug !== 'custom-furniture').slice(0, 6);

  return (
    <>
      {/* 2. Hero */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:py-20">
          <div className="max-w-xl">
            <p className="eyebrow" data-reveal>
              {c('hero_eyebrow', t('hero.eyebrow'))}
            </p>
            <h1 className="text-display mt-4" data-reveal style={delay(60)}>
              {c('hero_title', t('hero.title'))}
            </h1>
            <p className="text-lead mt-5 max-w-lg" data-reveal style={delay(120)}>
              {c('hero_description', t('hero.description'))}
            </p>
            <div className="mt-8 flex flex-col gap-3 xs:flex-row" data-reveal style={delay(180)}>
              <ButtonLink href="/products" size="lg" iconRight={<ArrowRight className="size-5" aria-hidden />}>
                {t('hero.primaryCta')}
              </ButtonLink>
              <ButtonLink href="/request-quote" size="lg" variant="outline">
                {t('hero.secondaryCta')}
              </ButtonLink>
            </div>
          </div>
          <div className="relative" data-reveal style={delay(120)}>
            <div className="relative aspect-[16/11] overflow-hidden rounded-md bg-sand">
              <SmartImage
                src={home?.hero_image || '/demo/site/hero.svg'}
                alt={t('hero.imageAlt')}
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-5 hidden rounded-md border border-line bg-surface px-5 py-4 sm:block">
              <p className="eyebrow">{t('why.items.export.title')}</p>
              <p className="mt-1 text-[0.875rem] text-ink-soft">{t('why.items.custom.title')} · {t('why.items.materials.title')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured categories */}
      {categories.length > 0 && (
        <section className="section-y" aria-labelledby="home-categories">
          <div className="container-page">
            <SectionHeading
              eyebrow={t('categories.eyebrow')}
              title={<span id="home-categories">{t('categories.title')}</span>}
              description={t('categories.description')}
            />
            <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:mt-14 lg:grid-cols-4 lg:gap-6">
              {gridCategories.map((category, index) => {
                const name = localized(category, 'name', locale);
                return (
                  <li key={category.id} data-reveal style={delay(index * 60)}>
                    <Link href={`/products?category=${category.slug}`} className="group block" aria-label={t('categories.viewCategory', { name })}>
                      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sand">
                        <SmartImage src={category.image_url} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="img-zoom object-cover" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-lg text-ink transition-colors group-hover:text-gold-ink sm:text-xl">{name}</h3>
                        <ArrowRight className="size-4 shrink-0 translate-x-0 text-muted transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                      </div>
                      <p className="text-[0.875rem] text-muted">{t('categories.productCount', { count: category.product_count ?? 0 })}</p>
                    </Link>
                  </li>
                );
              })}
              {customCategory && (
                <li className="col-span-2 md:col-span-3 lg:col-span-2" data-reveal style={delay(360)}>
                  <Link
                    href="/custom-furniture"
                    className="on-dark group grid h-full overflow-hidden rounded-md border border-espresso bg-espresso text-canvas sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                  >
                    <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
                      <div>
                        <p className="eyebrow !text-gold">{t('project.eyebrow')}</p>
                        <h3 className="mt-3 font-display text-2xl text-canvas">{localized(customCategory, 'name', locale)}</h3>
                        <p className="mt-3 text-[0.9375rem] text-canvas/75">{localized(customCategory, 'description', locale)}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 font-semibold text-gold">
                        {t('project.secondaryCta')}
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                      </span>
                    </div>
                    <div className="relative min-h-52 lg:hidden xl:block">
                      <SmartImage src={customCategory.image_url} alt="" fill sizes="(min-width: 1280px) 22vw, 50vw" className="img-zoom object-cover" />
                    </div>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </section>
      )}

      {/* 4. Brand introduction */}
      <section className="bg-sand section-y" aria-labelledby="home-intro">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sand-deep sm:aspect-[5/4] lg:aspect-[4/5]" data-reveal>
            <SmartImage src={home?.intro_image || '/demo/site/craft.svg'} alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
          <div>
            <p className="eyebrow" data-reveal>
              {t('intro.eyebrow')}
            </p>
            <h2 id="home-intro" className="text-h2 mt-3" data-reveal style={delay(60)}>
              {c('intro_title', t('intro.title'))}
            </h2>
            <p className="text-lead mt-5" data-reveal style={delay(120)}>
              {c('intro_body', t('intro.body'))}
            </p>
            <ul className="mt-9 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {(
                [
                  ['materials', Sprout],
                  ['process', Hammer],
                  ['custom', PencilRuler],
                  ['global', Globe2],
                ] as const
              ).map(([key, Icon], index) => (
                <li key={key} className="flex gap-4" data-reveal style={delay(index * 60)}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-line-strong bg-canvas text-gold-ink">
                    <Icon className="size-5" strokeWidth={1.6} aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-sans text-base font-semibold">{t(`intro.points.${key}.title`)}</h3>
                    <p className="mt-1 text-[0.9375rem]">{t(`intro.points.${key}.text`)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <ButtonLink href="/about" variant="link" className="mt-6" iconRight={<ArrowRight className="size-4" aria-hidden />}>
              {t('intro.cta')}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* 5. Featured products */}
      {products.length > 0 && (
        <section className="section-y" aria-labelledby="home-featured">
          <div className="container-page">
            <SectionHeading
              eyebrow={t('featured.eyebrow')}
              title={<span id="home-featured">{t('featured.title')}</span>}
              description={t('featured.description')}
              action={
                <ButtonLink href="/products" variant="outline" iconRight={<ArrowRight className="size-4" aria-hidden />}>
                  {t('featured.viewAll')}
                </ButtonLink>
              }
            />
            <ProductGrid products={products} className="mt-10 lg:mt-14" />
          </div>
        </section>
      )}

      {/* 6. Why Global Rotan */}
      <section className="border-y border-line bg-surface section-y" aria-labelledby="home-why">
        <div className="container-page">
          <SectionHeading align="center" eyebrow={t('why.eyebrow')} title={<span id="home-why">{t('why.title')}</span>} />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {(
              [
                ['craftsmanship', HandHeart],
                ['materials', Leaf],
                ['custom', PencilRuler],
                ['export', Globe2],
              ] as const
            ).map(([key, Icon], index) => (
              <li key={key} className="bg-surface p-7 lg:p-8" data-reveal style={delay(index * 60)}>
                <Icon className="size-8 text-gold-ink" strokeWidth={1.4} aria-hidden />
                <h3 className="mt-5 text-[1.25rem]">{t(`why.items.${key}.title`)}</h3>
                <p className="mt-2 text-[0.9375rem]">{t(`why.items.${key}.text`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. Custom & project */}
      <section className="on-dark bg-espresso text-canvas/80 section-y" aria-labelledby="home-project">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="eyebrow !text-gold" data-reveal>
              {t('project.eyebrow')}
            </p>
            <h2 id="home-project" className="text-h2 mt-3 !text-canvas" data-reveal style={delay(60)}>
              {c('project_title', t('project.title'))}
            </h2>
            <p className="text-lead mt-5 text-canvas/75" data-reveal style={delay(120)}>
              {c('project_body', t('project.description'))}
            </p>
            <ul className="mt-7 flex flex-wrap gap-2" data-reveal style={delay(160)}>
              {(['hotels', 'restaurants', 'villas', 'retailers', 'designers', 'contractors'] as const).map((key) => (
                <li key={key} className="rounded-full border border-white/20 px-3.5 py-1.5 text-[0.875rem] text-canvas/85">
                  {t(`project.audiences.${key}`)}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row" data-reveal style={delay(200)}>
              <ButtonLink href="/contact?topic=project" size="lg">
                {t('project.primaryCta')}
              </ButtonLink>
              <ButtonLink href="/custom-furniture" size="lg" variant="outline-light">
                {t('project.secondaryCta')}
              </ButtonLink>
            </div>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden rounded-md" data-reveal style={delay(100)}>
            <SmartImage src={home?.project_image || '/demo/site/project.svg'} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* 8. Craftsmanship process */}
      <section className="section-y" aria-labelledby="home-process">
        <div className="container-page">
          <SectionHeading eyebrow={t('process.eyebrow')} title={<span id="home-process">{t('process.title')}</span>} description={t('process.description')} />
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:mt-16 lg:grid-cols-5 lg:gap-6">
            {(
              [
                ['selection', ScanSearch],
                ['handcrafting', Hammer],
                ['qc', PackageCheck],
                ['packing', Boxes],
                ['shipping', Ship],
              ] as const
            ).map(([key, Icon], index) => (
              <li key={key} className="relative border-t border-line-strong pt-6" data-reveal style={delay(index * 70)}>
                <span className="absolute -top-px left-0 h-0.5 w-10 bg-gold" aria-hidden />
                <div className="flex items-center justify-between">
                  <span className="font-display text-[2rem] font-medium leading-none text-line-strong">{String(index + 1).padStart(2, '0')}</span>
                  <Icon className="size-6 text-gold-ink" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="mt-5 text-[1.2rem]">{t(`process.steps.${key}.title`)}</h3>
                <p className="mt-2 text-[0.9375rem]">{t(`process.steps.${key}.text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 9. Testimonials & clients */}
      {(testimonials.length > 0 || (settings.content.clients?.length ?? 0) > 0) && (
        <section className="bg-sand section-y" aria-labelledby="home-testimonials">
          <div className="container-page">
            <SectionHeading align="center" eyebrow={t('testimonials.eyebrow')} title={<span id="home-testimonials">{t('testimonials.title')}</span>} />
            {testimonials.length > 0 && (
              <ul className="mt-12 grid gap-5 md:grid-cols-3 lg:mt-14 lg:gap-6">
                {testimonials.slice(0, 3).map((item, index) => (
                  <li key={item.id} className="flex flex-col rounded-md border border-line bg-canvas p-7" data-reveal style={delay(index * 70)}>
                    <div className="flex items-start justify-between gap-3">
                      <Quote className="size-7 text-gold" strokeWidth={1.4} aria-hidden />
                      {item.is_demo && <Badge tone="warning">{locale === 'id' ? 'Contoh' : 'Sample'}</Badge>}
                    </div>
                    <blockquote className="mt-4 flex-1 font-display text-[1.125rem] leading-relaxed text-ink">
                      “{localized(item, 'quote', locale)}”
                    </blockquote>
                    <footer className="mt-6 border-t border-line pt-4 text-[0.875rem]">
                      <p className="font-semibold text-ink">{item.author_name}</p>
                      <p className="text-muted">
                        {[localized(item, 'author_role', locale), item.company_name, item.country].filter(Boolean).join(' · ')}
                      </p>
                    </footer>
                  </li>
                ))}
              </ul>
            )}
            {testimonials.some((i) => i.is_demo) && <p className="mt-5 text-center text-[0.8125rem] text-muted">{t('testimonials.demoNote')}</p>}

            {(settings.content.clients?.length ?? 0) > 0 && (
              <div className="mt-14">
                <p className="text-center text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">{t('testimonials.clientsTitle')}</p>
                <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {settings.content.clients!.map((client, index) => (
                    <li key={`${client.name}-${index}`} className="relative flex h-20 items-center justify-center rounded-md border border-dashed border-line-strong bg-canvas/70 px-4">
                      {client.logo_url ? (
                        <SmartImage src={client.logo_url} alt={client.name} fill sizes="200px" className="object-contain p-4 grayscale" />
                      ) : (
                        <span className="text-center text-[0.8125rem] text-muted">{client.name || t('testimonials.clientPlaceholder')}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {settings.content.clients!.some((cl) => cl.is_demo) && (
                  <p className="mt-4 text-center text-[0.8125rem] text-muted">{t('testimonials.clientsDemoNote')}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 10. Closing CTA */}
      <section className="section-y">
        <div className="container-page">
          <div className="grid items-center gap-8 rounded-lg border border-gold/40 bg-gold-soft px-6 py-12 sm:px-10 lg:grid-cols-[1.4fr_1fr] lg:px-16 lg:py-16">
            <div>
              <h2 className="text-h2" data-reveal>
                {c('cta_title', t('cta.title'))}
              </h2>
              <p className="text-lead mt-4 max-w-xl" data-reveal style={delay(60)}>
                {c('cta_body', t('cta.description'))}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end" data-reveal style={delay(120)}>
              <ButtonLink href="/request-quote" size="lg" variant="dark">
                {t('cta.primary')}
              </ButtonLink>
              <ButtonLink href="/contact" size="lg" variant="outline">
                {t('cta.secondary')}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
