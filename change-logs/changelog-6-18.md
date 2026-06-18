# UI Changelog: 2026-06-18

Running log of UI changes for 06-18. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-17.md`](./changelog-6-17.md).

---

## Conventions

### Press scale 0.98 + cursor:pointer on buttons `7550799`

- Press affordance standardized to `active:scale-[0.98]` **site-wide** (was a
  uniform `0.99`): 18 usages across 12 files. `motion-reduce` resets unchanged.
- New global `@layer base` rule in `index.css`: `button:not(:disabled)` and
  `[role="button"]` (excluding `aria-disabled`) get `cursor: pointer`. Tailwind
  v4 preflight ships buttons as `cursor:default`; this restores the pointer.
  Disabled / aria-disabled controls keep the default arrow.

### shadow-xs darkened ~10% `7550799`

Overrode the Tailwind default `--shadow-xs` in `@theme`: alpha `0.05` → `0.055`
(`0 1px 2px 0 rgb(0 0 0 / 0.055)`). Site-wide, slightly more lift on cards /
buttons / rails.

### Ultralight `-25` tint tokens `7550799`

Added a `-25` step (above `-50`) to the warning / success / danger ramps in
`index.css`: `--color-warning-25` `oklch(0.995 0.008 95.277)`,
`--color-success-25` `oklch(0.993 0.007 155.826)`,
`--color-danger-25` `oklch(0.988 0.007 17.380)` (danger kept more saturated).
Used as active-card background tints (see Components).

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

### Findings cards: active tint, static single card, select-none `7550799`

`FindingCard` / `FindingSwitcherCard` (`Requests.tsx`):

- **Active tint.** Active cards fill with the action-tone `-25` tint
  (`bg-warning-25` flag/redact, `bg-danger-25` block); inactive cards are white
  and **hover** to the tint. Hover classes are literal `hover:bg-warning-25` /
  `hover:bg-danger-25` consts (not composed `hover:${var}`) so Tailwind's
  scanner emits the rules.
- **Single finding is static.** When `findings.length === 1`, the lone
  `FindingCard` renders as a `<div>` (not a `<button>`): no pointer, no select,
  no click — there is nothing else to select. Multiple findings stay clickable.
- **select-none.** Clickable findings cards are `select-none` (matching the
  `Button` primitive) to stop accidental text selection on click; message /
  evidence content stays selectable.
- In-card count chip dropped to `text-xs` via a new `CountChip` `size` prop;
  the Findings / Passed heading chips stay `text-sm`.

### Detail KPI rail gets shadow-xs `7550799`

The request-detail KPI rail (`KpiRailShell` at `Requests.tsx`) passed
`shadow-none`, overriding the shell default. Changed to `shadow-xs` so it
matches the other rails (Models / Activity / Conversations already inherit it).

### Tune policy action routes to the Policies page `a2a5263`

In the finding "How to fix" actions (`RequestDetailBodyV2`), the **Tune policy**
button previously fired a toast ("Policy tuning · Adjust detector thresholds").
After: it navigates to `/policies` via the in-scope `navigate`.
