import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BarListRow {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  /** 0–1 bar length relative to the scale (share of total, or of the largest row). */
  share: number;
  meta?: string;
  href?: string;
}

/**
 * Horizontal bar list: one hue for every bar (nominal categories), thin bars
 * with a rounded data end, values direct-labelled. Hover/focus shows the share.
 */
export function BarList({
  rows,
  valueSuffix,
  empty,
  tooltip,
  dimZero = false,
}: {
  rows: BarListRow[];
  valueSuffix?: (value: number) => string;
  empty: ReactNode;
  tooltip?: (row: BarListRow) => string;
  dimZero?: boolean;
}) {
  if (!rows.length || rows.every((r) => r.value === 0)) return <>{empty}</>;

  return (
    <ul className="-mx-2 flex flex-col">
      {rows.map((row) => {
        const width = row.value > 0 ? Math.max(2, row.share * 100) : 0;
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn('min-w-0 truncate text-[0.875rem] font-medium text-ink', dimZero && row.value === 0 && 'text-muted')} title={row.label}>
                {row.label}
                {row.sublabel && <span className="ml-2 text-[0.75rem] font-normal text-muted">{row.sublabel}</span>}
              </span>
              <span className="shrink-0 text-[0.875rem] tabular-nums text-ink">
                <strong className={cn('font-semibold', dimZero && row.value === 0 && 'font-normal text-muted')}>{row.value.toLocaleString('en-US')}</strong>
                {valueSuffix && <span className="ml-1 text-muted">{valueSuffix(row.value)}</span>}
                {row.meta && <span className="ml-2 text-[0.75rem] text-muted">{row.meta}</span>}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full" aria-hidden>
              <div className="h-full rounded-r-[4px] bg-chart-1 transition-[width] duration-500" style={{ width: `${width}%` }} />
            </div>
            {tooltip && (
              <span
                role="tooltip"
                className="pointer-events-none absolute -top-8 right-2 z-10 hidden whitespace-nowrap rounded-md border border-line-strong bg-surface px-2.5 py-1 text-[0.75rem] text-ink group-hover:block group-focus-visible:block"
              >
                {tooltip(row)}
              </span>
            )}
          </>
        );
        const className =
          'group relative block rounded-md border border-transparent px-2 py-2 transition-colors hover:bg-hover-soft focus-visible:border-[var(--color-focus)] focus-visible:bg-hover-soft';
        return (
          <li key={row.key}>
            {row.href ? (
              <Link href={row.href} className={className}>
                {inner}
              </Link>
            ) : (
              <div className={className} tabIndex={0}>
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
