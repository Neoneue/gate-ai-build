import { Settings } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BellIcon } from "@/components/ui/bell";
import { Button } from "@/components/ui/button";
import type { NotificationsMenuTab } from "@/components/ui/notifications-menu-body";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUnreadNotificationCount } from "@/data/notifications-store";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * NotificationsMenu — top-bar bell dropdown, phase 1 of the notifications
 * PRD. Owns its own trigger (a `size="icon"` outline Button carrying the
 * animated BellIcon), so the top bar just mounts <NotificationsMenu />.
 *
 * This module is EAGER (DashboardChrome mounts it on every page) and so is
 * kept free of `@/data/notifications`, whose seed pulls requests, api-keys,
 * billing and team rows (plans/bundle-split.md step 1). It renders the
 * trigger, the badge, the header and the footer; the toolbar and the feed
 * live in `notifications-menu-body.tsx`, loaded with `React.lazy` inside
 * the popover, so the seed is fetched the first time the menu opens and
 * never on a page that does not open it. The badge count comes from
 * `useUnreadNotificationCount`, which reads the same store over the pinned
 * seed ids, so the closed bell and the open bell cannot disagree.
 *
 * The Suspense fallback is an empty shell with the toolbar's and the list's
 * geometry (`h-12` = py-2 x2 + a 32px `sm` control; `h-96` = the list's
 * `max-h-96`), so the one-time load does not flash a shorter popup.
 *
 * Built on our Popover, so it inherits the standard dropdown enter/exit
 * animation + the `data-closed:fill-mode-forwards` flicker fix
 * automatically (no hand-rolled animation).
 * ───────────────────────────────────────────────────────────────────────── */

const NotificationsMenuBody = lazy(
  () => import("@/components/ui/notifications-menu-body")
);

type NotificationsMenuProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

/** The bell-button corner badge — the MENU-level unread indicator, and the
 *  only dot left in this file. Rows carry unread as ink instead (see
 *  NotificationRow in the body module), so this has no per-row twin to stay
 *  in sync with; it answers "is there anything for me" from the closed top
 *  bar, which no amount of row ink can do.
 *
 *  Red needs no dark twin: `--destructive` is a semantic token that already
 *  flips itself (danger-600 light, danger-400 dark, `src/index.css`), and it
 *  clears the 3:1 non-text bar on the surfaces it paints on — 4.76:1 /
 *  4.37:1 light, 6.19:1 / 5.23:1 dark. This is the same token StatusDot
 *  resolves for its
 *  `danger` tone, so the site's red indicator chrome stays one colour;
 *  StatusDot itself is fenced by design.md to BreakdownRow + KpiTile's live
 *  rail, hence the local recipe rather than the primitive. */
const UNREAD_DOT = "size-2 rounded-full bg-destructive";

/* ─── Menu ───────────────────────────────────────────────────────────── */

function NotificationsMenu({
  side = "bottom",
  align = "end",
  sideOffset = 8,
}: NotificationsMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  /** Lives here, not in the body, so the chosen tab survives close / reopen
   *  exactly as it did when the menu was one file. */
  const [tab, setTab] = useState<NotificationsMenuTab>("unread");
  /** GLOBAL unread-among-non-archived, from the store over the pinned seed
   *  ids. Feeds the badge's presence and the aria-label; the body's Unread
   *  chip derives the same number from the full rows. */
  const unreadCount = useUnreadNotificationCount();

  /** Close first, then navigate — the popover would otherwise animate out
   *  over a route that is already changing under it. */
  const openPage = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  /** `?view=feed` asks the page to scroll its Recent-notifications section
   *  into view. The page opens at the top and the feed is its LAST section,
   *  so a bare /notifications from here would land the user on the
   *  notification-type matrix and leave them to find the table. The gear
   *  above deliberately does NOT pass it: that button IS the settings link,
   *  and the matrix is what it means to open.
   *
   *  A search param, not a hash: it matches the page's existing `?tab=`
   *  contract (render-phase compare, then stripped), and a hash would linger
   *  in the URL after the scroll it described had already happened. */
  const handleViewAll = () => openPage("/notifications?view=feed");

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            className="relative"
            size="icon"
            variant="outline"
          >
            <BellIcon aria-hidden size={16} strokeWidth={1.75} />
            {unreadCount > 0 ? (
              <span
                aria-hidden
                className={cn("absolute top-2 right-2", UNREAD_DOT)}
              />
            ) : null}
          </Button>
        }
      />
      <PopoverContent
        align={align}
        aria-label="Notifications"
        className="w-100 p-0"
        side={side}
        sideOffset={sideOffset}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 py-2 pr-2 pl-4">
          <h2 className="type-heading-16 m-0 text-foreground">Notifications</h2>
          <Button
            aria-label="Notification settings"
            onClick={() => openPage("/notifications")}
            size="icon-sm"
            variant="ghost"
          >
            <Settings
              aria-hidden
              className="text-muted-foreground"
              strokeWidth={1.75}
            />
          </Button>
        </div>

        {/* Toolbar + feed: lazy, so the seed loads on first open only. The
            fallback reuses the toolbar strip's classes and the list's max
            height so the shell keeps its size while the chunk arrives. */}
        <Suspense
          fallback={
            <>
              <div
                aria-hidden
                className="h-12 border-border border-y bg-muted"
              />
              <div aria-hidden className="h-96" />
            </>
          }
        >
          <NotificationsMenuBody
            onNavigate={openPage}
            onTabChange={setTab}
            tab={tab}
          />
        </Suspense>

        {/* Footer — persistent on both tabs and on the empty band, because
            "where is everything else" is a question the bell can never answer
            itself: pagination, the Archive tab and the notification-type
            matrix all live on the page. Carries the surface's bottom radius,
            since it is now the last child (the Popover has no
            overflow-hidden, so whoever sits last owns the corners). */}
        <div className="rounded-b-sm border-border border-t p-1">
          <Button
            className="w-full text-muted-foreground"
            onClick={handleViewAll}
            size="sm"
            type="button"
            variant="ghost"
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { NotificationsMenu };
