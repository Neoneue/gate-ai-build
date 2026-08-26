import { Bell, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BellIcon } from "@/components/ui/bell";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Segmented } from "@/components/ui/segmented";
import { fmtRelative } from "@/data/audit-trail";
import type { NotificationItem } from "@/data/notifications";
import { NOTIFICATION_HISTORY, NOTIFICATIONS_NOW } from "@/data/notifications";
import {
  archiveAll,
  markAllRead,
  markRead,
  useNotificationsReadState,
} from "@/data/notifications-store";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * NotificationsMenu — top-bar bell dropdown, phase 1 of the notifications
 * PRD. Owns its own trigger (a `size="icon"` outline Button carrying the
 * animated BellIcon), so the top bar just mounts <NotificationsMenu />.
 *
 * Feed data comes from `@/data/notifications` — real rows only, newest
 * first. The bell reads the WHOLE NOTIFICATION_HISTORY (minus archived rows)
 * and WINDOWS it: 8 rows, plus 8 more each time you reach the end of the
 * scroll region. It is no longer a fixed peek of the newest 8 (user direction
 * 2026-08-25) — that made the badge count a slice, so the bell said 8 while
 * /notifications said 15 about the same store. Counts are global now; only
 * the render is paginated. One array means one set of ids, so read state is
 * shared for free. Relative timestamps read against NOTIFICATIONS_NOW, the
 * feed's mock clock. `/notifications` is still where the full, paginated
 * history lives, and the footer row points at it from every state.
 *
 * Read/archived state is layered on top of each item's static `unread`
 * default: an item is unread when it ships `unread: true` and the user has
 * not opened it. Archiving is a SEPARATE axis and does not read a row for
 * you (user direction 2026-08-25) — an archived row can still be unread, it
 * simply is not the bell's problem any more, since the peek shows
 * non-archived rows only. That is why the badge drops when you archive: the
 * row left, it was not read. That state lives in the module-scoped
 * `@/data/notifications-store`, which the /notifications table subscribes
 * to as well — a click here mutes the same row there, live, with no reload.
 * NOTHING is persisted: the store dies on refresh so the unread flow can be
 * demoed over and over. See the store for why localStorage was removed.
 *
 * The All tab's sweep is "Archive all", not "Clear all". Archiving is
 * recoverable by construction: the row leaves the bell and stays in the
 * /notifications table, which is the permanent history BY DESIGN — that page
 * never hides an archived row, it keeps an Archive tab. This is the
 * archive/done pattern Vercel, GitHub, and Linear converge on; none of them
 * ship a destructive clear in a notification menu. The empty band used to
 * spell that out with a link to `?tab=archive`; it no longer does (user
 * direction 2026-08-25) — the header gear reaches the page, and the band is
 * just the chip + "All caught up!".
 *
 * Built on our Popover, so it inherits the standard dropdown enter/exit
 * animation + the `data-closed:fill-mode-forwards` flicker fix
 * automatically (no hand-rolled animation).
 * ───────────────────────────────────────────────────────────────────────── */

type NotificationsMenuProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

/** Built per-render inside the component, because the Unread count is live —
 *  see `tabOptions`. Only the shape lives here. */
type MenuTabOption = { value: "unread" | "all"; label: string; count?: number };

/** How many rows the menu renders at a time. The bell used to be a fixed
 *  peek of the newest NOTIFICATIONS_CAP rows; it now reads the WHOLE
 *  non-archived history and windows it (user direction 2026-08-25), so this
 *  is a render budget, not a bound on what the surface knows about. Same
 *  number as the old cap, so the resting menu looks identical — the
 *  difference only shows when you scroll, and in the counts, which are now
 *  global (see `unreadCount`). NOTIFICATIONS_CAP stays exported from
 *  `@/data/notifications` for its own consumers; this file no longer uses it
 *  as a list bound. */
const WINDOW_STEP = 8;

/** The bell-button corner badge — the MENU-level unread indicator, and the
 *  only dot left in this file. Rows carry unread as ink instead (see
 *  NotificationRow), so this has no per-row twin to stay in sync with; it
 *  answers "is there anything for me" from the closed top bar, which no
 *  amount of row ink can do.
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

/* ─── Row ────────────────────────────────────────────────────────────── */

function NotificationRow({
  isRead,
  item,
  onOpen,
}: {
  /** Unread is WHOLE-ROW INK, Gmail-style and identical to the
   *  /notifications table: title, copy and time all sit at full strength
   *  while unread and all drop to `text-muted-foreground` once read. The
   *  contrast IS the indicator, so the row needs no dot and no reserved
   *  gutter. Weight never moves — the label voice is already font-medium and
   *  Gmail's bold is approximated with ink (design.md §3: colour does the
   *  quiet work, weight does the structural work). User direction
   *  2026-08-25. */
  isRead: boolean;
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
}) {
  return (
    <button
      className="flex w-full items-start gap-3 px-4 py-3 text-left outline-none transition-colors duration-100 ease-out hover:bg-muted focus-visible:inset-ring-3 focus-visible:inset-ring-ring/50 motion-reduce:transition-none"
      onClick={() => onOpen(item)}
      type="button"
    >
      {/* 20px box = the title line's box, so a 16px glyph optically centres
          against line 1 without an off-grid nudge. */}
      <span className="flex h-5 shrink-0 items-center">
        <item.Icon
          aria-hidden
          className={cn(
            "size-4 shrink-0",
            !item.iconColor && "text-muted-foreground"
          )}
          strokeWidth={1.75}
          style={item.iconColor ? { color: item.iconColor } : undefined}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              "type-label-14 min-w-0 flex-1 truncate",
              isRead ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {item.title}
          </span>
          {/* Both tabs render this identical structure, so the timestamp's
              right edge lands on one x and switching tabs cannot make a row
              jitter — the old reserved dot slot is gone with the dot. */}
          <span
            className={cn(
              "type-mono-12 shrink-0",
              isRead ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {fmtRelative(item.at, NOTIFICATIONS_NOW)}
          </span>
        </span>
        <span
          className={cn(
            "type-copy-12 truncate",
            isRead ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {item.copy}
        </span>
      </span>
    </button>
  );
}

/* ─── Menu ───────────────────────────────────────────────────────────── */

function NotificationsMenu({
  side = "bottom",
  align = "end",
  sideOffset = 8,
}: NotificationsMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"unread" | "all">("unread");
  /** How many of the active tab's rows are rendered. Grows by WINDOW_STEP as
   *  the user reaches the end of the list; resets on open and on tab switch
   *  (one state, reset in two handlers — cheaper than a window per tab, and
   *  the floor is WINDOW_STEP either way, so a reset can never show fewer
   *  rows than the menu opened with). */
  const [windowSize, setWindowSize] = useState(WINDOW_STEP);
  const { readIds, archivedIds } = useNotificationsReadState();

  /** The single unread predicate for this surface — the badge, the count, the
   *  Unread tab, and the row ink all read it, so they cannot drift. */
  const isUnread = (item: NotificationItem) =>
    item.unread && !readIds.has(item.id);

  /** THE menu's universe: all non-archived history, newest first — not a
   *  slice of it. Archived rows are the /notifications Archive tab's job. */
  const nonArchived = NOTIFICATION_HISTORY.filter(
    (item) => !archivedIds.has(item.id)
  );
  const unreadItems = nonArchived.filter(isUnread);
  /** GLOBAL, not window-scoped, and not peek-scoped (user direction
   *  2026-08-25): this is the same number the /notifications Inbox chip
   *  shows, because both are "unread among non-archived" over one store. It
   *  feeds the badge's presence, the aria-label, and the Unread tab chip, so
   *  a closed bell, an open bell and the page cannot tell three stories. The
   *  list below may render fewer rows than this until scrolled — the count
   *  tells the truth, the list just paginates. */
  const unreadCount = unreadItems.length;

  /** The Unread segment carries the count, the All segment does not: the
   *  number answers "how much still needs me", which is the Unread tab's
   *  whole question. A total on All would answer "how much exists", which is
   *  what the page is for. Same value as the bell badge and its aria-label —
   *  `unreadCount` is the one source, so the closed bell and the open bell
   *  and the page can never disagree.
   *
   *  Memoized on that count, not rebuilt per render: `options` is a dep of
   *  Segmented's measuring layout effect, and a fresh array each render would
   *  re-measure (and re-commit) on every render. */
  const tabOptions = useMemo<MenuTabOption[]>(
    () => [
      { value: "unread", label: "Unread", count: unreadCount },
      { value: "all", label: "All" },
    ],
    [unreadCount]
  );

  const onUnreadTab = tab === "unread";
  /** The tab's FULL list drives the actions, the empty band and the "is there
   *  more" test; only `items` is windowed. Keeping the two apart is what lets
   *  a sweep finish the job while the list is still 8 rows long. */
  const tabList = onUnreadTab ? unreadItems : nonArchived;
  const items = tabList.slice(0, windowSize);
  const canLoadMore = items.length < tabList.length;
  const actionLabel = onUnreadTab ? "Mark all as read" : "Archive all";
  const emptyLabel = onUnreadTab ? "No unread notifications" : "All caught up!";

  const handleAction = () => {
    if (onUnreadTab) {
      /* Sweeps the WHOLE history — including archived rows, which the menu
         never shows. "Mark all as read" is a claim about the account, so
         leaving unread rows behind on /notifications would make the bell
         contradict the table. */
      markAllRead(NOTIFICATION_HISTORY.filter(isUnread).map((item) => item.id));
      return;
    }
    /* The tab's whole list, not the rendered window: "Archive all" that left
       30 rows behind because you had not scrolled would be a lie, and the
       band it drops you on says "All caught up!". */
    archiveAll(nonArchived.map((item) => item.id));
  };

  /* The two observed nodes are held in STATE, not in refs, and written by
     `setScrollNode` / `setSentinelNode` used directly as callback refs (a
     `useState` setter is referentially stable and returns undefined, so React
     19 accepts it as a ref without treating the return value as a cleanup).

     THIS IS THE FIX, and the ref version's failure is worth keeping written
     down. Refs are not reactive. The observer effect used to depend on
     `[canLoadMore, open, tab]`, which reads like "re-subscribe whenever the
     nodes appear" but is not: when `open` flips true the effect runs BEFORE
     the popover portal has put anything in `scrollRef` / `sentinelRef`, so
     `if (!(root && target …)) return;` early-returned, and none of those three
     deps ever changed again — nothing re-ran the effect, no observer was ever
     attached, and scrolling to the bottom silently never appended. It failed
     open, with no error: an observer that is never constructed looks exactly
     like an observer that never fires. (Verified empirically — attaching an
     observer by hand with the identical root / target / rootMargin fired
     immediately in the same DOM.)

     Node state closes that gap because mounting the portal IS a state change:
     the callback ref runs on commit, the effect's deps change identity, and it
     re-runs at exactly the moment there is something to observe. The list
     unmounts on close and on the empty band, which sets both back to null and
     disconnects — so the subscription's lifetime tracks the nodes' lifetime
     rather than a guess about when they exist. */
  const [scrollNode, setScrollNode] = useState<HTMLDivElement | null>(null);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);

  /* Lazy-load: a zero-height sentinel as the last child of the scroll region,
     observed with that region as `root` — the house pattern from
     `ScrollBottomSentinel` (ask-ai-scroll-to-latest.tsx). No scroll handler,
     so this fires on the one transition we care about instead of on every
     pixel, and needs no rAF throttling.
     `rootMargin` starts the next 8 a little before the true end, so a steady
     scroll never lands on a hard stop.
     Every dep is a real value the effect reads: the two nodes cover mount,
     unmount and the tab switch (which unmounts the sentinel whenever the new
     list is short enough to need none), and `canLoadMore` covers reaching the
     end of the list. No `open` / `tab` markers needed, and no lint suppression
     — the deps are now the honest ones. */
  useEffect(() => {
    if (!(scrollNode && sentinelNode && canLoadMore)) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setWindowSize((size) => size + WINDOW_STEP);
        }
      },
      { root: scrollNode, rootMargin: "96px" }
    );
    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [canLoadMore, scrollNode, sentinelNode]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setWindowSize(WINDOW_STEP);
    }
  };

  const handleTabChange = (value: string) => {
    setTab(value === "all" ? "all" : "unread");
    setWindowSize(WINDOW_STEP);
    /* The container survives the switch, so its scrollTop would too — you
       would land mid-list in a list you had not seen, and (being parked on
       the sentinel) immediately pull the next 8. A new list starts at its
       top, which is also what makes the window reset visible. */
    scrollNode?.scrollTo({ top: 0 });
  };

  const handleOpenItem = (item: NotificationItem) => {
    markRead(item.id);
    setOpen(false);
    navigate(item.href);
  };

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
    <Popover onOpenChange={handleOpenChange} open={open}>
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

        {/* Toolbar strip */}
        <div className="flex items-center justify-between gap-2 border-border border-y bg-muted py-2 pr-2 pl-4">
          <Segmented
            aria-label="Filter notifications"
            onChange={handleTabChange}
            options={tabOptions}
            size="sm"
            value={tab}
          />
          <Button
            className="text-muted-foreground"
            /* Gated on the tab's full list, not the rendered window — the
               sweep acts on everything, so an unscrolled menu must not read
               as "nothing to do". */
            disabled={tabList.length === 0}
            onClick={handleAction}
            size="sm"
            type="button"
            variant="ghost"
          >
            {actionLabel}
          </Button>
        </div>

        {/* Body — feed, or the empty band when the tab has nothing */}
        {tabList.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12">
            <div
              aria-hidden
              className="flex size-12 items-center justify-center rounded-full bg-muted"
            >
              <Bell
                className="size-5 text-muted-foreground"
                strokeWidth={1.75}
              />
            </div>
            {/* One line, both tabs. The pointer to the Archive tab that used
                to sit under "All caught up!" is gone (user direction
                2026-08-25) — the gear in the header already reaches the page,
                and the band reads cleaner without a second voice. The page
                still honours `?tab=archive`; this producer of it is just no
                longer needed. */}
            <p className="type-copy-14 m-0 text-muted-foreground">
              {emptyLabel}
            </p>
          </div>
        ) : (
          <div
            className="max-h-96 divide-y divide-border overflow-y-auto"
            ref={setScrollNode}
          >
            {items.map((item) => (
              <NotificationRow
                isRead={!isUnread(item)}
                item={item}
                key={item.id}
                onOpen={handleOpenItem}
              />
            ))}
            {/* Zero-height, LAST child, no divider of its own. Rendered only
                while there is more to fetch, so the observer above has a
                target exactly when it has work. */}
            {canLoadMore ? (
              <div aria-hidden className="h-0 w-full" ref={setSentinelNode} />
            ) : null}
          </div>
        )}

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
