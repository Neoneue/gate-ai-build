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

### Button / Input / Select: shadcn-aligned size scale `70b9b6e`

**`src/components/ui/button.tsx`**, **`input.tsx`**, **`select-variants.ts`** (+ ~28 call sites)

Adopted the shadcn size scale on form controls (desktop sizing): `default` = 32px (`h-8`), `lg` = 36px (`h-9`), flat 12px (`px-3`) L/R padding — was 24/32/40/48 with `px-4` on default/lg. Button icon sizes follow (`icon` size-8, `icon-lg` size-9); Select keeps asymmetric chevron padding (`pl-3 pr-2`). **Every `<Button>` now carries an explicit `size` prop** (no implicit default), swept via the TypeScript AST across ~46 call sites (no-size -> `lg`, `default` -> `lg`, `icon` -> `icon-lg`) so sizes can go responsive per breakpoint. Migration rule: any control that was 40px (old default) -> `lg`; 32px stayed `default`/`sm`. `WorkspaceSwitcher` refactored from a hand-rolled `<button>` to the `Button` primitive (`variant="outline"`, `lg`); `AlertDialogCancel` + ApiKeys `CreateKeyButton` defaults bumped to `lg`. Docs: `design.md` token block + component prose + touch-target minimums updated; `data-model.md` primitive-mapping fix.

## Sections

### Overview "Tokens used" chart title -> 18/16 responsive `9a9cfd5`

**`src/pages/Dashboard.tsx`**

The `OverviewUsageChart` card title now renders `type-heading-18 lg:type-heading-16` (18px tablet/mobile, 16px at `lg`+). It previously carried the same intent but was overridden by `CardTitle`'s baked-in `type-heading-16` and rendered flat 16px; the twMerge fix above makes the responsive size actually apply.
