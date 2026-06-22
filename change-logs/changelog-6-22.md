# UI Changelog: 2026-06-22

Running log of UI changes for 06-22. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-19.md`](./changelog-6-19.md).

---

## Components

### Audit record modal: accurate seal comment + Open Explorer as link `c01770e`

- `AuditRecordDialog.tsx`: the verified-seal comment claimed the asset renders at
  `h-8` (32px); corrected to `h-6` (24px) to match the actual `<img>`.
- Footer "Open Explorer" changed from a `<button>` to a real `<a>` (href to the
  Digital Evidence explorer, `target="_blank"`, `rel="noopener noreferrer"`) via
  Base UI `nativeButton={false}`, so it carries link semantics.

### Audit trail Filters: checkbox multiselect `33364fa`

- New `MultiSelect` (`multi-select.tsx`) replaces the two Base UI `Select multiple`
  controls (Member, Event type) in the Filters modal. Built on Popover + our
  Checkbox: a `(Select All)` row (binary: empty or checked, no indeterminate
  state) with a bottom divider, then checkbox rows.
- Row hover: `neutral-100` via the built-in `hover:` variant. Before, rows used
  `hover-fine:bg-neutral-50`; the project's `hover-fine` custom variant emits an
  empty rule (inline `@custom-variant` form cannot combine a media query with
  `&:hover`), so hover never showed. `hover:` is already gated behind
  `@media (hover: hover)` in Tailwind v4.
- Trigger mirrors `SelectTrigger` via `selectTriggerVariants`, extracted from
  `select.tsx` into `select-variants.ts` so component files only export
  components (react-refresh/only-export-components).
- Search input is built in but disabled for now (the Member field no longer
  passes `searchable`).

## Sections

### Audit trail: benefit-led page subtitle `33364fa`

- `AuditTrail.tsx` subtitle rewritten from the technical "Every model call gets a
  cryptographic receipt. Receipts are fingerprinted to Constellation's Digital
  Evidence layer on a public chain…" to "A tamper-evident record of every
  request, response, and policy decision the gateway handled. Investigate exactly
  what happened, and let anyone verify it independently."
- Leads with what the page does and the user benefit instead of the mechanism;
  grounded in the Audit Trail PRD (scope, developer use, independent
  verification).
