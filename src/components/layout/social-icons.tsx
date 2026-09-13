import type { SocialLinks } from '@/types/settings';

// Minimal outline brand marks drawn to match Lucide's 24px / 1.75 stroke style.
const paths: Record<keyof SocialLinks, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </>
  ),
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5Z" />,
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V17M8 7.5v.01M12 17v-3.5a2.5 2.5 0 0 1 5 0V17M12 10.5V17" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10 9.5 5 2.5-5 2.5Z" />
    </>
  ),
  tiktok: <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.8 2.2 4.5 5 5" />,
  pinterest: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10.5 21 12.5 12.5M9.6 14.5C8.6 13.8 8 12.8 8 11.5 8 9 10 7 12.5 7S17 8.8 17 11.2c0 2.6-1.5 4.3-3.3 4.3-1.1 0-1.8-.8-1.6-1.8" />
    </>
  ),
};

const labels: Record<keyof SocialLinks, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
};

export function SocialIcons({ socials, className }: { socials: SocialLinks; className?: string }) {
  const entries = (Object.keys(paths) as (keyof SocialLinks)[]).filter((key) => socials[key]);
  if (!entries.length) return null;
  return (
    <ul className={className ?? 'flex flex-wrap gap-1'}>
      {entries.map((key) => (
        <li key={key}>
          <a
            href={socials[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={labels[key]}
            title={labels[key]}
            className="inline-flex size-11 items-center justify-center rounded-md text-canvas/80 transition-colors hover:bg-white/10 hover:text-canvas"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {paths[key]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
