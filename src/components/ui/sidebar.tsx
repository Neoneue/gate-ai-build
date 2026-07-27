import { Lock, MoreHorizontal } from "lucide-react";
import type * as React from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/ui/user-menu";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Sidebar — production-shell primary navigation primitive.
 *
 * Renders the collapsed (64px icon rail) and expanded (240px full nav)
 * variants together inside a single <aside> with a width animation +
 * opacity cross-fade. The non-active variant is `inert` so keyboard
 * focus and AT only ever land on the visible variant.
 *
 * Consumed by `_shared/DashboardChrome` (CMP-012/013/014). The expanded
 * variant exposes `brand` / `userArea` slots; the collapsed rail uses the
 * `brand` slot up top and the user area collapses to a single CP monogram
 * at the bottom. (The workspace switcher was promoted to the top bar.)
 *
 * Animation values:
 *   - aside width: 300ms `cubic-bezier(0.32, 0.72, 0, 1)` (drawer curve)
 *   - variant cross-fade: 200ms `ease-out`
 *   - both honor `motion-reduce`.
 * ───────────────────────────────────────────────────────────────────────── */

export type SidebarItem = {
  id: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  /** When set, clicking the item calls the surface's `onNavigate(pageId)`
   *  so the inner sidebar can drive the outer App router. */
  pageId?: string;
  /** Show a muted, right-flush lock icon on this row — used to mark
   * Pro-gated features in the free-tier sidebar. */
  locked?: boolean;
};

export type SidebarSection = {
  /** Eyebrow group label (sans-uppercase). Omit for the top section
   *  (no header) — collapsed rail uses a `<Separator />` between groups
   *  in either case. */
  label?: string;
  items: SidebarItem[];
};

export interface SidebarProps {
  /** id of the active item, matched against `SidebarItem.id`. */
  activeId: string;
  /** Brand lockup. Defaults to BrandMark + Constellation / Gate AI wordmark.
   *  Collapsed rail only renders the BrandMark portion (the slot is rendered
   *  via the `brandCollapsed` prop OR — when undefined — falls back to a
   *  `<BrandMark className="size-8 text-blue-700" />`). */
  brand?: React.ReactNode;
  expanded: boolean;
  onNavigate?: (pageId: string) => void;
  /** Overview route for the active workspace tier (/overview, /overview-free,
   *  /overview-default). Logo click navigates here. */
  overviewPath?: string;
  sections: SidebarSection[];
  /** When true, PRO-gated items (those flagged `locked`) render a lock icon.
   * Driven by the surface tier — passed true only on FREE/default surfaces so
   * the lock mirrors the workspace PRO/FREE badge. Defaults to false (PRO,
   * unlocked). */
  showLocks?: boolean;
  /** Optional node rendered above the nav sections in the EXPANDED rail
   *  (below the brand, full-width). Used to relocate the workspace switcher
   *  into the rail when the top bar is too tight to hold it (desktop rail +
   *  Ask AI panel both open in the narrow band). Never reaches the collapsed
   *  icon rail — only the expanded variant renders it. */
  topSlot?: React.ReactNode;
  /** Bottom user area slot (expanded variant only). Defaults to "CP avatar
   *  + Chad + MoreHorizontal user-menu button". The collapsed rail always
   *  renders just a CP monogram. */
  userArea?: React.ReactNode;
}

export function Sidebar({
  sections,
  activeId,
  expanded,
  onNavigate,
  overviewPath,
  brand,
  userArea,
  showLocks = false,
  topSlot,
}: SidebarProps) {
  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        "relative shrink-0 overflow-hidden border-border border-r bg-card transition-[width] duration-300 motion-reduce:transition-none",
        expanded ? "w-66" : "w-16"
      )}
      style={{ transitionTimingFunction: "var(--ease-drawer)" }}
    >
      {/* `inert` removes the inactive variant from focus order, click,
          and AT in one attribute (React 19 + modern browsers). The
          opacity/pointer-events classes remain for the cross-fade
          paint state. */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-opacity duration-200 ease-out motion-reduce:transition-none",
          expanded ? "pointer-events-none opacity-0" : "opacity-100"
        )}
        inert={expanded}
      >
        <SidebarCollapsed
          activeId={activeId}
          onNavigate={onNavigate}
          overviewPath={overviewPath}
          sections={sections}
        />
      </div>
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-opacity duration-200 ease-out motion-reduce:transition-none",
          expanded ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        inert={!expanded}
      >
        <SidebarExpanded
          activeId={activeId}
          brand={brand}
          onNavigate={onNavigate}
          overviewPath={overviewPath}
          sections={sections}
          showLocks={showLocks}
          topSlot={topSlot}
          userArea={userArea}
        />
      </div>
    </aside>
  );
}

/* ─── Collapsed (64px icon rail) ─────────────────────────────────────────
 * Mirrors the section list so collapsed and expanded never drift. Section
 * groups are separated by a `<Separator />` since we don't have eyebrow
 * labels at this width. */

function SidebarCollapsed({
  sections,
  activeId,
  onNavigate,
  overviewPath,
}: {
  sections: SidebarSection[];
  activeId: string;
  onNavigate?: (pageId: string) => void;
  overviewPath?: string;
}) {
  return (
    <div className="flex h-full w-16 shrink-0 flex-col items-center">
      <div className="flex h-16 w-full shrink-0 items-center justify-center border-border border-b">
        <button
          aria-label="Go to overview"
          className="flex items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={overviewPath ? () => onNavigate?.(overviewPath) : undefined}
          type="button"
        >
          <img
            alt=""
            aria-hidden
            className="h-8 w-auto"
            src="/gate-ai-logo-mark.png"
          />
        </button>
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-between overflow-y-auto pt-3 pb-5">
        <div className="flex w-full flex-col items-center gap-1">
          {sections.map((section, i) => (
            <div
              className="flex w-full flex-col items-center gap-1"
              key={section.label ?? `top-${i}`}
            >
              {i > 0 && <Separator className="my-1 w-8" />}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                const isDisabled = !item.pageId;
                return (
                  <button
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    // Collapsed-rail icon buttons (36px square) use
                    // `active:scale-[0.98]` — a subtle 1% scale-down on press,
                    // matching the project's Button primitive press feel.
                    className={
                      isActive
                        ? "flex size-9 items-center justify-center rounded-sm bg-accent text-accent-foreground transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
                        : isDisabled
                          ? "flex size-9 cursor-not-allowed items-center justify-center rounded-sm text-muted-foreground opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          : "flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out hover:bg-accent hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
                    }
                    disabled={isDisabled}
                    key={item.id}
                    onClick={
                      item.pageId ? () => onNavigate?.(item.pageId!) : undefined
                    }
                    type="button"
                  >
                    <Icon className="size-[18px]" strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex size-6 items-center justify-center rounded-full bg-blue-700 font-medium font-mono text-white text-xs">
          CP
        </div>
      </div>
    </div>
  );
}

/* ─── Expanded (240px full nav) ─────────────────────────────────────────── */

export interface SidebarPanelProps {
  activeId: string;
  brand?: React.ReactNode;
  onNavigate?: (pageId: string) => void;
  overviewPath?: string;
  sections: SidebarSection[];
  showLocks?: boolean;
  /** Optional node rendered above the nav sections (below the brand header).
   *  Used by the mobile drawer to host the workspace switcher above Overview
   *  at the compact `xs` breakpoint. */
  topSlot?: React.ReactNode;
  userArea?: React.ReactNode;
}

/* Desktop expanded rail: the shared panel pinned at the 240px sidebar width. */
function SidebarExpanded(props: SidebarPanelProps) {
  return (
    <div className="h-full w-66 shrink-0">
      <SidebarPanel {...props} />
    </div>
  );
}

/* SidebarPanel — brand + nav + user area. Shared verbatim by the desktop
 * expanded rail and the mobile nav Sheet (DashboardChrome) so the two never
 * drift. Fills its container width (w-full); the consumer owns the width
 * (w-66 for the desktop rail, the Sheet width on mobile). */
export function SidebarPanel({
  sections,
  activeId,
  onNavigate,
  overviewPath,
  brand,
  userArea,
  showLocks,
  topSlot,
}: SidebarPanelProps) {
  const onLogoClick = overviewPath
    ? () => onNavigate?.(overviewPath)
    : undefined;
  return (
    <div className="flex h-full w-full flex-col">
      {/* Brand area — logomark + stacked wordmark (Constellation eyebrow,
          Gate AI title with "AI" in brand-blue). */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-border border-b px-4">
        {brand ?? <DefaultBrand onLogoClick={onLogoClick} />}
      </div>

      {topSlot}

      {/* Nav sections */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pt-3 pb-6">
        {sections.map((section, i) => (
          <div
            className="flex flex-col gap-1"
            key={section.label ?? `top-${i}`}
          >
            {section.label ? (
              <Eyebrow as="div" className="px-2 pt-1 pb-1">
                {section.label}
              </Eyebrow>
            ) : null}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              const isDisabled = !item.pageId;
              return (
                <button
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "flex items-center gap-3 rounded-sm border border-border bg-accent px-2 py-2 font-medium text-accent-foreground shadow-xs transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
                      : isDisabled
                        ? "flex cursor-not-allowed items-center gap-3 rounded-sm border border-transparent px-2 py-2 text-muted-foreground opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        : "flex items-center gap-3 rounded-sm border border-transparent px-2 py-2 text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
                  }
                  disabled={isDisabled}
                  key={item.id}
                  onClick={
                    item.pageId ? () => onNavigate?.(item.pageId!) : undefined
                  }
                  type="button"
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive && "text-foreground"
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="type-copy-14">{item.label}</span>
                  {item.locked && showLocks ? (
                    <>
                      <Lock
                        aria-hidden
                        className="ml-auto size-4 shrink-0 text-muted-foreground/60"
                        strokeWidth={1.75}
                      />
                      <span className="sr-only">(Pro feature)</span>
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom user area */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-border border-t px-3 py-4">
        {userArea ?? <DefaultUserArea onNavigate={onNavigate} />}
      </div>
    </div>
  );
}

/* ─── Slot defaults ──────────────────────────────────────────────────────── */

function DefaultBrand({ onLogoClick }: { onLogoClick?: () => void }) {
  return (
    <button
      aria-label="Go to overview"
      className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={onLogoClick}
      type="button"
    >
      <img
        alt="Constellation Gate AI"
        className="h-8 w-auto dark:hidden"
        draggable={false}
        src="/gate-ai-logo.png"
      />
      <img
        alt="Constellation Gate AI"
        className="hidden h-8 w-auto dark:block"
        draggable={false}
        src="/gate-ai-logo-dark.png"
      />
    </button>
  );
}

function DefaultUserArea({
  onNavigate,
}: {
  onNavigate?: (pageId: string) => void;
}) {
  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-700 font-medium font-mono text-white text-xs"
        >
          CP
        </span>
        <span className="type-label-14 truncate text-foreground leading-tight">
          Chad Ponticas
        </span>
      </div>
      <UserMenu
        align="end"
        onNavigate={onNavigate}
        side="right"
        sideOffset={12}
      >
        <button
          aria-label="User menu"
          className="relative inline-flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out after:absolute after:-inset-2 after:content-[''] hover:bg-accent hover:text-foreground active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
          type="button"
        >
          <MoreHorizontal className="size-4" strokeWidth={1.75} />
        </button>
      </UserMenu>
    </>
  );
}
