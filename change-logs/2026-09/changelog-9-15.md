# UI Changelog: 2026-09-15

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-14.md`](./changelog-9-14.md)

---

## Sections

### Models: Featured cards on a per-card grid, split stats, CMS seed badges `ac11a70`

- **Stats split.** Before: two stats, `Context` and `Input / output`
  (`$10.00/M / $50.00/M`). After: three, `Context`, `Input`, `Output`, one
  value each (`src/pages/models/ModelShelves.tsx`). The Free cards keep their
  own two-stat override (Context + `Input / output` = Free), label pending.
- **Per-card grid.** Before: stats in a `flex flex-wrap gap-x-4` row, widths
  set by content, so `131.1K` and `1.0M` made different columns. After: the
  card is `@container/card`; the stat row is `grid grid-cols-[56px_80px_80px]`
  (Free: `[56px_1fr]`), tracks sized to the widest value the column class can
  hold (`131.1K` 50px, `$184.80/M` 76px), `gap-4` below a 448px card and
  `@md/card:gap-6` above. Every label sits on the same x across a row.
  Measured 1920 / 1600 / 1200 / 800 / 390: gaps 16 / 16 / 24 / 16 / 16, no wrap.
- **4-up from `@7xl`.** Before `@5xl:grid-cols-4`. A quarter at `@5xl` is
  244px and the fixed 248px stat block clipped; 2x2 holds until 1280px of
  main content.
- **Name 16px, mark 20px.** `type-label-14` to `type-label-16`;
  `VendorAvatar size="md"`. Hidden shelf rows unchanged.
- **Badges are CMS seed data.** `FEATURED_PICKS` in `curation.ts` reads Most
  capable / Best for coding / Best value / Fastest, strongest to lightest; in
  prod the label and its model come from the backoffice CMS.
- **Subtitle.** Before: "Four models we would start with today. The strongest
  performer sits on the left and the lightest on the right, with two balanced
  picks in between." After: "The Gate team's suggested starting points for
  your project. Each one is a strong default for a different kind of work, so
  you can see what it costs and pick one with confidence." The left-right
  framing broke once the cards stack at 2x2.
