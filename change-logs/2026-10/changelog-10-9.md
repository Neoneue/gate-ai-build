# UI Changelog: 2026-10-09

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-8.md`](./changelog-10-8.md)

---

## Sections

### Retention helper carries the way past the ceiling `95cdb4b`

Settings > Data retention (`src/pages/settings/DataRetentionCard.tsx`).

- **Pro helper.** Before: the range only ("Your plan allows any window from
  0 to 90 days."), with the Enterprise path disclosed in the over-limit
  error. After: the range, then "For a longer window, contact us about an
  Enterprise contract." The link opens the contact dialog in place, titled
  "Contact us", the same way Enterprise's "contact support" link does.
- **Over-limit error.** Before (Pro): "Enter 90 or less. On Enterprise, a
  contract can extend it further; contact us." After, every tier: the fix
  only, "Enter 90 or less."
- **Free.** Before: the note sat in the footer beside Upgrade to Pro. After:
  it is the subtitle under "Free plan details": "Retention on the Free plan
  is fixed at 30 days. Pro plan lets you shorten the window or extend it to
  90 days." During a scheduled clamp it reads "Pro plan keeps your current
  window." The footer keeps only Upgrade to Pro, right-aligned.
- Enterprise unchanged.

### Messages retention statement `0279899`

Messages (`src/pages/requests/RetentionStatement.tsx`, mounted by
`Requests.tsx` through `RequestsTableSection`'s new `statement` slot), PRD
"Configurable data retention v1" mockup 04, AG-1021 Chunk 2.

- **New banner** between the toolbar (search, Filters, Export CSV) and the
  table, an info `Callout`: "Showing the last {days} days, back to {date}.
  Older messages are deleted, and their fingerprints remain verifiable."
  Free 30 days, Pro and Enterprise 90; the date is the oldest message inside
  the window. Same sources as the Settings card (`retentionCeilingDays`,
  `oldestInWindow` over `MESSAGE_TIMES`).
- **"Retention settings"** button (Button `info-outline`, in the Callout
  `action` slot) goes to that tier's Settings page. Admins only; Managers and
  Members see the statement without it.
- **Routes:** `/messages`, `/messages-free`, `/messages-enterprise`. Not on
  `/messages-default` (no messages). New preview route
  `/messages-free/clamp`: "Showing the last 90 days, back to {date}. On
  {clamp date}, messages older than 30 days are deleted and their
  fingerprints remain verifiable.", with the button going to
  `/settings-free/clamp`.
- The table is not filtered to the window (the real build's job).

### Retention copy: "fingerprints" only `0279899`

Before: "Digital Evidence fingerprints". After: "fingerprints". In the
Settings retention card description ("Audit hashes, proofs, and fingerprints
are kept, …"), the lengthen toast ("Their fingerprints remain verifiable."),
the downgrade dialog (`cancel-plan-dialog.tsx`, "Their fingerprints stay,
…") and the Messages banner. Other features' "Digital Evidence" copy is
unchanged.

## Components

### Button shadow rule, `touch` size `32354e2`

`src/components/ui/button.tsx`, documented in `design.md` (Buttons, Touch
Targets).

- **Shadow rule.** Before: `default` and `secondary` had no shadow while
  `outline` carried `shadow-xs`. After: every variant with a surface (a fill
  or an edge) carries `shadow-xs` (`default`, `secondary`, `outline`,
  `ghost-to-outline` from `lg`); tinted variants (`destructive`, `promo`,
  `info-outline`, the lift family) stay flat and `raised` keeps `shadow-sm`.
  Every primary and secondary button on the site gains the shadow.
- **`touch` size.** New: 44px (`h-11`), otherwise `default`, for full-width
  actions in a phone-only layout. The one exception to "`default` is the
  largest size". No consumer yet.

### Card `elevation` prop `32354e2`

`src/components/ui/card.tsx`, documented in `design.md` (Cards &
Containers). New prop: `default` keeps the card tier's `shadow-xs`; `raised`
is `shadow-sm`, for a standalone choice card on a phone layout. No consumer
yet. `CardTitle` also accepts `htmlFor` when rendered `as="label"`.

### Callout icon gap 12px on every Callout `903ff0a`

`src/components/ui/callout.tsx`. Before: plain Callouts put the icon 8px
(`gap-2`) from the text; only Callouts with an action used 12px. After:
every Callout uses 12px (`gap-3`): Billing plan notes, BillingEnterprise
state banners, team Settings locked notes, the retention card and shorten
dialog notes, the Site Map note, the Messages banner. design.md Callout spec
updated.

### Retention plan details values right-aligned `903ff0a`

Settings > Data retention, every tier (`DataRetentionCard.tsx`). Before:
values left-aligned beside their labels. After: once label and value share a
row, values sit flush right in tabular figures, on one right edge with the
window input and the footer buttons, so Current window lines up under the
input. Stacked on a narrow list they stay left. The column is capped at
1024px, so the gap never stretches further.

### Callout `action` slot, Button `info-outline` `0279899`

- **`Callout`** (`src/components/ui/callout.tsx`): optional `action` prop,
  one control at the right edge. With it, the icon and text are one group,
  12px apart, centred against the control (before, the icon sat at the top
  while the text centred, so it floated); the group keeps a 16rem floor so
  the control wraps below on a narrow column. Without it the Callout is
  unchanged (8px icon gap).
- **`Button` `info-outline`** (`src/components/ui/button.tsx`): `border-info-border
  bg-transparent text-info-foreground-strong hover:bg-info-wash`, existing
  `--info-*` tokens only, for a control on an info Callout.
- Both documented in `design.md` (Button variants, Callout).
