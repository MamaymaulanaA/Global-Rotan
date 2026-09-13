'use client';

import { X } from 'lucide-react';
import { useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useEscape, useFocusTrap, useScrollLock } from '@/hooks/use-overlay';
import { cn } from '@/lib/utils';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  hideTitle?: boolean;
  description?: ReactNode;
  children: ReactNode;
  closeLabel: string;
  className?: string;
  initialFocus?: RefObject<HTMLElement | null>;
  footer?: ReactNode;
}

/** Overlays only render after user interaction, so the portal target always exists and refs are ready for the focus trap. */
function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

function useOverlay(open: boolean, onClose: () => void, initialFocus?: RefObject<HTMLElement | null>) {
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);
  useFocusTrap(panelRef, open, initialFocus);
  useEscape(open, onClose);
  return panelRef;
}

/** Centered modal: closes via X, backdrop click and Escape; traps focus; locks page scroll. */
export function Dialog({ open, onClose, title, hideTitle, description, children, closeLabel, className, initialFocus, footer }: OverlayProps) {
  const panelRef = useOverlay(open, onClose, initialFocus);
  const titleId = useId();
  const descId = useId();
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
        <div className="animate-fade-in absolute inset-0 bg-espresso/40" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            'animate-rise-in relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-t-xl border border-line bg-canvas sm:max-h-[88dvh] sm:max-w-lg sm:rounded-lg',
            className,
          )}
        >
          <div className={cn('flex shrink-0 items-center justify-between gap-4 border-b border-line bg-canvas px-4 py-2 sm:px-6', hideTitle && 'absolute right-0 top-0 z-10 border-0 bg-transparent p-2 sm:p-3')}>
            <h2 id={titleId} className={cn('min-w-0 text-lg leading-snug sm:text-xl', hideTitle && 'sr-only')}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              title={closeLabel}
              className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md border-transparent bg-canvas text-ink transition-colors hover:bg-hover-soft focus-visible:bg-hover-soft"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {description && (
            <p id={descId} className="sr-only">
              {description}
            </p>
          )}
          <div className="scroll-y min-h-0 flex-1">{children}</div>
          {footer && <div className="shrink-0 border-t border-line bg-canvas px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

/** Slide-over panel (left / right) or bottom sheet. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  closeLabel,
  side = 'right',
  className,
  footer,
  initialFocus,
}: OverlayProps & { side?: 'left' | 'right' | 'bottom' }) {
  const panelRef = useOverlay(open, onClose, initialFocus);
  const titleId = useId();
  if (!open) return null;

  const position = {
    right: 'right-0 top-0 h-dvh w-[min(420px,92vw)] animate-slide-in-right',
    left: 'left-0 top-0 h-dvh w-[min(380px,88vw)] animate-slide-in-left',
    bottom: 'bottom-0 left-0 max-h-[88dvh] w-full rounded-t-xl animate-slide-up',
  }[side];

  return (
    <Portal>
      <div className="fixed inset-0 z-[80]">
        <div className="animate-fade-in absolute inset-0 bg-espresso/40" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn('absolute flex flex-col border-line bg-canvas', side === 'right' ? 'border-l' : side === 'left' ? 'border-r' : 'border-t', position, className)}
        >
          {side === 'bottom' && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong" aria-hidden />}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-2">
            <h2 id={titleId} className="text-lg">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              title={closeLabel}
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-md text-ink transition-colors hover:bg-hover-soft focus-visible:bg-hover-soft"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="scroll-y min-h-0 flex-1">{children}</div>
          {footer && <div className="shrink-0 border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  closeLabel,
  tone = 'danger',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
  tone?: 'danger' | 'default';
  loading?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={open} onClose={onClose} title={title} closeLabel={closeLabel} initialFocus={cancelRef} className="sm:max-w-md">
      <div className="px-5 py-5 sm:px-6">
        {message && <div className="text-[0.9375rem]">{message}</div>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-md border border-line-strong px-5 text-[0.9375rem] font-semibold text-ink hover:border-ink"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'min-h-11 rounded-md px-5 text-[0.9375rem] font-semibold disabled:opacity-60',
              tone === 'danger' ? 'bg-danger text-white hover:bg-danger/90' : 'bg-gold text-ink hover:bg-gold-hover',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
