# Globals — Stable Token & Layout Boilerplate

> **Ships with `front-end-developer`** as **`contract/globals.md`**. It describes **only Layer 1** (stable token + layout boilerplate). Hosts may keep a longer appendix anywhere they want (e.g. `docs/design-globals.md`); refresh **this** file from your authoritative Layer 1 source when defaults change.

> **Three layers (conceptual).** Only **Layer 1** is in this bundle. **Layer 2** = Theme / preset skin (swappable). **Layer 3** = Project / product rules (persistent). How to introduce layers 2–3 in a **new** repo — file names, extract order, Figma sync — is in **`agent/front-end-developer.md`** (Design System Sequencing + Authority), not in this appendix. Hosts may keep Theme + Project under a dedicated folder (example: `design-contract/`) — paths vary; the agent does not ship them.

> **Layer 1 (this file).** Written contract for what typically lives in the host’s **`app/globals.css`** (numeric CSS variables Tailwind maps to). Covers Tailwind v4 + shadcn defaults and Figma/Arca variable architecture — reset + semantic token layer, not theme skinning. Layer 1 stays stable when hosts swap themes.

> **Layers 2–3 (host-owned).** Theme overrides and product conventions live in whatever files the host chooses — often a single **`system.md`** (Theme + Project sections), a design-plugin extract, or split docs. The agent learns those paths from the **host repo**, not from this package.

---

## Variable Architecture (Figma)

4-collection structure from the Shadcn Figma kit (Arca):

| Collection | Vars | Mode(s) | Purpose |
| --- | --- | --- | --- |
| 1. TailwindCSS | 448 | Default | Raw Tailwind palette + dimensions |
| 2. Theme | 235 | Default | Semantic tokens as `-light`/`-dark` pairs + typography + shadows |
| 3. Mode | 60 | Light/Dark | Mode switching via aliases + alpha steps + opacity combos |
| 4. Custom | 26 | Desktop/Mobile | Responsive typography + layout spacing |

### How Mode Switching Works

Theme stores light and dark as SEPARATE variables:

```text
colors/primary-light → tailwind value
colors/primary-dark  → tailwind value
```

Mode aliases into Theme per mode:

```text
base/primary → colors/primary-light (Light mode)
base/primary → colors/primary-dark  (Dark mode)
```

Nodes bind to `base/*` variables. Set mode on parent frame:

```js
frame.setExplicitVariableModeForCollection(modeCol, darkModeId);
```

### Mode Collection — Complete Reference

**base (33):** Direct aliases to Theme -light/-dark tokens

```text
base/background, base/foreground, base/card, base/card-foreground,
base/popover, base/popover-foreground, base/primary, base/primary-foreground,
base/secondary, base/secondary-foreground, base/muted, base/muted-foreground,
base/accent, base/accent-foreground, base/destructive, base/destructive-foreground,
base/border, base/input, base/ring, base/ring-offset,
base/chart-1..5, base/sidebar-background, base/sidebar-foreground,
base/sidebar-primary, base/sidebar-primary-foreground,
base/sidebar-accent, base/sidebar-accent-foreground,
base/sidebar-border, base/sidebar-ring
```

**alpha (10):** Generic opacity steps

```text
alpha/5  → white@95% (light) / #0a0a0a@95% (dark)
alpha/10 → white@90% / #0a0a0a@90%
... through alpha/90
```

**custom (17):** Opacity-modified — different values per mode

```text
custom/destructive\10 dark:destructive\20  → destructive@10% / destructive@20%
custom/destructive\20 dark:destructive\40  → destructive@20% / destructive@40%
custom/destructive\40 dark:destructive\60  → destructive@40% / destructive@60%
custom/destructive dark:destructive\60     → destructive@100% / destructive@60%
custom/destructive dark:destructive\70     → destructive@100% / destructive@70%
custom/destructive dark:destructive\90     → destructive@100% / destructive@90%
custom/background dark:input\30            → background / white@4.5%
custom/background dark:calendar\30         → background / white@4.5%
custom/accent dark:input\50                → accent / white@7.5%
custom/accent dark:calendar\50             → accent / white@7.5%
custom/input dark:input\80                 → input / white@12%
custom/dark:input                          → white@0% / white@15%
custom/outline                             → #737373@50% / #A1A1A1@50%
custom/outline\10 dark:outline\20          → #737373@10% / #A1A1A1@20%
custom/blue-500 dark:blue-600              → tailwind blue/500 / blue/600
custom/border dark:input-dark              → border / white@10%
custom/ring dark:input-dark                → ring / white@10%
```

---

## Default Semantic Color Tokens (shadcn neutral)

These are the shadcn defaults BEFORE any theme preset is applied. Themes override specific values.

### Light Mode

| Token | OKLCH | Hex | Role |
| --- | --- | --- | --- |
| `--background` | `oklch(1 0 0)` | `#ffffff` | Page background |
| `--foreground` | `oklch(0.145 0 0)` | `#0a0a0a` | Primary text |
| `--card` | `oklch(1 0 0)` | `#ffffff` | Card surfaces |
| `--card-foreground` | `oklch(0.145 0 0)` | `#0a0a0a` | Card text |
| `--popover` | `oklch(1 0 0)` | `#ffffff` | Dropdown/popover surfaces |
| `--popover-foreground` | `oklch(0.145 0 0)` | `#0a0a0a` | Popover text |
| `--primary` | `oklch(0.205 0 0)` | `#171717` | Primary actions (near-black) |
| `--primary-foreground` | `oklch(0.985 0 0)` | `#fafafa` | Text on primary |
| `--secondary` | `oklch(0.97 0 0)` | `#f5f5f5` | Secondary surfaces |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `#171717` | Text on secondary |
| `--muted` | `oklch(0.97 0 0)` | `#f5f5f5` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.556 0 0)` | `#737373` | De-emphasized text |
| `--accent` | `oklch(0.97 0 0)` | `#f5f5f5` | Hover/active surfaces |
| `--accent-foreground` | `oklch(0.205 0 0)` | `#171717` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#e7000b` | Danger/error |
| `--border` | `oklch(0.922 0 0)` | `#e5e5e5` | Default borders |
| `--input` | `oklch(0.922 0 0)` | `#e5e5e5` | Input borders |
| `--ring` | `oklch(0.708 0 0)` | `#a1a1a1` | Focus rings |
| `--chart-1` | `oklch(0.646 0.222 41.116)` | `#e76e50` | Orange |
| `--chart-2` | `oklch(0.6 0.118 184.704)` | `#2a9d90` | Teal |
| `--chart-3` | `oklch(0.398 0.07 227.392)` | `#264653` | Dark cyan |
| `--chart-4` | `oklch(0.828 0.189 84.429)` | `#e9c46a` | Amber |
| `--chart-5` | `oklch(0.769 0.188 70.08)` | `#f4a261` | Orange |
| `--sidebar` | `oklch(0.985 0 0)` | `#fafafa` | Sidebar surface |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | `#0a0a0a` | Sidebar text |
| `--sidebar-primary` | `oklch(0.205 0 0)` | `#171717` | Sidebar primary action |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | `#fafafa` | Text on sidebar primary |
| `--sidebar-accent` | `oklch(0.97 0 0)` | `#f5f5f5` | Sidebar hover |
| `--sidebar-accent-foreground` | `oklch(0.205 0 0)` | `#171717` | Text on sidebar accent |
| `--sidebar-border` | `oklch(0.922 0 0)` | `#e5e5e5` | Sidebar borders |
| `--sidebar-ring` | `oklch(0.708 0 0)` | `#a1a1a1` | Sidebar focus rings |

### Dark Mode

| Token | OKLCH | Hex | Key difference |
| --- | --- | --- | --- |
| `--background` | `oklch(0.145 0 0)` | `#0a0a0a` | Near-black, not pure black |
| `--foreground` | `oklch(0.985 0 0)` | `#fafafa` | Near-white |
| `--card` | `oklch(0.205 0 0)` | `#171717` | Slightly lighter than bg |
| `--popover` | `oklch(0.205 0 0)` | `#171717` | Same as card |
| `--primary` | `oklch(0.922 0 0)` | `#e5e5e5` | Inverted — light on dark |
| `--primary-foreground` | `oklch(0.205 0 0)` | `#171717` | |
| `--secondary` | `oklch(0.269 0 0)` | `#262626` | Dark gray |
| `--muted` | `oklch(0.269 0 0)` | `#262626` | Same as secondary |
| `--muted-foreground` | `oklch(0.708 0 0)` | `#a1a1a1` | Mid gray |
| `--destructive` | `oklch(0.704 0.191 22.216)` | `#ff6467` | Lighter red for dark bg |
| `--border` | `oklch(1 0 0 / 10%)` | `white @ 10%` | Translucent |
| `--input` | `oklch(1 0 0 / 15%)` | `white @ 15%` | Slightly more visible |
| `--ring` | `oklch(0.556 0 0)` | `#737373` | |
| `--chart-1` | `oklch(0.646 0.222 41.116)` | `#e76e50` | Same as light |
| `--chart-2` | `oklch(0.6 0.118 184.704)` | `#2a9d90` | Same as light |
| `--chart-3` | `oklch(0.398 0.07 227.392)` | `#264653` | Same as light |
| `--chart-4` | `oklch(0.828 0.189 84.429)` | `#e9c46a` | Same as light |
| `--chart-5` | `oklch(0.769 0.188 70.08)` | `#f4a261` | Same as light |
| `--sidebar` | `oklch(0.205 0 0)` | `#171717` | Matches card bg |
| `--sidebar-foreground` | `oklch(0.985 0 0)` | `#fafafa` | Near-white |
| `--sidebar-primary` | `oklch(0.985 0 0)` | `#fafafa` | Inverted (neutral-50) |
| `--sidebar-primary-foreground` | `oklch(0.205 0 0)` | `#171717` | Dark on light |
| `--sidebar-accent` | `oklch(0.269 0 0)` | `#262626` | Same as secondary dark |
| `--sidebar-accent-foreground` | `oklch(0.985 0 0)` | `#fafafa` | Near-white |
| `--sidebar-border` | `oklch(1 0 0 / 10%)` | `white @ 10%` | Translucent (matches border) |
| `--sidebar-ring` | `oklch(0.556 0 0)` | `#737373` | Matches ring |

### Tailwind Neutral Scale

| Tailwind | Hex | Mapped to |
| --- | --- | --- |
| `neutral-50` | `#fafafa` | sidebar, primary-foreground (light) |
| `neutral-100` | `#f5f5f5` | secondary, muted, accent (light) |
| `neutral-200` | `#e5e5e5` | border, input (light) |
| `neutral-400` | `#a3a3a3` | ring (light) |
| `neutral-500` | `#737373` | muted-foreground (light), ring (dark) |
| `neutral-800` | `#262626` | secondary, muted, accent (dark) |
| `neutral-900` | `#171717` | primary (light), card/popover (dark) |
| `neutral-950` | `#0a0a0a` | foreground (light), background (dark) |

---

## Radius Scale

Base: `--radius: 0.625rem` (10px). Tailwind `@theme` derives:

| Token | Formula | Value | Default use |
| --- | --- | --- | --- |
| `rounded-sm` | `× 0.6` | 6px | Checkbox, DropdownMenuItem |
| `rounded-md` | `× 0.8` | 8px | Default Button, Input, Select |
| `rounded-lg` | `× 1.0` | 10px | — |
| `rounded-xl` | `× 1.4` | 14px | Card (default shadcn) |
| `rounded-2xl` | `× 1.8` | 18px | — |
| `rounded-3xl` | `× 2.2` | 22px | — |
| `rounded-4xl` | `× 2.6` | 26px | Pill-style presets |
| `rounded-full` | — | 9999px | Avatar, Badge (default), Switch |

Which radius applies to which component is **theme-dependent** — see the **Theme** section in `system.md`.

---

## Typography

### Type Scale (Tailwind defaults)

| Class | Font Size | Line Height |
| --- | --- | --- |
| `text-xs` | 12px | 16px |
| `text-sm` | 14px | 20px |
| `text-base` | 16px | 24px |
| `text-lg` | 18px | 28px |
| `text-xl` | 20px | 28px |
| `text-2xl` | 24px | 32px |
| `text-3xl` | 30px | 36px |
| `text-4xl` | 36px | 40px |
| `text-5xl` | 48px | 48px |
| `text-6xl` | 60px | 60px |
| `text-7xl` | 72px | 72px |
| `text-8xl` | 96px | 96px |
| `text-9xl` | 128px | 128px |

### Font Weights

| Class | Weight | Common use |
| --- | --- | --- |
| `font-normal` | 400 | Body text, descriptions |
| `font-medium` | 500 | Labels, badges, buttons |
| `font-semibold` | 600 | Card titles, section headings |
| `font-bold` | 700 | KPI values, page headings |

### Arca Text Style Naming Convention

309 styles in the Arca Figma kit. Structure: `text-{size}/{leading}/{weight}`

Plus 4 responsive custom styles: `custom/heading-xl`, `custom/heading-lg`, `custom/heading-md`, `custom/heading-sm`

### Letter-Spacing (PERCENT unit) — Arca Source

Negative tracking applied progressively from body (12px) through display (48px). Sizes 60px+ are always 0%. Most `leading-none` variants are 0%, with exceptions noted.

| Size | Reg / Med / SemiBold | Other weights | leading-none |
| --- | --- | --- | --- |
| text-xs (12) | **-1%** | 0% | 0% |
| text-sm (14) | **-2%** | -1% all others | 0% |
| text-base (16) | **-2%** | -2% uniform | 0% |
| text-lg (18) | **-3%** | Light -2%, rest 0% | Reg/Med/Semi **-3%**, rest 0% |
| text-xl (20) | **-3%** | **-2% all others** | 0% |
| text-2xl (24) | **-3%** | -3% uniform | 0% |
| text-3xl (30) | **-3%** | ExtraLight/Light -3%, Thin/Bold+ 0% | 0% |
| text-4xl (36) | **-3%** | Thin/ExtraLight -3%, Light/Bold+ 0% | 0% |
| text-5xl (48) | **-3%** | 0% | Reg/Med/Semi/Bold **-2%**, rest 0% |
| text-6xl (60) | 0% | 0% | 0% |
| text-7xl+ | 0% | 0% | 0% |

Custom headings: all 0% letter-spacing.

### Code Mapping

In Tailwind v4, Figma's PERCENT letter-spacing maps to `em` tracking utilities:

- `-1%` → `tracking-[-0.01em]`
- `-2%` → `tracking-[-0.02em]`
- `-3%` → `tracking-[-0.03em]`

---

## Default Component Variants (shadcn registry)

> These are the DEFAULT shadcn classes. Theme presets override specific values (radii, colors, shadows, etc.)

### Button

**Base:** `inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`

| Variant | Default classes |
| --- | --- |
| default | `bg-primary text-primary-foreground hover:bg-primary/90` |
| destructive | `bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40` |
| outline | `border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50` |
| secondary | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| ghost | `hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50` |
| link | `text-primary underline-offset-4 hover:underline` |

| Size | Default classes |
| --- | --- |
| xs | `h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3` |
| sm | `h-8 gap-1.5 rounded-md px-3` |
| default | `h-9 px-4 py-2` |
| lg | `h-10 rounded-md px-6` |
| icon | `size-9` |
| icon-xs | `size-6 rounded-md [&_svg:not([class*='size-'])]:size-3` |
| icon-sm | `size-8` |
| icon-lg | `size-10` |

### Card

| Element | Default classes |
| --- | --- |
| Card | `flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm` |
| CardHeader | `grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6` |
| CardTitle | `leading-none font-semibold` |
| CardDescription | `text-sm text-muted-foreground` |
| CardContent | `px-6` |
| CardFooter | `flex items-center px-6` |

### Dialog

| Element | Default classes |
| --- | --- |
| DialogOverlay | `fixed inset-0 z-50 bg-black/50` |
| DialogContent | `fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg bg-background p-6 shadow-lg sm:max-w-lg` |
| DialogHeader | `flex flex-col gap-2` |
| DialogTitle | `text-lg leading-none font-semibold` |
| DialogDescription | `text-sm text-muted-foreground` |
| DialogFooter | `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end` |

### Badge

**Base:** `inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium`

### Input

`h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs md:text-sm placeholder:text-muted-foreground disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30`

### Table

| Element | Default classes |
| --- | --- |
| Table | `w-full caption-bottom text-sm` |
| TableHeader | `[&_tr]:border-b` |
| TableHead | `h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground` |
| TableRow | `border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted` |
| TableCell | `p-3 align-middle whitespace-nowrap` |

---

## Opacity Modifier Patterns

These Tailwind opacity modifiers are used across default shadcn components. The Arca Figma kit materializes them as Mode variables.

### Destructive

| Class | Context | Light | Dark |
| --- | --- | --- | --- |
| `bg-destructive` | badge/button base | 100% | — |
| `bg-destructive/60` | badge/button dark base | — | 60% |
| `bg-destructive/90` | button hover | 90% | — |
| `ring-destructive/20` | focus ring | 20% | — |
| `ring-destructive/40` | focus ring dark | — | 40% |

### Input/border

| Class | Context | Effect |
| --- | --- | --- |
| `bg-input/30` | outline button bg (dark), input bg (dark) | 30% |
| `bg-input/50` | outline button hover (dark) | 50% |

### Other

| Class | Context | Effect |
| --- | --- | --- |
| `bg-primary/90` | primary button hover | 90% |
| `bg-secondary/80` | secondary button hover | 80% |
| `bg-accent/50` | ghost hover (dark) | 50% |
| `bg-muted/50` | table row hover, footer | 50% |
| `bg-black/50` | dialog overlay | 50% black |
| `ring-ring/50` | all focus-visible | 50% of ring |

**Pattern:** Dark mode generally uses higher opacity for tinted elements (base color is lighter against dark bg). Destructive: 100% light / 60% dark. Focus rings: 20% light / 40% dark.

In Figma, these must be separate variables with alpha baked into RGBA — never use paint opacity.

---

## Shadow Scale

| Token | Value | Use |
| --- | --- | --- |
| `shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Input fields |
| `shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)` | Cards (default), active tabs |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)` | Dropdowns |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)` | Dialogs |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Modals |

Dark mode: shadows are invisible on dark backgrounds. Structure comes from translucent borders and surface lightness differences.

---

## Spacing Scale (Tailwind, 4px base)

```text
0=0  px=1  0.5=2  1=4  1.5=6  2=8  2.5=10  3=12  3.5=14  4=16  5=20
6=24  7=28  8=32  9=36  10=40  11=44  12=48  14=56  16=64  20=80
24=96  28=112  32=128  36=144  40=160  44=176  48=192
```

### Default Component Spacing

| Context | Spacing | Source |
| --- | --- | --- |
| Card padding | `py-6 px-6` (24px) | card.tsx |
| Card gap | `gap-6` (24px) | card.tsx |
| Dialog padding | `p-6` (24px) | dialog.tsx |
| Dialog gap | `gap-4` (16px) | dialog.tsx |
| Table cell | `p-3` (12px) | table.tsx |
| Table head | `h-12 px-3` | table.tsx |
| Button gap | `gap-2` (8px) | button.tsx |
| Input padding | `px-3 py-1` | input.tsx |
| Badge padding | `px-2 py-0.5` | badge.tsx |

---

## Breakpoints

| Name | Width |
| --- | --- |
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

---

## Depth & Elevation (default)

| Level | Treatment | Use |
| --- | --- | --- |
| Flat (L0) | No shadow | Page background |
| Subtle (L1) | `shadow-xs` | Input fields |
| Card (L2) | `shadow-sm` + `border` | Cards, active tabs |
| Float (L3) | `shadow-md` | Dropdowns |
| Modal (L4) | `shadow-lg` | Dialogs, sheets |

---

## Semantic Token Mapping (Figma)

Which `base/*` variable to bind to which node property. The actual color VALUES come from the theme; this mapping is structural.

| UI Element | Fill Variable | Stroke Variable | Text Variable |
| --- | --- | --- | --- |
| Page background | `base/background` | — | — |
| Card surface | `base/card` | `base/border` | — |
| Dialog/popover bg | `base/popover` | `base/border` | — |
| Dialog ring | — | `custom/outline\10 dark:outline\20` | — |
| Primary button | `base/primary` | — | `base/primary-foreground` |
| Outline button | `custom/background dark:input\30` | `base/border` | `base/foreground` |
| Destructive button | `custom/destructive\20 dark:destructive\40` | — | `base/destructive` |
| Destructive badge | `custom/destructive\10 dark:destructive\20` | — | `base/destructive` |
| Input field | `custom/background dark:input\30` | `base/input` | `base/foreground` |
| Warning box | `custom/destructive\20 dark:destructive\40` | `custom/destructive\20 dark:destructive\40` | `base/destructive` |
| Muted surface | `base/muted` | `base/border` | — |
| Title text | — | — | `base/foreground` |
| Description text | — | — | `base/muted-foreground` |

---

## Styling Conventions

1. **Semantic colors over raw Tailwind** — `bg-primary` not `bg-blue-500`
2. **Variants first** — `<Button variant="outline">` not `<Button className="border ...">`
3. **className for layout only** — `max-w-md mx-auto mt-4`, not styling
4. **`gap-*` over `space-*`** — `flex flex-col gap-4`, not `space-y-4`
5. **`size-*` shorthand** — `size-10` when w=h
6. **No manual dark mode** — `bg-background` handles both modes via CSS variables
7. **`cn()` for conditionals** — never embed ternaries in className strings
8. **No manual z-index** — components handle their own stacking

---

## Build Rules (preset-agnostic)

1. **Alpha baked in:** Figma variables store final RGBA including alpha. Never use paint opacity.
2. **Text styles first:** Apply via `setTextStyleIdAsync()`. Never hardcode font properties.
3. **Icons: rescale, don't resize.** `icon.rescale(target/current)`. Never detach.
4. **Frame hierarchy = DOM:** Every wrapper div = a Figma frame with matching gap/padding.
5. **Both modes:** Always create light AND dark variants. Set mode on parent frame.
6. **Read source first:** Before any change, read the source (Figma node properties OR code classes). Never assume.
7. **When querying Arca text styles via MCP:** use `getLocalTextStylesAsync()` on the **library source file**, not the project file. The project file may have stale local copies with zeroed values.
