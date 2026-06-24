# UI Changelog: 2026-06-24

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-6-23.md`](./changelog-6-23.md)

---

## Conventions

### Default workspace: three-way switcher + `-default` route tier `4789531`

**`src/lib/plan.ts`**

- Split `isFreeSurface` (now `-free` only) into two distinct helpers: `isDefaultSurface` (`-default` suffix) and `isFreeSurface` (`-free` suffix). Added `isNonProSurface` (checks both) for sidebar lock logic.
- Added `toDefaultPath` (converts any path to its `-default` twin) and `DEFAULT_TWINS` set mirroring `FREE_TWINS`.
- Updated `toFreePath` to accept `-default` inputs (converts to `-free`); updated `toProPath` to strip both `-(free|default)`.

**`src/layouts/nav-sections.ts`**

- Extracted `buildVariantSections(suffix, lockedIds)` helper; regenerated `FREE_SIDEBAR_SECTIONS` through it.
- Added `DEFAULT_SIDEBAR_SECTIONS` (same shape; all items navigable, pointing at `-default` paths).

**`src/layouts/DashboardChrome.tsx`**

- `sections` prop now picks `DEFAULT_SIDEBAR_SECTIONS` / `FREE_SIDEBAR_SECTIONS` / `SIDEBAR_SECTIONS` based on path.
- `showLocks` set to `isDefault || isFree` so both non-Pro tiers display visual lock indicators.

**`src/components/ui/workspace-switcher.tsx`**

- Three-way dropdown: "Chad's workspace" (Pro badge), "Default workspace" (Free badge), "Free workspace" (Free badge).
- Each option routes through `toProPath` / `toDefaultPath` / `toFreePath` respectively.

**10 new `-default` page files + `App.tsx` routes**

- Created thin wrappers for every page lacking a hand-authored default variant: `ActivityDefault`, `AuditTrailDefault`, `BillingDefault`, `ConversationsDefault`, `ModelsDefault`, `PoliciesDefault`, `RequestsDefault`, `SettingsDefault`, `TeamDefault`, `TokenSavingsDefault` — each delegates to its `*Free` counterpart.
- Registered all 10 new routes in `App.tsx` alongside `/security-default` alias for `SecurityDefault`.

**`fix(workspace)` `de86510`** — badge text for Default workspace corrected to "Free" (not "Default").

---

## Components

### WorkspaceSwitcher badge polish + alignment fix `dcf770f`

**`src/components/ui/workspace-switcher.tsx`**

- Trigger badge now reflects active tier: Pro (blue `info`), Default (green `success`), Free (green `success`). Was always "Free" or "Pro" regardless of default surface.
- Dropdown items: name + badge wrapped in `flex items-center gap-2` so badge sits immediately after the label; check icon (`text-primary`) stays at far right. Was: name took `flex-1`, badge floated to far right.
- Default item badge: `variant="success"` (green), text "Default". Free item: `variant="success"`, text "Free". Pro item: `variant="info"`, text "Pro".

---

### Billing modal Pro card blue styling + display heading scale `cbe65d7`

**PlanComparisonDialog (`plan-comparison-dialog.tsx`)**

- Pro card background: `bg-card` → `bg-gradient-to-b from-blue-50 to-blue-25`; border: `border-primary/30 ring-1 ring-primary/20` → `border-blue-200`. Matches the blue upgrade card style used on Policies.
- Feature icon wrappers removed; icons render bare with `text-blue-700` (Pro) / `text-neutral-700` (Free).
- Price display (`$0` / `$20`): `type-heading-24` → `type-heading-32`.
- CTA button (Pro): overridden to `bg-blue-700 text-white shadow-blue-700/30 hover:bg-blue-800`.
- Modal width: `sm:max-w-3xl` → `md:max-w-[720px]`; two-column grid locked to `md:grid-cols-2` so both breakpoints move together.

**Display heading tier (`index.css` + `design.md`)**

Added six new display-tier type voices (`font-medium`, tight negative tracking, plain CSS properties to stay within lint guard):

| Voice | Size / Leading | Tracking |
| --- | --- | --- |
| `type-heading-72` | 72/72 | -4px |
| `type-heading-64` | 64/64 | -4px |
| `type-heading-56` | 56/56 | -3px |
| `type-heading-48` | 48/56 | -3px |
| `type-heading-40` | 40/48 | -2px |
| `type-heading-32` | 32/40 | -1px |

Documented in `design.md` semantic type table.
