import { useSyncExternalStore } from "react";
import {
  NOTIFICATION_SEED_ARCHIVED_IDS,
  NOTIFICATION_SEED_UNREAD_IDS,
} from "@/data/notifications-seed-ids";

/* ─────────────────────────────────────────────────────────────────────────
 * Notification read / cleared state — module-scoped, IN MEMORY, and
 * deliberately never persisted. Same useSyncExternalStore shape as
 * `src/pages/requests/range-store.ts`.
 *
 * The lifecycle IS the feature. Module scope outlives client-side route
 * changes, so the bell menu (which remounts on every page, since each page
 * mounts its own DashboardChrome) and the /notifications table stay in sync
 * as you move around the app. A refresh re-evaluates the module, so state
 * returns to the seeded split below (unread band in the Inbox, older tail
 * archived) and the flow can be walked again. This is a demo surface: an earlier localStorage version let a
 * single "Mark all as read" retire the unread state permanently, on every
 * later visit, which is the opposite of what a demo needs. No localStorage
 * here, by design — do not add a persistence layer back.
 *
 * It lives in `src/data/` because both consumers — the `components/ui` bell
 * menu and the `pages/Notifications` feed — already take their rows from
 * `@/data/notifications`, and a page reaching into `components/ui` for
 * shared state would invert the layering.
 *
 * Two sets, two INDEPENDENT axes. Read answers "have I seen it"; archived
 * answers "where does it live". Neither implies the other, so all four
 * combinations are legal and one of them is the interesting one: an unread
 * row you archive stays unread, and the Archive tab paints it at full ink.
 * (Archiving used to force read as a store invariant; withdrawn on user
 * direction 2026-08-25 — filing something is not the same as reading it,
 * and collapsing the two lost the "archived, still owes me a look" case.)
 *   readIds     the item has been opened, or swept by "Mark all as read".
 *               Archiving does NOT write here. BOTH surfaces honour it —
 *               that is the shared-state contract the user sees when a click
 *               in the bell mutes the same row in the table.
 *   archivedIds where the row lives. The bell is an inbox you clear down and
 *               shows only non-archived rows; /notifications is the
 *               permanent history and keeps every archived row on its
 *               Archive tab. Archiving is recoverable BY CONSTRUCTION — the
 *               row is never destroyed, it just leaves the peek — which is
 *               the archive/done semantics Vercel, GitHub, and Linear all
 *               use in place of a destructive clear.
 *
 * One consequence worth stating: the bell's badge counts unread among its
 * NON-ARCHIVED peek, so archiving an unread row does drop the badge — not
 * because the row became read, but because it left the bell. The Archive tab
 * is where that unread row is still visibly unread.
 *
 * Snapshots are REPLACED, never mutated: useSyncExternalStore compares by
 * identity, so a Set mutated in place would leave subscribers unrendered.
 * ───────────────────────────────────────────────────────────────────────── */

export type NotificationsReadState = {
  readIds: ReadonlySet<string>;
  archivedIds: ReadonlySet<string>;
};

/** The seeded start: items that ship `unread: false` (the pre-Jun-6 tail of
 *  the history) begin ARCHIVED — old events belong in the archive, not as a
 *  wall of read rows in the Inbox (user direction 2026-08-25). A refresh
 *  returns to exactly this split: Inbox = the unread band, Archive = the
 *  older tail. */
const INITIAL_STATE: NotificationsReadState = {
  readIds: new Set(),
  /* From the pinned id constants, not the seed itself: the store is eager
     on every page (the bell reads it), and importing `@/data/notifications`
     here would pull the whole request / key / billing seed into the chrome
     chunk. `notifications.test.ts` keeps the constants honest. */
  archivedIds: new Set(NOTIFICATION_SEED_ARCHIVED_IDS),
};

const notificationsStore = {
  state: INITIAL_STATE,
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  commit(next: NotificationsReadState) {
    this.state = next;
    for (const listener of this.listeners) {
      listener();
    }
  },
};

/** Every mutator no-ops when it would change nothing, so re-opening a row
 *  that is already read does not churn a snapshot through every subscriber. */
export function markRead(id: string) {
  const { readIds, archivedIds } = notificationsStore.state;
  if (readIds.has(id)) {
    return;
  }
  notificationsStore.commit({
    readIds: new Set([...readIds, id]),
    archivedIds,
  });
}

export function markAllRead(ids: string[]) {
  const { readIds, archivedIds } = notificationsStore.state;
  if (ids.every((id) => readIds.has(id))) {
    return;
  }
  notificationsStore.commit({
    readIds: new Set([...readIds, ...ids]),
    archivedIds,
  });
}

/** Archive one row — the per-row inbox action. Touches `archivedIds` ONLY:
 *  filing a row moves it, it does not read it for you. `readIds` is passed
 *  through untouched so an unread row arrives in the Archive still unread. */
export function archiveOne(id: string) {
  const { readIds, archivedIds } = notificationsStore.state;
  if (archivedIds.has(id)) {
    return;
  }
  notificationsStore.commit({
    readIds,
    archivedIds: new Set([...archivedIds, id]),
  });
}

/** The bell's bulk sweep. One axis only, exactly like `archiveOne`: it files
 *  the peek without claiming the user read it, which keeps "Archive all" and
 *  "Mark all as read" two genuinely different gestures rather than one
 *  operation wearing two labels. */
export function archiveAll(ids: string[]) {
  const { readIds, archivedIds } = notificationsStore.state;
  if (ids.every((id) => archivedIds.has(id))) {
    return;
  }
  notificationsStore.commit({
    readIds,
    archivedIds: new Set([...archivedIds, ...ids]),
  });
}

export function useNotificationsReadState(): NotificationsReadState {
  return useSyncExternalStore(
    (callback) => notificationsStore.subscribe(callback),
    () => notificationsStore.state,
    () => notificationsStore.state
  );
}

/** The bell badge's number: unread among NON-ARCHIVED rows, over the whole
 *  history. Identical to `NOTIFICATION_HISTORY.filter(nonArchived && unread
 *  && !read).length`, computed from the pinned seed ids so the eager trigger
 *  never loads the seed. The lazy menu body derives the same number from the
 *  full rows; the test pins the two sources to each other. */
export function useUnreadNotificationCount(): number {
  const { readIds, archivedIds } = useNotificationsReadState();
  let count = 0;
  for (const id of NOTIFICATION_SEED_UNREAD_IDS) {
    if (!(readIds.has(id) || archivedIds.has(id))) {
      count += 1;
    }
  }
  return count;
}
