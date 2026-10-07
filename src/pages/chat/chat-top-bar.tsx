import { BookOpen, BotMessageSquare } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationsMenu } from "@/components/ui/notifications-menu";
import { BrandLockup } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoMarkLink } from "@/components/ui/top-bar-brand";
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher";
import { cn } from "@/lib/utils";
import { CHAT_BRAND_EXPANDED } from "./chat-layout";
import { chatOverviewUrl } from "./chat-links";
import { CHAT_COPY } from "./copy";

/**
 * Gate Chat's account-level bar, ported from the site's
 * `components/chat/chat-top-bar.tsx`: brand, the org switcher, then the
 * global actions, spanning the full width above the conversation rail.
 *
 * The brand is the full logo lockup (`BrandLockup`, the dashboard rail's own)
 * from `lg` up and the logo mark (`LogoMarkLink`) below it. The rail is
 * always expanded: there is no collapse toggle (user, 2026-10-06).
 *
 * The brand sits in a column the exact width of the rail below it, with the
 * rail's own right border, so the line under the logo is the SAME line as the
 * sidebar's, unbroken from the top of the window. That column tracks the
 * rail's width at `lg`+ only; below `lg` there is no rail, the column hugs
 * the logo mark, and the workspace switcher moves into the chat's nav Sheet,
 * the same breakpoint rule `DashboardChrome` follows.
 *
 * The global actions map onto this build's own: NotificationsMenu for the
 * site's bell, ThemeToggle, the Ask AI pair for the site's Gatekeeper trigger
 * (icon-only below `lg`, labelled from `lg`, the DashTopBar recipe), and the
 * outline Docs key.
 */
export function ChatTopBar({
  askAiOpen,
  className,
  onToggleAskAi,
}: {
  askAiOpen: boolean;
  className?: string;
  onToggleAskAi: () => void;
}) {
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
          <LogoMarkLink className="lg:hidden" to={chatOverviewUrl(pathname)} />
          <div className="hidden lg:flex">
            <BrandLockup overviewPath={chatOverviewUrl(pathname)} />
          </div>
        </div>
        {/* `lg`+ only, this build's breakpoint rule (design.md, Breakpoints):
            the switcher lives in the top bar at `lg`+ and in the nav Sheet
            below it. */}
        <div className="hidden min-w-0 items-center gap-2 px-4 sm:px-6 lg:flex">
          <WorkspaceSwitcher className="min-w-0" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 px-4 sm:px-6">
        <NotificationsMenu />
        <ThemeToggle />
        <Button
          aria-expanded={askAiOpen}
          aria-label="Ask AI"
          className="lg:hidden"
          onClick={onToggleAskAi}
          size="icon"
          variant="ghost"
        >
          <BotMessageSquare aria-hidden className="size-5" size={20} />
        </Button>
        <Button
          aria-expanded={askAiOpen}
          className="hidden lg:inline-flex"
          onClick={onToggleAskAi}
          size="default"
          variant="outline"
        >
          <BotMessageSquare aria-hidden data-icon="inline-start" size={16} />
          Ask AI
        </Button>
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
