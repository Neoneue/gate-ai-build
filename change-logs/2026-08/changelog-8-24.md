# UI Changelog: 2026-08-24

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-20.md`](./changelog-8-20.md)

---

## Components

### Notification bell returns with a real feed `1b19485`

The top-bar bell (unmounted since `39af049` in June) is back, mounted before
the theme toggle, and its menu now renders real notifications — phase 1 of the
notifications PRD, where the bell is the in-app delivery channel. New
`src/data/notifications.ts` derives 8 items from real entity rows, nothing
synthetic: the 3 newest security events (per-category `TYPE_META` icon +
color), the 2 newest guardrail-touched messages, the design-agent key mint,
the $25 top-up, and the audit-trail membership row. Each item deep-links to
the fired thing — `/security?open=<id>` opens the event dialog,
`/messages-findings/<uuid>` (the `requestRowId()` UUID, never the `req_*`
display id), `/api-keys`, `/billing`, `/team`. Relative times render via
`fmtRelative(at, NOTIFICATIONS_NOW)` — the audit-trail helper gained an anchor
param, and the feed's clock is 2026-06-06 18:30:12 (the latest instant in the
mock data). `notifications.test.ts` pins id uniqueness, the 8-item cap,
newest-first order, the clock bound, kind-map completeness, and that every
href resolves. Seed lifts so chrome never imports a page chunk: `ApiKeyRow` +
`API_KEY_SEED_ROWS` to `src/data/api-keys.ts` (ApiKeys.tsx keeps
`useState(API_KEY_SEED_ROWS)`), `HistoryRow` + `HISTORY_ROWS` to
`src/data/billing-history.ts`.

### NotificationsMenu: rows, read state, unread dot `1b19485`

`notifications-menu.tsx` rewrote its always-empty shell into the real menu. It
owns its trigger now (the `children` render prop is gone): a 36px
`size="icon"` outline Button with the animated `BellIcon` and a red unread dot
— `bg-destructive`, the semantic token that theme-flips danger-600/400 itself
(the first cut used `bg-blue-700`, invisible at 1.19:1 on dark hover; the
token holds ≥4.37:1 on all four surfaces) — plus a dynamic
"Notifications, N unread" aria-label. Rows are hand-built full-bleed buttons
(MenuItem's h-8 can't hold two lines): kind icon in an on-grid `h-5` box,
`type-label-14` title on `min-w-0 flex-1` so every `type-mono-12` timestamp
right-aligns to the same edge (the first cut's `justify-between` let short
titles float the time to random x), `type-copy-12` copy line below, and an
always-reserved dot slot (`invisible`, not unmounted) so Unread/All switching
never shifts the timestamp column. "Mark all as read" and "Clear all" are
functional and persist `{readIds, clearedIds}` to localStorage
`notifications.state.v1` (Billing's auto-recharge pattern). Popup is `w-85`
(340px, up from `w-80`) with a `type-heading-16` title (up from
`type-label-14`); the list scrolls at `max-h-96` and carries its own
`rounded-b-sm` since the Popover surface has no overflow-hidden. Copy-voice
lint stays clean by construction: the title span closes before the copy span,
which is what the design-token scanner's backward walk keys on. Also corrected
`design.md`'s Menu entry — `NotificationsMenu` was listed as a Menu consumer
but is and was a Popover consumer.

---

## Sections

### Alerts page removed `d520877`

The hidden Alerts page is gone. `/alerts` and its `-default`/`-free` twins
routed to a fully built rules-and-firings surface (added 2026-08-05, hidden
from the nav 2026-08-06) that the notifications PRD has since superseded:
alerting splits into a Workspace "My Notifications" page plus per-limit alert
controls on Limits, so no standalone Alerts page ships. Deleted
`src/pages/Alerts.tsx` and twins, the `src/pages/alerts/` module (types, data,
view, glyphs, `AlertRuleWizard`, `AlertEventDialog`), and
`src/components/ui/stepper.tsx`, which only the wizard used. Routes and lazy
imports left `App.tsx`, the commented-out nav item left `nav-sections.ts`, and
`/alerts` left both twin sets in `plan.ts` (15 nav bases down to 14). The two
`src/pages/requests/` comments and the `data-model.md` sections that justified
the transcript-blob split by pointing at the Alerts route were rewritten.
Recover from git history if a future Alerts page wants the wizard back. The
Activity table's "Alerts" count column stays for now; it points at a concept
with no page and gets renamed or rewired with the My Notifications build.
