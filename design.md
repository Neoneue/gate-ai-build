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
  primary: "oklch(0.090 0 0)"
  primary-foreground: "#FFFFFF"
  background: "#FFFFFF"
  foreground: "oklch(0.090 0 0)"
  card: "#FFFFFF"
  card-foreground: "oklch(0.090 0 0)"
  popover: "#FFFFFF"
  popover-foreground: "oklch(0.090 0 0)"
  secondary: "oklch(0.960 0 0)"
  secondary-foreground: "oklch(0.090 0 0)"
  muted: "oklch(0.960 0 0)"
  muted-foreground: "oklch(0.530 0 0)"
  accent: "oklch(0.960 0 0)"
  accent-foreground: "oklch(0.090 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.910 0 0)"
  input: "oklch(0.910 0 0)"
  ring: "oklch(0.680 0 0)"
  canvas-bg: "#ECECE7"

  ink-50: "oklch(0.985 0 0)"
  ink-100: "oklch(0.960 0 0)"
  ink-200: "oklch(0.910 0 0)"
  ink-300: "oklch(0.820 0 0)"
  ink-400: "oklch(0.680 0 0)"
  ink-500: "oklch(0.530 0 0)"
  ink-600: "oklch(0.380 0 0)"
  ink-700: "oklch(0.260 0 0)"
  ink-800: "oklch(0.165 0 0)"
  ink-900: "oklch(0.090 0 0)"
  ink-950: "oklch(0.045 0 0)"

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
  # heading scale (text-3xl: 32px, text-4xl: 40px, text-6xl: 64px — index.css:156–161).
  # Floor is text-xs (12px) — sub-12px sizes are out of scale by policy. Arbitrary
  # text-[Npx] is banned. font-medium minimum on sans labels — font-normal reads as
  # ambient body, not structure.
  #
  # Tracking tokens (index.css:172): `tracking-snug` (-0.01em) — single source for body /
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
  button-default:  # primary action, ink-900 fill
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body-sm}"   # text-sm font-medium
    rounded: "{rounded.sm}"
    height: 36                           # h-9 (default)
    padding: "0 16"                      # px-4 — pr-3 with icon (asymmetric)
  button-outline:    { backgroundColor: "{colors.background}", textColor: "{colors.foreground}", rounded: "{rounded.sm}" }
  button-secondary:  { backgroundColor: "{colors.secondary}", textColor: "{colors.secondary-foreground}" }
  button-ghost:      { backgroundColor: "transparent", textColor: "{colors.foreground}" }
  button-destructive:{ backgroundColor: "{colors.destructive}", textColor: "{colors.primary-foreground}" }

  input:
    backgroundColor: "{colors.ink-50}"
    textColor: "{colors.ink-800}"
    rounded: "{rounded.sm}"
    height: 36
    padding: "0 16"  # px-4 (default), px-3 at sm/xs; focus = border-ring + ring-3/50; disabled = bg-ink-100 text-ink-500

  textarea:    { backgroundColor: "{colors.ink-50}", textColor: "{colors.ink-800}", rounded: "{rounded.sm}", padding: "12 16" }
  input-group: { backgroundColor: "{colors.ink-50}", textColor: "{colors.ink-800}", rounded: "{rounded.sm}", height: 36 }

  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.md}"  # 8px — card tier (was rounded.sm 6px; promoted 2026-05-10)
    padding: 16
    elevation: "shadow-border"  # CardFooter: white, no border, no wash (mirrors DialogFooter)

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
    backgroundColor: "{colors.ink-50}"
    textColor: "{colors.ink-800}"
    rounded: "{rounded.sm}"
    height: 36
    padding: "0 12 0 16"  # pl-4 pr-3 default; pl-3 pr-2 at sm/xs (asymmetric for chevron)

  tabs-list: { backgroundColor: "{colors.muted}", rounded: "{rounded.sm}", height: 32, padding: 4 }  # active trigger: bg-background rounded-xs
  segmented: { backgroundColor: "{colors.muted}", rounded: "{rounded.sm}", height: 32 }              # active item: bg-background rounded-xs

  dialog:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.xl}"  # 16px LOCKED (was 12px; promoted 2026-05-10 to preserve 2× ratio vs cards)
    padding: 16
    elevation: "shadow-modal"  # overlay: bg-ink-900/40 + backdrop-blur-xs
  sheet: { backgroundColor: "{colors.background}", rounded: "{rounded.none}", elevation: "shadow-modal" }  # right-docked drawer
  menu:  # shadcn-style wrapper over Base UI Menu — Menu / MenuTrigger / MenuContent / MenuItem / MenuLabel / MenuSeparator
    backgroundColor: "{colors.popover}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.sm}"  # 6px — chrome/menu tier
    padding: 4
    elevation: "shadow-popup"  # item: rounded-xs h-8 px-2, destructive variant for Sign-out

  table-header:    { backgroundColor: "{colors.ink-50}", textColor: "{colors.ink-600}", typography: "{typography.body-sm}" }  # row hover: bg-ink-50
  pagination-link: { textColor: "{colors.ink-600}", typography: "{typography.data}" }  # rendered as <button>, not <a>

  hero-numeric:      { textColor: "{colors.ink-900}", typography: "{typography.hero-numeric-default}" }  # also: hero-numeric-lg variant
  kpi-rail:          { backgroundColor: "{colors.white}", rounded: "{rounded.md}", elevation: "shadow-border" }  # divider hairlines via `before:inset-y-4` pseudo on each child after the first
  text-link:         { textColor: "{colors.ink-800}", rounded: "{rounded.xs}" }  # renders <button> by default; ink + permanent faint underline
  icon-action-button:{ textColor: "{colors.ink-500}", rounded: "{rounded.xs}" }  # size-6 (24px) icon-only; after:-inset-2 expands hit target to 40×40
  tabs-count:        { backgroundColor: "{colors.ink-100}", textColor: "{colors.ink-500}", rounded: "{rounded.xs}", height: 20 }  # mono count chip inside TabsTrigger
  tool-result-code:  { textColor: "{colors.ink-900}" }  # font-mono text-sm -tracking-[0.14px] break-all — <code> element
  settings-row:      { textColor: "{colors.ink-900}" }  # title/subtitle/control row; rhythm via border-t border-ink-200 between rows
  toast:             { backgroundColor: "{colors.background}", textColor: "{colors.ink-900}", rounded: 8, elevation: "shadow-popup" }
  status-dot:   { rounded: "{rounded.full}" }  # tones: success-600, warning-600, destructive, blue-600, ink-500
  tag:          { backgroundColor: "{colors.ink-100}", textColor: "{colors.ink-900}", rounded: "{rounded.full}", height: 24, typography: "{typography.body-xs}" }

  switch:   { backgroundColor: "{colors.primary}" }  # checked = primary, unchecked = input (ink-200); thumb rounded-full
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
**Confidence summary:** 14 sections strong, 0 partial, 1 TBD (wordmark + lockups not finalized). Last surgical refactor: 2026-05-10 (three-tier material ladder, eight new primitives, chart-palette helper).
**Captured states:** light mode @ 1440×900 default; modal (Dialog), drawer (Sheet), toast, segmented selectors, tabs (default + line + count chips), pagination, table sortable + drill-in, dropdown menu (Menu / UserMenu / workspace switcher), list ↔ detail swap with entrance animation (CMP-016)
**Not yet captured (TBD):** wordmark + horizontal/stacked lockups (logomark only, finalized); dark mode (intentionally absent — `:root.dark` block omitted; `@custom-variant dark` declared for future activation)

---

## 0. Direction *(our extension)*

**Who:** human operator running an AI gateway in production. **Verb:** inspect — read-heavy; filter, sort, drill in, copy. **Feel:** Vercel Geist meets operator tooling — flat, dense, mono numerics, ink-900 primary, warm-paper canvas under white cards.

### Defaults being rejected

1. **Blue primary action** → ink-900 primary. Blue reserved for info/completed/active-tab/focus only.
2. **Blue underlined links** → ink + permanent faint underline (`decoration-ink-200` → `decoration-ink-500` on hover/focus). Blue is overloaded with 4 other meanings.
3. **24px gutters (Bootstrap/Material default)** → 12-column grid with **16px gutters**. Denser, more on-genre for an operator tool.
4. **Brand colors as chart series colors** → 8-slot OKLCH categorical palette picked by series index. Per-series `slot?: number` override only for brand-mnemonic exceptions (Anthropic→orange, OpenAI→blue).
5. **Solid 1px card borders** → three-layer `shadow-as-border` (1px ring + 1px lift + 2px ambient, `color-mix` from ink-800).
6. **All numerics mono** → five-voice taxonomy. Hero summary numerics ≥24px sans tabular via `<HeroNumeric>`; data numerics <20px stay mono.

---

## 1. Overview *(Google canonical §1)*

Operator dashboard for an AI gateway. Read-heavy interaction (filter, sort, drill in, copy). Information density is high: three-tier table ink (500/800/900), right-aligned mono-tabular numerics, KPI rails with sparklines + delta tags, modals as drill-ins (not splash dialogs). Warm-paper canvas (`#ECECE7`) under white cards painted with shadow-as-border.

**Key characteristics:** 5 OKLCH ramps × 11 steps · three-tier material ladder (4/6/8/16px) · five-voice typography · no dark mode · ink-900 primary, not blue · shadow-as-border, not solid borders.

---

## 2. Colors *(Google canonical §2)*

Two layers: **palette atoms** (5 OKLCH ramps × 11 steps + atomic surfaces + 8-slot chart palette) in `@theme {}`, and **semantic layer** (shadcn vocab: `--background`, `--primary`, etc.) in `:root {}`. Semantic tokens always resolve to a palette atom via `var(--color-*)`. **No raw hex/oklch/rgba outside `@theme`.**

### Primary & brand accent

- **Ink** `oklch(0.090 0 0)` ← `{colors.ink-900}` — primary action, foreground, headlines. **Not blue.**
- **Blue** `oklch(0.345 0.224 268.85)` ≈ `#1F2FCE` ← `{colors.blue-700}` — brand accent (anchored to `public/logomark.svg`). Info / completed / active-tab / focus only. Never primary CTA. Never inline links.

### Step roles (apply across all 5 ramps)

| Step | Role |
|---|---|
| 50–100 | Subtle backgrounds, washes, hover-bg |
| 200 | Borders, dividers (`--border`, `--input` resolve to ink-200) |
| 300 | Strong borders, ghost-button hover-bg, dashed gridlines |
| 400 | Placeholder text, missing-data dashes, breadcrumb separators (`--ring` resolves to ink-400) |
| 500 | Secondary text, eyebrow, chart strokes (`--muted-foreground` resolves to ink-500) |
| 600 | Saturated mid (default solid surfaces, `--destructive` resolves to danger-600) |
| 700 | Saturated text on tinted bg, brand-mark anchor (blue-700 = logomark) |
| 800–900 | High-contrast text on white. ink-800 = body default; ink-900 = `--primary`, `--foreground`, headlines |
| 950 | Reserved (extreme contrast, future dark-mode anchor) |

**Note:** `--ink-700` is intentionally avoided as a table body-cell tone — middle-tier neutrals collide with the three-tier table policy (see §7 Tables).

### Status semantics

`success-100` bg + `success-700` text (success-600 for solid mid). `warning-100` bg + `warning-700` text (warning-600 for slow-row icons). `danger-100` bg + `danger-700` text; `--destructive` resolves to `danger-600`. `info` aliases to the blue ramp — no separate `info-*` ramp.

### Chart palette (categorical, 8-slot)

**Brand-decoupled.** Series pick a slot **by index, not by entity**. Per PM call (2026-05-06): "we need a palette of colors for all graphs throughout the app and they should be used regardless of the content."

All eight slots sit at L 0.62–0.85, C 0.13–0.20 (uniformly bright, mid-saturation). Adjacent slots in palette order are ≥85° apart in hue. **No neutral as a categorical slot** — gray is reserved for "Other/Unknown" semantic states. Per-series `slot?: number` override on `VendorMeta` lets specific charts pin colors when there's a brand mnemonic worth honoring (Anthropic→orange slot 2, OpenAI→blue slot 1) — opt-in only.

Slots: `chart-1` blue · `chart-2` orange · `chart-3` green · `chart-4` purple · `chart-5` coral · `chart-6` teal · `chart-7` amber · `chart-8` magenta. ← code-direct: `src/index.css:205–212`

KPI rail sparklines also consume chart palette tokens (`--color-chart-1` blue, `--color-chart-3` green, `--color-chart-7` amber, `--color-ink-500` neutral) — **NOT** semantic ramps. Mixing systems makes rails read inconsistently.

### Vendor brand colors

Used only by `<VendorAvatar />` (bare icon at `size-4`, no chip wrapper). Anthropic `#D97757` · OpenAI `#10A37F` · Meta `#0064E0` · DeepSeek `#4D6BFE` · xAI `#3D3D3D` · Google/Mistral/Cohere multi-color SVG fills (wrapper `style.color` ignored). Source: `src/components/icons/vendor-meta.tsx`.

### Do not use

- Raw hex/oklch/rgba outside `@theme`.
- Single-token semantics (`--color-warning`, `-2` variants) — use ramp steps (`text-warning-700`, `bg-success-100`).
- Blue for primary action — `--primary` resolves to ink-900.
- Blue for inline links — use ink + faint underline (see §7).
- `text-ink-600`/`text-ink-700` as table body-cell tones — collides with three-tier policy.
- Vendor colors as chart series colors by default — charts use `--chart-1..8` by index.

---

## 3. Typography *(Google canonical §3)*

### Font Family

- **Sans:** `"Geist", ui-sans-serif, system-ui, sans-serif`
- **Mono:** `"Geist Mono", ui-monospace, "SFMono-Regular", monospace`

Loaded via Google Fonts CDN + `@fontsource-variable/geist` fallback. Geist serves headings too — `--font-heading` aliased to `--font-sans`. No IBM Plex.

### Hierarchy

Tailwind named scale only. Three sizes overridden in `@theme` to Geist's heading scale (even-numbered, larger increments at top); other sizes match Geist defaults. **Arbitrary `text-[Npx]` is banned.**

| Role (YAML key) | Font | Size | Weight | Line Height | Letter Spacing | Rule | Notes |
|---|---|---|---|---|---|---|---|
| `hero-numeric-lg` | Geist | 32 | 500 | 36 | tight | Full-page hero metric only (CMP-013 `8,241`). One per page. | sans + `tabular-nums` — presentation tier. |
| `hero-numeric-default` | Geist | 24 | 500 | 32 | tight | KPI rail value, panel hero (Top Keys total). | sans + `tabular-nums`. |
| `h1` | Geist | 32 | 500 | 40 | tight | Page title (artboard h1). | overridden text-3xl (Geist 32). |
| `h2` | Geist | 24 | 500 | 32 | normal | Section title (SectionHeader). | text-2xl/8. |
| `h3` | Geist | 18 | 500 | 28 | normal | Card title, modal hero ID, modal `KpiTile` value (mono — below sans-hero threshold). | text-lg. |
| `body` | Geist | 16 | 400 | 24 | normal | Card subtitles, button labels, body in spacious surfaces. | text-base. |
| `body-sm` | Geist | 14 | 400 | 20 | normal | Modal field labels, body in compact surfaces, eyebrow default. | text-sm. |
| `body-xs` | Geist | 12 | 400 | 16 | normal | Eyebrow sm, table column heads, breadcrumbs, dense metadata. | text-xs. |
| `label` | Geist | 14 | 500 | 16 | normal | Form labels (Label primitive). | leading-none. |
| `eyebrow-sm` | Geist Mono | 12 | 500 | 16 | 0.1em | KPI labels, card section eyebrows, top-bar strips. | UPPERCASE TRACKED. |
| `eyebrow-default` | Geist Mono | 14 | 500 | 20 | 0.1em | Modal eyebrows, drawer headers, hero strips. | UPPERCASE TRACKED. |
| `badge` | Geist Mono | 12 | 500 | 16 | normal | Status codes, counters, deltas, pills. | tabular-nums (Badge default). |
| `data` | Geist Mono | 14 | 400 | 20 | normal | Table cells, IDs, codes, hashes, model identifiers, row values. | tabular-nums. |

### Five-voice taxonomy (codified 2026-05-07)

Each voice has a single job; mixing them is the drift surface. **Critical rule:** sans labels are `font-medium` minimum. `font-normal` reads as ambient body, not a label. Color does the *quiet* work; weight does the *structural* work.

| Voice | Recipe | Use |
|-------|--------|-----|
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
|---|---|---|---|
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
- **Spec-sheet artboards** (CMP-000–CMP-009) use fixed 1440px column (`w-[1440px]`) to mirror Paper; composed pages (CMP-012/013/014/016) are responsive.
- **Page-header subtitle width:** `max-w-1/2` on the *wrapper column* (not the `<p>` — fractional max-w on a leaf doesn't behave).

Whitespace carries hierarchy. Cards never touch — shadow-as-border does the separation. Body has a 40px linear-gradient grid on `--canvas-bg`; anything sitting on white needs explicit `bg-white` or `bg-ink-50`.

---

## 5. Elevation & Depth *(Google canonical §5)*

Three shadow tokens, all `color-mix(in oklch, var(--color-ink-800) X%, transparent)` — shadow family tracks the ink ramp, never inline `rgba()`.

| Tier | Token | Composition | Radius | Surfaces |
|---|---|---|---|---|
| Sub-element | none | none | `rounded-xs` (4px) | Tabs trigger, Segmented item, SelectItem, Badge, MenuItem |
| Menu / Chrome | `--shadow-popup` | 4px lift 8% + 1px ring 4% | `rounded-sm` (6px) | Select content, Menu popup, popovers, tooltips, Toast, Button, Input |
| **Card / Surface** | **`--shadow-border`** | **1px ring 6% + 1px lift 6% + 2px ambient 4%** | **`rounded-md` (8px) — NEW tier** | **Card, KpiRail, table containers, hero card** |
| Hover (card) | `--shadow-border-hover` | 1px ring 8% + 1px lift 8% + 2px ambient 6% | (same as card) | Hovered card variant |
| Modal | `--shadow-modal` | 16px lift 12% + 1px ring 6% | `rounded-xl` (**16px LOCKED**) | Dialog, AlertDialog, Sheet (right-docked = `rounded-none` left edge) |

**Three-tier material ladder (codified 2026-05-10).** The prior two-tier (6/12) collapsed cards and buttons onto the same radius (6px) and put modals one step up (12px). Migration to three-tier opens a discrete *card / surface* tier at 8px — Card, KpiRail, and table containers now read distinct from buttons / inputs / menus (6px). Modal radius bumps to 16px to preserve the 2× tier ratio against cards (`8 → 16`). Sub-element radius (4px) is unchanged. Token: `--radius-xl: 1rem` in `@theme inline` (`index.css:305`).

**Rule:** shadow-first, never `border` class. **Concentric rule:** item radius < container radius (4px badge inside 8px card inside 16px modal). Don't override `rounded-xl` on modals — locked.

### Motion

`transition-[colors,box-shadow] duration-150 ease-out motion-reduce:transition-none` everywhere — NOT `transition-all`. The `<Button>` primitive's transition expands to `transition-[colors,opacity,box-shadow,translate]` so `disabled:opacity-50` *fades* on dirty-flip across every form button instead of snapping. Press affordance: **`active:translate-y-px` (uniformly — `active:scale-[0.98]` was retired 2026-05-10 because the scale variant caused popover anchor-reposition flicker)**. Always gated with `motion-reduce:active:translate-y-0`. Sliding indicator (Tabs / Segmented / SegmentedPill): 200ms ease-out, transform + width animated. Sheet enter: 300ms slide from right. Dialog enter: 200ms fade + zoom-in-95 (`Menu` popup gets `origin-[var(--transform-origin)]` so it scales *from the trigger*, not from the popup's geometric center — Base UI publishes the variable on the Positioner). MenuItem highlight uses `transition-colors duration-100 ease-out` — keyboard arrow-through no longer snaps. Toast: sonner default (200ms enter + 4s hold + 200ms exit).

---

## 6. Shapes *(Google canonical §6)*

Driven by `--radius` (0.625rem = 10px base) plus a **locked override** at `--radius-xl: 1rem` (16px) for modals. Revised 2026-05-10 from a two-tier ladder (6 / 12) to a **three-tier ladder** that opens a discrete card / surface tier.

| Token | Value | Tier | Use |
|---|---|---|---|
| `rounded.xs` | 4px | Sub-element | Tabs trigger, Segmented item, SelectItem, Badge, MenuItem |
| `rounded.sm` | 6px | Button / chrome / menu | Button, Input, Select trigger, Menu popup, Toast |
| **`rounded.md`** | **8px** | **Card / surface (NEW)** | **Card, KpiRail, table containers, hero card** |
| `rounded.lg` | 10px | Base | `--radius` (anchor — most derived tokens reference it) |
| `rounded.xl` | **16px LOCKED** | Modal | Dialog, AlertDialog (Sheet flush at `rounded-none`) |
| `rounded.full` | 9999 | Pills | StatusDot, Tag, Switch thumb, avatar monograms |

**Concentric example:** a 4px Badge sits inside an 8px Card, which sits inside (when drilled into) a 16px Dialog. Ratios: 2× between every tier, deliberately. **Don't override `rounded-xl` on modals.**

Iconography: `lucide-react` stroke `1.75`. Sizes: `size-3` (12px) / `size-3.5` / `size-4` (16px) / `size-5` (20px). In Buttons, set `data-icon="inline-start"` or `"inline-end"` for variant-aware padding trim.

---

## 7. Components *(Google canonical §7)*

The full primitive library is `src/components/ui/*.tsx` (44 primitives as of 2026-05-10). Highlights below — every component block maps to a `components.*` entry in YAML. Composed pages (CMP-012 / 013 / 014 / 015 / 016 / 017 / 018) live in `src/artboards/` and are compositions of these primitives, not components themselves.

### Buttons — `{components.button-default}` and variants

`src/components/ui/button.tsx` (Base UI under shadcn — wraps `ButtonPrimitive` from `@base-ui/react`, **not Radix**). CVA with 4 size variants (xs/sm/default/lg) and 6 style variants (default/outline/secondary/ghost/destructive/link).

- **Default:** `bg-primary text-primary-foreground` (ink-900 / white). 36px tall (`h-9`), `px-4` (`pr-3` with icon). `rounded-sm`. `text-sm font-medium`. `active:translate-y-px` for tactile press. ← `button.tsx:15, 32`
- **Sizes:** xs h-7 px-3 text-xs · sm h-8 px-3 text-xs · default h-9 px-4 text-sm · lg h-10 px-6 text-sm
- **Asymmetric icon padding:** `has-data-[icon=inline-start]:pl-3` / `has-data-[icon=inline-end]:pr-3` (default size). Mirrors `SelectTrigger` rule (see below).

**Rule:** Primary action = `default` (ink-900). Use `outline` for secondary, `ghost` for tertiary in toolbars/menus. `link` variant is for standalone link-buttons; **inline body-text links** use `<button>` with the underline affordance (see Inline links below).

### Inputs & Forms

- **Input** (`input.tsx`) — `bg-ink-50 border-ink-200 rounded-sm h-9 px-4 text-sm text-ink-800`. **`bg-ink-50` is the contract** — sits flush in filter rows. Sizes: xs h-7 px-3 · sm h-8 px-3 · default h-9 px-4 · lg h-10 px-4. Focus: `border-ring ring-3 ring-ring/50` (ink-tinted, not blue). Disabled: `bg-ink-100 text-ink-500`. Invalid: `border-destructive ring-destructive/20`.
- **Textarea** (`textarea.tsx`) — same surface as Input. `min-h-16`, `field-sizing-content`, `py-3 px-4`.
- **InputGroup** (`input-group.tsx`) — wrapper for inputs with addons (icon, kbd, button). `h-9`, same surface as Input.
- **Field** (`field.tsx`) — composes `<FieldLabel>` + `<FieldDescription>` + `<FieldError>` + control. Default gap-y between fields = 16px. No surface chrome.
- **Label** (`label.tsx`) — `text-sm leading-none font-medium`. **`font-medium` minimum** — `font-normal` reads as ambient body, not a label.
- **Checkbox** (`checkbox.tsx`) — `size-4 rounded-[4px]`, `border-input` unchecked / `bg-primary` checked. Hit-target via `after:-inset-x-3 after:-inset-y-2`.
- **Radio** (`radio-group.tsx`) — `size-4 rounded-full`, same color treatment as Checkbox.
- **Switch** (`switch.tsx`) — `h-[18.4px] w-[32px]` default / `h-[14px] w-[24px]` sm. Thumb `rounded-full size-4`. `data-checked:bg-primary` / `data-unchecked:bg-input`.

**Rule:** Group related fields with `<FieldSet>` + `<FieldLegend>` (text-base font-medium). Validation state via ring + `border-destructive`, never background tint.

### Cards & Containers

- **Card** (`card.tsx`) — `rounded-md bg-white py-4 text-sm text-ink-900 shadow-(--shadow-border)`. **Shadow-as-border, NOT solid 1px borders.** Radius is `rounded-md` (8px) — the new card / surface tier (2026-05-10); buttons and chrome stay at `rounded-sm` (6px) so cards read a discrete material step up. Composition: `<Card>` (gap-4 col) → `<CardHeader>` (px-4 grid) → `<CardTitle>` (text-base font-medium leading-snug) → `<CardDescription>` (text-sm/5 text-ink-500) → `<CardContent>` (px-4) → `<CardFooter>` (p-4, white, **no border, no wash** — structural separation comes from spacing alone). When a `<CardFooter>` is present, Card auto-applies `pb-0` so the footer hugs the bottom edge. Compact: `data-[size=sm]` → `gap-3 py-3 px-3`. **Cross-ref:** mirrors `<DialogFooter>` (short-modal variant) — no border, gestalt from spacing. The scroll-modal `<DialogScrollFooter>` is the *other* footer pattern (border-t + tighter `py-4`) — used when content scrolls above the action band.
- **KpiRail** (`kpi-rail.tsx`, codified 2026-05-10) — bordered single-row container with inset divider hairlines between children. Replaces 4 sites of hand-rolled `before:inset-y-4` recipes across CMP-012 / 013 / 014 / 015 / 016. API: `<KpiRail columns={2|3|4|5|6}>{children}</KpiRail>`. Recipe: container `grid rounded-md bg-white shadow-(--shadow-border) overflow-hidden`; every child after the first wrapped in a divider div with `before:absolute before:left-0 before:inset-y-4 before:w-px before:bg-ink-200` — hairline doesn't reach the rounded corners. Tile shape (CompactKpi, custom mono tiles, plain divs) is the caller's call; only the shell + divider treatment is enforced.

  **Card padding is locked at 16px. Do NOT pass padding/gap classes (`px-N`, `py-N`, `p-N`, `gap-N`) on `<Card>`, `<CardHeader>`, `<CardContent>`, or `<CardFooter>` from composed pages.** If you find yourself reaching for `px-5`, `py-5`, `gap-5`, `-mx-5` etc. — stop. The primitive's defaults are the contract; reach back to the design system if a surface needs different rhythm. Legitimate overrides are layout-only: `min-w-0`, `col-span-N`, `w-[Npx]`, `flex-1`, `items-center`. Any primitive-padding override must be justified with a comment citing the variant it represents, and ideally promoted to a primitive variant (`size="sm"` / `size="lg"`) rather than inlined. Spec-sheet artboards (CMP-000 series) are exempt — they show specimens in isolation and may use `p-7` for breathing room.
- **CodeCard** (`code-card.tsx`) — code-preview card with header strip + syntax-highlighted body. Uses `<CodeBlock>` driving `--color-syntax-*` tokens. Top-right copy affordance via `<CopyButton>`.

**Rule:** Cards never touch — they sit on the warm-paper canvas with shadow doing separation. The ring inside `--shadow-border` IS the border; don't add a `border` class on top.

### Selectors

- **Tabs** (`tabs.tsx`) — sliding white indicator on active trigger (200ms ease-out, transform+width). Two variants: `default` (pill-on-well, `bg-muted rounded-sm h-8 p-1`, active trigger `bg-background rounded-xs`) and `line` (underline, transparent track, active trigger gets a 2px ink-900 underline). Vertical orientation supported on the default variant.
- **Segmented** (`segmented.tsx`) — pill-style selector, same sliding-indicator idiom as Tabs default. `bg-muted rounded-sm overflow-clip`. Sizes: default `h-8`, sm `h-7`. Variants: `pill` (default) and `group` (adjacent borders, ink-900 fill on selected — rare).
- **SegmentedPill** (`segmented-pill.tsx`) — view-scope toggles in toolbars. **Don't add as an extra row** — view-scope controls live in the existing toolbar. CMP-013 uses `<SegmentedPill size="sm">` (1H / 7D / 30D) anchored right via `ml-auto` so the toolbar splits cleanly into facets-left + time-scope-right.

**Rule (Tabs vs Segmented — when to pick which):**
- **`Tabs variant="line"`** = sibling sub-pages of the same surface. Each tab represents content that would map to its own URL path (`/team/members`, `/team/invitations`, `/settings/general`). Different content semantics, equal stature, primary navigation within the page. Used by CMP-017 Team and CMP-018 Settings. Matches Vercel's settings/team/billing/integrations sub-nav, Material 3, IBM Carbon.
- **`Tabs variant="default"`** (pill-on-well) = secondary view scope where the items are stylistic peers but the surface pattern still calls for full-page tab semantics. Rare at page-header level — most page-header tab use cases are line. Reserve for nested tab strips inside a card where the line variant would compete with surrounding chrome.
- **`Segmented` / `SegmentedPill`** = mutually-exclusive view filters of the *same* data, lives inside a toolbar or panel, not page-level. Time-range pickers (24h / 7d / 30d), chart-type toggles (Bar / Line), unit switchers, code-vs-preview inside a card. Constrained-width by design.

The semantic test: are these *pages of the surface* (line tabs) or *filters/views of the same data* (segmented)? If you'd give each one its own URL, it's a tab. If they're alternate lenses on shared content, they're segmented.
- **Select** (`select.tsx`) — Base UI. Trigger: `bg-ink-50 border-ink-200 rounded-sm h-9 text-sm`. Content: `rounded-sm shadow-(--shadow-popup) bg-popover`. Item: `rounded-xs px-3 py-1.5 text-sm`. **Asymmetric padding** `pl-N pr-(N-1)` across all sizes (`pl-3 pr-2` xs/sm, `pl-4 pr-3` default/lg) — optical balance: text side wants more air, chevron has built-in bounding-box whitespace. Long lists use `<SelectGroup>` + `<SelectLabel>` + `<SelectSeparator>` to group (e.g. First-party vs Marketplace).
- **Toggle** (`toggle.tsx`) — `rounded-sm h-8 px-3 text-sm font-medium`, `data-[state=on]:bg-muted`. Wrap with `<ToggleGroup>` for multi-select.

**Rule (filter-pill toolbar):** `<SelectTrigger size="sm">` filter pills in dense table toolbars render **chevron only, no leading category icon**. Generic filter glyphs are noise next to the chevron-down. Exception: dropdowns where a leading icon carries category-specific info AND is used consistently across 4+ filters in the same surface.

**Rule (toolbar layout):** Search fixed-width on left; Select filters clustered right; Sort dropdowns anchored far right via `ml-auto` to differentiate from narrowing filters.

### Lists / Tables

- **Table** (`table.tsx`) — body of every list view. Container: `rounded-sm shadow-(--shadow-border) overflow-hidden bg-white`. Header: `bg-ink-50` + `border-t border-ink-200`. **Header cell: sans Title Case `font-medium text-ink-600`** — NOT mono UPPERCASE eyebrow. Outer cell padding `px-4` (first/last col), inner `px-3`. Row hover: `bg-ink-50`.
- **Pagination** (`pagination.tsx`) — **renders as `<button type="button">`, not `<a>`** (no router in this app; visual = link styling, semantics = button). Same conversion applies to inline anchors in composed surfaces (modal subtitle refs, row-title links).
- **TablePaginationFooter** (`table-pagination-footer.tsx`) — **single source of truth for table pagination chrome.** Composes count summary + rows-per-page Select + windowed page links. State (page + rowsPerPage) lives in parent; primitive is controlled. `buildPageWindow` helper exported. **Don't hand-roll** — extend the primitive.

- **RowActionButton** (`row-action-button.tsx`) — **the row-as-button pattern** (locked 2026-05-09 after WIG audit). `<tr role="button" tabIndex={0}>` is invalid ARIA (`<tr>` only legally carries `role="row"`); the row's **primary identifier cell** wraps content in a real `<button>` instead. The `<tr>` keeps default semantics with `onClick` as a mouse-only convenience; the button carries the `aria-label` + focus ring + `e.stopPropagation()` so the two don't double-fire. API: `<RowActionButton layout="row|stack|inline" onClick={...} aria-label="Inspect ...">{cell content}</RowActionButton>`. Layout variants: `row` for icon + text cells (CMP-013, CMP-016), `stack` for title + sub-id stacks (CMP-014), `inline` for single-text cells (CMP-015). Consumed by CMP-013/014/015/016. **Don't hand-roll the recipe** — extend the primitive (new layout variant) if a new shape is needed.
- **DetailList / DetailRow** (`detail-list.tsx`, codified 2026-05-11) — canonical label/value list used inside modal body sections ("Details", "Context", "Security scan"). Extracted after the third occurrence of the same recipe in CMP-013 (`DetailRow`), CMP-015 (`ContextRow`), and CMP-007 (`DetailGrid` — was drifting to a different shape, since unified). Recipe: list shell `rounded-xs border border-ink-200 overflow-hidden`; row `grid grid-cols-4 gap-4 items-center py-3 border-b border-ink-200 last:border-b-0` with label in `pl-4 font-sans text-sm font-medium text-ink-500` and value in `col-span-3 pr-4` (consumer styles the inner content). API: `<DetailList><DetailRow label="…" value={…} /></DetailList>`. Consumed by CMP-013 Request detail (Details tab), CMP-015 Threat event modal (Context section), CMP-007 GenerationDetails specimen (Details + Security scan sections). **Don't hand-roll a `<dl>` / `grid-cols-[36%_1fr]` / divide-y variant** — extend this primitive.

**Three-tier body-cell ink density** (locked):

| Tone | Use |
|---|---|
| `text-ink-500` | Context (timestamps, sub-IDs) |
| `text-ink-800` | Body data (IDs, keys, numerics, initiators) |
| `text-ink-900` | Row's primary identifier (model name with VendorAvatar, row title) |
| `text-ink-400` | Missing-data dashes (`—`) |

**No `ink-600` / `ink-700` body-cell tones** — middle-tier neutrals collide with the three-tier policy.

**Numeric column right-alignment**: numerics are mono tabular AND `text-right` on TableHead + TableCell. `tabular-nums` alone fixes intra-row digit width but not inter-row drift when `4,051` sits above `52,810` — right-edge anchoring places the ones-place at a fixed x across rows.

**Row-state indicator slot:** when a numeric column carries a conditional indicator (slow-row icon, etc.), reserve a fixed-width slot in the **leading** position on every row — slow renders the icon, non-slow renders an invisible placeholder — so the digit column doesn't drift between states.

### Modal / Drawer

- **Dialog** (`dialog.tsx`) — centered modal. **Modal tier:** `rounded-xl` (**16px LOCKED**) + `shadow-(--shadow-modal)`. Overlay: `bg-ink-900/40 backdrop-blur-xs`. The primitive ships **three content shells** and a set of section slots so every modal in the project composes from the same source — *do not* hand-roll modal chrome on a consumer.

  **Content shells:**
  - `<DialogContent>` — short-form modal (CMP-017 Invite member, AlertDialog destructive confirms). `bg-white rounded-xl border border-ink-200 shadow-(--shadow-modal) p-6 max-w-sm`. Padding bumped from `p-4` → `p-6` on 2026-05-11. Pairs with `<DialogHeader>` (`flex flex-col gap-2`) + `<DialogFooter>` (`mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end` — no border; the `mt-2` lifts the action band ~24px below the last field for a "now commit" gestalt).
  - `<DialogScrollContent>` — scroll-shell variant for detail modals (CMP-013/14/15). Adds `max-h-[90vh] gap-0 p-0 overflow-hidden flex flex-col` on top of `<DialogContent>`; sections inside manage their own padding so a fixed footer can sit flush against the bottom edge while the body scrolls between fixed header/footer.
  - `<DialogStaticContent>` — static spec-sheet variant (CMP-007 modal specimens). Same outer shell (rounded, white, border, shadow) but no portal / no fixed positioning — renders inline on a 2D spec page. `relative` is baked in so the close button can absolute-position against the shell. **Renders its own close button** when `onClose` is passed — consumers never hand-roll the X-button styles (`<Button variant="ghost" size="icon-sm" className="absolute top-3 right-3">` is the primitive's contract, not a recipe each consumer remembers).

  **Section slots (used by both `<DialogScrollContent>` and `<DialogStaticContent>`):**
  - `<DialogScrollHeader>` — `shrink-0 flex flex-col gap-3 px-6 pt-6`. Title block plus any extra sibling rows (CMP-014's identity row with `Copy ID` button).
  - `<DialogScrollSummary>` — `shrink-0 px-6 pt-6`. Optional fixed KPI rail between header and body (CMP-013, CMP-014).
  - `<DialogScrollBody>` — `flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-6`. Scrollable middle.
  - `<DialogScrollFooter>` — `shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-ink-200`. **Vertical padding intentionally drops to `py-4` (16px)** vs the body's `py-6` (24px) — the action band reads as chrome, not content; the `border-t` hairline anchors it visually because the body above scrolls right up to its top edge. **This is the design-system rule for action footers** — same `py-4` as `<CardFooter>`.

  **Title block:** `<DialogTitleBlock>` — canonical title + meta primitive used by **every** detail modal. Owns the type contract so no consumer can drift. Slots: `icon` (left of title), `badge` (right of title), `meta` (text-xs text-ink-500 wrapper). Title: `text-lg leading-none font-medium text-ink-900 m-0` — sans default, `titleFont="mono"` opt-in for ID-as-title (CMP-013's `req_aurora_4200`). Internal rhythm: `flex flex-col gap-3 pr-12` — the `pr-12` is baked in so the title block always clears the absolute close button; no consumer needs to remember it. `mode="dialog"` (default — uses `<DialogTitle>` for ARIA labeling via Base UI) or `mode="static"` (renders `<h2>`) — the latter for CMP-007 specimens outside a `<Dialog>` root. **No eyebrow slot:** drilled-in modals carry surface context from the page they were opened from — a "REQUEST" / "CONVERSATION" / "THREAT EVENT" eyebrow stacked above the title is dashboard/card-pattern leakage into modal chrome (removed 2026-05-11 after competitor scan — Linear, Vercel, Stripe, Helicone all skip it). If a future modal genuinely needs surface labeling, add the slot back with intent.

  **Close button:** `absolute top-3 right-3` (12px from corner), `<Button variant="ghost" size="icon-sm">`. Position is locked at the primitive — moving the button breaks every consumer. Glyph optical center aligns with the title's text-lg cap-height center. **Never hand-roll** — `<DialogContent>` renders it automatically via `showCloseButton` (Base UI `<DialogPrimitive.Close>`); `<DialogStaticContent>` renders the same shape via its own `onClose` prop. The title block's `pr-12` (48px) clears it. (Polished 2026-05-11 from `top-2 right-2` after the 8px placement put the glyph TOP at 16px while the title TOP sat at 24px — optical misalignment with content.)

  **Body section pattern:** sections inside `<DialogScrollBody>` use `<section className="flex flex-col gap-3"><h3 className="font-sans text-sm font-medium text-ink-900 m-0">…</h3>{content}</section>`. Section h3 is `text-sm font-medium` (NOT mono uppercase eyebrow — that's reserved for the title block's `eyebrow` slot). Between sections: `gap-6` (24px) on the body's flex column.
- **AlertDialog** (`alert-dialog.tsx`) — same modal-tier surface (rounded-xl / 16px); content `p-6` (bumped from `p-4` on 2026-05-11 to match `<DialogContent>`); used for destructive confirmations.
- **Sheet** (`sheet.tsx`) — right-docked drawer. Flush against viewport edge (`rounded-none`), only a left border + modal-tier shadow.
- **Menu** (`menu.tsx`, codified 2026-05-10) — shadcn-style wrapper over Base UI Menu. Exports: `Menu` / `MenuTrigger` / `MenuContent` / `MenuItem` / `MenuLabel` / `MenuSeparator`. Recipe: content `min-w-44 rounded-sm bg-white border border-ink-200 shadow-(--shadow-popup) p-1 origin-[var(--transform-origin)]` (the transform-origin variable is published by Base UI's Positioner, so popups scale *from the trigger*, not the popup's geometric center — small detail, big feel). Item: `rounded-xs h-8 px-2 text-sm text-ink-900 [&_svg]:text-ink-500` with `transition-colors duration-100 ease-out` so keyboard arrow-through fades highlight states rather than snapping. `variant="destructive"` swaps colors to `text-danger-700 / data-[highlighted]:bg-danger-50` — used for Sign-out in `<UserMenu>`. Consumers: `<UserMenu>`, sidebar workspace switcher.
- **UserMenu** (`user-menu.tsx`, codified 2026-05-10) — shared dropdown content (Chad Ponticas avatar + name + "Free plan" pill, separator, Upgrade to Pro / Account, separator, Sign out destructive). Accepts the trigger element as `children` (render-prop forwarded to `<MenuTrigger>`). `min-w-50` content. Consumed by the sidebar's 3-dot user-area button AND `DashboardChrome`'s top-right avatar (now an interactive `<button>`, was a static `<span>`). Single source of truth — both surfaces open the exact same menu.

**Rule:** Sheet for **inspection** (drill into a row, persist while reading). Dialog for **confirmation** or **paired-panel cross-link inspection** (selection state shared via single `activeRequestId`, auto-scroll-into-view on counterpart).

### Badges, Pills, Tags

- **Badge** (`badge.tsx`) — base: `h-5 rounded-xs border border-transparent px-2.5 font-mono text-xs font-medium tabular-nums capitalize`. **Locked contract (2026-05-11):**
  - **Text-only.** Color tone (bg + text) IS the indicator. **Do NOT nest `<StatusDot/>`, lucide icons, or any other glyph inside a `<Badge>`** — redundant signal, asymmetric padding, bad UI. The prior `has-data-[icon=*]:p*-1.5` asymmetric-padding rules were removed along with icon support because they enabled the dot-in-badge anti-pattern.
  - **Symmetric `px-2.5` padding always.**
  - **First letter capitalized at the primitive.** `text-transform: capitalize` is baked in so `<Badge>blocked</Badge>` renders "Blocked". Consumers write the data as it lives in the model; visual case is the primitive's job. Digits and already-uppercase letters unchanged ("200 OK" stays "200 OK"). (First attempt used `first-letter:uppercase` / CSS `::first-letter` — that pseudo-element does not apply to inline-flex elements, only block-level. Switched to `capitalize` which works on any display type.)
  - **Variants encode tone**: `default` (ink-900/white) · `secondary` · `destructive` (danger-100/700) · `outline` · `ghost` · `link` · `success` (success-100/700) · `warning` (warning-100/700) · `info` (blue-100/700) · `neutral` (ink-100/700).
- **Tag** (`tag.tsx`) — removable filter pill (NOT a Badge). `inline-flex h-6 rounded-full bg-ink-100 border border-ink-200 text-ink-900 font-sans text-xs gap-2`. With remove: `pr-1 pl-2`; without: `px-3`. **Use Tag for filter chips, Badge for status/counter/code.**
- **StatusDot** (`status-dot.tsx`) — 6px (`size="sm"`) or 8px (`size="md"`) `rounded-full` inline-state dot. **Used standalone — NOT inside Badge.** Tones: success (success-600), warning (warning-600), danger (destructive), info (blue-600), neutral (ink-500). After the 2026-05-11 Badge contract lock, StatusDot's only legitimate consumer is row markers like CMP-013's `BreakdownRow` (label + dot + value 3-col grid); the prior "Badge + StatusDot child" pattern is retired.
- **DeltaTag** (specimen in `CMP003BadgesAndTags.tsx`) — directional pill for KPI deltas. NOT a Badge. Inline-flex arrow icon (`size-3.5`) + value text at mono medium 12px tabular. API: `<DeltaTag delta="+8.2%" note="vs last hour" inverted={false} />`.
  - **Default sentiment** (sign-based): positive = `text-success-700` + up-right; negative = `text-destructive` + down-right.
  - **`inverted` flag** flips the tone: positive paints red, negative paints green; arrow still tracks the literal sign.
  - **`inverted` ONLY applies to rate metrics where lower is unambiguously better** — latency, error rate, cost-per-X, time-to-first-token. **Volume metrics (Total Cost, Total Tokens) stay sign-based** — rising correlates with usage growth, not badness.
  - **`+`/`-` sign preserved** on the displayed value (icon + color + sign together — redundant by design).
  - **No textual qualifier** ("Lower is better") accompanies inverted color — tried 2026-05-06 and rejected.

**Rule:** Pick `inverted` by asking "is rising in this metric *unambiguously* bad?" If no, don't invert.

### Hero Numerics & KPIs

- **HeroNumeric** (`hero-numeric.tsx`) — **single source of truth for sans-tabular hero numerics ≥24px.** Recipe: `font-sans font-medium tabular-nums tracking-tight text-ink-900`. Sizes: `default` (text-2xl/8, 24px — KPI rail, Top Keys hero) and `lg` (text-3xl/9, 32px — CMP-013 page hero). **Don't hand-roll.** **Don't extend below 20px** — mono digit-shape tells become visible at ~18px.
- **CompactKpi** (`compact-kpi.tsx`) — eyebrow + `<HeroNumeric>` value + optional `<DeltaTag>`. Two variants: standalone (own card chrome) / `flat` (chrome stripped, used inside divided rows).
- **Sparkline** (`sparkline.tsx`) — lightweight inline sparkline (5–14 points, ~24px). Lower visual weight than `<CompactSpark>` (h-9, recharts-based) used in dashboard hero cards. **KPI rail sparkline colors come from chart palette** (`--color-chart-1` blue, `--color-chart-3` green, `--color-chart-7` amber, `--color-ink-500` neutral) — NOT semantic ramps.
- **MessageBlock** (`message-block.tsx`) — CMP-014 conversation bubble. **Bubble border-only, no fill** (earlier tone-tinted fills `bg-ink-100`/`bg-blue-50` read as chat-app aesthetic). Outline gets `border-blue-100` to separate model output from user/tool input. `warn` state: `bg-warning-50` + `border-warning-200` — **narrowed to data carriers**, does NOT wash the surrounding row or header.
- **ToolResultCode** (`tool-result-code.tsx`, codified 2026-05-10) — inline `<code>` recipe for tool-result JSON blobs. `font-mono text-sm text-ink-900 -tracking-[0.14px] break-all`. Extracted from CMP-014 after the recipe was inlined 4× on consecutive tool-result message bodies — two-or-more sites = mandatory primitive. Semantic `<code>` element (these blobs ARE machine output).
- **InlineCode** (`inline-code.tsx`, codified 2026-05-11) — short identifier chip rendered as `<code>`. Recipe: `font-mono text-ink-800 bg-ink-100 rounded-xs px-1.5 py-0.5`. Default `text-sm`; `size="sm"` drops to `text-xs` for table-cell density. Distinct from `<ToolResultCode>` — InlineCode is the chip variant (short identifiers like `claude-haiku-4-5` inline in prose), ToolResultCode is the JSON-blob variant (`break-all`, no chip background). Extracted after the audit found 5 hand-rolls in CMP-016 alone.

### Typography primitives

- **Eyebrow** (`eyebrow.tsx`, codified 2026-05-11) — small mono-uppercase chrome label used above KPI values, in sidebar nav-section headers, atop CompactKpi titles, on artboard / spec-sheet headers. Recipe: `font-mono text-xs uppercase tracking-[0.1em] font-medium text-ink-500`. Default element `<span>` (inline); pass `as="div"` when a block is needed. Extracted after the 2026-05-11 audit found 13 hand-rolled occurrences across CMP-013/14/15/16/18 + sidebar.tsx + compact-kpi.tsx + Artboard.tsx (the last had drifted to `tracking-[0.08em]` without `font-medium`). **No size variant ships** — the previous `Eyebrow / default` (text-sm) variant from the typography spec is unused (modal eyebrows removed 2026-05-11); add the variant back with intent when a surface needs it.
- **SectionHeading** (`section-heading.tsx`, codified 2026-05-11) — h3-class heading used inside modal body sections ("Evidence", "Detection", "Context", "Details", "Security scan"). Recipe: `font-sans text-sm font-medium text-ink-900 m-0`. Renders `<h3>` by default; pass `as="h2|h4|h5|h6"` to override level. Extracted after the audit found the recipe hand-rolled in CMP-007 + CMP-015 modal body sections (5 sites).
- **PageTitle** (`page-title.tsx`, codified 2026-05-11) — top-of-surface heading on composed pages. Recipe: `font-sans font-medium text-ink-900 text-3xl/9 -tracking-[1px] text-balance m-0`. Renders `<h2>` by default — composed pages sit inside `<DashboardChrome>` which owns the document h1 implicitly; the in-surface page title reads as h2 in the outline so child cards can use h3 without level skips. Extracted after the audit found 8 hand-rolls (every composed page's PageHeader plus a CMP-013 variant that used `tracking-tight` instead of `-tracking-[1px]` — normalized on extraction). Spec-sheet `<ArtboardHeader>` uses `text-ink-800` and does NOT compose this primitive (different surface convention; intentional).

### Helpers, links & icon affordances

- **TextLink** (`text-link.tsx`, codified 2026-05-10) — **inline link affordance, button-by-default.** Renders `<button type="button">` (correct for this codebase's no-router architecture); pass `as="a" href={...}` for a real anchor when navigation is needed. Locked visual recipe: `text-ink-800 underline decoration-ink-200 underline-offset-2 hover:decoration-ink-500 focus-visible:decoration-ink-500 focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xs`. **No blue** — blue is reserved for info / completed / active-tab / focus. Don't hand-roll the recipe; the className convention block in this doc still exists as the underlying contract, but `<TextLink>` is the single canonical consumer-facing primitive.
- **IconActionButton** (`icon-action-button.tsx`, codified 2026-05-10) — 24px (`size-6`) icon-only button with `after:-inset-2` pseudo-element expanding the hit target to 40×40 without inflating the visual footprint. Recipe: `rounded-xs text-ink-500 hover:text-ink-900 hover:bg-ink-100 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px motion-reduce:active:translate-y-0`. `touch-manipulation` kills the 300ms tap delay. **`aria-label` is required** at the type level — icon-only buttons have no accessible name from text content. Extracted from CMP-012's `TopKeysCard` overflow `MoreHorizontal`; any second site would have silently drifted.
- **TabsCount** (`tabs-count.tsx`, codified 2026-05-10) — mono count chip sitting inside a `<TabsTrigger>`. Recipe: `inline-flex items-center justify-center min-w-5 h-5 px-2 rounded-xs bg-ink-100 text-ink-500 font-mono text-xs font-medium tabular-nums`. Consumers: CMP-016 modality tabs (All types `(146)` / Text / Embeddings / Audio / Rerank), CMP-017 line-variant tab counts.
- **SettingsRow** (`settings-row.tsx`, codified 2026-05-10) — title + subtitle on the left, control on the right. Lifted from CMP-018's local definition after the same shape appeared in `SecurityCard`'s passkey row with two minor variants. API exposes three modes: default (input-bearing, title renders as `<Label htmlFor={id}>`), `static` (title renders as heading-styled `<span>` — read-only state with a Badge), and `titleAs="h4"` (title as `<h4>` heading — used when the row sits inside a Card whose CardTitle is the section heading and this row needs a sub-heading semantically). Vertical alignment via `alignTop` (`items-start`). Rhythm: first row gets no top border; subsequent rows get `border-t border-ink-200`. Rendered as `flex justify-between gap-6 py-4`.

### Toast — `{components.toast}`

`sonner.tsx`. Sonner-based, hardcoded `light` theme. Border `--color-ink-200`, radius `0.5rem` (sonner-specific), `--shadow-popup` elevation. Status icons from lucide-react at `size-4`.

### Brand

- **BrandMark** (`icons/brand-mark.tsx`) — 7-path constellation, 280×280 viewbox. Paths inline `fill="currentColor"`. Asset `public/logomark.svg` fill `#1F2FCE` = `--color-blue-700`. Canonical: `<BrandMark className="size-8 text-blue-700" />`. Other tones: `text-white` (inverted), `text-ink-900` (monochrome). Sizing: min 16px, default 32px (sidebar), 48–96px hero. **Don't rotate/skew/distort/crop. Don't recolor outside the approved set. Don't add shadows or glows to the mark itself.**
- **VendorAvatar** (`icons/vendor-meta.tsx`) — **bare brand-colored icon at `size-4`. NO chip wrapper** (locked iter 7). API: `<VendorAvatar vendor={v} />`. Vendors: anthropic, openai, google, meta, mistral, deepseek, cohere, xai + marketplace providers (`marketplace-providers.tsx`). Three vendors (Cohere/Mistral/Gemini) render multi-color via per-path SVG fills — for those, wrapper `style.color` is ignored. **Don't reintroduce a chip wrapper, `tone` prop, or split treatment.**

### Inline links

**Not a primitive — a className convention.** Inline links in body text use **ink + permanent faint underline**:

```
underline decoration-ink-200 underline-offset-2
hover:decoration-ink-500
focus-visible:decoration-ink-500
outline-none
```

Rendered as `<button type="button">` (no router in this codebase — no `<a href>`). **Visual contract = link styling, semantics = button.** (decided — see `feedback_link-affordance.md`)

**No blue link color.** Blue is reserved for info / completed / active-tab / focus. Link affordance is permanent underline, not color.

### Composed-row patterns

#### Consolidated row pattern — KpiRail / QuickActionsRow (CMP-012)

Multi-section rows live in **one bordered card** with internal sections divided by **inset hairline `before:` pseudo-elements**:

```
relative before:absolute before:left-0 before:inset-y-4 before:w-px before:bg-ink-200
```

The hairline doesn't reach the rounded corners or section edges — reads lighter than a full-height `divide-x`. Sections are flat (no individual borders/shadows); the parent owns the chrome (`rounded-sm shadow-(--shadow-border) overflow-hidden`).

When one section is the focal action, accent it with `bg-blue-50` (and the icon chip with `bg-blue-100 text-blue-700`) — matches the assistant-message bubble fill in CMP-013. **Don't invert** (white text on solid blue) — too marketing-loud for the operator-tool register.

#### Section header capitalization

- Card titles: **Title Case** (`Recent Requests`, `Top Keys`, `Request Volume`, `Quick Actions`).
- Field/column labels: **sentence case** for technical terms (`Leaf hash`, `Anchor root`, `Anchored`).
- Single-word labels: unaffected.
- Eyebrows: **MONO UPPERCASE TRACKED** (`REQUESTS / 1H`, `TOTAL COST`).

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
- **Press affordance is `active:translate-y-px`** uniformly (with `motion-reduce:active:translate-y-0` gate). The `active:scale-[0.98]` variant was retired 2026-05-10 across the entire codebase — it caused popover anchor-reposition flicker.

### Don't

- **Don't introduce blue as primary action color.** Primary is ink-900.
- **Don't introduce blue as inline-link color.** Links are ink + permanent faint underline.
- **Don't use `text-ink-600` or `text-ink-700` for table body cells.** Three-tier policy is 500 / 800 / 900 only.
- **Don't introduce solid 1px borders on cards** when `shadow-(--shadow-border)` provides the ring.
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
- **Don't use `active:scale-[0.98]` for press affordance.** Use `active:translate-y-px motion-reduce:active:translate-y-0` everywhere. Scale-press caused popover anchor-reposition flicker.
- **Don't pass arbitrary `-tracking-[Npx]` for body / title sub-pixel tightening.** Use `tracking-snug` (`-0.01em`). Heading `-tracking-[1px]` stays arbitrary — different optical tier.
- **Don't hand-roll the user dropdown or workspace switcher.** Both surfaces (sidebar 3-dot, top-bar avatar) open the shared `<UserMenu>`. Adding a third surface = new `<UserMenu>` consumer, not a new local menu.
- **Don't open a `<MenuContent>` without `origin-[var(--transform-origin)]`.** The base `<MenuContent>` already includes it; if you reach for raw Base UI `Menu.Popup`, copy the variable so the popup scales from the trigger.

---

## Responsive Behavior *(our extension — preserved)*

The product targets desktop-first operator workflows; no mobile-shipped state today. Spec-sheet artboards use a fixed 1440px column to mirror the source Paper file; composed pages (CMP-012/013/014/016) are responsive but tuned for ≥1280px. **Mobile not observed in the current state — flagged TBD.**

### Breakpoints (Tailwind v4 defaults — no overrides in `@theme`)

| Name | Width | Key Changes |
|---|---|---|
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

- **Sidebar** (left nav): no collapse spec today. Currently fixed at 256px (`w-64`) in DashboardChrome.
- **KPI rail:** four sections side-by-side at composed widths. Mobile collapse strategy TBD.
- **Tables:** horizontal scroll within container (`overflow-x-auto` on Table wrapper). Column priority not codified.

---

## Drift to Normalize *(our extension)*

Resolved 2026-05-09 — `<RowActionButton>` (4 sites) and `<EmptyState>` (2 sites) extracted to `src/components/ui/`. See §7 Lists/Tables for the row-as-button primitive contract. CMP-007's `CMP007ModalEmptyState.tsx` is a separate modal-internal specimen and intentionally remains its own shape.

Resolved 2026-05-10 — second extract-before-handrolling pass shipped **eight** new primitives in `src/components/ui/`: `<KpiRail>` (4 sites), `<TextLink>` (CMP-013), `<IconActionButton>` (CMP-012), `<TabsCount>` (CMP-016 / 017), `<ToolResultCode>` (CMP-014, 4× consumers), `<SettingsRow>` (lifted from CMP-018 local definition), `<Menu>` (shadcn-style wrapper over Base UI), `<UserMenu>` (sidebar + DashboardChrome avatar share one menu). Plus one shared helper at `src/lib/chart-palette.ts` (`CHART_PALETTE` array + `chartSlot(n)`) extracted from CMP-012's inline literal. Same pass swept 34 artboard sites of hand-rolled `rounded-sm bg-white shadow-(--shadow-border)` → `rounded-md` (new card tier) and migrated ~30 `-tracking-[Npx]` values to the new `tracking-snug` token.

Resolved 2026-05-11 — **modal-chrome unification pass.** The 2026-05-09 note that "CMP-007 is a separate modal-internal specimen and intentionally remains its own shape" is reversed: spec sheets must use the same primitive as live consumers — if they look different, the primitive is missing a slot, not the spec being its own shape. Fix shipped three primitive additions in `dialog.tsx`: `<DialogStaticContent>` (spec-sheet modal shell — no portal/popup, same outer chrome as `<DialogContent>`), `<DialogTitleBlock>` (canonical title + meta block — owns type sizes and gap rhythm so every modal title block is type-locked at the primitive; **eyebrow slot deliberately omitted** — drilled-in modals carry surface context from how they were opened; competitor scan of Linear / Vercel / Stripe / Helicone confirmed no eyebrow on detail modals), and a bump of every Dialog/AlertDialog padding from `p-4` → `p-6` (with `<DialogScrollFooter>` deliberately staying at `py-4` so the action band reads as chrome, not body). Plus one new primitive at `src/components/ui/detail-list.tsx` (`<DetailList>` + `<DetailRow>`) — extracted after the third occurrence of the same label/value-row recipe (CMP-013 `DetailRow`, CMP-015 `ContextRow`, CMP-007 `DetailGrid` — the last was drifting to a different shape). Consumers refactored: CMP-007 `ModalSpecimen` + `GenerationDetailsModal` (now compose `<DialogStaticContent>` + `<DialogTitleBlock mode="static">` + section h3 blocks + `<DialogScrollFooter>`; the GenerationDetails specimen structurally mirrors CMP-015), CMP-013 / CMP-014 / CMP-015 detail modals (use `<DialogTitleBlock>` instead of hand-rolled eyebrow + `<DialogTitle>` + meta prose; CMP-013 / CMP-015 also consume the new `<DetailRow>` primitive — local `DetailRow` / `ContextRow` helpers deleted). Lesson codified: **className overrides on a primitive are hand-rolling wearing the primitive's name.** If a consumer reaches for `<DialogTitle className="font-mono text-lg ...">`, the primitive needs a `titleFont` slot — extract, don't override.

Resolved 2026-05-11 (later) — **typography primitive extraction pass.** Five-agent audit found ~200 instances of drift across the codebase; tier A (the highest-leverage cascade) tackled four typography primitives: `<Eyebrow>` (13 sites consolidated across CMP-013/14/15/16/18 + sidebar + compact-kpi + Artboard.tsx — the last had drifted to `tracking-[0.08em]` without `font-medium`), `<SectionHeading>` (5 sites in CMP-007/15 modal body sections), `<PageTitle>` (8 sites across every composed page — one used `tracking-tight` instead of `-tracking-[1px]`, normalized on extraction; the spec-sheet `<ArtboardHeader>` stays separate as its own surface convention), and `<InlineCode>` (5 sites in CMP-016 alone — short identifier chips distinct from `<ToolResultCode>`'s JSON-blob variant). Process correction: I had previously claimed the codebase was clean of hand-rolling after the modal-chrome refactor; the audit proved that claim wrong. The audit-first-then-extract sequence is now the standard for any drift question — read the codebase, don't trust assertions about its state.

**Open drift:**
- CMP-018's `<ArtboardHeader description="...">` still mentions "Line-variant Tabs (General / Logging / Integration)" even though the Tabs were removed — prose cleanup pending.
- If unbound hex appears outside `@theme`, bind to the closest ramp atom.

## Open Questions *(our extension)*

1. **Wordmark + lockups.** Logomark finalized; wordmark + horizontal/stacked lockups TBD.
2. **Tagline.** Closest in-codebase one-liner is the CMP-012 subtitle ("Traffic, spend and latency across every model on the gateway.") — that's a subtitle, not a tagline.
3. **Favicon refresh.** `public/favicon.svg` predates the current logomark.
4. **Mobile.** No mobile state today. Sidebar/KPI-rail collapse and table column-priority not codified.
5. **Dark mode.** `:root.dark` intentionally absent. When activated, redefine semantic tokens against a dark palette in a `.dark` block — OKLCH ramp values stay constant across modes; only semantic mappings shift.
6. **Error / marketing voice.** Empty-state tone is set; error-state tone TBD. Marketing voice TBD until marketing surfaces ship.

---

## States Checklist *(our extension)*

| Surface | States |
|---|---|
| Forms (Input/Select/Switch/Checkbox/Radio) | Default · Focused · Hovered · Disabled · Invalid · Read-only |
| Tables (CMP-011/013/014) | Default · Hover · Selected · Sorted · Filtered · Empty · Loading (TBD) · Slow-row |
| Conversations (CMP-014) | User · Assistant · Tool call · Tool result (default + warn) |
| Modal / Sheet | Closed · Opening · Open · Closing · Backdrop-blur |
| Buttons | Default · Hover · Active · Focus · Disabled · Loading (TBD) |
| Toast | success · info · warning · error · loading |

**Rule:** every new screen in request/conversation/security ships with Default + Hover + Focus + Empty + Filtered in the same PR.

---

## Sources & Composed-page References

Tokens cite `src/index.css:LINE` inline. Components cite `src/components/ui/<file>.tsx`. Locked policy comes from `feedback_*.md` memories and `CLAUDE.md` "Things to not change without asking". Composed pages — compositions of the primitives above, not components themselves:

| Code | File | Pattern |
|---|---|---|
| CMP-012 | `src/artboards/CMP012ComposedDashboard.tsx` | `<KpiRail>` (consolidated row), Quick Actions (focal accent w/ `bg-blue-50`), dashboard chrome with traffic lights. Chart palette imported from `@/lib/chart-palette`. No Export button or "· Last 7d" subtitle (dropped 2026-05-10). |
| CMP-013 | `src/artboards/CMP013Requests.tsx` | Hero card with `<HeroNumeric size="lg">`, request firehose table, Dialog drill-in with cross-link. Time-range as `<SegmentedPill size="sm">` (1H / 7D / 30D) anchored right — replaces the prior Select dropdown; toolbar splits facets-left + time-scope-right. |
| CMP-014 | `src/artboards/CMP014Conversations.tsx` | `<KpiRail>`, conversations table, Dialog detail with `<MessageBlock>` flat-list thread. Cross-link selection state via `selectionSource: 'messages' \| 'trace' \| null` — each panel skips its own scroll-into-view when it originated the selection (counterpart still scrolls). Tool-result blobs use `<ToolResultCode>`. |
| CMP-015 | `src/artboards/CMP015Security.tsx` | Alert banner (`role="alert"` + `aria-live="assertive"` + `aria-atomic="true"`) + ramp-token coloring (`bg-danger-600 / text-danger-700`, not `bg-destructive`). Meter uses `aria-labelledby` (was duplicate count readout). `ApiKeyRiskScoresCard` consumes `<Card>` (was hand-rolled). Zero-value Events render at `text-ink-400`. No "Export report" / "New policy" buttons in the page header. Row-drill is a placeholder. |
| CMP-016 | `src/artboards/CMP016Models.tsx` | Modality migrated from `<SelectTrigger>` to `<Tabs variant="line">` with `<TabsCount>` chips (All types / Text / Embeddings / Audio / Rerank); table card moved INSIDE the Tabs wrapper to inherit `gap-4` rhythm. Empty-state branch for zero results consumes `<EmptyState>`. List ↔ detail swap uses `animate-in fade-in-0 slide-in-from-right-2 / slide-in-from-left-2` (wrapped in `flex flex-col gap-6` to preserve DashboardChrome inner-gap inheritance). Model handle wrapped in `<CopyButton size="inline-xs">`. `ProviderMark` renders neutral fallback chip instead of `null`. Detail-eyebrow VendorAvatar `aria-hidden`. |
| CMP-017 | `src/artboards/CMP017Team.tsx` | Members + invitations + access requests + invite form. Empty branches in invitations / requests panes consume `<EmptyState>`. RowActionsMenu `min-w-32` (was `min-w-40`). Action labels: "Approve request" / "Decline request" (was "Approve" / "Decline"). Invite-dialog labels reverted to `text-ink-600` to match the canonical CMP-004 form-label convention. |
| CMP-018 | `src/artboards/CMP018Settings.tsx` | **Collapsed to single-pane (2026-05-10)** — Tabs (General / Logging / Integration) removed; `<ProfileCard>` and `<SecurityCard>` render directly under `<PageHeader>`. `LoggingCard` and `IntegrationEmptyState` no longer in the page. `SettingsRow` primitive lifted from the local definition for cross-card reuse. Note: `description` text in the artboard's `<ArtboardHeader>` still references the removed Tabs — stale prose, separate cleanup. |

---

## Validation & Export

`npx @google/design.md lint design.md` validates. `--format dtcg` exports DTCG tokens (preserves `components.*`); `--format tailwind` exports Tailwind-v3 JSON (primitives only — for v4, translate each into `@theme inline { --color-*: ...; }`).
