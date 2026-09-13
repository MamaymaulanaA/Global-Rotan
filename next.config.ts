import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '*.supabase.co';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Uploaded files get unique names, so optimized variants can be cached for a month.
    minimumCacheTTL: 2678400,
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [64, 96, 128, 200, 320],
    qualities: [70, 75, 85],
    remotePatterns: [
      { protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    // Browsers request /favicon.ico by default; serve the SVG icon instead of a 404.
    return [{ source: '/favicon.ico', destination: '/icon.svg' }];
  },
  async headers() {
    const staticAsset = { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' };
    return [
      { source: '/:path*', headers: securityHeaders },
      // Public placeholder artwork and icons are not content-hashed: cache for a day, revalidate in the background.
      { source: '/demo/:path*', headers: [staticAsset] },
      { source: '/icon.svg', headers: [staticAsset] },
    ];
  },
};

export default withNextIntl(nextConfig);
