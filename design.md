---
# DESIGN.md format — compatible with `npx @google/design.md lint`
# Stack: tailwind-shadcn (Tailwind v4 @theme + shadcn base-nova + Base UI primitives)
# Source: this repo (src/index.css + src/components/ui/*). Every value cites the
# source line. Confidence tags: `code-direct` = read from index.css or a
# primitive file in this repo (highest trust for this codebase since these
# files ARE the contract — no transpile loss). `decided` = locked policy from
# brand-guidelines.md or CLAUDE.md "Things to not change without asking".

version: alpha
name: "Constellation Gate AI"
description: "Operator dashboard for an AI gateway with audit anchoring — dense, technical, no-nonsense surface tuned for the human running it in production"

colors:
  # Semantic layer (`:root` in src/index.css:182–204). Page bg moved off white onto
  # `--color-neutral-100` on 2026-05-17 as part of the ink→neutral rename; `--input`
  # bumped from neutral-200 to neutral-300 on 2026-05-15 for a stronger form-control
  # stroke. Cards / popovers stay white via `--card` / `--popover`.
  primary: "oklch(0.090 0 0)"            # neutral-900
  primary-foreground: "#FFFFFF"
  primary-foreground-soft: "oklch(0.922 0 0)"  # neutral-200 — icon-only on-primary ink (dark: neutral-800)
  background: "oklch(0.960 0 0)"         # neutral-100 — page canvas (NOT white)
  foreground: "oklch(0.090 0 0)"         # neutral-900
  card: "#FFFFFF"
  card-foreground: "oklch(0.090 0 0)"
  popover: "#FFFFFF"
  popover-foreground: "oklch(0.090 0 0)"
  secondary: "oklch(0.960 0 0)"          # neutral-100
  secondary-foreground: "oklch(0.090 0 0)"
  muted: "oklch(0.960 0 0)"              # neutral-100
  muted-foreground: "oklch(0.530 0 0)"   # neutral-500
  accent: "oklch(0.960 0 0)"             # neutral-100
  accent-foreground: "oklch(0.090 0 0)"
  control-raised: "#FFFFFF"              # raised icon-only control chip on a muted surface (dark: neutral-700)
  chat-bubble-user: "oklch(0.970 0 0)"   # neutral-100 — Ask AI user bubble (dark: neutral-800)
  chat-bubble-user-foreground: "oklch(0.145 0 0)"  # neutral-950 (dark: neutral-100)
  chat-bubble-agent: "#FFFFFF"           # Ask AI agent bubble (dark: neutral-950)
  chat-bubble-agent-foreground: "oklch(0.205 0 0)" # neutral-900 (dark: neutral-200)
  destructive: "oklch(0.577 0.245 27.325)"  # danger-600
  border: "oklch(0.910 0 0)"             # neutral-200
  input: "oklch(0.820 0 0)"              # neutral-300 (bumped from neutral-200 on 2026-05-15)
  ring: "oklch(0.680 0 0)"               # neutral-400
  canvas-bg: "#ECECE7"                   # reserved warm-paper canvas (not currently bound to --background)

  neutral-50: "oklch(0.985 0 0)"
  neutral-100: "oklch(0.960 0 0)"
  neutral-200: "oklch(0.910 0 0)"
  neutral-300: "oklch(0.820 0 0)"
  neutral-400: "oklch(0.680 0 0)"
  neutral-500: "oklch(0.530 0 0)"
  neutral-600: "oklch(0.380 0 0)"
  neutral-700: "oklch(0.260 0 0)"
  neutral-800: "oklch(0.165 0 0)"
  neutral-900: "oklch(0.090 0 0)"
  neutral-950: "oklch(0.045 0 0)"

  blue-25: "oklch(0.985 0.010 268.85)"  # code-direct: src/index.css:46 — tint below blue-50, used for the Pro card gradient floor
  blue-50: "oklch(0.970 0.020 268.85)"
  blue-100: "oklch(0.940 0.040 268.85)"
  blue-200: "oklch(0.890 0.075 268.85)"
  blue-300: "oklch(0.810 0.130 268.85)"
  blue-400: "oklch(0.700 0.180 268.85)"
  blue-500: "oklch(0.580 0.215 268.85)"
  blue-600: "oklch(0.470 0.232 268.85)"
  blue-700: "oklch(0.345 0.224 268.85)"  # brand mark, ≈#1F2FCE
  blue-800: "oklch(0.275 0.175 268.85)"
  blue-900: "oklch(0.215 0.130 268.85)"
  blue-950: "oklch(0.145 0.085 268.85)"

  success-50: "oklch(0.982 0.018 155.826)"
  success-100: "oklch(0.962 0.044 156.743)"
  success-200: "oklch(0.925 0.084 155.995)"
  success-500: "oklch(0.723 0.219 149.579)"
  success-600: "oklch(0.627 0.194 149.214)"
  success-700: "oklch(0.527 0.154 150.069)"
  warning-50: "oklch(0.987 0.022 95.277)"
  warning-100: "oklch(0.962 0.059 95.617)"
  warning-200: "oklch(0.924 0.120 95.746)"
  warning-500: "oklch(0.769 0.188 70.080)"
  warning-600: "oklch(0.666 0.179 58.318)"
  warning-700: "oklch(0.555 0.163 48.998)"
  danger-50: "oklch(0.971 0.013 17.380)"
  danger-100: "oklch(0.936 0.032 17.717)"
  danger-200: "oklch(0.885 0.062 18.334)"
  danger-600: "oklch(0.577 0.245 27.325)"  # semantic --destructive
  danger-700: "oklch(0.505 0.213 27.518)"

  white: "#FFFFFF"
  canvas: "#ECECE7"  # warm-paper canvas

  chart-1: "oklch(0.62 0.18 255)"  # blue
  chart-2: "oklch(0.72 0.17 50)"  # orange
  chart-3: "oklch(0.72 0.20 145)"  # green
  chart-4: "oklch(0.70 0.18 290)"  # purple
  chart-5: "oklch(0.65 0.20 18)"  # coral
  chart-6: "oklch(0.75 0.13 195)"  # teal
  chart-7: "oklch(0.85 0.16 88)"  # amber
  chart-8: "oklch(0.68 0.20 335)"  # magenta
  # Dark mode re-tunes chart-1..8 in place (`.dark`, src/index.css): same
  # hue/chroma, lightness lowered 0.05 (5 points darker) against --canvas-bg.
  # Light-mode values above are unchanged.

  syntax-keyword: "#B6491A"  # curl flags / orange-red
  syntax-variable: "#D69E2E"  # $KEY interpolations
  syntax-property: "#4165FF"  # JSON keys

  traffic-red: "#FF5F57"
  traffic-amber: "#FEBC2E"
  traffic-green: "#28C840"

typography:
  # Tailwind named scale only. Three sizes overridden in @theme to Geist's even-numbered
  # heading scale (text-3xl: 32px, text-4xl: 40px, text-6xl: 56px — index.css:147–152).
  # text-6xl override tuned 2026-05-21 from 64px → 56px (line-height: 1) for the auth-page
  # hero; sole consumer is AuthLayout's h1. Bump back to 64px if other hero surfaces land.
  # Floor is text-xs (12px) — sub-12px sizes are out of scale by policy. Arbitrary
  # text-[Npx] is banned. font-medium minimum on sans labels — font-normal reads as
  # ambient body, not structure.
  #
  # Tracking tokens (index.css:164): `tracking-snug` (-0.01em) — single source for body /
  # title sub-pixel tightening; retires ~30 sites of arbitrary `-tracking-[0.14px]` /
  # `-tracking-[0.2px]` / `-tracking-[0.25px]` values that were all targeting roughly the
  # same optical correction. Tailwind's built-in `tracking-tight` (-0.025em) is too
  # aggressive for body / title use; `tracking-snug` slots between `normal` and `tight`.
  # Headings using `-tracking-[1px]` (cross-file artboard h2 pattern) stay arbitrary —
  # different optical tier.

  hero-numeric-lg:  # text-3xl/9 + sans tabular
    fontFamily: "Geist"
    fontSize: 32  # overridden text-3xl
    lineHeight: 36
    fontWeight: 500
    fontFeature: "tnum"

  hero-numeric-default:  # text-2xl/8 + sans tabular
    fontFamily: "Geist"
    fontSize: 24
    lineHeight: 32
    fontWeight: 500
    fontFeature: "tnum"

  h1:
    fontFamily: "Geist"
    fontSize: 32
    lineHeight: 40
    fontWeight: 500

  h2:
    fontFamily: "Geist"
    fontSize: 24
    lineHeight: 32
    fontWeight: 500

  h3:
    fontFamily: "Geist"
    fontSize: 20
    lineHeight: 28
    fontWeight: 500

  h4:
    fontFamily: "Geist"
    fontSize: 18
    lineHeight: 28
    fontWeight: 500

  body:
    fontFamily: "Geist"
    fontSize: 16
    lineHeight: 24
    fontWeight: 400

  body-sm:
    fontFamily: "Geist"
    fontSize: 14
    lineHeight: 20
    fontWeight: 400

  body-xs:
    fontFamily: "Geist"
    fontSize: 12
    lineHeight: 16
    fontWeight: 400

  label:  # text-sm font-medium
    fontFamily: "Geist"
    fontSize: 14
    lineHeight: 16
    fontWeight: 500

  eyebrow-sm:
    fontFamily: "Geist Mono"
    fontSize: 12
    lineHeight: 16
    fontWeight: 500
    letterSpacing: "0.1em"
    fontVariation: "uppercase"

  eyebrow-default:
    fontFamily: "Geist Mono"
    fontSize: 14
    lineHeight: 20
    fontWeight: 500
    letterSpacing: "0.1em"
    fontVariation: "uppercase"

  badge:  # base CVA
    fontFamily: "Geist Mono"
    fontSize: 12
    lineHeight: 16
    fontWeight: 500
    fontFeature: "tnum"

  data:  # mono tabular
    fontFamily: "Geist Mono"
    fontSize: 14
    lineHeight: 20
    fontWeight: 400
    fontFeature: "tnum"

rounded:
  # Driven by --radius (0.625rem = 10px) in @theme inline (index.css:228, 295–308).
  # Three-tier material ladder (codified 2026-05-10, revised from prior two-tier):
  #   Sub-element            rounded-xs (4px)  — Tabs trigger, Segmented item, SelectItem, Badge
  #   Button / chrome / menu rounded-sm (6px)  — Button, Input, Select trigger, Menu popup, Toast
  #   Card / surface         rounded-md (8px)  — Card, KpiRail, table containers (NEW tier)
  #   Modal / dialog         rounded-xl (16px) — Dialog, AlertDialog (LOCKED — overrides
  #                                              the derived `--radius * 1.6` value to
  #                                              preserve a 2× tier ratio against cards)
  # Concentric rule: item radius < container radius. Tabs trigger (4px) sits inside Tabs
  # list (6px). Card (8px) sits on canvas with shadow-as-border. Modal (16px) wraps
  # cards (8px) → ratio = 2.
  #
  # Modal-interior rule (codified 2026-05-12): every bordered surface inside a
  # Dialog / AlertDialog / Drawer / Sheet — cards, lists (DetailList), code wells
  # (CodeCard / BodySection), row tiles (SecurityCheckRow), KPI rails — must use
  # rounded-md (8px). Primitives whose page-level default is smaller (DetailList
  # ships rounded-xs, SecurityCheckRow-style audit rows ship rounded-xs) get a
  # `className="rounded-md"` override at the modal usage site. The primitive's
  # default stays smaller so it still reads correctly in tighter inline contexts
  # (toolbars, table cells, badges). Mixing radii inside one modal — e.g. an
  # 8px BodySection next to a 4px DetailList — is a design bug; one radius
  # vocabulary per modal composition.
  xs: "4px"  # sub-elements (tabs item, segmented, SelectItem, badge)
  sm: "6px"  # buttons / chrome / popovers (Button, Input, Select trigger, Menu popup, Toast)
  md: "8px"  # cards / everyday surfaces (Card, KpiRail, table containers) — NEW tier (2026-05-10)
  lg: "10px"  # base --radius
  xl: "16px"  # modal LOCKED (Dialog, AlertDialog) — overridden in @theme inline (index.css:305)
  2xl: "18px"  # calc(--radius * 1.8)
  full: "9999px"

spacing:
  # Three-tier rule (locked 2026-05-09). Surface tier = 8px-grid only;
  # compound tier = any 4-multiple; primitive-internal padding overrides.
  # Half-step Tailwind classes (gap-0.5/1.5/2.5/3.5) and arbitrary values
  # (gap-[18px]) are banned at every tier. (decided)
  #
  # Surface tier — page padding, section gaps, card padding, between-card gaps,
  # empty-state heights — values are n × 8 only:
  "2":  "8px"   # surface OK
  "4":  "16px"  # surface OK — dominant step (Card padding, page gutter, section gap)
  "6":  "24px"  # surface OK — outer page margins from `sm`+ (16px below via `px-4`)
  "8":  "32px"  # surface OK — between-section gap
  "10": "40px"  # surface OK
  "12": "48px"  # surface OK — page-bottom rhythm
  "16": "64px"  # surface OK — hero strip
  "20": "80px"  # surface OK — rare
  "24": "96px"  # surface OK — rare
  # Compound tier — within a primitive's row/group, between icon + label,
  # badge + text, label + control — any n × 4 is legal:
  "1":  "4px"   # compound only — micro gap (icon adjacency)
  "3":  "12px"  # compound only — button px-3 (all sizes), Input px-3, Select pl-3, table inner cells
  "5":  "20px"  # compound only — chart legend gap
  "7":  "28px"  # banned — odd 4-multiple, surface or compound (no use case)
  "9":  "36px"  # banned — odd 4-multiple, surface or compound (no use case)

components:
  button-default:  # primary action, neutral-900 fill
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body-sm}"   # text-sm font-medium
    rounded: "{rounded.sm}"
    height: 36                           # h-9 (default)
    padding: "0 12"                      # px-3 — px-2.5 (10px) BOTH sides with an icon (symmetric)
    # Size ramp (realigned 2026-07-28, shadcn-aligned): 24 / 32 / 36 for
    # xs (h-6) / sm (h-8) / default (h-9), all px-3 (12px L/R).
    # Icon variants mirror: icon-xs size-6 / icon-sm size-8 / icon size-9.
    # There is no `lg` and no `icon-lg` — `default` IS the largest size, and
    # it IS shadcn's `h-9`. Before the realign this ramp sat one step below
    # shadcn's (`default` was 32px) so every call site reached for `lg` to get
    # an ordinary button; the rename was pixel-identical. All <Button> now
    # carry an EXPLICIT size prop (no implicit default) so sizes can go
    # responsive per breakpoint.
  button-outline:    { backgroundColor: "{colors.card}", textColor: "{colors.foreground}", rounded: "{rounded.sm}", elevation: "shadow-xs" }  # border-border + shadow-xs (2026-06-04) — subtle lift, same recipe as Card
  button-secondary:  { backgroundColor: "{colors.secondary}", textColor: "{colors.secondary-foreground}" }
  button-ghost:      { backgroundColor: "transparent", textColor: "{colors.foreground}" }
  button-destructive:{ backgroundColor: "{colors.destructive}", textColor: "{colors.primary-foreground}" }

  input:
    backgroundColor: "{colors.neutral-50}"
    textColor: "{colors.neutral-800}"
    rounded: "{rounded.sm}"
    height: 32
    padding: "0 12"  # px-3 (all sizes); focus = border-ring + ring-3/50; disabled = bg-neutral-100 text-neutral-500

  textarea:    { backgroundColor: "{colors.neutral-50}", textColor: "{colors.neutral-800}", rounded: "{rounded.sm}", padding: "12 16" }
  input-group: { backgroundColor: "{colors.neutral-50}", textColor: "{colors.neutral-800}", rounded: "{rounded.sm}", height: 36 }

  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.md}"  # 8px — card tier (was rounded.sm 6px; promoted 2026-05-10)
    padding: 16
    elevation: "border + shadow-xs"  # Migrated 2026-05-15 from `shadow-(--shadow-border)` to `border border-border shadow-xs` — the explicit 1px border carries the edge, shadow-xs adds subtle lift. `--shadow-border` token still exists (index.css:117) but is no longer the Card default. CardFooter: white, no border, no wash (mirrors DialogFooter).

  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.badge}"
    rounded: "{rounded.xs}"
    height: 20
    padding: "0 6"  # pl-2.5 pr-1.5
  badge-secondary:   { backgroundColor: "{colors.secondary}", textColor: "{colors.secondary-foreground}" }
  badge-destructive: { backgroundColor: "{colors.danger-100}", textColor: "{colors.danger-700}" }
  badge-outline:     { textColor: "{colors.foreground}" }
  badge-success:     { backgroundColor: "{colors.success-100}", textColor: "{colors.success-700}" }
  badge-warning:     { backgroundColor: "{colors.warning-100}", textColor: "{colors.warning-700}" }
  badge-info:        { backgroundColor: "{colors.blue-100}", textColor: "{colors.blue-700}" }

  select-trigger:
    backgroundColor: "{colors.neutral-50}"
    textColor: "{colors.neutral-800}"
    rounded: "{rounded.sm}"
    height: 32
    padding: "0 8 0 12"  # pl-3 pr-2 all sizes (asymmetric for chevron: 12px text side / 8px chevron side)

  stepper:  # vertical numbered step rail — Stepper / StepperItem / StepperIndicator / StepperBody / StepperTitle / StepperPanel
    backgroundColor: "{colors.muted}"       # upcoming indicator; active + complete = {colors.primary}
    textColor: "{colors.muted-foreground}"  # upcoming + complete title; active title = {colors.foreground}
    typography: "{typography.badge}"        # indicator numeral (mono 12 tabular); titles = {typography.label}
    rounded: "{rounded.full}"               # indicator circle
    height: 24                              # size-6 indicator; 1px {colors.border} connector rail at its centre line
    padding: 0                              # no chrome — rhythm is gap-3 indicator→body, pb-6 between steps, gap-4 title→panel

  tabs-list: { backgroundColor: "{colors.muted}", rounded: "{rounded.sm}", height: 32, padding: 4 }  # active trigger: bg-background rounded-xs
  segmented: { backgroundColor: "{colors.muted}", rounded: "{rounded.sm}", height: 32 }              # active item: bg-background rounded-xs

  dialog:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.xl}"  # 16px LOCKED (was 12px; promoted 2026-05-10 to preserve 2× ratio vs cards)
    padding: 16
    elevation: "shadow-modal"  # overlay: bg-neutral-900/40 + backdrop-blur-xs
  sheet: { backgroundColor: "{colors.background}", rounded: "{rounded.none}", elevation: "shadow-modal" }  # right-docked drawer
  menu:  # shadcn-style wrapper over Base UI Menu — Menu / MenuTrigger / MenuContent / MenuItem / MenuLabel / MenuSeparator
    backgroundColor: "{colors.popover}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.sm}"  # 6px — chrome/menu tier
    padding: 4
    elevation: "shadow-popup"  # item: rounded-xs h-8 px-2, destructive variant for Sign-out

  table-header:    { backgroundColor: "{colors.neutral-50}", textColor: "{colors.neutral-600}", typography: "{typography.body-sm}" }  # row hover: bg-neutral-50
  pagination-link: { textColor: "{colors.neutral-600}", typography: "{typography.data}" }  # rendered as <button>, not <a>

  hero-numeric:      { textColor: "{colors.neutral-900}", typography: "{typography.hero-numeric-default}" }  # also: hero-numeric-lg variant
  kpi-rail:          { backgroundColor: "{colors.white}", rounded: "{rounded.md}", elevation: "border + shadow-xs" }  # `border border-border shadow-xs` — same chrome migration as Card on 2026-05-15. Divider hairlines via `before:inset-y-4` pseudo on each child after the first.
  text-link:         { textColor: "{colors.neutral-800}", rounded: "{rounded.xs}" }  # renders <button> by default; ink + permanent faint underline
  icon-action-button:{ textColor: "{colors.neutral-500}", rounded: "{rounded.xs}" }  # size-6 (24px) icon-only; after:-inset-2 expands hit target to 40×40
  tabs-count:        { backgroundColor: "{colors.neutral-100}", textColor: "{colors.neutral-500}", rounded: "{rounded.xs}", height: 20 }  # mono count chip inside TabsTrigger
  tool-result-code:  { textColor: "{colors.neutral-900}" }  # type-copy-14 break-words — <code> element; SANS since 2026-07-30 (was font-mono break-all)
  tool-call-card:  # nested "CALL <Tool>" card inside an assistant bubble (Conversations trace)
    backgroundColor: "{colors.card}"      # inverts vs. its muted parent bubble: white in light, neutral-900 in dark
    textColor: "{colors.neutral-900}"     # tool name; args at {colors.muted-foreground}
    typography: "{typography.data}"       # type-mono-14 — name AND args (eyebrow keeps eyebrow-sm)
    rounded: "{rounded.xs}"               # 4px — one tier below the 8px bubble (concentric)
    padding: 12                           # p-3, inside the bubble's p-4
    elevation: "border"                   # flat — inset panel, not a lifted card (no shadow)
  settings-row:      { textColor: "{colors.neutral-900}" }  # title/subtitle/control row; rhythm via border-t border-neutral-200 between rows
  toast:             { backgroundColor: "{colors.background}", textColor: "{colors.neutral-900}", rounded: 8, elevation: "shadow-popup" }
  status-dot:   { rounded: "{rounded.full}" }  # tones: success-600, warning-600, destructive, blue-600, neutral-500
  tag:          { backgroundColor: "{colors.neutral-100}", textColor: "{colors.neutral-900}", rounded: "{rounded.full}", height: 24, typography: "{typography.body-xs}" }

  switch:   { backgroundColor: "{colors.primary}" }  # checked = primary, unchecked = input (neutral-200); thumb rounded-full
  checkbox: { backgroundColor: "{colors.primary}", textColor: "{colors.primary-foreground}", rounded: "{rounded.xs}" }  # checked state
  radio:    { backgroundColor: "{colors.primary}", rounded: "{rounded.full}" }  # checked state

  delta-tag:    { textColor: "{colors.success-700}" }  # default: positive=success-700, negative=destructive; inverted flips (rate metrics only)
  vendor-avatar:{ rounded: "{rounded.none}" }  # bare icon, no chip wrapper
  brand-mark:   { textColor: "{colors.blue-700}" }  # logomark.svg fill #1F2FCE
---

# Design System — Constellation Gate AI

> **Format:** [DESIGN.md](https://github.com/google-labs-code/design.md) (Google) — YAML front matter + prose rationale.
> Validate with `npx @google/design.md lint design.md`. Export with `npx @google/design.md export --format dtcg` (preserves `components.*` references) or `--format tailwind` (Tailwind-v3-shape JSON; primitives only).
> **Authoring discipline:** every value cites a source. Confidence tags as YAML comments and prose citations. **This document supersedes `docs/brand-guidelines.md`** — when the two disagree, this file wins.

**Source:** this repository (`src/index.css` + `src/components/ui/*` + locked policy from CLAUDE.md and brand-guidelines.md v0.2)
**Stack:** tailwind-shadcn (Tailwind v4 `@theme` + shadcn `base-nova` registry + Base UI primitives via `@base-ui/react`)
**Extraction mode:** code-direct (read from the source files in this repo — these files ARE the contract; no transpile loss)
**Confidence summary:** 14 sections strong, 0 partial, 1 TBD (wordmark + lockups not finalized). **61 primitives** live in `src/components/ui/*.tsx` (count taken 2026-05-20). Last surgical refactor pass: 2026-05-17 (Overview redesign — 4-tile KPI rail with `<KpiTile>`, three preview tables, workspace switcher migrated to the top bar, `<FilterToolbar>` / `<Monogram>` / `<SearchInput>` extracted). Preceded by 2026-05-15 (border-token migration: Card / KpiRail / Tabs line variant moved from `shadow-(--shadow-border)` → `border border-border shadow-xs`; `--input` bumped to neutral-300) and the 2026-05-11 modal-chrome + typography-primitive passes.
**Captured states:** light mode @ 1440×900 default; modal (Dialog), drawer (Sheet), toast, segmented selectors, tabs (default + line + count chips), pagination, table sortable + drill-in, dropdown menu (Menu / UserMenu / workspace switcher), list ↔ detail swap with entrance animation (Models), in-modal action slide (Security Mark-PIJ panel)
**Not yet captured (TBD):** wordmark + horizontal/stacked lockups (logomark only, finalized). Mobile / touch state shipped 2026-07-16..17 (Thread B) — see §Responsive Behavior.

---

## 0. Direction *(our extension)*

**Who:** human operator running an AI gateway in production. **Verb:** inspect — read-heavy; filter, sort, drill in, copy. **Feel:** Vercel Geist meets operator tooling — flat, dense, mono numerics, neutral-900 primary, neutral-100 page canvas under white cards with a 1px `border-border` edge + subtle `shadow-xs` lift.

### Defaults being rejected

1. **Blue primary action** → neutral-900 primary. Blue reserved for info/completed/active-tab/focus only. **One blessed exception: Pro-upsell CTAs use brand blue** (`bg-blue-700 text-white shadow-blue-700/30`, `dark:bg-blue-600`) to read as the paid-tier accent — the "Upgrade to Pro" / "Compare plans" buttons on `pro-upgrade-card`, `Policies`, `TokenSavings`, and the featured plan in `plan-comparison-dialog`. This is deliberate Pro-brand signaling, not a general primary; every other primary action stays neutral-900 ink.
2. **Blue underlined links** → ink + permanent faint underline (`decoration-neutral-200` → `decoration-neutral-500` on hover/focus). Blue is overloaded with 4 other meanings.
3. **24px gutters (Bootstrap/Material default)** → 12-column grid with **16px gutters**. Denser, more on-genre for an operator tool.
4. **Brand colors as chart series colors** → 8-slot OKLCH categorical palette picked by series index. Per-series `slot?: number` override only for brand-mnemonic exceptions (Anthropic→orange, OpenAI→blue).
5. **Heavy 1px+ card borders / shadcn default `border` + drop-shadow** → tight `border border-border` (neutral-200) + `shadow-xs`. The 2026-05-15 migration replaced the prior `shadow-(--shadow-border)` ring-as-border recipe with an explicit border so the edge reads at any zoom and against any backdrop. `--shadow-border` token is still in `index.css:117` but no longer the Card default.
6. **All numerics mono** → five-voice taxonomy. Hero summary numerics ≥24px sans tabular via `<HeroNumeric>`; data numerics <20px stay mono.
7. **WCAG 2.5.5 AAA 44×44 touch targets** → 32px (`h-8` / `size="sm"`) for Select / Input / SegmentedPill / IconActionButton chrome on dense filter rows. This is an operator dashboard on desktop (`Who: human operator running an AI gateway in production`), not a touch surface. WCAG 2.5.8 Level AA (24×24 minimum) is the target we hold — every chrome control clears it. If we ever ship a mobile / tablet surface, raise to AAA or wrap critical actions in `IconActionButton`'s `after:-inset-2` hit-target expansion. Until then, dense controls are correct and AAA touch findings should be marked "register carve-out" not "fix."

---

## 1. Overview *(Google canonical §1)*

Operator dashboard for an AI gateway. Read-heavy interaction (filter, sort, drill in, copy). Information density is high: three-tier table ink (500/800/900), right-aligned mono-tabular numerics, KPI rails (4-tile on Overview) with sparklines + delta tags, modals as drill-ins (not splash dialogs). Neutral-100 page canvas under white cards bordered at `border-border` + `shadow-xs`.

**Key characteristics:** 5 OKLCH ramps × 11 steps · three-tier material ladder (4/6/8/16px) · five-voice typography · light + dark themes (`.dark` class on `<html>`, follows OS until toggled) · neutral-900 primary, not blue · `border + shadow-xs` cards (not shadow-as-border, not heavy drop-shadows) · workspace switcher in the top bar, not the sidebar.

---

## 2. Colors *(Google canonical §2)*

Two layers: **palette atoms** (5 OKLCH ramps × 11 steps + atomic surfaces + 8-slot chart palette) in `@theme {}`, and **semantic layer** (shadcn vocab: `--background`, `--primary`, etc.) in `:root {}`. Semantic tokens always resolve to a palette atom via `var(--color-*)`. **No raw hex/oklch/rgba outside `@theme`.**

**Neutral ramp = Tailwind v4 default neutral (chroma 0).** As of 2026-05-17 the custom `ink-*` ramp was renamed to `neutral-*` and the `@theme` block no longer declares `--color-neutral-*` — Tailwind's built-in values resolve through the semantic aliases. Do not re-add the declarations (it would override defaults). Use `text-neutral-500`, `bg-neutral-100`, `border-neutral-200` at callsites; do not reach for `ink-*` (that token name no longer exists).

**Page canvas vs surface separation.** `--background` resolves to `var(--color-neutral-50)` (the page canvas — the near-white wash the dashboard content area sits on); `--card` and `--popover` resolve to `var(--color-white)`. Cards visibly lift off the canvas via shadow elevation, not via a tinted card bg. `bg-background` is consumed ONLY by the dashboard content canvas — card/table wash panels use `bg-card-muted` and muted chips/fills use `bg-muted`, so `bg-background` never darkens a component. **Surfaces that should remain white** (Button outline, Switch thumb, Tabs indicator, Field separator backdrop, DateRangePicker trigger chrome) bind to `bg-card`, NOT `bg-background`.

### Primary & brand accent

- **Ink** `oklch(0.090 0 0)` ← `{colors.neutral-900}` — primary action, foreground, headlines. **Not blue.**
- **Blue** `oklch(0.345 0.224 268.85)` ≈ `#1F2FCE` ← `{colors.blue-700}` — brand accent (anchored to `public/logomark.svg`). Info / completed / active-tab / focus only. Never primary CTA. Never inline links.

### Step roles (apply across all 5 ramps)

The step encodes **intent, not lightness** — the same number plays the same UI
role in every ramp (`neutral`, `success`, `warning`, `danger`, `blue`). One role
per step:

| Step | Role |
| --- | --- |
| 50 | Field/well wash — Input, Textarea, Select trigger, table-header surface (neutral-50; see `bg-neutral-50` gap below) |
| 100 | Default subtle background + hover-bg; secondary/muted/accent fills (`--secondary`, `--muted`, `--accent` resolve to neutral-100) |
| 200 | Borders, dividers (`--border`, `--input` resolve to neutral-200) |
| 300 | Strong borders, ghost-button hover-bg, dashed gridlines |
| 400 | Placeholder text, missing-data dashes, breadcrumb separators (`--ring` resolves to neutral-400) |
| 500 | Secondary text, eyebrow, chart strokes (`--muted-foreground` resolves to neutral-500) |
| 600 | Saturated mid — default solid surfaces (`--destructive` resolves to danger-600) |
| 700 | Saturated text on tinted bg, brand-mark anchor (blue-700 = logomark) |
| 800 | Body text default (neutral-800) |
| 900 | Primary text, headlines (`--primary`, `--foreground` resolve to neutral-900) |
| 950 | Page + sidebar canvas in the dark theme (`--background` / `--sidebar`); extreme-contrast anchor |

**Note:** `--neutral-700` is intentionally avoided as a table body-cell tone — middle-tier neutrals collide with the three-tier table policy (see §7 Tables).

### Status semantics

`success-100` bg + `success-700` text (success-600 for solid mid). `warning-100` bg + `warning-700` text (warning-600 for slow-row icons). `danger-100` bg + `danger-700` text; `--destructive` resolves to `danger-600`. `info` aliases to the blue ramp — no separate `info-*` ramp.

### Destructive alpha ladder *(added 2026-08-05)*

The destructive family is the one place a *strength* of the same token is wanted at more than one intensity — a structural edge, an accent, and a full-strength action all reach for `--destructive` at three different volumes. Those volumes are **named rungs, and they are a closed set exactly like colors and type sizes.** ← code-direct: `src/index.css` `:root` / `.dark` / `@theme inline`

| Rung | Token | Utilities | Use for |
| --- | --- | --- | --- |
| **30%** | `--destructive-subtle` | `border-destructive-subtle`, `bg-destructive-subtle`, `text-destructive-subtle` | Softened **structural** edges — the `<Card tone="danger">` border (§7). Reads as danger without out-shouting the destructive control it frames. |
| **50%** | `--destructive-muted` | `border-destructive-muted`, `bg-destructive-muted`, `text-destructive-muted` | Mid-strength accents — a danger edge or fill that should carry more weight than a structural hairline but still sit under a real action. |
| **100%** | `--destructive` | `border-destructive`, `bg-destructive`, `text-destructive` | Full-strength destructive actions, ink, and icons. |

**100% is `--destructive` itself, not a fourth token.** The ladder is the base plus two derived rungs; there is no `--destructive-full`.

**Both rungs are derived, not resolved:** `color-mix(in oklab, var(--destructive) N%, transparent)`. They therefore track the token through the `danger-600` (light) → `danger-400` (dark) flip on their own, with no per-theme literal to keep in sync — the same idiom as `--accent-muted`. They are re-declared in `.dark` for the same two reasons that token is: the pair reads together, and a scoped `.dark` container that is not the root element resolves the rungs against the dark `--destructive` rather than the light one.

**These three are the ONLY sanctioned destructive strengths.** A bare `border-destructive/30` or `bg-destructive/70` at a call site is off-token in exactly the way an invented hex is — use the named rung, or add a rung here first. The `destructive/N` modifiers already baked into `Button`’s own variant recipe (`bg-destructive/10`, `ring-destructive/20`) are that primitive’s internal contract and stay as they are; new work uses the ladder.

### Chart palette (categorical, 8-slot)

**Brand-decoupled.** Series pick a slot **by index, not by entity**. Per PM call (2026-05-06): "we need a palette of colors for all graphs throughout the app and they should be used regardless of the content."

All eight slots sit at L 0.62–0.85, C 0.13–0.20 (uniformly bright, mid-saturation). Adjacent slots in palette order are ≥85° apart in hue. **No neutral as a categorical slot** — gray is reserved for "Other/Unknown" semantic states. Per-series `slot?: number` override on `VendorMeta` lets specific charts pin colors when there's a brand mnemonic worth honoring (Anthropic→orange slot 2, OpenAI→blue slot 1) — opt-in only.

Slots: `chart-1` blue · `chart-2` orange · `chart-3` green · `chart-4` purple · `chart-5` coral · `chart-6` teal · `chart-7` amber · `chart-8` magenta. ← code-direct: `src/index.css:205–212`

KPI rail sparklines also consume chart palette tokens (`--color-chart-1` blue, `--color-chart-3` green, `--color-chart-7` amber, `--color-neutral-500` neutral) — **NOT** semantic ramps. Mixing systems makes rails read inconsistently.

### Vendor brand colors

Used only by `<VendorAvatar />` (bare icon at `size-4`, no chip wrapper). Anthropic `#D97757` · OpenAI `#10A37F` · Meta `#0064E0` · DeepSeek `#4D6BFE` · xAI `#3D3D3D` · Google/Mistral/Cohere multi-color SVG fills (wrapper `style.color` ignored). Source: `src/components/icons/vendor-meta.tsx`.

### Semantic token quick-reference

**Hard rule: every Tailwind utility that targets a surface, border, ring, or foreground tone must bind to a semantic token — never a raw palette atom.** The `:root {}` semantic layer is the single reskin surface; components that bypass it (e.g. `border-neutral-200`, `bg-neutral-100`) couple themselves directly to the palette and break any future theme swap.

| Use this class | Resolves to (light — dark values in the Dark mode subsection) | Do NOT write |
| --- | --- | --- |
| `bg-background` | white | `bg-white` on page / dialog surfaces |
| `bg-card` | white | `bg-white` on Card / KpiRail / table containers |
| `bg-popover` | white | `bg-white` on dropdown / Select / Tooltip surfaces |
| `bg-muted` | neutral-100 | `bg-neutral-100` on secondary / count-chip / tag surfaces |
| `bg-secondary` | neutral-100 | `bg-neutral-100` on interactive secondary fills |
| `bg-accent` | neutral-100 | `bg-neutral-100` on selected/active fills |
| `bg-accent-muted` | accent at 50% | `bg-accent/50` — the half-strength accent is a token, not a modifier |
| `border-border` | neutral-200 | `border-neutral-200` for dividers, table separators, list containers, form control edges |
| `ring-ring` | neutral-400 | `ring-neutral-N` for focus rings |
| `text-foreground` | neutral-900 | `text-neutral-900` for primary text, headlines, row identifiers |
| `text-muted-foreground` | neutral-600 | `text-neutral-500` for secondary text, eyebrows, icon-action tints |

**Wash surfaces — `--card-muted` token (2026-07-09).** The neutral-50 wash that card-like panels and table header/footer rows sit on is the `--card-muted` token (neutral-50 light / neutral-800 dark) — an extension of `--card`, applied via `bg-card-muted`. It is deliberately separate from `--muted` (neutral-100 / neutral-800): chips, badges, count pills, avatar/icon placeholders, and the segmented-track container keep `bg-muted` at neutral-100, so lightening the panel washes never touches them. Consumers of `bg-card-muted`: shared `TableHeader`/`TableFooter`, and the bordered info-panels on Billing / BillingFree / Policies / onboarding. Form-field fills (Input, Textarea, Select trigger, InputGroup) stay on `bg-muted` for now. No raw `bg-neutral-50` in component code — the wash is a token.

**Highlight vs selected — `--accent-muted` token (2026-07-29).** In any list where a row can be *selected*, hover and selected were the same fill (`bg-accent`) and read as equally solid — you could not tell the row you were pointing at from the row you were on. The two states now split: **`--accent` is the SELECTED fill, `--accent-muted` is the HIGHLIGHT fill (hover + focus-visible), and it is the same accent at half strength.** Named for its strength rather than its state, matching `--card-muted`, because focus-visible uses it too — it is not exclusively a hover color.

Defined once, in both themes, as `color-mix(in oklab, var(--accent) 50%, transparent)` — derived, not resolved, for two reasons. It tracks `--accent` automatically if that ever moves; and being translucent it lands half-way toward the accent from *whatever surface it sits on*, which is what keeps it at the same relative strength on `--card` (Menu popup), `--popover` (Select popup), and `--sidebar` (nav rail) — three values that diverge in dark. An opaque token cannot do this: the midpoint between dark's `--accent` (neutral-700) and `--card` (neutral-900) is neutral-800, which *is* the `--popover` surface, so it would vanish inside every Select. Consumers: `MenuItem`, `SelectItem`, `MultiSelect` rows, sidebar nav items (both the collapsed icon rail and the expanded list). In light the highlight resolves to ≈ neutral-50 — deliberately quiet, one existing surface step off white, and always weaker than the selected row, which is the point. Never write `bg-accent/50` at a call site.

**Promo chrome — the `--promo-*` family (2026-08-04).** The one place blue is a *surface language* rather than an accent: the sidenav upgrade card (§7), the Free-plan banner on Policies / Token Savings, and the solid-blue "Upgrade to Pro" key those surfaces carry. Nothing in the semantic layer could carry it — `--border`, `--foreground` and `--muted-foreground` are deliberately neutral (see "Ink … Not blue" above), and reaching for a raw `blue-200` / `blue-700` at the call site is a ramp step standing in for a semantic role, which is theme-independent and therefore wrong the moment the card paints on dark. Eleven roles in two groups — the card chrome, and the CTA — defined once in both themes:

| Token | Light | Dark | Consumed as |
| --- | --- | --- | --- |
| `--promo-border` | blue-200 | blue-400 @ 50% | `border-promo-border` |
| `--promo-foreground` | blue-900 | blue-100 | *(no consumer — see below)* |
| `--promo-accent` | blue-500 | blue-400 | `text-promo-accent` (the sparkle) |
| `--promo-dot` | blue-700 | blue-200 @ 25% | `.sidebar-upgrade-texture` |
| `--promo-wash` | `blue-25 → blue-100` @ 75%, downward | `blue-500 @ 8% → 12%`, upward, held from 50% | `.sidebar-upgrade-texture` |
| `--promo-shadow` | blue-600 @ 12% | blue-600 @ 40% | `shadow-sm shadow-(color:--promo-shadow)` |
| `--promo-cta` | blue-700 | blue-600 | `bg-promo-cta` — Button `variant="promo"` |
| `--promo-cta-hover` | blue-800 | blue-700 | `hover:bg-promo-cta-hover` |
| `--promo-cta-border` | blue-600 | blue-500 | `border-promo-cta-border` |
| `--promo-cta-foreground` | white | white | `text-promo-cta-foreground` |
| `--promo-cta-shadow` | blue-700 @ 30% | blue-700 @ 30% | `shadow-sm shadow-(color:--promo-cta-shadow)` |

Notes worth keeping. **The surface is not in the family** — Figma's dark fill `#171717` *is* neutral-900 and its light fill is white, so `bg-card` already lands both and adding a `--promo-surface` would have been a duplicate. **`--promo-wash` holds the whole gradient, not its stops**, because the themes run it in opposite directions (light falls, dark rises); two direction-specific stop pairs plus a shared direction would have been three tokens saying one thing. **`--promo-shadow` is ink only** — the geometry stays Tailwind's `shadow-sm`, verbatim, per §5.0. Recolouring a stock step is a first-class Tailwind utility, not a bespoke shadow family, and this is the boundary: per-theme alpha is allowed on a *component's* shadow ink, never on the scale.

Three more, on the CTA group (added 2026-08-04 with Button `variant="promo"`). **The border is one ramp step lighter than its own fill, in each theme** — blue-600 over a blue-700 fill in light, blue-500 over blue-600 in dark. It is a fix before it is a detail: `Button`'s base is `border border-transparent bg-clip-padding`, so the transparent border still reserves 1px while the fill stops at the padding box, and on a filled variant with no border colour that ring paints *whatever is behind the button* — which read as a white outline once the Policies banner picked up its tint. Setting the colour closes the hole where it belongs, at the variant; dropping `bg-clip-padding` from the base would have changed every bordered button on the site. **`--promo-cta-shadow` is a separate token from `--promo-shadow`, not a reuse** — the card ink is blue-600 at 12% under a pale panel, the CTA ink is blue-700 at 30% under a solid blue key, and pointing the button at the card token would have quietly cut its lift to a third in light. **`--promo-cta-foreground` and `--promo-cta-shadow` hold across themes**, so they are declared once in `:root` and `.dark` does not restate them.

**`--promo-foreground` has no consumer as of 2026-08-04.** The promo copy moved to the neutral text tokens — titles on `--foreground`, sub-copy on `--muted-foreground` — on both the sidenav card and the Policies banner, which was the token's only reader. It is left defined, and documented here, rather than deleted in the same pass; remove it from `index.css` (both themes, plus the `--color-promo-foreground` alias) and from this table when someone confirms no promo surface wants blue copy back.

**Typography ramp tokens with no current semantic alias** (`text-neutral-800` body-data, `text-neutral-600` table-header, `text-neutral-400` placeholder / missing-data dash) — use the ramp token directly until corresponding semantic aliases are added to `:root {}`. These are identified gaps, not free passes; close them when touching the token layer.

**Chart runtime colors** — `style={{ backgroundColor }}` / `style={{ color }}` from the chart palette helper are runtime values, not Tailwind classes. No token violation.

### Dark mode (`.dark` theme) *(added 2026-07-09)*

Dark mode is driven entirely by a `.dark` class on `<html>` that re-points the `:root {}` semantic tokens. **No component reads a palette atom for a themed surface.** Any surface already on a semantic token (`bg-card`, `text-foreground`, `border-border`, …) inverts for free — which is why the raw-ramp ban above is now a *functional* requirement, not just hygiene: a raw `bg-neutral-100` / `bg-white` / `text-neutral-700` does not invert and renders dark-on-dark (or light-on-light). ← code-direct: `src/index.css` `.dark {}`

- **Provider:** `ThemeProvider` + `useTheme` (`src/hooks/use-theme.tsx`, mounted in `main.tsx`). Binary light/dark, follows OS until an explicit choice, persisted to `localStorage.theme`. No-flash guard = blocking inline script in `index.html` that sets the class before first paint. Toggle = top-bar sun/moon `ThemeToggle`.
- **Scale = shadcn/Geist dark.** Elevation INVERTS vs light (darker sits lower): bg / sidebar `neutral-950` < card `neutral-900` < popover / muted / secondary `neutral-800` < accent (hover) `neutral-700`. Borders are translucent white so hairlines read on any elevation.

**Token contract (light / dark).** Authoritative; every value is in `index.css` `:root` / `.dark`. ← code-direct

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | neutral-50 | neutral-950 |
| `--foreground` | neutral-900 | white |
| `--card` / `-foreground` | white / neutral-900 | neutral-900 / neutral-50 |
| `--card-muted` | neutral-50 | neutral-800 |
| `--popover` / `-foreground` | white / neutral-900 | neutral-800 / neutral-50 |
| `--muted`, `--secondary` | neutral-100 | neutral-800 |
| `--accent` (hover / active fill) | neutral-100 | neutral-700 |
| `--primary` / `-foreground` | neutral-900 / white | neutral-200 / neutral-800 |
| `--primary-foreground-soft` *(added 2026-07-27)* | neutral-200 | neutral-800 |
| `--muted-foreground` | neutral-600 | neutral-400 *(was neutral-300, retuned 2026-07-29)* |
| `--border` | neutral-200 | white @ 10% |
| `--border-active` (active-thumb hairline) | neutral-100 | neutral-800 (= thumb, invisible) |
| `--border-hover` (hover / pressed edge) *(added 2026-07-28)* | neutral-300 | white @ 20% |
| `--input` | neutral-300 | white @ 15% |
| `--ring` | neutral-400 | neutral-500 |
| `--destructive` | danger-600 | danger-400 |
| `--sidebar` | white (flush w/ bg) | neutral-950 |
| `--sidebar-accent` / `--sidebar-border` | neutral-100 / neutral-200 | neutral-800 / white @ 10% |
| `--surface-strong` / `-foreground` | neutral-900 / neutral-50 | **same in both themes** |
| `--control-raised` *(added 2026-07-27)* | white | neutral-700 |
| `--chat-bubble-user` *(added 2026-07-27)* | neutral-100 | neutral-800 |
| `--chat-bubble-user-foreground` *(added 2026-07-27)* | neutral-950 | neutral-100 |
| `--chat-bubble-agent` *(added 2026-07-27)* | white | neutral-950 |
| `--chat-bubble-agent-foreground` *(added 2026-07-27)* | neutral-900 | neutral-200 |

Two light retunes shipped alongside dark: `--muted-foreground` neutral-500 → **neutral-600** (more legible muted text), `--input` neutral-200 → **neutral-300**.

**Dark `--muted-foreground` retune (2026-07-29): neutral-300 → neutral-400.** At neutral-300 (#d4d4d4) secondary text sat one ramp step from `--foreground` (white) and stopped reading as secondary — the Ask AI composer's placeholder was indistinguishable from a typed question. Figma's dark nodes place secondary text at neutral-400/500 against primary at neutral-200, a consistently wider gap than the code carried; neutral-400 (#a1a1a1) is Figma's own placeholder value. Still clears AA (~7:1 on `--background`). **Light is unchanged** — neutral-600 against neutral-900 was already a clear separation, which is the point of fixing this at the token rather than at a call site: one semantic pair, `text-muted-foreground` / `text-foreground`, now reads correctly in both modes.

**`--surface-strong` (new token pair).** For surfaces intentionally dark in BOTH themes: hero chart card, code / terminal cards, dark tooltips, the connected-segment active pill. Utilities `bg-surface-strong` + `text-surface-strong-foreground`. Use this INSTEAD of raw `bg-neutral-900` / `text-white` whenever the dark surface is deliberate.

**`--primary-foreground-soft` (added 2026-07-27).** A softened on-primary ink
for **icon-only** primary actions — currently the `AskAiComposer` send button.
Full white (`--primary-foreground`) is too hot for a 16px glyph on the
neutral-900 fill: it flares and the stroke reads heavier than it is, so the ink
steps back one notch to neutral-200. In dark it is **deliberately identical to
`--primary-foreground`** (neutral-800) — the fill already inverts to light and
the ink is already dark, so the token is a visual no-op there and stays safe to
use in either theme. Utility: `text-primary-foreground-soft`. **Text-sized
on-primary content (button labels, badges) stays on `--primary-foreground`** —
neutral-200 on neutral-900 is 14.2:1, fine for a glyph, but do not use it to
quietly dim body copy.

**`--control-raised` (added 2026-07-27).** Fill for a **small icon-only control
that sits on a muted card surface** and has to read as a discrete chip —
currently the `AskAiComposer` 24px plus button on `bg-card-muted`. White in
light: `--accent` (neutral-100) is only one ramp step off the neutral-50
composer shell, which at 24px reads as a smudge rather than a control. Dark
keeps neutral-700 on the neutral-800 shell, which is what `--accent` already
resolved to there, so **dark is a visual no-op**. Utility:
`bg-control-raised`; pair it with `border-border` + `shadow-xs`.
**Not a substitute for `--card`.** A card inverts with the theme (white →
neutral-900); this token deliberately stays *lighter than whatever surface is
beneath it* in both themes, because it is a raised control, not a panel. For
hover / active fills keep using `--accent`; for panels keep `--card` /
`--card-muted`.

**Ask AI chat bubbles (added 2026-07-27).** Two surface+ink pairs for the two
conversational surfaces in the Ask AI panel: `--chat-bubble-user` /
`-foreground` and `--chat-bubble-agent` / `-foreground`. Values transcribed
from the Figma light/dark twins (Research `1096:5471` / `1114:7141` light,
`1108:4193` / `1125:4374` dark). Utilities: `bg-chat-bubble-user`,
`text-chat-bubble-user-foreground`, and the agent equivalents.

Neither pair can reuse an existing token, which is why they exist:

- The **agent** bubble must sit **lighter than the panel in light** (white on
  the white card, edge carried by `border-border`) and **darker in dark**
  (neutral-950 recessed under the neutral-900 card). No token inverts that way.
  `--card` follows the card (white / neutral-900), so dark would read flush
  rather than recessed; `--background` is the page canvas, which §2 bars from
  darkening a component.
- The **user** bubble cannot take `--secondary` or `--muted`: both are
  neutral-800 in dark — identical to `--card-muted` on the composer — so the
  user chip and the composer would collapse into one value.

Together the tokens keep the two bubbles distinguishable from each other, from
the composer, and from the panel, in both themes. Scoped to the Ask AI panel;
they are not a general elevation tier (use `--card-muted` / `--control-raised`
for that).

**`--border-active` (2026-07-14).** 1px hairline for a raised *active thumb* — the segmented pill's indicator. Neutral-100 in light (a whisper of crispening on the white thumb); in dark it's neutral-800, which matches the thumb surface (`--popover`) so the hairline visually disappears — the lighter thumb already carries the active state there. Utility `border-border-active`. Not a substitute for `--border` on containers.

**`--border-hover` (2026-07-28).** The hover *and* active/pressed edge on a bordered control — one token, both states, because a control that raises its edge on hover should hold that edge while pressed rather than flicker to a third value. It is always a step of MORE contrast against the surface than `--border`: neutral-300 in light (darker), white @ 20% in dark (lighter, one step past `--border` @ 10% and `--input` @ 15%). Utility `border-border-hover`. **Not a substitute for `--ring`, which means focus** — `--ring` answers "keyboard is here", `--border-hover` answers "this is pointing at you". A control can show both at once. First and only use: the Ask AI empty-state suggestion rows, via a `Button` compound variant scoped to `variant="outline" + shape="pill"`. Deliberately NOT on the whole `outline` variant — raising the edge on every outline button in the app is a site-wide change and is its own decision. Nothing else uses `shape="pill"`, so nothing else moved.

**Surface map (raw ramp → token), applied in the 2026-07-09 surface pass:**

| Raw (does not invert) | Token |
| --- | --- |
| `bg-neutral-50` (field wash) · `bg-neutral-100` (chip / subtle fill) | `bg-muted` |
| `hover:bg-neutral-50` / `-100` | `hover:bg-accent` |
| `bg-white` (panel) | `bg-card` (surface) / `bg-background` (page region), by role |
| `bg-neutral-900` / `-950` (deliberate dark) | `bg-surface-strong` + `text-surface-strong-foreground` |
| `border-neutral-200` | `border-border` |
| `border-neutral-300` | `border-input` |
| `ring-neutral-*` | `ring-ring` |
| `from-neutral-100 to-neutral-50` (sidebar active) | drop gradient → `bg-accent` + `text-accent-foreground` |
| `data-checked:bg`/`border-neutral-700`/`-900` (checkbox / radio / switch) | `data-checked:bg`/`border-primary` |
| selected `bg-neutral-900 text-white` (active tab / page / calendar day) | `bg-primary text-primary-foreground` |
| chart gridline / cursor / reference `stroke-neutral-200`/`-400` | `stroke-border` |
| chart axis tick `fill-neutral-500` | `fill-muted-foreground` |
| chart bg sector / tooltip cursor `fill-neutral-100` | `fill-muted` |

**Kept as-is (intentional, do NOT sweep):** `text-white` / white-on-color on brand or status fills (blue-700 monogram, colored status badges); the always-dark terminal chrome inside `code-card.tsx` (`bg-neutral-800`/`-700`, `border-neutral-900/60`); the modal scrim (`bg-neutral-900/40`, dark in both themes); captured-transcript strings in `src/data/*` (data, not UI).

**Status-tint dark convention.** Light status tints (`bg-{success,warning,danger,blue}-100` + `text-*-700/800`) read wrong on dark. Add a `dark:` variant using the ramp mid at low alpha for the fill and the ramp light-end for text — mirrors the pre-existing `dark:bg-destructive/20` idiom:

| Light | Add for dark |
| --- | --- |
| `bg-success-100 text-success-800` | `dark:bg-success-500/15 dark:text-success-300` |
| `bg-warning-100 text-warning-700` | `dark:bg-warning-500/15 dark:text-warning-300` |
| `bg-danger-100 text-danger-800` | `dark:bg-destructive/20 dark:text-danger-300` |
| `bg-blue-700/10 text-blue-600` | `dark:bg-blue-500/15 dark:text-blue-300` |
| hover `hover:bg-*-200` | `dark:hover:bg-*-500/25` |
| **ultralight `bg-*-25` large fills** (finding cards, callout `Card`s) | `dark:bg-*-500/10` (fill), `dark:bg-*-500/15` (hover); pair `border-*-200` → `dark:border-*-500/30` |

The **neutral** badge / chip is NOT a tint — it tokenizes to `bg-muted text-muted-foreground` and needs no `dark:` variant.

### Do not use

- Raw hex/oklch/rgba outside `@theme`.
- Single-token semantics (`--color-warning`, `-2` variants) — use ramp steps (`text-warning-700`, `bg-success-100`).
- Blue for primary action — `--primary` resolves to neutral-900.
- Blue for inline links — use ink + faint underline (see §7).
- `text-neutral-600`/`text-neutral-700` as table body-cell tones — collides with three-tier policy.
- Vendor colors as chart series colors by default — charts use `--chart-1..8` by index.
- **Raw ramp classes where a semantic token exists** — see the semantic token quick-reference table above, and the Dark mode subsection for the full raw→token surface map. Since 2026-07-09 this is a **functional** requirement, not just hygiene: a raw ramp class does not invert under `.dark`. Exception: typography ramp tokens with no current alias (`text-neutral-800/600/400`). Every surface/border/ring/foreground ramp value has a semantic alias — use it. The old `bg-neutral-50` field-wash exception is retired: the input wash is now `bg-muted`.

---

## 3. Typography *(Google canonical §3)*

### Font Family

- **Sans:** `"Geist", ui-sans-serif, system-ui, sans-serif`
- **Mono:** `"Geist Mono", ui-monospace, "SFMono-Regular", monospace`

Loaded via Google Fonts CDN + `@fontsource-variable/geist` fallback. Geist serves headings too — `--font-heading` aliased to `--font-sans`. No IBM Plex.

### Hierarchy

Tailwind named scale only. Three sizes overridden in `@theme` to Geist's heading scale (even-numbered, larger increments at top); other sizes match Geist defaults. **Arbitrary `text-[Npx]` is banned.**

Heading voices resolve through the semantic `type-heading-*` utilities (see "Semantic type-role utilities" below), not raw `text-*`. The old `.h1`–`.h5` element-aliases were retired 2026-06-26 and folded into `type-heading-32/24/20/18/16` so there is a single source of truth; the sans heading tiers `type-heading-16` through `type-heading-24` carry `tracking-snug`, while the display tier (`type-heading-32`+) uses the tighter `tracking-tight` (§975).

| Role (YAML key) | Font | Size | Weight | Line Height | Letter Spacing | Rule | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `hero-numeric-lg` | Geist | 32 | 500 | 36 | tight | Full-page hero metric only (Requests page hero, `8,241`). One per page. | sans + `tabular-nums` — presentation tier. |
| `hero-numeric-default` | Geist | 24 | 500 | 32 | tight | KPI rail value, panel hero (Top Keys total). | sans + `tabular-nums`. |
| `h1` | Geist | 32 | 500 | 40 | tight | Page title (artboard h1). | `type-heading-32` (text-3xl/10, tracking-tight). |
| `h2` | Geist | 24 | 500 | 32 | snug | Superseded as the section-title voice by `h3` (20px, below). The h2 *element* still carries `SectionTitle as="h2"` (at 20px) when a section has sub-headings (e.g. Overview "Get started"). | `type-heading-24` (text-2xl/8, tracking-snug). |
| `h3` | Geist | 20 | 500 | 28 | snug | Page section titles via `<SectionTitle>` — "Overview", "Recent …", "Activity This Week", "Get started". Default `<h3>` element; `as` overrides level without changing the voice. | `type-heading-20` (text-xl/7, tracking-snug). |
| `h4` | Geist | 18 | 500 | 28 | snug | Card title, modal hero ID, modal `KpiTile` value (mono — below sans-hero threshold). | `type-heading-18` (text-lg/7, tracking-snug). |
| `body` | Geist | 16 | 400 | 24 | normal | Card subtitles, button labels, body in spacious surfaces. | text-base. |
| `body-sm` | Geist | 14 | 400 | 20 | normal | Modal field labels, body in compact surfaces, eyebrow default. | text-sm. |
| `body-xs` | Geist | 12 | 400 | 16 | normal | Eyebrow sm, table column heads, breadcrumbs, dense metadata. | text-xs. |
| `label` | Geist | 14 | 500 | 16 | normal | Form labels (Label primitive). | leading-none. |
| `eyebrow-sm` | Geist Mono | 12 | 500 | 16 | 0.1em | KPI labels, card section eyebrows, top-bar strips. | UPPERCASE TRACKED. |
| `eyebrow-default` | Geist Mono | 14 | 500 | 20 | 0.1em | Modal eyebrows, drawer headers, hero strips. | UPPERCASE TRACKED. |
| `badge` | Geist Mono | 12 | 500 | 16 | normal | Status codes, counters, deltas, pills. | tabular-nums (Badge default). |
| `data` | Geist Mono | 14 | 400 | 20 | normal | Table cells, IDs, codes, hashes, model identifiers, row values. | tabular-nums. |

**Default.** When no stronger role applies, UI text is `body-sm` (14/20 sans) and any value, ID, or numeric is `data` (14/20 Geist Mono, tabular-nums). These two carry most of the app; reach past them only when a role above is genuinely the intent.

### Semantic type-role utilities (codified 2026-06-23)

Vercel-style role naming is now the policy for page work: prefer semantic
heading/label/copy classes over ad-hoc `text-*` mixes in route files.

| Role | Utility class | Recipe |
| --- | --- | --- |
| Heading 72 | `type-heading-72` | `font-sans text-7xl font-medium tracking-tight` |
| Heading 64 | `type-heading-64` | `font-sans text-8xl font-medium tracking-tight` |
| Heading 56 | `type-heading-56` | `font-sans text-6xl font-medium tracking-tight` |
| Heading 48 | `type-heading-48` | `font-sans text-5xl/14 font-medium tracking-tight` |
| Heading 40 | `type-heading-40` | `font-sans text-4xl/12 font-medium tracking-tight` |
| Heading 32 | `type-heading-32` | `font-sans text-3xl/10 font-medium tracking-tight` |
| Heading 24 | `type-heading-24` | `font-sans text-2xl/8 font-medium tracking-snug` |
| Heading 20 | `type-heading-20` | `font-sans text-xl/7 font-medium tracking-snug` |
| Heading 18 | `type-heading-18` | `font-sans text-lg/7 font-medium tracking-snug` |
| Heading 16 | `type-heading-16` | `font-sans text-base/6 font-medium tracking-snug` |
| Heading 14 | `type-heading-14` | `font-sans text-sm font-medium` |
| Label 20 | `type-label-20` | `font-sans text-xl/8 font-normal tracking-tight` |
| Label 18 | `type-label-18` | `font-sans text-lg/5 font-normal tracking-tight` |
| Label 16 | `type-label-16` | `font-sans text-base font-medium tracking-tight` |
| Label 14 | `type-label-14` | `font-sans text-sm font-medium` |
| Label 12 | `type-label-12` | `font-sans text-xs font-medium` |
| Copy 18 | `type-copy-18` | `font-sans text-lg font-normal tracking-snug` |
| Copy 16 | `type-copy-16` | `font-sans text-base font-normal tracking-snug` |
| Copy 14 | `type-copy-14` | `font-sans text-sm font-normal` |
| Copy 12 | `type-copy-12` | `font-sans text-xs font-normal` |
| Copy 10 | `type-copy-10` | `font-sans text-2xs font-normal` — **fenced, see "Micro tier"** |
| Mono 16 | `type-mono-16` | `font-mono text-base font-normal tabular-nums` |
| Mono 14 | `type-mono-14` | `font-mono text-sm font-normal tabular-nums` |
| Mono 12 | `type-mono-12` | `font-mono text-xs font-normal tabular-nums` |

**Data-voice rule (mono).** The `type-mono-*` utilities are the codified
`data` voice (see the taxonomy below). **Every data value — number, count,
token total, currency, percentage, date/timestamp, ID, hash, and machine
identifier — uses a `type-mono-*` token, never a hand-rolled
`font-mono … tabular-nums` string.**

**Carve-out: display names are NOT data *(ruled 2026-07-28)*.** Mono applies to
the *machine* string, never to the human-readable name beside it. The test is
whether a user would copy-paste it into a config file:

| Mono (`type-mono-*`) | Sans (label or copy) |
| --- | --- |
| `anthropic/claude-opus-4.7` — the model **slug** | "Claude Opus 4.7" — the model **display name** |
| `key_live_a1b2…`, request/conversation IDs, hashes | "Chad's workspace", a team member's name |
| `gpt-4o-mini`, provider slugs, endpoint paths | "OpenAI", "Anthropic" as vendor labels |

Model, vendor, workspace, key and project **display names take the sans voice**
— `type-label-*` when they name a clickable row or control (the usual case in a
table), `type-copy-*` only when they sit inside running prose. Do **not**
re-mono them: they have always rendered sans, and the earlier wording ("key/model
identifier") was read as covering display names, which it never did. Pick the size to match the sans copy tier
it sits beside (`type-mono-14` is the default, twinning `type-copy-14`). Apply
color (`text-foreground` / `text-muted-foreground`), alignment (`text-right`),
and `whitespace-nowrap` at the call site; the token owns only font + size +
weight + tabular figures. Non-data text keeps `type-copy-*` / `type-label-*`;
code blocks, eyebrows, and terminal chrome keep their own voices. **One scoped exception exists — see "Exception: Ask AI reply prose" below; it does NOT relax this rule anywhere else.**

**Usage rule:** when one of the semantic roles above fits, use it in page code.
Only compose raw text utilities when a role truly does not exist yet; then
promote that recipe into a named role.

**Micro tier — 10/14 *(opened 2026-08-04)*.** One step exists below the 12px
body floor: `--text-2xs` (10px / 14px), reachable only through the
`type-copy-10` voice. It was opened for a single surface — the sidenav upgrade
card's supporting line, which the Figma twins `sidebar-footer-light`
(1255:6256) and `sidebar-footer-dark` (1256:6340) set at Geist Regular 10/14 —
and it is **fenced to that role**.

The rule it bends is real, so read the fence carefully. 12px stayed the floor
for years because sub-12px text is where hierarchy stops being legible and
starts being decorative; the app already had two hand-rolled 10px labels
(`monogram.tsx`, the Gate Connect pill) sitting on the linter's allowlist,
which is exactly the drift a floor is supposed to prevent. Naming the step is
what stops a third: an arbitrary bracketed pixel size remains banned, so every
10px in the codebase is now one greppable class, and adding a fourth consumer
means editing this paragraph.

**Not a fallback for tight space.** If copy does not fit at 12px, the answer is
less copy or more room. Reach for `type-copy-10` only when a design explicitly
specifies 10px, and never for running prose — it is supporting chrome inside a
single promo surface, not a body voice. Raw `text-2xs` is not a call-site
class; the voice is.

**Global input-helper rule:** all helper text under inputs uses
`type-input-helper` (locked recipe: `font-sans text-xs font-normal` = 12px,
line-height 16px, plus `mt-2` = 8px gap from the input). Do not hand-roll
helper text size or spacing with one-off `text-*` / `mt-*` values.

### Five-voice taxonomy (codified 2026-05-07)

Each voice has a single job; mixing them is the drift surface. **Critical rule:** sans labels are `font-medium` minimum.

**Split into separate Body and Label rows 2026-07-28**, after a site-wide audit. The
single "Body / label" row read *"regular or `font-medium`"* while the rule below
said labels are `font-medium` minimum — a contradiction inside one section, and
the exact ambiguity that let ~20 call sites drift to 400. `font-normal` reads as ambient body, not a label. Color does the *quiet* work; weight does the *structural* work.

| Voice | Recipe | Use |
| ------- | -------- | ----- |
| **Display headline / hero numeric** | `font-sans tabular-nums font-medium tracking-tight` (via `<HeroNumeric>`) | Page titles, KPI hero values (24px), full-page hero metrics (32px), panel heroes — *summary, look at this* |
| **Body** | `font-sans font-normal` (`type-copy-*`) | Paragraphs, descriptions, helper text, empty-state body, table cell content, timestamps, captions, inline text links mid-sentence, typed input values — *prose the user reads* |
| **Label** | `font-sans font-medium` (`type-label-*`) | Anything the user can click, and anything that names something. See the enumeration below — *this names it, or you press it* |
| **Eyebrow** | `font-mono uppercase tracking-[0.1em] font-medium` | Section eyebrows, KPI labels, segmented control labels, chrome strips — *what is this*. **Never use this for form/input labels** — those go in the Body/label row above. Mono UPPERCASE on a field label reads as a chrome strip, not as something the user is meant to fill in. |
| **Badge / pill** | `font-mono tabular-nums font-medium text-xs` (via Badge default) | Status codes (`200`/`500`), counters, deltas, inline pills — *operational chrome* |
| **Data** | `font-mono tabular-nums` | Table numerics, IDs, codes, hashes, slugs and machine identifiers, modal sub-tier numerics — *raw data*. **Display names are excluded** — see the carve-out above |

### Label voice — the enumeration *(ruled 2026-07-28)*

**The classification test.** Apply it in this order:

1. **If you can click it, or it names something → Label** (`type-label-*`).
2. **If it is prose the user reads → Copy** (`type-copy-*`).
3. **If it heads a section → Heading** (`type-heading-*`).

**Corollary — quiet labels stay 500.** A label that should recede goes quiet
with `text-muted-foreground`, **never** with a lighter weight. Colour does the
quiet work; weight does the structural work. Inactive nav items, inactive tabs,
secondary actions and disabled controls are all still 500.

**Every interactive and naming role takes `type-label-*`.** This list is
exhaustive and is the single source — `.claude/rules/no-handrolling.md` cites
it rather than restating it:

| Role | Examples |
| --- | --- |
| Button labels | `<Button>`, raw `<button>`, icon+text buttons |
| Nav items | Sidebar rail and expanded nav, mobile Sheet nav — **active and inactive alike** |
| Tabs | `TabsTrigger`, both `default` and `line` variants, **active and inactive alike** |
| Menu items | `SelectItem`, `MenuItem`, `DropdownMenuItem`, command-palette rows |
| Select / combobox triggers | `SelectTrigger`, the MultiSelect `PopoverTrigger`, workspace switcher |
| Dialog / popover / menu triggers | `DialogTrigger`, `PopoverTrigger`, `DropdownMenuTrigger`, `MenuTrigger` |
| Link-buttons | Standalone `TextLink` controls — "Back to Models", "Show more", "Open in Explorer" |
| Clickable card affordances | A whole card or KPI tile that navigates on click |
| Pagination controls | Page numbers and prev/next — **current and non-current alike** |
| Table column headers | `TableHead`, `SortableTableHead` |
| Card titles | `CardTitle` |
| Form / input labels | The `<Label>` primitive and any raw `<label>` |
| `<dt>` terms | The term in a `<dl>`; the `<dd>` value stays Copy |
| Key / project / entity display names | Model, vendor, workspace, API-key and team-member names — **except** when the name IS a table row's identifier cell, which is Copy; see the carve-out below |

**Explicitly NOT Label** — these keep their own voice:

| Not a label | Voice | Why |
| --- | --- | --- |
| Inline text links mid-sentence | Copy | It is prose that happens to be clickable |
| Typed input values | Copy | A value the user entered, not a label on it |
| Secondary identity lines (e.g. the email under a user's name) | Copy | A value beneath its label |
| `<dd>` values | Copy | The term is the label; this is its value |
| Segmented control labels | **Eyebrow** | Chrome strip — see the Eyebrow row above |
| Table cell content | Copy, or Data when numeric/machine | Content, not a control |
| **Table row-identifier cells** *(2026-08-20)* | Copy | Reversal of the 2026-07-28 ruling below |

**Carve-out: a table row's identifier cell is Copy, even when clickable
*(2026-08-20)*.** The name a row is identified by — the Model cell in the
Messages table, and any cell like it — takes `type-copy-*`, not `type-label-*`,
**including** when that cell is the row's drill-in target.

**Why.** It reads as one of a set of peer cells, not as a control's own label.
In the Messages table, Message / Conversation / Key all render at 400, so a
font-medium Model made a single column shout across every row. The 2026-07-28
enumeration handed that cell to Label on the grounds that it names something
and you can click it; both are true and neither wins against the fact that the
row is a row. The user ruled on 2026-08-20 after the same complaint landed on
the message detail modal, where the Model value sat at 500 next to Provider /
API Key / Endpoint at 400.

**Scope — the identifier cell of a table row, and DetailList values.** Not
buttons, not nav, not tabs, not column headers, not standalone `TextLink`
controls, not entity names anywhere outside a row. A row-identifier cell that
also happens to be a link is still a row-identifier cell.

**How it's enforced.** `scripts/check-design-tokens.mjs` flags a `type-copy-*`
inside a label-role tag, and `RowActionButton` is one. A site taking this
carve-out declares it with a `design-allow-copy-voice` mention in a comment
within the 5 lines above the `className`, and states its reason there. The
waiver is per-site by construction — there is no file-level or repo-level
switch. Current uses: `src/pages/requests/RequestsTable.tsx` (Model cell).
`RequestDetailBody.tsx`'s Model value needs no waiver — a `DetailList` value is
not inside a label-role tag.

**Hero/data split is size-gated.** Hero summary numerics ≥24px render sans (sans + `tabular-nums` carries the cell-padding mono affordance while signaling "presented summary"). **Below ~20px, numerics revert to mono regardless of role** — modal `KpiTile` at text-lg, table cells, badge contents, row costs all stay mono. The cutoff is real: at ~18px the digit-shape differences between Geist Sans tabular and Geist Mono become more visible, and the mono-illusion breaks.

### Exception: Ask AI reply prose *(2026-07-27)*

**What.** Inside an **Ask AI agent reply**, inline `code` and fenced `pre`
render in the **sans body voice** (`type-copy-14`) on a `bg-muted` chip /
block — **not** the mono `type-mono-*` Data voice that the rule above would
otherwise require for code.

**Why.** Replies are long-form reading. Mono degrades legibility across that
length, and a reply can be many screens of it. Figma renders the reply's code
spans in sans (`1125:4374`, chip e.g. `1125:4391`), and the user confirmed the
reasoning on 2026-07-27.

**Scope — Ask AI reply content ONLY.** This applies to markdown rendered inside
`AgentMessage` / `ReplyProse` (`src/components/ui/ask-ai-message.tsx`) and
nowhere else. The mono Data voice still governs, unchanged, for: table cells
and all numerics, IDs, hashes, key and model identifiers, request/transcript
surfaces, `CodeCard` / `CodeBlock`, `InlineCode`, `CodePanel`, badges,
eyebrows, and terminal chrome. Do not generalise this exception outward from
the chat panel.

**Second carve-out: `ToolResultCode` *(2026-07-30)*.** One transcript surface
is now sans for the same reason: the Conversations trace renders `Tool · Read`
bodies through `ToolResultCode`, and those blobs are dense multi-line walls
that were hard to read in mono. They take the same voice as the Ask AI code
spans (`type-copy-14`) at the same 14px. This is the *only* transcript
surface excepted — every other one named above stays mono, and the rest of the
Conversations trace (IDs, timestamps, numerics, `InlineCode`) is untouched.

**Do not revert.** Sans code inside a reply looks like a violation of the
five-voice rule and is intentional. Do not "fix" it back to mono.

### Principles

Operational surfaces ~60% mono / 40% sans. Weight ceiling 500 (don't reach for 600/700 — size carries hierarchy). Hierarchy from size + weight + voice change, not color (color is for state).

---

## 4. Layout *(also: "Layout & Spacing" — Google canonical §4)*

### Spacing System

**Three-tier rule** (locked 2026-05-09 after audit found 53 surface-tier violations across the artboards). Half-step Tailwind classes (`gap-0.5`, `gap-1.5`, `gap-2.5`, `gap-3.5`) and arbitrary values (`gap-[18px]`) are **banned** at every tier.

#### Tier 1 — Surface (8-multiples only)

Page padding, section gaps, card padding, between-card gaps, empty-state heights, modal body padding, between-section vertical rhythm. Allowed pixel values: **8, 16, 24, 32, 40, 48, 64, 80, 96**. Tailwind classes that resolve to 8-multiples: `gap-2/4/6/8/10/12/16/20/24`, `p-2/4/6/8/10/12`, `py-2/4/6/8/10/12`, etc.

**Banned at surface tier:** any odd 4-multiple — `gap-3` (12), `gap-5` (20), `gap-7` (28), `gap-9` (36), `p-3`, `p-5`, `p-7`, `py-3`, `py-5`, `py-7`. Spec-sheet panels that historically used `p-7` (CMP-002/003/004/006/008c) **normalize to `p-6`** (24px).

#### Tier 2 — Compound (any 4-multiple)

Within a primitive's row/group: between icon + label, badge + text, label + control, header chevron + close button, button-group adjacency, table inner cell padding. Any `n × 4` is legal here — `gap-1` (4), `gap-3` (12), `gap-5` (20). Examples: `Button` xs/sm `px-3`, `Input` sm `px-3`, `<Table>` inner cell `px-3`.

**The semantic test:** is this gap *between sibling primitives in a panel* (surface) or *between elements within one primitive's local layout* (compound)? Two side-by-side `<Button>`s in an action row → compound. Two stacked `<Card>`s in a column → surface.

#### Tier 3 — Primitive-internal (locked at the primitive)

`<Card>` is `p-4`, `<CompactKpi>` is `p-4`, `<KpiTile>` is `p-4`, `<EmptyState>` is `py-12 px-6`, `<DialogContent>` is `p-6` at its default density (bumped from `p-4` on 2026-05-11 — the live detail modals needed the air for eyebrow + title + meta + status badge in the header) and `p-4` at `density="compact"` — **a modal is 24px, a dialog is 16px**, `<DialogScroll*>` sections are `px-6 pt-6` on header/summary and `px-6 pt-6 pb-6` on body — `<DialogScrollFooter>` drops to `px-6 py-4 + border-t` so the action band reads as chrome, not content (mirrors `<CardFooter>`'s `p-4`). `<Table>` cells are `px-3` inner / `px-4` outer. **These are *the* rule for their consumers** — composed pages don't override them.

#### Token roles

| Token | Value | Tier | Uses |
| --- | --- | --- | --- |
| `spacing.1` | 4px | compound | Micro gap (icon adjacency, internal grouping) |
| `spacing.2` | 8px | surface OK | Badge gap, button icon gap, between dense siblings |
| `spacing.3` | 12px | compound only | Button px-3 (all sizes), Input px-3, Select pl-3, inner table cells |
| **`spacing.4`** | **16px** | **surface — dominant** | **Card padding, table outer cells, page gutter, section gap, between cards in a grid** |
| `spacing.5` | 20px | compound only | Chart legend gap, hero internal rhythm |
| `spacing.6` | 24px | surface OK | Outer page margins from `sm`+ (`px-4 sm:px-6` — 16px below `sm`); spec-sheet panel padding |
| `spacing.8` | 32px | surface OK | Between-section gap on spec-sheet artboards |
| `spacing.12` | 48px | surface OK | Page-bottom rhythm |
| `spacing.16` | 64px | surface OK | Hero strip spacing |

**Rule:** Start at **16px** (`gap-4` / `p-4`) for any surface-tier card padding, page gutter, section gap, between-card gap. Drop to compound-tier 12px (`px-3` / `gap-3`) only inside a primitive's local layout (button sm, input sm, table inner cells). Use 24px (`p-6`) for outer page margins on large screens or spec-sheet panel padding. Above 24px, justify with a specific use case — there are very few in this system.

### Grid & Container

- **Composed pages:** 12-column grid + 16px gutters (`grid grid-cols-12 gap-4`). Asymmetric layouts via `col-span-N` (row sums to 12).
- **Outer page margins:** horizontal `px-4 sm:px-6` — **16px on mobile** (<640px), 24px from `sm` up (updated 2026-07-17; was a flat 24px). Vertical `pt-6 pb-8` (`lg:pb-20`). Set on the shell `<main>` in `DashboardChrome.tsx` and mirrored on the sticky top bar. The pagination footer sits inside `<main>` and inherits the margin.
- **All pages** are responsive but tuned for ≥1280px. (The MVP-era `src/artboards/` spec sheets, which used a fixed `w-[1440px]` column to mirror Paper, were stripped on 2026-05-11.)
- **Page-header subtitle:** `text-base text-neutral-500 tracking-snug` (see §typography tracking rule — `tracking-snug`, not `tracking-tight`). Width: `max-w-1/2` on the *wrapper column* (not the `<p>` — fractional max-w on a leaf doesn't behave).

Whitespace carries hierarchy. Cards never touch — shadow-as-border does the separation. Body has a 40px linear-gradient grid on `--canvas-bg`; anything sitting on white needs explicit `bg-white` or `bg-neutral-50`.

---

## 5. Elevation & Depth *(Google canonical §5)*

### 5.0 The shadow scale — Tailwind's, verbatim (ruled 2026-07-29)

**The elevation scale is Tailwind's named steps and nothing else.** The Figma
file scales elevation on Tailwind's shadows, so the code uses the same ladder,
at the same values. There are no bespoke shadow families, no retuned alphas, no
per-theme alpha overrides, and no arbitrary `shadow-[…]`. A shadow that is not
one of these five utilities is a defect.

| Utility | Value (exact, from `tailwindcss/theme.css` v4.2.4) |
| --- | --- |
| `shadow-2xs` | `0 1px rgb(0 0 0 / 0.05)` |
| `shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| `shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |

Restated in `src/index.css`'s `@theme` block so the scale is visible in the
token layer and any drift from upstream shows up as a diff. Two things changed
when it landed: `--shadow-xs` lost its retuned `0.055` alpha (back to stock
`0.05`), and the dark theme's `--shadow-xs: … / 0.4` override was **removed** —
one scale, one set of values, both themes. Dark elevation therefore reads
softer than it did; the `border-border` hairline still carries the crisp edge.

### 5.1 Tier → utility (assigned 2026-07-29)

The five legacy shadow families are **deleted** from `index.css`, light and
dark. Every surface below now names a Tailwind step directly.

| Tier | Recipe | Radius | Surfaces |
| --- | --- | --- | --- |
| Sub-element | none | `rounded-xs` (4px) | Tabs trigger, Segmented item, SelectItem, Badge, MenuItem |
| **Card / Surface** | **`border border-border shadow-xs`** | **`rounded-md` (8px)** | Card, KpiRail, EmptyState, CompactKpi, CodeCard (flat), Tabs `line` variant, MessageBlock outline. Tables carry NO shadow of their own — they sit inside a Card |
| Hover (card) | `hover:shadow-sm` where interactive (most cards are static) | (same as card) | Hovered card variant — rare in operator surfaces |
| **Soft lift** | **`shadow-sm`** | (varies) | `Button variant="raised"`, the Ask AI scroll-to-latest FAB, the composer's Add-context button |
| **Menu / Chrome** | **`shadow-md`** | `rounded-sm` (6px) | Menu popup, Popover, Tooltip, Select content, chart tooltip, CodeCard `raised`, Artboard shell, Team's member menu |
| **Modal** | **`shadow-lg`** | `rounded-xl` (**16px LOCKED**) | Dialog, AlertDialog, Sheet (right-docked = `rounded-none` left edge), the SignIn / SignUp auth cards |

**The ring layer is gone; borders replace it.** Every deleted token bundled a
`0 0 0 1px` ring *plus* a lift into one value. Tailwind's steps are lift only,
so any surface that relied on the ring for its edge now carries an explicit
`border border-border`. Most already did. Two did not and were given one:
`CompactKpi` and the `Artboard` shell. **If a converted surface looks
edgeless, it is missing its border — do not reach for a bigger shadow.**

**Dark mode reads softer than it did.** The deleted dark tokens ran at
0.3–0.6 alpha, tuned for near-black grounds; Tailwind's steps are 0.05–0.1,
tuned for light. On dark surfaces the `border-border` hairline is now doing
most of the separation work. That is the cost of one scale across both themes,
and it was accepted knowingly.

**Three-tier material ladder (codified 2026-05-10).** The prior two-tier (6/12) collapsed cards and buttons onto the same radius (6px) and put modals one step up (12px). Migration to three-tier opens a discrete *card / surface* tier at 8px — Card, KpiRail, and table containers now read distinct from buttons / inputs / menus (6px). Modal radius bumps to 16px to preserve the 2× tier ratio against cards (`8 → 16`). Sub-element radius (4px) is unchanged. Token: `--radius-xl: 1rem` in `@theme inline` (`index.css:305`).

**Rules:** Card-tier surfaces wear an honest `border-border` plus `shadow-xs`. Menus are `shadow-md`, modals `shadow-lg`, soft lifts `shadow-sm` — never a bespoke token. **Concentric rule:** item radius < container radius (4px badge inside 8px card inside 16px modal). Don't override `rounded-xl` on modals — locked.

---

## Motion *(Google canonical — added 2026-06-19)*

Animate intent, not decoration. Transition only `colors`, `box-shadow`, `opacity`, `scale`, and `transform`; never `transition-all`. Reduced motion always wins (`motion-reduce:transition-none` / `motion-reduce:animate-none`).

| Token / duration | Value | Where |
| --- | --- | --- |
| `--ease-out` (default) | `cubic-bezier(0.23, 1, 0.32, 1)` | All color/shadow/scale transitions; Tailwind `ease-out` maps to it site-wide |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Symmetric moves |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Slide-in surfaces (Sheet, sidebar) |
| 100ms | duration | Overlay fade, MenuItem highlight |
| 150ms | duration | Default control transition: colors, shadow, scale |
| 200ms | duration | Dialog enter (fade + zoom-in-95), sliding indicator, toast |
| 120ms | duration | Dialog close, held by `data-closed:fill-mode-forwards` |
| 300ms | duration | Sheet slide-in from right |

Easings are declared in `@theme` (`index.css:168–171`). Base UI + tw-animate-css exits need `data-closed:fill-mode-forwards` on both popup and overlay, or they flicker back to opacity 1 for ~28ms before unmount (see §7 Dialog).

The `<Button>` primitive's transition expands to `transition-[colors,opacity,box-shadow,scale]` so `disabled:opacity-50` *fades* on dirty-flip across every form button instead of snapping. Press affordance (standardized site-wide 2026-06-18, replacing the earlier `0.99`): **`active:scale-[0.98]` — a subtle scale-DOWN** with `will-change-transform` on the primitive so the scaled label re-rasters crisply instead of bitmap-stretching. Replaces the old `active:translate-y-px`. Gated so popover/select/menu *triggers* don't scale (`not-aria-[haspopup]` on the Button primitive, `enabled:` elsewhere), which avoids the anchor-reposition flicker. Always paired with `motion-reduce:active:scale-100`. Same press lives on `IconActionButton` + `TabsTrigger`; hand-rolled pressables match. Sliding indicator (Tabs / Segmented / SegmentedPill): 200ms ease-out, transform + width animated. Sheet enter: 300ms slide from right. Dialog enter: 200ms fade + zoom-in-95 (`Menu` popup gets `origin-[var(--transform-origin)]` so it scales *from the trigger*, not from the popup's geometric center — Base UI publishes the variable on the Positioner). MenuItem highlight uses `transition-colors duration-100 ease-out` — keyboard arrow-through no longer snaps. Toast: sonner default (200ms enter + 4s hold + 200ms exit).

---

## 6. Shapes *(Google canonical §6)*

Driven by `--radius` (0.625rem = 10px base) plus a **locked override** at `--radius-xl: 1rem` (16px) for modals. Revised 2026-05-10 from a two-tier ladder (6 / 12) to a **three-tier ladder** that opens a discrete card / surface tier.

| Token | Value | Tier | Use |
| --- | --- | --- | --- |
| `rounded.xs` | 4px | Sub-element | Tabs trigger, Segmented item, SelectItem, Badge, MenuItem |
| `rounded.sm` | 6px | Button / chrome / menu | Button, Input, Select trigger, Menu popup, Toast |
| **`rounded.md`** | **8px** | **Card / surface (NEW)** | **Card, KpiRail, table containers, hero card** |
| `rounded.lg` | 10px | Base | `--radius` (anchor — most derived tokens reference it) |
| `rounded.xl` | **16px LOCKED** | Modal | Dialog, AlertDialog (Sheet flush at `rounded-none`) |
| `rounded.full` | 9999 | Pills | StatusDot, Tag, Switch thumb, avatar monograms |

**Concentric example:** a 4px Badge sits inside an 8px Card, which sits inside (when drilled into) a 16px Dialog. Ratios: 2× between every tier, deliberately. **Card-in-card steps down one tier (sharpened 2026-06-04):** when a card nests inside another card, the inner card drops to the next radius down — outer panel `rounded-md` (8px) → inner card `rounded-xs` (4px). Full ladder `24 → 16 → 8 → 4`; surfaces at the *same* nesting level match, and matching radii across a parent/child boundary is the bug. Override shared primitives (`DetailList`, `CodeCard`) at the usage site, not in the primitive. **Don't override `rounded-xl` on modals.**

Iconography: `lucide-react` stroke `1.75`. Sizes: `size-3` (12px) / `size-3.5` / `size-4` (16px) / `size-5` (20px). In Buttons, set `data-icon="inline-start"` or `"inline-end"` for variant-aware padding trim.

---

## 7. Components *(Google canonical §7)*

The full primitive library is `src/components/ui/*.tsx` (61 primitives as of 2026-05-20). Highlights below — every component block maps to a `components.*` entry in YAML. Composed pages live in `src/pages/*.tsx` and are compositions of these primitives, not components themselves. (The MVP-era `src/artboards/CMP-*` spec sheets were stripped from this repo on 2026-05-11; historical references to "CMP-XXX" in "Resolved YYYY-MM-DD" notes below are kept as commit-trail context.)

### Buttons — `{components.button-default}` and variants

`src/components/ui/button.tsx` (Base UI under shadcn — wraps `ButtonPrimitive` from `@base-ui/react`, **not Radix**). CVA with **3 text sizes (xs/sm/default) + 3 icon sizes (icon-xs/icon-sm/icon)**, 8 style variants (default/outline/secondary/ghost/destructive/link/raised/promo), and a `shape` variant (default/pill/circle).

> **`default` is the largest size. There is no `lg`, no `xl`, no `icon-lg`.**
> Removed 2026-07-28 — see the Sizes bullet below. **This governs `Input` and
> `Select` too**, realigned the same way on 2026-08-10: those two now run
> `xs` 28 / `sm` 32 / `default` 36, with no `lg`. Every interactive control in
> the app tops out at 36px and names that size `default`.

- **Default:** `bg-primary text-primary-foreground` (neutral-900 / white). 36px tall (`h-9`), `px-3` (`px-2.5` both sides with an icon). `rounded-sm`. `text-sm font-medium`. Press: `active:not-aria-[haspopup]:scale-[0.98]` (scale-down) + `will-change-transform` (standardized 2026-06-18, replaced `active:translate-y-px`; the `not-aria-[haspopup]` gate keeps popover triggers from scaling). ← `button.tsx`
- **Sizes (realigned 2026-07-28):** xs `h-6 px-3 text-xs` (24px) · sm `h-8 px-3 text-xs` (32px) · **default `h-9 px-3 text-sm` (36px, the largest)**. Icon-only squares track the same heights: `icon-xs` 24 · `icon-sm` 32 · `icon` 36. **Every `<Button>` carries an explicit `size`** (no implicit default) so sizes can vary by breakpoint.
  - **Glyph size inside the icon squares:** `icon-xs` 14px (`size-3.5` — a 24px square cannot carry more) · `icon-sm` **16px** (`size-4`) · `icon` inherits. `icon-sm` moved 14 → 16 on **2026-08-04**: a 14px glyph in a 32px square read undersized next to its neighbours, most visibly on dialog close buttons. 16 is one step up the icon ladder (12 / 14 / 16 / 20) and is also shadcn's own default for the size. Changed at the primitive, so all 17 `icon-sm` call sites moved together.
  - **Why it moved.** The 2026-07-16 scale sat one step BELOW shadcn's (`default` = 32px where shadcn's is 36px), so every call site reached for `lg` to get an ordinary button. The audit found **62 uses of `lg` against 0 uses of `default`** across 120 buttons — the API's default was dead and `lg` was the real default. `lg` was renamed to `default` (pixel-identical, 63 call sites), then `lg` / `xl` / `icon-lg` were deleted outright. Audit: `docs/button-audit-7-28.md`.
  - **`lg` is not coming back.** If a control needs to be bigger than 36px it is not a button — it is a row, a card, or a tile. Ask before adding a size. Same rule for `Input` and `Select` since **2026-08-10**: their `lg` was renamed to `default` (pixel-identical — `lg` was already `defaultVariants.size`, so every field in the app was rendering at 36px under the wrong name) and the old 32px `default` was deleted. Two call sites depended on that deleted 32px/14px recipe and were resolved explicitly, not silently: the Security event-verdict Select took `sm` to hold its 32px pairing with the adjacent `Button size="sm"` (type 14 → 12px), and the Team invite-role Select took the new 36px `default` to match the email `Input` stacked directly above it (height 32 → 36px).
- **`icon-action` — the one responsive size** (added 2026-07-29). `size-8` below `lg`, `size-6` from `lg`, with the glyph stepping 16px → 14px to match. For a **dense action row** (reply feedback, message tools) that wants a compact box on a pointer device and a real tap target on touch. Consumer: the Ask AI reply feedback row.
  - **Pair it with `gap-0 px-0` → `lg:gap-1 lg:px-1` on the row.** The 8px the box gains on touch is exactly the 8px the gap gives up, so every glyph stays at the same x and the icon **pitch is unchanged** — the target grows into space the row already owned, moving no pixels.
  - **Pitch caps a non-overlapping target.** At a 32px pitch you cannot reach the 44px of WCAG 2.5.5 (AAA) / Apple HIG without widening the row or letting neighbouring targets overlap — and overlapping targets steal each other's taps, which fails worse than a small one. 32px clears **WCAG 2.2 SC 2.5.8 (AA, 24×24)** with room, on the surfaces where it matters.
  - **Why the breakpoint is inside the recipe.** `size` is a prop and cannot carry a breakpoint; overriding a primitive's size via a call-site `className` is hand-rolling. Putting the responsive step in the variant is the only form that stays composable and reusable — reach for this size rather than re-deriving it. It is deliberately the ONLY responsive entry in the scale; a second one needs the same justification, in writing, here.
- **Outline:** `border-border bg-card` + **`shadow-xs`** (added 2026-06-04, primitive-level so it cascades to every `variant="outline"`) — the subtle lift matches the Card recipe and reads against any backdrop. `box-shadow` is in the button's transition list, so it does not snap on hover.
- **`shape` — radius belongs to the primitive.** `default` inherits the base `rounded-sm`; `pill` = `rounded-full` for full-width list-style rows; `circle` = `rounded-full` for round icon keys. Never reach for `rounded-full` in a `<Button>` className. `circle` was added 2026-07-28 after the audit found **four** files that had each hand-rolled the same round-button recipe (Ask AI composer ×2, scroll-to-latest FAB, feedback FAB) instead of asking the primitive for it. Canonical uses: `ask-ai-empty-state.tsx` (`variant="outline" shape="pill" size="default"`), `ask-ai-composer.tsx` (`shape="circle" size="icon-xs|icon-sm"`).
  - **The feedback FAB was the last of those four**, converted 2026-08-04 with the `promo` variant (`variant="promo" shape="circle" size="icon"`). It is the one round key that keeps a call-site geometry override, `size-12`: a **48px viewport-anchored launcher**, one step above the 36px `icon` square, which is a toolbar glyph. Its two local motions also stay at the call site — the arbitrary `[transition:…]` that glides `right` at 300ms in lockstep with the Ask AI panel (the primitive's own transition list knows nothing about `right`), and the `hover-fine:-translate-y-px` lift. Everything else — fill, border, shadow, press, focus ring — now comes from the primitive. If a second 48px key ever appears, it becomes a size, not a second override.
- **`raised` variant** (added 2026-07-28). `border-border bg-control-raised text-accent-foreground shadow-sm`. A control that sits ON a panel and must read lifted off it — `--control-raised` is white in light and **neutral-700 in dark, i.e. lighter than a card**, which `outline` (on `--card`) cannot express. Consumers: the composer's add-context key, the scroll-to-latest FAB. Reach for `outline` first; `raised` only when the control must lift off a panel surface.
- **`promo` variant** (added 2026-08-04). `border-promo-cta-border bg-promo-cta text-promo-cta-foreground shadow-sm shadow-(color:--promo-cta-shadow) hover:bg-promo-cta-hover` — the solid-blue "Upgrade to Pro" key, and the only variant that is a **brand** surface rather than a semantic one (`--promo-*`, §2). It exists because **six** call sites had each pasted the same `bg-blue-700 text-white shadow-blue-700/30 … dark:bg-blue-600` string into a `className`: Policies (banner + benefits block), `ProUpgradeCard`, `FeedbackFab`, `PlanComparisonDialog`, TokenSavings. Reach for it only on an upgrade / plan CTA; every other primary action stays `default`.
  - **It carries an explicit border, and that is a fix.** Base is `border border-transparent bg-clip-padding`: the transparent border still reserves its 1px and the fill stops at the padding box, so a filled variant with no border colour paints **whatever is behind the button** in that ring — a visible white outline around the CTA once the Policies banner picked up its tint. `--promo-cta-border` is one ramp step lighter than the variant's own fill in each theme (blue-600 on blue-700 light, blue-500 on blue-600 dark), which closes the hole as a deliberate edge. Never fix this class of bug by dropping `bg-clip-padding` from the base — it is load-bearing for every bordered variant.
  - **Dark-theme contrast leans on that border.** Measured on the rendered Policies banner: fill-vs-surface is **11.7:1 light / 2.15:1 dark**, border-vs-surface **6.8:1 light / 3.5:1 dark**. The dark fill alone is under the 3:1 non-text minimum (WCAG 2.2 SC 1.4.11) against the tinted `bg-card` banner; the border is what carries the boundary there, so it is not optional decoration on this variant.
- **Icon padding is symmetric — 10px both sides** (revised 2026-07-28). A button that holds an icon draws its L/R padding in from 12px to **10px on BOTH sides**: `has-data-[icon=inline-start]:px-2.5` / `has-data-[icon=inline-end]:px-2.5`, on xs/sm/default/lg. This is shadcn's own rule (`sm: "h-8 px-3 has-[>svg]:px-2.5"`) expressed through this repo's `data-icon` markers instead of `>svg`. **10px is a deliberate carve-out from the 4px grid** — it is upstream's value and the one place `*.5` is sanctioned; see [`.claude/rules/design-tokens.md`](./.claude/rules/design-tokens.md).
  - **Superseded:** `pl-2`/`pr-2` (8px icon side vs 12px text side), which shipped 2026-07-16 and was retired 2026-07-28. It was a local invention — shadcn has no asymmetric button padding at any size — and the lopsided edge was visible on every icon+label button in the app (the top bar's Ask AI / Docs pair being the clearest case). `xl` is excluded: it is a full-width `justify-between` row, so drawing its edges in would fight the layout.
  - `SelectTrigger`'s `pl-3 pr-2` (see below) is a **separate** rule and still asymmetric — its chevron is trailing chrome the component owns, not a caller-supplied icon.

**Rule:** Primary action = `default` (neutral-900). Use `outline` for secondary, `ghost` for tertiary in toolbars/menus. `link` variant is for standalone link-buttons; **inline body-text links** use `<button>` with the underline affordance (see Inline links below).

### Inputs & Forms

- **Input** (`input.tsx`) — `bg-muted border-border rounded-sm h-9 px-3 text-sm text-foreground`. **`bg-muted` is the contract** (neutral-100 light / neutral-800 dark) — sits flush in filter rows. **ONE SIZE, and no `size` prop at all.** Every Input is 36px; `h-9 px-3 text-sm` lives in the base recipe, not a variant. `xs` (h-7) and `sm` (h-8) were deleted **2026-08-10** because zero of the 32 call sites passed a size, and `lg` had been renamed to `default` earlier the same day — so passing `size` is now a TYPE ERROR rather than a silent 4px regression. A field below 36px reads as chrome instead of something you type into. `<SelectTrigger>` deliberately keeps a `sm` step: a trigger you read and click can go compact, a field you type in cannot. **`surface` variant:** `card` (default) = `bg-muted`, for inputs on card/modal surfaces; `elevated` = `bg-card shadow-xs`, for search fields that sit OUTSIDE table cards on the page background, matching the adjacent outline buttons — use the variant, not a per-page `[&_input]` override. Focus: `border-ring ring-3 ring-ring/50` (neutral-tinted, not blue). Disabled: `disabled:bg-muted disabled:text-muted-foreground` (neutral-600 light). Invalid: `border-destructive ring-destructive/20`. **`--input` resolves to neutral-300** (bumped 2026-05-15 from neutral-200) — the stroke is one ramp step stronger than `--border` so unfilled form controls read as actionable. It is consumed by `Checkbox` / `Radio` (`border-input`) and `Switch` (`data-unchecked:bg-input`); `<Input>` itself strokes with `border-border`.
- **Textarea** (`textarea.tsx`) — same surface as Input. `min-h-16`, `field-sizing-content`, `py-3 px-4`.
- **InputGroup** (`input-group.tsx`) — wrapper for inputs with addons (icon, kbd, button). `h-9`, same surface as Input.
- **Field** (`field.tsx`) — composes `<FieldLabel>` + `<FieldDescription>` + `<FieldError>` + control. Default gap-y between fields = 16px. No surface chrome.
- **Label** (`label.tsx`) — `text-sm leading-none font-medium`. **`font-medium` minimum** — `font-normal` reads as ambient body, not a label.
- **Checkbox** (`checkbox.tsx`) — `size-4 rounded-[4px]`, `border-input` unchecked / `bg-primary` checked. Hit-target via `after:-inset-x-3 after:-inset-y-2`. Disabled treatment is `data-disabled:cursor-not-allowed data-disabled:opacity-50` (2026-08-25). **Generalizable rule:** Base UI renders controls as non-native elements (`<span role="checkbox">`), so the `:disabled` pseudo-class never matches — disabled styling on any Base UI control takes the `data-disabled:` variant (Switch and Select/Menu already do; radio-group.tsx still carries the dead `disabled:` form and needs the same swap the first time anything disables a radio).
- **Radio** (`radio-group.tsx`) — `size-4 rounded-full`, same color treatment as Checkbox.
- **Switch** (`switch.tsx`) — three sizes, driven by `data-size` (not cva): `sm` `h-[14px] w-[24px]` / `default` `h-5 w-8` (20×32) / `lg` `h-6 w-10` (24×40). Thumb `rounded-full`, tracking the track: `size-3` / `size-4` / `size-5`. `data-checked:bg-primary` / `data-unchecked:bg-input`. **Switch's `lg` is its own scale, unrelated to the deleted Button/Input/Select `lg`** — a toggle is sized to the thumb it carries, not to the 32/36 control ladder.
- **Stepper** (`stepper.tsx`, codified 2026-08-05) — **vertical numbered step rail for a multi-step form.** Compound: `<Stepper>` (`<ol>`) → `<StepperItem index state>` (`<li>`; owns the connector rail and `aria-current="step"`) → `<StepperIndicator>` + `<StepperBody>` → `<StepperTitle>` + `<StepperPanel>`. **`state` is the only visual axis** and the consumer supplies it — the primitive holds no step state, because a wizard already owns "which step am I on" plus per-step validity and a second copy could only disagree with it. `index` is passed, not derived from DOM order, so steps can render conditionally without the numbering shifting.
  - **Three states, one table:** `upcoming` — indicator `bg-muted text-muted-foreground`, title `text-muted-foreground`, panel **not rendered**. `active` — indicator `bg-primary text-primary-foreground`, title `text-foreground`, panel rendered. `complete` — indicator `bg-primary` carrying a 14px `Check`, title `text-muted-foreground`, panel **not rendered**.
  - **Active and complete share the filled circle deliberately** — together they read as one continuous "how far you have got" rail, and the glyph inside (numeral vs check) carries the difference. The **active title is the only full-ink title** on the rail; that is the "you are here" signal. A finished step recedes on colour, never on weight (§3 quiet-labels corollary).
  - **Indicator:** `size-6 rounded-full` circle holding the 1-based index in the **badge voice** (`type-mono-12`) — a step index is a counter, the same reading as `<TabsCount>`, and tabular figures keep `1` and `3` optically centred in the same box. An `sr-only` span announces `Step N, {not started | current step | completed}`; the numeral and the check are both `aria-hidden`, since neither announces position or progress.
  - **Connector:** a 1px `bg-border` rail at `left-3` (the 24px circle's centre line) running `top-6 bottom-0`, so it drops out of one circle's bottom edge and lands on the next. **Hidden on the last item** — a rail running into open space reads as a step that failed to render. Deliberately NOT tinted per state: the check glyphs already carry completion, and a filled rail would be a second, redundant progress signal.
  - **Rhythm:** `gap-3` (12px, compound tier) indicator → body; `pb-6` between steps with `last:pb-0`; `gap-4` title → panel. Titles sit in a `min-h-6` flex box so a 20px `type-label-14` line optically centres against the 24px circle instead of sitting 2px high.
  - **The panel is unmounted, not `hidden`.** Every field in a stepped form is controlled by the consumer, so dropping the DOM loses nothing — and "Back never loses what you typed" becomes a property of the consumer's state rather than an accident of which nodes happened to survive.
  - **`<StepperTitle onClick>` renders its label as a real `<button>`** — the "click a finished step to return to it" affordance. Recipe: `rounded-xs` focus ring, `after:-inset-y-2` invisible hit area, `hover:text-foreground`, and the global `active:scale-[0.98]` press with `will-change-transform`. Its transition list is `transition-[color,scale]` — **singular `color`**, following `<IconActionButton>` and not `<BackLink>`: `colors` is not a valid `transition-property`, so the `transition-[colors,…]` spelling elsewhere in the codebase silently drops the ink fade and only animates the other entries. **Not `Button` and not `TextLink`** — a step title is neither a chrome box nor an underlined inline-prose link; same call `<BackLink>` made, so it carries the same shape.
  - Only consumer: `AlertRuleWizard` (`pages/alerts/`). A second stepped flow composes this primitive — **don't hand-roll numbered circles.**

**Rule:** Group related fields with `<FieldSet>` + `<FieldLegend>` (text-base font-medium). Validation state via ring + `border-destructive`, never background tint.

**Field group label** (codified 2026-05-13 from Billing's AutoRechargeDialog) — when a control group sits *under* its label (radiogroup of preset tiles, slider with value display, segmented control) inside a form or dialog, the label is `font-sans text-sm font-medium text-neutral-500 m-0` on a `<p>` (or `<FieldLegend variant="label">` if the group is a true `<fieldset>`). **The color is the load-bearing tell:** `text-neutral-500` recedes so the values lead the eye — this is what distinguishes a *group label* from `<Label>` (which pairs 1:1 with a single input and stays at the default neutral-900 weight). Don't use Eyebrow for this slot — mono UPPERCASE on a group label reads as a chrome strip, not as a form heading; the primitive's own header note explicitly retires it from modal title blocks for the same reason. **Don't promote to neutral-900** even when the label feels like it should be "louder" — louder is what `<Label>` already does for paired inputs; a group label by definition is summarizing what's below, so it stays quiet on purpose.

### Cards & Containers

- **Card** (`card.tsx`) — `rounded-md bg-white border border-border shadow-xs py-4 text-sm text-neutral-900`. **Border + `shadow-xs`, NOT shadow-as-border** (migrated 2026-05-15 from the old `shadow-(--shadow-border)` recipe — see §5). Radius is `rounded-md` (8px) — the card / surface tier (2026-05-10); buttons and chrome stay at `rounded-sm` (6px) so cards read a discrete material step up. **`density` variant** (`default` | `flush`): default = `gap-4 py-4`; flush = `gap-0 py-0` — used whenever a `<Table>` or full-bleed feed (FilterToolbar + Table + TablePaginationFooter stack) lives directly inside the Card and supplies its own internal border-t rhythm. **`tone` variant** (`default` | `danger`, added 2026-08-05): default = `border-border`; danger repoints the edge to **`border-destructive-subtle`** — the 30% rung of the destructive alpha ladder (§2), which derives from `--destructive` and so reads red in both themes on its own (danger-600 light / danger-400 dark). For surfaces whose only action is irreversible. **Deliberately quiet, and the same rung in both themes** — the edge only has to say "this card is dangerous"; at 100% and at 50% it out-shouted the destructive `<Button>` it frames. 30% was verified to still read as danger in light AND dark, so no per-theme step is needed. Use the named rung, never a bare `border-destructive/30`. **Edge only** — fill stays `bg-card`, ink stays neutral, padding and rhythm are untouched, so the card still reads as a peer of the neutral cards beside it and the destructive `<Button>` inside stays the loudest element on it. Consumers: the Settings "Account management" pair (Cancel plan / Delete account and data). Never paint a danger border onto a call site's `className` — the surface tone is the primitive's, like `size` and `density`. Composition: `<Card>` (gap-4 col) → `<CardHeader>` (px-4 grid) → `<CardTitle>` (text-base font-medium leading-snug) → `<CardDescription>` (text-sm/5 text-neutral-500) → `<CardContent>` (px-4) → `<CardFooter>` (p-4, white, **no inner border, no wash** — structural separation comes from spacing alone; the Card's own `border` carries the edge). When a `<CardFooter>` is present, Card auto-applies `pb-0` so the footer hugs the bottom edge. Compact: `data-[size=sm]` → `gap-3 py-3`. **Cross-ref:** mirrors `<DialogFooter>` (short-modal variant) — no inner border, gestalt from spacing. The scroll-modal `<DialogScrollFooter>` is the *other* footer pattern (border-t + tighter `py-4`) — used when content scrolls above the action band.
- **KpiRail** (`kpi-rail.tsx`, codified 2026-05-10) — bordered single-row container with inset divider hairlines between children. Same chrome migration as Card on 2026-05-15. API: `<KpiRail columns={2|3|4|5|6}>{children}</KpiRail>`. Recipe: container `grid rounded-md bg-white border border-border shadow-xs overflow-hidden`; every child after the first wrapped in a divider div with `before:absolute before:left-0 before:inset-y-4 before:w-px before:bg-neutral-200` — hairline doesn't reach the rounded corners. Tile shape (`<KpiTile>` is the canonical filler — see Hero Numerics & KPIs; CompactKpi / custom mono tiles / plain divs also legal) is the caller's call; only the shell + divider treatment is enforced. Canonical consumer: Overview's 4-tile rail (Dashboard.tsx, 2026-05-17 redesign).

  **Card padding is locked at 16px. Do NOT pass padding/gap classes (`px-N`, `py-N`, `p-N`, `gap-N`) on `<Card>`, `<CardHeader>`, `<CardContent>`, or `<CardFooter>` from composed pages.** If you find yourself reaching for `px-5`, `py-5`, `gap-5`, `-mx-5` etc. — stop. The primitive's defaults are the contract; reach back to the design system if a surface needs different rhythm. Legitimate overrides are layout-only: `min-w-0`, `col-span-N`, `w-[Npx]`, `flex-1`, `items-center`. Any primitive-padding override must be justified with a comment citing the variant it represents, and ideally promoted to a primitive variant (`size="sm"` / `size="lg"`) rather than inlined.
- **CodeCard** (`code-card.tsx`) — code-preview card with header strip + syntax-highlighted body. Uses `<CodeBlock>` driving `--color-syntax-*` tokens. Top-right copy affordance via `<CopyButton>`.
- **SidebarUpgradeCard** (`sidebar-upgrade-card.tsx`, built 2026-08-04 from Figma `sidebar-footer-light` 1255:6256 / `sidebar-footer-dark` 1256:6340) — the "Upgrade to Pro plan" promo pinned beneath the nav in the expanded rail and the mobile nav Sheet. **The one branded surface in an otherwise neutral rail**, and the only consumer of the `--promo-*` family (§2). Recipe: `rounded-md border border-promo-border bg-card p-3 shadow-sm shadow-(color:--promo-shadow) overflow-hidden`, with a full-bleed `.sidebar-upgrade-texture` layer behind the copy, a `type-label-12` title on `text-foreground` over a `gap-1` and a `type-copy-10` line on `text-muted-foreground`, and a 24px `<SparklesIcon>` at `opacity-50` inset 8px from the top right on `text-promo-accent`.

  **The copy is neutral, not blue** (2026-08-04). Title `text-foreground`, sub-copy `text-muted-foreground` — the same two ink roles every other card in the app uses. The blue belongs to the *chrome* (border, texture, sparkle, shadow); the words read as the app's own voice on top of it. This replaced `--promo-foreground` plus an `opacity-70` knock-back on the 10px line — the muted token carries that de-emphasis on its own, at a real contrast ratio in both themes, so the opacity is gone. The Policies Free-plan banner follows the same rule (lead-in `text-foreground`, body `text-muted-foreground`), which left `--promo-foreground` with **no consumer** — see §2.

  **Width-flexible, height-driven by content** — the two Figma twins draw it at 220 and 248 wide inside 236 / 264 rails, which is the spec saying "fill the container", not "be 220px". Nothing is pinned to a pixel height.

  **Rendering is gated by `upgradePath`.** `Sidebar` / `SidebarPanel` take the route the CTA navigates to; passing it renders the card, omitting it renders nothing. `DashboardChrome` supplies `/billing-free` or `/billing-default` on the two non-PRO surfaces and `undefined` on PRO — the same tier signal that drives the nav lock icons and the workspace badge (`lib/plan.ts`), so the promo and the locks can never disagree. It lands on that tier's own Billing page, never the PRO one, so the CTA does not jump the user across workspaces. **No collapsed variant exists** — the design has none and the 64px icon rail has nowhere to put one.

  **Rest state is the Figma frame exactly; interaction comes from house conventions, not invention.** It is a real `<button>`, so the shared `<SparklesIcon>` picks up its closest-button hover retrofit for free; press is the global `active:scale-[0.98]`; focus is the standard `ring-3 ring-ring/50`. The texture layer is `aria-hidden` + `pointer-events-none`, and the card sits **outside** the `<nav>` landmark — it is a promo, not a destination.

  **The dot texture is CSS, not an asset** (`.sidebar-upgrade-texture` in `index.css`). Figma tiles an 8px frame holding a 1px dot, HORIZONTAL_HEXAGONAL at `scalingFactor` 0.75 with 0.75 spacing, which resolves to a staggered grid on a **10.5px pitch carrying a 0.75px dot**. Two radial-gradients on a 10.5 × 21 tile reproduce it exactly at any width and any DPR for no bytes, and keep their pitch as the rail resizes — same reasoning as `.ask-ai-canvas`.

**Rule:** Cards never touch — `gap-4` between cards in a grid; the canvas (neutral-100) reads through. `<Card>` carries its own `border border-border shadow-xs` — don't add extra `border` classes on top of the primitive. The previous "shadow ring IS the border" rule was retired on 2026-05-15 with the border-token migration.

### Selectors

- **Tabs** (`tabs.tsx`) — sliding white indicator on active trigger (200ms ease-out, transform+width). Two variants: `default` (pill-on-well, `bg-muted rounded-sm h-8 p-1`, active trigger `bg-background rounded-xs`) and `line` (underline, transparent track, active trigger gets a 2px neutral-900 underline). Vertical orientation supported on the default variant.

**Rule (`line` variant — trigger contract):**

- **Trigger vertical padding is `pt-2 pb-3`** (8px top, 12px bottom). Codified 2026-05-21 — earlier `pt-4 pb-3` was disproportionate for the page-level register where most line tabs live (dialog headers, page sub-nav). Every line-variant tab strip site-wide uses this rhythm; no usage-site overrides needed.
- **Active trigger never gets a hover background.** The trigger's height is `calc(100%-1px)` (1px short of the TabsList) and the indicator (`bottom-[-1px] h-0.5`) overlaps the trigger's bottom 1px by one pixel — so any `hover:bg-*` on the active trigger would clip the indicator from 2px to 1px on rollover. The primitive applies `data-active:hover:bg-transparent` for `variant="line"` to lock this; the indicator stays full height. Hover affordance still fires on non-active triggers (`bg-neutral-100`) because those don't carry an indicator. Codified 2026-05-21 after the Audit-record modal regression.
- **Segmented** (`segmented.tsx`) — pill-style selector, same sliding-indicator idiom as Tabs default. `bg-muted rounded-sm overflow-clip`. Sizes: default `h-8`, sm `h-7`. Variants: `pill` (default) and `group` (adjacent borders, neutral-900 fill on selected — rare).
- **SegmentedPill** (`segmented-pill.tsx`) — view-scope toggles in toolbars. **Don't add as an extra row** — view-scope controls live in the existing toolbar. Requests uses `<SegmentedPill size="sm">` (1H / 24H / 7D / 30D) anchored right via `ml-auto` so the toolbar splits cleanly into facets-left + time-scope-right. Pairs with a custom-range `<DateRangePicker>` (Base UI Popover + react-day-picker v10) for ranges outside the preset window; selecting one clears the other. **Internal-button padding (2026-07-16):** the rail sets `data-spacing=0`, whose `ToggleGroupItem` variant forces `px-2` (8px) — so a plain `px-*` base can't win. Both sizes override that same variant to `px-3` (12px L/R); only the box height is size-aware (rail `sm` h-8 / `default` h-10; item `sm` h-6 / `default` h-8).
- **SegmentedPill track border (codified 2026-06-01):** the track carries a `border-border` hairline — **not** a borderless `border-transparent` track. The track fill is `bg-neutral-100`, the *same* tone as the page surface (`--background` = neutral-100), so without an edge the unselected segments read as floating on the canvas and only the white selected thumb is legible. The border gives the control a defined boundary against the same-tone surface and keeps it a visual peer of the bordered controls it sits beside — Select triggers and outline Buttons like the `Custom` range button it pairs with. The border slot was always reserved (previously `transparent`), so making it visible is a **zero-layout-shift** change. `segmented.tsx`'s pill variant already used `border-border`; the two segmented primitives are now aligned. Supersedes the earlier Paper spec WW0-0 "effectively borderless track" note.

**Rule (Tabs vs Segmented — when to pick which):**

- **`Tabs variant="line"`** = sibling sub-pages of the same surface. Each tab represents content that would map to its own URL path (`/team/members`, `/team/invitations`, `/settings/general`). Different content semantics, equal stature, primary navigation within the page. Used by Team, Models (modality tabs), and the Request detail modal. Matches Vercel's settings/team/billing/integrations sub-nav, Material 3, IBM Carbon.
- **`Tabs variant="default"`** (pill-on-well) = secondary view scope where the items are stylistic peers but the surface pattern still calls for full-page tab semantics. Rare at page-header level — most page-header tab use cases are line. Reserve for nested tab strips inside a card where the line variant would compete with surrounding chrome.
- **`Segmented` / `SegmentedPill`** = mutually-exclusive view filters of the *same* data, lives inside a toolbar or panel, not page-level. Time-range pickers (24h / 7d / 30d), chart-type toggles (Bar / Line), unit switchers, code-vs-preview inside a card. Constrained-width by design.

The semantic test: are these *pages of the surface* (line tabs) or *filters/views of the same data* (segmented)? If you'd give each one its own URL, it's a tab. If they're alternate lenses on shared content, they're segmented.

- **Select** (`select.tsx`) — Base UI. Trigger: `bg-muted border-border rounded-sm h-9 text-sm`. **Two sizes:** `sm` `h-8 text-xs` (32px) · **`default` `h-9 text-sm`** (36px, the primitive default, identical to `<Input>` so the two sit flush in a filter row). `sm` is for compact chrome inside an already-dense row — the `DateRangePicker`'s four month/year triggers, `TablePaginationFooter`'s rows-per-page, and a few card-header range selectors. `xs` was deleted unused **2026-08-10**; `lg` was renamed to `default` the same day. Content: `rounded-sm border border-border bg-card shadow-md text-popover-foreground` with **`p-1`** (2026-06-04, was `py-1`) so each `rounded-xs` item insets 4px from the popup edge and the highlighted/selected row never bleeds edge-to-edge — same inset recipe as `Menu`. Item: `h-8 rounded-xs py-0 pr-8 pl-3 text-sm` (the 32px row height carries the vertical rhythm, so there is no `py-*`; `pr-8` reserves the checkmark gutter). **Asymmetric padding** `pl-3 pr-2` across all sizes (12px text side / 8px chevron side; default dropped from `pl-4 pr-3` on 2026-07-16) — optical balance: text side wants more air, chevron has built-in bounding-box whitespace. Long lists use `<SelectGroup>` + `<SelectLabel>` + `<SelectSeparator>` to group (e.g. First-party vs Marketplace). **Chevron rotates 180° while open** (2026-06-04): trigger carries `group/select`, the `ChevronDownIcon` is `group-aria-expanded/select:rotate-180 transition-transform duration-150 ease-out motion-reduce:transition-none` — transform-only, 150ms, the `--ease-out` curve; transitions back to 0 on close. **SelectValue shows the item label, not the raw value** — a context map collects `value → children` from `SelectItem`s (Base UI's `Select.Value` would otherwise render the raw value, e.g. `all` instead of `All models`). **The field `<Label>` must NOT use `htmlFor` pointing at the trigger** — a `<label for>` forwards clicks to its control, so clicking the field title would open the dropdown; give the trigger an `aria-label` for the accessible name instead.
- **Dropdown positioning standard (codified 2026-06-04):** every overlay primitive — `Select`, `Popover`, `Menu`, `DateRangePicker` — defaults to open BELOW the trigger (`side="bottom"`), right-aligned to it (`align="end"`), with an 8px gap (`sideOffset={8}`). `Select` sets `alignItemWithTrigger={false}` so it renders as a real dropdown that **flips up** when near the viewport bottom (Base UI collision avoidance), NOT the macOS-style overlay that centered the selected item over the trigger. Left-anchored triggers (sidebar workspace switcher, side-opening user menu) keep their intentional `align="start"` / non-bottom side.
- **Toggle** (`toggle.tsx`) — `rounded-sm h-8 px-3 text-sm font-medium`, `data-[state=on]:bg-muted`. Wrap with `<ToggleGroup>` for multi-select.

**Rule (filter-pill toolbar):** `<SelectTrigger size="sm">` filter pills in dense table toolbars render **chevron only, no leading category icon**. Generic filter glyphs are noise next to the chevron-down. Exception: dropdowns where a leading icon carries category-specific info AND is used consistently across 4+ filters in the same surface.

**Rule (toolbar layout):** Search fixed-width on left; Select filters clustered right; Sort dropdowns anchored far right via `ml-auto` to differentiate from narrowing filters.

### Lists / Tables

- **Table** (`table.tsx`) — body of every list view. **No standalone chrome** — Table composes inside a `<Card density="flush">` which supplies the rounded-md + border + shadow-xs shell. Table itself adds only `overflow-x-auto` on the wrapper, plus `border-t border-border` on the thead row when it doesn't sit at the Card's top edge (so toolbar → table → pagination stacks render the separator hairlines correctly). Header: `bg-neutral-50` + `border-t border-border`. **Header row height `h-10` (40px, raised from 36 on 2026-06-04).** **Header cell: sans Title Case `font-medium text-neutral-500`** — NOT mono UPPERCASE eyebrow. Outer cell padding `px-4` (first/last col), inner `px-3`. Row hover: `bg-neutral-50`.
- **SortableTableHead** (`table.tsx`, codified 2026-06-04) — drop-in `<TableHead>` replacement for sortable columns. Click-to-sort header: a `⇅` (ChevronsUpDown) glyph **fades in on hover** when the column is inactive and **persists as a directional `↑`/`↓`** (ArrowUp/ArrowDown) when it's the active sort. **Three-state cycle:** click 1 = ascending, 2 = descending, 3 = unsorted (restores authored order) — never locks the user in. Click target is **content-width** (label + glyph, `max-w-1/2`), so the empty cell area isn't clickable. `aria-sort` on the `<th>`. **Numeric columns (`numeric` prop, right-aligned) put the glyph to the LEFT of the label (`flex-row-reverse`)** so the label stays flush to the column's right edge and lines up with the right-aligned data below it; without this the glyph pushes the label left of the numbers (added 2026-06-04). Left-aligned columns keep label-then-glyph. Pairs with the `useTableSort` hook + `sortRows` / `parseNumeric` helpers (`src/hooks/use-table-sort.ts`) — local state, NO TanStack; the table supplies a `getValue(row, key)` accessor (numeric columns parse via `parseNumeric`, em-dash/empty → null → sorts last). Sort runs after filter/search, before pagination; default unsorted. Applied to every data table; action/checkbox/tooltip-header/no-comparable columns stay plain `<TableHead>`. **Don't hand-roll** — extend the primitive.
- **Pagination** (`pagination.tsx`) — **renders as `<button type="button">`, not `<a>`** (no router in this app; visual = link styling, semantics = button). Same conversion applies to inline anchors in composed surfaces (modal subtitle refs, row-title links).
- **TablePaginationFooter** (`table-pagination-footer.tsx`) — **single source of truth for table pagination chrome.** Composes count summary + rows-per-page Select + windowed page links. State (page + rowsPerPage) lives in parent; primitive is controlled. `buildPageWindow` helper exported. **Don't hand-roll** — extend the primitive.

- **TableEmptyState** (`table-empty-state.tsx`, codified 2026-05-16) — **canonical empty state for every table-bearing card.** Extracted from `AuditTrail.tsx` after the recipe was applied across 7 paginated tables (Activity `UsageByKey`, Conversations, Requests, Security, Team Members + Invitations, Models, AuditTrail). API: `<TableEmptyState title="No audit events" body="…" icon? action? />`. Recipe (locked):
  - **Fires under two conditions, single render branch:** (1) the underlying row set is empty (fresh workspace, no data ever); (2) the active range / kind filter / search produces zero matches. Both paths render the same component — no per-scenario branching.
  - **Hide the toolbar** when empty (`{isEmpty ? null : <Toolbar />}`). Search and filter chrome above an empty state reads as broken; the page-level range selector remains visible for the user to broaden the window.
  - **Hide the `<TablePaginationFooter>`** alongside the table — nothing to paginate.
  - **Internal layout:** `<div className="py-6">` wrapper around `<EmptyState>` for 24px top/bottom breathing room outside the EmptyState's own `py-12`. `className="rounded-none shadow-none"` on the EmptyState strips its card chrome since it's nested inside the parent `<Card density="flush">`.
  - **Default icon:** `FileText` (lucide "document") at `size-5` inside a `size-12 rounded-md bg-muted` chip. The canonical "log / record / event" affordance. Override via the `icon` prop only when the table's content is non-record.
  - **Copy contract:** title is `No {entity}` (e.g. "No audit events", "No requests", "No members"). Body describes what data would appear once it arrives — written to read cleanly for *both* fresh-workspace AND over-filtered states.
  - **Optional `action` prop** for an in-card recovery button (e.g. Models' "Clear filters", Team Invitations' "Invite member"). Use sparingly — when the page-level chrome already provides recovery, no action is needed (AuditTrail / Activity / Conversations / Requests / Security all omit it).
  - **Optional `footnote` prop (added 2026-08-25, passes through to `<EmptyState>`)** — a second line under `body`, one tier quieter at `type-copy-12 text-muted-foreground`, sharing a `gap-1` stack with the body so it hugs the sentence it qualifies while `gap-3` still separates the pair from the heading. For a *where-did-it-go / where-does-it-land* pointer that would bloat the body sentence — the case it was added for is `/notifications`' Archive tab explaining that the bell's "Archive all" files rows there. **Not a second body**: if the sentence is load-bearing it belongs in `body`. Callers that omit it render byte-identically (single-child flex column is a visual no-op), so this is additive for all seven existing consumers.
  - Canonical usage: `AuditTrail.tsx`. **Don't hand-roll** the py-6 / EmptyState shape — extend this primitive if a new variant is needed. Guardrails' "no limits configured" empty state is intentionally separate (page-level, not table-level) and stays on bare `<EmptyState>`.

- **RowActionButton** (`row-action-button.tsx`) — **the row-as-button pattern** (locked 2026-05-09 after WIG audit). `<tr role="button" tabIndex={0}>` is invalid ARIA (`<tr>` only legally carries `role="row"`); the row's **primary identifier cell** wraps content in a real `<button>` instead. The `<tr>` keeps default semantics with `onClick` as a mouse-only convenience; the button carries the `aria-label` + focus ring + `e.stopPropagation()` so the two don't double-fire. API: `<RowActionButton layout="row|stack|inline" onClick={...} aria-label="Inspect ...">{cell content}</RowActionButton>`. Layout variants: `row` for icon + text cells (Requests, Models), `stack` for title + sub-id stacks (Conversations), `inline` for single-text cells (Security). Consumed by Requests / Conversations / Security / Models. **Don't hand-roll the recipe** — extend the primitive (new layout variant) if a new shape is needed.
- **DetailList / DetailRow** (`detail-list.tsx`, codified 2026-05-11) — canonical label/value list used inside modal body sections ("Details", "Context", "Security scan"). Recipe: list shell `rounded-xs border border-border overflow-hidden`; row `grid grid-cols-4 gap-4 items-center py-3 border-b border-border last:border-b-0` with label in `pl-4 font-sans text-sm font-medium text-neutral-500` and value in `col-span-3 pr-4` (consumer styles the inner content). **Inside a modal, override to `rounded-md` at the usage site** (8px modal-interior radius — see §6 / memory `feedback_modal-surface-radius`). API: `<DetailList><DetailRow label="…" value={…} /></DetailList>`. Consumed by the Request detail modal (Details tab), the Threat event modal (Context section), and the Audit Record dialog. **Don't hand-roll a `<dl>` / `grid-cols-[36%_1fr]` / divide-y variant** — extend this primitive.

**Three-tier body-cell ink density** (locked):

| Tone | Use |
| --- | --- |
| `text-neutral-500` | Context-only fragments: sub-IDs nested under a larger identifier (e.g. `(sk-gw-NNN)` parenthetical), gateway-id suffixes, separators. **Not timestamps.** |
| `text-neutral-800` | Body data (IDs, keys, numerics, initiators, **dates / times / relative-ago / countdowns**). Date/time cells live here — they're row payload, not scaffolding, even when they read as "context." Locked 2026-05-16 after un-muting Conversations / Team / Dashboard / AuditTrail date columns. |
| `text-neutral-900` | Row's primary identifier (model name with VendorAvatar, row title, member name) |
| `text-neutral-400` | Missing-data dashes (`—`) — always paired with an `sr-only` semantic for screen reader users (see Activity `:1611`, AuditTrail `:273` Anchor cell). |

**No `neutral-600` / `neutral-700` body-cell tones** — middle-tier neutrals collide with the three-tier policy.

**Numeric column right-alignment**: numerics are mono tabular AND `text-right` on TableHead + TableCell. `tabular-nums` alone fixes intra-row digit width but not inter-row drift when `4,051` sits above `52,810` — right-edge anchoring places the ones-place at a fixed x across rows.

**Row-state indicator slot:** when a numeric column carries a conditional indicator (slow-row icon, etc.), reserve a fixed-width slot in the **leading** position on every row — slow renders the icon, non-slow renders an invisible placeholder — so the digit column doesn't drift between states.

### Toolbars & search

- **FilterToolbar** (`filter-toolbar.tsx`, codified 2026-05-17) — canonical wrapper for table toolbars. Recipe: `flex items-center gap-2 p-4`. **Always lives at the top of a `<Card density="flush">`**, above the `<Table>`. Children are caller-supplied — `<SearchInput>` first, `<Select>` filter pills middle, sort or "Add X" buttons right (use `className="ml-auto"` on the trailing item to split the row). Extracted after 7 hand-rolled occurrences of the same `flex items-center gap-2 p-4` block across Team / Conversations / Requests / Models / Activity / AuditTrail / Security. **Hide when the table is empty** — search and filter chrome above a `<TableEmptyState>` reads as broken (see Lists/Tables empty-state recipe).
- **SearchInput** (`search-input.tsx`) — `<Input>` composition with a leading `lucide` Search icon at `size-3.5 text-muted-foreground`, inheriting `<Input>`'s single 36px size (`h-9 px-3 text-sm`). It carried an explicit `size="lg"` until the 2026-08-10 realign, which renamed that size to `default` and then deleted the `size` prop entirely; the rendered height never moved. Icon sits at `left-3 top-1/2 -translate-y-1/2` with `pl-8` on the input to clear it. Width: wrapper is locked at `w-96` (384px) — a fixed width keeps the toolbar predictable across pages; override via `className` only when a specific toolbar needs a different shape. Don't hand-roll the icon + input compose; use this primitive.

### Avatar & timestamp chrome

- **Monogram** (`monogram.tsx`, codified 2026-05-17) — avatar initial chip. Sizes: `sm` (size-4, single initial, used in dense table rows) / `md` (size-7, two initials — used on the top-bar workspace switcher and Team rows). Tones: `blue` / `rose` / `emerald` / `amber` / `ink` — all saturated 700-step bg + white fg from the existing ramps (no chart-palette borrowing). Renders as `aria-hidden` `<span>` — pair with the underlying name for screen-reader users. Initials are caller-supplied so each consumer can derive them their own way (Team uses 2-char `initialsOf(name)`; Activity uses first-char-of-first-word).
- **Timestamp** (`timestamp.tsx`) — canonical date/time table cell. Visible text is the absolute timestamp by default (`format="timestamp"` — LangChain-style); hover/focus reveals the relative time in a `<Tooltip>`. Two other modes: `format="dateNumeric"` (compact date for dense rows, full timestamp in the tooltip), `format="relative"` (relative-first surface, absolute in the tooltip). For `date === null` renders "Never" with no tooltip. **Use in every table cell that surfaces a date or datetime** — pairs Olivia's "is this fresh?" scan with Devon's "greppable absolute" need without forcing a column choice. Visible text lives in the `text-neutral-800` data tier (see Lists/Tables three-tier table ink).

### Popover, Tooltip, Separator

- **Popover** (`popover.tsx`) — Base UI `Popover.*` thin wrapper. Surface: `rounded-sm bg-popover shadow-md` (menu/popover tier). Used by the `<DateRangePicker>` trigger (custom-range surface on the Requests time-scope toolbar), the Mark PIJ event slide (Security page), and `<NotificationsMenu>` (top-bar bell, 2026-08-24). Same dismiss-flicker rule as Dialog: needs `data-closed:fill-mode-forwards` on both popup and overlay, and `onOpenChangeComplete` for URL deep-link cleanup.
- **Tooltip** (`tooltip.tsx`) — Base UI `Tooltip.*` thin wrapper. Surface: `rounded-sm bg-popover shadow-md` with `text-xs` body. Mandatory on every `<Timestamp>` (relative ↔ absolute pairing), on Cost-column dashes for BYOK rows (Requests), and on truncated identifiers. Trigger needs `tabIndex={0}` whenever the tooltip carries content keyboard users must reach (BYOK Info icon, Cost cell dash).
- **Separator** (`separator.tsx`) — Base UI `Separator` wrapper. Renders a 1px `bg-border` rule. Use for in-card section breaks where `border-t` on the next child would couple to the child instead of belonging to the parent layout. Rare — most rhythm in this codebase comes from `border-t` + spacing rather than dedicated rules.

### Modal / Drawer

- **Dialog** (`dialog.tsx`) — centered modal. **Modal tier:** `rounded-xl` (**16px LOCKED**) + `shadow-lg`. Overlay: `bg-neutral-900/40 backdrop-blur-xs`. The primitive ships **three content shells** and a set of section slots so every modal in the project composes from the same source — *do not* hand-roll modal chrome on a consumer.

  **Content shells:**
  - `<DialogContent>` — short-form modal (Team Invite member, AlertDialog destructive confirms). `bg-white rounded-xl border border-neutral-200 shadow-lg p-6 max-w-sm`. **Padding is a `density` prop** — same prop name as `<Card>`'s. `density="default"` (**the default**) is `p-6` / **24px: the modal shape** — a full card with header, meta, and body. `density="compact"` is `p-4` / **16px: the dialog shape** — a single-purpose surface holding one control (Security event → Add a note). 24px is the default because padding was bumped from `p-4` → `p-6` on 2026-05-11 for the live detail modals. The density supplies its padding class *ahead* of `className` in the `cn()`, so a consumer override still wins — that is how `<DialogScrollContent>` keeps its `p-0`. Pairs with `<DialogHeader>` (`flex flex-col gap-2`) + `<DialogFooter>` (`mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end` — no border; the `mt-2` lifts the action band ~24px below the last field for a "now commit" gestalt).
  - `<DialogScrollContent>` — scroll-shell variant for detail modals (Requests / Conversations / Security). Adds `max-h-[90vh] gap-0 p-0 overflow-hidden flex flex-col` on top of `<DialogContent>`; sections inside manage their own padding so a fixed footer can sit flush against the bottom edge while the body scrolls between fixed header/footer.
  - `<DialogStaticContent>` — static variant for spec-sheet / inline-rendered modals. Same outer shell (rounded, white, border, shadow) but no portal / no fixed positioning — renders inline on a 2D spec page. `relative` is baked in so the close button can absolute-position against the shell. **Renders its own close button** when `onClose` is passed — consumers never hand-roll the X-button styles (`<Button variant="ghost" size="icon-sm" className="absolute top-3 right-3">` is the primitive's contract, not a recipe each consumer remembers). Currently no live consumer in `src/pages/` after the artboard sweep; primitive retained for future inline-modal needs.

  **Section slots (used by both `<DialogScrollContent>` and `<DialogStaticContent>`):**
  - `<DialogScrollHeader>` — `shrink-0 flex flex-col gap-3 px-6 pt-6`. Title block plus any extra sibling rows (Conversation modal's identity row with `Copy ID` button).
  - `<DialogScrollSummary>` — `shrink-0 px-6 pt-6`. Optional fixed KPI rail between header and body (Requests, Conversations modal).
  - `<DialogScrollBody>` — `flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-6`. Scrollable middle.
  - `<DialogScrollFooter>` — `shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-border`. **Vertical padding intentionally drops to `py-4` (16px)** vs the body's `py-6` (24px) — the action band reads as chrome, not content; the `border-t` hairline anchors it visually because the body above scrolls right up to its top edge. **This is the design-system rule for action footers** — same `py-4` as `<CardFooter>`.

  **Title block:** `<DialogTitleBlock>` — canonical title + meta primitive used by **every** detail modal. Owns the type contract so no consumer can drift. Slots: `icon` (left of title), `badge` (right of title), `meta` (text-xs text-neutral-500 wrapper). Title: `text-lg leading-none font-medium text-neutral-900 m-0` — sans default, `titleFont="mono"` opt-in for ID-as-title (Requests modal's `req_aurora_4200`). Internal rhythm: `flex flex-col gap-3 pr-12` — the `pr-12` is baked in so the title block always clears the absolute close button; no consumer needs to remember it. `mode="dialog"` (default — uses `<DialogTitle>` for ARIA labeling via Base UI) or `mode="static"` (renders `<h2>`) — the latter for specimens outside a `<Dialog>` root. **No eyebrow slot:** drilled-in modals carry surface context from the page they were opened from — a "REQUEST" / "CONVERSATION" / "THREAT EVENT" eyebrow stacked above the title is dashboard/card-pattern leakage into modal chrome (removed 2026-05-11 after competitor scan — Linear, Vercel, Stripe, Helicone all skip it). If a future modal genuinely needs surface labeling, add the slot back with intent.

  **Close button:** `absolute top-3 right-3` (12px from corner), `<Button variant="ghost" size="icon-sm">`. Position is locked at the primitive — moving the button breaks every consumer. Glyph optical center aligns with the title's text-lg cap-height center. **Never hand-roll** — `<DialogContent>` renders it automatically via `showCloseButton` (Base UI `<DialogPrimitive.Close>`); `<DialogStaticContent>` renders the same shape via its own `onClose` prop. The title block's `pr-12` (48px) clears it. (Polished 2026-05-11 from `top-2 right-2` after the 8px placement put the glyph TOP at 16px while the title TOP sat at 24px — optical misalignment with content.)

  **Body section pattern:** sections inside `<DialogScrollBody>` use `<section className="flex flex-col gap-3"><h3 className="font-sans text-sm font-medium text-neutral-900 m-0">…</h3>{content}</section>`. Section h3 is `text-sm font-medium` (NOT mono uppercase eyebrow — that's reserved for the title block's `eyebrow` slot). Between sections: `gap-6` (24px) on the body's flex column.
- **AlertDialog** (`alert-dialog.tsx`) — same modal-tier surface (rounded-xl / 16px); content `p-6` (bumped from `p-4` on 2026-05-11 to match `<DialogContent>`); used for destructive confirmations.
- **Sheet** (`sheet.tsx`) — right-docked drawer. Flush against viewport edge (`rounded-none`), only a left border + modal-tier shadow.
- **Menu** (`menu.tsx`, codified 2026-05-10) — shadcn-style wrapper over Base UI Menu. Exports: `Menu` / `MenuTrigger` / `MenuContent` / `MenuItem` / `MenuLabel` / `MenuSeparator`. Recipe: content `min-w-44 rounded-sm bg-white border border-neutral-200 shadow-md p-1 origin-[var(--transform-origin)]` (the transform-origin variable is published by Base UI's Positioner, so popups scale *from the trigger*, not the popup's geometric center — small detail, big feel). Item: `rounded-xs h-8 px-2 text-sm text-neutral-900 [&_svg]:text-neutral-500` with `transition-colors duration-100 ease-out` so keyboard arrow-through fades highlight states rather than snapping. `variant="destructive"` swaps colors to `text-danger-700 / data-[highlighted]:bg-danger-50` — used for Sign-out in `<UserMenu>`. **`active` prop (2026-07-29)** — marks the currently-selected row (the chat you are in, the workspace you are on). It sets `data-active="true"` on the item; the recipe then paints active at full `bg-accent` while every other row highlights at `bg-accent-muted`. Hovering the active row does NOT lighten it: the active-and-highlighted rules stack two data-attribute selectors, so they outrank the plain highlighted rule on **specificity** rather than on source order. This is why the state is a prop and not a pasted call-site class string — a call-site `data-[highlighted]:bg-accent` ties on specificity with the recipe's muted fill and the winner becomes an accident of Tailwind's output order. Replaced the duplicated `ACTIVE_ITEM` constants in `ask-ai-panel.tsx` and `workspace-switcher.tsx`. Consumers: `<UserMenu>`, `<WorkspaceSwitcher>`, the Ask AI session picker. (`<NotificationsMenu>` is a Popover consumer, not Menu — corrected 2026-08-24.)
- **UserMenu** (`user-menu.tsx`, codified 2026-05-10) — shared dropdown content (Chad Ponticas avatar + name + "Free plan" pill, separator, Upgrade to Pro / Account, separator, Sign out destructive). Accepts the trigger element as `children` (render-prop forwarded to `<MenuTrigger>`). `min-w-50` content. Consumed by the sidebar's 3-dot user-area button AND `DashboardChrome`'s top-right avatar (now an interactive `<button>`, was a static `<span>`). Single source of truth — both surfaces open the exact same menu.

**Rule:** Sheet for **inspection** (drill into a row, persist while reading). Dialog for **confirmation** or **paired-panel cross-link inspection** (selection state shared via single `activeRequestId`, auto-scroll-into-view on counterpart).

### Badges, Pills, Tags

- **Badge** (`badge.tsx`) — base: `h-5 rounded-xs border border-transparent px-2 font-mono text-xs font-medium tabular-nums uppercase`. **Locked contract (2026-05-11; uppercase + AA contrast 2026-06-04):**
  - **Text-only.** Color tone (bg + text) IS the indicator. **Do NOT nest `<StatusDot/>`, lucide icons, or any other glyph inside a `<Badge>`** — redundant signal, asymmetric padding, bad UI. The prior `has-data-[icon=*]:p*-1.5` asymmetric-padding rules were removed along with icon support because they enabled the dot-in-badge anti-pattern.
  - **Symmetric `px-2` padding always.**
  - **Uppercase at the primitive (2026-06-04).** `text-transform: uppercase` is baked in so `<Badge>blocked</Badge>` renders "BLOCKED". Consumers write the data as it lives in the model; visual case is the primitive's job. Digits/symbols unchanged ("200 OK" stays "200 OK"). Was `capitalize` (first-letter only); raised to full uppercase. (An even-earlier `first-letter:uppercase` attempt failed — CSS `::first-letter` doesn't apply to inline-flex, only block-level.)
  - **Variants encode tone**: `default` (neutral-900/white) · `secondary` · `destructive` (`bg-danger-100` / `text-danger-800` — solid, 2026-06-04) · `outline` · `ghost` · `link` · `success` (`success-100` / `text-success-800`) · `warning` (warning-100/700) · `info` (blue-700/10 bg / blue-600) · `neutral` (neutral-100/600).
  - **AA contrast (2026-06-04):** `success` text raised 700→800 (4.47 → 6.44:1) and `destructive` moved from translucent `bg-destructive/10 text-destructive` (3.97:1) to solid `bg-danger-100 text-danger-800` (6.91:1) — both now clear WCAG 4.5:1 and the destructive variant matches the other solid status tones.
- **Tag** (`tag.tsx`) — removable filter pill (NOT a Badge). `inline-flex h-6 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-900 font-sans text-xs gap-2`. With remove: `pr-1 pl-2`; without: `px-3`. **Use Tag for filter chips, Badge for status/counter/code.**
- **StatusDot** (`status-dot.tsx`) — 6px (`size="sm"`) or 8px (`size="md"`) `rounded-full` inline-state dot. **Used standalone — NOT inside Badge.** Tones: success (success-600), warning (warning-600), danger (destructive), info (blue-600), neutral (neutral-500). After the 2026-05-11 Badge contract lock, StatusDot's only legitimate consumer is row markers like the Requests modal's `BreakdownRow` (label + dot + value 3-col grid) and the live-rail indicator inside `<KpiTile>`; the prior "Badge + StatusDot child" pattern is retired.
- **DeltaTag** (specimen in `CMP003BadgesAndTags.tsx`) — directional pill for KPI deltas. NOT a Badge. Inline-flex arrow icon (`size-3.5`) + value text at mono medium 12px tabular. API: `<DeltaTag delta="+8.2%" note="vs last hour" inverted={false} />`.
  - **Default sentiment** (sign-based): positive = `text-success-700` + up-right; negative = `text-destructive` + down-right.
  - **`inverted` flag** flips the tone: positive paints red, negative paints green; arrow still tracks the literal sign.
  - **`inverted` ONLY applies to rate metrics where lower is unambiguously better** — latency, error rate, cost-per-X, time-to-first-token. **Volume metrics (Total Cost, Total Tokens) stay sign-based** — rising correlates with usage growth, not badness.
  - **`+`/`-` sign preserved** on the displayed value (icon + color + sign together — redundant by design).
  - **No textual qualifier** ("Lower is better") accompanies inverted color — tried 2026-05-06 and rejected.

**Rule:** Pick `inverted` by asking "is rising in this metric *unambiguously* bad?" If no, don't invert.

### Hero Numerics & KPIs

- **HeroNumeric** (`hero-numeric.tsx`) — **single source of truth for sans-tabular hero numerics ≥24px.** Recipe: `font-sans font-medium tabular-nums tracking-tight text-neutral-900`. Sizes: `default` (text-2xl/8, 24px — KPI rail, Top Keys hero) and `lg` (text-3xl/9, 32px — Requests page hero). **Don't hand-roll.** **Don't extend below 20px** — mono digit-shape tells become visible at ~18px.
- **KpiTile** (`kpi-tile.tsx`, codified 2026-05-17 with the Overview redesign) — canonical filler tile for `<KpiRail>` slots. Composition: `Eyebrow` (title, with optional leading `liveDot` — `size-2 rounded-full bg-success-600` for live-traffic rails), `HeroNumeric` value + optional `valueSuffix` (mono-suffix at `text-2xl/8 font-medium text-neutral-500` for unit tails like `/min`), optional `DeltaTag`, optional one-line `caption` at `text-sm text-neutral-500`, optional `spark` (`<Sparkline>` slot). Internal padding `p-4`; vertical rhythm `gap-2`. **Use inside `<KpiRail>`** for the dashboard 4-tile rail; standalone use (single-tile call-outs) is also legal — same chrome but compose it inside a `<Card>` shell yourself.
- **CompactKpi** (`compact-kpi.tsx`) — eyebrow + `<HeroNumeric>` value + optional `<DeltaTag>`. Two variants: standalone (own card chrome) / `flat` (chrome stripped, used inside divided rows). **When to pick KpiTile vs CompactKpi:** KpiTile is the post-Overview-redesign default — live dot + suffix + caption + sparkline slots are baked in. CompactKpi is the older, leaner shape — reach for it when none of the new slots apply.
- **Sparkline** (`sparkline.tsx`) — lightweight inline sparkline (5–14 points, ~24px). Lower visual weight than `<CompactSpark>` (h-9, recharts-based) used in dashboard hero cards. **KPI rail sparkline colors come from chart palette** (`--color-chart-1` blue, `--color-chart-3` green, `--color-chart-7` amber, `--color-neutral-500` neutral) — NOT semantic ramps.
- **MessageBlock** (`message-block.tsx`) — Conversations chat-thread bubble. **Bubble border-only, no fill** (earlier tone-tinted fills `bg-neutral-100`/`bg-blue-50` read as chat-app aesthetic). Migrated 2026-05-15 to `border-border` + `rounded-md` bubbles + `ring-1` selection. `warn` state: `bg-warning-50` + `border-warning-200` — **narrowed to data carriers**, does NOT wash the surrounding row or header. **Naming-collision note:** Requests has a local `MessageBlock` component (labeled prose card for its detail-modal Messages tab) — same name, different shape; see Open Drift below.
  - **Default-tone fill is `bg-card-muted` (resolved 2026-07-30, was `bg-background`).** Two reasons, one token. **(1) The nested-card inversion needs headroom below the bubble.** The bubble now nests a `<ToolCallCard>` on `bg-card`, and an inner card must read lighter than its parent in light and **darker** in dark. `--background` is **neutral-950** in dark — the floor of the ramp — so no semantic token could sit below it and the dark direction inverted backwards. `--card-muted` is neutral-800 there, leaving exactly the step the pattern needs (card = neutral-900). **(2) `bg-background` was already off-contract:** §2 reserves it for the dashboard content canvas and bars it from darkening a component. **No-op in light** — `--background` and `--card-muted` both resolve to neutral-50, so the light surface is pixel-identical. Only the `default` tone moved; the `warn` / `danger` tinted fills and the `selectedTone` ladder are unchanged. **Blast radius is one consumer** — `ConversationDetail`; the `MessageBlock` in `RequestDetailBody` is the unrelated local component named below, not this primitive.
  - **Dark-mode side effect, by design.** Plain bubbles move neutral-950 → neutral-800, so a `warn` / `danger` bubble (a translucent tint compositing over the neutral-900 panel) now reads slightly **darker** than its plain neighbours instead of slightly lighter. The status semantic is carried by hue and the tinted border, not by luminance, and this brings dark into agreement with light — where the tint already sat a hair below the plain bubble. Deliberate; do not "fix" it by re-tinting the tone strings.
  - **Footer line carries the message tools (added 2026-08-04).** The `↳ req_xxxxx` reference below the bubble became a row: reference left, then **copy then expand** flush right (`ml-auto`), `min-h-6`. Both are `size="icon-action"` and the pair uses the Ask AI row's pitch-preserving `gap-0 lg:gap-1` — 32px boxes with no gap below `lg`, 24px boxes with a 4px gap from `lg`, so the glyphs hold their pitch across the breakpoint. **Always visible — not a hover reveal**, matching the Ask AI reply action row it is modelled on (`ask-ai-message.tsx`); that is the precedent for "tools under a message" and there is no second treatment. **They belong on this line and not inside the bubble for a structural reason:** when `onClick` is present the bubble IS a `<button>`, and a button may not contain another button — the footer row is already a sibling, so nothing nests and neither control can toggle the cross-link selection. Both halves are independently conditional (`requestId` is absent on user-input turns, `copyValue` on a turn with no text), so the row renders when **either** exists and `ml-auto` pins the tools right regardless.
  - **The expand viewer is a one-off, not a reusable pattern.** A `<Dialog>` + `DialogScrollContent` at `sm:max-w-[600px]`, `min-h-[240px]`, `max-h-[min(600px,90vh)]` — height content-driven between those bounds, so a one-word turn settles at 240 instead of padding out dead space and a long tool blob grows to 600 and scrolls. **The ceiling must stay written as `min(600px,90vh)`:** a bare `max-h-[600px]` replaces the `max-h-[90vh]` `DialogScrollContent` supplies (same tailwind-merge group) and the card then overflows a short viewport. It exists because the bubble clamps to `max-h-[200px]` inside a panel that itself scrolls, which makes long tool output genuinely hard to read. It renders **the same `body` node** — no reformatting, no plain-text alternative — inside a `bg-card-muted` well reproducing the bubble's surface, border and `p-4` minus the clamp. **The well is required for fidelity, not decoration:** `<ToolCallCard>` is `bg-card` and inverts against the bubble's `bg-card-muted`; on the modal's own `bg-card` it would be white-on-white and vanish. Radius steps 16px modal → 8px well → 4px call card. Title reuses `ROLE_LABEL` through a shared `MessageHeading`, so the dialog title and the bubble header cannot disagree.
  - **Its dismiss glyph is `Minimize2`, the exact inverse of the row's `Maximize2` — and it does NOT fork the primitive.** `DialogContent` hard-codes an `XIcon` in its close slot but exposes `showCloseButton`, so the viewer passes `showCloseButton={false}` and renders its own exported `<DialogClose>` at the same `absolute top-3 right-3`, `size="icon-sm" variant="ghost"`. It is still Base UI's dismiss, so Escape, focus return and the exit animation are untouched; only the glyph and its `aria-label` ("Collapse") changed. **If a second surface ever wants a non-X dismiss, use this route** — opt out of the slot and compose `DialogClose`; do not add a glyph prop to `DialogContent`. The trigger is a real `<DialogTrigger>` rather than a controlled `open` boolean, which is what makes focus-return-to-trigger a contract instead of an accident.
- **ToolResultCode** (`tool-result-code.tsx`, codified 2026-05-10; **sans 2026-07-30**) — inline `<code>` recipe for tool-result JSON blobs. `type-copy-14 text-foreground break-words`. Used by Conversations on tool-result message bodies. Semantic `<code>` element (these blobs ARE machine output). **Was `font-mono text-sm … break-all` until 2026-07-30**: the trace's tool-result bodies are dense multi-line walls and mono was hard to read across that length, so they moved to sans at the same 14px — the same reasoning (and the same voice) as "Exception: Ask AI reply prose". Wrapping moved with it: `break-all` broke at any character (the trace showed `sta/rted`, `$0.025/8` split mid-token), while `break-words` breaks at word boundaries and only splits inside a word wider than the line — same overflow protection in a narrow bubble, no gratuitous mid-word splits. Size and ink are unchanged, and tracking stays `normal` (the earlier `-tracking-[0.14px]` in this doc was never in the source).
- **ToolCallCard** (`tool-call-card.tsx`, added 2026-07-30) — the nested **`CALL <Tool>`** card that sits INSIDE an assistant bubble on the Conversations trace, one per tool the model invoked on that turn. Matches the real Gate build's assistant-reply pattern: optional prose first, then a stacked card per call (8px gap). It is the **input** side of a tool step; the **result** is the separate `Tool · <Name>` MessageBlock that follows, rendered through `<ToolResultCode>` and unchanged by this.
  - **Recipe:** `flex flex-col gap-2 rounded-xs border border-border bg-card p-3`. Header line = `<Eyebrow>Call</Eyebrow>` + tool name; body = `<code>` with the captured args.
  - **Surface — the inner card inverts relative to its parent bubble.** Light: the bubble is the grey muted wash and this card is **lighter** (white). Dark: the bubble is the raised surface and this card is **darker**. That is precisely `--card` (white → neutral-900) against a `--card-muted` / `--muted` parent (neutral-50 → neutral-800), so the pair needs **no new token and no raw ramp step** — unlike the Ask AI bubbles, which had to mint `--chat-bubble-agent` because no pair inverted for them. **The parent must be a muted surface for the inversion to hold**: against `--background` (neutral-50 → neutral-**950**) the dark direction flips, because nothing in the ramp is darker than neutral-950. `MessageBlock`'s bubble was moved onto `bg-card-muted` on 2026-07-30 for exactly this reason — see the MessageBlock bullet above. Do not put this card inside a `bg-background` container.
  - **Radius steps down concentrically** (§6, ladder 24 → 16 → 8 → 4): the bubble is `rounded-md` (8px), so this card is `rounded-xs` (4px). Padding likewise steps in — `p-3` (12px) inside the bubble's `p-4`.
  - **Flat: border, no shadow.** An inset panel inside a bubble, not a card lifted off a canvas — same call as `CodeCard`'s flat treatment (§5.1).
  - **Typography — 14px, and both halves are mono.** The tool name and the args body both take `type-mono-14`; the `CALL` eyebrow keeps the locked Eyebrow voice (`eyebrow-sm`, 12px mono uppercase tracked) because it is chrome that names the row, not "the text". **The real build renders this content at 12px; 14px is a deliberate step up** (decided 2026-07-30). Mono is right on both: `Bash` / `mcp__chrome-devtools__evaluate_script` is a machine identifier per the data-voice rule, and the args are machine **input**. **This does not follow `ToolResultCode` to sans** — that carve-out was about dense multi-line *result* walls, and these args are short (p50 91 chars, p90 282).
  - **Clamped to 3 lines** (`line-clamp-3`). The longest captured value is 7,612 chars; unclamped, a single `evaluate_script` payload blows out the bubble. `break-words` (not `break-all`) so a long path or command wraps at word boundaries — same reasoning as ToolResultCode's 2026-07-30 wrapping change.
  - **Args are verbatim.** The data layer strips only the redundant `"<ToolName>: "` prefix that 88 of the 89 captures carry (the header already names the tool) and changes nothing else — no re-indenting, no pretty-printing, no `{"command": …}` envelope. 76 of the 88 are bare shell commands; wrapping them in JSON would fabricate payload structure that was never captured.
- **InlineCode** (`inline-code.tsx`, codified 2026-05-11) — short identifier chip rendered as `<code>`. Recipe: `font-mono text-neutral-800 bg-neutral-100 rounded-xs px-1.5 py-0.5`. Default `text-sm`; `size="sm"` drops to `text-xs` for table-cell density. Distinct from `<ToolResultCode>` — InlineCode is the chip variant (short identifiers like `claude-haiku-4-5` inline in prose), ToolResultCode is the JSON-blob variant (`break-all`, no chip background).

### Typography primitives

- **Eyebrow** (`eyebrow.tsx`, codified 2026-05-11) — small mono-uppercase chrome label used above KPI values, in sidebar nav-section headers, atop CompactKpi titles, on artboard / spec-sheet headers. Recipe: `font-mono text-xs uppercase tracking-[0.1em] font-medium text-neutral-500`. Default element `<span>` (inline); pass `as="div"` when a block is needed. Extracted after the 2026-05-11 audit found 13 hand-rolled occurrences across Requests / Conversations / Security/16/18 + sidebar.tsx + compact-kpi.tsx + Artboard.tsx (the last had drifted to `tracking-[0.08em]` without `font-medium`). **No size variant ships** — the previous `Eyebrow / default` (text-sm) variant from the typography spec is unused (modal eyebrows removed 2026-05-11); add the variant back with intent when a surface needs it.
- **SectionHeading** (`section-heading.tsx`, codified 2026-05-11) — h3-class heading used inside modal body sections ("Evidence", "Detection", "Context", "Details", "Security scan"). Base recipe: `font-sans text-sm font-medium text-neutral-900 m-0` (`type-label-14` equivalence). Renders `<h3>` by default; pass `as="h2|h4|h5|h6"` to override level. For policy-panel section headings, promote via semantic role class (`className="type-heading-16"`). Extracted after the audit found the recipe hand-rolled in CMP-007 + CMP-015 modal body sections (5 sites).
- **SectionTitle** (`section-title.tsx`, codified 2026-06-22) — single source of truth for page-level section titles ("Overview", "Recent …", "Activity This Week", "Get started"). Recipe: `type-heading-20 text-neutral-900 m-0` (20/28, tracking-snug). Renders `<h3>` by default; pass `as="h2"` when the section has sub-headings so the outline stays correct without changing the voice. Distinct from `SectionHeading` (text-sm, modal body sections). Adopted 2026-06-22 across Overview(default) / Requests / Conversations / Security / AuditTrail(+Merkle) / TokenSavings / Dashboard, replacing hand-rolled `text-xl/7` and `text-lg/6` headings.
- **PageTitle** (`page-title.tsx`, codified 2026-05-11) — top-of-surface heading on composed pages. Recipe: `h1` → `type-heading-32`, `h2` → `type-heading-24`, plus `text-balance text-neutral-900 m-0`. Renders `<h1>` by default: the in-surface page title is the page's primary heading and its sole `<h1>` (verified on `/overview`: one h1 = the page title; the chrome emits none, matching the one-h1-per-page rule). Pass `as="h2"` only when a surface genuinely nests under another title. Section titles below it are `<h2>` (`SectionTitle`) and card titles `<h3>`, so the outline descends without level skips. Extracted after the audit found 8 hand-rolls (every composed page's PageHeader plus a CMP-013 variant that used `tracking-tight` instead of `-tracking-[1px]` — normalized on extraction). Spec-sheet `<ArtboardHeader>` uses `text-neutral-800` and does NOT compose this primitive (different surface convention; intentional).

### Helpers, links & icon affordances

- **TextLink** (`text-link.tsx`, codified 2026-05-10) — **inline link affordance, button-by-default.** Renders `<button type="button">` (correct for this codebase's no-router architecture); pass `as="a" href={...}` for a real anchor when navigation is needed. Locked visual recipe: `text-neutral-800 underline decoration-neutral-200 underline-offset-2 hover:decoration-neutral-500 focus-visible:decoration-neutral-500 focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xs`. **No blue** — blue is reserved for info / completed / active-tab / focus. Don't hand-roll the recipe; the className convention block in this doc still exists as the underlying contract, but `<TextLink>` is the single canonical consumer-facing primitive.
- **IconActionButton** (`icon-action-button.tsx`, codified 2026-05-10) — 24px (`size-6`) icon-only button with `after:-inset-2` pseudo-element expanding the hit target to 40×40 without inflating the visual footprint. Recipe: `rounded-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px motion-reduce:active:translate-y-0`. `touch-manipulation` kills the 300ms tap delay. **`aria-label` is required** at the type level — icon-only buttons have no accessible name from text content. Extracted from CMP-012's `TopKeysCard` overflow `MoreHorizontal`; any second site would have silently drifted.
- **CopyButton** (`copy-button.tsx`) — the one copy affordance. Two modes: `mode="icon"` (sizes `icon-sm` / **`icon-action`** / `inline-xs` — the last being a 20×20 glyph with a 24×24 `before:` hit target for inline use next to `<code>`) and `mode="label"` (sizes below). Success state always reads "Copied!". **`icon-action`** (added 2026-08-04) is the **message-tools** size: it delegates to `Button size="icon-action"`, so 32×32 below `lg` and 24×24 from `lg` with the glyph stepping 16 → 14px — 24×24 is exactly WCAG 2.2 SC 2.5.8's (AA) minimum, and touch gets the bigger target. Ink follows its precedent rather than the other icon sizes: resting `text-muted-foreground`, success **`text-foreground`**, not `text-success-600` — a message tool row is quiet chrome sitting in a surface already full of status color. **Extracted from `ask-ai-message.tsx`'s reply action row**, which had wired that chrome by hand through `useCopyFeedback`; the `MessageBlock` footer line is the second consumer. Any further "copy this message" affordance uses this size — do not invent a third. Label sizes: `compact` 24px (code-card header), `sm` 32px (modal footers, matches `Button size="sm"`), and **`segment`** (added 2026-07-28) — a full-height flush segment of a SPLIT WELL: no radius, no border except the left hairline divider, `self-stretch` to the well's height. For the "value | Copy" merged surface in the ApiKeys reveal-key dialog, which had hand-rolled that chrome because no mode fit and `compact`/`sm` would float a short button inside a taller well.
- **BackLink** (`back-link.tsx`, codified 2026-07-28) — the **back breadcrumb** above a detail page. `<BackLink label="Conversations" onClick={...} />`. Recipe: `type-label-14 group relative inline-flex w-fit items-center gap-1 rounded-xs text-muted-foreground hover:text-foreground` + `after:-inset-y-3` (invisible 12px hit area) + a `ChevronLeft` that nudges `-translate-x-px` on hover + the standard `active:scale-[0.98]` press. **Not `TextLink`** — TextLink is the *underlined* inline-prose affordance; a breadcrumb has no underline. Extracted from three byte-identical hand-rolled copies (`ConversationsTrace`, `RequestsFindings`, `SetupBackLink`); `SetupBackLink` now delegates to it.
- **OptionTile** (`option-tile.tsx`, codified 2026-07-28) — one choice in a `role="radiogroup"`. `<OptionTile selected size="md|lg" tone="neutral|accent">`. **Deliberately not a `Button`**: these carry `role="radio"` + `aria-checked` so a screen reader announces "2 of 4 selected", not "button". The element stays a native `<button>` with the radio role on top (standard composite-widget pattern); the PARENT owns arrow-key roving tabindex where it wants it (Billing does, SetupCredits doesn't). `size`: md = `h-10 rounded-md` (billing credit grid), lg = `h-12 rounded-sm` (setup-credits grid). `tone`: neutral = `bg-muted` selected, accent = blue selected. **The two tones encode a real inconsistency that predates the extraction** — /billing marks the chosen amount neutral, /setup-credits marks it blue; both reproduced verbatim so the refactor moved no pixels. Picking one is an open design decision.
- **MiniRadioGroup / MiniRadio** (`mini-radio-group.tsx`, codified 2026-07-28) — 32px bordered track of 24px choices (`h-8 rounded-sm border-border bg-card px-1` track; `h-6 rounded-xs type-label-12` items, `bg-muted` when selected). **Not `Segmented`, and the difference is not size**: Segmented is a MUTED track with a raised card thumb; this is a CARD track with a muted thumb — inverted. It is also a true `role="radiogroup"` (single choice), where Segmented is a view switcher. One consumer: the BYOK/PAYG mode switch on `DashboardDefault`. If a second appears, reconcile the two rather than adding a third look.
- **ExpandingAction** (`expanding-action.tsx`, codified 2026-07-28) — 32px icon key that opens on hover/focus to reveal its label (`w-8` → `hover:w-30`, `[transition:width_300ms_var(--ease-drawer)]`). **Deliberately not a `Button` variant**: width-on-hover is not button behavior — a Button is a fixed box whose contents may change; this is a box that changes size and reflows its neighbours. Putting it on `Button` would give every button in the app the ability to resize itself. The label is always in the DOM (`opacity-0` → `100`) so the accessible name never depends on hover. One consumer: "Mark invalid" in the Security event dialog.
- **TabsCount** (`tabs-count.tsx`, codified 2026-05-10) — mono count chip sitting inside a `<TabsTrigger>`. Recipe: `inline-flex items-center justify-center min-w-5 h-5 px-2 rounded-xs bg-neutral-100 text-neutral-500 font-mono text-xs font-medium tabular-nums`. Consumers: Models modality tabs (All types `(146)` / Text / Embeddings / Audio / Rerank), Team line-variant tab counts.
- **SettingsRow** (`settings-row.tsx`, codified 2026-05-10) — title + subtitle on the left, control on the right. Lifted from CMP-018's local definition after the same shape appeared in `SecurityCard`'s passkey row with two minor variants. API exposes three modes: default (input-bearing, title renders as `<Label htmlFor={id}>`), `static` (title renders as heading-styled `<span>` — read-only state with a Badge), and `titleAs="h4"` (title as `<h4>` heading — used when the row sits inside a Card whose CardTitle is the section heading and this row needs a sub-heading semantically). Vertical alignment via `alignTop` (`items-start`). Rhythm: first row gets no top border; subsequent rows get `border-t border-neutral-200`. Rendered as `flex justify-between gap-6 py-4`.

### Toast — `{components.toast}`

`sonner.tsx`. Sonner-based, hardcoded `light` theme. Border `--color-neutral-200`, radius `0.5rem` (sonner-specific), `--shadow-popup` elevation. Status icons from lucide-react at `size-4`.

### Brand

- **BrandMark** (`icons/brand-mark.tsx`) — 7-path constellation, 280×280 viewbox. Paths inline `fill="currentColor"`. Asset `public/logomark.svg` fill `#1F2FCE` = `--color-blue-700`. Canonical: `<BrandMark className="size-8 text-blue-700" />`. Other tones: `text-white` (inverted), `text-neutral-900` (monochrome). Sizing: min 16px, default 32px (sidebar), 48–96px hero. **Don't rotate/skew/distort/crop. Don't recolor outside the approved set. Don't add shadows or glows to the mark itself.**
- **VendorAvatar** (`icons/vendor-meta.tsx`) — **bare brand-colored icon at `size-4`. NO chip wrapper** (locked iter 7). API: `<VendorAvatar vendor={v} />`. Vendors: anthropic, openai, google, meta, mistral, deepseek, cohere, xai + marketplace providers (`marketplace-providers.tsx`). Three vendors (Cohere/Mistral/Gemini) render multi-color via per-path SVG fills — for those, wrapper `style.color` is ignored. **Don't reintroduce a chip wrapper, `tone` prop, or split treatment.**

### Inline links

**Not a primitive — a className convention.** Inline links in body text use **ink + permanent faint underline**:

```text
underline decoration-neutral-200 underline-offset-2
hover:decoration-neutral-500
focus-visible:decoration-neutral-500
outline-none
```

Rendered as `<button type="button">` (no router in this codebase — no `<a href>`). **Visual contract = link styling, semantics = button.** (decided — see `feedback_link-affordance.md`)

**No blue link color.** Blue is reserved for info / completed / active-tab / focus. Link affordance is permanent underline, not color.

### Composed-row patterns

#### Consolidated row pattern — KpiRail / QuickActionsRow (Overview)

Multi-section rows live in **one bordered card** with internal sections divided by **inset hairline `before:` pseudo-elements**:

```text
relative before:absolute before:left-0 before:inset-y-4 before:w-px before:bg-neutral-200
```

The hairline doesn't reach the rounded corners or section edges — reads lighter than a full-height `divide-x`. Sections are flat (no individual borders/shadows); the parent owns the chrome (`rounded-md bg-white border border-border shadow-xs overflow-hidden` — see §5).

When one section is the focal action, accent it with `bg-blue-50` (and the icon chip with `bg-blue-100 text-blue-700`) — matches the `bg-blue-50` quick-action accent used on the Overview dashboard. **Don't invert** (white text on solid blue) — too marketing-loud for the operator-tool register.

#### Section header capitalization

- Card titles: **Title Case** (`Recent Requests`, `Top Keys`, `Request Volume`, `Quick Actions`).
- Field/column labels: **sentence case** for technical terms (`Leaf hash`, `Anchor root`, `Anchored`).
- Single-word labels: unaffected.
- Eyebrows: **MONO UPPERCASE TRACKED** (`REQUESTS / 1H`, `TOTAL COST`).

---

## Voice & Content *(Google canonical — added 2026-06-19)*

Copy is part of the design: precise, plain, no marketing superlatives. This is an operator tool, not a landing page.

- **Case.** Sentence case for titles, labels, buttons, and tabs (`Export view`, `Save changes`, `Audit record`, `Open Explorer`). UPPERCASE TRACKED is reserved for mono eyebrows and KPI labels only; never put it on a form/input label.
- **Terminal periods (codified 2026-06-25).** Add a period to any **complete descriptive sentence** — page subtitles (the `<p>` under `<PageTitle>`), card/section subtitles (`CardChromeHeader` / `SettingsRow` `description`), step and list-item body copy, helper paragraphs, and tooltip prose. This holds even for one-line imperative subtitles (`Reuse identical responses.`, `Shrink prompts before they reach the provider, without affecting the model's output.`). **Omit the period on terse fragments** — titles/headings, field & form labels, button and tab text, eyebrows, KPI values and their captions (`smaller requests on average`), badges, and table headers. Rule of thumb: if it's a sentence (or reads as one), it ends in a period; if it's a label/caption, it doesn't. Multi-sentence copy always takes periods throughout.
- **Actions.** Label buttons with a specific verb (`Export view`, `Copy proof JSON`, `Open Explorer`), never a bare `OK` / `Confirm`.
- **Terminology.** The user-facing term is "fingerprint" / "fingerprinted"; the code identifier stays `anchor` (`ANCHORED_EVENTS_COUNT`, `RecentAnchoredEventsCard`). The verification mark reads "Verified by Digital Evidence." Don't blind-rename across the UI/code divide.
- **Numbers are real.** Every visible figure derives from an actual entity row: no hand-authored constants, no plausible-looking filler. An unknown or unmetered value renders as an em-dash (`—`), never an estimate (e.g. BYOK request cost).
- **Status + errors.** Show real tokens (HTTP `200` / `500`). Write an error as what happened plus the fix, quoting the actual requirement (e.g. the passthrough `X-Gate-Upstream-Url` header message), not a generic "Something went wrong."

---

## 8. Do's and Don'ts *(Google canonical §8 — cross-cutting only)*

### Do

- **Bind every value to a token.** Color, spacing, radius, shadow, type — all flow palette → semantic → component. No raw hex/oklch/rgba outside `@theme`.
- **Pick an 8px-multiple at surface tier** (page/section/card spacing, between-card gaps): values 8 / 16 / 24 / 32 / 40 / 48 / 64. Compound tier (within a primitive's row/group) allows any 4-multiple. Half-step classes are banned at every tier.
- **Use ramp tokens** (`text-warning-700`, `bg-success-100`) — not legacy single-token semantics.
- **Pair items with concentric radii (three-tier ladder, 2× ratios):** 4px badge inside 6px button-tier inside 8px card-tier inside 16px modal-tier.
- **Right-align numeric columns** in tables. `tabular-nums` alone doesn't fix inter-row drift.
- **Use `font-medium` on sans labels** (minimum). `font-normal` reads as ambient body.
- **Wrap hero summary numerics ≥24px in `<HeroNumeric>`.** Don't hand-roll the recipe.
- **Render pagination/inline links as `<button>`**, not `<a>`. No router in this app.
- **Use the chart palette by index**, not by entity. Brand-decoupled by default. Import from `@/lib/chart-palette` (`CHART_PALETTE`, `chartSlot(n)`) — extracted 2026-05-10 from CMP-012's inline literal.
- **Use `<TextLink>` for inline links**, `<IconActionButton>` for icon-only buttons, `<KpiRail>` for KPI rails, `<HeroNumeric>` for ≥24px hero numerics, `<MessageBlock>` for conversation bubbles, `<TabsCount>` for tab counts, `<ToolResultCode>` for tool-result JSON, `<ToolCallCard>` for the nested `CALL <Tool>` card inside an assistant bubble, `<SettingsRow>` for settings rows. **Don't hand-roll these recipes** — `src/components/ui/` is the canonical home.
- **Press affordance is `active:scale-[0.98]`** (subtle scale-DOWN, standardized site-wide 2026-06-18) gated so popover/select/menu triggers don't scale (`not-aria-[haspopup]` on the Button primitive, `enabled:` elsewhere), paired with `will-change-transform` for crisp label re-raster and `motion-reduce:active:scale-100`. Replaced the old `active:translate-y-px`. Gate the scale on any trigger that anchors a popover, or it flickers on reposition.

### Don't

- **Don't introduce blue as primary action color.** Primary is neutral-900.
- **Don't introduce blue as inline-link color.** Links are ink + permanent faint underline.
- **Don't use `text-neutral-600` or `text-neutral-700` for table body cells.** Three-tier policy is 500 / 800 / 900 only.
- **Don't override the Card chrome.** Cards carry `border border-border shadow-xs` from the primitive — don't add extra `border-*`, swap to `shadow-(--shadow-border)`, or strip the border in favor of a ring-only edge. The 2026-05-15 migration was deliberate; reaching for the legacy shadow recipe is a tell that this doc was read at an old snapshot.
- **Don't inline `rgba()` shadows** — token discipline applies.
- **Don't extend `<HeroNumeric>` below 20px** — mono digit-shape tells become visible.
- **Don't strip `font-mono` from `<Badge>`** — base CVA carries it intentionally.
- **Don't symmetrize `<SelectTrigger>` padding** without re-litigating the optical-balance discussion.
- **Don't reintroduce the `VendorAvatar` chip wrapper** — locked at iteration 7.
- **Don't add a "Lower is better" qualifier sub-line** to inverted DeltaTags — tried and rejected.
- **Don't reintroduce dark-mode raw values.** Dark mode is live via the `.dark` class (see the Dark mode section). Themed surfaces must ride semantic tokens that re-point under `.dark`; never inline oklch or raw-ramp values (they don't invert and render dark-on-dark).
- **Don't hand-roll a recipe in 2+ sites.** Survey `src/components/ui/` first; if no primitive matches and you'll need the recipe twice, extract a primitive *before* writing it inline. If an audit finds the same bug in two files, extract before fixing — fixing two copies in place is the symptom of missing the primitive.
- **Don't put `role="button"` on `<tr>`.** Use the row-as-button pattern in §7 Lists/Tables — `<button>` inside the primary cell, `<tr>` keeps default semantics with `onClick` as mouse-only convenience.
- **Don't use odd 4-multiples (12, 20, 28, 36) for surface-tier spacing.** Surface tier is 8-multiples only — those odd values belong to compound tier (within a primitive's row/group), never to page/section/card rhythm. Specifically: no `p-7`, `gap-7`, `mb-7`, `gap-3` between-card gaps, `gap-5` between sections.
- **Don't put cards at `rounded-sm` (6px).** Cards live at the new 8px (`rounded-md`) surface tier as of 2026-05-10; 6px is the button / chrome / menu tier. Reaching for `rounded-sm` on a new card class is a tell that this doc was read at an old snapshot.
- **Don't put modals at `rounded-xl: 12px`.** The token resolves to **16px** as of 2026-05-10 (`--radius-xl: 1rem` in `@theme inline`). Don't reintroduce the 12px override or hand-roll a `rounded-[12px]` modal.
- **Don't apply ungated scale-press to a popover/select/menu trigger** — it flickers on anchor-reposition. Gate it (`not-aria-[haspopup]` on the Button primitive, `enabled:` elsewhere). Standard press is `active:scale-[0.98]` + `will-change-transform` + `motion-reduce:active:scale-100` (standardized site-wide 2026-06-18). Don't revert to `active:translate-y-px`.
- **Don't use raw ramp tokens where a semantic token exists.** Surfaces: `bg-white` → `bg-card` / `bg-popover` / `bg-background`; `bg-neutral-100` → `bg-muted`. Borders: `border-neutral-200` → `border-border`. Rings: `ring-neutral-N` → `ring-ring`. Text: `text-neutral-900` → `text-foreground`; `text-neutral-500` → `text-muted-foreground`. The only permitted ramp-token exceptions today are `bg-neutral-50` (no `--input-bg` alias yet), `text-neutral-800` / `text-neutral-600` / `text-neutral-400` (no semantic aliases yet). See §2 semantic token quick-reference.
- **Exactly one `<h1>` per page, and it is the `<PageTitle>`.** It is the largest heading and appears once. Section titles are `<h2>` (`SectionTitle`), card and modal-body titles `<h3>`. Never skip levels, and never let chrome (sidebar, top bar, wordmark) emit a competing `<h1>`. Element level and visual size are independent: the `type-heading-*` voice sets the look, the tag sets the outline, so choose the tag for the document outline, not for the size you want.
- **`tracking-snug` (`-0.01em`) is scoped to the sans heading tiers plus a few small-text cases:** (1) **sans headings** `type-heading-16` through `type-heading-24` (CardTitle, SectionTitle, PageTitle `h2`) — the display tier `type-heading-32`+ uses the tighter `tracking-tight` instead; (2) large mono KPI numerics — `font-mono text-lg font-medium tabular-nums` in modal KpiTile / ConversationKpiTile; (3) **page-header subtitles** — the `text-base text-neutral-500` `<p>` under `<PageTitle>` (swept site-wide 2026-06-18, replacing `tracking-tight`, which at -0.025em was too aggressive for the 16px subtitle body). **14px sans body (`text-sm`) is `tracking-normal`, and so is `type-heading-14`.** **Mono at `text-sm` and below is `tracking-normal`** — the monospace grid carries its own optical density at small sizes and negative tracking smears digit shapes. Don't pass arbitrary `-tracking-[Npx]` anywhere; heading `-tracking-[1px]` (artboard h2) stays arbitrary — different optical tier.
- **Don't hand-roll the user dropdown or workspace switcher.** Both surfaces (sidebar 3-dot, top-bar avatar) open the shared `<UserMenu>`. Adding a third surface = new `<UserMenu>` consumer, not a new local menu.
- **Don't open a `<MenuContent>` without `origin-[var(--transform-origin)]`.** The base `<MenuContent>` already includes it; if you reach for raw Base UI `Menu.Popup`, copy the variable so the popup scales from the trigger.

---

## Responsive Behavior *(our extension)*

The product is desktop-first (operator workflows tuned for ≥1280px), but a mobile / responsive pass shipped 2026-07-16..17 (Thread B): the shell flows to content height below `lg`, the sidebar collapses to a hamburger Sheet below `lg`, site margins drop to 16px below `sm`, and KPI-tile counts use a compact-millions formatter. Composed pages (`src/pages/*`) still target ≥1280px for the full multi-column experience; small-screen is functional, not the design center.

**Page content responds to its COLUMN, not the browser** (2026-08-10). See "Container queries" immediately below — this is the rule, and viewport breakpoints inside `<main>` are the exception.

### Container queries — the default axis for page content *(2026-08-10)*

`<main>` in `DashboardChrome.tsx` declares `@container`. **Everything rendered inside it sizes off the content column, not the viewport.**

This exists because the Ask AI side panel docks beside the content and narrows the column while the viewport stays wide. Before this rule, a 1280px browser with the panel open handed pages a ~628px column while every `md:` / `lg:` / `xl:` prefix still read 1280 — so toolbars stayed crammed on one row, charts drew 30 bars into 500px, and grids kept columns they had no room for. A viewport breakpoint cannot see the panel. A container query can.

**The rule:** inside `<main>`, use `@`-prefixed container variants (`@2xl:`, `@4xl:`, `@min-[672px]/name:`). A raw `sm:` / `md:` / `lg:` / `xl:` prefix on page layout is a defect.

**The exceptions**, where the viewport genuinely is the right axis:

| Surface | Why viewport is correct |
| --- | --- |
| Chrome — `DashboardChrome`, `AuthLayout`, `sidebar.tsx` | They *are* the frame; nothing contains them. |
| Dialog / Sheet / AlertDialog content | Overlays are sized against the browser, not any column. |
| Ask AI panel internals + `feedback-fab` | The panel docks on a viewport breakpoint, so its own internals follow the same signal. |
| Outer site margins (`px-4 sm:px-6`) | A property of the window, not the column. |

**Standard thresholds** — reuse these rather than inventing new ones:

| Use | Threshold | Behavior |
| --- | --- | --- |
| Table toolbars | `@2xl:` (672px) | Below: title on its own line, search full-width, trailing controls split the row evenly. At/above: single inline row, trailing control flush right. |
| Chart two-pane (chart + legend) | `@4xl:` (896px) | Below: legend stacks under the chart. At/above: legend beside it, 8/12 + 4/12. |
| TrendCard header | `@2xl:` (672px) | Below: title/subtitle stack, controls drop to their own row above the chart. |

**Named containers.** When a nested surface needs its own axis, name it (`@container/connect`) and address it explicitly (`@min-[993px]/connect:`). An *unnamed* `@2xl:` inside a named container resolves against the nearest container, which is rarely the one intended — `CardHeader` already declares `@container/card-header`, so a bare `@2xl:` on a `CardAction` reads the header, not `<main>`.

**Bar-chart density is a container concern too.** See §Charts — bar counts fold by column width on a monotonic ladder, never by viewport.

### Breakpoints (Tailwind v4 defaults + custom `xs` / `3xl` in `@theme`)

These govern the CHROME and overlays. Page content uses the container thresholds above.

| Name | Width | Key Changes |
| --- | --- | --- |
| xs | 450px | Custom (`--breakpoint-xs`). Minor tweak only: one Overview card header (`Dashboard.tsx`) stacks its toolbar below the title (`xs:flex-row`). The nav / switcher / logomark moves are at `lg` now (not `xs`) — see below. |
| sm | 640px | **Outer site margins step 16px → 24px** (`px-4 sm:px-6`) on the shell `<main>` and top bar. |
| md | 768px | Nothing structural. Table toolbars used to stack here; as of 2026-08-10 they key off `@2xl` (container) instead. Nav no longer switches here — moved to `lg` on 2026-07-16. |
| lg | 1024px | **Sidebar rail ↔ hamburger switch:** below `lg` the persistent rail is hidden and nav moves into a right-docked Sheet; `lg`+ shows the rail. Workspace switcher lives in the top bar at `lg`+ and in the Sheet below `lg`; the top-bar logomark shows below `lg` (no rail to carry the brand). **Shell viewport-lock + internal `<main>` scroll are `lg:`-only** — below `lg` the document flows to content height with a sticky top bar. Overview KPI row goes 3-up. |
| xl | 1280px | Composed-page target. Overview preview tables go 3-up (card-wrap standard). |
| 2xl | 1536px | Composed-page comfortable |
| 3xl | 1920px | Custom (`--breakpoint-3xl`). Band above the 1536 content lock. |

### Touch Targets

- Buttons: `default` 36px (`h-9`); `sm` 32px (`h-8`) for dense table chrome; `xs` 24px (`h-6`). There is no `lg` — see Buttons above.
- Inputs / Selects: **`default` 36px (`h-9`)** — the shadcn standard, and 32px reads too small for text entry. `sm` 32px (`h-8`) stays available for deliberately compact inline chrome, and `xs` 28px (`h-7`) below that. As of 2026-08-10 there is no `lg`: the size that used to be called `lg` IS `default` now, and the old 32px `default` is deleted. Table-toolbar controls (SearchInput, filter Selects, Filters/Export buttons) all sit at `default`.
- Icon-only buttons: `icon` = 36×36 (`size-9`), `icon-sm` = 32×32 (`size-8`), `icon-xs` = 24×24 (`size-6`); the icon itself is 16px (`size-4`), except `icon-xs` at 14px (`size-3.5`). There is no `icon-lg`.
- Checkbox / Radio: `size-4` (16px) visual + `after:-inset-x-3 after:-inset-y-2` hit-target padding.

### Collapsing Strategy

- **Sidebar** (left nav): expanded 240px (`w-60`) / collapsed 64px (`w-16`) in `sidebar.tsx`, rendered at `lg`+ only; below `lg` the whole rail is replaced by the right-docked hamburger Sheet. Collapse toggle lives in the sidebar header; the workspace switcher sits in the top bar at `lg`+ (in the Sheet below `lg`) — not in the sidebar (see §7 UserMenu / WorkspaceSwitcher).
- **KPI rail:** four sections side-by-side at composed widths; wraps to a stacked grid on small screens. Raw counts ≥1M render compact (`N.NM` via `formatCompactCount`, KPI tiles only — see §7 Hero Numerics & KPIs / memory), so long numbers don't overflow the tile on mobile.
- **Tables:** horizontal scroll within container (`overflow-x-auto` on Table wrapper); toolbars and the pagination footer stack below `md` (see breakpoints). **`table-fixed` tables get a `min-w-[Npx]` floor** sized to their column count so they side-scroll on mobile/tablet instead of crushing columns (a `table-fixed` table otherwise always equals its container and never overflows, so the `overflow-x-auto` wrapper has nothing to scroll). Floor stays ≤ the desktop content width so desktop never scrolls: canonical `min-w-[1000px]` for 6–8-col tables (ApiKeys, AuditTrail, Activity, Limits), scaled down for narrow tables (Team members `680px`, TeamDefault `560px`). Column priority not codified.
- **Charts (axis):** x-axis date labels use recharts' native collision handling — `interval="preserveStartEnd"` + `minTickGap` (NOT `interval={0}`, which forces every tick with no overlap removal). Explicit `ticks` arrays must be derived from real data points (never hardcoded time strings, which silently render nothing when they don't match a datum). The custom tick renderer anchors the **first tick `textAnchor="start"`, last `"end"`, middle `"middle"`** so the first label starts at the plot's left edge (not under the Y-axis column) and the last never overflows the card — applied to every axis chart (hero area charts, Activity TrendCard, Dashboard usage chart). Bar charts additionally thin their bar count ~25% below `lg` (tablet + mobile) via `useMediaQuery` so bars don't pack too tight; totals still reconcile (same total across fewer buckets).

---

## Sources & Composed-page References

Tokens cite `src/index.css:LINE` inline. Components cite `src/components/ui/<file>.tsx`. Locked policy comes from `feedback_*.md` memories and `CLAUDE.md` "Things to not change without asking".

The MVP-era `src/artboards/CMP-*` spec sheets were stripped from this repo on 2026-05-11 (commit `52d3a2a`). Composed pages now live at `src/pages/*.tsx` directly, route-keyed.

| Route | File | Pattern |
| --- | --- | --- |
| `/` → `/overview` | `App.tsx` | Default route navigates to `/overview` (changed 2026-05-19 from `/requests`). Catch-all `*` also routes to `/overview`. |
| `/overview` | `src/pages/Dashboard.tsx` | **Overview redesign (2026-05-17).** PageTitle "Overview" + 1-line subtitle. Top section: live KPI rail (`<KpiRail>` with `<KpiTile>` fillers — eyebrow + HeroNumeric + suffix + delta + caption + sparkline). Middle section: "Activity This Week" h2 + TokenSavingsStrip + OverviewUsageChart. Bottom section: `grid grid-cols-1 md:grid-cols-3 gap-6` of three preview tables — Latest Requests, Recent Conversations, Security Events. Each preview table is **capped at 8 rows** (see Overview preview tables rule in §7 Lists/Tables / memory `feedback_overview-preview-row-cap`) and links to the full surface. |
| `/overview-default` | `src/pages/DashboardDefault.tsx` | First-day / empty-state Overview shipped 2026-05-19 (commit `27e0a28`). Hero card + default states for all data sections — used when no traffic / no audit anchors / no security events yet. |
| `/requests` | `src/pages/Requests.tsx` | Hero card with `<HeroNumeric size="lg">`, request firehose table, Dialog drill-in with cross-link. Time-range as `<SegmentedPill size="sm">` (1H / 24H / 7D / 30D) anchored right + `<DateRangePicker>` for custom backlogs (older than 30d). **Table:** Status column split into two axes — `Status` (success / error, with `slow` override) + `Guardrail` (allow / flagged / redacted / block); both filters AND-combine. **Cost column:** PAYG rows render the dollar amount; BYOK rows render an em-dash in `text-neutral-400` with a Tooltip ("Billed by your provider (BYOK)") + an Info icon in the column header that opens a longer PAYG vs BYOK explanation. `isByokKey(keyId)` is the single source of truth (`keyId.startsWith('byok-')`). **Request detail modal:** Messages tab is readable-first — User and Assistant turns render as labeled prose cards (white header + `bg-neutral-50` body, User / Sparkles icons left of label) instead of JSON. The full HTTP payload lives in a collapsed "Full request payload" drawer (`<BodySection>` chrome + `Braces` icon) with a "Copy code" footer for paste-into-curl. Tabs: Messages / Details / Security (the "Security" tab keeps `value="audit"` internally — visual-only rename). KPI rail surfaces `Compression` (rtk %) and `Security` (pass / flagged / redacted / blocked) alongside latency / cost / tokens. Security panel checks scoped to three policies: prompt injection, PII redaction, credential leak detection. Deep-link param: `?open=req_xxx` strips on close. |
| `/conversations` | `src/pages/Conversations.tsx` | `<KpiRail>`, conversations table, Dialog detail with `<MessageBlock>` flat-list thread. Cross-link selection state via `selectionSource: 'messages' \| 'trace' \| null` — each panel skips its own scroll-into-view when it originated the selection (counterpart still scrolls). Tool-result blobs use `<ToolResultCode>`; the assistant bubble carries a nested `<ToolCallCard>` per tool call (the input side). Deep-link param: `?open=cnv_xxx` strips on close. |
| `/models` | `src/pages/Models.tsx` | Modality tabs (`<Tabs variant="line">` + `<TabsCount>`: All types / Text / Embeddings / Audio / Rerank); table card moved INSIDE the Tabs wrapper. Empty-state branch consumes `<EmptyState>`. List ↔ detail swap uses `animate-in fade-in-0 slide-in-from-right-2 / slide-in-from-left-2` wrapped in `flex flex-col gap-6`. Model handle wrapped in `<CopyButton size="inline-xs">`. `ProviderMark` renders neutral fallback chip. Detail-eyebrow VendorAvatar `aria-hidden`. |
| `/token-savings` | `src/pages/TokenSavings.tsx` | Token-compression savings page. |
| `/guardrails` | `src/pages/Guardrails.tsx` | Policy / limit configuration. Deep-link param: `?create=1` opens the create modal and strips on close. Revoked keys filtered out of every scope / key picker (see memory `feedback_no-revoked-keys`). |
| `/security` | `src/pages/Security.tsx` | Threat-event log with alert banner (`role="alert"` + `aria-live="assertive"` + `aria-atomic="true"`) + ramp-token coloring (`bg-danger-600 / text-danger-700`). KpiRail reconciles to the headline number (see memory `feedback_charts-must-reconcile`). Range selector defaults to "All" (lifetime-first view per memory `project_all-range-default`). **In-modal Mark PIJ event slide (2026-05-19, commits `5adba27` / `8f1aea1`):** the `ThreatEventDetailDialog` swaps between detail and mark-form views with a height-animated slide (driven by `useLayoutEffect` measuring detail/mark panel heights). The mark form's reason textarea is fixed at `h-48` (not content-driven) — the label is "Reason," not "Note." Marking flips the dialog badge to `<Badge variant="destructive">Marked false</Badge>`. |
| `/policies` | `src/pages/Policies.tsx` | Policy library / configuration. Tray uses `bg-card + border-border` (radio option cards moved off ink onto card token per commit `c2a0b87`). **Typography reference page for semantic heading/label/copy role classes** (`type-heading-*`, `type-label-*`, `type-copy-*`); use as the rollout baseline for other routes. |
| `/audit-trail` | `src/pages/AuditTrail.tsx` + `src/pages/AuditRecordDialog.tsx` | **Audit Trail page (built 2026-05-16).** PageTitle + subtitle + range selector + `<KpiRail>` with `<KpiTile>` slots + Event log table (with `<FilterToolbar>` + `<SearchInput>` + `<Select>` filters + `<TablePaginationFooter>` + `<TableEmptyState>` — canonical empty-state consumer). Table cells use `<Timestamp>` for time columns and the three-tier ink density (date/time in the `text-neutral-800` data tier — see memory `feedback_table-date-time-tier`). Anchor column renders `text-neutral-400 —` with `sr-only` semantics when missing. Row drill opens `<AuditRecordDialog>` with the cryptographically-verifiable evidence. **Required vocabulary:** "tamper-evident," "cryptographically verifiable," "anchored to Constellation's Digital Evidence layer." |
| `/activity` | `src/pages/Activity.tsx` | Usage-by-key table + breakdown. `<UsageByKey>` table is the canonical reference for the nowrap column policy. Deep-link param: `?range=24h\|7d\|30d\|all` is one-way (no strip on close). User-row monogram uses `<Monogram size="sm">` with first-char-of-first-word initials. |
| `/team` | `src/pages/Team.tsx` | Members + invitations + access requests + invite form. Empty branches in invitations / requests panes consume `<EmptyState>`. RowActionsMenu `min-w-32`. Action labels: "Approve request" / "Decline request". Invite-dialog labels at `text-neutral-600` (canonical form-label convention). Member-row monogram uses `<Monogram size="md">` with 2-char `initialsOf(name)` initials. |
| `/settings` | `src/pages/Settings.tsx` | Single-pane Profile + Security cards directly under `<PageHeader>` (Tabs collapsed 2026-05-10). `<SettingsRow>` primitive used for cross-card consistency. |
| `/api-keys` | `src/pages/ApiKeys.tsx` | **Canonical two-line key pattern** (memory `project_overview-composition`): keyname (sans, medium, neutral-900) over masked `sk-gw-…` (mono, xs, neutral-500). Revoked keys filtered from every consumer dropdown (canonical seed lives here). |
| `/billing` | `src/pages/Billing.tsx` | PAYG balance + auto-recharge + invoice history. AutoRechargeDialog uses the field-group label pattern (see §7 Field group label / 2026-05-13). |

---

## Validation & Export

`npx @google/design.md lint design.md` validates. `--format dtcg` exports DTCG tokens (preserves `components.*`); `--format tailwind` exports Tailwind-v3 JSON (primitives only — for v4, translate each into `@theme inline { --color-*: ...; }`).
