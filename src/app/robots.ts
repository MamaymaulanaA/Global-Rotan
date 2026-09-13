import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/favorites', '/inquiry', '/request-quote', '/id/favorites', '/id/inquiry', '/id/request-quote'],
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
    host: siteUrl(),
  };
}
