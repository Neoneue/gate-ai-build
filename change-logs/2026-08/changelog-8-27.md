# UI Changelog: 2026-08-27

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-25.md`](./changelog-8-25.md)

---

## Components

### Back navigation restores the content scroll `19c26d6`

At lg+ the document never scrolls; `<main>` inside DashboardChrome does, so
the browser's native back-restores-scroll never fired and returning from a
deep link (a notification's security event, a findings or trace page) dumped
you at the top of a page you had scrolled to the bottom of. New
`useScrollRestoration` hook (`src/hooks/use-scroll-restoration.ts`): a
module-level map keyed by `location.key` records the scroller's position as
you move, and a layout effect restores it on POP before paint. The store is
module-level because every page remounts its own DashboardChrome, so
component state would die exactly when back navigation needs it; per-entry
keying means two visits to the same path restore independently. PUSH and
REPLACE are deliberately untouched: fresh navigations still start at the top,
and same-route search-param writes (the `?range=` producers) re-render
without remounting, where forcing a scroll reset would yank the page under
the control just clicked. Browser-verified: bottom of /notifications
(2332px), push to /limits lands at top, back restores 2332 exactly.
`DashboardChrome.tsx` wires the ref onto `<main>`.

### Rows-per-page 100 becomes All `9997955`

Every pagination footer's rows selector now offers 10 / 25 / 50 / All; All
shows the whole list on one page. New `table-pagination.ts` module exports
`ROWS_ALL` and `resolveRowsPerPage(value, total)` (split from the footer per
the react-refresh convention: split, don't disable), and the five tables
that slice their own rows (Notifications, Activity, Audit Trail, Messages,
Security events) all derive their page math through the same helper, so the
option list and the slicing cannot drift. Tables that never sliced (Team,
Models, Conversations) inherit the option through the shared footer.

### Table scroll edge fades `6e6a56b`

The shared `Table` primitive now hints at horizontal overflow with gradient
edge fades (the Carbon/Material scroll-shadow pattern): a right fade while
more columns sit off-screen, a left fade once scrolled, neither when the
table fits. New `use-scroll-overflow.ts` hook (passive scroll listener +
ResizeObserver on scrollport and table), so tables grow and lose fades live
as the Ask AI panel or sidebar resizes the column. Fades are `from-card`
token gradients (both themes verified), `pointer-events-none` (row clicks
pass through), absent from the DOM when nothing overflows. Wide tables
(Messages 1484px, Limits 1400px) get them everywhere; fitting tables render
exactly as before. design.md §Table documents the two-level wrapper.

## Sections

### Org security events gain the scope tray `3714c67`

The "Which security events" tray (every event, or narrowed by policy, action,
or rate) existed only under the personal Security event row; the Organization
card's Org-wide security events row had channel checkboxes but no fine-tuning.
PM direction: an org admin gets the same options in both places. The same
`SecurityScopePanel` now renders under the org row whenever that row has any
channel checked (same reveal rule as the personal row, selection only), reused
verbatim with zero copy or layout changes. To make a second instance legal, the
panel gained an `idPrefix` prop (personal `notif-scope`, org `notif-org-scope`)
that namespaces every DOM id and `htmlFor`, so the two trays cannot cross-wire
labels. Org scope state is a separate in-memory `orgSecurityScope` beside
`orgPrefs`, seeded to the untouched defaults (every event, rate off at 10/1h);
the persisted `NotificationPrefs` model still declares no org shape, so it
resets on refresh by design. Pro twin only: Default and Free hide the whole
Organization section. Both trays open at once stay fully independent
(browser-verified, duplicate-id audit clean). `src/pages/Notifications.tsx`.

### Channel row icon centers on the first two lines `e12ecea`

The Email delivery-channel row carries a third line (the mono address value),
and the 32px icon chip was vertically centered against the whole three-line
block, sitting visibly low. Before: `items-center` alignment from the row
container. After: `self-start` + `mt-1` on the chip, pinning it to the top
with a 4px offset that centers it on exactly the first two lines (20px name +
4px gap + 16px subtext = 40px). Two-line rows like In-app render identically
to before, since centering a 32px chip in a 40px block is the same 4px
offset. `ChannelRow`, `src/pages/Notifications.tsx`.

### Notifications feed: bulk mark-as-read, Gmail select, 48px rows `8a547ba`

Four user directions in one pass on the feed table and bell. (1) The bulk
banner now reads "N notifications selected" with two equal-weight outline
buttons flush right, Mark as read then Archive; Cancel removed (the header
checkbox is the way out) and neither verb is promoted. Mark as read keeps
the selection alive so archive can follow on the same set, and disables
when the selection is all-read. (2) Header checkbox takes Gmail semantics:
any live selection clears on click (the dash answers "get me out", not
"finish it"); only an empty box selects the page. (3) Rows locked to
exactly 48px on both tabs: the archive button's inline baseline descender
(50px) and the action cell's border-box overshoot (49px) both fixed, block
flex wrapper + py-0, probe-verified 48/48 and 520/520 table heights.
(4) Inbox title column pulled 8px toward the checkboxes (pl-1, Inbox only)
to narrow tab-switch drift. Plus the bell's Archive all records the
sweep-everything ruling in its comment (archive is a location verb; the
table's Archive tab keeps unread ink, so nothing is buried).

### Limits table: width scheme, resets format, actions alignment `1623aff`

Column widths moved to a declared scheme (user-tuned through the session):
Name 15 / Scope 12.5 / Type 8 / Enforcement 7.5 / Threshold 10 / Used 12 /
Alerts 10 / Period 7.5 / Resets on 12.5 / Actions 5, sum 100 on the
min-w-[1400px] floor. Used widened because a $1,000,000 threshold rendered
"$0 / $1,000,000" (~158px) into a 140px column and table-fixed + nowrap
paints the overflow over the neighbor. Resets on dropped the "UTC" label
and gained seconds ("Aug 29, 00:00:00"), matching the house timestamp
voice; boundaries are still computed in UTC. The actions ellipsis glyph
right-aligns with its header title via -mr-2 (the icon button's 8px inset
was making the column read misaligned). Rationale comment records px per
column.
