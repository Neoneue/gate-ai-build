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
