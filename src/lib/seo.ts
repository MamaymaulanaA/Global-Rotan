import type { Metadata } from 'next';
import { isSvg, localePath, siteUrl } from '@/lib/utils';

export const DEFAULT_OG_IMAGE = '/og-image.png';
import type { Locale } from '@/types/domain';

export function alternates(path: string, locale: Locale) {
  return {
    canonical: siteUrl(localePath(locale, path)),
    languages: {
      en: siteUrl(localePath('en', path)),
      id: siteUrl(localePath('id', path)),
      'x-default': siteUrl(localePath('en', path)),
    },
  };
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  noIndex,
}: {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
  image?: string | null;
  noIndex?: boolean;
}): Metadata {
  const url = siteUrl(localePath(locale, path));
  // Social platforms ignore SVG previews, so SVG placeholders fall back to the generated PNG card.
  const usable = image && !isSvg(image) ? image : null;
  const ogImage = usable ? (usable.startsWith('http') ? usable : siteUrl(usable)) : siteUrl(DEFAULT_OG_IMAGE);
  return {
    title,
    description,
    alternates: alternates(path, locale),
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'Global Rotan',
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      alternateLocale: locale === 'id' ? ['en_US'] : ['id_ID'],
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}

export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
