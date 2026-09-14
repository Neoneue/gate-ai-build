# UI Changelog: 2026-09-14

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-9-9.md`](./changelog-9-9.md)

---

## Sections

### Models: Featured row, four curated shelves, catalog header `d4642da`

Before: the Models list page was a title, modality tabs, a toolbar and one
catalog table of 25 hand-authored rows. After: between the page header and
the catalog sit three new blocks, separated by hairline `Separator`s.
**Featured models** (h2 `type-heading-24`, `type-copy-14` subtitle) is a
`grid-cols-2 @3xl:grid-cols-4` row of 138px cards: a 10px mono positioning
badge (Frontier reasoning / Deep reasoning / Balanced / Open weight), the
brand-coloured `VendorAvatar` plus name, then Context and Input / output in
mono, with `p-4` and 16px between each row. Names truncate and show the full
name in a `Tooltip` only when clipped (`useIsTruncated`,
`src/hooks/use-is-truncated.ts`). Below it, **four shelves** stacked full
width, each an h2 `type-heading-20` plus a curated-voice subtitle and a
four-row table in `Card density="flush"`: Best for research, Best for 24/7
runs, Newest models on Gate, Most popular on Gate. Columns are Model,
Context, Input, Output, Capabilities, Providers at pinned widths
27 / 9 / 16 / 16 / 22 / 10 percent so every shelf lays out identically;
below about 832px the table scrolls horizontally inside its Card. Then an
**Explore our catalog** header (h2 `type-heading-24`, `type-copy-16`
subtitle) above the existing tabs and table. Picks and copy live in
`src/pages/models/curation.ts`; the two "Best for" shelves are allowlists
whose subtitle names the property that earned the pick (Notion AG-675
allows editorial groups, not quality rankings); Newest is allowlisted to the
four September 2026 releases and Popular is prod's catalog order. Files:
`src/pages/models/ModelShelves.tsx`, `src/pages/Models.tsx`
(`ModelsSurface`; `NumericCell`, `CapabilityStrip`, `ProviderStack` now
exported).

### Models catalog: all 416 live ids, sourced release dates, four new rows `d4642da`

Before: 25 rows, 3 with a release date. After: `MODELS` is 29 curated rows
(prod's popular order) followed by 387 rows generated from the gateway's
public `GET /v1/models` (fetched 2026-09-14) in
`src/data/models-catalog.ts`, excluded from Biome and ESLint and listed in
the token-efficient-reads rule. New curated rows: Claude Fable 5.1, GPT-6
Astra, Gemini 3.8 Flash, DeepSeek V4.1 Flash. Every curated row carries a
sourced release date. The page header now reads 416 models across 3
providers. `formatTokenCount` renders one decimal at the M step (1.0M, never
1M). `ProviderStack` renders marks in `PROVIDER_ORDER` on every row instead
of each model's own API order.

## Components

### Top bar logomark navigates to Overview below `lg` `e3642bb`

Before: below `lg` the top bar (`src/layouts/DashboardChrome.tsx`) carried the
logomark as a bare `<img>`, so tapping it did nothing, while the desktop rail's
logomark and the logo inside the navigation sheet both routed to the
workspace's Overview. After: the top-bar logomark is wrapped in the same
`aria-label="Go to overview"` button the rail uses, calling `onNavigate` with
the tier-aware `overviewPath` (`/overview`, `/overview-free`,
`/overview-default`, `/overview-enterprise`). Same focus ring as the rail.
Desktop unchanged (the button is `lg:hidden`).

### Top bar glyphs are 20px below `lg`, wrapper stays 36px `e3642bb`

Before: the three compact-bar controls (bell, icon-only Ask AI, hamburger)
rendered 16px glyphs inside the 36px `size="icon"` Button. After: the glyphs
are 20px below `lg` at the same 36px wrapper. Sparkles gets `className="size-5"
size={20}` and the hamburger `Menu` moves `size-4` -> `size-5`, both in
`DashboardChrome.tsx`. The bell (`src/components/ui/notifications-menu.tsx`)
gets `className="[&>svg]:size-5 lg:[&>svg]:size-4"` because `BellIcon` spreads
`className` onto a wrapper `<div>` and its svg is sized by the `size` prop;
from `lg` the bell returns to 16px so desktop is unchanged. Measured at 390px:
bell 20, Ask AI 20, hamburger 20, every wrapper 36; at 1280px: bell 16.

### Navigation sheet profile band on the card surface `e3642bb`

Before: the profile band at the foot of the mobile navigation sheet
(`SidebarAccountRows`, `src/components/ui/sidebar.tsx`) sat on `bg-card-muted`,
one step darker than the top bar and the sheet body. After: `bg-card`, the same
surface as the top bar, so the avatar, name and email row reads as part of the
sheet rather than an inset panel. The block is `lg:hidden`, so the desktop
avatar popover is untouched.

### VendorAvatar: initials tile for vendors without a brand mark `d4642da`

Before: `VendorAvatar` indexed `VENDOR_META` directly and the `Model.vendor`
type was the ten-member `Vendor` union. After: `Model.vendor` is
`VendorSlug` (any `owned_by` slug); `vendorMeta()` / `vendorLabel()` /
`isKnownVendor()` in `vendor-meta.tsx` resolve it, and unknown vendors
render a `size-4 rounded-sm bg-muted` mono uppercase two-letter tile, the
same fallback prod shows for Z.ai. `SetupModels`, the Requests and
Conversations model filters follow the wider type.

### Badge: `size="xs"`, 16px pill at 10px type `d4642da`

Before: one badge height, `h-5 text-xs`. After: a `size` variant on
`badge.tsx` with `default` unchanged and `xs` = `h-4 text-2xs`, the fenced
Micro-tier step. Only consumer: the Featured-card positioning tagline, where
the 12px badge outweighed the model name. design.md §3 Micro tier and the
Badge entry record it. Also added: `src/components/icons/lobe-mark.tsx`,
fifteen monochrome vendor marks inlined from `@lobehub/icons-static-svg`
1.95.0 (new devDependency) with a `LobeMark` slug map. It was built for a
card watermark that was then dropped as too close to OpenRouter's motif; it
is kept for the detail hero or Free models table.
