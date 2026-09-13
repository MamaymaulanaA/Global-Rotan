import { Loader2 } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'outline' | 'outline-light' | 'ghost' | 'link' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Every variant has exactly one 1px border (transparent when not visible) so focus and
// selection never change the size. Keyboard focus = border colour + a soft background change.
const base =
  'inline-flex items-center justify-center gap-2 rounded-md border font-sans font-semibold tracking-[0.01em] text-center leading-tight transition-[background-color,color,border-color,opacity] duration-200 ease-[var(--ease-soft)] select-none disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55 [&_svg]:shrink-0';

const variants: Record<ButtonVariant, string> = {
  primary: 'border-gold bg-gold text-ink hover:border-gold-hover hover:bg-gold-hover focus-visible:bg-gold-hover [--color-focus:var(--color-ink)]',
  secondary: 'border-line bg-sand text-ink hover:border-line-strong hover:bg-sand-deep focus-visible:bg-sand-deep',
  dark: 'border-espresso bg-espresso text-canvas hover:bg-espresso-soft focus-visible:bg-espresso-soft [--color-focus:var(--color-gold)]',
  outline: 'border-ink/70 bg-transparent text-ink hover:border-ink hover:bg-hover-soft focus-visible:bg-hover-soft',
  'outline-light': 'border-white/60 bg-transparent text-white hover:border-white hover:bg-white/10 focus-visible:bg-white/10 [--color-focus:#e4c28c]',
  ghost: 'border-transparent bg-transparent text-ink hover:bg-hover-soft focus-visible:bg-hover-soft',
  link: 'border-transparent text-ink underline-offset-4 decoration-gold decoration-1 hover:underline',
  danger: 'border-danger bg-danger text-white hover:bg-danger/90 focus-visible:bg-danger/90 [--color-focus:var(--color-ink)]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-control-sm px-4 py-2 text-[0.875rem]',
  md: 'min-h-control px-6 py-2.5 text-[0.9375rem]',
  lg: 'min-h-control-lg px-7 py-3 text-base',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(base, variants[variant], variant === 'link' ? 'min-h-control-sm px-0 py-2' : sizes[size], className);
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant,
  size,
  loading,
  icon,
  iconRight,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: CommonProps & ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
      {iconRight}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  iconRight,
  className,
  children,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

export function ExternalButtonLink({
  variant,
  size,
  icon,
  iconRight,
  className,
  children,
  ...props
}: CommonProps & ComponentProps<'a'>) {
  return (
    <a className={buttonClasses({ variant, size, className })} target="_blank" rel="noopener noreferrer" {...props}>
      {icon}
      {children}
      {iconRight}
    </a>
  );
}
