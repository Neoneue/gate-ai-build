# UI Changelog: 2026-06-24

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-6-23.md`](./changelog-6-23.md)

---

## Components

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
