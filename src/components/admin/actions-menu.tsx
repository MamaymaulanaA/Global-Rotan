'use client';

import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface ActionItem {
  label: string;
  icon?: LucideIcon;
  href?: string;
  external?: boolean;
  onSelect?: () => void;
  danger?: boolean;
  hidden?: boolean;
}

/**
 * Accessible "⋯" row menu: Arrow keys, Home/End, Escape and Tab close,
 * click outside closes, focus returns to the trigger. 1px borders, no shadow.
 */
export function ActionsMenu({ label, items, disabled }: { label: string; items: ActionItem[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const visible = items.filter((i) => !i.hidden);

  const focusItem = (index: number) => {
    const nodes = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!nodes?.length) return;
    nodes[(index + nodes.length) % nodes.length].focus({ preventScroll: true });
  };

  // The menu is positioned `fixed` from the trigger rect so it is never clipped by a
  // horizontally scrolling table; it opens upwards when there is no room below.
  const place = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const height = visible.length * 44 + 10;
    const below = rect.bottom + 4 + height <= window.innerHeight - 8 || rect.top < height + 12;
    setPosition({ top: below ? rect.bottom + 4 : rect.top - 4 - height, right: Math.max(8, window.innerWidth - rect.right) });
  };

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => focusItem(0));
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onViewportChange = () => setOpen(false);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, { capture: true, passive: true });
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, { capture: true });
    };
  }, [open]);

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const current = nodes.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(current + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(current - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(nodes.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  const itemClass = (danger?: boolean) =>
    cn(
      'flex min-h-control-sm w-full items-center gap-2.5 rounded-[3px] border border-transparent px-3 text-left text-[0.875rem] transition-colors',
      danger ? 'text-danger hover:bg-danger-soft focus-visible:bg-danger-soft' : 'text-ink hover:bg-hover-soft focus-visible:bg-hover-soft',
    );

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => {
          if (!open) place();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            place();
            setOpen(true);
          }
        }}
        className="inline-flex size-11 items-center justify-center rounded-md border border-field-border bg-surface text-ink transition-colors hover:border-field-border-hover hover:bg-hover-soft disabled:opacity-45"
      >
        <MoreHorizontal className="size-[18px]" aria-hidden />
      </button>
      {open && position && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          style={{ top: position.top, right: position.right }}
          className="animate-fade-in fixed z-50 w-56 max-w-[calc(100vw-1rem)] rounded-md border border-line-strong bg-surface p-1 text-left"
        >
          {visible.map(({ label: itemLabel, icon: Icon, href, external, onSelect, danger }) => {
            const content = (
              <>
                {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />}
                <span className="truncate">{itemLabel}</span>
              </>
            );
            if (href) {
              return external ? (
                <a key={itemLabel} role="menuitem" href={href} target="_blank" rel="noopener noreferrer" className={itemClass(danger)} onClick={() => setOpen(false)}>
                  {content}
                </a>
              ) : (
                <Link key={itemLabel} role="menuitem" href={href} className={itemClass(danger)} onClick={() => setOpen(false)}>
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={itemLabel}
                role="menuitem"
                type="button"
                className={itemClass(danger)}
                onClick={() => {
                  setOpen(false);
                  onSelect?.();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
