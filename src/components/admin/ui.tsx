import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Minus, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { InquiryStatus } from '@/types/domain';

/* ---------------------------------------------------------------------------
   Admin design primitives — 1px borders, no shadows, consistent spacing (4/8px).
--------------------------------------------------------------------------- */

export function AdminPageHeader({
  title,
  description,
  meta,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="-ml-2 mb-1 inline-flex min-h-control-sm items-center gap-1 rounded-md border border-transparent px-2 text-[0.875rem] text-muted hover:bg-hover-soft hover:text-ink">
            <ChevronLeft className="size-4" aria-hidden /> {back.label}
          </Link>
        )}
        <h1 className="text-[1.625rem] leading-tight sm:text-[1.875rem] lg:text-[2rem]">{title}</h1>
        {description && <div className="mt-1 text-[0.9375rem] text-body">{description}</div>}
        {meta && <div className="mt-1.5 text-[0.8125rem] text-muted">{meta}</div>}
      </div>
      {actions && <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end [&>*]:min-w-0">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  title,
  description,
  icon: Icon,
  actions,
  bodyClassName,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-lg border border-line bg-surface', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line py-2 pl-4 pr-2 sm:pl-5 sm:pr-3">
          <div className="flex min-w-[min(100%,12rem)] flex-1 items-start gap-2.5 py-1">
            {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-gold-ink" strokeWidth={1.75} aria-hidden />}
            <div className="min-w-0">
              {title && <h2 className="font-sans text-[0.9375rem] font-semibold leading-snug text-ink">{title}</h2>}
              {description && <p className="text-[0.8125rem] leading-snug text-muted">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex min-w-0 max-w-full items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('flex-1 p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-control-sm items-center gap-1 rounded-md border border-transparent px-2 text-[0.8125rem] font-semibold text-gold-ink hover:bg-hover-soft">
      {children}
      <ChevronRight className="size-3.5" aria-hidden />
    </Link>
  );
}

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  href,
  delta,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  icon: LucideIcon;
  href?: string;
  delta?: { value: number | null; label: string } | null;
  emphasis?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-md', emphasis ? 'bg-gold text-ink' : 'bg-gold-soft text-gold-ink')}>
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        {href && <ChevronRight className="mt-1 size-4 text-line-strong transition-colors group-hover:text-muted" aria-hidden />}
      </div>
      <p className="mt-3 text-[0.8125rem] font-medium leading-snug text-muted sm:mt-4">{label}</p>
      <p className="mt-1.5 font-sans text-[1.625rem] font-semibold leading-none tracking-[-0.01em] text-ink sm:text-[1.875rem]">{value}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-[0.75rem] leading-snug sm:text-[0.8125rem]">
        {delta && <DeltaPill value={delta.value} label={delta.label} />}
        {description && <span className="text-muted">{description}</span>}
      </div>
    </>
  );
  const className = cn(
    'group flex h-full min-h-[9.5rem] min-w-0 flex-col rounded-lg border bg-surface p-3.5 transition-colors sm:min-h-[10.5rem] sm:p-5',
    emphasis ? 'border-gold/50' : 'border-line',
    href && 'hover:border-line-strong hover:bg-[#fdfbf7] focus-visible:bg-[#fdfbf7]',
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function DeltaPill({ value, label }: { value: number | null; label: string }) {
  if (value == null) return <span className="text-muted">{label}</span>;
  const up = value > 0;
  const flat = value === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[0.75rem] font-semibold',
          flat ? 'bg-sand text-ink-soft' : up ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
        )}
      >
        <Icon className="size-3" strokeWidth={2.5} aria-hidden />
        {flat ? '0%' : `${up ? '+' : ''}${value}%`}
      </span>
      <span className="text-muted">{label}</span>
    </span>
  );
}

export function EmptyPanel({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-sand text-muted">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-3 text-[0.9375rem] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-[0.8125rem] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  quotation_sent: 'Quotation Sent',
  negotiation: 'Negotiation',
  confirmed: 'Confirmed',
  in_production: 'In Production',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_TONE: Record<string, string> = {
  new: 'border-gold/40 bg-gold-soft text-gold-ink',
  contacted: 'border-info/20 bg-info-soft text-info',
  quotation_sent: 'border-info/20 bg-info-soft text-info',
  negotiation: 'border-warning/25 bg-warning-soft text-warning',
  confirmed: 'border-success/25 bg-success-soft text-success',
  in_production: 'border-success/25 bg-success-soft text-success',
  completed: 'border-line bg-sand text-ink-soft',
  cancelled: 'border-danger/20 bg-danger-soft text-danger',
  published: 'border-success/25 bg-success-soft text-success',
  draft: 'border-line bg-sand text-ink-soft',
  archived: 'border-warning/25 bg-warning-soft text-warning',
  read: 'border-line bg-sand text-ink-soft',
  replied: 'border-success/25 bg-success-soft text-success',
  active: 'border-success/25 bg-success-soft text-success',
  inactive: 'border-line bg-sand text-muted',
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-full border px-2 py-px text-[0.75rem] font-semibold leading-5', STATUS_TONE[status] ?? 'border-line bg-sand text-ink-soft')}>
      {label ?? INQUIRY_STATUS_LABEL[status as InquiryStatus] ?? status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}

/** Desktop table wrapper; thin horizontal scroll only when the table genuinely needs it. */
export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('scroll-x rounded-lg border border-line bg-surface pb-0', className)}>{children}</div>;
}

export const th = 'whitespace-nowrap px-4 py-3 text-left text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-muted';
export const td = 'px-4 py-3 align-middle text-[0.9375rem]';
export const tr = 'transition-colors hover:bg-[#faf7f1]';
export const thead = 'border-b border-line bg-[#faf7f1]';

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-2">
        {children}
      </td>
    </tr>
  );
}

/** Mobile list of row cards (used instead of cramped tables below md). */
export function MobileList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn('flex flex-col gap-2 md:hidden', className)}>{children}</ul>;
}

export function Pager({ page, pageCount, hrefFor, total }: { page: number; pageCount: number; hrefFor: (page: number) => string; total?: number }) {
  if (pageCount <= 1) return null;
  const btn = 'inline-flex min-h-control-sm items-center gap-1 rounded-md border border-field-border bg-surface px-3 text-[0.875rem] font-medium text-ink hover:border-field-border-hover hover:bg-hover-soft';
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[0.875rem]">
      <span className="text-muted">
        Page <strong className="font-semibold text-ink">{page}</strong> of {pageCount}
        {total != null && <span> · {total.toLocaleString('en-US')} total</span>}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={btn}>
            <ChevronLeft className="size-4" aria-hidden /> Previous
          </Link>
        ) : (
          <span className={cn(btn, 'pointer-events-none opacity-45')} aria-hidden>
            <ChevronLeft className="size-4" /> Previous
          </span>
        )}
        {page < pageCount ? (
          <Link href={hrefFor(page + 1)} className={btn}>
            Next <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <span className={cn(btn, 'pointer-events-none opacity-45')} aria-hidden>
            Next <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}

export function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

export function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return formatDate(value);
}

/** Shared admin filter toolbar: search + selects + submit aligned on desktop, stacked on mobile. */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <form role="search" className={cn('mb-4 grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center [&>*]:min-w-0', className)}>
      {children}
    </form>
  );
}
