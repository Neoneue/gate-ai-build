# UI Changelog: 2026-06-13

Running log of UI changes for 06-13. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-12.md`](./changelog-6-12.md).

---

## Components

### Route-aware workspace plan badge; switcher moved out of sidebar `[43f278d]`

- The top-bar workspace switcher's plan badge is now derived from the route:
  **FREE** on `billing-free` and the default / free-tier pages (paths ending in
  `-default` or `-free`), **PRO** everywhere else. Before: hardcoded `Pro`.
- `WorkspaceSwitcher` was a leftover in `src/components/ui/sidebar.tsx` after its
  2026-05-17 promotion to the top bar. Moved it to its own
  `src/components/ui/workspace-switcher.tsx`; trimmed the now-orphaned sidebar
  imports (`Check`, `ChevronsUpDown`, `Badge`, the `menu` import) and the stale
  `workspaceSwitcher` slot comment. `DashboardChrome` imports from the new file.

## Sections

### Plan-modal copy is state-correct; Pro price fixed to $29 `[bfe6fc1]`

The Manage-subscription modal copy differs by plan state (otherwise it reads
wrong for one side):

- **billing-free** modal: `Included in your Free plan:` / `What you'll get going Pro:`
- **Billing** (Pro) modal: `Included with the Free plan:` / `What you're getting with Pro plan:`

Also corrected the Pro price from `$30` to the canonical `$29` (matching the
Billing page and the Pro modal) across `plan-comparison-dialog.tsx`,
`SecurityDefault.tsx`, and `Upgrade.tsx`.
