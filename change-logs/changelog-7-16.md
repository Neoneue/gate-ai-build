# UI Changelog: 2026-07-16

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-15.md`](./changelog-7-15.md)

---

## Conventions

### twMerge: custom `type-*` utilities join the `font-size` group `9a9cfd5`

**`src/lib/utils.ts`**

`cn()` now uses `extendTailwindMerge` to register every custom typography utility (`type-heading-*`, `type-copy-*`, `type-label-*`, `type-input-helper`) into Tailwind's `font-size` conflict group. Before: twMerge treated them as unrelated classes, so a primitive's baked-in default (e.g. `CardTitle`'s `type-heading-16`) and a `className` override (e.g. `type-heading-18`) both landed on the element and CSS source order silently decided the winner — the override was effectively dead. After: a `className` (and its per-breakpoint `lg:` variants) cleanly replaces the primitive default. This is what lets primitives ship a default typography voice without locking it in, with no `!important`.

## Components

### SegmentedPill: internal button padding standardized to 12px `9a9cfd5`

**`src/components/ui/segmented-pill.tsx`**

The rail sets `data-spacing=0`, whose `ToggleGroupItem` variant `group-data-[spacing=0]/toggle-group:px-2` forced 8px side padding on every rail button — a plain `px-*` base could never beat it, so earlier padding edits were no-ops. Now both sizes override that same variant to `px-3` (12px L/R): `default` and `sm` rail buttons both read 12px, matching the `default` Select trigger's airier feel. Only the box height stays size-aware (`default` 32px / `sm` 24px). Affects the six `sm` consumers (Activity, Conversations, Requests, Security, TokenSavings, TrendCard), which move 8px -> 12px internal padding.

## Sections

### Overview "Tokens used" chart title -> 18/16 responsive `9a9cfd5`

**`src/pages/Dashboard.tsx`**

The `OverviewUsageChart` card title now renders `type-heading-18 lg:type-heading-16` (18px tablet/mobile, 16px at `lg`+). It previously carried the same intent but was overridden by `CardTitle`'s baked-in `type-heading-16` and rendered flat 16px; the twMerge fix above makes the responsive size actually apply.
