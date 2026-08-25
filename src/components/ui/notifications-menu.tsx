import { Bell, Settings } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { BellIcon } from "@/components/ui/bell";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Segmented } from "@/components/ui/segmented";
import { TextLink } from "@/components/ui/text-link";
import { fmtRelative } from "@/data/audit-trail";
import type { NotificationItem } from "@/data/notifications";
import {
  NOTIFICATION_HISTORY,
  NOTIFICATION_ITEMS,
  NOTIFICATIONS_NOW,
} from "@/data/notifications";
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
 * first. The bell is a PEEK: it renders NOTIFICATION_ITEMS, the newest
 * NOTIFICATIONS_CAP rows of the NOTIFICATION_HISTORY array that
 * /notifications paginates in full. One array means one set of ids, so read
 * state is shared for free. Relative timestamps read against
 * NOTIFICATIONS_NOW, the feed's mock clock.
 *
 * Read/archived state is layered on top of each item's static `unread`
 * default: an item is unread when it ships `unread: true` and the user has
 * neither opened nor archived it. That state lives in the module-scoped
 * `@/data/notifications-store`, which the /notifications table subscribes
 * to as well — a click here mutes the same row there, live, with no reload.
 * NOTHING is persisted: the store dies on refresh so the unread flow can be
 * demoed over and over. See the store for why localStorage was removed.
 *
 * The All tab's sweep is "Archive all", not "Clear all". Archiving is
 * recoverable by construction: the row leaves the bell and stays in the
 * /notifications table, which is the permanent history BY DESIGN — that
 * page never hides an archived row — it keeps an Archive tab, and the empty
 * band here links straight to it (`?tab=archive`), because an action whose
 * result you cannot find reads as destruction even when nothing was
 * destroyed. This is the archive/done
 * pattern Vercel, GitHub, and Linear converge on; none of them ship a
 * destructive clear in a notification menu.
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

const TAB_OPTIONS = [
  { value: "unread", label: "Unread" },
  { value: "all", label: "All" },
];

/** The list the bell renders AND the list "Archive all" sweeps — one const
 *  so the archive action can never disagree with what you are looking at.
 *  Capped upstream at NOTIFICATIONS_CAP; the rest of the history lives on
 *  /notifications. "Mark all as read" deliberately does NOT use this list —
 *  see handleAction. */
const MENU_ITEMS = NOTIFICATION_ITEMS;

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
  const { readIds, archivedIds } = useNotificationsReadState();

  /** The single unread predicate for this surface — the dot, the count, the
   *  Unread tab, and the muted title all read it, so they cannot drift. */
  const isUnread = (item: NotificationItem) =>
    item.unread && !readIds.has(item.id);

  const visible = MENU_ITEMS.filter((item) => !archivedIds.has(item.id));
  const unreadItems = visible.filter(isUnread);
  const unreadCount = unreadItems.length;

  const onUnreadTab = tab === "unread";
  const items = onUnreadTab ? unreadItems : visible;
  const actionLabel = onUnreadTab ? "Mark all as read" : "Archive all";
  const emptyLabel = onUnreadTab ? "No unread notifications" : "All caught up!";

  const handleAction = () => {
    if (onUnreadTab) {
      /* Sweeps the WHOLE history, not just the rows on screen. "Mark all as
         read" is a claim about the account, so leaving unread rows behind on
         /notifications would make the bell contradict the table. Archive is
         the opposite case below: it acts on MENU_ITEMS only, because it is
         about what sits in the bell. */
      markAllRead(NOTIFICATION_HISTORY.filter(isUnread).map((item) => item.id));
      return;
    }
    archiveAll(MENU_ITEMS.map((item) => item.id));
  };

  const handleOpenItem = (item: NotificationItem) => {
    markRead(item.id);
    setOpen(false);
    navigate(item.href);
  };

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
        className="w-85 p-0"
        side={side}
        sideOffset={sideOffset}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 py-2 pr-2 pl-4">
          <h2 className="type-heading-16 m-0 text-foreground">Notifications</h2>
          <Button
            aria-label="Notification settings"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
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
            onChange={(value) => setTab(value as "unread" | "all")}
            options={TAB_OPTIONS}
            size="sm"
            value={tab}
          />
          <Button
            className="text-muted-foreground"
            disabled={items.length === 0}
            onClick={handleAction}
            size="sm"
            type="button"
            variant="ghost"
          >
            {actionLabel}
          </Button>
        </div>

        {/* Body — feed, or the empty band when the tab has nothing */}
        {items.length === 0 ? (
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
            <div className="flex flex-col items-center gap-1">
              <p className="type-copy-14 m-0 text-muted-foreground">
                {emptyLabel}
              </p>
              {/* Only the All tab can empty itself by an action, so only it
                  owes an explanation. The Unread tab's "No unread
                  notifications" is a state of the world, not a consequence
                  — a pointer there would answer a question nobody asked. */}
              {onUnreadTab ? null : (
                <p className="type-copy-12 m-0 text-balance text-center text-muted-foreground">
                  Archived notifications stay in{" "}
                  <TextLink
                    className="text-muted-foreground"
                    /* ?tab=archive lands them on the tab holding what they
                       just filed, not the Inbox they just emptied. Read once
                       on mount by the page, one-way, per the house deep-link
                       contract. */
                    onClick={() => {
                      setOpen(false);
                      navigate("/notifications?tab=archive");
                    }}
                  >
                    My Notifications
                  </TextLink>
                </p>
              )}
            </div>
          </div>
        ) : (
          /* The Popover surface has no overflow-hidden, so the scroll
             container carries the bottom radius itself. */
          <div className="max-h-96 divide-y divide-border overflow-y-auto rounded-b-sm">
            {items.map((item) => (
              <NotificationRow
                isRead={!isUnread(item)}
                item={item}
                key={item.id}
                onOpen={handleOpenItem}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { NotificationsMenu };
