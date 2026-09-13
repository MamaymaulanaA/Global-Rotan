import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends ComponentProps<'button'> {
  label: string;
  variant?: 'plain' | 'surface' | 'outline' | 'dark';
  badge?: number;
}

const variants = {
  plain: 'border-transparent text-ink hover:bg-hover-soft focus-visible:bg-hover-soft',
  surface: 'border-line bg-surface text-ink hover:border-line-strong focus-visible:bg-hover-soft',
  outline: 'border-field-border text-ink hover:border-field-border-hover focus-visible:bg-hover-soft',
  dark: 'border-espresso bg-espresso text-canvas hover:bg-espresso-soft [--color-focus:var(--color-gold)]',
};

/** 44×44 touch target with an accessible label and a native tooltip on desktop. */
export function IconButton({ label, variant = 'plain', badge, className, children, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex size-11 shrink-0 items-center justify-center rounded-md border transition-colors duration-200 disabled:opacity-40',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          aria-hidden
          className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold leading-none text-ink"
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}
