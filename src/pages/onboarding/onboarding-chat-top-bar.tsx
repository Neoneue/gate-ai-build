import { BookOpen, Menu } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLockup, SidebarPanel } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoMarkLink } from "@/components/ui/top-bar-brand";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { cn } from "@/lib/utils";
import { CHAT_BRAND_EXPANDED } from "@/pages/chat/chat-layout";
import { chatOverviewUrl } from "@/pages/chat/chat-links";
import { CHAT_COPY } from "@/pages/chat/copy";
import {
  PHONE_DEMO_PAGES,
  phoneOverviewPath,
  phoneSiteSections,
} from "@/pages/onboarding/onboarding-routes";

/**
 * The Onboarding workspace's copy of `pages/chat/chat-top-bar.tsx`. The only
 * difference: no workspace switcher, since a workspace that is not set up
 * yet has nothing to switch to (owner 2026-10-11); notifications and Ask AI
 * are hidden for now; and the site menu (below). Brand, theme and Docs are
 * as in the shared bar. Change it here, never in
 * the shared bar.
 */
export function OnboardingChatTopBar({ className }: { className?: string }) {
  const { pathname } = useLocation();

  return (
    <header
      className={cn(
        "flex h-16 w-full shrink-0 items-center justify-between gap-4 border-border border-b bg-card",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center self-stretch">
        <div
          className={cn(
            "flex h-full shrink-0 items-center border-border border-r px-4",
            CHAT_BRAND_EXPANDED
          )}
        >
          {/* Phone logo opens Mobile A's Overview, or B's phone start; the
              lg+ lockup keeps the desktop path. */}
          <LogoMarkLink className="lg:hidden" to={phoneOverviewPath()} />
          <div className="hidden lg:flex">
            <BrandLockup overviewPath={chatOverviewUrl(pathname)} />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 px-4 sm:px-6">
        {/* Notifications and Ask AI are hidden for now (owner 2026-10-11). */}
        <ThemeToggle />
        <OnboardingSiteMenu />
        <Button
          className="hidden lg:inline-flex"
          size="default"
          variant="outline"
        >
          <BookOpen
            aria-hidden
            data-icon="inline-start"
            size={16}
            strokeWidth={1.75}
          />
          {CHAT_COPY.docsLink}
        </Button>
      </div>
    </header>
  );
}

/**
 * Site access from the chat (owner 2026-10-11): the dashboard's own mobile
 * nav recipe (`DashboardChrome` MobileNav), the outline menu key as the
 * last item of the right group, opening the shared `SidebarPanel` in a
 * right-docked Sheet with the Onboarding workspace's nav. No workspace
 * switcher in it (nothing to switch to yet) and no upgrade card. Below `lg`
 * only, like the dashboard's; a nav tap closes the drawer.
 */
function OnboardingSiteMenu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeId =
    Object.entries(PHONE_DEMO_PAGES).find(
      ([, path]) => path === pathname
    )?.[0] ?? "chat";
  const overviewPath = phoneOverviewPath();
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  // At lg+ the key hides, so an open drawer must not survive the resize.
  if (isDesktop && open) {
    setOpen(false);
  }
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
          onNavItemClick={() => setOpen(false)}
          onNavigate={(pageId) => {
            navigate(pageId);
            setOpen(false);
          }}
          overviewPath={overviewPath}
          sections={phoneSiteSections(overviewPath)}
        />
      </SheetContent>
    </Sheet>
  );
}
