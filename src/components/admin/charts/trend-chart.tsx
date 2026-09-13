'use client';

import { BarChart3, Table2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';

export interface TrendDatum {
  label: string;
  fullLabel: string;
  current: number;
  previous: number;
}

const HEIGHT = 232;
const MARGIN = { top: 12, right: 12, bottom: 30, left: 34 };

function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => value / s <= 4) ?? magnitude * 10;
  return Math.ceil(value / step) * step;
}

/**
 * Line + area trend with a previous-period comparison.
 * Crosshair tooltip on pointer and keyboard (arrow keys); table view toggle.
 */
export function TrendChart({
  data,
  currentLabel,
  previousLabel,
  ariaLabel,
}: {
  data: TrendDatum[];
  currentLabel: string;
  previousLabel: string;
  ariaLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, [view]);

  const n = data.length;
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const max = niceMax(Math.max(0, ...data.map((d) => Math.max(d.current, d.previous))));
  const x = (i: number) => MARGIN.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => MARGIN.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];

  const { currentPath, previousPath, areaPath } = useMemo(() => {
    const line = (key: 'current' | 'previous') => data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
    const current = line('current');
    return {
      currentPath: current,
      previousPath: line('previous'),
      areaPath: n ? `${current} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : '',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, max]);

  // Show at most ~6 x labels (4 on narrow screens) to avoid collisions.
  const labelEvery = Math.max(1, Math.ceil(n / (width < 480 ? 4 : 6)));
  // First and last labels always show; in-between labels are dropped when they would sit
  // closer than MIN_LABEL_GAP px to a neighbour (edge labels are anchored start/end).
  const labelIndexes = useMemo(() => {
    if (!n) return [];
    const MIN_LABEL_GAP = 64;
    const picked = [0];
    for (let i = labelEvery; i < n - 1; i += labelEvery) {
      if (x(i) - x(picked[picked.length - 1]) >= MIN_LABEL_GAP && x(n - 1) - x(i) >= MIN_LABEL_GAP) picked.push(i);
    }
    if (n > 1) picked.push(n - 1);
    return picked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, width, labelEvery]);

  const onPointer = (event: PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const index = n <= 1 ? 0 : Math.round((px / rect.width) * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, index)));
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    setActive((prev) => {
      const base = prev ?? n - 1;
      if (event.key === 'Home') return 0;
      if (event.key === 'End') return n - 1;
      return Math.min(n - 1, Math.max(0, base + (event.key === 'ArrowRight' ? 1 : -1)));
    });
  };

  const point = active != null ? data[active] : null;
  const tooltipLeft = active != null ? x(active) : 0;
  const flip = tooltipLeft > width * 0.62;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-body" aria-label="Legend">
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full bg-chart-1" aria-hidden />
            {currentLabel}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full bg-chart-2" aria-hidden />
            {previousLabel}
          </li>
        </ul>
        <div role="group" aria-label="Chart view" className="field-group inline-flex items-center p-0.5">
          {(
            [
              ['chart', BarChart3, 'Chart'],
              ['table', Table2, 'Table'],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-[3px] border px-3 text-[0.8125rem] font-semibold transition-colors',
                view === key ? 'border-transparent bg-sand text-ink' : 'border-transparent text-muted hover:bg-hover-soft hover:text-ink',
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'table' ? (
        <div className="scroll-x max-h-[260px] overflow-y-auto rounded-md border border-line">
          <table className="w-full min-w-[320px] text-[0.875rem]">
            <thead className="sticky top-0 bg-surface text-left text-[0.75rem] uppercase tracking-[0.05em] text-muted">
              <tr className="border-b border-line">
                <th className="px-3 py-2 font-semibold">Period</th>
                <th className="px-3 py-2 text-right font-semibold">{currentLabel}</th>
                <th className="px-3 py-2 text-right font-semibold">{previousLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((d) => (
                <tr key={d.fullLabel}>
                  <td className="px-3 py-2 text-ink-soft">{d.fullLabel}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink">{d.current}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted">{d.previous}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          ref={wrapRef}
          className="relative rounded-md border border-transparent"
          tabIndex={0}
          role="img"
          aria-label={ariaLabel}
          onKeyDown={onKey}
          onFocus={() => setActive((prev) => prev ?? n - 1)}
          onBlur={() => setActive(null)}
        >
          <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} className="block max-w-full" aria-hidden>
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-chart-grid)" strokeWidth={1} />
                <text x={MARGIN.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                  {Number.isInteger(tick) ? tick : tick.toFixed(1)}
                </text>
              </g>
            ))}
            {labelIndexes.map((i) => (
              <text key={data[i].fullLabel} x={x(i)} y={HEIGHT - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="fill-muted text-[11px]">
                {data[i].label}
              </text>
            ))}
            <path d={areaPath} fill="var(--color-chart-wash)" />
            <path d={previousPath} fill="none" stroke="var(--color-chart-2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d={currentPath} fill="none" stroke="var(--color-chart-1)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {n > 0 && active == null && (
              <circle cx={x(n - 1)} cy={y(data[n - 1].current)} r={4} fill="var(--color-chart-1)" stroke="var(--color-surface)" strokeWidth={2} />
            )}
            {point && active != null && (
              <g>
                <line x1={x(active)} x2={x(active)} y1={MARGIN.top} y2={MARGIN.top + plotH} stroke="var(--color-line-strong)" strokeWidth={1} />
                <circle cx={x(active)} cy={y(point.previous)} r={4} fill="var(--color-chart-2)" stroke="var(--color-surface)" strokeWidth={2} />
                <circle cx={x(active)} cy={y(point.current)} r={4} fill="var(--color-chart-1)" stroke="var(--color-surface)" strokeWidth={2} />
              </g>
            )}
            <rect
              x={MARGIN.left}
              y={MARGIN.top}
              width={plotW}
              height={plotH}
              fill="transparent"
              onPointerMove={onPointer}
              onPointerDown={onPointer}
              onPointerLeave={() => setActive(null)}
            />
          </svg>
          {point && active != null && (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-md border border-line-strong bg-surface px-3 py-2 text-[0.8125rem]"
              style={flip ? { right: width - tooltipLeft + 12 } : { left: tooltipLeft + 12 }}
              role="status"
            >
              <p className="mb-1 font-medium text-ink-soft">{point.fullLabel}</p>
              <p className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-muted">
                  <span className="h-0.5 w-3 rounded-full bg-chart-1" aria-hidden />
                  {currentLabel}
                </span>
                <strong className="tabular-nums text-ink">{point.current}</strong>
              </p>
              <p className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-muted">
                  <span className="h-0.5 w-3 rounded-full bg-chart-2" aria-hidden />
                  {previousLabel}
                </span>
                <strong className="tabular-nums text-ink">{point.previous}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
