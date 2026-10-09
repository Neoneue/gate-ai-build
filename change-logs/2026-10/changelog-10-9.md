# UI Changelog: 2026-10-09

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-8.md`](./changelog-10-8.md)

---

## Sections

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
