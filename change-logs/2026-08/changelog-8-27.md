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
