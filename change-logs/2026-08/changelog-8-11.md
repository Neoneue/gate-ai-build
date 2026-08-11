# UI Changelog: 2026-08-11

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-6.md`](./changelog-8-6.md)

---

## Conventions

### Page content responds to its COLUMN, not the browser `519c0a2`

**`design.md` §Responsive → Container queries** · **36 page files**

`<main>` in `DashboardChrome.tsx` has declared `@container` since 2026-07-27, but that rollout scoped itself to page-level **grids**. Toolbars, card headers, and shared primitives were left on viewport prefixes, and its own changelog recorded the exclusion ("Messages / Team … had no page-level grids").

That gap was invisible until the Ask AI panel docked open: the panel narrows the content column while the viewport stays wide, so a 1280px browser hands a page a ~628px column while every `md:` / `lg:` / `xl:` prefix still reads 1280. Toolbars stayed crammed on one row, charts drew 30 bars into 500px, grids kept columns they had no room for.

**The rule now:** inside `<main>`, use `@`-prefixed container variants. A raw `sm:` / `md:` / `lg:` / `xl:` on page layout is a defect. Exceptions, documented in `design.md`: the chrome itself (`DashboardChrome`, `AuthLayout`, `sidebar`), Dialog/Sheet/AlertDialog content, the Ask AI panel internals, and outer site margins.

**Standard thresholds** — reuse, don't invent: table toolbars `@2xl` (672px) · chart two-pane split `@4xl` (896px) · TrendCard/Overview chart headers `@min-[638px]/card-header` (638 = 672 column − 34px card chrome).

76 viewport variants converted across 36 files. Two independent things narrow the column and both are now test axes: the Ask AI panel, and the nav rail collapsing 240px → 64px.

### `lg` is gone from Input and Select `519c0a2`

**`ui/input.tsx`** · **`ui/select-variants.ts`** · **`design.md`**

`Button` dropped `lg` on 2026-07-28; `Input` and `Select` never followed. Both declared `defaultVariants: { size: "lg" }`, so `lg` was already the de facto default and every field in the app rendered at 36px — only the name was wrong.

Pixel-identical rename, mirroring Button's: the old 32px `default` is deleted, `lg`'s recipe becomes `default` (`h-9`, 36px), `sm` (32px) stays. 38 controls measured before and after; 36 byte-identical.

**Two deliberate moves**, both ruled: Team's invite-role Select 32px → **36px** (it sat under a 36px email Input); Security's event-verdict Select type 14px → **12px** via `size="sm"`, holding 32px to keep row parity with the `Button size="sm"` beside it.

**`Input` is now single-size.** No `size` prop at all — passing one is a compile error. All 33 `<Input>` call sites already passed nothing.

### Off-scale type sizes now fail the build `519c0a2`

**`scripts/check-design-tokens.mjs`**

The design-token guard caught `text-[11px]` in a Tailwind class but was blind to `fontSize: 11` in a JS object or `fontSize={11}` on an SVG `<text>` — which is exactly how an 11px chart tick shipped and survived review. A 1px type deviation is not detectable by eye, so a human is not a viable backstop.

The guard now fails on any numeric `fontSize` outside **10 / 12 / 14 / 16 / 18 / 20 / 24 / 32 / 40 / 48 / 56 / 64 / 72**, in unitless, `px`, quoted, and JSX-prop forms. It fired immediately on four violations across three files.

---

## Components

### `chart-geometry.tsx` — one source for every axis-bearing chart `519c0a2`

**`ui/chart-geometry.tsx`** (new) · **`Dashboard.tsx`** · **`activity/TrendCard.tsx`** · **`activity/chart-helpers.ts`** · **`Security.tsx`** · **`requests/HeroMetric.tsx`**

Overview's "Tokens used" and Activity's "Tokens over time" had independently solved the same problem — keep the first X label off the Y-axis number column — in two incompatible ways. Overview anchored the first/last label inward; Activity pushed the whole plot right with `margin.left`. Each worked alone and they disagreed on screen, because `margin.left` moves the Y label column and inward anchoring does not. They also disagreed on tick size (10 vs 11) and Y-axis width (44 fixed vs auto).

Structural fix, in precedence order:

1. **The left reserve lives in `YAxis width` (48), never `margin.left`.** `width` moves the plot box and leaves the label column pinned at the card's content edge; `margin.left` drags the labels along with the plot. 48 = 42px label (7 chars, the widest any chart produces: `127.50M`, `$10,000`) + 6px clearance.
2. **`ChartYAxisTick` is LEFT-anchored** at `margin.left`. recharts' default right-anchors against the axis line, making the column's left edge a function of the longest tick *string* — so `22.00M` and `127.50M` start at different x even with identical axis widths. Every tick now starts at the same x as the `CardTitle` above it.
3. **`ChartXAxisTick` centres every label on its bar, ends included.** recharts insets the first and last tick to keep them inside the plot box; a custom tick draws at the coordinate it is given.
4. **`fontSize: 10`** everywhere — the type-scale floor. Geist Mono re-measured at 10px (`6.0000px`/char, flat across every glyph); the old constant was measured at 11px (`6.6003`) and was rescaled, never re-derived.

Sparklines (`HeroMetric`, `Security`) are the Y-less class: `SPARK_CHART_MARGIN` + `SparkXAxisTick`, which anchors ends inward because an area chart's end points sit ON the plot edges where a centred label would clip.

### TrendCard — bar density folds by column width `519c0a2`

**`activity/TrendCard.tsx`** · **`activity/chart-helpers.ts`** · **`activity/chart-helpers.test.ts`** (new)

The 2026-07-17 fix for this existed and was never reverted — it was keyed to `useMediaQuery("(max-width: 1023px)")`, so when the layout moved to column width it was stranded on the wrong axis. Same for the header, still on `md:grid`.

`BAR_DENSITY_TIERS` replaces a linear min-pitch rule with a **monotonic ladder** on the content column: ≥1024 → 30 bars · 672–1024 → 15 · 448–672 → 10 · <448 → 6. Sublinear by construction (halving 1024 → 512 takes bars 30 → 10), so bars get chunkier as the column narrows rather than holding constant density. **Invariant: a narrower column can never render more bars than a wider one** — asserted across a 120–2400px sweep. Adjacent buckets are **summed**, never sampled, so stacked totals still reconcile; `bucketLabel` tracks the aggregated size ("per 2 days"). Savings averages rather than sums, since a rate cannot stack.

Cost, surfaced and accepted: 1280 and 1024 panel-closed drop 30 → 15 bars (11px → 23px wide). 1440 and 1920 are unchanged.

### TrendCard / Overview — X axis is an even stride that lands on its bars `519c0a2`

`preserveStartEnd` + `minTickGap` are gone from both charts. `preserveStartEnd` force-keeps the first and last tick and then **clamps them inside the plot box** rather than centring them on their bar (this slid `Feb 27` into `Mar 5`), while `minTickGap` drops interior ticks opportunistically and leaves a dead gap mid-axis.

Both charts now hand recharts an explicit `ticks` array with `interval={0}`, so it renders exactly the subset given and hides nothing. Stride is derived from measured label width, preferring the tightest legal stride that **divides** the span so the run lands on the final bar. Where the span is prime (30, 8, 6 bars → 29, 7, 5) no dividing stride exists above two labels, so those stop one or two bars short rather than shortening the final interval and reintroducing uneven spacing.

Verified by coordinate across 30 states: stride spread **0.00**, minimum label gap **17.2px**, every label centred on its bar within **0.49px**, nothing clipped.

---

## Sections

### Table toolbars stack on column width `519c0a2`

**`ui/filter-toolbar.tsx`** · **`requests/RequestsTable.tsx`** · **`Activity.tsx`** · **`AuditTrail.tsx`** · **`Conversations.tsx`** · **`Models.tsx`** · **`security/EventsTable.tsx`** · **`Team.tsx`** · **`Alerts.tsx`**

All seven page toolbars plus the shared `FilterToolbar` moved `md:` → `@2xl:`. Below a 672px column: section title on its own line, search input full width, trailing controls splitting the row evenly edge to edge. At/above: single inline row, trailing control flush right. Panel-closed rendering at 1440 and 1920 is byte-identical to before.

`min-w-0` added to every `SelectTrigger` in a toolbar — without it the trigger's label width keeps the wrapped row off an exact 50/50.

**`Activity.tsx` differs by necessity** and carries a comment saying why: its two trailing controls are a Button and a bare `<span>`, and `flex-1`'s zero basis floors at each item's own padding — the Button carries 22px, the span none, so equal `flex-1` split 193/171. `grow basis-1/3` gives both an equal basis above their floors while staying under half, measuring exactly 182/182.

### Page-level container conversion `519c0a2`

**36 files** across the app.

`xl:max-w-1/2` (page description width, ~20 files) and `xl:max-w-5xl` (content cap, ~12 files) standardised onto container thresholds; page section grids, `Settings` row stacking, `ApiKeys` Gate Connect art, and `RequestDetailBody`'s 3-column detail grid converted.

`ApiKeys` keeps its named `@container/connect` and now addresses it consistently (`@min-[672px]/connect:` alongside the existing `@min-[993px]/connect:`) rather than mixing named and viewport queries.

Remaining on viewport, deliberately: `plan-comparison-dialog*.tsx` (dialog-bound), `DashboardDefault.tsx` 664/665/749/756 (stacked `xl:max-[1320px]` caps whose intent needs a read, not a mechanical swap), and `BillingFree.tsx:539`.
