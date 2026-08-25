# UI Changelog: 2026-08-25

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-24.md`](./changelog-8-24.md)

---

## Components

### Checkbox gets a visible disabled state `30afa2c`

Base UI renders `Checkbox.Root` as a `<span role="checkbox">`, never a native
`<button disabled>`, so the primitive's `disabled:opacity-50` was a silent
no-op — a functionally disabled checkbox rendered at full strength. Swapped to
`data-disabled:cursor-not-allowed data-disabled:opacity-50`, the same form
Switch and Select/Menu already use, with a header comment explaining why the
`data-*` variant is load-bearing. design.md's Checkbox entry now records the
generalizable rule: disabled styling on any Base UI control takes
`data-disabled:`, never `:disabled` (`radio-group.tsx` still carries the dead
form; nothing disables a radio today). Only surfaces that actually pass
`disabled` change appearance — the notification page's channel gating is the
first consumer.

### EmptyState gains an optional footnote `30afa2c`

`EmptyState` (and `TableEmptyState`, which passes it through) accepts
`footnote?: ReactNode`, rendered `type-copy-12 text-muted-foreground` in a
`gap-1` stack under the body. Added because the notifications inbox's emptied
state needed a quiet second line and `no-handrolling` forbids rebuilding the
band at a call site. Additive: all pre-existing consumers omit it and render
byte-identically. Documented in design.md.

### Bell menu becomes an inbox peek `30afa2c`

The top-bar bell now shows the newest 8 of the 38-item notification history
(one array, shared ids, so read state is shared with the page by
construction). Read state moved from localStorage to an in-memory store
(`src/data/notifications-store.ts`, range-store pattern): it syncs live
between the bell and the page table, survives SPA navigation, and resets on
refresh so the unread flow can be re-demoed indefinitely — the persisted model
had left the demo bell permanently empty after one "clear". Vocabulary and
semantics follow the Vercel/GitHub/Linear convergence: "Clear all" became
"Archive all" (files the menu's items onto the page's Archive tab; archived
implies read in the store), "Mark all as read" sweeps the whole history so the
table can't keep stragglers, and the archived-empty state explains itself with
a TextLink to `/notifications?tab=archive`. Row dots are gone: unread state
renders Gmail-style — whole-row `text-foreground` vs `text-muted-foreground`
(measured 17.9:1 vs 6.9–7.8:1 against surface in both themes), weight
untouched. The bell button keeps its corner `bg-destructive` dot as the
menu-level indicator. The time-to-dot 16px gap work this replaced is moot;
timestamps right-align via the title's `flex-1`.

## Sections

### My Notifications page `30afa2c`

Notifications PRD phase 2: `/notifications` in the Workspace nav (BellRing,
above Settings) with `-default`/`-free` twins (twin sets back to 15 bases).
Vercel's My Notifications is the visual reference; composition matches
Settings — SectionTitle above data-only cards. Top to bottom: **Delivery
channels** card (In-app + Email master switches; Email reveals the real-time /
daily / weekly / monthly multi-select, the last selected frequency can't be
unchecked, and the address renders `type-mono-12 text-foreground` with a
`Pencil` icon-button to Settings; SMS deliberately absent; masters disable
their checkbox column below with selections preserved; switching Email off
fires a sonner toast). **Five catalog sections** from
`src/data/notification-catalog.ts` (13 PRD types, 5 groups) with right-aligned
Email / In-app column headers and a `Checkbox` pair per type; the Security
event row grows a scope tray (hairline seam, no fill) with all-events vs
narrowed-by-policy/action/rate filters in a `bg-card-muted` bordered panel.
**Organization** section (Pro only, in-memory). **Recent notifications** — a
two-tab inbox: Inbox / Archive line tabs with `TabsCount` chips (unread count
/ archived total) over a real `Table` (Notification · Detail · Time · Actions)
with `NavTableRow` clickable rows (mark read + deep link), a per-row
`IconActionButton` archive on the Inbox tab, Gmail-style whole-row read ink,
flush-left Archive rows (archived is read by definition, so no dot slot), and
a per-tab `TablePaginationFooter` (default 10) over `NOTIFICATION_HISTORY`.

### Notification history deepens to 38 real items `30afa2c`

`NOTIFICATION_HISTORY` derives one item per real entity row: all 27 security
events, both guardrail-touched recent messages, all 4 key mints, both top-ups,
and the 3 non-owner joins (Mar 22 → Jun 6). Only the Jun 6 band ships unread,
so page 2+ reads as genuinely older history. Supporting data moves: the member
roster lifted to `src/data/team-members.ts` (Jordan Lee's join → Jun 6),
billing history gained a Jun 6 $25 top-up (h-6) with the Billing page
reconciled (hero $49.99238, "Used this month $0.00 / $49.99", "Last top-up
Jun 6, 2026 · $25"). `?tab=archive` joins the deep-link contract using the
`?open=`-style render-phase compare — the producer (the bell) fires on the
already-mounted route, so the mount-only `?range=` shape silently failed.
