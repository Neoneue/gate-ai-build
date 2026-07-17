# UI Changelog: 2026-07-16

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-15.md`](./changelog-7-15.md)

---

## Conventions

### Mono data voice: `type-mono-*` tokens; all data numerics tokenized `3dc5fd5`

**`src/index.css`**, **`design.md`** (+ ~27 page files)

Added `type-mono-16/14/12` utilities (`font-mono` + `tabular-nums`, per size) codifying the long-documented `data` voice, and routed every data value across the app through them. Root cause fixed: `table.tsx` sets `type-copy-14` (sans) on the `<table>`, inherited by all cells; a cell's own `font-mono` beats that inheritance, but a cell carrying BOTH `type-copy-14` and `font-mono` lost to `type-copy-14` by source order — so date/timestamp cells were silently rendering sans. Now data values (table cells, timestamps, IDs, hashes, token counts, currency, %, latencies, masked keys, currency/invite `<input>`s) use a `type-mono-*` token instead of hand-rolled `font-mono … tabular-nums` strings. Chart axis numerics also made mono: `STACKED_CHART_TICK` / `TREND_CHART_TICK` and the `ChartXAxisTick` `<text>` (HeroMetric, Security) gained `fontFamily: var(--font-mono)`. Text/names/descriptions stay sans (`type-copy-*`/`type-label-*`); hero numerics ≥24px stay sans + `tabular-nums` per design.md §648; code/`<pre>`, eyebrows, and 18px modal `KpiTile` numerics keep their own voices.

### twMerge: custom `type-*` utilities join the `font-size` group `9a9cfd5`

**`src/lib/utils.ts`**

`cn()` now uses `extendTailwindMerge` to register every custom typography utility (`type-heading-*`, `type-copy-*`, `type-label-*`, `type-input-helper`) into Tailwind's `font-size` conflict group. Before: twMerge treated them as unrelated classes, so a primitive's baked-in default (e.g. `CardTitle`'s `type-heading-16`) and a `className` override (e.g. `type-heading-18`) both landed on the element and CSS source order silently decided the winner — the override was effectively dead. After: a `className` (and its per-breakpoint `lg:` variants) cleanly replaces the primitive default. This is what lets primitives ship a default typography voice without locking it in, with no `!important`.

## Components

### SegmentedPill: internal button padding standardized to 12px `9a9cfd5`

**`src/components/ui/segmented-pill.tsx`**

The rail sets `data-spacing=0`, whose `ToggleGroupItem` variant `group-data-[spacing=0]/toggle-group:px-2` forced 8px side padding on every rail button — a plain `px-*` base could never beat it, so earlier padding edits were no-ops. Now both sizes override that same variant to `px-3` (12px L/R): `default` and `sm` rail buttons both read 12px, matching the `default` Select trigger's airier feel. Only the box height stays size-aware (`default` 32px / `sm` 24px). Affects the six `sm` consumers (Activity, Conversations, Requests, Security, TokenSavings, TrendCard), which move 8px -> 12px internal padding.

### Button / Input / Select: shadcn-aligned size scale `70b9b6e`

**`src/components/ui/button.tsx`**, **`input.tsx`**, **`select-variants.ts`** (+ ~28 call sites)

Adopted the shadcn size scale on form controls (desktop sizing): `default` = 32px (`h-8`), `lg` = 36px (`h-9`), flat 12px (`px-3`) L/R padding — was 24/32/40/48 with `px-4` on default/lg. Button icon sizes follow (`icon` size-8, `icon-lg` size-9); Select keeps asymmetric chevron padding (`pl-3 pr-2`). **Every `<Button>` now carries an explicit `size` prop** (no implicit default), swept via the TypeScript AST across ~46 call sites (no-size -> `lg`, `default` -> `lg`, `icon` -> `icon-lg`) so sizes can go responsive per breakpoint. Migration rule: any control that was 40px (old default) -> `lg`; 32px stayed `default`/`sm`. `WorkspaceSwitcher` refactored from a hand-rolled `<button>` to the `Button` primitive (`variant="outline"`, `lg`); `AlertDialogCancel` + ApiKeys `CreateKeyButton` defaults bumped to `lg`. Docs: `design.md` token block + component prose + touch-target minimums updated; `data-model.md` primitive-mapping fix.

### Input / Select default bumped to `lg` (36px); table toolbars sized up `5463e82`

**`src/components/ui/input.tsx`**, **`select.tsx`**, **`select-variants.ts`**, **`search-input.tsx`** (+ 7 table pages)

`lg` (36px, `h-9`) is now the primitive default for `Input` and `SelectTrigger` — set on both the function-param default and the cva `defaultVariants`, so unspecified inputs/selects and the MultiSelect trigger all land at 36px. Rationale: 32px read too small for text entry, and `lg` is the shadcn standard. Explicit `sm`/`default` call sites are unaffected (e.g. the Overview chart selector stays `sm`). `SearchInput` now renders `size="lg"`, so every table-toolbar search field is 36px. Each table toolbar's controls moved `sm`/`default` -> `lg`: Filters + Export CSV buttons (Requests, Security, Activity, AuditTrail) and filter Selects (Conversations Key/Model, Team Role, Models Vendor/Provider). The AuditTrail Filters-modal footer (Reset/Cancel/Apply) moved `sm` -> `lg` to match the Requests/Security filter modals. `design.md` input/select default + touch-target notes updated.

## Sections

### Overview "Tokens used" chart title -> 18/16 responsive `9a9cfd5`

**`src/pages/Dashboard.tsx`**

The `OverviewUsageChart` card title now renders `type-heading-18 lg:type-heading-16` (18px tablet/mobile, 16px at `lg`+). It previously carried the same intent but was overridden by `CardTitle`'s baked-in `type-heading-16` and rendered flat 16px; the twMerge fix above makes the responsive size actually apply.

### Overview "Tokens used" selector + toggle sized to `sm` (32px) `3dc5fd5`

**`src/pages/Dashboard.tsx`**

The `By model` Select trigger (was `size="lg"` = 36px) and the Tokens/Spend `SegmentedPill` (was `size="default"` = 40px) both drop to `size="sm"` (32px), matching the header-toolbar convention. The control row was rendering 40px tall (driven by the pill); it is now a consistent 32px. No control uses the old 40px tier.

### Overview + Activity chart tooltips: 2-column gap -> 24px `5463e82`

**`src/pages/Dashboard.tsx`**, **`src/pages/activity/TrendCard.tsx`**

The stacked-chart tooltips (label column vs. value column) were cramped and inconsistent — Overview at `gap-3` (12px), Activity at `gap-7` (28px). Both now use `gap-6` (24px) between the two columns. Only these two large breakdown charts carry 2-column tooltips; the HeroMetric / Security charts use single-value tooltips and are unchanged.

### Model breakdown: `Claude Haiku` series relabeled `Others` `5463e82`

**`src/pages/activity-data.ts`**

The 6th `by model` series (`key: "haiku"`) now labels as `Others` instead of `Claude Haiku`, reading as the combined-other-models bucket. Label-only change on the shared `SPEND_SERIES.model`, so it updates both the legend and hover tooltip on the Overview "Tokens used" chart and the Activity trend chart (the tooltip pulls its label from the same series `config`). Series key and color unchanged.
