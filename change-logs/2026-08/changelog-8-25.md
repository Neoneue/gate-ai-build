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

### Checkbox paints indeterminate `f06f43c`

Base UI's `indeterminate` prop now renders as a third visual state: the same
`--primary` fill as checked with a `MinusIcon` in place of the check, so mixed
and checked read as one family and only the glyph differs. It cannot ride on
`data-checked:` — Base UI suppresses `data-checked`/`data-unchecked` while
`data-indeterminate` holds (and announces `aria-checked="mixed"`), so the
filled recipe is duplicated onto `data-indeterminate:` and the glyph swap runs
off `group/checkbox`. Both glyphs live inside the one Indicator with one
`hidden` at a time, so the box centres identically in all three states. First
consumer: the /notifications Inbox select-all header. Documented in design.md.

### Segmented options carry count chips `f06f43c`

`Segmented` options accept an optional `count`, rendered as the shared
`TabsCount` chip after the label — so a counted segment and a counted tab read
identically instead of the recipe being hand-rolled twice. Per-option: only
segments that own a number carry a chip. Callers passing live counts must
memoize the options array — it feeds the pill variant's measuring layout
effect, and a fresh literal every render would loop the measurement.

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

### Bell windows the whole history; archive and read split `f06f43c`

The bell no longer peeks a fixed newest-8: it reads the whole non-archived
history and windows the render (8 rows, +8 per scroll-end), so its badge and
the /notifications table finally agree on one global count instead of the
menu saying 8 while the page said 15 about the same store. Archive and read
are now independent axes in `notifications-store.ts` — archiving files a row
without claiming you read it (the 8-25 morning build's "archived implies
read" is withdrawn), so an archived-but-unread row arrives on the Archive tab
at full ink. Seeding changed to match: the pre-Jun-6 tail now starts archived,
so the Inbox opens as just the unread band. The bell's archived-empty
explainer TextLink was dropped; `?tab=archive` stays a supported deep link.

### Feed bulk select `f06f43c`

The Inbox tab gains the Gmail bulk pattern: a leading `w-[6%]` checkbox
column (header = select-all-on-this-page with the new indeterminate state),
page-scoped selection that clears on page/rows/tab change, and a spanning
`bg-accent` banner as the first `TableBody` row asking "Move N notifications
to the Archive?" with Archive + Cancel. Selection count derives by
intersecting with the rendered page, so a per-row archive under a live
selection self-heals. Archive-tab rows get no checkbox column — the only bulk
verb there would be unarchive, which does not exist. Codified in design.md as
the Table bulk select pattern.

### Security-event default flips off per the PRD `f06f43c`

The catalog had shipped `security-event` as a fourth default-on type — the
ticket's wording — while the PRD (AG-524 §3/§10.1/§13) settles on off by
default. `defaultOn` flips to false (three default-on types: spend limit
reached, payment failed, PAYG balance low), and the Pro configured seed no
longer opts security into either channel, so the scope tray stays hidden
until the user opts in. The email frequency multi-select also reflows from
one column to a 2x2 grid (Real-time/Daily over Weekly/Monthly, gap-x-4
gap-y-3) — four short items in a full-width tray left half the row dead.

### Limits: spend and usage alerts `2135d85`

Notifications PRD §10.2 lands on /limits as one table and one create flow. The
create dialog gains an Enforcement choice — Block (429) vs Notify only — and
an Alerts block (80% / 100% checkboxes, both on by default, title → subtext →
options with 12px under the subtext); a standalone threshold alert ("cost
over $X per hour") is exactly a notify-only limit, so no second section and
no standalone Alerts page. The table gains Enforcement (filled `secondary`
chip for BLOCK, hollow `outline` for NOTIFY) and Alerts (`80% · 100%` or `—`)
columns, with all ten widths explicit on a `min-w-[1400px]` fixed layout —
Name 17% widest, Scope 13% second, nothing clips. No channel picker and no
delivery copy: channels stay single-sourced on /notifications. The create
path now resets the dialog form (pre-existing latent bug — closing via the
controlled prop skipped `onOpenChange` — made visible by the new fields).

### Feed rows pinned to one height `62a98c4`

Archive-tab rows have no 24px archive icon-button, so they collapsed 4px
shorter than Inbox rows and the table visibly shrank on tab switch. `h-12` on
the shared `FeedRow` (height acts as min-height on a `<tr>`) pins both tabs
to the Inbox's natural height.
