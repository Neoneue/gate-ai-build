import { BookOpen, BotMessageSquare } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationsMenu } from "@/components/ui/notifications-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  LogoMarkLink,
  SidebarToggleButton,
} from "@/components/ui/top-bar-brand";
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher";
import { cn } from "@/lib/utils";
import { CHAT_BRAND_COLLAPSED, CHAT_BRAND_EXPANDED } from "./chat-layout";
import { chatOverviewUrl } from "./chat-links";
import { CHAT_COPY } from "./copy";

/**
 * Gate Chat's account-level bar, ported from the site's
 * `components/chat/chat-top-bar.tsx`: brand, the org switcher, then the
 * global actions, spanning the full width above the conversation rail.
 *
 * Two deliberate deviations, both so the chat reads as part of THIS build:
 *  - The brand is the LOGO MARK (`LogoMarkLink`), never the full lockup.
 *  - The rail's collapse toggle sits HERE, in the top bar, immediately right
 *    of the rail line, exactly where `DashTopBar` keeps the dashboard's
 *    sidebar toggle (`SidebarToggleButton`, the same component). The site
 *    kept it inside the chat sidebar.
 *
 * The brand sits in a column the exact width of the rail below it, with the
 * rail's own right border, so the line under the logo is the SAME line as the
 * sidebar's, unbroken from the top of the window, and it tracks the collapse
 * because both read one piece of state. That column tracks the rail's width
 * at `lg`+ only; below `lg` there is no rail, the column hugs the logo mark,
 * and the workspace switcher moves into the chat's nav Sheet, the same
 * breakpoint rule `DashboardChrome` follows.
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
  onToggleRail,
  railCollapsed = false,
}: {
  askAiOpen: boolean;
  className?: string;
  onToggleAskAi: () => void;
  onToggleRail: () => void;
  railCollapsed?: boolean;
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
            "flex h-full shrink-0 items-center border-border border-r px-4 transition-[width] duration-200 ease-out motion-reduce:transition-none",
            railCollapsed ? CHAT_BRAND_COLLAPSED : CHAT_BRAND_EXPANDED
          )}
        >
          <LogoMarkLink to={chatOverviewUrl(pathname)} />
        </div>
        {/* `lg`+ only, this build's breakpoint rule (design.md, Breakpoints):
            the switcher lives in the top bar at `lg`+ and in the nav Sheet
            below it, and the toggle only has a rail to collapse at `lg`+. */}
        <div className="hidden min-w-0 items-center gap-2 px-4 sm:px-6 lg:flex">
          <SidebarToggleButton
            expanded={!railCollapsed}
            onToggle={onToggleRail}
          />
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
