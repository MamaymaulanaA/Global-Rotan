import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { FloatingContact } from '@/components/layout/floating-contact';
import { Footer } from '@/components/layout/footer';
import { AnnouncementBar, Header } from '@/components/layout/header';
import { QuickViewLoader } from '@/components/product/quick-view-loader';
import { LocaleBootstrap } from '@/components/providers/locale-bootstrap';
import { SiteProvider } from '@/components/providers/site-provider';
import { pickClientMessages } from '@/i18n/client-messages';
import { routing } from '@/i18n/routing';
import { CURRENCY_COOKIE, isCurrency } from '@/lib/currency';
import { getSiteSettings } from '@/lib/data/settings';
import { fraunces, workSans } from '@/lib/fonts';
import { alternates, DEFAULT_OG_IMAGE } from '@/lib/seo';
import { isSvg, localePath, localized, siteUrl } from '@/lib/utils';
import type { Locale } from '@/types/domain';

export const viewport: Viewport = {
  themeColor: '#faf7f2',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: 'meta' });
  const settings = await getSiteSettings();
  const title = localized(settings.seo, 'title', locale) || t('siteTitle');
  const description = localized(settings.seo, 'description', locale) || t('siteDescription');
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${settings.business.name}` },
    description,
    applicationName: settings.business.name,
    alternates: alternates('/', locale),
    icons: settings.business.favicon_url ? { icon: settings.business.favicon_url } : { icon: '/icon.svg' },
    openGraph: {
      siteName: settings.business.name,
      type: 'website',
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      images: [{ url: settings.seo.og_image && !isSvg(settings.seo.og_image) ? settings.seo.og_image : DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [settings, cookieStore, t, messages] = await Promise.all([getSiteSettings(), cookies(), getTranslations({ locale, namespace: 'common' }), getMessages({ locale })]);
  const cookieCurrency = cookieStore.get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(cookieCurrency) ? cookieCurrency : settings.localization.default_currency;

  const organizationLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': siteUrl('/#organization'),
        name: settings.business.name,
        url: siteUrl(),
        email: settings.business.email,
        logo: settings.business.logo_url || siteUrl('/icon.svg'),
        sameAs: Object.values(settings.business.socials).filter(Boolean),
      },
      {
        '@type': 'WebSite',
        '@id': siteUrl('/#website'),
        name: settings.business.name,
        url: siteUrl(localePath(locale as Locale, '/')),
        inLanguage: locale,
        publisher: { '@id': siteUrl('/#organization') },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl(localePath(locale as Locale, '/products'))}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang={locale} className={`${fraunces.variable} ${workSans.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only z-[100] rounded-md bg-espresso px-4 py-3 text-canvas focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider messages={pickClientMessages(messages)}>
          <SiteProvider
            locale={locale as Locale}
            initialCurrency={currency}
            config={{
              businessName: settings.business.name,
              whatsapp: settings.business.whatsapp,
              email: settings.business.email,
              usdToIdr: settings.localization.usd_to_idr,
              whatsappTemplates: settings.whatsapp,
              defaultLanguage: settings.localization.default_language,
              isDemoContact: Boolean(settings.business.is_demo),
            }}
          >
            <AnnouncementBar announcement={settings.announcement} />
            <Header />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <Footer settings={settings} />
            <FloatingContact />
            <QuickViewLoader />
            <LocaleBootstrap locale={locale as Locale} defaultLanguage={settings.localization.default_language} />
            <Toaster
              position="bottom-center"
              offset={88}
              mobileOffset={88}
              toastOptions={{
                classNames: {
                  toast: '!rounded-md !border-line !bg-surface !text-ink !shadow-none !font-sans',
                  description: '!text-muted',
                  actionButton: '!bg-espresso !text-canvas !rounded-sm !font-semibold',
                },
              }}
            />
          </SiteProvider>
        </NextIntlClientProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd).replace(/</g, '\\u003c') }} />
      </body>
    </html>
  );
}
