# UI Changelog: 2026-09-20

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-18.md`](./changelog-9-18.md)

---

## Audits

- [`audits/2026-09/audit-9-20.md`](../../audits/2026-09/audit-9-20.md):
  web-design-guidelines on the whole site, 32 items, verdict fail. wdg-2,
  wdg-3, wdg-24 downgraded HIGH to LOW on review (browser default focus
  outline is present). wdg-1 and wdg-4 applied (`a2debd7`).
- [`audits/2026-09/audit-9-18.md`](../../audits/2026-09/audit-9-18.md):
  `ui-audit-9-18.md` and `color-audit-9-18.md` rolled into the daily shape.
  Original numbers kept behind aliases (`bui-`, `mifb-`, `rbp-`, `col-`).
- New [`audits/INDEX.md`](../../audits/INDEX.md), same job as the
  change-log index.

## Components

### NavTableRow drops the `<tr>` link role (`components/ui/table.tsx`) · [a2debd7]

- Before: `<tr role="link" tabIndex={0}>` with Enter/Space activation and a
  focus ring on the row. Invalid ARIA (a `<tr>` carries only `role="row"`),
  which the repo's own `row-action-button.tsx` header had banned since
  2026-05-09.
- After: the `<tr>` keeps default semantics and `onClick` as a mouse-only
  convenience. The keyboard target is a `RowActionButton` in the identifier
  cell, rendered as a real `<a href>` on every consumer: Dashboard messages,
  conversations and security previews, Teams Enterprise active + archived
  rows, Notifications inbox. `aria-label` moves from the row to the button;
  the primitive's `Omit` now blocks `aria-label` on the `<tr>`.
- Notifications: the checkbox and archive `onKeyDown` stoppers were dead
  once the row stopped listening and are removed; `onClick` stoppers stay.
  Link click pushes one history entry (markRead + Link, no double navigate).
- Audit: wdg-1.

## Sections & surfaces

### Skip link on the dashboard shell (`layouts/DashboardChrome.tsx`) · [a2debd7]

- Before: no skip link; keyboard users tabbed the full rail and top bar on
  every route before reaching content. `<main>` had no `id`.
- After: "Skip to content" is the first tab stop, `sr-only` until focused,
  then `bg-card` + `border-border` + `shadow-xs` with the site ring recipe
  and `type-label-14`. `<main id="main-content" tabIndex={-1}>` so focus
  lands on the pane; `focus:outline-none` on `<main>` because the pane is
  not operable and Chrome otherwise paints a full-width ring.
- Verify: `/`, Tab once, Enter; next Tab lands inside the content.
- Audit: wdg-4.
