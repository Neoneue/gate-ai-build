# shadcn → Figma Frame Mapping

> **Purpose:** Maps shadcn components to their Figma frame structure. How to translate React render output into Figma auto-layout frames, variable bindings, and text styles.
> **Companion files:** `default-tokens.md` has the variant classes and token values. This file covers HOW to build them in Figma — not what values to use.
> **Rule:** Before building ANY element on canvas, ask: "What shadcn component is this?" Look it up here. Don't design — replicate.
> **Always read the installed component source** (`components/ui/*.tsx`) for exact values — they change between presets.
> **Figma runtime:** This file is the **parity map** (Tailwind → frame properties). **`knowledge/figma/plugin-api.md`** is how Figma’s API actually sets those properties; **`knowledge/figma/mcp-workflow.md`** is how you invoke tools (`use_figma`, `get_design_context`, `search_design_system`, etc.). Know both.

---

## Tailwind → Figma Property Mapping

| Tailwind class | Figma property | Notes |
|---|---|---|
| `h-N` | Frame height (N×4px) | e.g., h-9 = 36px |
| `w-N` | Frame width (N×4px) | |
| `size-N` | width AND height | e.g., size-8 = 32×32 |
| `px-N` | paddingLeft + paddingRight | |
| `py-N` | paddingTop + paddingBottom | |
| `p-N` | All four paddings | |
| `gap-N` | itemSpacing | |
| `rounded-*` | cornerRadius via `setBoundVariable` with radius variable | Never hardcode |
| `text-*` (size) | fontSize via text style or type scale variable | Use `setTextStyleIdAsync` |
| `font-medium` | fontName `{ family, style: 'Medium' }` | Via text style |
| `bg-<token>` | fills via `setBoundVariableForPaint` | Bind to Mode variable |
| `bg-<token>/<opacity>` | fills via opacity-modified Mode variable | Alpha baked in |
| `border-<token>` | strokes via `setBoundVariableForPaint` + strokeWeight 1 | |
| `text-<token>` | text node fills via `setBoundVariableForPaint` | |
| `ring-1 ring-<token>` | strokes (ring renders as 1px border visually) | strokeAlign INSIDE |
| `shadow-sm/md/lg` | DROP_SHADOW effect | |
| `flex` | layoutMode HORIZONTAL or VERTICAL | |
| `flex-col` | layoutMode VERTICAL | |
| `items-center` | counterAxisAlignItems CENTER | |
| `justify-between` | primaryAxisAlignItems SPACE_BETWEEN | |
| `justify-end` | primaryAxisAlignItems MAX | |
| `overflow-hidden` | clipsContent true | Don't use with drop shadows |
| `w-full` | layoutSizingHorizontal FILL | Only AFTER appending to auto-layout parent |

### Tailwind class → pixel quick reference

```
Heights:  h-5=20  h-6=24  h-7=28  h-8=32  h-9=36  h-10=40  h-11=44  h-12=48
Padding:  p-1=4  p-1.5=6  p-2=8  p-2.5=10  p-3=12  p-4=16  p-5=20  p-6=24
Gap:      gap-1=4  gap-1.5=6  gap-2=8  gap-3=12  gap-4=16  gap-6=24
Text:     text-xs=12  text-sm=14  text-base=16  text-lg=18  text-xl=20  text-2xl=24
Size:     size-6=24  size-8=32  size-9=36  size-10=40
```

---

## Component Frame Structures

### Button

```
Frame (HORIZONTAL auto-layout)
├── layoutMode: HORIZONTAL
├── primaryAxisAlignItems: CENTER
├── counterAxisAlignItems: CENTER
├── height: from size variant (default h-9=36)
├── paddingLeft/Right: from size variant (default px-4=16)
├── cornerRadius: bound to radius variable (default rounded-md)
├── fills: bound to variant's bg variable
├── strokes: bound to variant's border variable (if any)
├── itemSpacing: from size variant (default gap-2=8)
│
├── [Icon] (optional, instance — rescale, don't resize)
└── Text (text style applied, fills bound to variant's text variable)
```

### Badge

```
Frame (HORIZONTAL auto-layout)
├── height: fixed (default h-5=20, but check source)
├── paddingLeft/Right: px-2=8
├── paddingTop/Bottom: py-0.5=2
├── cornerRadius: bound to radius variable (default rounded-full)
├── fills: bound to variant's bg variable
├── itemSpacing: gap-1=4
│
├── [Icon] (optional, size-3=12px)
└── Text (text-xs font-medium, fills bound to variant's text variable)
```

### Card

```
Frame (VERTICAL auto-layout)
├── cornerRadius: bound to radius variable (default rounded-xl)
├── fills: bound to base/card
├── strokes: 1px bound to base/border (default uses border, not ring)
├── effects: shadow-sm (default — check preset, some remove it)
├── paddingTop/Bottom: py-6=24
├── itemSpacing: gap-6=24
│
├── CardHeader (VERTICAL, px-6=24, gap-2=8)
│   ├── CardTitle (text style: leading-none font-semibold)
│   └── CardDescription (text style: text-sm, text-muted-foreground)
├── CardContent (px-6=24, no vertical padding)
└── CardFooter (HORIZONTAL, px-6=24, items-center)
```

**Table card override:** `py-0 gap-0` — inner elements handle spacing.

### Dialog

```
Frame (VERTICAL auto-layout)
├── width: 448 max (sm:max-w-md)
├── cornerRadius: bound to radius variable (default rounded-lg — check preset)
├── fills: bound to base/popover
├── strokes: 1px (ring — check if border or ring-foreground/5)
├── effects: shadow-lg
├── padding: p-6=24 all sides
├── itemSpacing: gap-4=16 (default — some presets use gap-6)
│
├── Close button (ABSOLUTE position, top-4 right-4)
│   └── Ghost icon-sm button with X icon instance
├── DialogHeader (VERTICAL, gap-2=8)
│   ├── DialogTitle (text style — check preset for size/weight)
│   └── DialogDescription (text-sm text-muted-foreground)
├── Content area (mirrors code's wrapper divs 1:1)
└── DialogFooter (HORIZONTAL, gap-2=8, justify-end)
    ├── Cancel (outline button)
    └── Primary action (default or destructive button)
```

### Table

```
Frame (VERTICAL auto-layout, FILL width)
├── TableHeader (HORIZONTAL, fills: check if bg-muted)
│   └── TableHead × N
│       ├── height: h-12=48
│       ├── paddingLeft/Right: px-3=12
│       ├── text: font-medium, text-foreground (NOT muted-foreground)
│       └── Last column (actions): fixed width 52px, no text
├── TableBody
│   └── TableRow × N (HORIZONTAL, border-b 1px)
│       └── TableCell × N
│           ├── padding: p-3=12
│           └── content varies (see blocks-and-patterns.md for cell types)
└── Pagination (HORIZONTAL, justify-between, px-4 py-4)
    ├── Left: "Rows per page" + Select (h-8)
    └── Right: "Page X of Y" + prev/next buttons
```

**Separators:** Add between title bar and header, between last row and pagination.

### Input

```
Frame (HORIZONTAL auto-layout)
├── height: h-9=36 (default — check preset)
├── paddingLeft/Right: px-3=12
├── paddingTop/Bottom: py-1=4
├── cornerRadius: bound to radius variable (default rounded-md)
├── fills: check preset (default bg-transparent, some use bg-input/30)
├── strokes: 1px bound to base/input
├── effects: shadow-xs (default)
│
└── Text (text-base on mobile, md:text-sm on desktop)
    └── Placeholder: text-muted-foreground
```

### Select Trigger

```
Frame (HORIZONTAL auto-layout)
├── height: h-9=36 (default), h-8=32 (sm)
├── paddingLeft/Right: px-3=12
├── cornerRadius: bound to radius variable (default rounded-md)
├── fills: bg-transparent (default)
├── strokes: 1px bound to base/input
├── effects: shadow-xs
├── primaryAxisAlignItems: SPACE_BETWEEN
│
├── Text (selected value or placeholder)
└── ChevronDown icon (size-4, text-muted-foreground)
```

### Sidebar

```
Frame (VERTICAL auto-layout)
├── width: 240px (standard)
├── fills: none (transparent — inherits page background)
├── justify-between (nav top, user bottom)
│
├── Top section
│   ├── Logo row (icon + brand name)
│   ├── Nav group (VERTICAL, gap-1=4)
│   │   └── Nav item × N (HORIZONTAL, px-2 py-2, rounded-md)
│   │       ├── Icon instance (size-4, strokeWeight 1.5)
│   │       └── Text (text-sm)
│   │       Active: fills bound to base/accent, icon text-sidebar-primary
│   │       Inactive: text-muted-foreground, hover:bg-accent
│   └── Settings group
│       ├── Label (text-xs uppercase tracking-wider text-muted-foreground)
│       └── Nav items (same pattern)
│
└── Bottom section
    └── User row (avatar + name + email)
```

### Avatar

```
Frame (clipsContent true)
├── size: varies (size-8=32 common)
├── cornerRadius: rounded-full (9999px)
├── fills: bound to base/muted (fallback bg)
│
├── Image (if available, object-cover)
└── Fallback text (initials, text-xs font-medium, centered)
```

### Separator

```
Rectangle
├── horizontal: height 1px, width FILL
├── vertical: width 1px, height FILL
├── fills: bound to base/border
```

### Label

```
Text node
├── text style: text-sm leading-none font-medium
├── fills: bound to base/foreground
```

---

## Icon Rules in Figma

- **Find the component** in the Icons page, create an instance
- **Resize:** Use `rescale(targetSize / currentSize)` — NEVER `resize()`, NEVER detach
- **Color:** Already variable-bound to base/foreground — don't override
- **Stroke weight:** Don't modify unless matching adjacent text weight optically
- **Wrapping:** Never add extra wrapper frames — icon instances are self-contained

---

## Frame Hierarchy = DOM Hierarchy

Every wrapper `<div>` in JSX = a frame in Figma with matching gap/padding.

```jsx
// Code:
<div className="flex flex-col gap-4 py-4">
  <div className="border bg-muted p-3">...</div>
  <p className="text-xs">...</p>
</div>

// Figma:
Frame "Section" (VERTICAL, itemSpacing=16, paddingTop/Bottom=16)
├── Frame "Display" (strokes=border, fills=muted, padding=12)
└── Text (text-xs)
```

If code groups elements in a div, Figma groups them in a frame. No flattening.

---

## Building Process

1. **Read the component source** (`components/ui/*.tsx`) for exact variant classes
2. **Check `default-tokens.md`** for token values and opacity patterns
3. **Map classes → Figma properties** using the table above
4. **Bind ALL colors** to Mode collection variables via `setBoundVariableForPaint`
5. **Bind ALL radii** to Theme radius variables via `setBoundVariable`
6. **Apply text styles** via `setTextStyleIdAsync` — never hardcode font properties
7. **Set dark mode** on parent frame via `setExplicitVariableModeForCollection`
8. **Screenshot and verify** after every `use_figma` call

---

## Key Rules

1. **Don't design — replicate.** Every element maps to a shadcn component.
2. **Always read the installed source.** Values change between presets.
3. **Cells have their own padding.** Don't stack padding on rows AND cells.
4. **Use component instances for icons.** Import, don't rebuild.
5. **Status dots are real ellipses.** Colored with variable binding, not text characters.
6. **Build both light and dark.** Set explicit mode on parent frames.
7. **Interactive controls must be disabled when they can't act.**
