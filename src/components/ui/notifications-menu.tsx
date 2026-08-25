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
import { fmtRelative } from "@/data/audit-trail";
import type { NotificationItem } from "@/data/notifications";
import { NOTIFICATION_ITEMS, NOTIFICATIONS_NOW } from "@/data/notifications";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * NotificationsMenu — top-bar bell dropdown, phase 1 of the notifications
 * PRD. Owns its own trigger (a `size="icon"` outline Button carrying the
 * animated BellIcon), so the top bar just mounts <NotificationsMenu />.
 *
 * Feed data comes from `@/data/notifications` — real rows only, newest
 * first, capped at 8. Relative timestamps read against NOTIFICATIONS_NOW,
 * the feed's mock clock.
 *
 * Read/cleared state is runtime-only and layered on top of each item's
 * static `unread` default: an item is unread when it ships `unread: true`
 * and the user has neither opened nor cleared it. State persists to
 * localStorage under `notifications.state.v1` (same defensive read-once /
 * write-on-change pattern as billing's auto-recharge config).
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

/** The unread indicator — one string for both the bell-corner dot and the
 *  per-row dot on the All tab, so they can never drift apart.
 *
 *  Red needs no dark twin: `--destructive` is a semantic token that already
 *  flips itself (danger-600 light, danger-400 dark, `src/index.css`), and it
 *  clears the 3:1 non-text bar on every surface this dot paints on —
 *  4.76:1 / 4.37:1 on light bg-card and the bg-muted row hover, 6.19:1 /
 *  5.23:1 on dark. This is the same token StatusDot resolves for its
 *  `danger` tone, so the site's red indicator chrome stays one colour;
 *  StatusDot itself is fenced by design.md to BreakdownRow + KpiTile's live
 *  rail, hence the local recipe rather than the primitive. */
const UNREAD_DOT = "size-2 rounded-full bg-destructive";

/* ─── Persisted read state ───────────────────────────────────────────── */

const STORAGE_KEY = "notifications.state.v1";

type NotificationsState = {
  readIds: string[];
  clearedIds: string[];
};

const EMPTY_STATE: NotificationsState = { readIds: [], clearedIds: [] };

/** Stored ids are user data round-tripped through JSON — keep only strings
 *  so a corrupted entry cannot poison the Set lookups below. */
function idList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((id): id is string => typeof id === "string");
}

function readState(): NotificationsState {
  if (typeof window === "undefined") {
    return EMPTY_STATE;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_STATE;
    }
    const parsed = JSON.parse(raw) as Partial<NotificationsState>;
    return {
      readIds: idList(parsed.readIds),
      clearedIds: idList(parsed.clearedIds),
    };
  } catch {
    return EMPTY_STATE;
  }
}

function writeState(next: NotificationsState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — drop silently */
  }
}

const union = (current: string[], added: string[]): string[] => [
  ...new Set([...current, ...added]),
];

/* ─── Row ────────────────────────────────────────────────────────────── */

function NotificationRow({
  item,
  onOpen,
  showUnreadDot,
}: {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
  /** Paints the dot on the All tab only — the Unread tab is uniformly
   *  unread, so a dot on every row would carry no information. The slot is
   *  reserved either way; see the render. */
  showUnreadDot: boolean;
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
          <span className="type-label-14 min-w-0 flex-1 truncate text-foreground">
            {item.title}
          </span>
          <span className="type-mono-12 shrink-0 text-muted-foreground">
            {fmtRelative(item.at, NOTIFICATIONS_NOW)}
          </span>
          {/* Always occupies its slot — `invisible` keeps the 8px box so the
              timestamp column lands on the same x in both tabs and the row
              does not jitter when you switch. */}
          <span
            aria-hidden
            className={cn(
              UNREAD_DOT,
              "shrink-0",
              !showUnreadDot && "invisible"
            )}
          />
        </span>
        <span className="type-copy-12 truncate text-muted-foreground">
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
  const [state, setState] = useState<NotificationsState>(readState);

  const readIds = new Set(state.readIds);
  const clearedIds = new Set(state.clearedIds);

  const visible = NOTIFICATION_ITEMS.filter((item) => !clearedIds.has(item.id));
  const unreadItems = visible.filter(
    (item) => item.unread && !readIds.has(item.id)
  );
  const unreadCount = unreadItems.length;

  const onUnreadTab = tab === "unread";
  const items = onUnreadTab ? unreadItems : visible;
  const actionLabel = onUnreadTab ? "Mark all as read" : "Clear all";
  const emptyLabel = onUnreadTab ? "No unread notifications" : "All caught up!";

  const commit = (next: NotificationsState) => {
    setState(next);
    writeState(next);
  };

  const handleAction = () => {
    if (onUnreadTab) {
      commit({
        ...state,
        readIds: union(
          state.readIds,
          unreadItems.map((item) => item.id)
        ),
      });
      return;
    }
    commit({
      ...state,
      clearedIds: union(
        state.clearedIds,
        NOTIFICATION_ITEMS.map((item) => item.id)
      ),
    });
  };

  const handleOpenItem = (item: NotificationItem) => {
    commit({ ...state, readIds: union(state.readIds, [item.id]) });
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
              navigate("/settings");
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
            <p className="type-copy-14 m-0 text-muted-foreground">
              {emptyLabel}
            </p>
          </div>
        ) : (
          /* The Popover surface has no overflow-hidden, so the scroll
             container carries the bottom radius itself. */
          <div className="max-h-96 divide-y divide-border overflow-y-auto rounded-b-sm">
            {items.map((item) => (
              <NotificationRow
                item={item}
                key={item.id}
                onOpen={handleOpenItem}
                showUnreadDot={
                  !onUnreadTab && item.unread && !readIds.has(item.id)
                }
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { NotificationsMenu };
