import {
  BookOpen,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { domAnimation, LazyMotion } from "motion/react";
import { lazy, type ReactNode, Suspense, useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import type { LayoutContext } from "@/App";
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
  isTeamRoleSurface,
} from "@/lib/plan";
import { cn } from "@/lib/utils";
import { teamsStore, useViewRole } from "@/pages/teams/teams-store";
import {
  DEFAULT_SIDEBAR_SECTIONS,
  ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
  ENTERPRISE_SIDEBAR_SECTIONS,
  ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
  FREE_SIDEBAR_SECTIONS,
  PRO_MEMBER_SIDEBAR_SECTIONS,
  PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
  SIDEBAR_SECTIONS,
  sectionsIncludePage,
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

/* The Ask AI panel carries react-markdown and its remark / micromark tree
 * (about 290 KB of source) plus the dot-matrix animation. It is closed by
 * default, so it loads on first open and stays mounted afterwards so the
 * thread survives close / reopen (plans/bundle-split.md step 2). */
const AskAiPanel = lazy(() =>
  import("@/components/ui/ask-ai-panel").then((m) => ({
    default: m.AskAiPanel,
  }))
);

export function DashboardChrome({
  activeNavId,
  sidebarExpanded,
  onToggleSidebar,
  onNavigate,
  hideDocsButton = false,
  children,
}: DashboardChromeProps) {
  // Section set is chosen per workspace tier so nav links stay within their
  // variant, then narrowed by the viewer's role.
  const { pathname } = useLocation();
  // Restores <main>'s scroll position on back/forward; see the hook for why
  // the store lives outside this (per-page remounted) component.
  const mainRef = useScrollRestoration<HTMLElement>();
  const isDefault = isDefaultSurface(pathname);
  const isFree = isFreeSurface(pathname);
  const isEnterprise = isEnterpriseSurface(pathname);
  // Teams, budgets, roll-up and the team-manager role exist on BOTH Pro and
  // Enterprise (PRD §3 "Plan availability"); only the org/team forced
  // settings are Enterprise-only.
  const hasTeamRoles = isTeamRoleSurface(pathname);
  const viewRole = useViewRole();
  // The role switch exists on Pro and Enterprise. Leaving for a workspace
  // without roles snaps the role back to Admin so a Manager / Member gating
  // never leaks onto Default or Free pages — those are single-owner
  // workspaces with one signed-in owner.
  useEffect(() => {
    if (!hasTeamRoles && viewRole !== "admin") {
      teamsStore.setViewRole("admin");
    }
  }, [hasTeamRoles, viewRole]);
  const sections = isDefault
    ? DEFAULT_SIDEBAR_SECTIONS
    : isFree
      ? FREE_SIDEBAR_SECTIONS
      : isEnterprise
        ? viewRole === "admin"
          ? ENTERPRISE_SIDEBAR_SECTIONS
          : viewRole === "manager"
            ? ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS
            : ENTERPRISE_MEMBER_SIDEBAR_SECTIONS
        : viewRole === "admin"
          ? SIDEBAR_SECTIONS
          : viewRole === "manager"
            ? PRO_TEAM_ROLE_SIDEBAR_SECTIONS
            : PRO_MEMBER_SIDEBAR_SECTIONS;
  const overviewPath = isDefault
    ? "/overview-default"
    : isFree
      ? "/overview-free"
      : isEnterprise
        ? "/overview-enterprise"
        : "/overview";
  // Upgrade promo in the rail follows the same tier signal as the workspace
  // badge (see lib/plan.ts): shown on the two non-PRO surfaces, absent on PRO.
  // It lands on that tier's own Billing page rather than the PRO one, so the
  // CTA never jumps the user across workspaces.
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
  // Once opened, the panel stays mounted (closed state is width 0 / inert),
  // so the lazy chunk is fetched exactly once per chrome mount. Render-phase
  // latch (the Conversations `?open=` pattern), not an effect: it settles in
  // the same render the panel opens, so there is no closed-then-open frame.
  const [askAiEverOpened, setAskAiEverOpened] = useState(askAiOpen);
  if (askAiOpen && !askAiEverOpened) {
    setAskAiEverOpened(true);
  }
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
  // Hidden in the sidebar means blocked by URL. `sections` is already this
  // workspace × role's nav, so a page missing from it is a page this viewer
  // cannot see, and typing its path lands on Overview instead of the admin
  // surface. Admin sees every page, so the test is inert there. One guard in
  // the chrome is what keeps the two halves equal by construction — a per-page
  // check would be a second list free to disagree with the rail.
  // PRD §3 (roles and plan availability), §8.4 (team-scoped access),
  // §11 (acceptance).
  // Placed below every hook above: the early return must never change hook
  // order. Overview is always reachable (every variant carries `overview`),
  // so the redirect target cannot bounce again.
  if (!sectionsIncludePage(sections, activeNavId)) {
    return <Navigate replace to={overviewPath} />;
  }
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex min-h-dvh w-full flex-col bg-background lg:h-screen lg:overflow-hidden">
        {/* Skip link — WCAG 2.4.1. Without it a keyboard user tabs the 9 rail
          buttons plus the top-bar controls on EVERY route before reaching
          content. sr-only until focused, then a real card-surface chip pinned
          to the top-left (there is no positioned ancestor, so it anchors to the
          viewport). Focus recipe is design.md §2's site-wide ring —
          ring-2 ring-ring + offset-2 offset-background — and the surface is
          bg-card + border-border + shadow-xs, since a converted surface carries
          an explicit border (design.md §5.0). `focus:` not `focus-visible:`:
          the only way to reach it is the keyboard. */}
        <a
          className="type-label-14 sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:border focus:border-border focus:bg-card focus:px-3 focus:py-2 focus:text-foreground focus:shadow-xs focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          href="#main-content"
        >
          Skip to content
        </a>
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
              topSlot={
                switcherInRail ? (
                  <div className="flex flex-col gap-2 border-border border-b px-3 pt-3 pb-3">
                    <WorkspaceSwitcher className="w-full" compactBadge />
                    {hasTeamRoles ? (
                      <ViewRoleSwitch className="w-full" />
                    ) : null}
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
              showViewRole={hasTeamRoles}
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
              className="@container flex max-w-[1920px] flex-col gap-6 px-4 pt-6 pb-8 focus:outline-none sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-20 [&>*]:shrink-0"
              id="main-content"
              ref={mainRef}
              /* tabIndex={-1} is required, not belt-and-braces: per the HTML
                 spec, fragment navigation focuses the target only if it is
                 already focusable — otherwise it just moves the sequential
                 focus starting point and leaves focus on <body> (and Safari
                 does not reliably do even that). With -1 the skip link lands
                 focus ON <main>, so the next Tab and the next SR read both
                 start here. `focus:outline-none` goes with it: Chrome matches
                 :focus-visible on this fragment focus (verified) and would
                 paint a 1440px-wide ring around the whole pane. The pane is
                 not operable, so no indicator is owed — the scroll + the next
                 Tab landing inside is the feedback (govuk-frontend does the
                 same on its skip target). */
              tabIndex={-1}
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
              {askAiEverOpened ? (
                <Suspense fallback={null}>
                  <AskAiPanel onClose={closeAskAi} open={askAiOpen} />
                </Suspense>
              ) : null}
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
            {askAiEverOpened ? (
              <Suspense fallback={null}>
                <AskAiPanel onClose={closeAskAi} open={askAiOpen} />
              </Suspense>
            ) : null}
          </SheetContent>
        </Sheet>
        {/* FeedbackFab uses `fixed` positioning and anchors to the viewport,
          not to this scroll container — placing it here as a sibling keeps
          the stacking context clean while the `fixed` rule escapes any
          overflow clipping from the scrollable content pane above. */}
        <FeedbackFab askAiOpen={askAiOpen} />
      </div>
    </LazyMotion>
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
  askAiOpen: boolean;
  onToggleAskAi: () => void;
  switcherInRail: boolean;
  upgradePath?: string;
  /** Pro and Enterprise: the "Viewing as" Admin / Manager switch. */
  showViewRole: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-border border-b bg-card px-4 sm:px-6 lg:static">
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
                "absolute size-4 transition-[opacity,scale,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                sidebarExpanded
                  ? "scale-100 opacity-100 blur-0"
                  : "scale-[0.25] opacity-0 blur-[1px]"
              )}
              strokeWidth={1.75}
            />
            <PanelLeftOpen
              aria-hidden
              className={cn(
                "absolute size-4 transition-[opacity,scale,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
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
        <Link
          aria-label="Go to overview"
          className="flex items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
          to={overviewPath ?? "/overview"}
        >
          <img
            alt=""
            aria-hidden
            className="h-8 w-auto"
            height={226}
            src="/gate-ai-logo-mark.png"
            width={195}
          />
        </Link>
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
      {/* Below `lg` the top bar carries four items only — logomark, bell,
          Ask AI, hamburger. The theme toggle and Docs leave the bar and
          reappear as rows in the inline account block at the foot of the nav
          Sheet (`SidebarAccountRows` in sidebar.tsx); at `lg`+ everything
          here renders exactly as before.

          Ask AI is TWO buttons rather than one with a responsive size,
          because a `size` override in a call-site className is hand-rolling
          the primitive (`.claude/rules/no-handrolling.md`); responsive
          visibility is not. Below `lg` the bell and Ask AI are BORDERLESS —
          the bell on the responsive `ghost-to-outline` variant, the
          mobile-only Ask AI on plain `ghost` — so the hamburger is the one
          bordered control in the compact bar. */}
      <div className="flex items-center gap-2">
        <NotificationsMenu />
        <ThemeToggle className="hidden lg:inline-flex" />
        <Button
          aria-expanded={askAiOpen}
          aria-label="Ask AI"
          className="lg:hidden"
          onClick={onToggleAskAi}
          size="icon"
          variant="ghost"
        >
          <Sparkles aria-hidden className="size-5" size={20} />
        </Button>
        <Button
          aria-expanded={askAiOpen}
          className="hidden lg:inline-flex"
          onClick={onToggleAskAi}
          size="default"
          variant="outline"
        >
          <Sparkles aria-hidden data-icon="inline-start" size={16} />
          Ask AI
        </Button>
        {hideDocsButton ? null : (
          <Button
            className="hidden lg:inline-flex"
            size="default"
            variant="outline"
          >
            <BookOpen aria-hidden data-icon="inline-start" size={16} />
            Docs
          </Button>
        )}
        <MobileNav
          activeId={activeNavId}
          hideDocsButton={hideDocsButton}
          onNavigate={onNavigate}
          overviewPath={overviewPath}
          sections={sections}
          showViewRole={showViewRole}
          upgradePath={upgradePath}
        />
      </div>
    </header>
  );
}

/* ─── Mobile nav (below md) ─────────────────────────────────────────────────
 * Below md the persistent rail is hidden, so the primary nav lives behind a
 * hamburger, the last item in the top-bar right group. It opens the shared
 * <SidebarPanel> in a right-docked Sheet (shadcn `side` API), so mobile and
 * desktop navigation never drift. A nav tap closes the sheet. */
function MobileNav({
  sections,
  activeId,
  hideDocsButton,
  onNavigate,
  overviewPath,
  showViewRole,
  upgradePath,
}: {
  sections: SidebarSection[];
  activeId: string;
  /** Mirrors `DashTopBar.hideDocsButton` — when true the Docs row is omitted
   *  from the user menu at the foot of the Sheet as well as from the top bar. */
  hideDocsButton?: boolean;
  onNavigate?: (pageId: string) => void;
  overviewPath?: string;
  /** Pro and Enterprise: the "Viewing as" Admin / Manager switch. */
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
  // The nav rows are <Link>s, so the Sheet only needs to CLOSE on activation
  // (`onNavItemClick`). `handleNavigate` stays for the non-link controls the
  // panel still drives through `onNavigate` (upgrade card, user menu).
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
        <Menu aria-hidden className="size-5" strokeWidth={1.75} />
      </SheetTrigger>
      <SheetContent className="w-75 gap-0 p-0" side="right">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarPanel
          activeId={activeId}
          hideDocsButton={hideDocsButton}
          onNavItemClick={() => setOpen(false)}
          onNavigate={handleNavigate}
          overviewPath={overviewPath}
          sections={sections}
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
