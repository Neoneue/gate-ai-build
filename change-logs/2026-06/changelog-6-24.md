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

### Default pages: empty-state rebuilds + Activity layout polish `4d347a2`

**`src/pages/SecurityFree.tsx`**

- Was: `ProUpgradeCard` upsell. Now: wraps `Security` component directly — full Pro page, no gate.

**`src/pages/SecurityDefault.tsx`**

- Was: animated live-feed `HeroCard` with plan comparison. Now: standard empty-state layout — Overview card ("No events yet") + `TableEmptyState` ("No security events"), matching `RequestsDefault` pattern.

**`src/pages/AuditTrailDefault.tsx`**

- Was: delegated to `AuditTrailFree` (full Pro page). Now: 2-col Overview grid with "No events logged" (List icon) and "No fingerprints logged" (Fingerprint icon) tiles + `TableEmptyState` under "Event log" section title.

**`src/pages/ActivityDefault.tsx`**

- Was: delegated to `ActivityFree` (full Pro page). Now: 3-tile KPI rail (No spend / No requests / No tokens) + "Tokens over time" empty card + `TableEmptyState` under "Recent key usage" section title. Top-by-axis row (Top models / keys / users) hidden.

**`src/pages/TeamDefault.tsx`**

- Was: delegated to `TeamFree` (full Pro page). Now: Members tab shows owner row only (Chad Ponticas) with pagination `total=1`; Invitations tab badge=0 with `TableEmptyState` "No teammates invited" (UserPlus icon).

**`src/pages/Activity.tsx`** (Pro + Free)

- Range selector moved from PageHeader top-right into an inline row with "Overview" `SectionTitle` (matches Security / Requests pattern). `size="sm"` on both controls.
- "Recent key usage" `SectionTitle` added above usage table; toolbar controls (search + Export CSV) moved flush-right of that header, out of the card's `FilterToolbar`.
- Page subtitle updated to "Cost, request volume, and token usage by model, API key, and team member."

**`src/pages/LimitsFree.tsx`**

- `ProUpgradeCard` body: "Upgrade in Billing" → "Upgrade to our Pro plan" (two-word swap only).

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

---

### Shared ON/OFF StatusBadge `b185914`

**`src/components/ui/status-badge.tsx`** (new)

- `<StatusBadge on={boolean} />` renders the on/off state pill: `success` (green) + `CircleCheck` when on, `neutral` (grey) + `CircleSlash` when off — both lucide icons at `size-3.5`, color inherited via `currentColor`.
- Height overridden to `h-6` (24px), 4px taller than the standard badge `h-5`, so the state pill reads distinctly from same-shaped Free/Pro tier badges. The leading glyph is the affordance (state indicator), allowed under Badge contract #2 (not a redundant tone restatement).
- Replaces the inline `<Badge variant={enabled ? "success" : "neutral"}>ON/OFF</Badge>` previously duplicated across Token Savings and Policies headers.

---

## Sections

### Token Savings: Compression plan cards + card-wrapped Caching options `b185914`

**`src/pages/TokenSavings.tsx`**

- **Compression card** — below the enable strip, added two side-by-side plan cards: **Basic compression** (Free, neutral card, `bg-muted-foreground` check chips) and **Advanced compression** (Pro, blue CTA card `border-blue-200 bg-gradient-to-b from-blue-50 to-blue-25`, `bg-blue-600` check chips), modeled on the Policies `ProBenefitsCard`. Each lists four benefits + a "Real traffic" footer (~8% / ~29%). The Pro card's "Upgrade to Pro" button sits flush-right in its title row and opens `PlanComparisonDialog`.
- Plan-card footers pin to the bottom via `flex-1` + `mt-auto` so both cards bottom-align; title + subtitle wrapped in their own `flex-col gap-1` column with the control as a sibling, so subtitles align regardless of control height.
- **Caching card** — the two options (Enable response caching, TTL) each wrapped in their own `rounded-sm border-border bg-transparent shadow-none` card (Policies option-card pattern); `Separator` removed.
- ON/OFF `StatusBadge` moved into the Compression and Caching `CardChromeHeader` (flush right, via new `action` slot); badges removed from next to the visible toggles.
- "Free" badge on the Basic card switched `neutral` → `success` (green).
- Body text migrated to semantic tokens (`text-foreground` / `text-muted-foreground`), not the `text-neutral-*` ramp.

### Policies: header status badges + Free prompt-injection Action panel `b185914`

**`src/pages/Policies.tsx`**

- Each policy card header gained an ON/OFF `StatusBadge` to the left of the collapse chevron, keyed to `state.enabled` — gives enabled-state visibility when the card is collapsed.
- Free prompt-injection card now renders the **Action on detection** panel (Block / Flag) above the Pro CTA and below the enable card; Sensitivity panel stays Pro-only. `showOptionPanels` comment updated to match.

### Requests: grow finding-modal wells to fill the clean-pass gap `7ea5ced`

**`src/pages/Requests.tsx`**

- On the clean-pass (success + allow) request detail, the left card's message wells now grow so the card bottom-aligns with the right card stack. A `useLayoutEffect` reads the right stack's natural height and the left card height, then water-fills the gap across the User message / Tool call and Assistant response wells.
- Each well is capped at its own overflow, so a short message is never stretched into an empty box; long content scrolls inside the grown well. Two-column (`md+`) layout only, stable under a `ResizeObserver`. No width / column classes touched.
