# shadcn to Figma Theming — Variables, Colors, and Styling Translation

> **Purpose:** Maps shadcn's CSS variable theming system to Figma's variable system. Use this when setting up a Figma file from a shadcn preset, updating themes, or translating between code tokens and canvas variables.

> **Source:** shadcn/ui official docs (ui.shadcn.com/docs/theming), shadcn presets (ui.shadcn.com/create), Tailwind CSS configuration.

> **IMPORTANT:** Token values change between presets and styles. This file documents the **theming system and structure** — not specific color values for one preset. Always read the installed `globals.css` for the active preset's actual token values. The variable names, architecture, and Figma mapping patterns are stable across all presets.

> **Figma mechanics:** This file maps **CSS semantics → Figma variables**. To implement bindings and modes correctly in the file, you still need **`knowledge/figma/plugin-api.md`** (`setBoundVariableForPaint`, collections, modes) and **`knowledge/figma/mcp-workflow.md`** (which MCP tools to call and when).

---

## 1. The shadcn Theming Model

shadcn uses **CSS custom properties** (variables) for all design tokens. Every component references these variables — never raw colors. The variables are defined in `:root` (light mode) and `.dark` (dark mode).

### CSS → Figma translation
```
CSS:   --primary: oklch(0.488 0.243 264.376);
Figma: Variable "primary" in "Semantic" collection, Light mode value
       → aliases to a Primitive color variable OR stores the OKLCH-equivalent RGB directly

CSS:   .dark { --primary: oklch(0.424 0.199 265.638); }
Figma: Same "primary" variable, Dark mode value
```

**Key insight:** One shadcn CSS variable = one Figma variable with two mode values (Light + Dark).

---

## 2. Semantic Variable Map

Every shadcn project has these semantic variables. They map 1:1 to Figma variables.

### Core tokens (used by all components)

| CSS Variable | Purpose | Used by |
|---|---|---|
| `--background` | App/page background | `body`, page containers |
| `--foreground` | Default text color | Body text, headings, primary labels |
| `--card` | Card surface | Card, popover backgrounds |
| `--card-foreground` | Card text | Text inside cards |
| `--popover` | Popover/dropdown surface | DropdownMenu, Popover, Dialog |
| `--popover-foreground` | Popover text | Text inside popups |
| `--primary` | Primary brand action | Button default, links, focus rings |
| `--primary-foreground` | Text on primary | Button text on primary bg |
| `--secondary` | Secondary surfaces | Button secondary, Badge secondary |
| `--secondary-foreground` | Text on secondary | Button text on secondary bg |
| `--muted` | Muted backgrounds | TabsList bg, column header bg, disabled surfaces |
| `--muted-foreground` | De-emphasized text | Labels, metadata, placeholders, captions |
| `--accent` | Hover/active surfaces | Nav item active bg, hover states |
| `--accent-foreground` | Text on accent | Active nav text, hover text |
| `--destructive` | Danger/error states | Destructive button, error text, alert border |
| `--destructive-foreground` | Text on destructive | Destructive button text |
| `--border` | Default borders | Card borders, table row borders, separators |
| `--input` | Input borders | Input field borders, select trigger borders |
| `--ring` | Focus ring color | Focus-visible ring on interactive elements |

### Chart tokens (used by Chart components)

| CSS Variable | Purpose |
|---|---|
| `--chart-1` through `--chart-5` | Data visualization color ramp, 5 steps |

### Sidebar tokens (used by Sidebar component)

| CSS Variable | Purpose |
|---|---|
| `--sidebar` | Sidebar background |
| `--sidebar-foreground` | Sidebar text |
| `--sidebar-primary` | Active nav highlight, sidebar CTA |
| `--sidebar-primary-foreground` | Text on sidebar primary |
| `--sidebar-accent` | Nav item hover/active bg |
| `--sidebar-accent-foreground` | Nav item active text |
| `--sidebar-border` | Sidebar border |
| `--sidebar-ring` | Sidebar focus ring |

---

## 3. Figma Variable Architecture

### Collection structure

```
Collection: "Primitives" (1 mode: Value)
  neutral/white: rgb(255,255,255)
  neutral/50: rgb(250,250,250)
  neutral/100: rgb(245,245,245)
  neutral/200: rgb(229,229,229)
  ...through neutral/950...
  blue-violet/500: rgb(41,77,255)   ← chromatic accent (preset-dependent)
  red/600: rgb(231,0,11)            ← destructive
  chart-blue/100-500: blue ramp     ← chart colors

Collection: "Semantic" (2 modes: Light, Dark)
  background    → aliases to Primitives (different per mode)
  foreground    → aliases to Primitives
  card          → aliases to Primitives
  primary       → aliases to Primitives (or chromatic primitive for colored themes)
  ...all 20+ semantic tokens...

  Each variable has:
    Light mode: alias → primitive light value
    Dark mode: alias → primitive dark value
```

### Creating from a shadcn preset

When given a shadcn preset (`--preset b1ZOMFgwd`):

1. **Scaffold the project** to get `globals.css` with all CSS variables
2. **Read `:root`** block → these are Light mode values
3. **Read `.dark`** block → these are Dark mode values
4. **Create Primitive variables** from the raw OKLCH values (convert to RGB for Figma)
5. **Create Semantic variables** that alias to Primitives, with Light and Dark modes
6. **Update system.md** with the preset's tokens

### OKLCH to RGB conversion

Figma uses RGB internally. shadcn uses OKLCH. The conversion happens when setting variable values:

```js
// OKLCH oklch(0.488 0.243 264.376) ≈ RGB
// Use a converter or approximate:
// The placeholder RGB in setBoundVariableForPaint should match the light mode resolved color
```

For exact conversion, use the CSS value as the source of truth and match visually in Figma. The variable binding overrides the placeholder at render time.

---

## 4. Radius System

shadcn uses a single `--radius` base value, then derives all other radii:

```css
--radius: 0.625rem;  /* 10px — the base */

/* Derived in @theme inline: */
--radius-sm:  calc(var(--radius) * 0.6);   /* 6px */
--radius-md:  calc(var(--radius) * 0.8);   /* 8px */
--radius-lg:  var(--radius);                /* 10px */
--radius-xl:  calc(var(--radius) * 1.4);   /* 14px */
--radius-2xl: calc(var(--radius) * 1.8);   /* 18px */
--radius-3xl: calc(var(--radius) * 2.2);   /* 22px */
--radius-4xl: calc(var(--radius) * 2.6);   /* 26px */
```

### Figma mapping

| CSS | Figma Variable | Pixel Value | Used by |
|---|---|---|---|
| `rounded-sm` | `radius/sm` | ~6px | TabsTrigger, Checkbox, DropdownMenuItem |
| `rounded-md` | `radius/md` | ~8px | Button, Input, Select, Badge rounded |
| `rounded-lg` | `radius/lg` | 10px | Card, Dialog, Alert, Table card |
| `rounded-xl` | `radius/xl` | ~14px | Larger containers |
| `rounded-full` | `radius/full` | 9999px | Avatar, Switch, Badge pill |

In Figma, create FLOAT variables for each and use `setBoundVariable` — never hardcode `cornerRadius`.

---

## 5. Spacing (Tailwind Scale)

shadcn uses Tailwind's default spacing scale. There are no custom spacing variables — the scale is:

```
p-0    = 0px       gap-0    = 0px
p-0.5  = 2px       gap-0.5  = 2px
p-1    = 4px       gap-1    = 4px
p-1.5  = 6px       gap-1.5  = 6px
p-2    = 8px       gap-2    = 8px
p-3    = 12px      gap-3    = 12px
p-4    = 16px      gap-4    = 16px
p-5    = 20px      gap-5    = 20px
p-6    = 24px      gap-6    = 24px
p-8    = 32px      gap-8    = 32px
p-10   = 40px
p-12   = 48px
p-16   = 64px
```

### Figma mapping

Use these values directly as `paddingTop`, `itemSpacing`, etc. They don't need Figma variables — they're layout constants from the spacing scale. System.md should list the valid scale so hooks can validate.

**Common shadcn spacing patterns:**
- Card padding: `p-6` = 24px
- Table cell: `p-4` = 16px
- Table header: `px-4 py-3` = 16px horizontal, 12px vertical
- Button gap: `gap-2` = 8px
- Tabs container: `p-1` = 4px
- Dialog content: `p-6 gap-4` = 24px padding, 16px gap
- Dropdown item: `px-2 py-1.5` = 8px horizontal, 6px vertical

---

## 6. Typography

### Font families

shadcn presets define fonts in `components.json` and the layout file:

| Preset setting | CSS variable | Common values |
|---|---|---|
| Heading font | `--font-heading` | Geist, Inter, system-ui |
| Body font | `--font-sans` | Geist, Inter, system-ui |
| Mono font | `--font-mono` | Geist Mono, JetBrains Mono |

### Figma font mapping

| shadcn/CSS | Figma font | Note |
|---|---|---|
| Geist | Geist | Available in Figma. Style names: Regular, Medium, SemiBold, Bold (no spaces!) |
| Geist Mono | Geist Mono | Available in Figma. Same no-space style names. |
| Inter | Inter | Figma default. Style names: Regular, Medium, Semi Bold, Bold (WITH spaces!) |

**Critical:** Geist uses `SemiBold` (no space). Inter uses `Semi Bold` (with space). Wrong style name = silent font loading failure.

### Type scale

shadcn uses Tailwind's default type scale:

| Class | Size | Line Height | Figma |
|---|---|---|---|
| `text-xs` | 12px | 16px | fontSize: 12, lineHeight: {unit: 'PIXELS', value: 16} |
| `text-sm` | 14px | 20px | fontSize: 14, lineHeight: {unit: 'PIXELS', value: 20} |
| `text-base` | 16px | 24px | fontSize: 16, lineHeight: {unit: 'PIXELS', value: 24} |
| `text-lg` | 18px | 28px | fontSize: 18, lineHeight: {unit: 'PIXELS', value: 28} |
| `text-xl` | 20px | 28px | fontSize: 20, lineHeight: {unit: 'PIXELS', value: 28} |
| `text-2xl` | 24px | 32px | fontSize: 24, lineHeight: {unit: 'PIXELS', value: 32} |
| `text-3xl` | 30px | 36px | fontSize: 30, lineHeight: {unit: 'PIXELS', value: 36} |
| `text-4xl` | 36px | 40px | fontSize: 36, lineHeight: {unit: 'PIXELS', value: 40} |

### Font weight classes

| Class | Weight | Geist style | Inter style |
|---|---|---|---|
| `font-normal` | 400 | Regular | Regular |
| `font-medium` | 500 | Medium | Medium |
| `font-semibold` | 600 | SemiBold | Semi Bold |
| `font-bold` | 700 | Bold | Bold |
| `font-extrabold` | 800 | ExtraBold | Extra Bold |

---

## 7. Shadows

shadcn uses Tailwind's shadow scale. These are set as Figma effects, not variables (shadow colors can't be variable-bound in most cases).

```
shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow:     0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
```

### Component shadow usage

| Component | Shadow | Note |
|---|---|---|
| Button (default, outline, destructive) | shadow-sm | Subtle press depth |
| Card | shadow-sm | Light elevation |
| Dialog | shadow-lg | Floating above overlay |
| Dropdown | shadow-md | Floating menu |
| Tooltip | none (bg-primary is the visual) | No shadow needed |
| Tabs active trigger | shadow-sm | Subtle active state |

---

## 8. Dark Mode in Figma

### How shadcn does dark mode
CSS: `.dark` class on `<html>` switches all variables to dark values. Components don't change — only variable values change.

### How to replicate in Figma
1. Semantic variable collection has Light + Dark modes
2. Each variable has two values: light alias → primitive, dark alias → primitive
3. Set `frame.setExplicitVariableModeForCollection(semanticCol, darkModeId)` on the outermost frame
4. All children inherit dark mode — every variable-bound property resolves to dark values

### What changes between modes

| Token | Light | Dark | Pattern |
|---|---|---|---|
| background | white | near-black (oklch 0.145) | Inverted |
| foreground | near-black | near-white (oklch 0.985) | Inverted |
| card | white | slightly lighter than bg (oklch 0.205) | Elevation via lightness |
| border | light gray (oklch 0.922) | translucent white (oklch 1 0 0 / 10%) | Translucent in dark |
| input | light gray | translucent white (15%) | Translucent in dark |
| muted | light gray (oklch 0.97) | dark gray (oklch 0.269) | Shifted, not inverted |
| primary | varies by preset | varies by preset | May shift hue/lightness |
| destructive | strong red | lighter red | Lighter for contrast on dark |

### Dark mode gotchas in Figma
- **Shadows are invisible on dark.** Use borders for structure instead.
- **Translucent borders** (`oklch(1 0 0 / 10%)`) need Figma opacity on the paint, not the stroke.
- **Library icon colors** may not respond to local dark mode — rebind strokes to local `foreground` variable.
- **clipsContent** is safe with inside strokes in dark mode. Only drop shadows get clipped.

---

## 9. Preset System

shadcn presets encode: style, base color, theme color, chart color, heading font, body font, icon library, radius, and more into a single string.

### The Create page (ui.shadcn.com/create)

This is where presets are configured visually. The URL format is:
```
ui.shadcn.com/create?preset=<CODE>
```

The page shows:
- **Style** selector (preset names from the shadcn registry, e.g. Default, New York, etc.)
- **Base Color** (Neutral, Slate, Gray, etc.)
- **Theme** color (Blue, Green, Red, etc.)
- **Chart Color**
- **Heading Font** + **Body Font** (Geist, Inter, etc.)
- **Icon Library** (Lucide)
- **Preset code** (the string used with `--preset`)
- **Shuffle** button to randomize
- **Create Project** button to scaffold

When a user gives you a preset URL or code, use it to scaffold a project and read the generated `globals.css` for the exact token values.

### Applying a preset to Figma
```bash
pnpm dlx shadcn@latest init --preset <CODE> --template next
```

1. Scaffold project to get `globals.css`
2. Read the `:root` and `.dark` blocks for all token values
3. Update Figma's Primitive variables with the preset's raw color values
4. Update Semantic variable aliases to point to new Primitives
5. Update system.md with the new Direction, colors, and font
6. Rebuild any components that depend on `--primary` (button bg changes)

### Available base colors
```
neutral, gray, slate, stone, zinc, mauve, olive, mist, taupe
```

### Available styles
```
preset identifiers from the registry (e.g. `radix-default`, vendor-specific ids) — always read the URL/code the user gave
```

---

## 10. Figma Variable Binding Quick Reference

| What to bind | Method | Example |
|---|---|---|
| Fill color | `setBoundVariableForPaint` on paint object | `bp(vars['card'], placeholder)` |
| Stroke color | `setBoundVariableForPaint` on paint object | Same as fill |
| Corner radius | `setBoundVariable('topLeftRadius', var)` | Per-corner binding |
| Padding | Direct value from spacing scale | `paddingTop = 16` (not variable-bound) |
| Item spacing | Direct value from spacing scale | `itemSpacing = 8` |
| Width/Height | `setBoundVariable('width', var)` | Only if a variable exists |
| Effect color | `setBoundVariableForEffect` | For shadow/blur radius |
| Visibility | `setBoundVariable('visible', boolVar)` | Boolean variable binding |

---

## Sources

### Primary
- **shadcn/ui theming:** ui.shadcn.com/docs/theming — CSS variable definitions, color system
- **shadcn/ui installation:** ui.shadcn.com/docs/installation — globals.css setup, @theme inline
- **Context7:** `/websites/ui_shadcn` — query for any component's exact CSS classes
- **Tailwind CSS:** tailwindcss.com/docs — spacing scale, type scale, color utilities

### Secondary
- **shadcn presets:** ui.shadcn.com/themes — generate and test theme presets
- **OKLCH color space:** oklch.com — color picker and converter for OKLCH values
- **Figma variables docs:** developers.figma.com/docs/plugins/working-with-variables

### How to update this file
1. When a new preset is applied: scaffold, read globals.css, update the token tables
2. When shadcn updates: query Context7 for new component classes, update component reference
3. When Figma adds new variable features: update the binding quick reference

---

## Retrieval Queries

- shadcn CSS variables to Figma variables mapping
- shadcn theming dark mode light mode token system
- OKLCH color conversion Figma RGB
- shadcn radius scale sm md lg xl full
- Tailwind spacing scale px to pixels
- shadcn font families Geist Inter font weight mapping
- shadcn shadow scale components usage
- Figma dark mode variable collection modes
- shadcn preset to Figma variable setup workflow
- CSS custom properties to Figma semantic variables
