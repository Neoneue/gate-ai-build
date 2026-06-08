import * as React from 'react';
import { Check, ChevronsUpDown, Lock, MoreHorizontal } from 'lucide-react';
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from '@/components/ui/menu';
import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Separator } from '@/components/ui/separator';
import { UserMenu } from '@/components/ui/user-menu';
import { BrandMark } from '@/components/icons/brand-mark';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * Sidebar — production-shell primary navigation primitive.
 *
 * Renders the collapsed (64px icon rail) and expanded (240px full nav)
 * variants together inside a single <aside> with a width animation +
 * opacity cross-fade. The non-active variant is `inert` so keyboard
 * focus and AT only ever land on the visible variant.
 *
 * Consumed by `_shared/DashboardChrome` (CMP-012/013/014). The expanded
 * variant exposes `brand` / `workspaceSwitcher` / `userArea` slots; the
 * collapsed rail uses the `brand` slot up top and the workspace switcher
 * + user area collapse to a single CP monogram at the bottom.
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
  sections: SidebarSection[];
  /** id of the active item, matched against `SidebarItem.id`. */
  activeId: string;
  expanded: boolean;
  onNavigate?: (pageId: string) => void;
  /** Brand lockup. Defaults to BrandMark + Constellation / Gate AI wordmark.
   *  Collapsed rail only renders the BrandMark portion (the slot is rendered
   *  via the `brandCollapsed` prop OR — when undefined — falls back to a
   *  `<BrandMark className="size-8 text-blue-700" />`). */
  brand?: React.ReactNode;
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
}: SidebarProps) {
  return (
    <aside
      aria-label="Primary navigation"
      style={{ transitionTimingFunction: 'var(--ease-drawer)' }}
      className={cn(
        'relative shrink-0 overflow-hidden bg-card border-r border-border transition-[width] duration-300 motion-reduce:transition-none',
        expanded ? 'w-60' : 'w-16',
      )}
    >
      {/* `inert` removes the inactive variant from focus order, click,
          and AT in one attribute (React 19 + modern browsers). The
          opacity/pointer-events classes remain for the cross-fade
          paint state. */}
      <div
        inert={expanded}
        className={cn(
          'absolute inset-y-0 left-0 transition-opacity duration-200 ease-out motion-reduce:transition-none',
          expanded ? 'opacity-0 pointer-events-none' : 'opacity-100',
        )}
      >
        <SidebarCollapsed
          sections={sections}
          activeId={activeId}
          onNavigate={onNavigate}
        />
      </div>
      <div
        inert={!expanded}
        className={cn(
          'absolute inset-y-0 left-0 transition-opacity duration-200 ease-out motion-reduce:transition-none',
          expanded ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <SidebarExpanded
          sections={sections}
          activeId={activeId}
          onNavigate={onNavigate}
          brand={brand}
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
    <div className="flex flex-col items-center justify-between w-16 h-full py-5 shrink-0">
      <div className="flex flex-col items-center gap-1 w-full">
        <BrandMark className="size-8 text-blue-700" />
        {sections.map((section, i) => (
          <div
            key={section.label ?? `top-${i}`}
            className="flex flex-col items-center gap-1 w-full"
          >
            <Separator className={i === 0 ? 'w-8 my-2' : 'w-8 my-1'} />
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              const isDisabled = !item.pageId;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  disabled={isDisabled}
                  onClick={item.pageId ? () => onNavigate?.(item.pageId!) : undefined}
                  // Collapsed-rail icon buttons (36px square) use
                  // `active:scale-[0.99]` — a subtle 1% scale-down on press,
                  // matching the project's Button primitive press feel.
                  className={
                    isActive
                      ? 'flex items-center justify-center size-9 rounded-sm bg-neutral-200 text-neutral-900 transition-transform duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                      : isDisabled
                        ? 'flex items-center justify-center size-9 rounded-sm text-neutral-300 cursor-not-allowed opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                        : 'flex items-center justify-center size-9 rounded-sm text-neutral-500 transition-[color,background-color,transform] duration-150 ease-out hover:text-neutral-700 hover:bg-neutral-100 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                  }
                >
                  <Icon className="size-[18px]" strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center size-6 rounded-full bg-blue-700 text-white font-mono text-xs font-medium">
        CP
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
}: {
  sections: SidebarSection[];
  activeId: string;
  onNavigate?: (pageId: string) => void;
  brand?: React.ReactNode;
  userArea?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-60 h-full shrink-0">
      {/* Brand area — logomark + stacked wordmark (Constellation eyebrow,
          Gate AI title with "AI" in brand-blue). */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border shrink-0">
        {brand ?? <DefaultBrand />}
      </div>

      {/* Nav sections */}
      <nav className="flex flex-col gap-4 px-3 pt-3 pb-6 overflow-y-auto flex-1">
        {sections.map((section, i) => (
          <div key={section.label ?? `top-${i}`} className="flex flex-col gap-1">
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
                  key={item.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  disabled={isDisabled}
                  onClick={item.pageId ? () => onNavigate?.(item.pageId!) : undefined}
                  className={
                    isActive
                      ? 'flex items-center gap-3 px-2 py-2 rounded-sm border border-border bg-linear-to-r from-neutral-100 to-neutral-50 text-neutral-900 font-medium shadow-xs transition-transform duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                      : isDisabled
                        ? 'flex items-center gap-3 px-2 py-2 rounded-sm border border-transparent text-neutral-400 cursor-not-allowed opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                        : 'flex items-center gap-3 px-2 py-2 rounded-sm border border-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                  }
                >
                  <Icon
                    className={cn('size-4 shrink-0', isActive && 'text-foreground')}
                    strokeWidth={1.75}
                  />
                  <span className="font-sans text-sm">{item.label}</span>
                  {item.locked ? (
                  	<>
                  		<Lock
                  			className="ml-auto size-4 shrink-0 text-muted-foreground/60"
                  			strokeWidth={1.75}
                  			aria-hidden
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
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-t border-border shrink-0">
        {userArea ?? <DefaultUserArea onNavigate={onNavigate} />}
      </div>
    </div>
  );
}

/* ─── Slot defaults ──────────────────────────────────────────────────────── */

function DefaultBrand() {
  return (
    <img
      src="/gate-ai-logo.png"
      alt="Constellation Gate AI"
      className="h-9 w-auto"
      draggable={false}
    />
  );
}

/* Workspace switcher — formerly slotted into the sidebar, promoted to the
 * top bar on 2026-05-17 so the sidebar reads as pure navigation. Styled
 * for the top bar's compact h-8 chrome (auto-sized to content; no
 * truncation since the top bar has room). */
export function WorkspaceSwitcher() {
  return (
    <Menu>
      <MenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-2 h-8 px-2 rounded-sm border border-border bg-card outline-none hover:bg-neutral-50 aria-expanded:bg-neutral-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-[colors,box-shadow,scale] duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
          />
        }
      >
        <span className="font-sans text-sm text-neutral-900">
          Chad's workspace
        </span>
        <Badge variant="neutral">Free</Badge>
        <ChevronsUpDown className="size-4 text-neutral-500" strokeWidth={1.75} aria-hidden />
      </MenuTrigger>
      <MenuContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="min-w-[var(--anchor-width)] p-2"
      >
        <MenuItem className="bg-neutral-100 data-[highlighted]:bg-neutral-100">
          <span className="flex-1 text-left truncate min-w-0">Chad's workspace</span>
          <Check strokeWidth={1.75} aria-hidden />
        </MenuItem>
        <MenuItem>
          <span className="flex-1 text-left truncate min-w-0">OpenClaw org</span>
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function DefaultUserArea({ onNavigate }: { onNavigate?: (pageId: string) => void }) {
  return (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="size-7 shrink-0 inline-flex items-center justify-center rounded-full bg-blue-700 text-white font-mono text-xs font-medium"
          aria-hidden
        >
          CP
        </span>
        <span className="font-sans text-sm font-medium text-neutral-900 truncate leading-tight">Chad Ponticas</span>
      </div>
      <UserMenu onNavigate={onNavigate} side="right" align="end" sideOffset={12}>
        <button
          type="button"
          aria-label="User menu"
          className="relative shrink-0 size-7 inline-flex items-center justify-center rounded-sm border border-border bg-card text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 after:absolute after:-inset-2 after:content-['']"
        >
          <MoreHorizontal className="size-4" strokeWidth={1.75} />
        </button>
      </UserMenu>
    </>
  );
}
