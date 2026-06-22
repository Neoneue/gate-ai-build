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

### Audit trail: fingerprint info tooltip `1e3d6e7`

- Added a shared `FingerprintInfoTooltip` (Info icon + Base UI `Tooltip`) beside
  the "Last fingerprint" KPI tile title and the Fingerprint table column header,
  with a plain-language explanation living in one component. Added an optional
  `titleInfo` slot to `KpiTile` to host the icon next to the title.

### API Keys Manual card: copy button anchor + tabs gap `f00ae42`

- `ConnectTabs` (floatingCopy): the conditional class concatenated into
  `gap-0relative`, so `relative` never applied and the Copy code button had no
  positioned ancestor (it anchored to the viewport bottom). Switched to `cn()`
  so `relative` applies (button now anchors to the snippet card) and the
  intended `gap-0` overrides the Tabs base `gap-2`.
- That removed an 8px gap below the tab row; the Manual code area went 208px →
  216px so the card height holds at 314px. Only the `floatingCopy` card was
  affected; other `ConnectTabs` usages already had `gap-0` working.

### Audit trail Filters: Export dropdown `7deb172`

- New Export control after the Filters button (`AuditTrail.tsx`): icon + "Export"
  + chevron, opening a menu with `Export as PDF` / `Export as CSV` (Base UI
  `Menu`). Menu aligns to the right edge of the trigger (`align="end"`).
- Disabled when the table has no rows to export, reusing the existing
  `isEmpty = filteredRows.length === 0` so it stays in sync with the empty state.
- Removed the page-header "Export view" button (superseded by this toolbar menu).

### Empty state: title grouped with copy `0500d34`

- `EmptyState` primitive: title + body wrapped in their own `flex-col` at `gap-3`,
  outer container at `gap-4`. Before, all children sat at a uniform `gap-3` with
  the action offset by `mt-1`. Now icon-to-title and copy-to-action read looser
  than the tighter title-to-copy pairing. Applies to every default-state card via
  `TableEmptyState`.

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

### Audit trail: redacted descriptions + empty-state copy `7deb172`

- `audit-trail.ts`: the revoked-key event showed a raw key id; redacted to
  `API key <API_KEY> revoked` (Requests placeholder convention). Removed the
  "Passthrough tokens require explicit X-Gate-Upstream-Url header." sentence from
  the two `Request error` descriptions.
- Empty-state body rewritten from "Requests, policy decisions, and limit checks
  will appear here as your workspace routes traffic." to "No events match your
  current search or filters. Clear them to see the full audit trail." The state is
  only reachable via search/filters, so it now points at the Clear filters action.
