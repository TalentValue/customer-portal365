'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { SidebarNav } from './sidebar';
import { Header } from './header';
import { adminNav, portalNav } from './nav-config';

type AppShellProps = {
  variant: 'admin' | 'portal';
  title: string;
  showSearch?: boolean;
  user?: { name: string; roleLabel: string };
  children: React.ReactNode;
};

/**
 * Shared app shell (DESIGN_SYSTEM §2): collapsible sidebar + top header.
 * - md+ : fixed sidebar, 240px expanded / 64px collapsed (toggle in header).
 * - <md : off-canvas drawer toggled by hamburger.
 *
 * Nav is selected by `variant` inside this client component so icon components
 * never cross the server→client prop boundary.
 */
export function AppShell({ variant, title, showSearch, user, children }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const nav = variant === 'admin' ? adminNav : portalNav;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          'hidden shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:block',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <SidebarNav nav={nav} collapsed={collapsed} user={user} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-60 border-r border-sidebar-border bg-sidebar shadow-lg">
            <SidebarNav nav={nav} collapsed={false} user={user} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          collapsed={collapsed}
          showSearch={showSearch}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
