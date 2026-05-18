import * as React from 'react';
import {
  Bell,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar, WorkspaceSwitcher } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { SIDEBAR_SECTIONS } from './nav-sections';

/* ─────────────────────────────────────────────────────────────────────────
 * DashboardChrome — production-shell wrapper shared by CMP-012 / CMP-013 /
 * CMP-014 surfaces. Renders the primary <Sidebar> and the DashTopBar
 * (toggle + Docs/Notifications). Page content is passed in via `children`.
 *
 * Single source of truth for the nav data lives in `./nav-sections`
 * (no longer duplicated 3×). Active state is derived from `activeNavId`,
 * matched against `SidebarItem.id`.
 * ───────────────────────────────────────────────────────────────────────── */

export interface DashboardChromeProps {
  /** id of the active sidebar item. */
  activeNavId: string;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  onNavigate?: (pageId: string) => void;
  /** Hide the global "Documentation" button in the top bar. Used on
   *  pages that surface their own docs entrypoint (e.g. ApiKeys' "Key
   *  docs" button + inline link inside the Using your key section). */
  hideDocsButton?: boolean;
  children: React.ReactNode;
}

export function DashboardChrome({
  activeNavId,
  sidebarExpanded,
  onToggleSidebar,
  onNavigate,
  hideDocsButton = false,
  children,
}: DashboardChromeProps) {
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-white">
      <div className="flex flex-row flex-1 min-h-0">
        <Sidebar
          sections={SIDEBAR_SECTIONS}
          activeId={activeNavId}
          expanded={sidebarExpanded}
          onNavigate={onNavigate}
        />
        <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-neutral-50">
          <DashTopBar
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={onToggleSidebar}
            hideDocsButton={hideDocsButton}
          />
          {/* Content pane fills the remaining column height and scrolls
              internally — `flex-1 min-h-0` makes it a bounded flex child
              (without `min-h-0` a flex item won't shrink below its
              content and the scroll container never forms). `[&>*]:shrink-0`
              keeps direct children at their natural heights so the pane
              scrolls instead of squashing them. */}
          <div className="flex flex-col flex-1 min-h-0 gap-6 px-6 pt-6 pb-8 overflow-y-auto [&>*]:shrink-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Top bar (toggle + actions) ───────────────────────────────────────── */

function DashTopBar({
  sidebarExpanded,
  onToggleSidebar,
  hideDocsButton = false,
}: {
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  hideDocsButton?: boolean;
}) {
  return (
    <div className="flex items-center justify-between h-14 px-6 bg-white border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={sidebarExpanded}
          onClick={onToggleSidebar}
          className="-ml-2 text-neutral-500 hover:text-neutral-700 aria-expanded:bg-transparent aria-expanded:text-neutral-500 hover:aria-expanded:text-neutral-700"
        >
          {/* Contextual icon cross-fade. Both icons stay in DOM,
              absolute-positioned; toggle scale/opacity/blur. The skill's
              reference 4px blur dissolves a 16px icon into fuzz at
              scale 0.25 — using 1px here so the softening reads as
              edge-feathering, not vanish-into-blob. */}
          <span className="relative inline-flex size-4 items-center justify-center">
            <PanelLeftClose
              aria-hidden
              strokeWidth={1.75}
              className={cn(
                'absolute size-4 transition-[opacity,transform,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
                sidebarExpanded
                  ? 'opacity-100 scale-100 blur-0'
                  : 'opacity-0 scale-[0.25] blur-[1px]',
              )}
            />
            <PanelLeftOpen
              aria-hidden
              strokeWidth={1.75}
              className={cn(
                'absolute size-4 transition-[opacity,transform,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
                sidebarExpanded
                  ? 'opacity-0 scale-[0.25] blur-[1px]'
                  : 'opacity-100 scale-100 blur-0',
              )}
            />
          </span>
        </Button>
        {/* Workspace switcher promoted from the sidebar (2026-05-17) — global
         *  scope chrome belongs in the top bar alongside other account-level
         *  controls (Docs, notifications), not in the navigation pane. */}
        <WorkspaceSwitcher />
      </div>
      <div className="flex items-center gap-1">
        {hideDocsButton ? null : (
          <Button variant="outline" size="sm">
            Docs
            <ExternalLink data-icon="inline-end" aria-hidden />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Notifications"
        >
          <Bell className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
