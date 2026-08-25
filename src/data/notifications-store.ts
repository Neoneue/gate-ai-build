import { useSyncExternalStore } from "react";

/* ─────────────────────────────────────────────────────────────────────────
 * Notification read / cleared state — module-scoped, IN MEMORY, and
 * deliberately never persisted. Same useSyncExternalStore shape as
 * `src/pages/requests/range-store.ts`.
 *
 * The lifecycle IS the feature. Module scope outlives client-side route
 * changes, so the bell menu (which remounts on every page, since each page
 * mounts its own DashboardChrome) and the /notifications table stay in sync
 * as you move around the app. A refresh re-evaluates the module, so every
 * item returns to its `unread: true` default and the flow can be walked
 * again. This is a demo surface: an earlier localStorage version let a
 * single "Mark all as read" retire the unread state permanently, on every
 * later visit, which is the opposite of what a demo needs. No localStorage
 * here, by design — do not add a persistence layer back.
 *
 * It lives in `src/data/` because both consumers — the `components/ui` bell
 * menu and the `pages/Notifications` feed — already take their rows from
 * `@/data/notifications`, and a page reaching into `components/ui` for
 * shared state would invert the layering.
 *
 * Two sets, two different jobs:
 *   readIds     the item has been opened, swept by "Mark all as read", or
 *               archived (archiving implies read — see archiveOne/archiveAll).
 *               BOTH surfaces honour it — that is the shared-state contract
 *               the user sees when a click in the bell mutes the same row in
 *               the table.
 *   archivedIds the bell's own archive set ("Archive all"). The bell is an
 *               inbox you clear down; /notifications is the permanent
 *               history and keeps showing archived rows, so only the menu
 *               reads this. Archiving is recoverable BY CONSTRUCTION — the
 *               row is never destroyed, it just leaves the peek — which is
 *               the archive/done semantics Vercel, GitHub, and Linear all
 *               use in place of a destructive clear.
 *
 * Snapshots are REPLACED, never mutated: useSyncExternalStore compares by
 * identity, so a Set mutated in place would leave subscribers unrendered.
 * ───────────────────────────────────────────────────────────────────────── */

export type NotificationsReadState = {
  readIds: ReadonlySet<string>;
  archivedIds: ReadonlySet<string>;
};

const EMPTY_STATE: NotificationsReadState = {
  readIds: new Set(),
  archivedIds: new Set(),
};

export const notificationsStore = {
  state: EMPTY_STATE,
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

/** Archive one row — the per-row inbox action. Archiving implies read:
 *  an item you filed away is not something the bell should still count. */
export function archiveOne(id: string) {
  const { readIds, archivedIds } = notificationsStore.state;
  if (archivedIds.has(id) && readIds.has(id)) {
    return;
  }
  notificationsStore.commit({
    readIds: new Set([...readIds, id]),
    archivedIds: new Set([...archivedIds, id]),
  });
}

/** Marks read as well as archived, exactly like `archiveOne`: archiving is
 *  the "done" gesture, so an archived row that still counted as unread would
 *  make the Archive tab paint unread chrome on rows nobody can act on again.
 *  Archived ⇒ read is an invariant of this store, not a UI courtesy. */
export function archiveAll(ids: string[]) {
  const { readIds, archivedIds } = notificationsStore.state;
  if (ids.every((id) => archivedIds.has(id) && readIds.has(id))) {
    return;
  }
  notificationsStore.commit({
    readIds: new Set([...readIds, ...ids]),
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
