# Color audit - 2026-09-18

Checklist of every raw colour in `src` that is not a design token, what it
should become, and which tokens are missing. Same shape as `audit.md`:
tick an item only after the fix lands; move ticked blocks to Status.

## Scope and method

- Swept `src/**/*.{ts,tsx,css}` minus the two data blobs
  (`request-bodies.ts`, `models-catalog.ts`). Transcript strings inside
  `requests.ts` / `request-previews.ts` matched `text-green` and
  `text-emerald`; those are captured shell commands, not UI, and are excluded.
- Four literal classes: bare hex, `rgb()/oklch()/hsl()`, arbitrary
  `*-[…]` colour classes, inline `style` colours.
- One class of near-literal: a raw Tailwind palette atom (`bg-neutral-100`,
  `text-blue-700`, `bg-white`) where `design.md` §2 already names a semantic
  token or a family (`--promo-*`) for that role.
- Yardstick: `design.md` §2 "Semantic token quick-reference", "Do not use",
  and the `--promo-*` / destructive-ladder precedents for how a family is
  shaped. Vendor SVG fills are sanctioned there and are not findings.

## Inventory

Counts are for `src` outside `index.css`.

- Hex literals: 128 in 12 files. 77 are vendor SVG fills (sanctioned). 27 are
  seven unused dotmatrix presets. The rest are comments, Recharts attribute
  selectors, `text-[var(--color-syntax-*)]`, and one order number in copy.
- `rgba()` literals: 3, all in `AuthLayout.tsx`.
- Raw palette classes (`blue`, `violet`, `neutral`, `white`): 167 uses,
  51 distinct classes, 30 files. Blue is 130 of them.
- Semantic classes on the status families (`success`, `warning`, `danger`,
  `destructive`): about 330 uses. That side is healthy.
- Tokens referenced but never defined: `--color-dot-on` (dead path, removed in item 1).
- Tokens defined but never consumed: `--promo-foreground` (documented).

## Findings

Severity: HIGH = wrong or dead colour shipping; MEDIUM = a role with no
token, copied across files; LOW = single site or cosmetic.

### A. Raw literals in code

- [x] **1. HIGH** `src/lib/dotmatrix-core.tsx:29-97`
  - Before: a `colorPreset` prop with eight presets. Seven (`solid-mint`,
    the six `grad-*`) carried 27 hex values and CSS gradients; the eighth,
    `solid-theme`, read `var(--color-dot-on)`, a token defined nowhere. No
    caller in `src` passed `colorPreset`, so the whole branch was dead and
    every dot matrix already painted with `color` (default `currentColor`).
  - After (applied 2026-09-18): `DotMatrixColorPreset`,
    `DOT_MATRIX_COLOR_PRESETS`, `resolveDmxColorTokens` and the
    `colorPreset` prop removed from both base components. `color` is the
    only colour input. No `--color-dot-on` token is needed.
  - Why: dead hex is still hex, and a prop that points at an undefined token
    is a trap for the next caller. The audit first read this as a live bug;
    it was not, because nothing reached the preset path.

- [x] **2. MEDIUM** `src/layouts/AuthLayout.tsx:188,189,236`
  - Before: three inline gradients on `rgba(255,255,255,0.05)`.
  - After: one token in the `--canvas-*` block of `index.css`,
    `--auth-glow: color-mix(in oklch, var(--color-white) 5%, transparent)`,
    consumed as `var(--auth-glow)` in the same three gradients.
  - Why: the only `rgba()` in `src` outside `index.css`. Same value three
    times is a token by the promo-family precedent.

- [x] **3. LOW** `src/components/ui/code-card.tsx:66-74`,
  `src/components/ui/code-panel.tsx:103-107`
  - Before: `text-[var(--color-syntax-keyword)]` and siblings, 12 uses.
  - After: `text-syntax-keyword`, `text-syntax-variable`,
    `text-syntax-property`, `text-syntax-terminal-blue`. The `--color-syntax-*`
    atoms already live in `@theme`, so Tailwind v4 generates these utilities.
  - Why: the arbitrary form hides the token from the theme scale and from
    class sorting. Also rename `--color-syntax-terminal-blue`: it resolves to
    `success-700` / `success-400` and is green in both themes.
  - Applied 2026-09-18: plain `text-syntax-*` utilities in both files;
    token renamed `--color-syntax-literal` in both themes.

- [x] **4. LOW** `src/components/ui/chart.tsx:64`
  - Before: `[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border`
    and the `#fff` twin.
  - After: keep. These are attribute selectors matching Recharts' own
    default stroke so it can be overridden with `stroke-border`. Add a
    one-line comment naming that, so a future hex lint has a waiver to read.
  - Why: no colour is applied; the hex is a selector key.
  - Applied 2026-09-18: JSX comment above the wrapper div.

- [x] **5. LOW** comments and copy
  - `segmented-pill.tsx:81` `#11141714`, `sidebar-upgrade-card.tsx:14`
    `#171717`, `RequestDetailBody.tsx:1299` `order #12345`. No action; listed
    so the count reconciles.

- [x] **6. NONE** vendor SVG fills
  - `src/components/icons/model-providers.tsx` (27),
    `gateway-providers.tsx` (22), `vendor-meta.tsx` (20),
    `src/components/ui/google-g.tsx` (8). Sanctioned by `design.md` §2
    "Vendor brand colors". Superseded by item 18: the hexes now live in one
    file and the lint allowlist is that file alone.

### B. Raw palette atom where a semantic token exists

- [ ] **7. MEDIUM** modal scrim, four copies
  `src/components/ui/dialog.tsx:35`, `sheet.tsx:58`, `alert-dialog.tsx:29`,
  `notifications-menu.tsx:164`
  - Before: `bg-neutral-900/40` three times, `bg-neutral-900/50` once. No
    dark variant, so the scrim is lighter than the dark page behind it.
  - After: `--overlay` in `:root` and `.dark`
    (`color-mix(in oklab, var(--color-neutral-900) 40%, transparent)` light,
    `var(--color-neutral-950)` at 60% dark), mapped to `--color-overlay`,
    consumed as `bg-overlay`. Notifications takes the same token; if 50% is
    deliberate, document why on the token.
  - Why: one role, four sites, two strengths, no theme handling.

- [ ] **8. MEDIUM** dark terminal surface
  `src/components/ui/code-card.tsx:79,80,336,341`, `code-panel.tsx:93`
  - Before: `bg-neutral-800`, `bg-neutral-700`, `border-neutral-900/60`,
    `text-neutral-100`, `text-neutral-400`.
  - After: a `--terminal-*` family beside `--chat-bubble-*`:
    `--terminal` (surface), `--terminal-chrome` (header strip),
    `--terminal-edge`, `--terminal-foreground`, `--terminal-foreground-muted`.
    Identical in both themes, declared once. The traffic lights already have
    `--color-traffic-*`.
  - Why: the terminal is intentionally dark on both themes, which is exactly
    the case where a raw step looks correct today and has no owner tomorrow.
    Confidence moderate: check `design.md` CMP-012 first; if it pins the ramp
    steps, the family still wins because it names the role.

- [ ] **9. MEDIUM** brand-blue monogram, five copies
  `src/components/ui/monogram-types.ts:16`, `sidebar.tsx:208,411,491`,
  `user-menu.tsx:45`
  - Before: `bg-blue-700 text-white` on four hand-rolled avatar circles plus
    the `blue` monogram tone. `monogram-types.ts:20` `ink` is
    `bg-neutral-700 text-white`.
  - After: the three sidebar sites and user-menu render `Monogram` instead
    of their own circle. `Monogram` `blue` reads `bg-promo-cta
    text-promo-cta-foreground` (blue-700 / white light, blue-600 dark), or a
    new `--tier-pro` token from item 14. `ink` reads `bg-surface-strong
    text-surface-strong-foreground`.
  - Why: four copies of a primitive's recipe, and `text-white` is a palette
    atom standing in for a foreground token.

- [x] **10. LOW** `src/components/ui/status-dot.tsx:7`,
  `src/components/ui/badge.tsx:54`
  - Before: `info: "bg-blue-600"`; badge `info` is
    `bg-blue-700/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300`.
  - After: an `--info` family mirroring the destructive ladder:
    `--info` (blue-600 / blue-400), `--info-foreground` (blue-700 / blue-300
    ink on wash), `--info-subtle` at 10%, `--info-muted` at 15%. StatusDot
    reads `bg-info`; Badge `info` reads `bg-info-subtle text-info-foreground`.
  - Why: success, warning and danger each have a family; info is the one
    status with none, so every consumer picks its own blue step.

- [x] **11. LOW** `src/components/ui/text-link.tsx:38`
  - Before: `decoration-neutral-200 hover:decoration-neutral-500` in light,
    `dark:decoration-border dark:hover:decoration-muted-foreground` in dark.
  - After: `decoration-border hover:decoration-muted-foreground` with no
    `dark:` pair. Note this moves the light hover from neutral-500 to
    neutral-600 (`--muted-foreground`); design.md §2 step table still says
    500, so update that row or accept the one-step shift.
  - Why: the dark side already uses the tokens; light should match.

- [x] **12. LOW** `src/layouts/AuthLayout.tsx:185,213,233`
  - Before: `bg-neutral-950`, `text-white`, `border-white/10 bg-neutral-900
    text-white`, `text-blue-400`.
  - After: `bg-surface-strong text-surface-strong-foreground` for the panel
    (surface-strong is neutral-900 today; if the panel must stay 950, add
    `--auth-canvas` next to item 2's `--auth-glow`). Border uses
    `border-border` scoped under a local `.dark` wrapper, which is what the
    dark theme already resolves it to. Icon ink `text-promo-accent`.
  - Why: the auth panel is a fixed-dark surface like the terminal; same
    argument as item 8.

- [x] **13. LOW** `src/pages/policies/config.ts:75`
  - Before: `redact` radio is `data-checked:border-neutral-700
    data-checked:bg-neutral-700 dark:…muted-foreground`.
  - After: `data-checked:border-primary data-checked:bg-primary` in both
    themes (`--primary` is neutral-900 / neutral-200). If the 700 step is
    load-bearing next to warning-600 and danger-700, say so in the comment.
  - Why: `flag` and `block` on the same line use ramp steps of a status
    family; `redact` is the neutral one and should bind to the neutral
    semantic.

### C. Repeated recipes that need a token

- [x] **14. HIGH** Pro tier tint, six copies
  `src/pages/Policies.tsx:411`, `TokenSavings.tsx:522`,
  `onboarding-shared.tsx:89`, `plan-comparison-dialog.tsx:131`,
  `plan-comparison-dialog-pro.tsx:134`, `src/components/ui/option-tile.tsx:60`
  - Before: `border-blue-200 bg-gradient-to-b from-blue-50 to-blue-25
    dark:border-blue-400/30 dark:from-blue-500/10 dark:to-blue-500/5`, pasted
    five times; `option-tile` is the flat twin `border-blue-200 bg-blue-50
    dark:border-blue-400/30 dark:bg-blue-500/15`. `callout.tsx:26` is a third
    variant on `border-blue-300 bg-blue-50 dark:border-blue-500/30`.
  - After: extend the promo family. `--promo-border` already exists
    (blue-200 light, blue-400 at 50% dark; the pages use 30%, pick one).
    Add `--promo-surface` (`blue-50` / `blue-500` at 15%) and
    `--promo-surface-wash` (the gradient, same shape as `--promo-wash`).
    Sites read `border-promo-border bg-promo-surface` or `[background:var(--promo-surface-wash)]`.
    Callout decides whether it is promo (join) or info (item 10 family).
  - Why: this is the exact case the `--promo-*` block in `index.css:410`
    was written for, and the family stopped one step short of the surface.

- [x] **15. HIGH** Pro tier ink and badge, twelve sites
  badge: `src/components/ui/badge.tsx:66`, `Policies.tsx:429`,
  `TokenSavings.tsx:580`, `teams/TokenSavingsPane.tsx:549`,
  `pro-upgrade-card.tsx:39`
  ink: `Policies.tsx:672`, `teams/PoliciesPane.tsx:458`,
  `DashboardDefault.tsx:386`, `pro-upgrade-card.tsx:41`,
  `plan-comparison-dialog.tsx:160`, `plan-comparison-dialog-pro.tsx:163`,
  `Billing.tsx:129`
  - Before: badge recipe `bg-blue-100 text-blue-700 dark:bg-blue-500/15
    dark:text-blue-300` five times. Ink `text-blue-700 dark:text-blue-400`
    six times, but `Billing.tsx:129` and the badges use `dark:text-blue-300`,
    and `SetupManual.tsx:172,447` plus `onboarding-shared.tsx:23,207` use
    `text-blue-600 dark:text-blue-400`. Three dark inks and two light inks
    for one role.
  - After: `--tier-pro` (blue-700 / blue-400), `--tier-pro-foreground`
    (blue-700 / blue-300, ink on wash), `--tier-pro-wash` (blue-100 /
    blue-500 at 15%). Badge `pro` = `bg-tier-pro-wash text-tier-pro-foreground`.
    Icon tints and the Billing hero = `text-tier-pro`. Decide whether the
    SetupManual / onboarding 600 step is a different role (link-ish
    step indicator) or drift; if drift, it joins `text-tier-pro`.
  - Why: the tier is a first-class concept (Card `tone="pro"`, Badge `pro`,
    the view-role switch) with no token, so every file re-derives it.

- [x] **16. HIGH** Enterprise tier, three sites and no ramp
  `src/components/ui/badge.tsx:62`, `card.tsx:72` (`data-[tone=enterprise]`
  selectors), `src/pages/BillingEnterprise.tsx:311`
  - Before: `bg-violet-100 text-violet-700 dark:bg-violet-500/15
    dark:text-violet-300`, `border-violet-200 dark:border-violet-500/30`,
    `text-violet-700 dark:text-violet-300`. Violet is Tailwind's default
    scale; `index.css` declares no violet ramp and `design.md` §2 does not
    list it as a brand or status hue. Badge's own comment records this.
  - After: `--tier-enterprise`, `--tier-enterprise-foreground`,
    `--tier-enterprise-wash`, `--tier-enterprise-border`, resolving to the
    default violet steps used today. Add a "Plan tier colours" subsection to
    `design.md` §2 naming Pro = blue, Enterprise = violet, with the four
    roles each. Only then does violet stop being an undocumented hue.
  - Why: the user set the hue (2026-09-16), so this is documentation and
    tokenisation, not a colour change. Same family shape as item 15 so the
    two tiers read as one system.

- [x] **18. MEDIUM** vendor colours scattered across four icon files
  `src/components/icons/model-providers.tsx`, `gateway-providers.tsx`,
  `vendor-meta.tsx`, `src/components/ui/google-g.tsx`
  - Before: 77 brand hexes as `fill=` / `stopColor=` attributes and
    `color:` fields, the same value repeated across files (Google blue in
    three places, Alibaba orange and Cohere coral in two).
  - After (applied 2026-09-18): `src/components/icons/brand-colors.ts` is
    the one file in `src` that holds a raw hex. `BRAND_COLORS` keys by brand,
    one named colour per fill, `primary` for the single-hue swatch;
    `MONO_MARK_COLOR` names the theme-following ink. All marks and
    `VENDOR_META` / `PROVIDER_META` read from it. `google-g.tsx` moved into
    `icons/`. Adding a vendor is one entry, one mark, one meta row.
  - Why: brand colours are not design tokens and must not enter `@theme`
    (they would generate utilities and shift with a reskin), but they still
    need one owner so the lint allowlist is a file, not a folder.

### D. Enforcement gap

- [ ] **17. MEDIUM** `scripts/check-design-tokens.mjs` check 1
  - Before: `COLOR_RE` fires only on `*-[#…]` / `*-[rgb(…)]` arbitrary
    classes. It cannot see a bare `"#34d399"` string (item 1), an inline
    `rgba(` (item 2), `fill="#…"` on an SVG, or a raw palette class that has
    a semantic twin (`bg-white`, `bg-neutral-100`, `border-neutral-200`,
    `text-neutral-900`, `ring-neutral-*`).
  - After: check 5 `[raw-color]`: any hex, `rgb`, `hsl`, `oklch` literal in
    `src` outside `index.css`; allowlist only
    `src/components/icons/brand-colors.ts` and a `design-allow-raw-color`
    waiver comment within 5 lines above (same shape as `design-allow-raw-type`). Check 6
    `[raw-palette]`: the "Do NOT write" column of the design.md
    quick-reference as a regex over `src/pages`, `src/layouts`,
    `src/components`. Both documented under design.md "How it's enforced".
  - Why: the raw-type check went 40 to 0 in a day once it existed. Colour
    has the same drift pattern and no gate.

## Proposed tokens

Every token below is a role that exists in the UI today with no name.
Hues are unchanged from what ships; only the binding moves. Placement is
`:root` + `.dark` in `index.css`, each mapped in `@theme inline`.

- `--auth-glow` (item 2). White at 5%, one value, three gradients.
- `--overlay` (item 7). Scrim, themed.
- `--terminal`, `--terminal-chrome`, `--terminal-edge`,
  `--terminal-foreground`, `--terminal-foreground-muted` (item 8). Fixed
  dark, declared once.
- `--info`, `--info-foreground`, `--info-subtle`, `--info-muted` (item 10).
  Completes the four status families.
- `--promo-surface`, `--promo-surface-wash` (item 14). Finishes the promo
  family at the surface.
- `--tier-pro`, `--tier-pro-foreground`, `--tier-pro-wash` (item 15).
- `--tier-enterprise`, `--tier-enterprise-foreground`,
  `--tier-enterprise-wash`, `--tier-enterprise-border` (item 16).

Open calls for the user, in order:

1. Does `--tier-pro` reuse `--promo-cta` values or stand alone? Reuse means
   the Upgrade button and the Pro badge move together forever.
2. Promo dark border: 50% (token) or 30% (the five pages). One number.
3. Is Callout an info surface or a promo surface?
4. Light-mode link hover underline: stay at neutral-500 or move to
   `--muted-foreground` (600).

## Status

Applied 2026-09-18: items 1, 14, 15, 16, 18 (item 6 folded into 18).

- Tier tokens live in `index.css` (`--tier-pro*`, `--tier-enterprise*`, ten
  roles, both themes) and are documented in design.md §2 "Plan tier
  colours". Every Pro / Enterprise call site binds to them.
- Three shifts were accepted to land on one rung per role, each noted in a
  file comment: dark Pro border blue-400 at 30% -> blue-500 at 30% (Card's
  documented rung) on five banners, OptionTile and pro-upgrade-card;
  pro-upgrade-card light fill blue-25 -> blue-50; Billing hero dark ink
  blue-300 -> blue-400.
- Open from item 15: the setup step-indicator ink `text-blue-600
  dark:text-blue-400` (`onboarding-shared.tsx:23,210`,
  `SetupManual.tsx:172,447`) is left raw pending a call: same role as
  `--tier-pro` or its own token.

Applied 2026-09-18, second pass (LOW items plus item 2, which shares
AuthLayout with item 12): 2, 3, 4, 5, 10, 11, 12, 13.

- `--info` family (six tokens) completes the four status families;
  StatusDot, Badge `info` and Callout bind to it with no value change.
- `--auth-*` family (six tokens, `:root` only, fixed dark) owns every
  colour on the AuthLayout panel including the two glow gradients.
- `--color-syntax-terminal-blue` renamed `--color-syntax-literal`; code
  surfaces use plain `text-syntax-*` utilities.
- Shifts accepted: TextLink light hover underline neutral-500 -> neutral-600
  (`--muted-foreground`); Policies `redact` radio and card border ->
  `--primary` (light 700 / 600 -> 900, dark 400 -> 200).
- Follow-up noted by the agent: `AuthLayout.tsx:60,107` DotRadar runtime
  fills use `color-mix(... var(--color-neutral-800) ..., white ...)` in
  template literals; ramp-referencing, not hex, left alone.

Remaining open: 7, 8, 9, 17. Items 1, 14, 15, 16 are the ones worth doing first: 1 is a
live bug, the other three remove about 60 of the 130 raw blue and violet
uses and give the tier concept a name.
