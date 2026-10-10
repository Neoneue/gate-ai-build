# UI Changelog: 2026-10-10

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-9.md`](./changelog-10-9.md)

---

## Conventions

### design.md rewritten to DESIGN.md best practice `e768dd8`

`design.md`, the design-system contract. No rendered UI changed.

- Before: 266 KB in a mixed structure (rules, component internals, dated
  history and quotes together), with stale entries and a token block the
  Google linter could not parse past.
- After: 59 KB in Google's DESIGN.md section order (Overview, Colors,
  Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts),
  plus Similar Brands (Vercel, Linear, Factory, OpenRouter), Motion, Voice &
  Content and an Agent Quick Reference. One bullet per item
  (`- **Name** (value): when to use it`), role tables, named rules and a
  "Reject these reflexes" list.
- Every value checked against `src/`. Removed entries for components that no
  longer exist (Stepper, Tag, FilterToolbar, ExpandingAction, Sparkline,
  BrandMark); corrected drifted recipes (table header, card plan-tier edges,
  badge `pro`, toast theme, `DetailList` as a label-value row, not a 4-column
  grid).
- The focus ring and the clipping contract, previously only YAML comments,
  are prose under Elevation & Depth.
- Google lint now validates the tokens: 0 errors.
- Citations elsewhere that used `design.md` line numbers now name the
  section; implementation notes live in each component's header comment.

## Components

### Badge and Button contrast notes `e768dd8`

`badge.tsx`, `button.tsx`. Comment-only; no rendered change. The measured
AA contrast for the badge tones and the promo button's dark-mode border
contrast moved here from `design.md`.

## Sections

### Onboarding setup: lit tiles, wider orbit, Claude 5.5 models `1d0e958`

`/overview-onboarding` setup step (`improved-art.tsx`, `improved-data.ts`,
`onboarding-motion.css`, `src/data/models-catalog.ts`).

- Art tiles: flat `bg-card` / `bg-chat-bubble-*` with `shadow-xs` became lit
  from above: `bg-linear-to-b from-card to-card-muted` (dark: `from-muted
  to-card`), `shadow-md`, and in dark a 1px `inset-shadow-2xs
  inset-shadow-border` top highlight.
- Orbit: field 200px to 216px (`size-54`), satellite radius 80px to 88px, so
  the shadowed tiles keep a 36px gap to the hub; ring dash offsets
  recomputed for the longer path. The peak shadow tween lists all five
  layers so it fades instead of jumping. Wire 1 crossing 700ms to 600ms.
- Model picker: Claude Opus, Sonnet and Haiku 5.5 added to the catalog;
  each newer version sits right after the one it follows; Claude Code starts
  on the first row instead of Claude Sonnet 5.
