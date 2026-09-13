import { ArrowRight, Clock, Mail, MapPin, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/components/forms/contact-form';
import { ButtonLink } from '@/components/ui/button';
import { Notice } from '@/components/ui/misc';
import { PageHeader } from '@/components/ui/page-header';
import { countryOptions } from '@/lib/countries';
import { getProductBySlug } from '@/lib/data/catalog';
import { getSiteSettings } from '@/lib/data/settings';
import { pageMetadata } from '@/lib/seo';
import { localePath, localized, siteUrl } from '@/lib/utils';
import { whatsappUrl } from '@/lib/whatsapp';
import { MESSAGE_TOPICS, type Locale, type MessageTopic } from '@/types/domain';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ topic?: string; product?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/contact', title: t('contact'), description: t('contactDescription') });
}

export default async function ContactPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const [t, tf, tn, settings] = await Promise.all([getTranslations('contact'), getTranslations('footer'), getTranslations('nav'), getSiteSettings()]);
  const { business } = settings;
  const topic = (MESSAGE_TOPICS as readonly string[]).includes(sp.topic ?? '') ? (sp.topic as MessageTopic) : sp.product ? 'product' : 'general';
  const productDetail = sp.product ? await getProductBySlug(sp.product).catch(() => null) : null;
  const product = productDetail
    ? { id: productDetail.id, name: localized(productDetail, 'name', locale), url: siteUrl(localePath(locale, `/products/${productDetail.slug}`)) }
    : null;
  const general = (locale === 'id' ? settings.whatsapp.general_id : settings.whatsapp.general_en) ?? '';

  const items = [
    { icon: Mail, label: t('email_label'), value: business.email, href: `mailto:${business.email}` },
    { icon: MessageCircle, label: t('whatsapp_label'), value: business.phone_display ?? `+${business.whatsapp}`, href: whatsappUrl(business.whatsapp, general), external: true },
    { icon: MapPin, label: t('address_label'), value: localized(business, 'address', locale), href: business.maps_url, external: true },
    { icon: Clock, label: t('hours_label'), value: localized(business, 'hours', locale) },
  ].filter((i) => i.value);

  return (
    <>
      <PageHeader locale={locale} crumbs={[{ label: t('eyebrow') }]} eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16 lg:py-16">
        <ContactForm key={`${topic}-${product?.id ?? ''}`} defaultTopic={topic} product={product} countries={countryOptions(locale)} />

        <aside className="space-y-6">
          <div className="rounded-md border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-h3">{t('details')}</h2>
            <ul className="mt-6 space-y-5">
              {items.map(({ icon: Icon, label, value, href, external }) => (
                <li key={label} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold-ink">
                    <Icon className="size-5" strokeWidth={1.6} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] text-muted">{label}</p>
                    {href ? (
                      <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="break-words font-medium text-ink hover:text-gold-ink">
                        {value}
                      </a>
                    ) : (
                      <p className="whitespace-pre-line font-medium text-ink">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <a
              href={whatsappUrl(business.whatsapp, general)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-success px-6 text-[0.9375rem] font-semibold text-white hover:bg-success/90"
            >
              <MessageCircle className="size-5" aria-hidden /> {t('whatsappCta')}
            </a>
            {business.is_demo && (
              <Notice tone="warning" className="mt-5">
                {tf('demoNotice')}
              </Notice>
            )}
          </div>

          <div className="on-dark rounded-md bg-espresso p-6 text-canvas/80 sm:p-8">
            <h2 className="text-h3 !text-canvas">{t('quoteCtaTitle')}</h2>
            <p className="mt-2">{t('quoteCtaText')}</p>
            <ButtonLink href="/inquiry" className="mt-5" iconRight={<ArrowRight className="size-4" aria-hidden />}>
              {tn('inquiryCart')}
            </ButtonLink>
          </div>
        </aside>
      </div>
    </>
  );
}
