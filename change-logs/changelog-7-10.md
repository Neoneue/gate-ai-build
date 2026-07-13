# UI Changelog: 2026-07-10

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-9.md`](./changelog-7-9.md)

**Organized by surface.** **Global** (shared primitives, design tokens, and
sitewide sweeps) comes first, then one section per page. A commit that touched
more than one surface appears under each surface it affected, with the same
hash — so you can read any single page top-to-bottom and see exactly how it
changed and which commits did it.

Commits this day: `8cecf87` (dark-mode audit) · `911f186` (table hover
transition) · `9fa7e80` (toolbar search align) · `5bc3719` (Tokens Saved
reconcile) · `233823a` (Requests→Messages) · `04440cf` (chart palette/axis/
radius) · `5aa9f3e` (Messages token columns) · `f779dbb` (Models badges) ·
`5b2fc78` (Models toolbar) · `d774dec` (a11y wins + blue-CTA rule).

---

## Global

### Dark-mode audit — shared primitives `8cecf87`

**`src/components/ui/{tabs,badge,compact-kpi,text-link}.tsx`, `src/components/canvas/Artboard.tsx`**

Part of a 5-way parallel dark-mode audit over every page + shared component
(per-page fixes from the same commit are under each page section below). The
shared-primitive fixes, which propagate everywhere:

- **`tabs.tsx`**: "line" variant tab hover fill (`hover:bg-neutral-100`, no dark pairing) → `hover:bg-accent`, which already inverts correctly. Was hitting ApiKeys, Team, and Models tab groups.
- **`badge.tsx`**: removed the `[a]:hover:*` classes from all 8 status-tint variants — dead code, since no `Badge` in the app is ever rendered as a link, confirmed by a full-repo grep.
- **`canvas/Artboard.tsx`**: two hardcoded `rgba(17,20,23,…)` shadows bypassed the dark-aware shadow-token ladder (no elevation cue on dark cards) → `shadow-(--shadow-popup)`.
- **`compact-kpi.tsx`**: chart tooltip cursor stroke used a raw `var(--color-neutral-300)` instead of the dark-aware grid token → `var(--color-chart-grid)`.
- **`text-link.tsx`**: the "locked" ink-plus-faint-underline recipe had no dark variants, so hover/focus (`decoration-neutral-500`) computed to *lower* contrast than resting (`decoration-neutral-200`) in dark — progression ran backwards. Added `dark:decoration-border` (resting) + `dark:hover/focus-visible:decoration-muted-foreground` (prominent); light mode untouched.

### Dark-mode audit — featured-plan gradient card `8cecf87`

**`src/pages/TokenSavings.tsx`, `src/pages/plan-comparison-dialog.tsx`, `src/pages/onboarding-shared.tsx`, `src/pages/Policies.tsx`**

The "featured plan" gradient card (`bg-gradient-to-b from-blue-50 to-blue-25`)
had zero dark coverage across four call sites, rendering a near-white card with
white text in dark — the most severe finding of the audit. Fixed using the
working reference in `pro-upgrade-card.tsx`: `dark:border-blue-400/30
dark:from-blue-500/10 dark:to-blue-500/5`. Also applied to the Policies "Pro
plan protection" upsell card, brought in line with the others per follow-up.

### Table/row hover — stop border-color interpolating through theme transitions `911f186`

**`src/components/ui/table.tsx`** · pages affected: **Conversations, Models, Messages, Security**

Table/row hover used `transition-colors`, which animates `border-color`
alongside `background-color`. Interpolating the divider between dark's
translucent white/10% border and light's opaque `neutral-200` produces a visible
mid-transition gray smudge — alpha and lightness ramp at different rates in
OKLab. Scoped to `transition-[background-color]` so the border snaps instantly,
matching `TableHeader`/`TableFooter`. Applied identically in the four page-level
row components (`Conversations.tsx`, `Models.tsx`, `requests/RequestsTable.tsx`,
`security/EventsTable.tsx`).

### Requests → Messages terminology rename `233823a`

**17 files, sitewide** · pages affected: **Overview, Activity, Messages, Conversations, Security, Models, Billing, Limits, Token Savings, Setup, Upgrade**

Nav label and routes had already moved to `/messages`; this finished the page-body
copy — KPI titles, column headers, breadcrumb/empty-state text, dialog copy,
aria-labels/sr-only strings. Also fixed two `navigate()` calls still pointing at
the stale `/requests` route (Dashboard's latest-messages row, EventsTable's
open-message link) — broken links, not just stale copy.

Scope is rendered/AT-facing text only. Internal identifiers (`Requests.tsx`,
`RequestRow`, `RequestsTable`, `requestRowId`, the `requests/` directory) are
left as-is — same precedent as Digital Evidence's fingerprint/anchor split. The
Python `requests` library reference in `Models.tsx`'s code sample is untouched.

### Categorical chart palette — dark-mode override `04440cf`

**`src/index.css`, `design.md`**

The categorical palette (`--chart-1..8`) had no `.dark` override — same lightness
in both themes, reading too bright against the near-black canvas. Added a `.dark`
override 5 points darker (L −0.05, same hue/chroma); light mode untouched.
Consumed by every chart in the app; the visible drivers were Overview's "Tokens
used" and Activity's "Tokens over time" (see those pages for the per-chart axis
and radius work in the same commit).

### design.md — blue Pro-CTA exception `d774dec`

**`design.md`**

Rule #1 ("blue is never a primary action") now carries one blessed exception:
brand-blue Pro-upsell CTAs (`bg-blue-700 …`), naming the surfaces
(pro-upgrade-card, Policies, TokenSavings, plan-comparison-dialog featured plan).
Every other primary stays neutral-900 ink.

---

## Overview (`Dashboard.tsx`)

### Reconcile Tokens Saved rate with the Token Savings 7d window `5bc3719`

**`src/pages/activity-data.ts`, `src/pages/Dashboard.tsx`** (also Token Savings)

Overview's Tokens Saved tile used a hardcoded `TOTAL_SAVED_RATE` (23%) unrelated
to any other number in the app — 9 points off the Token Savings page's real 7d
rate (caching 0.18% + compression 14.0% = 14.2%). Exported
`TOKEN_SAVINGS_RATE_7D = 0.142` from `activity-data.ts` and wired both pages to
it. Also gave the Dashboard sparklines real day labels, hover tooltips, and value
formatters (previously bare).

### "Tokens used" chart — axis labels + rounded stack tops `04440cf`

**`src/pages/Dashboard.tsx`**

Y-axis tick had no `fill` (Recharts' hardcoded `#666`, not a token) and no
`tickMargin` (labels flush against the gridlines) → `var(--muted-foreground)` +
`tickMargin={4}`. Stacked bars: only the topmost series gets `radius={[2,2,0,0]}`;
bottom and middle stay square. (Palette `.dark` override is the Global
`04440cf` entry.)

### Chart-metric toggle — accessible name `d774dec`

**`src/pages/Dashboard.tsx`**

The `SegmentedPill` metric toggle had no accessible name → `aria-label="Chart metric"` (WCAG 1.3.1).

---

## Activity (`Activity.tsx`, `activity/TrendCard.tsx`)

### Dark-mode: Top-cards subtitle opacity `8cecf87`

**`src/pages/Activity.tsx`**

Top Models/API Keys/Users card subtitle was `text-muted-foreground/5` — a stray
5% opacity modifier making it invisible in both themes → plain
`text-muted-foreground`.

### Toolbar search bar aligns to the KPI/card grid above it `9fa7e80`

**`src/pages/Activity.tsx`** (same fix on Conversations)

The "Recent X" toolbar search flexed with no relation to the KPI row above.
Rebuilt the toolbar as the *same* grid as the row above (`grid-cols-3`), title in
the first two columns, search+controls in the third — so the third column's left
edge is identical by construction. Verified: search starts at the same x as the
3rd KPI tile (1019).

### "Tokens over time" chart — axis right-align + rounded stack tops `04440cf`

**`src/pages/activity/TrendCard.tsx`**

Y-axis had a bespoke left-anchored `<text>` renderer (from an earlier alignment
fix) — replaced with the right-aligned `tickMargin={4}`/`width={44}` pattern via
`tickFormatter`, matching Overview. Topmost stack series gets `radius={[2,2,0,0]}`.

### Chart-metric toggle — accessible name `d774dec`

**`src/pages/Activity.tsx`, `src/pages/activity/TrendCard.tsx`**

Both metric `SegmentedPill` toggles → `aria-label="Chart metric"` (WCAG 1.3.1).

---

## Messages (`Requests.tsx`, `requests/*`)

### Dark-mode: FindingSwitcherCard border `8cecf87`

**`src/pages/requests/RequestDetailModal.tsx`**

`FindingSwitcherCard`'s unselected-card border (`border-{danger,warning}-200`,
unpaired) rendered a pastel outline on dark cards → `dark:border-*-500/30` + hover
variant.

### Table columns — spell out "Tokens In" / "Tokens Out" `5aa9f3e`

**`src/pages/requests/RequestsTable.tsx`**

Every other table in the app labels these columns "Tokens In"/"Tokens Out"; the
Messages table just said "In"/"Out".

*Also affected by Global commits: `911f186` (row hover transition), `233823a`
(rename — page copy + the `?open=` navigate targets).*

---

## Conversations (`Conversations.tsx`, `conversations/*`)

### Dark-mode: trace-row hover ring `8cecf87`

**`src/pages/conversations/RequestTracePanel.tsx`**

Trace-row hover rings (`hover:after:ring-{success,warn,danger}-200`) had no dark
pairing, rendering a near-white flash on hover → `dark:hover:after:ring-*-500/25`.

### Toolbar search bar aligns to the KPI/card grid above it `9fa7e80`

**`src/pages/Conversations.tsx`** (same fix on Activity)

Rebuilt the toolbar as the KPI rail's grid (`grid-cols-1 sm:grid-cols-3`), title
in the first two columns, search+controls in the third. Verified: search starts
at the same x as the 3rd KPI tile (1008).

*Also affected by Global commits: `911f186` (row hover transition), `233823a` (rename).*

---

## Security (`Security.tsx`, `security/*`)

### Dark-mode: Mark-invalid button hover + hero axis-tick contrast `8cecf87`

**`src/pages/Security.tsx`, `src/pages/security/EventsTable.tsx`**

- EventsTable "Mark event invalid" button's `hover:bg-neutral-50` (unpaired) made the label/icon vanish on hover in dark → `hover:bg-accent`.
- Security hero-chart axis-tick text used a raw `var(--color-neutral-500)` fill, computing to 3.79–4.18:1 (below the 4.5:1 floor) → semantic `var(--muted-foreground)`.

*Also affected by Global commits: `911f186` (row hover transition), `233823a` (rename — EventsTable open-message link).*

---

## Models (`Models.tsx`)

### Dark-mode: provider-icon separator ring `8cecf87`

**`src/pages/Models.tsx`**

The stacked-provider-icon separator ring hardcoded `var(--color-white)`,
producing a bright white halo around vendor icons in dark → theme-aware
`var(--card)`. (The `tabs.tsx` dark fix in the Global entry also fixes the Models
tab group.)

### Capability badges — more vertical room `f779dbb`

**`src/pages/Models.tsx`**

The capability strip (Vision, Tool use, JSON mode, Streaming, Prompt caching)
used the shared `Badge`'s default `h-5` (20px), pinching the icon+label. Bumped to
`h-6` (24px) on this usage only — `Badge`'s shared `h-5`/`px-2` contract is
load-bearing elsewhere and stays untouched.

### Toolbar — match search + dropdowns to site convention `5b2fc78`

**`src/pages/Models.tsx`**

Search fell back to the default `surface="card"` (gray) and the three Select
triggers used the shared `bg-muted` default. Set search `surface="elevated"` and
added the established `border-border bg-card font-normal text-foreground`
override to all three triggers, matching the Conversations toolbar. Shared
primitives untouched.

*Also affected by Global commits: `911f186` (row hover transition), `233823a` (rename).*

---

## Policies (`Policies.tsx`, `policies/*`)

### Dark-mode: sensitivity slider fill + action radio/border variants `8cecf87`

**`src/pages/Policies.tsx`, `src/pages/policies/config.ts`**

- The sensitivity slider's checked stop lost its `muted-foreground` fill to the base `RadioGroupItem`'s higher-specificity `dark:data-checked:bg-primary` (confirmed by computed-style measurement) → added `data-checked:`-qualified overrides so ours out-specifies the base.
- `ACTION_ACTIVE_RADIO` (flag/redact/block checked-dot colors) and `ACTION_ACTIVE_BORDER.flag` had no `dark:` pairing — redact's dot (`neutral-700` on `neutral-800`) was nearly invisible. Added `dark:` variants for all three; redact now routes through semantic `muted-foreground`.

*Also affected by Global commit `8cecf87` (featured-plan gradient card, Policies upsell).*

---

## Token Savings (`TokenSavings.tsx`)

### Tokens Saved rate wired to the shared constant `5bc3719`

**`src/pages/TokenSavings.tsx`** (with Overview)

The page's real 7d "Total saved" value now reads from the shared
`TOKEN_SAVINGS_RATE_7D = 0.142` so it can't diverge from Overview's tile.

*Also affected by Global commit `8cecf87` (featured-plan gradient card).*

---

## Setup (`SetupManual.tsx`)

### Model-picker focus ring `d774dec`

**`src/pages/SetupManual.tsx`**

Rows set `focus-visible:bg-accent`, but `hover:` and `data-[active]:` selected
also use `bg-accent`, so keyboard focus was invisible against the selected row.
Added a distinct `focus-visible:ring-2 ring-ring ring-inset` — WCAG 2.4.7.

---

*Two dark-mode items (`8cecf87`) were verified with a single in-browser
computed-style measurement each (the Policies slider fill, the redact/flag radio
dot colors) rather than by inspection alone, per the project's cap on in-browser
verification passes.*
