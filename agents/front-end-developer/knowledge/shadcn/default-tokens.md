# shadcn/ui Default Design Token Reference

> Generated from the official shadcn/ui registry, Tailwind CSS defaults, and component source files.
> No external kit required — everything here is sourced from the public shadcn/ui repo and docs.
> Source: ui.shadcn.com/docs/theming, github.com/shadcn-ui/ui, ui.shadcn.com/r/

---

## 1. Semantic Color Tokens

All values in OKLCH (as defined in globals.css) with computed hex equivalents.

### Light Mode

| Token | OKLCH | Hex | Role |
|-------|-------|-----|------|
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

### Dark Mode

| Token | OKLCH | Hex | Key difference |
|-------|-------|-----|----------------|
| `--background` | `oklch(0.145 0 0)` | `#0a0a0a` | Near-black, not pure black |
| `--foreground` | `oklch(0.985 0 0)` | `#fafafa` | Near-white |
| `--card` | `oklch(0.205 0 0)` | `#171717` | Slightly lighter than bg |
| `--card-foreground` | `oklch(0.985 0 0)` | `#fafafa` | |
| `--popover` | `oklch(0.205 0 0)` | `#171717` | Same as card |
| `--popover-foreground` | `oklch(0.985 0 0)` | `#fafafa` | |
| `--primary` | `oklch(0.922 0 0)` | `#e5e5e5` | Inverted — light on dark |
| `--primary-foreground` | `oklch(0.205 0 0)` | `#171717` | |
| `--secondary` | `oklch(0.269 0 0)` | `#262626` | Dark gray |
| `--secondary-foreground` | `oklch(0.985 0 0)` | `#fafafa` | |
| `--muted` | `oklch(0.269 0 0)` | `#262626` | Same as secondary |
| `--muted-foreground` | `oklch(0.708 0 0)` | `#a1a1a1` | Mid gray |
| `--accent` | `oklch(0.269 0 0)` | `#262626` | Same as muted |
| `--accent-foreground` | `oklch(0.985 0 0)` | `#fafafa` | |
| `--destructive` | `oklch(0.704 0.191 22.216)` | `#ff6467` | Lighter red for dark bg |
| `--border` | `oklch(1 0 0 / 10%)` | `white @ 10%` | Translucent — blends with surface |
| `--input` | `oklch(1 0 0 / 15%)` | `white @ 15%` | Slightly more visible |
| `--ring` | `oklch(0.556 0 0)` | `#737373` | |

### Chart Colors

| Token | Light OKLCH | Light Hex | Dark OKLCH | Dark Hex |
|-------|-------------|-----------|------------|----------|
| `--chart-1` | `oklch(0.646 0.222 41.116)` | `#f54900` | `oklch(0.488 0.243 264.376)` | `#1447e6` |
| `--chart-2` | `oklch(0.6 0.118 184.704)` | `#009689` | `oklch(0.696 0.17 162.48)` | `#00bc7d` |
| `--chart-3` | `oklch(0.398 0.07 227.392)` | `#104e64` | `oklch(0.769 0.188 70.08)` | `#fe9a00` |
| `--chart-4` | `oklch(0.828 0.189 84.429)` | `#ffb900` | `oklch(0.627 0.265 303.9)` | `#ad46ff` |
| `--chart-5` | `oklch(0.769 0.188 70.08)` | `#fe9a00` | `oklch(0.645 0.246 16.439)` | `#ff2056` |

### Sidebar Colors

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar` | `#fafafa` | `#171717` |
| `--sidebar-foreground` | `#0a0a0a` | `#fafafa` |
| `--sidebar-primary` | `#171717` | `#1447e6` |
| `--sidebar-primary-foreground` | `#fafafa` | `#fafafa` |
| `--sidebar-accent` | `#f5f5f5` | `#262626` |
| `--sidebar-accent-foreground` | `#171717` | `#fafafa` |
| `--sidebar-border` | `#e5e5e5` | `white @ 10%` |
| `--sidebar-ring` | `#a1a1a1` | `#737373` |

---

## 2. Tailwind Neutral Scale (base palette)

The default shadcn theme maps to Tailwind's `neutral` scale:

| Tailwind | Hex | Used as |
|----------|-----|---------|
| `neutral-50` | `#fafafa` | sidebar, primary-foreground (light) |
| `neutral-100` | `#f5f5f5` | secondary, muted, accent (light) |
| `neutral-200` | `#e5e5e5` | border, input (light) |
| `neutral-300` | `#d4d4d4` | — |
| `neutral-400` | `#a3a3a3` | ring (light) |
| `neutral-500` | `#737373` | muted-foreground (light), ring (dark) |
| `neutral-600` | `#525252` | — |
| `neutral-700` | `#404040` | — |
| `neutral-800` | `#262626` | secondary, muted, accent (dark) |
| `neutral-900` | `#171717` | primary (light), card/popover (dark) |
| `neutral-950` | `#0a0a0a` | foreground (light), background (dark) |

---

## 3. Radius Scale

Base: `--radius: 0.625rem` (10px)

| Token | Formula | Value | Used by |
|-------|---------|-------|---------|
| `rounded-sm` | `× 0.6` | 6px | Checkbox, DropdownMenuItem |
| `rounded-md` | `× 0.8` | 8px | Default Button, Input, Select, TabsTrigger |
| `rounded-lg` | `× 1.0` | 10px | — |
| `rounded-xl` | `× 1.4` | 14px | Card (default) |
| `rounded-2xl` | `× 1.8` | 18px | — |
| `rounded-3xl` | `× 2.2` | 22px | — |
| `rounded-4xl` | `× 2.6` | 26px | — (used by pill-style presets) |
| `rounded-full` | — | 9999px | Avatar, Badge (default), Switch |

---

## 4. Typography

### Font Families
- `--font-sans`: System sans-serif (or Geist if installed)
- `--font-mono`: System monospace (or Geist Mono if installed)

### Type Scale (Tailwind defaults)

| Class | Font Size | Line Height |
|-------|-----------|-------------|
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

### Font Weights

| Class | Weight | Common use |
|-------|--------|------------|
| `font-normal` | 400 | Body text, descriptions |
| `font-medium` | 500 | Labels, badges, buttons |
| `font-semibold` | 600 | Card titles, section headings |
| `font-bold` | 700 | KPI values, page headings |

---

## 5. Shadow Scale

| Token | Value | Use |
|-------|-------|-----|
| `shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Input fields |
| `shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)` | Cards (default), active tabs |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)` | Dropdowns |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)` | Dialogs |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10)` | Sheets |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Modals |

---

## 6. Component Variants — Exact Classes from Registry

> Source: `ui.shadcn.com/r/styles/new-york-v4/{component}.json`
> These are the DEFAULT shadcn classes. Custom presets may override specific values.

### Button

**Base:** `inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`

| Variant | Classes |
|---------|---------|
| **default** | `bg-primary text-primary-foreground hover:bg-primary/90` |
| **destructive** | `bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40` |
| **outline** | `border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50` |
| **secondary** | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| **ghost** | `hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50` |
| **link** | `text-primary underline-offset-4 hover:underline` |

| Size | Classes |
|------|---------|
| **xs** | `h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3` |
| **sm** | `h-8 gap-1.5 rounded-md px-3` |
| **default** | `h-9 px-4 py-2` |
| **lg** | `h-10 rounded-md px-6` |
| **icon** | `size-9` |
| **icon-xs** | `size-6 rounded-md [&_svg:not([class*='size-'])]:size-3` |
| **icon-sm** | `size-8` |
| **icon-lg** | `size-10` |

### Opacity Modifiers Used in Button

| Class | Context | What it does |
|-------|---------|--------------|
| `bg-primary/90` | default hover | Primary at 90% opacity |
| `bg-destructive/90` | destructive hover (light) | Destructive at 90% |
| `bg-destructive/60` | destructive base (dark) | Destructive at 60% in dark |
| `ring-destructive/20` | destructive focus (light) | Focus ring at 20% |
| `ring-destructive/40` | destructive focus (dark) | Focus ring at 40% in dark |
| `bg-input/30` | outline base (dark) | Input at 30% — translucent fill |
| `bg-input/50` | outline hover (dark) | Input at 50% on hover |
| `bg-secondary/80` | secondary hover | Secondary at 80% |
| `bg-accent/50` | ghost hover (dark) | Accent at 50% in dark |
| `ring-ring/50` | all focus-visible | Focus ring at 50% |

### Badge

**Base:** `inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium [&>svg]:pointer-events-none [&>svg]:size-3`

| Variant | Classes |
|---------|---------|
| **default** | `bg-primary text-primary-foreground` |
| **secondary** | `bg-secondary text-secondary-foreground` |
| **destructive** | `bg-destructive text-white dark:bg-destructive/60` |
| **outline** | `border-border text-foreground` |
| **ghost** | (no bg, hover only) |
| **link** | `text-primary underline-offset-4` |

### Card

| Element | Classes |
|---------|---------|
| **Card** | `flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm` |
| **CardHeader** | `grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6` |
| **CardTitle** | `leading-none font-semibold` |
| **CardDescription** | `text-sm text-muted-foreground` |
| **CardContent** | `px-6` |
| **CardFooter** | `flex items-center px-6` |

### Dialog

| Element | Classes |
|---------|---------|
| **DialogOverlay** | `fixed inset-0 z-50 bg-black/50` |
| **DialogContent** | `fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg bg-background p-6 shadow-lg sm:max-w-lg` |
| **DialogHeader** | `flex flex-col gap-2` |
| **DialogTitle** | `text-lg leading-none font-semibold` |
| **DialogDescription** | `text-sm text-muted-foreground` |
| **DialogFooter** | `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end` |
| **Close button** | Ghost icon-sm with XIcon, absolute top-4 right-4 |

### Input

`h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs md:text-sm placeholder:text-muted-foreground disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30`

### Select Trigger

`flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs data-[size=default]:h-9 data-[size=sm]:h-8 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`

### Table

| Element | Classes |
|---------|---------|
| **Table** | `w-full caption-bottom text-sm` |
| **TableHeader** | `[&_tr]:border-b` |
| **TableHead** | `h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground` |
| **TableBody** | `[&_tr:last-child]:border-0` |
| **TableRow** | `border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted` |
| **TableCell** | `p-3 align-middle whitespace-nowrap` |
| **TableFooter** | `border-t bg-muted/50 font-medium` |

### Label

`flex items-center gap-2 text-sm leading-none font-medium select-none`

### Separator

`shrink-0 bg-border` (horizontal: `h-px w-full`, vertical: `h-full w-px`)

---

## 7. Spacing Scale (Tailwind default, 4px base)

```
0=0  px=1  0.5=2  1=4  1.5=6  2=8  2.5=10  3=12  3.5=14  4=16  5=20
6=24  7=28  8=32  9=36  10=40  11=44  12=48  14=56  16=64  20=80
24=96  28=112  32=128  36=144  40=160  44=176  48=192  52=208
56=224  60=240  64=256  72=288  80=320  96=384
```

---

## 8. Common Component Spacing

| Context | Spacing | Source |
|---------|---------|--------|
| Card padding | `py-6 px-6` (24px) | card.tsx |
| Card gap | `gap-6` (24px) | card.tsx |
| Card header gap | `gap-2` (8px) | card.tsx |
| Dialog padding | `p-6` (24px) | dialog.tsx |
| Dialog gap | `gap-4` (16px) | dialog.tsx |
| Table cell | `p-3` (12px) | table.tsx |
| Table head | `h-12 px-3` | table.tsx |
| Button gap | `gap-2` (8px) | button.tsx |
| Input padding | `px-3 py-1` | input.tsx |
| Badge padding | `px-2 py-0.5` | badge.tsx |
| Label gap | `gap-2` (8px) | label.tsx |

---

## 9. Opacity Modifier Patterns (from component source)

These are the Tailwind opacity modifiers used across all default shadcn components. This is the data the Arca Figma kit materializes as Mode variables.

### Destructive opacity pattern

| Class | Context | Light | Dark |
|-------|---------|-------|------|
| `bg-destructive` | badge/button base | 100% | — |
| `bg-destructive/60` | badge/button dark base | — | 60% |
| `bg-destructive/90` | button hover | 90% | — |
| `ring-destructive/20` | focus ring | 20% | — |
| `ring-destructive/40` | focus ring dark | — | 40% |

### Input/border opacity pattern

| Class | Context | Effect |
|-------|---------|--------|
| `bg-input/30` | outline button bg (dark), input bg (dark) | 30% of input token |
| `bg-input/50` | outline button hover (dark) | 50% of input token |

### Other opacity modifiers

| Class | Context | Effect |
|-------|---------|--------|
| `bg-primary/90` | primary button hover | 90% |
| `bg-secondary/80` | secondary button hover | 80% |
| `bg-accent/50` | ghost hover (dark) | 50% |
| `bg-muted/50` | table row hover, footer | 50% |
| `bg-black/50` | dialog overlay | 50% black |
| `ring-ring/50` | all focus-visible | 50% of ring |

### What these mean for Figma / design tools

In CSS, `bg-destructive/60` means "take the computed --destructive value and apply it at 60% opacity." In Figma, this must be a separate variable with the alpha baked into the RGBA value. The Arca kit creates these as Mode variables with different opacities per light/dark mode. **Applying** those variables to nodes is Plugin API work — see `knowledge/figma/plugin-api.md` (`setBoundVariableForPaint`, modes).

**Pattern:** Dark mode generally uses higher opacity than light mode for tinted elements, because the base color is lighter against a dark background. The ratio varies by component:
- Destructive: 100% light / 60% dark (badge/button base)
- Focus rings: 20% light / 40% dark
- Input fills: 0% light / 30% dark (outline variant only applies in dark)

---

## 10. Breakpoints

| Name | Width |
|------|-------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

---

## 11. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (L0) | No shadow | Page background |
| Subtle (L1) | `shadow-xs` | Input fields |
| Card (L2) | `shadow-sm` + `border` | Cards, active tabs |
| Float (L3) | `shadow-md` | Dropdowns |
| Modal (L4) | `shadow-lg` | Dialogs, sheets |

**Dark mode:** Shadows are invisible on dark backgrounds. Structure comes from translucent borders (`oklch(1 0 0 / 10%)`) and surface lightness differences (card `oklch(0.205)` vs background `oklch(0.145)`).

---

## 12. Styling Conventions

> Source: github.com/shadcn-ui/ui/blob/main/skills/shadcn/rules/styling.md

1. **Semantic colors over raw Tailwind** — `bg-primary` not `bg-blue-500`
2. **Variants first** — `<Button variant="outline">` not `<Button className="border ...">`
3. **className for layout only** — `max-w-md mx-auto mt-4`, not styling
4. **`gap-*` over `space-*`** — `flex flex-col gap-4`, not `space-y-4`
5. **`size-*` shorthand** — `size-10` when w=h, not `w-10 h-10`
6. **No manual dark mode** — `bg-background` handles both modes via CSS variables
7. **`cn()` for conditionals** — never embed ternaries in className strings
8. **No manual z-index** — components handle their own stacking

---

## Sources

- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming) — CSS variable definitions
- [shadcn/ui Registry](https://ui.shadcn.com/r/) — component source files (JSON API)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components) — component sources and conventions
- [Tailwind CSS Colors](https://tailwindcss.com/docs/colors) — neutral palette
- [Tailwind CSS Spacing](https://tailwindcss.com/docs/spacing) — spacing scale
