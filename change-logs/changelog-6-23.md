# UI Changelog: 2026-06-23

Running log of UI changes for 06-23. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-22.md`](./changelog-6-22.md).

---

## Components

### AuditTrail export simplified; Policies Pro card polish `854533f`

**AuditTrail — Export button (`src/pages/AuditTrail.tsx`)**
Before: Export was a `<Menu>` dropdown with "Export as PDF" and "Export as CSV"
items (both unimplemented TODOs).
After: Replaced with a single plain `<Button variant="outline" size="sm">`
labelled "Export CSV". Removed unused `ChevronDownIcon`, `Menu`, `MenuContent`,
`MenuItem`, `MenuTrigger` imports.

**Policies — FreePlanNoticeBanner (`src/pages/Policies.tsx`)**
Before: "You're on the Free plan." label in `text-neutral-700`; Upgrade button
had no `shrink-0`.
After: Label bumped to `text-neutral-900`; button gains `shrink-0` and text
wrapped in `<span>` to prevent wrapping on narrow viewports.

**Policies — ProBenefitsCard (`src/pages/Policies.tsx`)**
Before: Card bg `bg-blue-25` (flat); check icon circle `bg-blue-100 text-blue-700`;
SparklesIcon size 14.
After: Card bg `bg-gradient-to-b from-blue-50 to-blue-25`; check icon circle
`bg-blue-600 text-white` (filled); SparklesIcon size 16.

**index.css** — trailing blank line cleanup before closing brace (no visual change).

---

## Conventions

### Project-wide type-role utility sweep (pt. 2) `1edb34a`

Replaced remaining raw Tailwind font/size combinations with named type-voice
utilities across 44 files (components + all pages).

**Pattern replaced → replacement:**
- `text-sm` body copy → `type-copy-14`
- `text-xs` body copy → `type-copy-12`
- `font-medium font-sans text-base` headings → `type-heading-16`
- `font-medium font-sans text-lg` headings → `type-heading-18`
- `font-medium font-sans text-xl` headings → `type-heading-20`
- `font-medium text-2xl` / `font-medium text-3xl` → `type-heading-24`
- `font-medium text-xs` labels → `type-label-12`
- `font-medium font-sans text-sm` labels → `type-label-14`
- `text-base/6` body copy → `type-copy-16`
- `text-lg text-muted-foreground` (price suffix) → `type-copy-18`

**Files touched:** table.tsx, tabs.tsx, sidebar.tsx, select.tsx, dialog.tsx,
detail-list.tsx, empty-state.tsx, field.tsx, kpi-tile.tsx, message-block.tsx,
multi-select.tsx, compact-kpi.tsx, date-range-picker.tsx, feedback-fab.tsx,
notifications-menu.tsx, user-menu.tsx, AuthLayout.tsx, and all page files.

**Also shipped in this commit:**
- `DateRangePicker`: new `emptyLabel` prop (default `"Custom"`); AuditTrail
  filters dialog passes `emptyLabel="Select"`.
- `Policies` — `DetailCard`: `Info` icon stays `text-neutral-500`; all other
  icons receive `text-blue-700`.
