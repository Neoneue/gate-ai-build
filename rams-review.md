# Rams Design Review - Constellation Gate AI Dashboard

Accessibility (WCAG 2.1) + visual design review across the entire `src/` tree.
Generated 2026-05-28. Method: per-file review of all 99 `.tsx` files (41 batches) →
adversarial verification → cross-file consistency sweeps → coverage critic → targeted
gap-closing pass. 11 false positives were caught and dropped during verification.

```
═══════════════════════════════════════════════════════════════════
SUMMARY
═══════════════════════════════════════════════════════════════════
WCAG / per-instance findings:   0 critical · 3 serious · 27 moderate   (2 uncertain)
Systemic / consistency patterns: 4 serious patterns · large-count token drift
Files reviewed: 99   ·   Files with per-instance findings: 16   ·   Clean: 83
Mean per-file score: 99/100   (per-file hygiene strong; the real story is systemic)
═══════════════════════════════════════════════════════════════════
```

**Headline:** Per-file accessibility hygiene is genuinely strong. There are **no critical
issues** and only **three serious** ones. The interactive primitives (`Button`,
`IconActionButton`, `RowActionButton`) already encode focus rings, hit-area expansion, and
type-enforced `aria-label`, and Base UI handles focus trapping/keyboard wiring (the
`dialog-focus` verification pass confirmed zero gaps there). The meaningful work is
**systemic drift**: design-token bypass (`bg-white` ×28, raw `border-neutral-*` ×8),
12px / half-step spacing scattered across the 8px layout grid, and missing interactive
states on a handful of shared primitives.

---

## CRITICAL (0)

None.

---

## SERIOUS (3)

### 1. Locked nav items convey "Pro-gated" by icon color alone
`[A11Y]` **src/components/ui/sidebar.tsx:244** · WCAG 1.4.1
```
<Lock className="ml-auto size-4 shrink-0 text-muted-foreground/60" strokeWidth={1.75} aria-hidden />
```
The lock icon is `aria-hidden` and the only signal that a nav item is restricted. A screen
reader announces only the label, with no indication the feature is gated. `locked` is
independent of `disabled`, so a clickable gated item gives AT users no cue.
**Fix:** add a visually-hidden label after the icon - `<span className="sr-only">(Pro feature)</span>`.

### 2. Inline role-assignment Select has no accessible name
`[A11Y]` **src/pages/Team.tsx:351** · WCAG 1.3.1 / 4.1.2
```
<SelectTrigger size="sm" className="w-28 border-border bg-card text-neutral-900 font-normal">
  <SelectValue />
</SelectTrigger>
```
The per-member role `SelectTrigger` (`role="combobox"`) has no `aria-label`, no `Field`/`Select.Label`,
and combobox prohibits name-from-content - so the visible "Admin"/"Member" value is *not* its
accessible name. (The sibling filter trigger at line 230 correctly sets `aria-label="Filter by role"`.)
**Fix:** ``aria-label={`Role for ${row.name}`}`` on the trigger.

### 3. Request-ID metadata fails text contrast
`[A11Y]` **src/pages/Conversations.tsx:1104** · WCAG 1.4.3
```
<span className="font-mono text-xs text-neutral-400 shrink-0">{event.requestId}</span>
```
`neutral-400` (#a1a1a1) on the white card row computes to **2.58:1**, far below the 4.5:1 AA
threshold for normal text. This is real identifier content, not a decorative separator
(separators here use `neutral-300` + `aria-hidden`).
**Fix:** use `text-neutral-500` (4.74:1 on white) or darker for metadata identifiers.

---

## MODERATE (27)

### Accessibility

**Interactive `<tr>` keyboard-operable but lacks an interactive ARIA role** · WCAG 4.1.2
The rows are focusable (`tabIndex={0}`) with Enter/Space handlers, but keep implicit
`role="row"`, so AT does not announce them as activatable. Add `role="button"` (or `role="link"`
for navigations) at each site.
- src/pages/Dashboard.tsx:486 (Latest requests → navigate)
- src/pages/Dashboard.tsx:539 (Latest conversations → navigate)
- src/pages/Dashboard.tsx:593 (Latest security events → navigate)
- src/pages/Requests.tsx:1213 (open detail panel)
- src/pages/Security.tsx:1021 (open detail panel)
- src/pages/AuditTrail.tsx:497 - *uncertain:* same pattern, but `index.css:326` applies a
  recolored UA `outline-ring/50` to `*`, so a focus indicator does render; it just lacks the
  deliberate `focus-visible:ring` pattern `Button` uses. Add explicit `role="button"` +
  `focus-visible:ring-2` for parity.

**Touch target under 44px on raw buttons** · WCAG 2.5.5 (AAA; clears the 24px AA floor)
These raw `<button>`s bypass the `IconActionButton` `after:-inset-2` hit-area pattern.
- src/pages/Activity.tsx:1171 - "What's the difference…" info button wraps only a 14px icon
  with no padding/expansion (~14px effective target). Worst of the set; add `after:-inset-2 relative`.
- src/pages/Security.tsx:1173 - "Mark event invalid" fixed at `h-8` (32px), no hit-area expansion.
- src/components/ui/radio-group.tsx:26 - `after:-inset-x-3 after:-inset-y-2` on a 16px radio
  yields 40×32px; use `after:-inset-[14px]` for a 44×44 target consistent with the project standard.

**Text contrast (`neutral-400` as content text)** · WCAG 1.4.3 (~2.58:1 on white)
- src/pages/DashboardDefault.tsx:177 - `text-neutral-400 italic` "+ many more" overflow label.
- src/pages/AuditRecordDialog.tsx:89 - `text-neutral-400` "Path:" field label (sibling value is `neutral-700`).
Use `text-neutral-500`+ for any real text; reserve `neutral-400` for `aria-hidden`/decorative use.

**Subtitle contrast on the neutral-100 page background** · WCAG 1.4.3 (4.35:1, borderline fail)
`text-neutral-500` at `text-base` (16px) computes to **4.35:1** on the `neutral-100` page bg -
just under 4.5:1. On a white card the same token passes (4.74:1), so the failure is
surface-specific. Affects the page-subtitle pattern at:
- src/pages/Conversations.tsx:146, Guardrails.tsx:98, Security.tsx:583, Settings.tsx:59,
  Team.tsx:132, GuardrailsFree.tsx:97
**Fix:** subtitles sitting directly on the page bg should use `text-neutral-600` (7.17:1 on neutral-100).

**Charts have no text alternative** · WCAG 1.1.1
Recharts renders a bare SVG unless `accessibilityLayer` is set or a `role="img"`+`aria-label`
is supplied. Only Activity.tsx:669 sets `accessibilityLayer`. (`chart.tsx`'s `ChartContainer`
already forwards `aria-label`/`role` via `{...props}` - verified, *not* a wrapper bug.)
- src/pages/Security.tsx:421 (AreaChart - security events over time)
- src/pages/Requests.tsx:618 (AreaChart - request volume)
- src/pages/Dashboard.tsx:214 (stacked BarChart - model usage/spend)
- src/pages/ApiKeys.tsx:439 - Sparkline is the *sole* content of the "7-day requests" column and
  is `aria-hidden`, so the column is invisible to AT. Add an `sr-only` numeric summary alongside it.
**Fix:** add `accessibilityLayer` to each chart element, or a descriptive `aria-label` on the container.

**Form group / control accessible names** · WCAG 1.3.1
- src/pages/Policies.tsx:449 - Sensitivity `Segmented` (`role="group"`) has no `aria-label`. Pass `aria-label="Sensitivity"`.
- src/pages/Policies.tsx:475 - Scan-direction `Segmented` has no `aria-label`. Pass `aria-label="Scan direction"`.
- src/components/ui/feedback-fab.tsx:143 - `<Label>Screenshot</Label>` has no `htmlFor` and is not
  associated with the upload/capture controls. Wrap in `<fieldset><legend>` or `role="group" aria-labelledby`.
- src/components/ui/settings-row.tsx:44 - *uncertain:* `id?` is optional but the default mode
  renders `<Label htmlFor={id}>`; a caller omitting `id` would sever the association. Currently
  zero callers, so latent. Make `id` required in label mode (discriminated union) or warn.

**Other a11y**
- src/pages/Billing.tsx:249 - raw `role="radio"` buttons in a `role="radiogroup"` handle only
  `onClick`; APG requires roving `tabIndex` + Arrow-key navigation. WCAG 2.1.1. (Native buttons
  stay Tab/Enter operable, hence moderate.)
- src/pages/SecurityDefault.tsx:79 - decorative marquee `<table aria-label="Latest security events">`
  has a labelled `<thead>` (4 headers) but an `aria-hidden` `<tbody>`, so AT hits a labelled table
  with zero rows. WCAG 1.3.1. Put `aria-hidden` on the whole table/wrapper, not just the tbody.
- src/components/ui/compact-kpi.tsx:34 - `ArrowUpRight`/`ArrowDownRight` delta icons are
  decorative (direction is in the signed value) but not `aria-hidden`. WCAG 1.1.1. Add `aria-hidden`.

### Visual (interactive states / consistency within a file)
- src/pages/Models.tsx:1301 - `PlatformPanel` card-button has hover + focus-visible but no
  `active:` press feedback. Add `active:bg-neutral-100`.
- src/components/canvas/Artboard.tsx:150 - Reset button has hover but no `focus-visible:ring`,
  inconsistent with every other interactive element. Add the standard `focus-visible:ring-3 ring-ring/50`.
- src/components/ui/user-menu.tsx:34 - monogram initials use `font-mono` while sibling name/email
  use `font-sans`; decorative avatar text is neither code nor an ID. Use `font-sans`.
- src/components/ui/button.tsx:24 - `link` variant underlines only on hover, giving no resting
  affordance. Add `underline` at rest, vary `decoration-color` on hover (matches the `TextLink` recipe).

---

## SYSTEMIC / CONSISTENCY (cross-file)

These are aggregate patterns from grep-driven sweeps. **Counts are exact; instance lists below
are representative samples** (the per-pattern instance list was capped at 12 during collection).

### Color tokens (2 serious patterns)
- **`bg-white` ×28** `[serious]` - raw literal instead of the `bg-card` token. `--card` resolves to
  white today, so output is identical, but it bypasses the token contract and the page-bg-vs-card
  distinction. Hot spots: `card.tsx:31`, `dialog.tsx:90,185`, `alert-dialog.tsx:55`, `sheet.tsx:105`,
  `popover.tsx:51`, `menu.tsx:39`, `select.tsx:153`, `sidebar.tsx:85`, `DashboardChrome.tsx:46,90`.
- **`border-neutral-*` ×8** `[serious]` - raw neutral borders instead of `border-border`:
  `tag.tsx:19`, `textarea.tsx:11`, `alert-dialog.tsx:55`, `table-pagination-footer.tsx:81,104`,
  `message-block.tsx:95`, `Artboard.tsx:144`, `segmented-pill.tsx:67`.
- **Arbitrary hex `[#…]` ×2** `[moderate]` - `DashboardDefault.tsx:118,120` (`text-[#818CF8]`,
  `text-[#F87171]` syntax spans in a non-code-card file).

### Spacing - 12px on the 8px layout grid (forbidden `*-3` layout utilities)
| Pattern | Count | Notes |
|---|---|---|
| `gap-3` | 53 | layout gaps; use `gap-2`/`gap-4` |
| `py-3` | 45 | many are table/header rows |
| `pl-3` | 9 | some are component-internal in `button.tsx`/`select.tsx` icon insets - exempt those |
| `pb-3` | 6 | |
| `pr-3` | 5 | `button.tsx`/`select.tsx` icon insets partly exempt |
| `p-3` | 5 | |
| `pt-3` | 4 | |
| `mt-3` | 4 | |

### Spacing - half-step values (forbidden `*.5`)
Note: the icon `size-*` ladder (14/16/20/24 = `size-3.5`/`size-4`/`size-5`/`size-6`) is **explicitly exempt** from the no-`*.5` rule per design.md:609 and the project grid convention. Icon sizes below were a sweep over-flag, not violations.
| Pattern | Count | Notes |
|---|---|---|
| `size-3.5` (14px) | 22 | **OK - sanctioned.** Icon-ladder exemption (design.md:609). 14px icons pair only with 12px `text-xs` in xs/sm controls; the icon never sits beside 14/20 `text-sm` (default/lg use 16px `size-4`). No change. |
| `h-0.5`/`w-0.5` | 3 | `tabs.tsx` underline, `chart.tsx` |
| `h-2.5`/`w-2.5` | 2 | `chart.tsx` legend dots |
| `mt-0.5` | 2 | `Upgrade.tsx:82`, `plan-comparison-dialog.tsx:79` optical nudge |
| `h-1.5` | 1 | `Security.tsx:727` progress track |
| `h-3.5` | 1 | `compact-kpi.tsx:109` spacer |
| `pb-2.5` | 1 | `Artboard.tsx:20` |
| `size-1.5` | 1 | `status-dot.tsx:14` sm dot (6px) |

### Typography
- **`font-heading` alias ×5** `[moderate]` - resolves to `var(--font-sans)`; used interchangeably
  with `font-sans` across `card.tsx:61`, `dialog.tsx:317`, `sheet.tsx:189`, `alert-dialog.tsx:120`,
  `Activity.tsx:871`. Drop the alias, standardize on `font-sans`.
- **h3 hand-rolling the `SectionHeading` recipe ×8** `[moderate]` - `text-sm font-medium text-neutral-900 m-0`
  inlined instead of importing `SectionHeading`: `Dashboard.tsx:467,521,571`,
  `DashboardDefault.tsx:262,292,322`, `SecurityDefault.tsx:76`, `AuditRecordDialog.tsx:148`.
- **Raw sub-section h2 at inconsistent sizes ×6** `[moderate]` - `text-lg/6`, `text-xl`, `text-2xl`
  for the same tier (`Dashboard.tsx:124`, `DashboardDefault.tsx:143,367`, `Models.tsx:1163`,
  `SecurityDefault.tsx:171`, `Upgrade.tsx:134`). **`DashboardDefault.tsx:143` uses `font-semibold` -
  the only heading in the codebase doing so;** change to `font-medium` regardless. Consider a shared
  `SubsectionHeading` primitive.
- **`CardTitle` className overrides ×3** `[moderate]` - `SignIn.tsx:38`/`SignUp.tsx:31` force `text-xl`
  (breaking the responsive recipe); `Security.tsx:702` uses arbitrary `-tracking-[0.25px]`. Express
  the auth-card title as a variant, not an override; use `-tracking-snug` for tightening.
- **`text-[10px]` ×2** `[moderate]` - `monogram.tsx:37` sm variant steps below the `text-xs` floor.
  Register a named `--text-2xs` token or raise to `text-xs`.

### Component states (2 serious patterns)
- **row-action-button.tsx:35** `[serious]` - has `focus-visible:ring-3` but no `focus-visible:border-ring`,
  no hover bg, no `active:translate-y-px`. As the sole keyboard target in every table row it's
  visually inert on pointer. Add hover/active + the focus border to match `IconActionButton`.
- **icon-action-button.tsx:30** `[serious]` - no `disabled:` styling; a disabled instance looks
  enabled. Add `disabled:pointer-events-none disabled:opacity-50`.
- **textarea.tsx:11** `[moderate ×2]` - no hover-border state; also uses raw `border-neutral-200`
  while `Input` uses `border-border`. Align both.
- **checkbox.tsx:11 + radio-group.tsx:26** `[moderate]` - no hover state on the unchecked control.
- **switch.tsx:19** `[moderate]` - no hover affordance.
- **menu.tsx:63** `[moderate]` - `MenuItem` has no `data-disabled:` style (SelectItem has one).
- **text-link.tsx:30** `[moderate]` - no `disabled:` state.
- **segmented.tsx:36,137** `[moderate ×2]` - group + pill buttons have no `disabled:` styling.
- **button.tsx:24** `[moderate]` - `ghost`/`link` variants have no `active:` press response.

---

## Coverage notes (from the completeness critic)

- The systemic spacing instance lists were **sampled (cap 12/pattern)**; the counts are exact.
  Run `rg "\bgap-3\b" src` etc. for the full set before a sweep.
- `dialog-focus` verification returned **zero findings** - Base UI's focus trap, focus return,
  Escape handling, and title wiring are intact, and close controls carry accessible names. The
  main pass was correct to flag nothing there.
- 83/99 files are clean. The largest interactive pages were given dedicated reviewers, but for a
  zero-tolerance pass, the suspect-list worth a manual second look is: `chart.tsx`, `Conversations.tsx`,
  `ApiKeys.tsx`, `Team.tsx`, `Policies.tsx`, `dialog.tsx`, `DashboardDefault.tsx`, `AuditRecordDialog.tsx`.

## False positives dropped during verification (11)
Transparency: the adversarial pass refuted 11 plausible-but-wrong findings, including: icon-only
buttons that route through type-enforced `IconActionButton`/`RowActionButton`; `outline-none`
paired with `focus-visible:ring` (the correct pattern); a `neutral-400` branch in `Requests.tsx`
that is dead code (`isMissing` never true in the dataset); and the claim that `chart.tsx` doesn't
forward `aria-label` (it does, via `{...props}`).

---

## Scoring

Per-file mean **99/100** reflects that 83 files are clean and per-instance WCAG issues are few and
mostly moderate. That score understates the systemic work: if weighted by the token-drift and
component-state patterns, the codebase sits closer to **B+ / "strong foundation, finish the
token discipline."** Priority order: (1) the 3 serious items, (2) `bg-white`→`bg-card` and
raw-border sweeps, (3) chart text alternatives, (4) primitive component-state gaps, (5) spacing-grid cleanup.
