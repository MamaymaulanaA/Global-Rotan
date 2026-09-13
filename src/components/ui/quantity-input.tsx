'use client';

import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  id?: string;
  labelDecrease: string;
  labelIncrease: string;
  ariaLabel?: string;
  describedBy?: string;
  className?: string;
  size?: 'md' | 'sm';
}

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 100000,
  id,
  labelDecrease,
  labelIncrease,
  ariaLabel,
  describedBy,
  className,
  size = 'md',
}: QuantityInputProps) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw.replace(/\D/g, ''), 10);
    const next = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), max) : Math.max(min, 1);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  // Outer group owns the single 1px border (focus-within colours it); inner parts are borderless.
  // Inner height is ≥44px so each step button is a full 44×44 touch target.
  const height = size === 'sm' ? 'h-[2.875rem]' : 'h-[3.125rem]';
  const stepButton =
    'inline-flex w-11 shrink-0 items-center justify-center rounded-[3px] text-ink transition-colors hover:bg-hover-soft focus-visible:bg-hover-soft disabled:cursor-not-allowed disabled:text-line-strong disabled:hover:bg-transparent';

  return (
    <div className={cn('field-group inline-flex items-stretch', height, className)}>
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} aria-label={labelDecrease} title={labelDecrease} className={stepButton}>
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
          }
        }}
        className="field-bare w-14 text-center text-[0.9375rem] font-semibold tabular-nums text-ink"
      />
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={labelIncrease} title={labelIncrease} className={stepButton}>
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
