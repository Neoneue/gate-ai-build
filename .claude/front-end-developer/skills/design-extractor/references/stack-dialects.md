# Stack Dialects — 1:1 Vocabulary Rules

> **Hard rule:** the extracted `design.md` must use the source stack's native vocabulary, verbatim. A Tailwind source produces Tailwind-keyed YAML; a Material source produces Material-keyed YAML; a Chakra source produces Chakra-keyed YAML. **Never translate.** If the source calls it `card`, don't emit `surface-elevated`. If the source uses `spacing.4`, don't emit `spacing.lg`. If the source exposes `palette.primary.main`, don't flatten it.
>
> The YAML structure (Google's `colors` / `typography` / `rounded` / `spacing` / `components`) stays constant. Only the **keys inside each block** reflect the stack.

---

## Stack detection

Detection runs as workflow step 1.5, after input-mode detection, before authoring. Outputs one `stackId`.

### Detection signals by mode

| Mode | Signal | Resolution |
|---|---|---|
| **Figma** | `get_libraries` response — kit names | `shadcn_ui kit*` → `tailwind-shadcn`; `Material 3 Design Kit*` → `material-v3`; `Material Design Kit*` (no "3") → `material-v2`; `iOS and iPadOS*` → `apple-hig`; `macOS*` / `watchOS*` / `visionOS*` → `apple-hig`; `NativeBase*` → `nativebase`; `Untitled UI*` → `untitled-ui`; `Figma Simple Design System` → `sds`; kits with `(Tailwind)` or `(Tailwind CSS)` in the name → `tailwind-plain`; otherwise check the file's variable names |
| **Figma (variable inspection)** | `get_variable_defs` variable names | Variables matching `base/*` + `tailwind colors/*` (shadcn semantic layer) → `tailwind-shadcn`. Variables matching `md.*` / `md.sys.*` → `material-v3`. Generic `color/*` / `space/*` → `css-vars-custom`. No variables at all → `unknown` |
| **Browser / URL** | `package.json` dependencies | `tailwindcss` + `@shadcn/ui` OR `components/ui/*` folder → `tailwind-shadcn`. `tailwindcss` alone → `tailwind-plain`. `@mui/material` → `mui`. `@chakra-ui/*` → `chakra`. `@mantine/*` → `mantine`. `antd` → `antd`. `@material/web` or `@material/*` → `material-v3`. `styled-components` + theme file → `styled-components`. `@emotion/*` → `emotion`. Only CSS files with `--*` custom properties → `css-vars-custom` |
| **Browser** | `:root` CSS vars observed via `evaluate_script` | `--background` + `--foreground` + `--primary` + `--muted` (shadcn signature) → `tailwind-shadcn`. `--md-sys-color-*` → `material-v3`. `--chakra-*` → `chakra`. Product-specific prefix (`--app-*`, `--brand-*`) → `css-vars-custom` |
| **Screenshot** | Visual fingerprints | See `framework-fingerprints.md`. Fallback: `unknown` — ask user |

### Stack list (canonical IDs)

`tailwind-shadcn` · `tailwind-plain` · `material-v3` · `material-v2` · `mui` · `chakra` · `mantine` · `antd` · `apple-hig` · `nativebase` · `untitled-ui` · `sds` · `styled-components` · `emotion` · `css-vars-custom` · `unknown`

---

## `tailwind-shadcn` — Tailwind + shadcn/ui semantic layer

The stack Arca Wallet uses. Semantic tokens on top of Tailwind's palette + spacing + radius scales.

### colors

Emit the full shadcn semantic set in light-mode values (dark-mode in a second design.md or a prose table):

```yaml
colors:
  background: "#HEX"
  foreground: "#HEX"
  card: "#HEX"
  card-foreground: "#HEX"
  popover: "#HEX"
  popover-foreground: "#HEX"
  primary: "#HEX"
  primary-foreground: "#HEX"
  secondary: "#HEX"
  secondary-foreground: "#HEX"
  muted: "#HEX"
  muted-foreground: "#HEX"
  accent: "#HEX"
  accent-foreground: "#HEX"
  destructive: "#HEX"
  destructive-foreground: "#HEX"
  border: "#HEX"
  input: "#HEX"
  ring: "#HEX"
  # Sidebar (if the app has persistent sidebar nav)
  sidebar: "#HEX"
  sidebar-foreground: "#HEX"
  sidebar-primary: "#HEX"
  sidebar-primary-foreground: "#HEX"
  sidebar-accent: "#HEX"
  sidebar-accent-foreground: "#HEX"
  sidebar-border: "#HEX"
  sidebar-ring: "#HEX"
  # Chart scale (if data viz is present)
  chart-1: "#HEX"
  chart-2: "#HEX"
  chart-3: "#HEX"
  chart-4: "#HEX"
  chart-5: "#HEX"
  # Tailwind palette extensions observed in the source
  # Use the EXACT Tailwind-palette names the kit exposes — e.g. `blue-ribbon-500`,
  # `gold-600`, `ruby-400`, `green-600`, `neutral-200`. Don't flatten to generic
  # `info-500` or `warning`.
```

### typography

Tailwind's type scale keys. Each size is one entry. If the source ships multiple weight variants per size (Arca's `text-sm/leading-normal/medium` pattern), pick the default weight for the size entry and document weight variants in prose.

```yaml
typography:
  text-xs:    { fontFamily: ..., fontSize: 12px, fontWeight: 400, lineHeight: 16px, letterSpacing: -0.01em }
  text-sm:    { fontFamily: ..., fontSize: 14px, fontWeight: 500, lineHeight: 20px, letterSpacing: -0.02em }
  text-base:  { fontFamily: ..., fontSize: 16px, fontWeight: 500, lineHeight: 24px, letterSpacing: -0.02em }
  text-lg:    { fontFamily: ..., fontSize: 18px, fontWeight: 500, lineHeight: 28px, letterSpacing: -0.03em }
  text-xl:    { fontFamily: ..., fontSize: 20px, fontWeight: 500, lineHeight: 28px, letterSpacing: -0.03em }
  text-2xl:   { fontFamily: ..., fontSize: 24px, fontWeight: 600, lineHeight: 32px }
  text-3xl:   { fontFamily: ..., fontSize: 30px, fontWeight: 600, lineHeight: 36px }
  text-4xl:   { fontFamily: ..., fontSize: 36px, fontWeight: 600, lineHeight: 40px }
  text-5xl:   { fontFamily: ..., fontSize: 48px, fontWeight: 600, lineHeight: 1, letterSpacing: -0.02em }
  # ... continue through text-9xl only if the source uses them
```

### spacing

Tailwind numeric keys, quoted for YAML safety. Emit only the steps the source actually uses (don't pad with the whole scale).

```yaml
spacing:
  "1": 4px
  "1.5": 6px
  "2": 8px
  "2.5": 10px
  "3": 12px
  "3.5": 14px
  "4": 16px
  "5": 20px
  "6": 24px
  "8": 32px
  "10": 40px
  "12": 48px
```

### rounded

Tailwind t-shirt keys. Values come from the source's `--radius` derivation (shadcn convention: `sm = calc(--radius - 4)`, `md = calc(--radius - 2)`, `lg = var(--radius)`, `xl = calc(--radius + 4)`).

```yaml
rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 12px
  2xl: 16px
  3xl: 22px
  full: 9999px
```

### components

shadcn component names + variant suffixes:

```yaml
components:
  button-default:       # the filled primary variant
  button-destructive:
  button-outline:
  button-secondary:
  button-ghost:
  button-link:
  # Sizes: default, sm, lg, icon — suffix as -lg / -sm / -icon where deviating
  button-default-lg:
  button-outline-sm:

  input:
  label:
  card:
  dialog:
  popover:
  sheet:
  drawer:
  alert:
  alert-destructive:
  badge:
  badge-secondary:
  badge-outline:
  badge-destructive:
  toast:
  tabs-trigger-active:
  tabs-trigger-inactive:
  separator:
  skeleton:
```

### Prose references

Use Tailwind class names directly: `<Button>` wraps `bg-primary text-primary-foreground rounded-md h-9 px-4 py-2`. Reference utility classes, not abstract tokens, when describing components. Devs reading the doc should be able to paste class strings directly.

### Export

`npx @google/design.md export --format tailwind <file> > tailwind.theme.json` — drops into `tailwind.config.js` or Tailwind v4's `@theme` block.

---

## `tailwind-plain` — Tailwind without shadcn

Tailwind on its own, no semantic layer. The product uses raw palette utilities (`bg-blue-500`, `text-gray-700`) directly.

### colors

Tailwind palette names — full scale when the source uses the scale, or just the specific steps used:

```yaml
colors:
  slate-50: "#HEX"
  slate-500: "#HEX"
  slate-900: "#HEX"
  blue-500: "#HEX"
  red-500: "#HEX"
  # If the product names a brand accent, use it:
  brand: "#HEX"
```

Typography, spacing, rounded, components — same as `tailwind-shadcn` (Tailwind-native). Components won't have shadcn names; use generic role names or the product's own component library names.

### Export

Same as `tailwind-shadcn` — `--format tailwind`.

---

## `material-v3` — Material Design 3

Google Material 3 — the Arca of the Material world. Used by Google apps, Material-based design kits, the Material 3 Design Kit in Figma.

### colors

Material 3 role tokens, no translation:

```yaml
colors:
  primary: "#HEX"
  on-primary: "#HEX"
  primary-container: "#HEX"
  on-primary-container: "#HEX"
  secondary: "#HEX"
  on-secondary: "#HEX"
  secondary-container: "#HEX"
  on-secondary-container: "#HEX"
  tertiary: "#HEX"
  on-tertiary: "#HEX"
  tertiary-container: "#HEX"
  on-tertiary-container: "#HEX"
  error: "#HEX"
  on-error: "#HEX"
  error-container: "#HEX"
  on-error-container: "#HEX"
  surface: "#HEX"
  on-surface: "#HEX"
  on-surface-variant: "#HEX"
  surface-container-lowest: "#HEX"
  surface-container-low: "#HEX"
  surface-container: "#HEX"
  surface-container-high: "#HEX"
  surface-container-highest: "#HEX"
  inverse-surface: "#HEX"
  inverse-on-surface: "#HEX"
  inverse-primary: "#HEX"
  outline: "#HEX"
  outline-variant: "#HEX"
  # Fixed accents (M3)
  primary-fixed: "#HEX"
  primary-fixed-dim: "#HEX"
  on-primary-fixed: "#HEX"
  on-primary-fixed-variant: "#HEX"
  # ... same pattern for secondary-fixed, tertiary-fixed
```

### typography

Material 3 type scale:

```yaml
typography:
  display-large:  { fontFamily: Roboto, fontSize: 57px, fontWeight: 400, lineHeight: 64px, letterSpacing: -0.25px }
  display-medium: { ... fontSize: 45px ... }
  display-small:  { ... fontSize: 36px ... }
  headline-large:  { ... fontSize: 32px ... }
  headline-medium: { ... fontSize: 28px ... }
  headline-small:  { ... fontSize: 24px ... }
  title-large:   { ... fontSize: 22px ... }
  title-medium:  { ... fontSize: 16px, fontWeight: 500 ... }
  title-small:   { ... fontSize: 14px, fontWeight: 500 ... }
  body-large:    { ... fontSize: 16px ... }
  body-medium:   { ... fontSize: 14px ... }
  body-small:    { ... fontSize: 12px ... }
  label-large:   { ... fontSize: 14px, fontWeight: 500 ... }
  label-medium:  { ... fontSize: 12px, fontWeight: 500 ... }
  label-small:   { ... fontSize: 11px, fontWeight: 500 ... }
```

### spacing

8-point grid, t-shirt keys (Material doesn't use Tailwind's numeric scale):

```yaml
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
```

### rounded

Material 3 shape scale — t-shirt with Material names:

```yaml
rounded:
  none: 0px
  extra-small: 4px
  small: 8px
  medium: 12px
  large: 16px
  extra-large: 28px
  full: 9999px
```

### components

Material component names:

```yaml
components:
  button-filled:
  button-tonal:
  button-outlined:
  button-text:
  button-elevated:
  fab:
  fab-extended:
  icon-button:
  card-elevated:
  card-filled:
  card-outlined:
  text-field-filled:
  text-field-outlined:
  chip-assist:
  chip-filter:
  chip-input:
  chip-suggestion:
  dialog-basic:
  dialog-full-screen:
  bottom-sheet:
  side-sheet:
  navigation-bar:
  navigation-rail:
  navigation-drawer:
  top-app-bar:
  tabs-primary:
  tabs-secondary:
  snackbar:
  tooltip-plain:
  tooltip-rich:
```

### Prose references

Use Material component names (`<Button variant="filled">`, `<Card>`, `<TextField>`). Reference Material elevation levels (0 through 5) not shadow scale.

### Export

DTCG: `npx @google/design.md export --format dtcg <file> > tokens.json` — import into the Material Theme Builder via a compatible converter. **Do not emit `--format tailwind` for Material sources.**

---

## `mui` — Material UI (React)

MUI's theme structure is deeply nested (`palette.primary.main`, `palette.grey[100]`). For the YAML, flatten to dotted keys while preserving MUI semantics:

```yaml
colors:
  palette.primary.main: "#HEX"
  palette.primary.light: "#HEX"
  palette.primary.dark: "#HEX"
  palette.primary.contrastText: "#HEX"
  palette.secondary.main: "#HEX"
  palette.error.main: "#HEX"
  palette.warning.main: "#HEX"
  palette.info.main: "#HEX"
  palette.success.main: "#HEX"
  palette.grey.50: "#HEX"
  palette.grey.100: "#HEX"
  # ... through grey.900, A100..A700
  palette.text.primary: "#HEX"
  palette.text.secondary: "#HEX"
  palette.text.disabled: "#HEX"
  palette.background.default: "#HEX"
  palette.background.paper: "#HEX"
  palette.divider: "#HEX"
```

### typography

MUI variants: `h1..h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `button`, `caption`, `overline`.

### spacing

MUI uses `theme.spacing(n)` where `n * 8 = pixels`. Represent as numeric keys:

```yaml
spacing:
  "0.5": 4px
  "1": 8px
  "2": 16px
  "3": 24px
  "4": 32px
```

### Export

DTCG by default. Devs convert to a `createTheme({...})` call manually.

---

## `chakra` — Chakra UI

### colors

Palette-scale keys:

```yaml
colors:
  gray.50: "#HEX"
  gray.100: "#HEX"
  # ... through 900
  blue.500: "#HEX"
  red.500: "#HEX"
  # Chakra's semantic tokens (v3):
  fg.default: "#HEX"
  fg.muted: "#HEX"
  bg.default: "#HEX"
  bg.subtle: "#HEX"
  border.default: "#HEX"
```

### typography

Chakra t-shirt: `xs/sm/md/lg/xl/2xl/3xl/4xl/5xl/6xl`.

### spacing

Chakra's numeric + fraction scale (matches Tailwind): `"0.5" "1" "2" "3" "4" "5" "6" "8" "10" "12" "16" "20"`.

### rounded

`none/sm/base/md/lg/xl/2xl/3xl/full`.

### Export

DTCG.

---

## `apple-hig` — iOS / iPadOS / macOS / watchOS / visionOS

Apple's system UI. Used by iOS 26 + iPadOS 26 kits.

### colors

Apple system colors with `systemXxx` prefix and light/dark variants (both go into the same YAML with `-light` / `-dark` suffixes):

```yaml
colors:
  system-blue-light: "#HEX"
  system-blue-dark: "#HEX"
  system-gray-light: "#HEX"
  system-gray-2-light: "#HEX"
  # ... through system-gray-6
  label-primary-light: "#HEX"
  label-secondary-light: "#HEX"
  label-tertiary-light: "#HEX"
  label-quaternary-light: "#HEX"
  fill-primary-light: "#HEX"
  fill-secondary-light: "#HEX"
  background-primary-light: "#HEX"
  background-secondary-light: "#HEX"
  background-tertiary-light: "#HEX"
```

### typography

SF Pro text styles: `large-title/title-1/title-2/title-3/headline/subheadline/body/callout/footnote/caption-1/caption-2`.

### Export

DTCG.

---

## `css-vars-custom` — bespoke CSS custom properties

The site uses its own `:root` vars with no library conventions. **Preserve the site's exact var names**, stripped of the `--` prefix:

```yaml
colors:
  # Source had --app-color-primary, --app-color-text-base, --app-color-surface
  app-color-primary: "#HEX"
  app-color-text-base: "#HEX"
  app-color-surface: "#HEX"
  app-color-border: "#HEX"
```

If the source uses no prefix, use the raw name (`primary`, `text-base`). Don't invent semantic categories.

### Export

DTCG only. Tailwind export is meaningless here.

---

## `unknown` — fallback

No detected stack. Ask the user:

> "I couldn't detect the stack from the source. Which convention should the YAML use? (a) Tailwind — `text-xs/sm/base/lg`, numeric spacing keys; (b) Material — role tokens, t-shirt sizes; (c) match the source's exact variable names verbatim; (d) generic t-shirt (xs/sm/md/lg)."

If the user skips, default to (c) — preserve whatever the source exposes.

---

## Rule: the YAML key is the contract

Once extracted, the YAML keys are the contract with the host codebase. A Tailwind-shadcn dev can paste `{colors.primary}` and have it resolve to a real class (`bg-primary`). A Material dev can paste `{colors.on-primary-container}` and have it map to an M3 role. Translation would break both.

### Never do

- Don't emit `surface-elevated` when the source says `card`
- Don't emit `on-surface-muted` when the source says `muted-foreground`
- Don't emit `spacing.lg` when the source uses numeric keys (`spacing.4`, `spacing.6`)
- Don't emit t-shirt sizes when the source uses Tailwind numeric
- Don't translate Material roles into shadcn roles (or vice versa)
- Don't invent "pretty" names that flatter a non-Tailwind audience

### Always do

- Preserve the source's vocabulary 1:1
- If the source has both a Figma kit and a consuming app, prefer the KIT's vocabulary (since that's the design-system-of-record)
- Document the stack choice at the top of the `design.md` in the metadata header: `**Stack:** tailwind-shadcn`
- Route export to the matching format (Tailwind → Tailwind; Material/Chakra/MUI/CSS-vars → DTCG)
