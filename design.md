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
  "6":  "24px"  # surface OK — outer page margins at lg+
  "8":  "32px"  # surface OK — between-section gap
  "10": "40px"  # surface OK
  "12": "48px"  # surface OK — page-bottom rhythm
  "16": "64px"  # surface OK — hero strip
  "20": "80px"  # surface OK — rare
  "24": "96px"  # surface OK — rare
  # Compound tier — within a primitive's row/group, between icon + label,
  # badge + text, label + control — any n × 4 is legal:
  "1":  "4px"   # compound only — micro gap (icon adjacency)
  "3":  "12px"  # compound only — button px-3 (sm/xs), Input px-3, table inner cells
  "5":  "20px"  # compound only — chart legend gap
  "7":  "28px"  # banned — odd 4-multiple, surface or compound (no use case)
  "9":  "36px"  # banned — odd 4-multiple, surface or compound (no use case)

components:
  button-default:  # primary action, neutral-900 fill
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body-sm}"   # text-sm font-medium
    rounded: "{rounded.sm}"
    height: 40                           # h-10 (default)
    padding: "0 16"                      # px-4 — pr-3 with icon (asymmetric)
    # Size ramp (2026-06-09): heights on the 8px scale — 24 / 32 / 40 / 48 for
    # xs (h-6) / sm (h-8) / default (h-10) / lg (h-12). Icon variants mirror:
    # icon-xs size-6 / icon-sm size-8 / icon size-10 / icon-lg size-12. Replaces
    # the prior 28/32/36/40 ramp; default went 36→40, no more h-9/h-7 buttons.
  button-outline:    { backgroundColor: "{colors.card}", textColor: "{colors.foreground}", rounded: "{rounded.sm}", elevation: "shadow-xs" }  # border-border + shadow-xs (2026-06-04) — subtle lift, same recipe as Card
  button-secondary:  { backgroundColor: "{colors.secondary}", textColor: "{colors.secondary-foreground}" }
  button-ghost:      { backgroundColor: "transparent", textColor: "{colors.foreground}" }
  button-destructive:{ backgroundColor: "{colors.destructive}", textColor: "{colors.primary-foreground}" }

  input:
    backgroundColor: "{colors.neutral-50}"
    textColor: "{colors.neutral-800}"
    rounded: "{rounded.sm}"
    height: 36
    padding: "0 16"  # px-4 (default), px-3 at sm/xs; focus = border-ring + ring-3/50; disabled = bg-neutral-100 text-neutral-500

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
    height: 36
    padding: "0 12 0 16"  # pl-4 pr-3 default; pl-3 pr-2 at sm/xs (asymmetric for chevron)

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
  tool-result-code:  { textColor: "{colors.neutral-900}" }  # font-mono text-sm -tracking-[0.14px] break-all — <code> element
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
**Not yet captured (TBD):** wordmark + horizontal/stacked lockups (logomark only, finalized); dark mode (intentionally absent — `:root.dark` block omitted; `@custom-variant dark` declared for future activation); mobile / touch state

---

## 0. Direction *(our extension)*

**Who:** human operator running an AI gateway in production. **Verb:** inspect — read-heavy; filter, sort, drill in, copy. **Feel:** Vercel Geist meets operator tooling — flat, dense, mono numerics, neutral-900 primary, neutral-100 page canvas under white cards with a 1px `border-border` edge + subtle `shadow-xs` lift.

### Defaults being rejected

1. **Blue primary action** → neutral-900 primary. Blue reserved for info/completed/active-tab/focus only.
2. **Blue underlined links** → ink + permanent faint underline (`decoration-neutral-200` → `decoration-neutral-500` on hover/focus). Blue is overloaded with 4 other meanings.
3. **24px gutters (Bootstrap/Material default)** → 12-column grid with **16px gutters**. Denser, more on-genre for an operator tool.
4. **Brand colors as chart series colors** → 8-slot OKLCH categorical palette picked by series index. Per-series `slot?: number` override only for brand-mnemonic exceptions (Anthropic→orange, OpenAI→blue).
5. **Heavy 1px+ card borders / shadcn default `border` + drop-shadow** → tight `border border-border` (neutral-200) + `shadow-xs`. The 2026-05-15 migration replaced the prior `shadow-(--shadow-border)` ring-as-border recipe with an explicit border so the edge reads at any zoom and against any backdrop. `--shadow-border` token is still in `index.css:117` but no longer the Card default.
6. **All numerics mono** → five-voice taxonomy. Hero summary numerics ≥24px sans tabular via `<HeroNumeric>`; data numerics <20px stay mono.
7. **WCAG 2.5.5 AAA 44×44 touch targets** → 32px (`h-8` / `size="sm"`) for Select / Input / SegmentedPill / IconActionButton chrome on dense filter rows. This is an operator dashboard on desktop (`Who: human operator running an AI gateway in production`), not a touch surface. WCAG 2.5.8 Level AA (24×24 minimum) is the target we hold — every chrome control clears it. If we ever ship a mobile / tablet surface, raise to AAA or wrap critical actions in `IconActionButton`'s `after:-inset-2` hit-target expansion. Until then, dense controls are correct and AAA touch findings should be marked "register carve-out" not "fix."

---

## 1. Overview *(Google canonical §1)*

Operator dashboard for an AI gateway. Read-heavy interaction (filter, sort, drill in, copy). Information density is high: three-tier table ink (500/800/900), right-aligned mono-tabular numerics, KPI rails (4-tile on Overview) with sparklines + delta tags, modals as drill-ins (not splash dialogs). Neutral-100 page canvas under white cards bordered at `border-border` + `shadow-xs`.

**Key characteristics:** 5 OKLCH ramps × 11 steps · three-tier material ladder (4/6/8/16px) · five-voice typography · no dark mode · neutral-900 primary, not blue · `border + shadow-xs` cards (not shadow-as-border, not heavy drop-shadows) · workspace switcher in the top bar, not the sidebar.

---

## 2. Colors *(Google canonical §2)*

Two layers: **palette atoms** (5 OKLCH ramps × 11 steps + atomic surfaces + 8-slot chart palette) in `@theme {}`, and **semantic layer** (shadcn vocab: `--background`, `--primary`, etc.) in `:root {}`. Semantic tokens always resolve to a palette atom via `var(--color-*)`. **No raw hex/oklch/rgba outside `@theme`.**

**Neutral ramp = Tailwind v4 default neutral (chroma 0).** As of 2026-05-17 the custom `ink-*` ramp was renamed to `neutral-*` and the `@theme` block no longer declares `--color-neutral-*` — Tailwind's built-in values resolve through the semantic aliases. Do not re-add the declarations (it would override defaults). Use `text-neutral-500`, `bg-neutral-100`, `border-neutral-200` at callsites; do not reach for `ink-*` (that token name no longer exists).

**Page canvas vs surface separation.** `--background` resolves to `var(--color-neutral-100)` (the page canvas); `--card` and `--popover` resolve to `var(--color-white)`. Cards visibly lift off the canvas via shadow elevation, not via a tinted card bg. **Surfaces that should remain white** (Button outline, Switch thumb, Tabs indicator, Field separator backdrop, DateRangePicker trigger chrome) bind to `bg-card`, NOT `bg-background`. `bg-background` is the canvas color and will render as neutral-100 anywhere it appears.

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
| 950 | Reserved — extreme contrast, future dark-mode anchor |

**Note:** `--neutral-700` is intentionally avoided as a table body-cell tone — middle-tier neutrals collide with the three-tier table policy (see §7 Tables).

### Status semantics

`success-100` bg + `success-700` text (success-600 for solid mid). `warning-100` bg + `warning-700` text (warning-600 for slow-row icons). `danger-100` bg + `danger-700` text; `--destructive` resolves to `danger-600`. `info` aliases to the blue ramp — no separate `info-*` ramp.

### Chart palette (categorical, 8-slot)

**Brand-decoupled.** Series pick a slot **by index, not by entity**. Per PM call (2026-05-06): "we need a palette of colors for all graphs throughout the app and they should be used regardless of the content."

All eight slots sit at L 0.62–0.85, C 0.13–0.20 (uniformly bright, mid-saturation). Adjacent slots in palette order are ≥85° apart in hue. **No neutral as a categorical slot** — gray is reserved for "Other/Unknown" semantic states. Per-series `slot?: number` override on `VendorMeta` lets specific charts pin colors when there's a brand mnemonic worth honoring (Anthropic→orange slot 2, OpenAI→blue slot 1) — opt-in only.

Slots: `chart-1` blue · `chart-2` orange · `chart-3` green · `chart-4` purple · `chart-5` coral · `chart-6` teal · `chart-7` amber · `chart-8` magenta. ← code-direct: `src/index.css:205–212`

KPI rail sparklines also consume chart palette tokens (`--color-chart-1` blue, `--color-chart-3` green, `--color-chart-7` amber, `--color-neutral-500` neutral) — **NOT** semantic ramps. Mixing systems makes rails read inconsistently.

### Vendor brand colors

Used only by `<VendorAvatar />` (bare icon at `size-4`, no chip wrapper). Anthropic `#D97757` · OpenAI `#10A37F` · Meta `#0064E0` · DeepSeek `#4D6BFE` · xAI `#3D3D3D` · Google/Mistral/Cohere multi-color SVG fills (wrapper `style.color` ignored). Source: `src/components/icons/vendor-meta.tsx`.

### Semantic token quick-reference

**Hard rule: every Tailwind utility that targets a surface, border, ring, or foreground tone must bind to a semantic token — never a raw palette atom.** The `:root {}` semantic layer is the single reskin surface; components that bypass it (e.g. `border-neutral-200`, `bg-neutral-100`) couple themselves directly to the palette and break any future theme swap.

| Use this class | Resolves to | Do NOT write |
| --- | --- | --- |
| `bg-background` | white | `bg-white` on page / dialog surfaces |
| `bg-card` | white | `bg-white` on Card / KpiRail / table containers |
| `bg-popover` | white | `bg-white` on dropdown / Select / Tooltip surfaces |
| `bg-muted` | neutral-100 | `bg-neutral-100` on secondary / count-chip / tag surfaces |
| `bg-secondary` | neutral-100 | `bg-neutral-100` on interactive secondary fills |
| `bg-accent` | neutral-100 | `bg-neutral-100` on hover/accent fills |
| `border-border` | neutral-200 | `border-neutral-200` for dividers, table separators, list containers, form control edges |
| `ring-ring` | neutral-400 | `ring-neutral-N` for focus rings |
| `text-foreground` | neutral-900 | `text-neutral-900` for primary text, headlines, row identifiers |
| `text-muted-foreground` | neutral-500 | `text-neutral-500` for secondary text, eyebrows, icon-action tints |

**Known gap — `bg-neutral-50`:** form-field surfaces (Input, Textarea, Select trigger, table header) use neutral-50 as a wash. A `--input-bg: var(--color-neutral-50)` semantic token has not yet been added to `:root {}`. Until it is, `bg-neutral-50` is the **one permitted ramp-token exception** in component code. Do not introduce any other ramp-token background; add a semantic alias first.

**Typography ramp tokens with no current semantic alias** (`text-neutral-800` body-data, `text-neutral-600` table-header, `text-neutral-400` placeholder / missing-data dash) — use the ramp token directly until corresponding semantic aliases are added to `:root {}`. These are identified gaps, not free passes; close them when touching the token layer.

**Chart runtime colors** — `style={{ backgroundColor }}` / `style={{ color }}` from the chart palette helper are runtime values, not Tailwind classes. No token violation.

### Do not use

- Raw hex/oklch/rgba outside `@theme`.
- Single-token semantics (`--color-warning`, `-2` variants) — use ramp steps (`text-warning-700`, `bg-success-100`).
- Blue for primary action — `--primary` resolves to neutral-900.
- Blue for inline links — use ink + faint underline (see §7).
- `text-neutral-600`/`text-neutral-700` as table body-cell tones — collides with three-tier policy.
- Vendor colors as chart series colors by default — charts use `--chart-1..8` by index.
- **Raw ramp classes where a semantic token exists** — see the semantic token quick-reference table above. Exceptions: `bg-neutral-50` (no `--input-bg` alias yet) and typography ramp tokens with no current alias (`text-neutral-800/600/400`). Every other ramp surface/border/ring/foreground token has a semantic alias — use it.

---

## 3. Typography *(Google canonical §3)*

### Font Family

- **Sans:** `"Geist", ui-sans-serif, system-ui, sans-serif`
- **Mono:** `"Geist Mono", ui-monospace, "SFMono-Regular", monospace`

Loaded via Google Fonts CDN + `@fontsource-variable/geist` fallback. Geist serves headings too — `--font-heading` aliased to `--font-sans`. No IBM Plex.

### Hierarchy

Tailwind named scale only. Three sizes overridden in `@theme` to Geist's heading scale (even-numbered, larger increments at top); other sizes match Geist defaults. **Arbitrary `text-[Npx]` is banned.**

| Role (YAML key) | Font | Size | Weight | Line Height | Letter Spacing | Rule | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `hero-numeric-lg` | Geist | 32 | 500 | 36 | tight | Full-page hero metric only (Requests page hero, `8,241`). One per page. | sans + `tabular-nums` — presentation tier. |
| `hero-numeric-default` | Geist | 24 | 500 | 32 | tight | KPI rail value, panel hero (Top Keys total). | sans + `tabular-nums`. |
| `h1` | Geist | 32 | 500 | 40 | tight | Page title (artboard h1). | overridden text-3xl (Geist 32). |
| `h2` | Geist | 24 | 500 | 32 | normal | Superseded as the section-title voice by `h3` (20px, below). The h2 *element* still carries `SectionTitle as="h2"` (at 20px) when a section has sub-headings (e.g. Overview "Get started"). | text-2xl/8. |
| `h3` | Geist | 20 | 500 | 28 | normal | Page section titles via `<SectionTitle>` — "Overview", "Recent …", "Activity This Week", "Get started". Default `<h3>` element; `as` overrides level without changing the voice. | text-xl/7. No tracking. |
| `h4` | Geist | 18 | 500 | 28 | normal | Card title, modal hero ID, modal `KpiTile` value (mono — below sans-hero threshold). | text-lg. |
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
| Heading 72 | `type-heading-72` | 72/72 medium tracking-[-4px] |
| Heading 64 | `type-heading-64` | 64/64 medium tracking-[-4px] |
| Heading 56 | `type-heading-56` | 56/56 medium tracking-[-3px] |
| Heading 48 | `type-heading-48` | 48/56 medium tracking-[-3px] |
| Heading 40 | `type-heading-40` | 40/48 medium tracking-[-2px] |
| Heading 32 | `type-heading-32` | 32/40 medium tracking-[-1px] |
| Heading 24 | `type-heading-24` | `font-sans text-2xl/8 font-medium` |
| Heading 20 | `type-heading-20` | `font-sans text-xl/7 font-medium` |
| Heading 18 | `type-heading-18` | `font-sans text-lg/7 font-medium` |
| Heading 16 | `type-heading-16` | `font-sans text-base/6 font-medium` |
| Heading 14 | `type-heading-14` | `font-sans text-sm font-medium` |
| Label 20 | `type-label-20` | `font-sans text-xl/8 font-normal` |
| Label 18 | `type-label-18` | `font-sans text-lg/5 font-normal` |
| Label 16 | `type-label-16` | `font-sans text-base font-medium` |
| Label 14 | `type-label-14` | `font-sans text-sm font-medium` |
| Label 12 | `type-label-12` | `font-sans text-xs font-medium` |
| Copy 24 | `type-copy-24` | `font-sans text-2xl/9 font-normal` |
| Copy 20 | `type-copy-20` | `font-sans text-xl/9 font-normal` |
| Copy 18 | `type-copy-18` | `font-sans text-lg/7 font-normal` |
| Copy 16 | `type-copy-16` | `font-sans text-base font-normal` |
| Copy 14 | `type-copy-14` | `font-sans text-sm font-normal` |
| Copy 14 tight | `type-copy-14-tight` | `font-sans text-sm/5 font-normal` |
| Copy 12 | `type-copy-12` | `font-sans text-xs font-normal` |

**Usage rule:** when one of the semantic roles above fits, use it in page code.
Only compose raw text utilities when a role truly does not exist yet; then
promote that recipe into a named role.

**Global input-helper rule:** all helper text under inputs uses
`type-input-helper` (locked recipe: `font-sans text-xs font-normal` = 12px,
line-height 16px, plus `mt-2` = 8px gap from the input). Do not hand-roll
helper text size or spacing with one-off `text-*` / `mt-*` values.

### Five-voice taxonomy (codified 2026-05-07)

Each voice has a single job; mixing them is the drift surface. **Critical rule:** sans labels are `font-medium` minimum. `font-normal` reads as ambient body, not a label. Color does the *quiet* work; weight does the *structural* work.

| Voice | Recipe | Use |
| ------- | -------- | ----- |
| **Display headline / hero numeric** | `font-sans tabular-nums font-medium tracking-tight` (via `<HeroNumeric>`) | Page titles, KPI hero values (24px), full-page hero metrics (32px), panel heroes — *summary, look at this* |
| **Body / label** | `font-sans` (regular or `font-medium`) | Card titles, page subtitles, button labels, key/project names, table column headers, **form / input labels** (`<Label>` primitive) — *human, read this* |
| **Eyebrow** | `font-mono uppercase tracking-[0.1em] font-medium` | Section eyebrows, KPI labels, segmented control labels, chrome strips — *what is this*. **Never use this for form/input labels** — those go in the Body/label row above. Mono UPPERCASE on a field label reads as a chrome strip, not as something the user is meant to fill in. |
| **Badge / pill** | `font-mono tabular-nums font-medium text-xs` (via Badge default) | Status codes (`200`/`500`), counters, deltas, inline pills — *operational chrome* |
| **Data** | `font-mono tabular-nums` | Table cells, IDs, codes, hashes, model identifiers, modal sub-tier numerics — *raw data* |

**Hero/data split is size-gated.** Hero summary numerics ≥24px render sans (sans + `tabular-nums` carries the cell-padding mono affordance while signaling "presented summary"). **Below ~20px, numerics revert to mono regardless of role** — modal `KpiTile` at text-lg, table cells, badge contents, row costs all stay mono. The cutoff is real: at ~18px the digit-shape differences between Geist Sans tabular and Geist Mono become more visible, and the mono-illusion breaks.

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

`<Card>` is `p-4`, `<CompactKpi>` is `p-4`, `<KpiTile>` is `p-4`, `<EmptyState>` is `py-12 px-6`, `<DialogContent>` is `p-6` (bumped from `p-4` on 2026-05-11 — the live detail modals needed the air for eyebrow + title + meta + status badge in the header), `<DialogScroll*>` sections are `px-6 pt-6` on header/summary and `px-6 pt-6 pb-6` on body — `<DialogScrollFooter>` drops to `px-6 py-4 + border-t` so the action band reads as chrome, not content (mirrors `<CardFooter>`'s `p-4`). `<Table>` cells are `px-3` inner / `px-4` outer. **These are *the* rule for their consumers** — composed pages don't override them.

#### Token roles

| Token | Value | Tier | Uses |
| --- | --- | --- | --- |
| `spacing.1` | 4px | compound | Micro gap (icon adjacency, internal grouping) |
| `spacing.2` | 8px | surface OK | Badge gap, button icon gap, between dense siblings |
| `spacing.3` | 12px | compound only | Button px-3 (sm/xs), Input px-3, inner table cells |
| **`spacing.4`** | **16px** | **surface — dominant** | **Card padding, table outer cells, page gutter, section gap, between cards in a grid** |
| `spacing.5` | 20px | compound only | Chart legend gap, hero internal rhythm |
| `spacing.6` | 24px | surface OK | Outer page margins at lg/xl/2xl breakpoints (`lg:p-6`); spec-sheet panel padding |
| `spacing.8` | 32px | surface OK | Between-section gap on spec-sheet artboards |
| `spacing.12` | 48px | surface OK | Page-bottom rhythm |
| `spacing.16` | 64px | surface OK | Hero strip spacing |

**Rule:** Start at **16px** (`gap-4` / `p-4`) for any surface-tier card padding, page gutter, section gap, between-card gap. Drop to compound-tier 12px (`px-3` / `gap-3`) only inside a primitive's local layout (button sm, input sm, table inner cells). Use 24px (`p-6`) for outer page margins on large screens or spec-sheet panel padding. Above 24px, justify with a specific use case — there are very few in this system.

### Grid & Container

- **Composed pages:** 12-column grid + 16px gutters (`grid grid-cols-12 gap-4`). Asymmetric layouts via `col-span-N` (row sums to 12).
- **Outer page margins:** 24px (`lg:p-6`) at `lg`/`xl`/`2xl`; less below.
- **All pages** are responsive but tuned for ≥1280px. (The MVP-era `src/artboards/` spec sheets, which used a fixed `w-[1440px]` column to mirror Paper, were stripped on 2026-05-11.)
- **Page-header subtitle:** `text-base text-neutral-500 tracking-snug` (see §typography tracking rule — `tracking-snug`, not `tracking-tight`). Width: `max-w-1/2` on the *wrapper column* (not the `<p>` — fractional max-w on a leaf doesn't behave).

Whitespace carries hierarchy. Cards never touch — shadow-as-border does the separation. Body has a 40px linear-gradient grid on `--canvas-bg`; anything sitting on white needs explicit `bg-white` or `bg-neutral-50`.

---

## 5. Elevation & Depth *(Google canonical §5)*

Elevation runs on two parallel systems: **legacy shadow tokens** (`--shadow-popup`, `--shadow-border`, `--shadow-border-hover`, `--shadow-modal`) still live in `index.css:117–138` and remain the source of truth for menus, popovers, and modals; and **the Card / KpiRail / Tabs-line family** which migrated 2026-05-15 onto an explicit `border border-border shadow-xs` recipe (1px neutral-200 stroke + Tailwind's built-in `shadow-xs` for subtle lift). The migration trades ring-only edges for an honest border that survives any backdrop, any zoom — operator-tool surfaces look brittle at >1× zoom when the only edge is a ring shadow.

| Tier | Recipe | Radius | Surfaces |
| --- | --- | --- | --- |
| Sub-element | none | `rounded-xs` (4px) | Tabs trigger, Segmented item, SelectItem, Badge, MenuItem |
| Menu / Chrome | `--shadow-popup` token (4px lift 8% + 1px ring 4%) | `rounded-sm` (6px) | Select content, Menu popup, Popover, Tooltip, Toast, Button, Input |
| **Card / Surface** | **`border border-border shadow-xs`** (migrated 2026-05-15) | **`rounded-md` (8px)** | **Card, KpiRail, Tabs `line` variant border-b, MessageBlock outline** |
| Hover (card) | `border-border` + `hover:shadow-sm` where interactive (most cards are static) | (same as card) | Hovered card variant — rare in operator surfaces |
| Modal | `--shadow-modal` token (16px lift 12% + 1px ring 6%) | `rounded-xl` (**16px LOCKED**) | Dialog, AlertDialog, Sheet (right-docked = `rounded-none` left edge) |
| Soft card (in colored panel) | `--shadow-card-soft` token (8/6px lift 5% — two layers, same `color-mix` family) | `rounded-md` (8px) | Cards sitting inside a non-white panel where standard chrome would compete with the panel bg (canonical: SecurityDefault events ticker inside the right `bg-neutral-50` panel). Added 2026-05-26 — defined in `index.css` alongside `--shadow-popup`/`--shadow-modal`. |

**Legacy `--shadow-border` token.** Still defined in `index.css:117–120`. No primitive currently consumes it after the 2026-05-15 migration. Don't re-introduce it on new Cards or KpiRails — they take the `border + shadow-xs` recipe. Keep the token for the rare case where a surface genuinely wants a ring-only edge (none today).

**Three-tier material ladder (codified 2026-05-10).** The prior two-tier (6/12) collapsed cards and buttons onto the same radius (6px) and put modals one step up (12px). Migration to three-tier opens a discrete *card / surface* tier at 8px — Card, KpiRail, and table containers now read distinct from buttons / inputs / menus (6px). Modal radius bumps to 16px to preserve the 2× tier ratio against cards (`8 → 16`). Sub-element radius (4px) is unchanged. Token: `--radius-xl: 1rem` in `@theme inline` (`index.css:305`).

**Rules:** Card-tier surfaces wear an honest `border-border` plus `shadow-xs`. Menus and modals stay on their shadow tokens. **Concentric rule:** item radius < container radius (4px badge inside 8px card inside 16px modal). Don't override `rounded-xl` on modals — locked.

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

`src/components/ui/button.tsx` (Base UI under shadcn — wraps `ButtonPrimitive` from `@base-ui/react`, **not Radix**). CVA with 4 size variants (xs/sm/default/lg) and 6 style variants (default/outline/secondary/ghost/destructive/link).

- **Default:** `bg-primary text-primary-foreground` (neutral-900 / white). 36px tall (`h-9`), `px-4` (`pr-3` with icon). `rounded-sm`. `text-sm font-medium`. Press: `active:not-aria-[haspopup]:scale-[0.98]` (scale-down) + `will-change-transform` (standardized 2026-06-18, replaced `active:translate-y-px`; the `not-aria-[haspopup]` gate keeps popover triggers from scaling). ← `button.tsx`
- **Sizes:** xs h-7 px-3 text-xs · sm h-8 px-3 text-xs · default h-9 px-4 text-sm · lg h-10 px-4 text-sm (brand tightening from shadcn's px-6 default — operator-tool register, not marketing CTA; size differentiates by height only)
- **Outline:** `border-border bg-card` + **`shadow-xs`** (added 2026-06-04, primitive-level so it cascades to every `variant="outline"`) — the subtle lift matches the Card recipe and reads against any backdrop. `box-shadow` is in the button's transition list, so it does not snap on hover.
- **Asymmetric icon padding:** `has-data-[icon=inline-start]:pl-3` / `has-data-[icon=inline-end]:pr-3` (default size). Mirrors `SelectTrigger` rule (see below).

**Rule:** Primary action = `default` (neutral-900). Use `outline` for secondary, `ghost` for tertiary in toolbars/menus. `link` variant is for standalone link-buttons; **inline body-text links** use `<button>` with the underline affordance (see Inline links below).

### Inputs & Forms

- **Input** (`input.tsx`) — `bg-neutral-50 border-border rounded-sm h-9 px-4 text-sm text-neutral-800`. **`bg-neutral-50` is the contract** — sits flush in filter rows. Sizes: xs h-7 px-3 text-xs · sm h-8 px-3 text-xs · default h-9 px-4 text-sm · lg h-10 px-4 text-sm. **`surface` variant:** `card` (default) = bg-neutral-50 for inputs on card/modal surfaces; `background` = bg-neutral-100 for inputs on the page background layer (matches the SegmentedPill track) — use the variant, not a per-page `[&_input]` override. Focus: `border-ring ring-3 ring-ring/50` (neutral-tinted, not blue). Disabled: `bg-neutral-100 text-neutral-500`. Invalid: `border-destructive ring-destructive/20`. **`--input` resolves to neutral-300** (bumped 2026-05-15 from neutral-200) — the stroke is one ramp step stronger than `--border` so unfilled form controls read as actionable.
- **Textarea** (`textarea.tsx`) — same surface as Input. `min-h-16`, `field-sizing-content`, `py-3 px-4`.
- **InputGroup** (`input-group.tsx`) — wrapper for inputs with addons (icon, kbd, button). `h-9`, same surface as Input.
- **Field** (`field.tsx`) — composes `<FieldLabel>` + `<FieldDescription>` + `<FieldError>` + control. Default gap-y between fields = 16px. No surface chrome.
- **Label** (`label.tsx`) — `text-sm leading-none font-medium`. **`font-medium` minimum** — `font-normal` reads as ambient body, not a label.
- **Checkbox** (`checkbox.tsx`) — `size-4 rounded-[4px]`, `border-input` unchecked / `bg-primary` checked. Hit-target via `after:-inset-x-3 after:-inset-y-2`.
- **Radio** (`radio-group.tsx`) — `size-4 rounded-full`, same color treatment as Checkbox.
- **Switch** (`switch.tsx`) — `h-[18.4px] w-[32px]` default / `h-[14px] w-[24px]` sm. Thumb `rounded-full size-4`. `data-checked:bg-primary` / `data-unchecked:bg-input`.

**Rule:** Group related fields with `<FieldSet>` + `<FieldLegend>` (text-base font-medium). Validation state via ring + `border-destructive`, never background tint.

**Field group label** (codified 2026-05-13 from Billing's AutoRechargeDialog) — when a control group sits *under* its label (radiogroup of preset tiles, slider with value display, segmented control) inside a form or dialog, the label is `font-sans text-sm font-medium text-neutral-500 m-0` on a `<p>` (or `<FieldLegend variant="label">` if the group is a true `<fieldset>`). **The color is the load-bearing tell:** `text-neutral-500` recedes so the values lead the eye — this is what distinguishes a *group label* from `<Label>` (which pairs 1:1 with a single input and stays at the default neutral-900 weight). Don't use Eyebrow for this slot — mono UPPERCASE on a group label reads as a chrome strip, not as a form heading; the primitive's own header note explicitly retires it from modal title blocks for the same reason. **Don't promote to neutral-900** even when the label feels like it should be "louder" — louder is what `<Label>` already does for paired inputs; a group label by definition is summarizing what's below, so it stays quiet on purpose.

### Cards & Containers

- **Card** (`card.tsx`) — `rounded-md bg-white border border-border shadow-xs py-4 text-sm text-neutral-900`. **Border + `shadow-xs`, NOT shadow-as-border** (migrated 2026-05-15 from the old `shadow-(--shadow-border)` recipe — see §5). Radius is `rounded-md` (8px) — the card / surface tier (2026-05-10); buttons and chrome stay at `rounded-sm` (6px) so cards read a discrete material step up. **`density` variant** (`default` | `flush`): default = `gap-4 py-4`; flush = `gap-0 py-0` — used whenever a `<Table>` or full-bleed feed (FilterToolbar + Table + TablePaginationFooter stack) lives directly inside the Card and supplies its own internal border-t rhythm. Composition: `<Card>` (gap-4 col) → `<CardHeader>` (px-4 grid) → `<CardTitle>` (text-base font-medium leading-snug) → `<CardDescription>` (text-sm/5 text-neutral-500) → `<CardContent>` (px-4) → `<CardFooter>` (p-4, white, **no inner border, no wash** — structural separation comes from spacing alone; the Card's own `border` carries the edge). When a `<CardFooter>` is present, Card auto-applies `pb-0` so the footer hugs the bottom edge. Compact: `data-[size=sm]` → `gap-3 py-3`. **Cross-ref:** mirrors `<DialogFooter>` (short-modal variant) — no inner border, gestalt from spacing. The scroll-modal `<DialogScrollFooter>` is the *other* footer pattern (border-t + tighter `py-4`) — used when content scrolls above the action band.
- **KpiRail** (`kpi-rail.tsx`, codified 2026-05-10) — bordered single-row container with inset divider hairlines between children. Same chrome migration as Card on 2026-05-15. API: `<KpiRail columns={2|3|4|5|6}>{children}</KpiRail>`. Recipe: container `grid rounded-md bg-white border border-border shadow-xs overflow-hidden`; every child after the first wrapped in a divider div with `before:absolute before:left-0 before:inset-y-4 before:w-px before:bg-neutral-200` — hairline doesn't reach the rounded corners. Tile shape (`<KpiTile>` is the canonical filler — see Hero Numerics & KPIs; CompactKpi / custom mono tiles / plain divs also legal) is the caller's call; only the shell + divider treatment is enforced. Canonical consumer: Overview's 4-tile rail (Dashboard.tsx, 2026-05-17 redesign).

  **Card padding is locked at 16px. Do NOT pass padding/gap classes (`px-N`, `py-N`, `p-N`, `gap-N`) on `<Card>`, `<CardHeader>`, `<CardContent>`, or `<CardFooter>` from composed pages.** If you find yourself reaching for `px-5`, `py-5`, `gap-5`, `-mx-5` etc. — stop. The primitive's defaults are the contract; reach back to the design system if a surface needs different rhythm. Legitimate overrides are layout-only: `min-w-0`, `col-span-N`, `w-[Npx]`, `flex-1`, `items-center`. Any primitive-padding override must be justified with a comment citing the variant it represents, and ideally promoted to a primitive variant (`size="sm"` / `size="lg"`) rather than inlined.
- **CodeCard** (`code-card.tsx`) — code-preview card with header strip + syntax-highlighted body. Uses `<CodeBlock>` driving `--color-syntax-*` tokens. Top-right copy affordance via `<CopyButton>`.

**Rule:** Cards never touch — `gap-4` between cards in a grid; the canvas (neutral-100) reads through. `<Card>` carries its own `border border-border shadow-xs` — don't add extra `border` classes on top of the primitive. The previous "shadow ring IS the border" rule was retired on 2026-05-15 with the border-token migration.

### Selectors

- **Tabs** (`tabs.tsx`) — sliding white indicator on active trigger (200ms ease-out, transform+width). Two variants: `default` (pill-on-well, `bg-muted rounded-sm h-8 p-1`, active trigger `bg-background rounded-xs`) and `line` (underline, transparent track, active trigger gets a 2px neutral-900 underline). Vertical orientation supported on the default variant.

**Rule (`line` variant — trigger contract):**

- **Trigger vertical padding is `pt-2 pb-3`** (8px top, 12px bottom). Codified 2026-05-21 — earlier `pt-4 pb-3` was disproportionate for the page-level register where most line tabs live (dialog headers, page sub-nav). Every line-variant tab strip site-wide uses this rhythm; no usage-site overrides needed.
- **Active trigger never gets a hover background.** The trigger's height is `calc(100%-1px)` (1px short of the TabsList) and the indicator (`bottom-[-1px] h-0.5`) overlaps the trigger's bottom 1px by one pixel — so any `hover:bg-*` on the active trigger would clip the indicator from 2px to 1px on rollover. The primitive applies `data-active:hover:bg-transparent` for `variant="line"` to lock this; the indicator stays full height. Hover affordance still fires on non-active triggers (`bg-neutral-100`) because those don't carry an indicator. Codified 2026-05-21 after the Audit-record modal regression.
- **Segmented** (`segmented.tsx`) — pill-style selector, same sliding-indicator idiom as Tabs default. `bg-muted rounded-sm overflow-clip`. Sizes: default `h-8`, sm `h-7`. Variants: `pill` (default) and `group` (adjacent borders, neutral-900 fill on selected — rare).
- **SegmentedPill** (`segmented-pill.tsx`) — view-scope toggles in toolbars. **Don't add as an extra row** — view-scope controls live in the existing toolbar. Requests uses `<SegmentedPill size="sm">` (1H / 24H / 7D / 30D) anchored right via `ml-auto` so the toolbar splits cleanly into facets-left + time-scope-right. Pairs with a custom-range `<DateRangePicker>` (Base UI Popover + react-day-picker v10) for ranges outside the preset window; selecting one clears the other.
- **SegmentedPill track border (codified 2026-06-01):** the track carries a `border-border` hairline — **not** a borderless `border-transparent` track. The track fill is `bg-neutral-100`, the *same* tone as the page surface (`--background` = neutral-100), so without an edge the unselected segments read as floating on the canvas and only the white selected thumb is legible. The border gives the control a defined boundary against the same-tone surface and keeps it a visual peer of the bordered controls it sits beside — Select triggers and outline Buttons like the `Custom` range button it pairs with. The border slot was always reserved (previously `transparent`), so making it visible is a **zero-layout-shift** change. `segmented.tsx`'s pill variant already used `border-border`; the two segmented primitives are now aligned. Supersedes the earlier Paper spec WW0-0 "effectively borderless track" note.

**Rule (Tabs vs Segmented — when to pick which):**

- **`Tabs variant="line"`** = sibling sub-pages of the same surface. Each tab represents content that would map to its own URL path (`/team/members`, `/team/invitations`, `/settings/general`). Different content semantics, equal stature, primary navigation within the page. Used by Team, Models (modality tabs), and the Request detail modal. Matches Vercel's settings/team/billing/integrations sub-nav, Material 3, IBM Carbon.
- **`Tabs variant="default"`** (pill-on-well) = secondary view scope where the items are stylistic peers but the surface pattern still calls for full-page tab semantics. Rare at page-header level — most page-header tab use cases are line. Reserve for nested tab strips inside a card where the line variant would compete with surrounding chrome.
- **`Segmented` / `SegmentedPill`** = mutually-exclusive view filters of the *same* data, lives inside a toolbar or panel, not page-level. Time-range pickers (24h / 7d / 30d), chart-type toggles (Bar / Line), unit switchers, code-vs-preview inside a card. Constrained-width by design.

The semantic test: are these *pages of the surface* (line tabs) or *filters/views of the same data* (segmented)? If you'd give each one its own URL, it's a tab. If they're alternate lenses on shared content, they're segmented.

- **Select** (`select.tsx`) — Base UI. Trigger: `bg-neutral-50 border-neutral-200 rounded-sm h-9 text-sm`. Content: `rounded-sm shadow-(--shadow-popup) bg-popover` with **`p-1`** (2026-06-04, was `py-1`) so each `rounded-xs` item insets 4px from the popup edge and the highlighted/selected row never bleeds edge-to-edge — same inset recipe as `Menu`. Item: `rounded-xs px-3 py-1.5 text-sm`. **Asymmetric padding** `pl-N pr-(N-1)` across all sizes (`pl-3 pr-2` xs/sm, `pl-4 pr-3` default/lg) — optical balance: text side wants more air, chevron has built-in bounding-box whitespace. Long lists use `<SelectGroup>` + `<SelectLabel>` + `<SelectSeparator>` to group (e.g. First-party vs Marketplace). **Chevron rotates 180° while open** (2026-06-04): trigger carries `group/select`, the `ChevronDownIcon` is `group-aria-expanded/select:rotate-180 transition-transform duration-150 ease-out motion-reduce:transition-none` — transform-only, 150ms, the `--ease-out` curve; transitions back to 0 on close. **SelectValue shows the item label, not the raw value** — a context map collects `value → children` from `SelectItem`s (Base UI's `Select.Value` would otherwise render the raw value, e.g. `all` instead of `All models`). **The field `<Label>` must NOT use `htmlFor` pointing at the trigger** — a `<label for>` forwards clicks to its control, so clicking the field title would open the dropdown; give the trigger an `aria-label` for the accessible name instead.
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
- **SearchInput** (`search-input.tsx`) — `<Input>` composition with a leading `lucide` Search icon at `size-4 text-neutral-500`, locked at `size="sm"` (`h-8 px-3 text-xs`) for filter-toolbar density. Width: `w-50` (200px) or `w-60` (240px) depending on the table — fixed width keeps the toolbar predictable across pages. Don't hand-roll the icon + input compose; use this primitive.

### Avatar & timestamp chrome

- **Monogram** (`monogram.tsx`, codified 2026-05-17) — avatar initial chip. Sizes: `sm` (size-4, single initial, used in dense table rows) / `md` (size-7, two initials — used on the top-bar workspace switcher and Team rows). Tones: `blue` / `rose` / `emerald` / `amber` / `ink` — all saturated 700-step bg + white fg from the existing ramps (no chart-palette borrowing). Renders as `aria-hidden` `<span>` — pair with the underlying name for screen-reader users. Initials are caller-supplied so each consumer can derive them their own way (Team uses 2-char `initialsOf(name)`; Activity uses first-char-of-first-word).
- **Timestamp** (`timestamp.tsx`) — canonical date/time table cell. Visible text is the absolute timestamp by default (`format="timestamp"` — LangChain-style); hover/focus reveals the relative time in a `<Tooltip>`. Two other modes: `format="dateNumeric"` (compact date for dense rows, full timestamp in the tooltip), `format="relative"` (relative-first surface, absolute in the tooltip). For `date === null` renders "Never" with no tooltip. **Use in every table cell that surfaces a date or datetime** — pairs Olivia's "is this fresh?" scan with Devon's "greppable absolute" need without forcing a column choice. Visible text lives in the `text-neutral-800` data tier (see Lists/Tables three-tier table ink).

### Popover, Tooltip, Separator

- **Popover** (`popover.tsx`) — Base UI `Popover.*` thin wrapper. Surface: `rounded-sm bg-popover shadow-(--shadow-popup)` (`shadow-popup` token, chrome tier). Used by the `<DateRangePicker>` trigger (custom-range surface on the Requests time-scope toolbar) and by the Mark PIJ event slide (Security page). Same dismiss-flicker rule as Dialog: needs `data-closed:fill-mode-forwards` on both popup and overlay, and `onOpenChangeComplete` for URL deep-link cleanup.
- **Tooltip** (`tooltip.tsx`) — Base UI `Tooltip.*` thin wrapper. Surface: `rounded-sm bg-popover shadow-(--shadow-popup)` with `text-xs` body. Mandatory on every `<Timestamp>` (relative ↔ absolute pairing), on Cost-column dashes for BYOK rows (Requests), and on truncated identifiers. Trigger needs `tabIndex={0}` whenever the tooltip carries content keyboard users must reach (BYOK Info icon, Cost cell dash).
- **Separator** (`separator.tsx`) — Base UI `Separator` wrapper. Renders a 1px `bg-border` rule. Use for in-card section breaks where `border-t` on the next child would couple to the child instead of belonging to the parent layout. Rare — most rhythm in this codebase comes from `border-t` + spacing rather than dedicated rules.

### Modal / Drawer

- **Dialog** (`dialog.tsx`) — centered modal. **Modal tier:** `rounded-xl` (**16px LOCKED**) + `shadow-(--shadow-modal)`. Overlay: `bg-neutral-900/40 backdrop-blur-xs`. The primitive ships **three content shells** and a set of section slots so every modal in the project composes from the same source — *do not* hand-roll modal chrome on a consumer.

  **Content shells:**
  - `<DialogContent>` — short-form modal (Team Invite member, AlertDialog destructive confirms). `bg-white rounded-xl border border-neutral-200 shadow-(--shadow-modal) p-6 max-w-sm`. Padding bumped from `p-4` → `p-6` on 2026-05-11. Pairs with `<DialogHeader>` (`flex flex-col gap-2`) + `<DialogFooter>` (`mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end` — no border; the `mt-2` lifts the action band ~24px below the last field for a "now commit" gestalt).
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
- **Menu** (`menu.tsx`, codified 2026-05-10) — shadcn-style wrapper over Base UI Menu. Exports: `Menu` / `MenuTrigger` / `MenuContent` / `MenuItem` / `MenuLabel` / `MenuSeparator`. Recipe: content `min-w-44 rounded-sm bg-white border border-neutral-200 shadow-(--shadow-popup) p-1 origin-[var(--transform-origin)]` (the transform-origin variable is published by Base UI's Positioner, so popups scale *from the trigger*, not the popup's geometric center — small detail, big feel). Item: `rounded-xs h-8 px-2 text-sm text-neutral-900 [&_svg]:text-neutral-500` with `transition-colors duration-100 ease-out` so keyboard arrow-through fades highlight states rather than snapping. `variant="destructive"` swaps colors to `text-danger-700 / data-[highlighted]:bg-danger-50` — used for Sign-out in `<UserMenu>`. Consumers: `<UserMenu>`, sidebar workspace switcher.
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
- **ToolResultCode** (`tool-result-code.tsx`, codified 2026-05-10) — inline `<code>` recipe for tool-result JSON blobs. `font-mono text-sm text-neutral-900 -tracking-[0.14px] break-all`. Used by Conversations on tool-result message bodies. Semantic `<code>` element (these blobs ARE machine output).
- **InlineCode** (`inline-code.tsx`, codified 2026-05-11) — short identifier chip rendered as `<code>`. Recipe: `font-mono text-neutral-800 bg-neutral-100 rounded-xs px-1.5 py-0.5`. Default `text-sm`; `size="sm"` drops to `text-xs` for table-cell density. Distinct from `<ToolResultCode>` — InlineCode is the chip variant (short identifiers like `claude-haiku-4-5` inline in prose), ToolResultCode is the JSON-blob variant (`break-all`, no chip background).

### Typography primitives

- **Eyebrow** (`eyebrow.tsx`, codified 2026-05-11) — small mono-uppercase chrome label used above KPI values, in sidebar nav-section headers, atop CompactKpi titles, on artboard / spec-sheet headers. Recipe: `font-mono text-xs uppercase tracking-[0.1em] font-medium text-neutral-500`. Default element `<span>` (inline); pass `as="div"` when a block is needed. Extracted after the 2026-05-11 audit found 13 hand-rolled occurrences across Requests / Conversations / Security/16/18 + sidebar.tsx + compact-kpi.tsx + Artboard.tsx (the last had drifted to `tracking-[0.08em]` without `font-medium`). **No size variant ships** — the previous `Eyebrow / default` (text-sm) variant from the typography spec is unused (modal eyebrows removed 2026-05-11); add the variant back with intent when a surface needs it.
- **SectionHeading** (`section-heading.tsx`, codified 2026-05-11) — h3-class heading used inside modal body sections ("Evidence", "Detection", "Context", "Details", "Security scan"). Base recipe: `font-sans text-sm font-medium text-neutral-900 m-0` (`type-label-14` equivalence). Renders `<h3>` by default; pass `as="h2|h4|h5|h6"` to override level. For policy-panel section headings, promote via semantic role class (`className="type-heading-16"`). Extracted after the audit found the recipe hand-rolled in CMP-007 + CMP-015 modal body sections (5 sites).
- **SectionTitle** (`section-title.tsx`, codified 2026-06-22) — single source of truth for page-level section titles ("Overview", "Recent …", "Activity This Week", "Get started"). Recipe: `font-sans text-xl/7 font-medium text-neutral-900 m-0` (20/28, no tracking). Renders `<h3>` by default; pass `as="h2"` when the section has sub-headings so the outline stays correct without changing the voice. Distinct from `SectionHeading` (text-sm, modal body sections). Adopted 2026-06-22 across Overview(default) / Requests / Conversations / Security / AuditTrail(+Merkle) / TokenSavings / Dashboard, replacing hand-rolled `text-xl/7` and `text-lg/6` headings.
- **PageTitle** (`page-title.tsx`, codified 2026-05-11) — top-of-surface heading on composed pages. Recipe: `font-sans font-medium text-neutral-900 text-3xl/9 -tracking-[1px] text-balance m-0`. Renders `<h2>` by default — composed pages sit inside `<DashboardChrome>` which owns the document h1 implicitly; the in-surface page title reads as h2 in the outline so child cards can use h3 without level skips. Extracted after the audit found 8 hand-rolls (every composed page's PageHeader plus a CMP-013 variant that used `tracking-tight` instead of `-tracking-[1px]` — normalized on extraction). Spec-sheet `<ArtboardHeader>` uses `text-neutral-800` and does NOT compose this primitive (different surface convention; intentional).

### Helpers, links & icon affordances

- **TextLink** (`text-link.tsx`, codified 2026-05-10) — **inline link affordance, button-by-default.** Renders `<button type="button">` (correct for this codebase's no-router architecture); pass `as="a" href={...}` for a real anchor when navigation is needed. Locked visual recipe: `text-neutral-800 underline decoration-neutral-200 underline-offset-2 hover:decoration-neutral-500 focus-visible:decoration-neutral-500 focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xs`. **No blue** — blue is reserved for info / completed / active-tab / focus. Don't hand-roll the recipe; the className convention block in this doc still exists as the underlying contract, but `<TextLink>` is the single canonical consumer-facing primitive.
- **IconActionButton** (`icon-action-button.tsx`, codified 2026-05-10) — 24px (`size-6`) icon-only button with `after:-inset-2` pseudo-element expanding the hit target to 40×40 without inflating the visual footprint. Recipe: `rounded-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px motion-reduce:active:translate-y-0`. `touch-manipulation` kills the 300ms tap delay. **`aria-label` is required** at the type level — icon-only buttons have no accessible name from text content. Extracted from CMP-012's `TopKeysCard` overflow `MoreHorizontal`; any second site would have silently drifted.
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
- **Use `<TextLink>` for inline links**, `<IconActionButton>` for icon-only buttons, `<KpiRail>` for KPI rails, `<HeroNumeric>` for ≥24px hero numerics, `<MessageBlock>` for conversation bubbles, `<TabsCount>` for tab counts, `<ToolResultCode>` for tool-result JSON, `<SettingsRow>` for settings rows. **Don't hand-roll these recipes** — `src/components/ui/` is the canonical home.
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
- **Don't reintroduce dark-mode raw values** — when activated, redefine semantic tokens in a `:root.dark` block, not by re-introducing oklch values inline.
- **Don't hand-roll a recipe in 2+ sites.** Survey `src/components/ui/` first; if no primitive matches and you'll need the recipe twice, extract a primitive *before* writing it inline. If an audit finds the same bug in two files, extract before fixing — fixing two copies in place is the symptom of missing the primitive.
- **Don't put `role="button"` on `<tr>`.** Use the row-as-button pattern in §7 Lists/Tables — `<button>` inside the primary cell, `<tr>` keeps default semantics with `onClick` as mouse-only convenience.
- **Don't use odd 4-multiples (12, 20, 28, 36) for surface-tier spacing.** Surface tier is 8-multiples only — those odd values belong to compound tier (within a primitive's row/group), never to page/section/card rhythm. Specifically: no `p-7`, `gap-7`, `mb-7`, `gap-3` between-card gaps, `gap-5` between sections.
- **Don't put cards at `rounded-sm` (6px).** Cards live at the new 8px (`rounded-md`) surface tier as of 2026-05-10; 6px is the button / chrome / menu tier. Reaching for `rounded-sm` on a new card class is a tell that this doc was read at an old snapshot.
- **Don't put modals at `rounded-xl: 12px`.** The token resolves to **16px** as of 2026-05-10 (`--radius-xl: 1rem` in `@theme inline`). Don't reintroduce the 12px override or hand-roll a `rounded-[12px]` modal.
- **Don't apply ungated scale-press to a popover/select/menu trigger** — it flickers on anchor-reposition. Gate it (`not-aria-[haspopup]` on the Button primitive, `enabled:` elsewhere). Standard press is `active:scale-[0.98]` + `will-change-transform` + `motion-reduce:active:scale-100` (standardized site-wide 2026-06-18). Don't revert to `active:translate-y-px`.
- **Don't use raw ramp tokens where a semantic token exists.** Surfaces: `bg-white` → `bg-card` / `bg-popover` / `bg-background`; `bg-neutral-100` → `bg-muted`. Borders: `border-neutral-200` → `border-border`. Rings: `ring-neutral-N` → `ring-ring`. Text: `text-neutral-900` → `text-foreground`; `text-neutral-500` → `text-muted-foreground`. The only permitted ramp-token exceptions today are `bg-neutral-50` (no `--input-bg` alias yet), `text-neutral-800` / `text-neutral-600` / `text-neutral-400` (no semantic aliases yet). See §2 semantic token quick-reference.
- **`tracking-snug` (`-0.01em`) is scoped to three tiers only:** (1) small sans titles — CardTitle / in-card h3 at `text-base` or `text-base/5 font-medium`; (2) large mono KPI numerics — `font-mono text-lg font-medium tabular-nums` in modal KpiTile / ConversationKpiTile; (3) **page-header subtitles** — the `text-base text-neutral-500` `<p>` under `<PageTitle>` (swept site-wide 2026-06-18, replacing `tracking-tight`, which at -0.025em was too aggressive for the 16px subtitle body). **14px sans body (`text-sm`) is `tracking-normal`.** **Mono at `text-sm` and below is `tracking-normal`** — the monospace grid carries its own optical density at small sizes and negative tracking smears digit shapes. Don't pass arbitrary `-tracking-[Npx]` anywhere; heading `-tracking-[1px]` (PageTitle / artboard h2) stays arbitrary — different optical tier.
- **Don't hand-roll the user dropdown or workspace switcher.** Both surfaces (sidebar 3-dot, top-bar avatar) open the shared `<UserMenu>`. Adding a third surface = new `<UserMenu>` consumer, not a new local menu.
- **Don't open a `<MenuContent>` without `origin-[var(--transform-origin)]`.** The base `<MenuContent>` already includes it; if you reach for raw Base UI `Menu.Popup`, copy the variable so the popup scales from the trigger.

---

## Responsive Behavior *(our extension)*

The product targets desktop-first operator workflows; no mobile-shipped state today. Composed pages (`src/pages/*`) are responsive but tuned for ≥1280px. **Mobile not observed in the current state — flagged TBD.**

### Breakpoints (Tailwind v4 defaults — no overrides in `@theme`)

| Name | Width | Key Changes |
| --- | --- | --- |
| sm | 640px | (no specific overrides) |
| md | 768px | (no specific overrides) |
| lg | 1024px | Outer page padding `lg:p-6` (24px) |
| xl | 1280px | Composed-page target |
| 2xl | 1536px | Composed-page comfortable |

### Touch Targets

- Buttons: 36px minimum height (`h-9` default). 32px (`h-8`) sm only in dense toolbars.
- Inputs / Selects: same 36px minimum.
- Icon-only buttons: `size-9` (36×36) hit area; the icon itself is 16px (`size-4`).
- Checkbox / Radio: `size-4` (16px) visual + `after:-inset-x-3 after:-inset-y-2` hit-target padding.

### Collapsing Strategy

- **Sidebar** (left nav): expanded 240px (`w-60`) / collapsed 64px (`w-16`) in `sidebar.tsx`. Collapse toggle lives in the sidebar header; the workspace switcher sits in the top bar (not the sidebar — see §7 UserMenu / WorkspaceSwitcher).
- **KPI rail:** four sections side-by-side at composed widths. Mobile collapse strategy TBD.
- **Tables:** horizontal scroll within container (`overflow-x-auto` on Table wrapper). Column priority not codified.

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
| `/conversations` | `src/pages/Conversations.tsx` | `<KpiRail>`, conversations table, Dialog detail with `<MessageBlock>` flat-list thread. Cross-link selection state via `selectionSource: 'messages' \| 'trace' \| null` — each panel skips its own scroll-into-view when it originated the selection (counterpart still scrolls). Tool-result blobs use `<ToolResultCode>`. Deep-link param: `?open=cnv_xxx` strips on close. |
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
