# UI Changelog: 2026-06-18

Running log of UI changes for 06-18. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-17.md`](./changelog-6-17.md).

---

## Components

### Findings switcher: whole-card click + detail polish `a2a5263`

A batch of findings-detail refinements in `RequestDetailBodyV2` /
`FindingSwitcherCard` / `FindingCard` / `CountChip` (`src/pages/Requests.tsx`).

- **Whole card clickable.** Before: only the top portion (label + match line)
  selected the group; the bottom pager row was dead. After: the select button
  carries a stretched overlay (`after:absolute after:inset-0 after:content-['']`)
  on a `relative` wrapper, so clicking anywhere on the card selects it. The
  pager paddles are lifted to `relative z-10` to stay clickable above the
  overlay; because the paddles already carry `disabled:pointer-events-none`,
  clicks over a disabled paddle (inactive card) fall through to the overlay too,
  so there are no dead zones.
- **No reset on re-click.** Added `disabled={isActive}` to the select button.
  Before: re-clicking an already-active card called `onSelect(items[0])` and
  snapped the pager back to "Finding 1 of N." After: the active card's body is
  inert; the paddles remain enabled for paging.
- **Inactive border tone.** Unselected switcher cards now keep the action tone
  dimmed instead of `border-border`: `border-warning-200` (flag/redact) /
  `border-danger-200` (block), darkening one step to `-300` on hover with a
  `transition-colors` on the wrapper. Active stays `border-warning-500` /
  `border-destructive`. Hover bg moved from the inner button to the wrapper so
  the whole card responds.
- **Sizing.** Pager `‹ ›` paddles 24 → 32px (`size-6` → `size-8`); the
  "Finding N of M" label `text-xs` → `text-sm`.
- **Count chips restored.** Re-added the `<CountChip>` aside on the "Findings"
  and "Passed" `PanelHeading`s (flush right, `count={findings.length}` /
  `count={passed.length}`); gave `CountChip` an explicit `font-medium` so the
  heading chips match the switcher chip (which inherited medium from its parent
  span).

## Sections

### Tune policy action routes to the Policies page `a2a5263`

In the finding "How to fix" actions (`RequestDetailBodyV2`), the **Tune policy**
button previously fired a toast ("Policy tuning · Adjust detector thresholds").
After: it navigates to `/policies` via the in-scope `navigate`.
