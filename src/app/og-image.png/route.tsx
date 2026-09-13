import { ImageResponse } from 'next/og';
import { getSiteSettings } from '@/lib/data/settings';

// Default social sharing card. Facebook, WhatsApp, LinkedIn and X do not render SVG
// og:image files, so this PNG replaces the SVG placeholder. Regenerated hourly.
export const revalidate = 3600;

export async function GET() {
  const settings = await getSiteSettings();
  const name = settings.business.name || 'Global Rotan';
  const tagline = settings.business.tagline_en || 'Indonesian rattan furniture for homes, hospitality and projects worldwide.';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#2b2119', color: '#faf7f2', padding: '72px 80px', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, border: '3px solid #c89b5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: '#c89b5e' }}>GR</div>
          <div style={{ fontSize: 28, letterSpacing: 6, color: '#c89b5e', textTransform: 'uppercase' }}>Indonesian Rattan</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: 36, lineHeight: 1.35, color: 'rgba(250,247,242,0.78)', maxWidth: 900 }}>{tagline}</div>
        </div>
        <div style={{ display: 'flex', height: 6, width: 160, background: '#c89b5e', borderRadius: 3 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
