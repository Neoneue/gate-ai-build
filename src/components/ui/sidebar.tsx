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
  sections: SidebarSection[];
  /** When true, PRO-gated items (those flagged `locked`) render a lock icon.
   * Driven by the surface tier — passed true only on FREE/default surfaces so
   * the lock mirrors the workspace PRO/FREE badge. Defaults to false (PRO,
   * unlocked). */
  showLocks?: boolean;
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
  brand,
  userArea,
  showLocks = false,
}: SidebarProps) {
  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        "relative shrink-0 overflow-hidden border-border border-r bg-card transition-[width] duration-300 motion-reduce:transition-none",
        expanded ? "w-60" : "w-16"
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
          sections={sections}
          showLocks={showLocks}
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
}: {
  sections: SidebarSection[];
  activeId: string;
  onNavigate?: (pageId: string) => void;
}) {
  return (
    <div className="flex h-full w-16 shrink-0 flex-col items-center">
      <div className="flex h-16 w-full shrink-0 items-center justify-center border-border border-b">
        <img
          alt=""
          aria-hidden
          className="h-8 w-auto"
          src="/gate-ai-logo-mark.png"
        />
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
                        ? "flex size-9 items-center justify-center rounded-sm bg-neutral-200 text-neutral-900 transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
                        : isDisabled
                          ? "flex size-9 cursor-not-allowed items-center justify-center rounded-sm text-neutral-400 opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          : "flex size-9 items-center justify-center rounded-sm text-neutral-500 transition-[color,background-color,transform] duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
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

function SidebarExpanded({
  sections,
  activeId,
  onNavigate,
  brand,
  userArea,
  showLocks,
}: {
  sections: SidebarSection[];
  activeId: string;
  onNavigate?: (pageId: string) => void;
  brand?: React.ReactNode;
  userArea?: React.ReactNode;
  showLocks?: boolean;
}) {
  return (
    <div className="flex h-full w-60 shrink-0 flex-col">
      {/* Brand area — logomark + stacked wordmark (Constellation eyebrow,
          Gate AI title with "AI" in brand-blue). */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-border border-b px-4">
        {brand ?? <DefaultBrand />}
      </div>

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
                      ? "flex items-center gap-3 rounded-sm border border-border bg-linear-to-r from-neutral-100 to-neutral-50 px-2 py-2 font-medium text-neutral-900 shadow-xs transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
                      : isDisabled
                        ? "flex cursor-not-allowed items-center gap-3 rounded-sm border border-transparent px-2 py-2 text-neutral-500 opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        : "flex items-center gap-3 rounded-sm border border-transparent px-2 py-2 text-neutral-700 transition-[color,background-color,transform] duration-150 ease-out hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
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
                  <span className="font-sans text-sm">{item.label}</span>
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
      <div className="flex shrink-0 items-center justify-between gap-2 border-border border-t px-3 py-3">
        {userArea ?? <DefaultUserArea onNavigate={onNavigate} />}
      </div>
    </div>
  );
}

/* ─── Slot defaults ──────────────────────────────────────────────────────── */

function DefaultBrand() {
  return (
    <img
      alt="Constellation Gate AI"
      className="h-8 w-auto"
      draggable={false}
      src="/gate-ai-logo.png"
    />
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
        <span className="truncate font-medium font-sans text-neutral-900 text-sm leading-tight">
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
          className="relative inline-flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-neutral-500 transition-[color,background-color,transform] duration-150 ease-out after:absolute after:-inset-2 after:content-[''] hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
          type="button"
        >
          <MoreHorizontal className="size-4" strokeWidth={1.75} />
        </button>
      </UserMenu>
    </>
  );
}
