'use client';

import { AlertCircle, Search, X } from 'lucide-react';
import { forwardRef, useId, useImperativeHandle, useRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/*
 * Form controls share one visual contract (see globals.css "Interaction layer"):
 * a single 1px border in every state, colour-only hover/focus/error changes,
 * no rings, no shadows, no outlines.
 */

export type ControlSize = 'sm' | 'md' | 'lg';

const heights: Record<ControlSize, string> = {
  sm: 'min-h-control-sm text-[0.875rem]',
  md: 'min-h-control text-[0.9375rem]',
  lg: 'min-h-control-lg text-base',
};

const control = 'block w-full rounded-md px-3.5 text-ink';

export const Input = forwardRef<HTMLInputElement, Omit<ComponentProps<'input'>, 'size'> & { invalid?: boolean; controlSize?: ControlSize }>(
  function Input({ className, invalid, controlSize = 'md', ...props }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, heights[controlSize], 'py-2', className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'> & { invalid?: boolean }>(
  function Textarea({ className, invalid, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(control, 'resize-y py-3 text-[0.9375rem] leading-relaxed', className)}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, Omit<ComponentProps<'select'>, 'size'> & { invalid?: boolean; controlSize?: ControlSize }>(
  function Select({ className, invalid, children, controlSize = 'md', ...props }, ref) {
    return (
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(control, heights[controlSize], 'cursor-pointer', className)} {...props}>
        {children}
      </select>
    );
  },
);

export const Checkbox = forwardRef<HTMLInputElement, Omit<ComponentProps<'input'>, 'type'>>(function Checkbox({ className, ...props }, ref) {
  return <input ref={ref} type="checkbox" className={cn('mt-0.5', className)} {...props} />;
});

interface SearchInputProps extends Omit<ComponentProps<'input'>, 'size' | 'type' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  clearLabel?: string;
  controlSize?: ControlSize;
  trailing?: ReactNode;
}

/** Search field: one border, leading icon, clear button when filled. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, label, clearLabel = 'Clear search', controlSize = 'md', className, id, trailing, ...props },
  ref,
) {
  const innerRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn('relative w-full', className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
      <input
        ref={innerRef}
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        autoComplete="off"
        enterKeyHint="search"
        className={cn(control, heights[controlSize], 'py-2 pl-11', value ? 'pr-11' : 'pr-3.5')}
        {...props}
      />
      {value && !trailing && (
        <button
          type="button"
          onClick={() => {
            onValueChange('');
            innerRef.current?.focus();
          }}
          aria-label={clearLabel}
          title={clearLabel}
          className="absolute right-1 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover-soft hover:text-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
      {trailing}
    </div>
  );
});

interface FieldProps {
  label: ReactNode;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  error?: string;
  hint?: ReactNode;
  success?: ReactNode;
  required?: boolean;
  optionalLabel?: string;
  className?: string;
}

/** Label + control + hint + error, wired with aria attributes. */
export function Field({ label, children, error, hint, success, required, optionalLabel, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[0.875rem] font-medium leading-snug text-ink">
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        ) : optionalLabel ? (
          <span className="ml-1.5 text-[0.8125rem] font-normal text-muted">({optionalLabel})</span>
        ) : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-[0.8125rem] leading-snug text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-[0.8125rem] font-medium leading-snug text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {success && !error && <p className="text-[0.8125rem] font-medium text-success">{success}</p>}
    </div>
  );
}
