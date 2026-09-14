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

### Models: feed-reconciled catalog, rank column, Features strip, card hover `7457acd`

Before: the 29 curated catalog rows carried hand-typed prices, context
windows and capability tags, four of them authored today from research, and
several had drifted from the gateway (DeepSeek V4 Pro $0.44 vs $1.76 in,
Gemini 3.6 Flash $1.50 vs $0.75). After: `scripts/generate-models-catalog.mjs`
regenerates `src/data/models-catalog.ts` AND overwrites every curated row's
pricing, context, max output, capabilities and release date from the public
`GET /v1/models`, so no number in either file is typed by hand (PRD AG-675
G4). Price basis is the feed's billed PAYG rate with markup 1. Eight models
that carry seeded traffic (Haiku 4.5, Opus 4.7, Opus 4.8, Sonnet 5, DeepSeek
V4 Pro, Gemini 3.1 Pro Preview, Kimi K2 Thinking, Qwen3 Next) keep pinned
prices because Messages, Conversations, Activity and Teams dollar figures
were computed from them and are asserted to the cent. Best for research
swaps GPT-6 Astra (no PDF input in the feed) for Claude Opus 4.6 and its
subtitle now reads "PDF input, reasoning and million-token context", tested.

Shelf tables (`src/pages/models/ModelShelves.tsx`): a `#` rank column
(`type-mono-14 text-muted-foreground`, right-aligned, sr-only "Rank") leads
each row; widths re-pinned 4 / 30 / 9 / 15 / 15 / 17 / 10 percent, identical
across the four shelves. Main catalog table headers pinned
20 / 28 / 8.5 / 8.5 / 8.5 / 18 / 8.5 percent; they bite from about 1600px, at
1440 every column already sits at its content minimum.

`CapabilityStrip` (`src/pages/Models.tsx`) shows the first four of
`CAPABILITY_ORDER` (tool use, reasoning, vision, web search, then PDF in,
caching, JSON, streaming, audio, video) and collapses the rest into a
`Badge size="xs"` `+N` chip with a Tooltip listing the hidden labels. Column
header renamed Capabilities -> Features on both tables. The detail page's
full badge list is unchanged.

Featured cards: badge at 10px via `Badge size="xs"`, DeepSeek tagline "Open
weight", `p-4` with 16px between badge, name and stats (138px card), names
truncate and show a Tooltip only when clipped (`useIsTruncated`,
`src/hooks/use-is-truncated.ts`), and the card takes the new
`Card interactive` hover.

### Models: Free models from Gate, modality tabs, Features filter `d1318bc`

Before: the Models page had no free-model surface, two modality tabs that both
read 416, and a toolbar of search, provider and sort. After: a **Free models
from Gate** section sits between Featured and the shelves, behind its own
`Separator`: h2 `type-heading-24`, subtitle "Models Gate supports at no cost
for your plan, so you can ship without a paid balance.", and two cards that
reuse `FeaturedCard` (`src/pages/models/FreeModels.tsx`,
`src/data/free-models.ts`). The rows are the two cheapest tool-capable
models in the live feed: gpt-oss-20B (badge "Lightweight", Free + Pro, price
"Free") and DeepSeek V4 Flash 0731 (badge "Long context", Pro only, price
"Free (Pro plan only)"). On `/models-free` and `/models-default` the Pro-only
card rests at `opacity-75` with no hover fill (`FeaturedCard dimmed`, still
drills in), and a promo banner follows the cards: `Card` with
`border-promo-border`, promo shadow, the quiet dot texture, `SparklesIcon`,
"Pro comes with a premium free model" / "Upgrade and a more capable model
joins your free set at no cost, alongside everything the Free plan already
includes.", and a `variant="promo"` Upgrade to Pro routing to that tier's
`/billing-*?manage=1`. Absent on Pro and Enterprise.

Catalog tabs now read the feed's `type`: All types 416 / Text 240 /
Multimodal 176 (`Modality` widened, generator and reconcile map
`language` -> text, `multimodal` -> multimodal). A **Features** `MultiSelect`
(11 capability options in `CAPABILITY_ORDER`, intersect semantics, "All
features" placeholder, `popupWidth="content"`) sits between the provider and
sort Selects; the sort trigger dropped its stray `size="sm"` so all three
triggers match at 36px. Empty-state copy mentions fewer features.

Featured card grid is `grid-cols-1 @xl:grid-cols-2 @5xl:grid-cols-4`: 1-up on
phones, 2-up through 1280, 4-up from 1366, so the price line never wraps.

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

### Card: `interactive` variant `7457acd`

Before: `Card` had no hover affordance, so a clickable card needed a
call-site recipe. After: `interactive` prop on `card.tsx` adds
`cursor-pointer` and the table-row hover fill (`hover:bg-accent`, 150ms,
reduced-motion safe); press and focus stay on the inner `RowActionButton`.
Documented in design.md. Note recorded in both places: `hover-fine:` is
inert site-wide because the custom variant in `src/index.css` compiles to
invalid nested CSS; the variant uses plain `hover:` until that is repaired.

### TableRow: 48px floor `d1318bc`

Before: body rows were content-sized (`py-3` cells), landing at 45 to 46px
wherever a cell held one 14px line (Models list, shelf tables) and 48 or
more elsewhere. After: `TableRow` carries `h-12`, a MINIMUM on `<tr>` so
taller rows (Conversations 65, Teams 57) are unchanged. Site rule: no body
row under 48px. Recorded in design.md's Table entry.

### MultiSelect: `popupWidth` `d1318bc`

Before: the popup was always `w-(--anchor-width)`, which clipped labels
behind a compact trigger. After: `popupWidth="anchor"` (default, unchanged
for Audit Trail and the Teams pickers) or `"content"`, which floors at the
trigger width and grows to the longest label (`w-max min-w-(--anchor-width)
max-w-(--available-width)`). Models "All features" went from 122 to 153px
with no clipped label. Documented in design.md.
