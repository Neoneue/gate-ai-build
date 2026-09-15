# Framework fingerprints

How to recognize common design system underpinnings by visual, structural, and CSS tells. Use these to pre-fill defaults; note deviations against the default baseline.

---

## shadcn/ui + Radix

### Visual tells

- Rounded corners at 0.5rem (8px) on most controls
- Muted borders at low-opacity neutrals
- Focus ring at brand color with 3–4px spread
- Subtle shadow scale (no dramatic depth)
- Dialog / Popover with tight type scale
- Distinctive Lucide or Radix icons

### Structural tells (DOM)

- `data-radix-*` attributes on interactive elements
- `data-state="open" / "closed"` on disclosure components
- `role="separator"` on dividers
- `aria-labelledby` + `aria-describedby` wiring on dialogs

### CSS tells

- `:root { --background, --foreground, --primary, --primary-foreground, --muted, --muted-foreground, --card, --border, --input, --ring, --destructive }`
- HSL tokens: `--primary: 221.2 83.2% 53.3%`
- Standard radius: `--radius: 0.5rem`
- Utility resolution through Tailwind: `bg-primary text-primary-foreground`

### Defaults to pre-fill when recognized

- Spacing: Tailwind's 4pt scale
- Type: Inter or Geist (newer sites)
- Radius scale: `sm 4 / md 6 / lg 8 / xl 12`
- Elevation: shadow-sm / shadow / shadow-md / shadow-lg / shadow-xl

---

## Tailwind (vanilla)

### Visual tells

- Default palette visible (indigo-500, violet-600, emerald-500, amber-500 — specific hues)
- 4pt spacing rhythm
- Shadow scale matches `shadow-sm / shadow / shadow-md / shadow-lg`

### Structural tells

- Utility classes in HTML: `class="px-4 py-2 rounded-lg bg-blue-600"`
- No custom class hashing

### CSS tells

- `@import 'tailwindcss'` (v4) or generated utility CSS
- CSS variables for dark mode: `@media (prefers-color-scheme: dark)` or `.dark { --bg: ... }`

### Default palette — memorize these hexes

- **Neutrals:** slate-900 `#0F172A`, gray-900 `#111827`, zinc-900 `#18181B`, neutral-900 `#171717`, stone-900 `#1C1917`
- **Accents:** blue-600 `#2563EB`, indigo-600 `#4F46E5`, violet-600 `#7C3AED`, purple-600 `#9333EA`
- **Status:** emerald-500 `#10B981`, amber-500 `#F59E0B`, rose-500 `#F43F5E`, red-600 `#DC2626`, sky-500 `#0EA5E9`

---

## Material UI (MUI)

### Visual tells

- Roboto default font (unless themed)
- Elevation 0–24 shadow scale (distinctive layered shadows with ambient + key light)
- Ripple effect on click (spreading circle = MUI)
- Blue `#1976D2` as the classic primary (pre-v5)
- Updated palette from v5: primary `#1976D2`, secondary `#9C27B0`

### Structural tells

- Classes: `MuiButton-root`, `MuiPaper-elevation1`, `MuiTextField-root`
- `role="presentation"` on backdrops
- `data-testid` extensively used in many MUI apps

### CSS tells

- Emotion-based class hashing: `css-1a2b3c4`
- Theme configured as a JS object (not CSS variables) unless the app opted in to CSS vars

---

## Ant Design

### Visual tells

- Primary blue `#1677FF` (v5) or `#1890FF` (v4)
- Buttons rounded at 2px (v4) or 6px (v5) — tighter than shadcn/Tailwind
- Tables with full borders and zebra stripes
- Form labels placed left of inputs (horizontal form layout)
- Distinctive avatar and tag shapes

### Structural tells

- Classes: `ant-btn`, `ant-input`, `ant-table`, `ant-form-item`
- `role="alert"` on notifications
- `aria-label="Loading"` on spinners

### CSS tells

- CSS variables in v5: `--ant-color-primary`, `--ant-color-bg-container`
- Token system exposed via `<ConfigProvider theme={{ token: {...} }}>`

---

## Chakra UI

### Visual tells

- Gray-50 to Gray-900 background scale (specific neutral hues)
- Blue `#3182CE` common primary
- Softer shadows than MUI
- Distinctive input focus: 2px outside ring in brand color

### Structural tells

- Classes: `chakra-button`, `chakra-input`, `chakra-text`
- `data-theme` attribute for color mode
- `data-hover`, `data-active`, `data-focus` state attributes

### CSS tells

- Emotion class hashing (same as MUI)
- CSS variables: `--chakra-colors-gray-100`, `--chakra-space-4`

---

## Mantine

### Visual tells

- Blue `#228BE6` default primary
- 4px default radius (tighter than shadcn)
- Distinctive popover animation (fade + subtle shift)
- Notifications with thick left border

### Structural tells

- Classes: `mantine-Button-root`, `mantine-Input-input`
- `data-variant` on stylable components

### CSS tells

- CSS variables: `--mantine-color-blue-6`, `--mantine-spacing-md`

---

## Headless UI / Tailwind UI

### Visual tells

- Visually identical to shadcn / vanilla Tailwind — differentiated by component patterns, not tokens
- Uses headless components + user-supplied Tailwind classes

### Structural tells

- `data-headlessui-state` on interactive elements
- `data-open`, `data-closed` on transitions

### CSS tells

- No framework CSS — whatever Tailwind classes the author applied

---

## Bootstrap 5

### Visual tells

- Blue `#0D6EFD` default primary
- Rounded at 0.375rem (6px)
- Container max-widths at 540/720/960/1140/1320 breakpoints
- Distinctive navbar and card chrome

### Structural tells

- Classes: `btn btn-primary`, `form-control`, `card`, `navbar`
- `data-bs-toggle`, `data-bs-target` on interactive elements

### CSS tells

- CSS variables: `--bs-primary`, `--bs-body-bg`
- Sass variable overrides common in custom builds

---

## Geist / Vercel design

### Visual tells

- Geist font family
- Very tight neutrals (near-black, near-white)
- Hairline borders (`rgba(255,255,255,0.1)` on dark)
- Minimal elevation; borders do most structural work
- Accent colors reserved for status (success green, error red, warning amber)
- Focus ring at brand color, subtle

### Structural tells

- `@vercel/geist` or `geist-*` classes
- Data attributes for theme variants

---

## Custom / rolled-own

When no framework fingerprint matches:

- Document classes as observed (`.login-btn`, `.card-shell`, `.top-nav`)
- Ask the user if there's a design token file you can look at
- Warn that framework-default pre-fills don't apply — every token must be extracted from evidence, not inferred from a library baseline
- Pay extra attention to inconsistencies; custom systems often drift

---

## Quick-match cheat sheet

| Clue | Most likely framework |
|---|---|
| `data-radix-*` attrs + `--primary` HSL vars | shadcn/ui + Radix |
| `MuiX-root` classes + ripple effect | MUI |
| `ant-btn` + tables with zebra | Ant Design |
| `chakra-*` + `data-theme` | Chakra UI |
| `mantine-*` | Mantine |
| `btn btn-primary` + `data-bs-*` | Bootstrap 5 |
| Pure Tailwind utilities in HTML, no library classes | vanilla Tailwind |
| Geist font + hairline borders on dark | Geist / Vercel |
| Nothing recognizable, heavy custom classes | Rolled-own — extract from evidence only |
