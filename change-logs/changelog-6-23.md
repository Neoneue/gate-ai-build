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
