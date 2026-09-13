'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

/** Tabs on large screens, accordion on small screens — same content, both accessible. */
export function ResponsiveTabs({ items, defaultId }: { items: TabItem[]; defaultId?: string }) {
  const [active, setActive] = useState(defaultId ?? items[0]?.id);
  const [open, setOpen] = useState<Set<string>>(() => new Set([defaultId ?? items[0]?.id]));
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    setActive(items[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      <div className="hidden lg:block">
        <div role="tablist" className="scroll-x flex gap-1 border-b border-line pb-0">
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={active === item.id}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={active === item.id ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                'min-h-control whitespace-nowrap rounded-t-md border px-4 text-[0.9375rem] transition-colors',
                active === item.id
                  ? '-mb-px border-line border-b-surface bg-surface font-semibold text-ink'
                  : 'border-transparent font-medium text-muted hover:bg-hover-soft hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {items.map((item) => (
          <div
            key={item.id}
            role="tabpanel"
            id={`${baseId}-panel-${item.id}`}
            aria-labelledby={`${baseId}-tab-${item.id}`}
            hidden={active !== item.id}
            tabIndex={0}
            className="py-8"
          >
            {item.content}
          </div>
        ))}
      </div>

      <div className="divide-y divide-line border-y border-line lg:hidden">
        {items.map((item) => {
          const isOpen = open.has(item.id);
          return (
            <div key={item.id}>
              <h3 className="font-sans text-base">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${baseId}-acc-${item.id}`}
                  onClick={() =>
                    setOpen((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                  className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left font-sans text-[0.9375rem] font-semibold text-ink"
                >
                  {item.label}
                  <ChevronDown className={cn('size-5 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} aria-hidden />
                </button>
              </h3>
              <div id={`${baseId}-acc-${item.id}`} hidden={!isOpen} className="pb-6">
                {item.content}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function Accordion({ items }: { items: { id: string; title: string; content: ReactNode }[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const baseId = useId();
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id}>
            <h3 className="font-sans">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${baseId}-${item.id}`}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-sans text-base font-semibold text-ink"
              >
                {item.title}
                <ChevronDown className={cn('size-5 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} aria-hidden />
              </button>
            </h3>
            <div id={`${baseId}-${item.id}`} hidden={!isOpen} className="pb-5 pr-8">
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
