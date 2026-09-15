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

### Models: Featured cards no longer animate on load, Context column wider `67190bf`

- **Mount stagger removed.** Before: each Featured card sat in a wrapper
  with `motion-safe:animate-in fade-in-0 slide-in-from-bottom-3
  duration-300 fill-mode-backwards` and a 100ms per-card `animationDelay`,
  so the row faded and slid in on every refresh. After: the cards render in
  place as direct grid items, no wrapper, no entrance motion. A staggered
  entrance fits a marketing page, not a dashboard someone refreshes all day
  (`src/pages/models/ModelShelves.tsx`).
- **Featured table widths.** Before: Context 9%, Input 15%, Output 15%,
  Features 17%. After: Context 12%, Input 16%, Output 16%, Features 12%.
  Rank 4%, Model 30% and Providers 10% unchanged; total stays 100%.

### Models: Features strip on the cards, 2x2 grid, default badges, 18px names `a5803c3`

- **Features on every card.** Featured cards gain a fourth stat, `Features`,
  and the Free cards a third, both rendering the table's `CapabilityStrip`
  (4 glyphs + `+N` chip) so the cards and the catalog share one component
  (`src/pages/models/ModelShelves.tsx`, `FreeModels.tsx`, `Models.tsx`).
- **Icon tooltips.** Before: each capability glyph carried a native `title`.
  After: each is a `Tooltip` on a rendered `span` (no nested button) with the
  capability label; `aria-label` + `role="img"` kept. Glyph gap `gap-1` to
  `gap-2` (8px). Applies to the table strip too.
- **4-up dropped.** Before: `@7xl:grid-cols-4 @xl:grid-cols-2`. After:
  `@4xl:grid-cols-2 grid-cols-1`, 2x2 from 896px of main width and stacked
  below. A 2-up card needs 424px for the four-stat row; `@4xl` gives 440.
- **Stat grid.** Featured `@md/card:grid-cols-[56px_80px_80px_128px]`,
  folding to `[56px_80px_80px]` with Features on its own `col-span-3` row
  below a 448px card. Free `@md/card:grid-cols-[56px_max-content_128px]`,
  folding to `[56px_1fr]` + `col-span-2`; the price track is content-sized
  so Features sits one gap after `Free`. Column gap steps to 24px at
  `@lg/card` (was `@md/card`, which clipped by 8px at 1200 viewport);
  `gap-y-2` between stat rows. Overflow 0 at 1920 / 1280 / 1100 / 960 /
  800 / 640 / 480 / 390 on both surfaces.
- **Badges default size.** Card tagline and `+N` chip drop `size="xs"`
  (h-4, 10px) for the default 20px / 12px pill. Chip measures 32px at every
  possible count, hence the 128px track.
- **Name 18px medium.** `type-label-16` to `type-label-18`. The token was the
  only label voice at `font-normal` and had no other users; it is now
  `font-medium` in `src/index.css` and the Label 18 row of `design.md`.
- **Badge gap.** `RowActionButton` `gap-4` to `gap-5`: 20px badge to name,
  16px name to stats. Card height 146px at 2-up.
- **Section subtitles.** Featured and Free move from `type-copy-14` to the
  catalog header's `type-copy-16 tracking-snug`, so all three 24px headings
  on the page pair the same way. Shelf headings (20px) keep 14px copy.
