# Responsive handoff: making the Gate AI dashboard column-aware

**For:** the agent working in `gate-main`, app `apps/dashboard-web`.
**Reference:** `https://github.com/Neoneue/gate-ai-build`, branch `dev`, commit `519c0a2`.
**Scope:** layout and responsiveness only. See the hard constraint below.

This is not a spec and not a task list. It tells you **what we changed, why, and
where to read it**, so you can diff our build against yours and decide what fits.
The decisions are yours.

---

## ⛔ Hard constraint — layout only, never data

**Your build renders real data from a real backend. Ours renders mock data.**

Nothing here requires touching data, and nothing here authorizes it. If a change
appears to require altering what a number *is*, you have misread it — stop and
report rather than proceeding.

**Off limits:** API calls, endpoints, query params, response parsing, type
definitions, schemas, data models, and any computation producing a displayed
value (totals, deltas, percentages, averages, currency, token counts, rollups).
Also date bucketing and range selection at the source.

**In scope:** CSS and Tailwind classes, breakpoint prefixes, container
declarations, chart presentation props (margin, axis width, tick renderers, tick
font, which ticks get labelled), grid column counts, element positioning.

**Before you open a PR:** capture every displayed number on the affected pages —
KPI values and deltas, legend values and percentages, table cells, totals —
before and after, at the same viewport and date range. They should be
**byte-identical**. This task should not be capable of moving a number, so any
difference is worth stopping for.

One item (§5.3, bar density) comes closest to this line and carries its own
boundary note. If it doesn't fit cleanly, skipping it is a perfectly good outcome.

---

## 1. Good news: your dashboard is a fork of our prototype

This makes the whole job a diff rather than a translation.

Same stack — **Tailwind 4.3, recharts 3.8, React 19.2, Vite 6**. Same file
names, often the same line structure, and in places the same comments. Your
`apps/dashboard-web` appears to have branched from our prototype **before** the
responsive pass, so most of what follows is us having already walked the path
you're on.

Two concrete confirmations, so you can sanity-check the premise:

- Your `apps/dashboard-web/src/components/ui/kpi-rail.tsx` `COLUMN_CLS` (lines
  43–49) is byte-identical to ours *before* this pass.
- Your `apps/dashboard-web/src/pages/Activity.tsx` Y-axis carries the comment
  *"wide token ticks (`127.50M`) never spill past the card padding"* — that's our
  comment, from the version we later replaced.

**The practical consequence:** for most items below you can run a direct
file-to-file diff and read our reasoning in the commit and changelog, rather than
working from this document at all. That's the intended workflow. This doc exists
to tell you which files to open and what question each one answers.

---

## 2. Analyze before changing anything

We wrote the first draft of this from two screenshots, then read your repo. The
per-file findings in §5 are now grounded — but we still haven't run your app, and
we don't know your constraints.

Worth confirming for yourself first: open the app at 1440px with the Ask AI panel
docked and compare the viewport to the actual content column.

```js
const main = document.querySelector('main');
const cs = getComputedStyle(main);
console.log({
  viewport: window.innerWidth,
  column: Math.round(
    main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
  ),
});
```

If those diverge substantially, §3 is your root cause. Capture a measurement for
each symptom before you change it — you need a before to have an after.

A caution from our own experience: we changed one chart coordinate without
checking what else depended on it and shipped a visible regression while fixing
something adjacent. Reading the file's existing comments first would have caught
it.

---

## 3. The root cause, in one line

**Page content sizes off the viewport; it needs to size off its content column.**

Those were the same thing until the Ask AI panel shipped. The panel docks beside
the content and takes ~450px of it while `window.innerWidth` never changes. At
1440px with the panel open, content lives in a ~790px column while every `md:` /
`lg:` / `xl:` prefix still reads 1440. The nav rail collapsing 240px → 64px is a
second, independent axis.

Every symptom in §5 follows from this.

**The single highest-leverage line in your repo** is
`apps/dashboard-web/src/layouts/DashboardChrome.tsx:203` — your `<main>` has no
`@container`. Ours is at `src/layouts/DashboardChrome.tsx:184` and does. Nothing
downstream can respond to the column until something declares one.

You already have containers in two places (`card.tsx:46`
`@container/card-header`, `api-keys/index.tsx:263` `@container/connect`), so the
pattern isn't foreign to the codebase — it just never reached the page shell.

**One trap that cost us time:** because `CardHeader` declares its own container,
a bare `@2xl:` written inside one resolves against the *header*, not the page
column. Named containers addressed explicitly (`@min-[…]/card-header:`) are how
we settled it.

---

## 4. How to use our repo

```bash
git clone https://github.com/Neoneue/gate-ai-build && cd gate-ai-build
git checkout dev

git show 519c0a2                      # the whole pass
git show 519c0a2 -- src/components/ui/kpi-rail.tsx   # or scope it
npm install && npm run dev            # localhost:3000, then open Ask AI
```

| Commit | What it is |
| --- | --- |
| `389f73e` | The Ask AI panel ships — when viewport breakpoints became wrong |
| `2d2ef8a` | First container rollout; page-level grids only |
| `519c0a2` | This pass — finished the conversion, unified chart geometry |

**The changelogs carry the reasoning, including what we got wrong first.** Start
at `change-logs/INDEX.md` — it indexes every entry so you open one file, not
thirty (~90k tokens if you glob the directory).

| Entry | Covers |
| --- | --- |
| `change-logs/2026-08/changelog-8-11.md` | This pass. Every item in §5 maps to an entry here. |
| `change-logs/2026-07/changelog-7-27.md` | The first rollout — its closing paragraph documents the scope it deliberately *excluded*, which is why a second pass was needed. |
| `change-logs/2026-08/changelog-8-6.md` | The floating-button anchoring (§5.7). |

Also `design.md` → "Responsive Behavior → Container queries" for the committed
rule and the exception list, and `data-model.md`'s Activity section for the chart
contract.

---

## 5. File-to-file, what we changed and where

Each row is a suggestion to diff, not an instruction to apply.

| Your file | Our file | What we changed |
| --- | --- | --- |
| `layouts/DashboardChrome.tsx:203` | `src/layouts/DashboardChrome.tsx:184` | Declared `@container` on `<main>` |
| `components/ui/kpi-rail.tsx:43` | `src/components/ui/kpi-rail.tsx` | Column ladder onto container steps |
| `pages/Activity.tsx` (chart) | `src/pages/activity/TrendCard.tsx` + `chart-helpers.ts` | Header stacking, bar density, axis stride |
| `pages/Dashboard.tsx:553` | `src/pages/Dashboard.tsx` | Chart onto shared geometry |
| 19 toolbar sites (`md:flex-none`) | `src/components/ui/filter-toolbar.tsx` + 7 pages | Toolbars onto `@2xl:` |
| *(no equivalent)* | `src/components/ui/chart-geometry.ts` + `chart-axis-ticks.tsx` | New — one geometry source for all charts |
| `scripts/` lint | `scripts/check-design-tokens.mjs` | Guard extended to numeric font sizes |

We counted **227 viewport variants** in `apps/dashboard-web`. We converted 76 in
ours. Not all of yours are wrong — chrome, dialogs, sheets, and the panel's own
internals are correctly viewport-scoped. `design.md`'s exception list is how we
drew that line.

### 5.1 Workspace switcher colliding with "Ask AI"

Your `DashboardChrome.tsx:156` already renders `<WorkspaceSwitcher>` in the
sidebar below `lg` — so the pattern the screenshots suggested is already built.
The collision is the *top-bar* instance running out of room when the panel
narrows the bar.

Worth checking: the top bar sits inside the pushed shell, so its width tracks the
panel. That makes it a case where chrome behaves like content. We'd look at
whether the top-bar switcher can hide (or truncate with `min-w-0` + `truncate`)
on the bar's own width rather than the window's.

### 5.2 KPI tiles clipping their values

Your `kpi-rail.tsx:43–49` is our pre-pass ladder exactly. It holds column count
on viewport steps, so with the panel open it keeps 3 columns in a column with
room for 1–2 and tiles land near 170px.

Ours steps the count down on container width, sized so each tile clears a stated
minimum where the eyebrow, value, delta, and sparkline stop colliding. The ladder
and that minimum are in our `kpi-rail.tsx` with the reasoning in the comment
above it.

Note your call sites: `Activity.tsx:374` passes `<KpiRailShell columns={3}>` with
no override. Ours had per-call-site overrides that existed only to defeat the
viewport ladder; once the primitive was right they became redundant *and* wrong,
so we removed them. Worth checking whether yours has the same.

### 5.3 Chart bar density

Activity renders ~40 hairline bars in a ~700px pane.

Ours reduces how many bars are **drawn** as the column narrows. Two properties we
found worth keeping whatever the approach: *monotonic* (a narrower column never
draws more bars than a wider one) and *sublinear* (bars get chunkier rather than
holding constant density). Monotonicity is easy to break by accident, because
plot width isn't monotonic in column width — crossing the two-pane threshold
hands a third of the card to the legend and the plot abruptly narrows.

See `BAR_DENSITY_TIERS` and the folding helpers in
`src/pages/activity/chart-helpers.ts`, plus the "bar density folds by column
width" entry in `changelog-8-11.md`.

> **⛔ Boundary.** In our build this is a display-layer transform over
> already-fetched data, sitting immediately before the chart. It doesn't touch
> the query, the models, or source bucketing, and nothing outside the bars reads
> the folded array — legend, KPIs, tooltips and exports all still read the source
> series and are byte-identical before and after. We assert as a unit test that
> the folded array sums to the source per series.
>
> If you take this on, we'd suggest holding that same invariant and matching
> whatever aggregation semantics your codebase already uses when it rolls a
> metric to a coarser period — counts combine by addition, rates don't. If a
> metric has no existing rule, leaving it unfolded is safer than inventing one.
>
> **If it doesn't fit cleanly, skipping it is fine.** §5.4 alone touches no
> values at all and fixes the readability. Don't restructure data plumbing for
> this.

If bars end up spanning multiple days, the subtitle can't still read "per day" —
that's a string, not a calculation.

### 5.4 X-axis labels uneven, ends off their bars

Activity reads May 11 · May 31 · Jul 9 · Jul 19 · Aug 10 — gaps of 20, 39, 10, 22
days, with the end labels off-centre from their bars.

Three recharts behaviors that aren't obvious from its docs; we only pinned them
by reading its source, so they're the most valuable thing in this document:

- `interval="preserveStartEnd"` force-keeps the first and last tick and then
  **clamps them inside the plot box** rather than centring them on their data
  point. That's the inset-ends look.
- `minTickGap` drops interior ticks opportunistically, producing irregular gaps.
- A numeric `interval` isn't a fix either — `getEveryNth` steps from index 0 and
  never guarantees the last tick.

Ours hands recharts an explicit tick subset with `interval={0}` and uses a custom
tick that draws at the coordinate it's given. Choosing which labels to show
changes no values. See our `chart-helpers.ts` stride helpers and
`chart-axis-ticks.tsx`.

### 5.5 Y-axis labels ragged, and the two charts disagreeing

Your `Activity.tsx` Y-axis uses `width="auto"` (with our old comment above it),
while `Dashboard.tsx:553` uses a fixed margin. That split is exactly what we had,
and it's why two charts on adjacent pages don't line up.

recharts' default right-anchors the Y tick, which makes the label column's left
edge a function of the longest tick *string* — so identical axis widths still
start at different x, and switching metrics shifts the column.

**The one thing we'd most want you to take from this section:** put the left
reserve in the YAxis `width`, not the chart's `margin.left`. `width` moves the
plot box and leaves the label column pinned; `margin.left` drags the labels along
with it. We added `margin.left` for an unrelated reason and it silently shifted
one chart's Y column, so two cards stopped lining up. That was our most expensive
mistake in this work.

See `src/components/ui/chart-geometry.ts` — the constants carry their derivations,
including how the axis width is sized for the widest label any chart can produce
at any metric.

### 5.6 Chart tick font size

Your build currently mixes them: `Dashboard.tsx:381` and `:568` are `10`, while
`Activity.tsx:510` and `:876`, `Messages.tsx:2570`, and `Security.tsx:697` are
`11`. (`packages/frontend-ui/src/cg/pagination.tsx` also has `11.5`.)

We had the same 10/11 split and it survived review for weeks — a 1px type
deviation isn't detectable by eye, so review can't catch it. We unified on one
size and extended our lint guard to fail on numeric font sizes outside the type
scale, since the existing guard only saw Tailwind classes and was blind to
`fontSize: 11` in a JS object or on an SVG `<text>`. That's how it got in, in
both builds. See `scripts/check-design-tokens.mjs`.

If you touch axis math, character widths need **re-measuring** at a new size, not
rescaling: Geist Mono is 6.6003px/char at 11px and 6.0000px/char at 10px — close
enough to a clean ratio to tempt you, and wrong.

### 5.7 Floating chat button over the legend

The FAB overlaps legend rows, truncating their values.

Ours anchors it to the composer rather than a fixed offset — the panel publishes
its composer height as a CSS variable via a `ResizeObserver`, and the FAB offsets
from that. Any mechanism works as long as it's positioned against the real
element rather than a constant. See `src/components/ui/ask-ai-panel.tsx` and the
FAB entry in `changelog-8-6.md`, which documents why the effect has to run before
paint.

---

## 6. How we verified

Don't verify by resizing the browser — that's the exact axis these bugs hide
from.

**The signature test:** reach the same column width two different ways and check
the layout is identical. Wide viewport + panel open, versus narrower viewport +
panel closed, same column. If they render differently, that element is still
keyed to the viewport.

This one check catches the whole class, and it's fast. We ran a full page × state
× viewport matrix first and it took 40 minutes to tell us less.

**Four states, not two** — the panel and the nav rail are independent axes:

|                  | Rail expanded | Rail collapsed |
| ---------------- | ------------- | -------------- |
| **Panel closed** | ✓             | ✓              |
| **Panel open**   | ✓             | ✓              |

For anything geometric, verify with measured coordinates rather than screenshots.
Typecheck and lint were green in our build the entire time the two charts were
visibly misaligned.

---

## 7. What we still don't know about your build

We read your repo but never ran it, and we don't know your constraints or
roadmap.

- **A symptom may have a different cause in yours.** §5.1 already turned out that
  way once we looked — the sidebar slot we were going to suggest already exists.
- **Our numbers are calibrated to our chrome.** Card padding, type scale, nav
  widths, and panel width all feed the thresholds. The reasoning transfers; the
  values may not.
- **Your `<main>` differs from ours** in ways that may be deliberate — you have
  `data-scroll-pane`, no width cap (with a comment explaining that as a knowing
  divergence), and different vertical padding. We're not suggesting you adopt
  ours wholesale; only that a container declaration has to live somewhere.

If your analysis contradicts something here, trust your measurements. We'd rather
fix this document than have you build to a wrong premise.
