import * as React from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedBell } from '@/components/ui/animated-bell';
import { AnimatedExternalLink } from '@/components/ui/animated-external-link';
import { Sidebar, WorkspaceSwitcher } from '@/components/ui/sidebar';
import { FeedbackFab } from '@/components/ui/feedback-fab';
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
  // Document h1 lives here so every composed page has exactly one — the
  // in-surface PageTitle renders h2 (child sections use h3 without a skip).
  // Visually hidden; sourced from the active nav label so it's page-specific.
  const activePageLabel =
    SIDEBAR_SECTIONS.flatMap((s) => s.items).find((i) => i.id === activeNavId)?.label ??
    'Constellation Gate AI';
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-card">
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
          {/* Content locks at 1920px wide (the 3xl breakpoint). Beyond that
              the extra space falls to the right as margin; the DashTopBar
              sibling above stays full-bleed. */}
          <main className="flex flex-col flex-1 min-h-0 max-w-[1920px] gap-6 px-6 pt-6 pb-20 overflow-y-auto [&>*]:shrink-0">
            <h1 className="sr-only">{activePageLabel}</h1>
            {children}
          </main>
        </div>
      </div>
      {/* FeedbackFab uses `fixed` positioning and anchors to the viewport,
          not to this scroll container — placing it here as a sibling keeps
          the stacking context clean while the `fixed` rule escapes any
          overflow clipping from the scrollable content pane above. */}
      <FeedbackFab />
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
    <div className="flex items-center justify-between h-16 px-6 bg-card border-b border-border shrink-0">
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
            <AnimatedExternalLink data-icon="inline-end" aria-hidden className="relative -top-px" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Notifications"
        >
          <AnimatedBell className="size-4" strokeWidth={1.75} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
