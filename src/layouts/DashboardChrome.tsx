import * as React from 'react';
import {
  Bell,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/ui/sidebar';
import { UserMenu } from '@/components/ui/user-menu';
import { cn } from '@/lib/utils';
import { SIDEBAR_SECTIONS } from './nav-sections';

/* ─────────────────────────────────────────────────────────────────────────
 * DashboardChrome — production-shell wrapper shared by CMP-012 / CMP-013 /
 * CMP-014 surfaces. Renders the outer surface card, the macOS-style
 * ScreenHead strip (traffic lights + URL + eyebrow), the primary <Sidebar>,
 * and the DashTopBar (toggle + breadcrumb + Docs/Notifications/avatar).
 * Page content is passed in via `children`.
 *
 * Single source of truth for the nav data lives in `./nav-sections`
 * (no longer duplicated 3×). Active state is derived from `activeNavId`,
 * matched against `SidebarItem.id`.
 * ───────────────────────────────────────────────────────────────────────── */

export interface DashboardChromeProps {
  /** URL slug rendered after `acme-prod.constellation.io / ` in ScreenHead. */
  urlSlug: string;
  /** Mono-uppercase eyebrow shown right-aligned in ScreenHead, prefixed `DIR.A · `. */
  screenEyebrow: string;
  /** Last (current-page) breadcrumb crumb. */
  breadcrumbCurrent: string;
  /** id of the active sidebar item. */
  activeNavId: string;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  onNavigate?: (pageId: string) => void;
  children: React.ReactNode;
}

export function DashboardChrome({
  urlSlug,
  screenEyebrow,
  breadcrumbCurrent,
  activeNavId,
  sidebarExpanded,
  onToggleSidebar,
  onNavigate,
  children,
}: DashboardChromeProps) {
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-white">
      <ScreenHead urlSlug={urlSlug} eyebrow={screenEyebrow} />
      <div className="flex flex-row flex-1 min-h-0">
        <Sidebar
          sections={SIDEBAR_SECTIONS}
          activeId={activeNavId}
          expanded={sidebarExpanded}
          onNavigate={onNavigate}
        />
        <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-ink-50">
          <DashTopBar
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={onToggleSidebar}
            breadcrumbCurrent={breadcrumbCurrent}
            onNavigate={onNavigate}
          />
          {/* Content pane scrolls internally; production frame stays
              fixed at 900px so every composed page has identical
              outer dimensions. `[&>*]:shrink-0` prevents direct
              children from collapsing under flex's default shrink-1
              when their natural total height exceeds the pane —
              instead they keep their natural heights and the pane
              scrolls. */}
          <div className="flex flex-col gap-6 px-6 pt-6 pb-8 overflow-y-auto [&>*]:shrink-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Screen head (production chrome strip) ──────────────────────────────── */

function ScreenHead({ urlSlug, eyebrow }: { urlSlug: string; eyebrow: string }) {
  return (
    <div className="relative flex items-center h-[41px] px-4 bg-ink-50 border-b border-ink-200 shrink-0">
      <div className="flex items-center gap-2">
        {/* macOS traffic-lights — tokens live in src/index.css so the
            chrome strip never inlines hex literals. */}
        <span className="size-2.5 rounded-full bg-[var(--color-traffic-red)]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[var(--color-traffic-amber)]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[var(--color-traffic-green)]" aria-hidden />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 font-mono text-xs text-ink-600 tabular-nums">
        acme-prod.constellation.io / {urlSlug}
      </div>
      <div className="ml-auto font-mono uppercase tracking-[0.1em] text-xs font-medium text-ink-500">
        DIR.A · {eyebrow}
      </div>
    </div>
  );
}

/* ─── Top bar (toggle + breadcrumb + actions) ──────────────────────────── */

function DashTopBar({
  sidebarExpanded,
  onToggleSidebar,
  breadcrumbCurrent,
  onNavigate,
}: {
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  breadcrumbCurrent: string;
  onNavigate?: (pageId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between h-[49px] px-6 bg-white border-b border-ink-200 shrink-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={sidebarExpanded}
          onClick={onToggleSidebar}
          className="-ml-2 text-ink-500 hover:text-ink-700 aria-expanded:bg-transparent aria-expanded:text-ink-500 hover:aria-expanded:text-ink-700"
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
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              {/* Buttons not anchors — this app has no router, so cmd/middle-
                  click on an anchor would lead nowhere. Same conversion as
                  PaginationLink. Visual contract = link styling, semantics
                  = button. */}
              <button
                type="button"
                className="font-sans text-xs text-ink-500 outline-none hover:text-ink-700 hover:underline focus-visible:text-ink-700 focus-visible:underline decoration-ink-500 underline-offset-2"
              >
                All Projects
              </button>
            </li>
            <li className="flex items-center" aria-hidden>
              <ChevronRight className="size-3 text-ink-400" strokeWidth={1.75} />
            </li>
            <li>
              <button
                type="button"
                className="font-sans text-xs text-ink-500 outline-none hover:text-ink-700 hover:underline focus-visible:text-ink-700 focus-visible:underline decoration-ink-500 underline-offset-2"
              >
                Constellation Gate AI
              </button>
            </li>
            <li className="flex items-center" aria-hidden>
              <ChevronRight className="size-3 text-ink-400" strokeWidth={1.75} />
            </li>
            <li>
              <span aria-current="page" className="font-sans text-xs font-medium text-ink-900">
                {breadcrumbCurrent}
              </span>
            </li>
          </ol>
        </nav>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm">
          Documentation
        </Button>
        {/* Skill: surfaces.md — promote to Button `icon-sm` so the hit
            target jumps from 24px to 32px without colliding with the
            adjacent Docs button (gap-1 = 4px) or the avatar span. */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          className="text-ink-500 hover:text-ink-900"
        >
          <Bell className="size-4" strokeWidth={1.75} />
        </Button>
        <UserMenu onNavigate={onNavigate} side="bottom" align="end" sideOffset={8}>
          <button
            type="button"
            aria-label="User menu"
            className="inline-flex items-center justify-center size-6 ml-2 rounded-full bg-blue-700 text-white font-sans text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 transition-[transform,box-shadow] duration-150 ease-out active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0"
          >
            <span aria-hidden>CP</span>
          </button>
        </UserMenu>
      </div>
    </div>
  );
}
