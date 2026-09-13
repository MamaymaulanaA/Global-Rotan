import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'gold' | 'dark' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-sand text-ink-soft',
    gold: 'bg-gold-soft text-gold-ink',
    dark: 'bg-espresso text-canvas',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
    outline: 'border border-line-strong bg-surface/90 text-ink-soft',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-2 py-0.5 text-[0.75rem] font-semibold leading-5 tracking-[0.02em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Tag = 'h2',
  action,
  className,
  titleClassName,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  as?: ElementType;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className="eyebrow mb-3" data-reveal>
            {eyebrow}
          </p>
        )}
        <Tag className={cn('text-h2', titleClassName)} data-reveal>
          {title}
        </Tag>
        {description && (
          <p className="mt-4 text-lead" data-reveal style={{ '--reveal-delay': '60ms' } as CSSProperties}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center', className)}>
      {icon && <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-sand text-gold-ink">{icon}</div>}
      <h2 className="text-h3">{title}</h2>
      {description && <p className="mt-3 max-w-md">{description}</p>}
      {action && <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function Notice({
  children,
  tone = 'gold',
  icon,
  className,
}: {
  children: ReactNode;
  tone?: 'gold' | 'info' | 'warning' | 'danger' | 'success';
  icon?: ReactNode;
  className?: string;
}) {
  const tones = {
    gold: 'border-gold/40 bg-gold-soft text-ink-soft',
    info: 'border-info/25 bg-info-soft text-info',
    warning: 'border-warning/30 bg-warning-soft text-warning',
    danger: 'border-danger/30 bg-danger-soft text-danger',
    success: 'border-success/30 bg-success-soft text-success',
  };
  return (
    <div className={cn('flex gap-3 rounded-md border px-4 py-3 text-[0.875rem] leading-relaxed', tones[tone], className)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}
