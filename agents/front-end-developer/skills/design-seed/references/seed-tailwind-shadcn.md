---
# DESIGN.md format — compatible with `npx @google/design.md lint`.
# Seeded for a Tailwind v4 + shadcn/ui (new-york) stack.
# Every token below is the stack default — tag `seeded` until brand lands.
# Hex values shown (Google spec requires `#` + SRGB hex); OKLCH equivalents
# live in the prose tables below. Light-mode values only; dark-mode values
# in §2 tables.

version: alpha
name: "[PRODUCT NAME]"
description: "[TBD — verb + who + feel; needs user confirmation until product direction lands]"

colors:
  background: "#ffffff"                  # ← seeded: shadcn/ui new-york (oklch 1 0 0)
  foreground: "#0a0a0a"                  # ← seeded: shadcn (oklch 0.145 0 0)
  card: "#ffffff"                        # ← seeded: shadcn
  card-foreground: "#0a0a0a"             # ← seeded: shadcn
  popover: "#ffffff"                     # ← seeded: shadcn
  popover-foreground: "#0a0a0a"          # ← seeded: shadcn
  primary: "#171717"                     # ← seeded: shadcn (oklch 0.205 0 0) — flip to brand when decided
  primary-foreground: "#fafafa"          # ← seeded: shadcn
  secondary: "#f5f5f5"                   # ← seeded: shadcn (oklch 0.97 0 0)
  secondary-foreground: "#171717"        # ← seeded: shadcn
  muted: "#f5f5f5"                       # ← seeded: shadcn
  muted-foreground: "#737373"            # ← seeded: shadcn (oklch 0.556 0 0)
  accent: "#f5f5f5"                      # ← seeded: shadcn
  accent-foreground: "#171717"           # ← seeded: shadcn
  destructive: "#e7000b"                 # ← seeded: shadcn (oklch 0.577 0.245 27.325)
  destructive-foreground: "#ffffff"      # ← seeded: shadcn
  border: "#e5e5e5"                      # ← seeded: shadcn (oklch 0.922 0 0)
  input: "#e5e5e5"                       # ← seeded: shadcn
  ring: "#a3a3a3"                        # ← seeded: shadcn (oklch 0.708 0 0)
  chart-1: "#e76e50"                     # ← seeded: shadcn chart default
  chart-2: "#2a9d90"                     # ← seeded: shadcn
  chart-3: "#264653"                     # ← seeded: shadcn
  chart-4: "#e9c46a"                     # ← seeded: shadcn
  chart-5: "#f4a261"                     # ← seeded: shadcn
  sidebar: "#fafafa"                     # ← seeded: shadcn sidebar default
  sidebar-foreground: "#0a0a0a"          # ← seeded: shadcn
  sidebar-primary: "#171717"             # ← seeded: shadcn
  sidebar-primary-foreground: "#fafafa"  # ← seeded: shadcn
  sidebar-accent: "#f5f5f5"              # ← seeded: shadcn
  sidebar-accent-foreground: "#171717"   # ← seeded: shadcn
  sidebar-border: "#e5e5e5"              # ← seeded: shadcn
  sidebar-ring: "#a3a3a3"                # ← seeded: shadcn

typography:
  display:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.1
  h1:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
  h2:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.33
  h3:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
  h4:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.56
  body:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
  mono:
    fontFamily: "Geist Mono"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43

rounded:
  sm: 6px       # calc(var(--radius) - 4px)
  md: 8px       # calc(var(--radius) - 2px) — buttons, inputs
  lg: 10px      # var(--radius) — dialogs
  xl: 14px      # calc(var(--radius) + 4px) — cards
  2xl: 18px     # calc(var(--radius) + 8px) — hero surfaces
  full: 9999px

spacing:
  # Tailwind v4 numeric scale. Only the rows the stack ships frequently.
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  6: 24px
  8: 32px
  12: 48px
  16: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 16px    # px-4 (asymmetric: py-2 = 8px vertical, px-4 = 16px horizontal — see §7)
    height: 36px
  button-primary-hover:
    backgroundColor: "{colors.primary}"   # alpha 90 % — noted in §7 prose

  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 36px

  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 36px

  button-ghost:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 36px

  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 36px

  input-field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 36px

  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: 24px

  dialog:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 24px

  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 8px

  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 8px
---

# Design System — [PRODUCT NAME]

> Seeded greenfield `design.md` for a Tailwind v4 + shadcn/ui (new-york) stack. Every token below is the stack default. Tokens tagged `seeded` are scaffolding — replace with `decided` values as brand direction lands. This file ships with the project; it should be edited, not regenerated, as decisions accumulate.
>
> **Format:** [DESIGN.md](https://github.com/google-labs-code/design.md) (Google) — YAML front matter + prose rationale.
> Validate with `npx @google/design.md lint design.md`. Export with `npx @google/design.md export --format tailwind`.

**Source:** greenfield (no measurement)
**Extraction mode:** `seeded`
**Stack:** Next.js [VERSION] · Tailwind v4 · shadcn/ui (new-york) · Lucide · Geist Sans + Mono · TypeScript
**Generator target:** `app/globals.css` (CSS custom properties via `@theme inline`) + Tailwind v4 config
**Confidence summary:** 0 decided · ~30 seeded · 12 `[needs user confirmation]` (see Open Questions)
**Captured states:** none — shipped code doesn't exist yet
**Design↔code drift:** n/a (no code to compare to yet — drift checks begin once UI ships)
**Not yet captured (TBD):** everything brand-specific (primary, neutrals, font, radius stance, motion character, logomark)

---

## 0. Direction `[needs user confirmation]`

- **Who:** TBD — describe the target user, their device, the stakes of the task
- **Verb:** TBD — the single action this product exists to do ("hold and move", "confirm and pay", "read and act")
- **Feel:** TBD — current default is "shadcn neutral utility" — pick a stance before ship

### Defaults being rejected `[needs user confirmation]`

No decisions yet. As the team commits to positions against the category's defaults, list them here. Example shape:

1. *"Default pattern X"* → what this system does instead
2. *"Default pattern Y"* → what this system does instead

---

## 1. Overview

**Scaffold-grade, unbranded.** Neutral palette (pure white surface, near-black text), Geist Sans for every text element, 10 px default radius, whisper-soft shadows. The only aesthetic stance right now is "ship on day one, swap tokens when brand arrives." The app looks like a shadcn demo by design — pending brand direction, this is the most stable baseline possible.

**Key Characteristics**

- Light-mode baseline with parallel dark-mode values shipped by shadcn — confirm in Open Questions whether dark mode ships simultaneously ← `seeded`
- Single typeface: Geist Sans (UI) + Geist Mono (data / code) ← `seeded: shadcn default`
- Radius is uniformly 10 px (`--radius: 0.625rem`) — "balanced" stance between sharp and soft ← `seeded`
- Shadow scale is 5 steps (xs / sm / default / md / lg), all neutral black ≤ 10% opacity ← `seeded: Tailwind v4 default`
- Icon library: Lucide, outline-default, stroke-width 2, sizes 16 / 20 / 24 ← `seeded: shadcn default`
- Primary CTA = near-black pill with white text (shadcn convention). Flip to brand color when primary is decided.

---

## 2. Colors

Every value below is shadcn/ui's new-york style default (light mode, with parallel dark mode). All tagged `seeded: shadcn/ui new-york default, <mode>`. Replace per-token as brand decisions land.

The YAML front matter ships light-mode hex values for `npx @google/design.md lint` compatibility. Dark-mode OKLCH values are preserved in the tables below and materialize into `app/globals.css` via shadcn's `@theme inline` block.

### Core semantic tokens

| Token (YAML key) | Light (OKLCH) | Light (hex) | Dark (OKLCH) | Role |
|---|---|---|---|---|
| `background` | `oklch(1 0 0)` | `#ffffff` | `oklch(0.145 0 0)` | page surface |
| `foreground` | `oklch(0.145 0 0)` | `#0a0a0a` | `oklch(0.985 0 0)` | primary text |
| `card` | `oklch(1 0 0)` | `#ffffff` | `oklch(0.205 0 0)` | card surface |
| `card-foreground` | `oklch(0.145 0 0)` | `#0a0a0a` | `oklch(0.985 0 0)` | text on card |
| `popover` | `oklch(1 0 0)` | `#ffffff` | `oklch(0.269 0 0)` | popover / menu surface |
| `popover-foreground` | `oklch(0.145 0 0)` | `#0a0a0a` | `oklch(0.985 0 0)` | text on popover |
| `primary` | `oklch(0.205 0 0)` | `#171717` | `oklch(0.922 0 0)` | primary CTA fill |
| `primary-foreground` | `oklch(0.985 0 0)` | `#fafafa` | `oklch(0.205 0 0)` | text on primary |
| `secondary` | `oklch(0.97 0 0)` | `#f5f5f5` | `oklch(0.269 0 0)` | secondary CTA fill |
| `secondary-foreground` | `oklch(0.205 0 0)` | `#171717` | `oklch(0.985 0 0)` | text on secondary |
| `muted` | `oklch(0.97 0 0)` | `#f5f5f5` | `oklch(0.269 0 0)` | muted surface |
| `muted-foreground` | `oklch(0.556 0 0)` | `#737373` | `oklch(0.708 0 0)` | secondary / tertiary text |
| `accent` | `oklch(0.97 0 0)` | `#f5f5f5` | `oklch(0.371 0 0)` | accent surface (hover / active) |
| `accent-foreground` | `oklch(0.205 0 0)` | `#171717` | `oklch(0.985 0 0)` | text on accent |
| `destructive` | `oklch(0.577 0.245 27.325)` | `#e7000b` | `oklch(0.704 0.191 22.216)` | destructive action / error |
| `border` | `oklch(0.922 0 0)` | `#e5e5e5` | `oklch(1 0 0 / 10%)` | default border |
| `input` | `oklch(0.922 0 0)` | `#e5e5e5` | `oklch(1 0 0 / 15%)` | input border |
| `ring` | `oklch(0.708 0 0)` | `#a3a3a3` | `oklch(0.556 0 0)` | focus ring |

All rows: `← seeded: shadcn/ui new-york default`.

### Chart palette (shadcn default)

| Token | Light (OKLCH) | Dark (OKLCH) |
|---|---|---|
| `chart-1` | `oklch(0.646 0.222 41.116)` | `oklch(0.488 0.243 264.376)` |
| `chart-2` | `oklch(0.6 0.118 184.704)` | `oklch(0.696 0.17 162.48)` |
| `chart-3` | `oklch(0.398 0.07 227.392)` | `oklch(0.769 0.188 70.08)` |
| `chart-4` | `oklch(0.828 0.189 84.429)` | `oklch(0.627 0.265 303.9)` |
| `chart-5` | `oklch(0.769 0.188 70.08)` | `oklch(0.645 0.246 16.439)` |

All rows: `← seeded: shadcn/ui new-york chart defaults`.

### Sidebar tokens (shadcn default — ship if the app has a sidebar)

| Token | Light (OKLCH) | Dark (OKLCH) |
|---|---|---|
| `sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `sidebar-primary` | `oklch(0.205 0 0)` | `oklch(0.488 0.243 264.376)` |
| `sidebar-primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `sidebar-accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `sidebar-accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `sidebar-border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| `sidebar-ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` |

### Do not use

- Raw hex (`#0a0a0a`, `#ffffff`, `#737373`, etc.) anywhere in code or Figma. Always bind via `hsl(var(--...))` or `oklch()` referencing the custom property.
- Tailwind color classes that bypass the semantic layer (`bg-neutral-900`, `text-gray-500`). Use `bg-primary`, `text-muted-foreground`, etc.
- Hardcoded success / warning / info colors — shadcn doesn't ship these. Add them to this section with `decided` tags when the app needs them; don't reach for raw `green-500` in the meantime.

---

## 3. Typography

### Font Family

- **Primary (sans):** `"Geist", "Geist Fallback", system-ui, sans-serif` ← `seeded: shadcn default`
- **Monospace / Data:** `"Geist Mono", ui-monospace, monospace` ← `seeded: shadcn default`

Single-family baseline. Add a display face only if brand demands; until then, Geist carries everything from body to H1.

### Hierarchy

Each row maps to a key in the YAML `typography` block.

| Role (YAML key) | Class | Size | Line | Weight | LS | Rule | Source |
|---|---|---|---|---|---|---|---|
| `display` | `text-4xl` | 36 | 40 | 600 | 0 | One per view max. `text-5xl`+ only with explicit rationale. | `seeded` |
| `h1` — page title | `text-3xl` | 30 | 36 | 600 | 0 | Top-of-page anchor; don't reuse mid-page. | `seeded` |
| `h2` — section title | `text-2xl` | 24 | 32 | 600 | 0 | Group headers. | `seeded` |
| `h3` — card title | `text-xl` | 20 | 28 | 600 | 0 | Card / modal title. | `seeded` |
| `h4` — subsection | `text-lg` | 18 | 28 | 500 | 0 | Rare; prefer weight + color over this step. | `seeded` |
| `body` — default | `text-base` | 16 | 24 | 400 | 0 | Paragraph copy, form descriptions. | `seeded` |
| `body-sm` | `text-sm` | 14 | 20 | 400 / 500 | 0 | Button labels, list rows, captions. | `seeded` |
| `caption` / helper | `text-xs` | 12 | 16 | 400 | 0 | Timestamps, form hints, badges. | `seeded` |
| `mono` / data | `text-sm` (font-mono) | 14 | 20 | 400 | 0 | Code, data, tabular numerics. | `seeded` |

### Principles

- **Hierarchy comes from weight + color, not size.** Use `text-muted-foreground` before reaching for a bigger size step.
- **Weight ceiling = 600 (SemiBold)** by default. Lift to 700 only for brand-level display type.
- **Letter-spacing = 0.** Tighten (-1 to -3%) only if brand mandates; apply per-row in the table above when decided.
- **No italic** on product chrome by default.

Every row above: `seeded: Tailwind v4 + shadcn default`.

---

## 4. Layout

### Spacing System

Base unit: **4 px**. Full Tailwind scale (0 – 96 in 4 px steps, plus `px` / `0.5` half-steps). The YAML `spacing` block ships the subset most commonly used.

| Token (YAML key) | Value | Uses (seeded from shadcn conventions) | Role |
|---|---|---|---|
| `spacing.1` | 4 px | — | micro gap |
| `spacing.2` | 8 px | — | tight stack |
| `spacing.3` | 12 px | — | dense row |
| `spacing.4` | 16 px | **dominant** | default card padding, form rows |
| `spacing.6` | 24 px | — | card section gap, modal padding |
| `spacing.8` | 32 px | — | major region gap |
| `spacing.12` | 48 px | — | page-level separation |
| `spacing.16` | 64 px | — | hero / section break |

**Rule:** start at `p-6` (24 px) for cards/modals; `gap-4` (16 px) between form rows; `gap-2` (8 px) for pill/icon clusters. Drop to `gap-1` / `gap-3` only inside dense lists.
`seeded: Tailwind v4 default scale + shadcn conventions`

### Grid & Container

- **Max content width:** `max-w-7xl` (80 rem = 1280 px)
- **Page horizontal padding:** `px-4` (mobile) → `md:px-6` (tablet+) → `lg:px-8` (desktop)
- **Page layout:** `flex flex-col` with app-specific nav (top bar, sidebar, or bottom tab bar depending on product)

`seeded`

### Whitespace Philosophy

Generous outer padding, tight internal grouping. Cards get 24 px internal (`p-6`); form rows get 16 px vertical rhythm (`gap-4`); pill clusters sit 8 px apart (`gap-2`). Hierarchy emerges from spacing contrast — dense within a group, airy between groups.

---

## 5. Elevation & Depth

Tailwind v4 shadow scale. All neutral black, opacity ≤ 10%.

| Level | Token | Value | Use | Source |
|---|---|---|---|---|
| 0 – Flat | — | `shadow-none` | page background, inline chips | `seeded` |
| 1 – Raised | `shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | resting cards on page | `seeded` |
| 2 – Card | `shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | standard `<Card>`, elevated pills | `seeded` |
| 3 – Popover | `shadow-md` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | popovers, menus, dropdowns | `seeded` |
| 4 – Modal | `shadow-lg` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | dialogs, sheets | `seeded` |

**Rule:** `shadow-sm` for resting cards, `shadow-md` for popovers, `shadow-lg` for modals. No colored shadows. No inner shadows unless a specific component (Switch track, etc.) requires it.
`seeded: Tailwind v4 shadow scale`

### Motion defaults `[needs user confirmation]`

Seeded from agent conventions. Product should confirm.

- **Button press:** 150 ms `ease-out`, `scale(0.97)`
- **Hover (pointer only):** 120 ms `ease-out`, `opacity: 0.9`
- **Dialog / Sheet enter:** 200 ms fade + scale(0.95 → 1), shadcn default
- **Dropdown / Popover enter:** 150 ms `ease-out`, translateY + fade (from Radix)
- **Toast:** 200 ms slide + fade enter, 4 s hold, 200 ms exit (sonner default)
- **Page / route transition:** none by default

Tailwind v4 + shadcn animations are driven by `tw-animate-css` or `tailwindcss-animate`; they inherit these timings.

---

## 6. Shapes

### Border Radius Scale

Defined in Tailwind v4 via `@theme inline`. Each row maps to a key in the YAML `rounded` block.

| Token (YAML key) | Computed | Context |
|---|---|---|
| `rounded.sm` | `calc(var(--radius) - 4px)` = 6 px | tight badges, chips |
| `rounded.md` | `calc(var(--radius) - 2px)` = 8 px | buttons, inputs |
| `rounded.lg` | `var(--radius)` = 10 px | dialogs |
| `rounded.xl` | `calc(var(--radius) + 4px)` = 14 px | cards |
| `rounded.2xl` | `calc(var(--radius) + 8px)` = 18 px | hero surfaces, illustration containers |
| `rounded.full` | 9999 | pills, avatars, focus rings |

`--radius: 0.625rem` (10 px) — shadcn default. Change **once** to shift the whole system's radius stance.

**Rule:** pills = `rounded.full` · cards = `rounded.xl` · dialogs = `rounded.lg` · buttons/inputs = `rounded.md` · badges = `rounded.sm` or `rounded.md`. Never mix within a visual group.
`seeded: shadcn radius scale`

### Shape Language

Rounded-default. Shadcn new-york leans soft without becoming playful — concentric radii across the stack (child ≤ parent), no right angles below dialog scale. Iconography is outline (Lucide) with stroke-width 2.

---

## 7. Components

Shadcn new-york primitives. Real decisions that work day one. Each component's geometry is `seeded` until the team has a reason to deviate. Each block below maps to a key in the YAML `components` block.

### Buttons

#### Primary — `components.button-primary` (+ `-hover`)

```
variant:          default
height:           h-9    (36 px)
padding:          px-4 py-2   (16 px horizontal, 8 px vertical — YAML stores px-4 as the dominant value)
border-radius:    rounded-md   (calc(var(--radius) - 2px) = 8 px)
background:       bg-primary
text:             text-primary-foreground
font:             text-sm font-medium
gap (icon↔label): gap-2  (8 px)
states:           hover:bg-primary/90, focus-visible:ring-2 ring-ring ring-offset-2,
                  disabled:opacity-50 pointer-events-none
```

**Rule:** `<Button>` for every committing action. Don't replace with a `<div>` or custom element.
**Don't:** override internal geometry via `className`. Extend via `asChild` with Radix Slot or compose with `cn()`.
`seeded: shadcn Button default variant`

#### Sizes

- `size="sm"` → `h-8 px-3 text-xs`
- `size="default"` → `h-9 px-4 py-2`
- `size="lg"` → `h-10 px-6`
- `size="icon"` → `h-9 w-9`

#### Secondary / Outline / Ghost / Link / Destructive — `components.button-{secondary,outline,ghost,destructive}`

All share the same geometry (`h-9 px-4 py-2 rounded-md text-sm font-medium`), differ in fill:

- `outline` → `border border-input bg-background hover:bg-accent hover:text-accent-foreground`
- `secondary` → `bg-secondary text-secondary-foreground hover:bg-secondary/80`
- `ghost` → `hover:bg-accent hover:text-accent-foreground`
- `link` → `text-primary underline-offset-4 hover:underline`
- `destructive` → `bg-destructive text-white hover:bg-destructive/90`

All `seeded`.

### Cards & Containers

#### Card — `components.card`

```
border-radius:    rounded-xl   (calc(var(--radius) + 4px) = 14 px)
border:           border
background:       bg-card
text:             text-card-foreground
shadow:           shadow-sm
padding:          p-6
gap (sections):   gap-6
```

Sub-components: `<CardHeader>`, `<CardTitle>` (text-2xl font-semibold), `<CardDescription>` (text-sm text-muted-foreground), `<CardContent>`, `<CardFooter>`.

**Rule:** use `<Card>` for any bounded content block with its own title/body/footer. Don't nest cards.
`seeded: shadcn Card default`

### Inputs & Forms

#### Text Input — `components.input-field` (+ focused / error / disabled variants)

```
height:           h-9
padding:          px-3 py-1
border:           border border-input
background:       bg-transparent
border-radius:    rounded-md   (8 px)
font:             text-base md:text-sm   (16 px mobile to avoid iOS zoom; 14 px desktop)
focus:            focus-visible:ring-2 ring-ring ring-offset-2, outline-none
placeholder:      text-muted-foreground
disabled:         opacity-50 cursor-not-allowed
```

**Rule:** every text input through `<Input>`. Use the paired `<Label>` and shadcn's `<FormField>` pattern for validation.
**Don't:** style raw `<input>` elements — you'll lose focus ring + disabled behavior.
`seeded: shadcn Input default`

#### Label

```
text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
```

#### Form validation

- Message text: `text-sm font-medium text-destructive`
- Invalid input: `aria-invalid:ring-2 aria-invalid:ring-destructive`
- Helper text: `text-sm text-muted-foreground`

`seeded: shadcn Form default`

### Dialogs, Popovers, Sheets, Dropdowns

#### Dialog — `components.dialog`

```
overlay:          fixed inset-0 z-50 bg-black/80, animate fade-in/out
content:          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                  w-full max-w-lg
                  border bg-background p-6
                  rounded-lg   (var(--radius) = 10 px)
                  shadow-lg
                  grid gap-4
title:            text-lg font-semibold
description:      text-sm text-muted-foreground
close button:     absolute right-4 top-4, ring-offset-background focus:ring-2
```

**Rule:** `<Dialog>` for blocking tasks. `<Sheet>` for side-drawers. `<Drawer>` for bottom-sheets on mobile. Don't mix patterns.
`seeded: shadcn Dialog default`

### Navigation

#### Tabs

- `TabsList`: `bg-muted text-muted-foreground rounded-lg p-1 h-9 inline-flex items-center`
- `TabsTrigger`: `rounded-md px-3 py-1 text-sm font-medium, data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow`

**Rule:** segmented control for 2–5 siblings. More than 5 → use a menu or sidebar.
`seeded: shadcn Tabs default`

#### NavigationMenu / Sidebar

Full sidebar component ships in shadcn with `sidebar-*` tokens (see §2). Ship it when app needs persistent nav; skip when the product is single-surface.

### Badges — `components.badge` + `badge-secondary`

```
variant default:  bg-primary text-primary-foreground
variant secondary:bg-secondary text-secondary-foreground
variant outline:  border text-foreground
variant destructive: bg-destructive text-destructive-foreground
shared:           inline-flex items-center rounded-md px-2 py-0.5
                  text-xs font-medium
                  focus:ring-2 focus:ring-ring focus:ring-offset-2
```

### Alerts

```
container:        relative rounded-lg border p-4
                  grid gap-1
                  [&:has([data-slot=alert-icon])]:grid-cols-[20px_1fr]
variants:         default (bg-background), destructive (border-destructive/50 text-destructive)
title:            text-sm font-medium leading-none tracking-tight
description:      text-sm text-muted-foreground
```

### Toasts

`sonner` (shadcn's default) — toasts bottom-right, 6 s duration, fade + slide.
`seeded: shadcn sonner default`

### Brand

- **Logomark:** TBD — no brand mark yet. When added: 32 × 32 top-left of every authenticated screen (pattern; override per-project).
- **Wordmark:** TBD — no wordmark yet.

`[needs user confirmation]` — entire Brand block.

---

## 8. Do's and Don'ts *(cross-cutting)*

### Do

- Bind every color via `hsl(var(--...))` or the `oklch()` token referenced in the theme. Never hardcode.
- Use `cn()` from `@/lib/utils` to merge className strings. Avoid template-string concatenation.
- Keep shadcn primitives as-is in `components/ui/` until you have a reason to fork. Extend via composition and `asChild` / Radix Slot.
- Use semantic tokens (`bg-background`, `text-muted-foreground`) over palette tokens (`bg-neutral-50`, `text-gray-500`).
- Keep the 4 pt spacing grid. No off-scale values.

### Don't

- Introduce a second typeface until brand requires it. Geist carries everything.
- Override shadcn internals via deep CSS selectors. Extend the source file in `components/ui/` if you must.
- Use raw hex anywhere. Every color should resolve to a CSS custom property.
- Skip focus rings. Every interactive element gets `focus-visible:ring-2 ring-ring ring-offset-2`.
- Ship a primary color without a `decided` tag. Until brand lands, primary stays near-black — that's fine.

---

## Responsive Behavior

### Breakpoints (Tailwind v4 defaults)

| Name | Width | Key Changes |
|---|---|---|
| base | < 640 | mobile-first; stacked layouts |
| sm | ≥ 640 | small tablet |
| md | ≥ 768 | tablet |
| lg | ≥ 1024 | sidebar unlocks on `lg:flex-row` layouts |
| xl | ≥ 1280 | |
| 2xl | ≥ 1536 | |

### Touch Targets

- Minimum 36 × 36 px (matches shadcn `<Button size="sm">`). Prefer 40 × 40+ for one-handed mobile reach.
- Icon buttons (`size="icon"`): 36 × 36; wrap in a padded container (44 × 44 hit zone) for primary nav.

### Collapsing Strategy

- Sidebar: `lg:flex-row` unlocks at 1024 px; below, sidebar stacks or becomes a sheet.
- Tables: `overflow-x-auto` on container; or collapse to card list below `md`.
- Forms: single column mobile; `md:grid-cols-2` paired inputs above tablet.

`seeded: standard Tailwind breakpoints + shadcn conventions`

---

## Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** `{colors.primary}` → `{colors.primary-foreground}` text (near-black on white, light mode)
- **Page background:** `{colors.background}`
- **Card surface:** `{colors.card}` with `{colors.border}` border
- **Heading text:** `{colors.foreground}`
- **Body text:** `{colors.foreground}`
- **Secondary / muted text:** `{colors.muted-foreground}`
- **Input placeholder:** `{colors.muted-foreground}`
- **Input border (default):** `{colors.input}`
- **Input border (focused):** `{colors.ring}`
- **Label text:** `{colors.foreground}` (`{typography.body-sm}` weight 500)
- **Required asterisk:** `{colors.destructive}`

### Iteration Guide

1. **Font:** Geist Sans via `next/font` or `@fontsource/geist`. Bind to Tailwind via `@theme inline { --font-sans: ... }`.
2. **Card:** `components.card` — `shadow-sm` at rest, `shadow-md` on elevated variants. Padding `p-6`.
3. **Primary button:** `components.button-primary` — `h-9 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium`.
4. **Secondary button:** `components.button-outline` or `button-secondary` depending on weight needed.
5. **Inputs:** `components.input-field` — `h-9 px-3 rounded-md border-input bg-transparent text-base md:text-sm`. Paired with `<Label>`.
6. **Form labels:** `{typography.body-sm}` weight 500, `leading-none`. 6 px gap below label.
7. **Card internal padding:** `{spacing.6}` (24 px). Sub-sections gap `{spacing.6}`.
8. **Typography hierarchy:** `{typography.h1}` → `{typography.h2}` → `{typography.h3}` → `{typography.body}` → `{typography.body-sm}` → `{typography.caption}`. Weight 600 on titles, 400–500 on body.
9. **Page layout:** `<main className="min-h-screen bg-background">` with `max-w-7xl mx-auto px-4 md:px-6 lg:px-8`.
10. **Shadows:** `shadow-sm` cards, `shadow-md` popovers, `shadow-lg` dialogs. Never colored.
11. **Spacing rhythm:** `{spacing.2}` (8 px) micro, `{spacing.4}` (16 px) default, `{spacing.6}` (24 px) major, `{spacing.8}` (32 px) regions.
12. **Links:** `<a className="font-medium underline underline-offset-4 hover:text-primary">` or `<Button variant="link">` for CTA-style links.
13. **Icons:** Lucide via `lucide-react`. Size 16 inline, 20 row-level, 24 nav. Stroke inherits `currentColor`.
14. **Focus states:** every interactive element gets `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. Never remove.
15. **Dark mode:** ship via `.dark` class toggle on `<html>`; shadcn's tokens already carry dark values (see §2 tables).

---

## Drift to Normalize

Nothing to normalize yet — no code has shipped. This section populates when `design-extractor` runs against the built app and finds deviations from the declared tokens.

---

## Open Questions *(the branding backlog — tackle in order)*

1. **Primary hue.** Currently near-black (`oklch(0.205 0 0)`). Resolve by: pasting a tweakcn URL, a shadcn theme generator export, or hand-picking an OKLCH value. See `references/import-tweakcn.md`.
2. **Neutral temperature.** Currently neutral gray (`oklch(0.97 0 0)` family). Options: slate (cool), gray (neutral, current), zinc (balanced), neutral (warm-leaning), stone (warm).
3. **Accent color.** Currently == secondary (no distinct accent). Decide when brand has a distinct accent beyond primary.
4. **Radius stance.** Currently `--radius: 0.625rem` (10 px, "balanced"). Options: sharp (0.125rem / 2 px), balanced (0.625rem, current), soft (1rem / 16 px).
5. **Font family.** Currently Geist. Alternatives: Inter, custom display face paired with Geist body, fully custom family.
6. **Dark mode.** Tokens exist; confirm whether dark ships day one or light-only for now.
7. **Destructive red.** Currently `oklch(0.577 0.245 27.325)`. Keep or tune.
8. **Success / warning / info.** Shadcn doesn't ship these. If the app has status states, add them here with `decided` tags.
9. **Icon set.** Default Lucide. Alternatives: Heroicons, Phosphor, Tabler.
10. **Motion character.** Defaulted agent speeds (150–200 ms). Any brand motion principles (punchier / softer / overshoot)?
11. **Letter-spacing stance.** Tailwind default (0). Some brands tighten (-1 to -3%).
12. **Brand mark / logo placement rules.** No logomark or wordmark yet.

Resolve top-down. Each answer flips `seeded` → `decided` on the relevant row(s) of §2 / §3 / §5 / §6 / §7-Brand.

---

## States Checklist

No flows designed yet. Populate as product scope crystallizes. The usual suspects to plan for:

- Empty state (first-run, zero-data)
- Loading state (skeleton, spinner, progress)
- Error state (inline + full-page)
- Success / confirmation
- Disabled / read-only
- Offline / degraded
- Dark mode parity (every state ships light + dark)

---

## Sources & Extraction Log

| Section | Basis |
|---|---|
| §0 Direction | `[needs user confirmation]` — awaiting product definition |
| §1 Overview | synthesis of shadcn/ui new-york aesthetic + Tailwind v4 primitives |
| §2 Colors | `seeded` from shadcn/ui new-york defaults v4.0 |
| §3 Typography | `seeded` from Tailwind v4 default scale + shadcn font-sans conventions |
| §4 Layout | `seeded` from Tailwind v4 default + shadcn spacing conventions |
| §5 Elevation | `seeded` from Tailwind v4 shadow scale + agent motion defaults |
| §6 Shapes | `seeded` from shadcn radius scale |
| §7 Components | `seeded` from shadcn/ui v4 (new-york style) component source |
| §8 Do / Don't | derived rules from stack choice + `[needs user confirmation]` where team-specific |
| Responsive | `seeded` Tailwind default breakpoints |
| Agent Guide | synthesis of §§2–7 into shadcn-aware implementation recipe |
| Drift | empty; will populate on first extractor run against shipped code |
| Open Questions | 12 pre-populated branding decisions waiting |

### What's genuinely TBD

Everything under `[needs user confirmation]` plus all 12 Open Questions. As each resolves, the corresponding row(s) above flip from `seeded` → `decided` and this log gets a date-stamped entry.

---

## Validation

Run after every edit:

```bash
npx @google/design.md lint design.md
```

Export the seeded tokens to a Tailwind theme config:

```bash
npx @google/design.md export --format tailwind design.md > tailwind.theme.json
```

Or to W3C DTCG tokens.json:

```bash
npx @google/design.md export --format dtcg design.md > tokens.json
```
