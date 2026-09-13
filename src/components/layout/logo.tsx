import { cn } from '@/lib/utils';

/** Global Rotan wordmark with a woven-cane monogram. */
export function Logo({ tone = 'dark', className, compact = false }: { tone?: 'dark' | 'light'; className?: string; compact?: boolean }) {
  const ink = tone === 'dark' ? 'var(--color-ink)' : 'var(--color-canvas)';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 40 40" className="size-8 shrink-0 sm:size-9" aria-hidden>
        <circle cx="20" cy="20" r="18.25" fill="none" stroke="var(--color-gold)" strokeWidth="2.5" />
        <g stroke={ink} strokeWidth="1.8" strokeLinecap="round">
          <path d="M11 13h18M11 20h18M11 27h18" />
          <path d="M13 11v18M20 11v18M27 11v18" opacity="0.55" />
        </g>
        <path d="M12 12l16 16M28 12L12 28" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="whitespace-nowrap font-display text-[1.12rem] font-semibold tracking-[-0.01em] sm:text-[1.28rem]" style={{ color: ink }}>
            Global Rotan
          </span>
          <span
            className={cn(
              'mt-1 hidden text-[0.62rem] font-semibold uppercase tracking-[0.22em] sm:block',
              tone === 'dark' ? 'text-gold-ink' : 'text-gold',
            )}
          >
            Indonesian Rattan
          </span>
        </span>
      )}
    </span>
  );
}
