# UI Changelog: 2026-07-07

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-6.md`](./changelog-7-6.md)

---

## Conventions

## Components

## Sections

### Billing: stack plan/credits cards + cap page at 1024px `9c7c05a`

**`src/pages/Billing.tsx`, `src/pages/BillingFree.tsx` (both tier twins)**

- Plan + Credits top row: dropped `md:grid-cols-2` so the two cards (Your plan, Credits) each render full-width on their own row (`grid-cols-1 gap-4`).
- Wrapped page content in `flex w-full flex-col gap-6 xl:max-w-5xl` — the same container Policies uses — so content caps at `max-w-5xl` (1024px) on `xl+` and stays fluid below. Inner `gap-6` matches `DashboardChrome`'s `<main>`, so section spacing is unchanged.
- Verified in-browser at 1440px viewport: `/billing`, `/billing-free`, and `/policies` all measure 1024px; tsc 0, lint clean, 0 console errors.

### Pages: 1024px content caps + API Keys responsive polish `8045817`

**`src/pages/ApiKeys.tsx`, `src/pages/Team.tsx`, `src/pages/Limits.tsx`, `src/pages/TokenSavings.tsx`**

- Extended the `flex w-full flex-col gap-6 xl:max-w-5xl` (1024px) content cap to API Keys, Team, Limits, and Token Savings (matching Policies/Billing). Verified at a 1700px viewport: all measure 1024px.
- API Keys "How to make requests": stacked the Automatic / Manual cards onto their own full-width rows (dropped `@min-[993px]/connect:flex-row`); restored the Gate Connect image and pinned it flush right; removed its container-query dynamic sizing (now static `w-[467.756px]`, centered) so it no longer shrinks/shifts across widths — breakpoints to be re-added; Automatic copy block → 400px; intro copy → full width.
- API Keys keys table: added `min-w-[1000px]` so it scrolls horizontally at reduced widths instead of overlapping columns (the shared `Table` container is already `overflow-x-auto`). Rebalanced columns — Key `w-[26%]`, Status `w-[14%]` (halved the Status gap, gave the room to Key); 7-day / Created / Last used unchanged.

### API Keys: a11y heading hierarchy + default-variant cap `1a2a8fa`

**`src/pages/ApiKeys.tsx`, `src/pages/ApiKeysDefault.tsx`, `src/components/ui/icon-action-button.tsx`**

From a Rams design review of the API Keys pages.

- `ApiKeysDefault` (`/api-keys-default`) — added the `xl:max-w-5xl` (1024px) content cap that `/api-keys` and `/api-keys-free` already had.
- Heading hierarchy: "How to make requests" was an `<h3>` directly under the page `<h1>` (skipped h2, WCAG 1.3.1). Promoted to `<h2>` and sized to the H2 voice (`type-heading-18` → `type-heading-24`) so semantic level and visual size agree — hierarchy now reads 32 > 24 > 20 (h1 > section > card titles). Added `mt-2` above the section (24 → 32px) so the larger heading isn't tight against the table.
- `IconActionButton`: hit-slop `after:-inset-2` → `after:-inset-3` — effective tap target 40 → 48px, meeting the documented ≥44 (WCAG 2.5.5). The docstring had claimed 44×44 but `-inset-2` only delivered 40; corrected it. Applies to every `IconActionButton` usage.
