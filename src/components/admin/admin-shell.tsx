'use client';

import {
  ClipboardList,
  ExternalLink,
  Images,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Quote,
  Settings,
  SlidersHorizontal,
  Tags,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { signOut } from '@/app/admin/actions/session';
import { Logo } from '@/components/layout/logo';
import { useEscape, useFocusTrap, useScrollLock } from '@/hooks/use-overlay';
import { SIDEBAR_COOKIE } from '@/lib/admin/constants';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/collections', label: 'Collections', icon: Layers },
  { href: '/admin/variants', label: 'Product Variants', icon: SlidersHorizontal },
  { href: '/admin/inquiries', label: 'Inquiries', icon: ClipboardList, badgeKey: 'inquiries' },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare, badgeKey: 'messages' },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Quote },
  { href: '/admin/content', label: 'Website Content', icon: PanelsTopLeft },
  { href: '/admin/media', label: 'Media Library', icon: Images },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/users', label: 'Admin Users', icon: Users },
] as const;


function NavList({ badges, collapsed = false, onNavigate }: { badges: Record<string, number>; collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin navigation" className="scroll-y flex-1 px-3 py-4">
      <ul className="space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === '/admin' ? pathname === '/admin' || pathname === '/admin/activity' : pathname.startsWith(item.href);
          const badge = 'badgeKey' in item ? badges[item.badgeKey] : 0;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? `${item.label}${badge ? ` (${badge} new)` : ''}` : undefined}
                className={cn(
                  'relative flex min-h-control-sm items-center gap-3 rounded-md border px-3 text-[0.9375rem] transition-colors',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'border-white/15 bg-white/[0.08] font-semibold text-canvas'
                    : 'border-transparent text-canvas/70 hover:bg-white/[0.05] hover:text-canvas',
                )}
              >
                {active && <span className="absolute inset-y-2 left-0 w-px bg-gold" aria-hidden />}
                <Icon className={cn('size-[18px] shrink-0', active ? 'text-gold' : 'text-canvas/60')} strokeWidth={1.75} aria-hidden />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {badge > 0 &&
                  (collapsed ? (
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-gold" aria-hidden />
                  ) : (
                    <span className="rounded-full bg-gold px-2 text-[0.75rem] font-semibold leading-5 text-ink">{badge}</span>
                  ))}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFooter({ email, collapsed = false }: { email: string; collapsed?: boolean }) {
  const itemClass = cn(
    'flex min-h-control-sm w-full items-center gap-3 rounded-md border border-transparent px-3 text-[0.875rem] text-canvas/70 transition-colors hover:bg-white/[0.05] hover:text-canvas',
    collapsed && 'justify-center px-0',
  );
  return (
    <div className="border-t border-white/10 p-3">
      <a href="/" target="_blank" rel="noopener noreferrer" className={itemClass} title={collapsed ? 'View website' : undefined} aria-label={collapsed ? 'View website' : undefined}>
        <ExternalLink className="size-4 shrink-0" aria-hidden /> {!collapsed && 'View website'}
      </a>
      {!collapsed && (
        <div className="flex items-center gap-2.5 px-3 py-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[0.75rem] font-semibold uppercase text-canvas" aria-hidden>
            {email.slice(0, 1)}
          </span>
          <p className="min-w-0 truncate text-[0.75rem] text-canvas/60" title={email}>
            {email}
          </p>
        </div>
      )}
      <form action={signOut}>
        <button type="submit" className={itemClass} title={collapsed ? 'Logout' : undefined} aria-label={collapsed ? 'Logout' : undefined}>
          <LogOut className="size-4 shrink-0" aria-hidden /> {!collapsed && 'Logout'}
        </button>
      </form>
    </div>
  );
}

function MobileDrawer({ open, onClose, email, badges }: { open: boolean; onClose: () => void; email: string; badges: Record<string, number> }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);
  useFocusTrap(panelRef, open);
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="animate-fade-in absolute inset-0 bg-espresso/40" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin menu"
        tabIndex={-1}
        className="on-dark animate-slide-in-left absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col border-r border-white/10 bg-espresso"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 pl-4 pr-2">
          <Logo tone="light" />
          <button type="button" onClick={onClose} aria-label="Close admin menu" title="Close" className="inline-flex size-11 items-center justify-center rounded-md border border-transparent text-canvas hover:bg-white/[0.06]">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <NavList badges={badges} onNavigate={onClose} />
        <SidebarFooter email={email} />
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  email,
  badges,
  initialCollapsed = false,
}: {
  children: ReactNode;
  email: string;
  badges: Record<string, number>;
  initialCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? 'collapsed' : 'expanded'}; path=/admin; max-age=31536000; samesite=lax`;
      return next;
    });
  };

  const totalBadges = (badges.inquiries ?? 0) + (badges.messages ?? 0);

  return (
    <div className={cn('min-h-dvh lg:grid', collapsed ? 'lg:grid-cols-[76px_minmax(0,1fr)]' : 'lg:grid-cols-[256px_minmax(0,1fr)]')}>
      <aside className="on-dark sticky top-0 hidden h-dvh flex-col border-r border-white/10 bg-espresso lg:flex" aria-label="Admin sidebar">
        <div className={cn('flex h-16 shrink-0 items-center border-b border-white/10', collapsed ? 'justify-center px-2' : 'justify-between pl-5 pr-2')}>
          <Link href="/admin" aria-label="Admin overview" className="rounded-md border border-transparent">
            <Logo tone="light" compact={collapsed} />
          </Link>
          {!collapsed && (
            <button type="button" onClick={toggleCollapsed} aria-label="Collapse sidebar" title="Collapse sidebar" className="inline-flex size-11 items-center justify-center rounded-md border border-transparent text-canvas/60 hover:bg-white/[0.06] hover:text-canvas">
              <PanelLeftClose className="size-[18px]" aria-hidden />
            </button>
          )}
        </div>
        {collapsed && (
          <button type="button" onClick={toggleCollapsed} aria-label="Expand sidebar" title="Expand sidebar" className="mx-auto mt-3 inline-flex size-11 items-center justify-center rounded-md border border-transparent text-canvas/60 hover:bg-white/[0.06] hover:text-canvas">
            <PanelLeftOpen className="size-[18px]" aria-hidden />
          </button>
        )}
        <NavList badges={badges} collapsed={collapsed} />
        <SidebarFooter email={email} collapsed={collapsed} />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface px-2 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" title="Menu" className="relative inline-flex size-11 items-center justify-center rounded-md border border-transparent hover:bg-hover-soft">
          <Menu className="size-5" aria-hidden />
          {totalBadges > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-gold" aria-hidden />}
        </button>
        <Link href="/admin" aria-label="Admin overview" className="flex min-h-11 items-center rounded-md border border-transparent">
          <Logo />
        </Link>
        <span className="size-11" aria-hidden />
      </header>

      <MobileDrawer open={open} onClose={() => setOpen(false)} email={email} badges={badges} />

      <main id="admin-main" className="min-w-0 px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pt-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}
