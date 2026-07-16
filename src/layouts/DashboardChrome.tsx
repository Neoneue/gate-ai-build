import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "@/components/ui/external-link";
import { FeedbackFab } from "@/components/ui/feedback-fab";
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
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher";
import { isDefaultSurface, isFreeSurface } from "@/lib/plan";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SIDEBAR_SECTIONS,
  FREE_SIDEBAR_SECTIONS,
  SIDEBAR_SECTIONS,
} from "./nav-sections";

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
  const isDefault = isDefaultSurface(pathname);
  const isFree = isFreeSurface(pathname);
  const showLocks = isDefault || isFree;
  const sections = isDefault
    ? DEFAULT_SIDEBAR_SECTIONS
    : isFree
      ? FREE_SIDEBAR_SECTIONS
      : SIDEBAR_SECTIONS;
  const overviewPath = isDefault
    ? "/overview-default"
    : isFree
      ? "/overview-free"
      : "/overview";
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-card">
      <div className="flex min-h-0 flex-1 flex-row">
        {/* Persistent rail on tablet/desktop (md+). Below md it is hidden and
            the nav moves into the top-bar hamburger Sheet (see MobileNav). */}
        <div className="hidden shrink-0 md:flex">
          <Sidebar
            activeId={activeNavId}
            expanded={sidebarExpanded}
            onNavigate={onNavigate}
            overviewPath={overviewPath}
            sections={sections}
            showLocks={showLocks}
          />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <DashTopBar
            activeNavId={activeNavId}
            hideDocsButton={hideDocsButton}
            onNavigate={onNavigate}
            onToggleSidebar={onToggleSidebar}
            overviewPath={overviewPath}
            sections={sections}
            showLocks={showLocks}
            sidebarExpanded={sidebarExpanded}
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
          <main className="flex min-h-0 max-w-[1920px] flex-1 flex-col gap-6 overflow-y-auto px-6 pt-6 pb-20 [&>*]:shrink-0">
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
  sections,
  activeNavId,
  onNavigate,
  overviewPath,
  showLocks,
}: {
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  hideDocsButton?: boolean;
  sections: SidebarSection[];
  activeNavId: string;
  onNavigate?: (pageId: string) => void;
  overviewPath?: string;
  showLocks?: boolean;
}) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-border border-b bg-card px-6">
      <div className="flex items-center gap-2">
        <Button
          aria-expanded={sidebarExpanded}
          aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          className="-ml-2 hidden text-muted-foreground hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground hover:aria-expanded:text-muted-foreground md:inline-flex"
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
        {/* Workspace switcher promoted from the sidebar (2026-05-17) — global
         *  scope chrome belongs in the top bar. Below xs (450px) it moves into
         *  the hamburger menu (above the nav) and the logomark takes its place
         *  here — mirroring the collapsed-sidebar mark. */}
        <img
          alt=""
          aria-hidden
          className="xs:hidden h-8 w-auto"
          src="/gate-ai-logo-mark.png"
        />
        <div className="xs:block hidden">
          <WorkspaceSwitcher />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {hideDocsButton ? null : (
          <Button size="default" variant="outline">
            Docs
            <ExternalLinkIcon
              aria-hidden
              className="relative -top-px"
              data-icon="inline-end"
              size={16}
            />
          </Button>
        )}
        <MobileNav
          activeId={activeNavId}
          onNavigate={onNavigate}
          overviewPath={overviewPath}
          sections={sections}
          showLocks={showLocks}
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
}: {
  sections: SidebarSection[];
  activeId: string;
  onNavigate?: (pageId: string) => void;
  overviewPath?: string;
  showLocks?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Close the drawer when the viewport grows to md+, where the persistent rail
  // returns and the hamburger hides — otherwise the portaled SheetContent would
  // stay open orphaned beside the desktop sidebar.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
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
            className="md:hidden"
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
            <div className="xs:hidden border-border border-b px-3 pt-3 pb-3">
              <WorkspaceSwitcher className="w-full" />
            </div>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
