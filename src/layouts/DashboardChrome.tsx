import {
  BookOpen,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/App";
import { AskAiPanel } from "@/components/ui/ask-ai-panel";
import { Button } from "@/components/ui/button";
import { FeedbackFab } from "@/components/ui/feedback-fab";
import { NotificationsMenu } from "@/components/ui/notifications-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarPanel,
  type SidebarSection,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ViewRoleSwitch } from "@/components/ui/view-role-switch";
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import {
  isDefaultSurface,
  isEnterpriseSurface,
  isFreeSurface,
} from "@/lib/plan";
import { cn } from "@/lib/utils";
import { useViewRole } from "@/pages/teams/teams-store";
import {
  DEFAULT_SIDEBAR_SECTIONS,
  ENTERPRISE_SIDEBAR_SECTIONS,
  ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
  FREE_SIDEBAR_SECTIONS,
  SIDEBAR_SECTIONS,
} from "./nav-sections";

/* ─────────────────────────────────────────────────────────────────────────
 * DashboardChrome — production-shell wrapper shared by CMP-012 / CMP-013 /
 * CMP-014 surfaces. Renders the primary <Sidebar> and the DashTopBar
 * (sidebar toggle + workspace switcher on the left; notifications bell,
 * theme toggle, Ask AI, Docs and the mobile nav on the right). Page content
 * is passed in via `children`.
 *
 * Single source of truth for the nav data lives in `./nav-sections`
 * (no longer duplicated 3×). Active state is derived from `activeNavId`,
 * matched against `SidebarItem.id`.
 * ───────────────────────────────────────────────────────────────────────── */

export interface DashboardChromeProps {
  /** id of the active sidebar item. */
  activeNavId: string;
  children: ReactNode;
  /** Hide the global "Documentation" button in the top bar. Used on
   *  pages that surface their own docs entrypoint (e.g. ApiKeys' "Key
   *  docs" button + inline link inside the Using your key section). */
  hideDocsButton?: boolean;
  onNavigate?: (pageId: string) => void;
  onToggleSidebar: () => void;
  sidebarExpanded: boolean;
}

export function DashboardChrome({
  activeNavId,
  sidebarExpanded,
  onToggleSidebar,
  onNavigate,
  hideDocsButton = false,
  children,
}: DashboardChromeProps) {
  // Sidebar PRO-feature locks show on non-PRO surfaces. Section set is chosen
  // per workspace tier so nav links stay within their variant.
  const { pathname } = useLocation();
  // Restores <main>'s scroll position on back/forward; see the hook for why
  // the store lives outside this (per-page remounted) component.
  const mainRef = useScrollRestoration<HTMLElement>();
  const isDefault = isDefaultSurface(pathname);
  const isFree = isFreeSurface(pathname);
  const isEnterprise = isEnterpriseSurface(pathname);
  const viewRole = useViewRole();
  const showLocks = isDefault || isFree;
  const sections = isDefault
    ? DEFAULT_SIDEBAR_SECTIONS
    : isFree
      ? FREE_SIDEBAR_SECTIONS
      : isEnterprise
        ? viewRole === "admin"
          ? ENTERPRISE_SIDEBAR_SECTIONS
          : ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS
        : SIDEBAR_SECTIONS;
  const overviewPath = isDefault
    ? "/overview-default"
    : isFree
      ? "/overview-free"
      : isEnterprise
        ? "/overview-enterprise"
        : "/overview";
  // Upgrade promo in the rail follows the same tier signal as the nav lock
  // icons and the workspace badge (see lib/plan.ts): shown on the two non-PRO
  // surfaces, absent on PRO. It lands on that tier's own Billing page rather
  // than the PRO one, so the CTA never jumps the user across workspaces.
  // `?manage=1` opens the plan-comparison dialog on arrival (BillingFree's
  // PlanCard reads and strips it) so one click reaches the plan picker
  // instead of dropping the user on the page to hunt for the button.
  const upgradePath = isDefault
    ? "/billing-default?manage=1"
    : isFree
      ? "/billing-free?manage=1"
      : undefined;
  // Ask AI panel state is hoisted to App.tsx's Layout (localStorage-backed)
  // and read via the outlet context, so it survives navigation (each page
  // remounts its own DashboardChrome) and refresh. Default closed.
  const { askAiOpen, setAskAiOpen } = useOutletContext<LayoutContext>();
  // The push-panel is a docked flex sibling on lg+ (condenses the top bar +
  // content in sync). Below lg there's no rail and no horizontal room, so the
  // same shell opens in a right-docked Sheet instead. `isDesktop` gates which
  // mount is live so the Sheet never portals open alongside the docked column.
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) =>
      setIsDesktop(event.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);
  // Top-bar tight band. With the rail expanded AND the Ask AI panel open, the
  // main column narrows enough that the top-bar left group (toggle + workspace
  // switcher) crowds the right group (Ask AI / Docs) and the panel header.
  // Measured collision onset ~1150px viewport; 1280 sits above it so the swap
  // fires before any overlap. Below this we relocate the switcher into the rail.
  const [isTight, setIsTight] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1280px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1280px)");
    const handleChange = (event: MediaQueryListEvent) =>
      setIsTight(event.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);
  // Relocate the workspace switcher from the top bar into the expanded rail
  // only in the tight desktop band with both rail and panel open. Auto-reverses
  // via state (rail collapse / panel close) or matchMedia (viewport widens).
  const switcherInRail = isDesktop && sidebarExpanded && askAiOpen && isTight;
  const closeAskAi = () => setAskAiOpen(false);
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background lg:h-screen lg:overflow-hidden">
      <div className="flex flex-row lg:min-h-0 lg:flex-1">
        {/* Persistent rail on desktop (lg+). Below lg it is hidden and
            the nav moves into the top-bar hamburger Sheet (see MobileNav). */}
        <div className="hidden shrink-0 lg:flex">
          <Sidebar
            activeId={activeNavId}
            expanded={sidebarExpanded}
            onNavigate={onNavigate}
            overviewPath={overviewPath}
            sections={sections}
            showLocks={showLocks}
            topSlot={
              switcherInRail ? (
                <div className="flex flex-col gap-2 border-border border-b px-3 pt-3 pb-3">
                  <WorkspaceSwitcher className="w-full" compactBadge />
                  {isEnterprise ? <ViewRoleSwitch className="w-full" /> : null}
                </div>
              ) : undefined
            }
            upgradePath={upgradePath}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-background lg:min-h-0">
          <DashTopBar
            activeNavId={activeNavId}
            askAiOpen={askAiOpen}
            hideDocsButton={hideDocsButton}
            onNavigate={onNavigate}
            onToggleAskAi={() => setAskAiOpen((prev) => !prev)}
            onToggleSidebar={onToggleSidebar}
            overviewPath={overviewPath}
            sections={sections}
            showLocks={showLocks}
            showViewRole={isEnterprise}
            sidebarExpanded={sidebarExpanded}
            switcherInRail={switcherInRail}
            upgradePath={upgradePath}
          />
          {/* Content pane. Below lg the document flows and scrolls naturally
              (no forced fill, no internal scroll). At lg+ the pane becomes a
              bounded flex child that scrolls internally — `flex-1 min-h-0`
              (without `min-h-0` a flex item won't shrink below its content and
              the scroll container never forms). `[&>*]:shrink-0` keeps direct
              children at their natural heights so the pane scrolls instead of
              squashing them. */}
          {/* Content locks at 1920px wide (the 3xl breakpoint). Beyond that
              the extra space falls to the right as margin; the DashTopBar
              sibling above stays full-bleed. */}
          <main
            className="@container flex max-w-[1920px] flex-col gap-6 px-4 pt-6 pb-8 sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-20 [&>*]:shrink-0"
            ref={mainRef}
          >
            {children}
          </main>
        </div>
        {/* Right-docked "Ask AI" panel column — lg+ only (mirrors the rail's
            `hidden … lg:flex` pattern). As a `shrink-0` sibling of the
            `flex-1 min-w-0` main column, animating its width from 0 → 368px
            condenses the top bar AND content together (the push effect). The
            outer column clips (`overflow-hidden`) while the inner surface stays
            a fixed 368px, so panel content never reflows mid-transition. Width
            animation is the sanctioned mechanism here (per the build brief);
            `motion-reduce` snaps it instantly. `inert` when closed drops the
            offscreen skeleton out of the tab order. */}
        <div
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-out will-change-[width] motion-reduce:transition-none lg:block",
            askAiOpen ? "lg:w-[368px]" : "lg:w-0"
          )}
        >
          <div
            className="flex h-full w-[368px] flex-col border-border border-l bg-card"
            inert={!askAiOpen}
          >
            <AskAiPanel onClose={closeAskAi} open={askAiOpen} />
          </div>
        </div>
      </div>
      {/* Below lg the docked column is hidden (no rail, no horizontal room), so
          the same shell opens in a right-docked Sheet. `isDesktop` keeps this
          closed on lg+ so it never portals open beside the docked column; the
          Base-UI flicker fix (`data-closed:fill-mode-forwards`) is inherited
          from SheetContent. */}
      <Sheet onOpenChange={setAskAiOpen} open={askAiOpen && !isDesktop}>
        <SheetContent
          className="w-full gap-0 p-0 sm:max-w-[368px]"
          showCloseButton={false}
          side="right"
        >
          <SheetTitle className="sr-only">Ask AI</SheetTitle>
          <AskAiPanel onClose={closeAskAi} open={askAiOpen} />
        </SheetContent>
      </Sheet>
      {/* FeedbackFab uses `fixed` positioning and anchors to the viewport,
          not to this scroll container — placing it here as a sibling keeps
          the stacking context clean while the `fixed` rule escapes any
          overflow clipping from the scrollable content pane above. */}
      <FeedbackFab askAiOpen={askAiOpen} />
    </div>
  );
}

/* ─── Top bar (toggle + actions) ───────────────────────────────────────── */

function DashTopBar({
  sidebarExpanded,
  onToggleSidebar,
  hideDocsButton = false,
  sections,
  activeNavId,
  onNavigate,
  overviewPath,
  showLocks,
  askAiOpen,
  onToggleAskAi,
  switcherInRail,
  upgradePath,
  showViewRole,
}: {
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  hideDocsButton?: boolean;
  sections: SidebarSection[];
  activeNavId: string;
  onNavigate?: (pageId: string) => void;
  overviewPath?: string;
  showLocks?: boolean;
  askAiOpen: boolean;
  onToggleAskAi: () => void;
  switcherInRail: boolean;
  upgradePath?: string;
  /** Enterprise only: the "Viewing as" Admin / Manager switch. */
  showViewRole: boolean;
}) {
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-border border-b bg-card px-4 sm:px-6 lg:static">
      <div className="flex items-center gap-2">
        <Button
          aria-expanded={sidebarExpanded}
          aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          className="-ml-2 hidden text-muted-foreground hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground hover:aria-expanded:text-muted-foreground lg:inline-flex"
          onClick={onToggleSidebar}
          size="icon"
          variant="ghost"
        >
          {/* Contextual icon cross-fade. Both icons stay in DOM,
              absolute-positioned; toggle scale/opacity/blur. The skill's
              reference 4px blur dissolves a 16px icon into fuzz at
              scale 0.25 — using 1px here so the softening reads as
              edge-feathering, not vanish-into-blob. */}
          <span className="relative inline-flex size-4 items-center justify-center">
            <PanelLeftClose
              aria-hidden
              className={cn(
                "absolute size-4 transition-[opacity,transform,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                sidebarExpanded
                  ? "scale-100 opacity-100 blur-0"
                  : "scale-[0.25] opacity-0 blur-[1px]"
              )}
              strokeWidth={1.75}
            />
            <PanelLeftOpen
              aria-hidden
              className={cn(
                "absolute size-4 transition-[opacity,transform,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                sidebarExpanded
                  ? "scale-[0.25] opacity-0 blur-[1px]"
                  : "scale-100 opacity-100 blur-0"
              )}
              strokeWidth={1.75}
            />
          </span>
        </Button>
        {/* Below lg there's no rail, so the top bar carries the logomark and
         *  the nav moves into the hamburger Sheet; the workspace switcher lives
         *  in that Sheet below lg. At lg+ the rail carries the brand and the
         *  switcher sits here in the top bar. */}
        <img
          alt=""
          aria-hidden
          className="h-8 w-auto lg:hidden"
          src="/gate-ai-logo-mark.png"
        />
        {/* At lg+ the switcher normally lives here. In the tight band (rail +
            Ask AI panel both open) it relocates into the expanded rail so the
            top bar doesn't crowd; see `switcherInRail` in DashboardChrome. */}
        {switcherInRail ? null : (
          <div className="hidden items-center gap-2 lg:flex">
            <WorkspaceSwitcher />
            {showViewRole ? <ViewRoleSwitch /> : null}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <NotificationsMenu />
        <ThemeToggle />
        <Button
          aria-expanded={askAiOpen}
          onClick={onToggleAskAi}
          size="default"
          variant="outline"
        >
          <Sparkles aria-hidden data-icon="inline-start" size={16} />
          Ask AI
        </Button>
        {hideDocsButton ? null : (
          <Button size="default" variant="outline">
            <BookOpen aria-hidden data-icon="inline-start" size={16} />
            Docs
          </Button>
        )}
        <MobileNav
          activeId={activeNavId}
          onNavigate={onNavigate}
          overviewPath={overviewPath}
          sections={sections}
          showLocks={showLocks}
          showViewRole={showViewRole}
          upgradePath={upgradePath}
        />
      </div>
    </div>
  );
}

/* ─── Mobile nav (below md) ─────────────────────────────────────────────────
 * Below md the persistent rail is hidden, so the primary nav lives behind a
 * hamburger in the top-bar right group (after Docs). It opens the shared
 * <SidebarPanel> in a right-docked Sheet (shadcn `side` API), so mobile and
 * desktop navigation never drift. A nav tap closes the sheet. */
function MobileNav({
  sections,
  activeId,
  onNavigate,
  overviewPath,
  showLocks,
  showViewRole,
  upgradePath,
}: {
  sections: SidebarSection[];
  activeId: string;
  onNavigate?: (pageId: string) => void;
  overviewPath?: string;
  showLocks?: boolean;
  /** Enterprise only: the "Viewing as" Admin / Manager switch. */
  showViewRole: boolean;
  upgradePath?: string;
}) {
  const [open, setOpen] = useState(false);
  // Close the drawer when the viewport grows to md+, where the persistent rail
  // returns and the hamburger hides — otherwise the portaled SheetContent would
  // stay open orphaned beside the desktop sidebar.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setOpen(false);
      }
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);
  const handleNavigate = (pageId: string) => {
    onNavigate?.(pageId);
    setOpen(false);
  };
  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        render={
          <Button
            aria-label="Open navigation menu"
            className="lg:hidden"
            size="icon"
            variant="outline"
          />
        }
      >
        <Menu aria-hidden className="size-4" strokeWidth={1.75} />
      </SheetTrigger>
      <SheetContent className="w-75 gap-0 p-0" side="right">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarPanel
          activeId={activeId}
          onNavigate={handleNavigate}
          overviewPath={overviewPath}
          sections={sections}
          showLocks={showLocks}
          topSlot={
            <div className="flex flex-col gap-2 border-border border-b px-3 pt-3 pb-3 lg:hidden">
              <WorkspaceSwitcher className="w-full" />
              {showViewRole ? <ViewRoleSwitch className="w-full" /> : null}
            </div>
          }
          upgradePath={upgradePath}
        />
      </SheetContent>
    </Sheet>
  );
}
