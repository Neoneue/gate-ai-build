# Figma Canvas — Building Foundations

> **Reading order:** For screens/components, align intent with `knowledge/core/craft-methodology.md` + `design-process-rules.md` (hierarchy before pixels). Then `plugin-api.md` (how Figma’s document works) → `mcp-workflow.md` (MCP tools) → This file (build patterns) → `canvas-elements.md` (icons, instances, effects) → **host `system.md`** (Theme + Project) when present

> **Source:** Figma Plugin API official documentation (developers.figma.com), Figma Plugin typings, Figma plugin-samples repository.

> This file teaches the fundamentals of building on the Figma canvas — auto-layout thinking, build order, spacing strategy, variable binding, and text handling. For components, icons, effects, modifications, and common mistakes, see `canvas-elements.md`.

---

## 1. Think in Auto-Layout Trees, Not Coordinates

Human designers don't place elements at x/y coordinates. They build nested auto-layout frames that flow content. Every design is a tree:

```
Page
└── Card (VERTICAL auto-layout)
    ├── Header (HORIZONTAL auto-layout)
    │   ├── Title (text)
    │   └── Badge (frame + text)
    ├── Divider (rectangle)
    └── Body (VERTICAL auto-layout)
        ├── Row (HORIZONTAL auto-layout)
        └── Row (HORIZONTAL auto-layout)
```

**Plan the tree before writing code.** Sketch the nesting on paper or in text. Every frame needs a purpose — don't create frames "just in case." If a frame has one child and no padding/spacing, it's unnecessary.

**When building from code, the Figma tree must mirror the DOM 1:1.** Every wrapper `<div>` in the JSX that groups elements or controls spacing becomes a frame in Figma. This is critical for:
- **Code → Canvas:** The code's nesting defines which elements share tight spacing (inner `gap-4`) vs loose spacing (outer `gap-6`). Flattening destroys this hierarchy.
- **Canvas → Code:** When extracting Figma back to code, the frame nesting IS the DOM structure. Missing frames = missing wrappers = wrong code output.

Read the code's JSX structure FIRST, map every container to a frame, preserve exact nesting depth, and set each frame's gap/padding to match its code counterpart.

Manual x/y positioning is only for:
- Canvas-level placement of top-level frames
- Absolute-positioned decorative elements (badges, indicators)
- Elements that intentionally break out of auto-layout flow

---

## 2. Build Order — The Sequence That Prevents Bugs

Figma's API has strict ordering dependencies. Violating them causes silent failures. Follow this sequence:

### Phase 1: Create leaf nodes (inside-out)

Create the innermost elements first — text, shapes, icons. These have no children.

```js
// Text — must load font before setting characters
const title = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
title.characters = 'Order Summary';
title.fontSize = 20;
title.lineHeight = { unit: 'PIXELS', value: 28 };
```

**Font style names have spaces:** `'Semi Bold'` not `'SemiBold'`, `'Extra Bold'` not `'ExtraBold'`. This is a common source of silent failures.

```js
// Rectangle (for dividers, tracks, decorative elements)
const divider = figma.createRectangle();
divider.name = 'Divider';
divider.resize(100, 1);  // width is temporary — FILL will override
```

```js
// Icon from library — import by component key, then instantiate
const comp = await figma.importComponentByKeyAsync('abc123...');
const icon = comp.createInstance();
```

### Phase 2: Create parent frames with auto-layout

```js
const header = figma.createFrame();
header.name = 'Header';
header.layoutMode = 'HORIZONTAL';
header.itemSpacing = 8;
header.paddingTop = 0;
header.paddingBottom = 0;
header.paddingLeft = 0;
header.paddingRight = 0;
header.primaryAxisSizingMode = 'AUTO';
header.counterAxisSizingMode = 'AUTO';
header.fills = [];              // transparent — most inner frames need no fill
header.clipsContent = false;    // never clip unless intentional
```

### Phase 3: Append children to parents

```js
header.appendChild(title);
header.appendChild(badge);
```

### Phase 4: Set child sizing AFTER appending

This is the most common bug source. `layoutSizingHorizontal = 'FILL'` only works after the child is inside an auto-layout parent:

```js
// WRONG — throws or does nothing
title.layoutSizingHorizontal = 'FILL';
header.appendChild(title);

// RIGHT — append first, then set sizing
header.appendChild(title);
title.layoutSizingHorizontal = 'FILL';
```

### Phase 5: Apply fills, strokes, effects

```js
// Solid fill with variable binding
let paint = { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 };
paint = figma.variables.setBoundVariableForPaint(paint, 'color', colorVariable);
frame.fills = [paint];

// Stroke with variable binding
let stroke = { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 }, opacity: 1 };
stroke = figma.variables.setBoundVariableForPaint(stroke, 'color', borderVariable);
frame.strokes = [stroke];
frame.strokeWeight = 1;
frame.strokeAlign = 'INSIDE';
```

### Phase 6: Set variable mode on outermost container

```js
// All children inherit this mode — variables resolve to dark values
outerFrame.setExplicitVariableModeForCollection(collection, darkModeId);
```

**Why this order matters:**
- `resize()` overrides auto-layout sizing modes — always re-set them after
- `FILL` requires an auto-layout parent to exist
- Paint variable binding requires `setBoundVariableForPaint`, not `setBoundVariable`
- Font loading is async — must `await` before setting text properties
- Mode inheritance flows downward — set on the outermost frame

---

## 3. Auto-Layout Mastery

### Sizing modes — the mental model

Every auto-layout frame has two axes:
- **Primary axis:** The direction of flow (VERTICAL = top to bottom, HORIZONTAL = left to right)
- **Counter axis:** Perpendicular to flow

Each axis can be:
- **AUTO (hug):** Frame shrinks to fit its children
- **FIXED:** Frame stays at a set dimension

Children inside auto-layout can be:
- **HUG:** Child shrinks to its own content
- **FILL:** Child stretches to fill available space in parent
- **FIXED:** Child stays at a set dimension

```
Frame (VERTICAL, width FIXED 400, height AUTO)
├── Title (FILL width, HUG height)     → stretches to 400px wide
├── Subtitle (FILL width, HUG height)  → stretches to 400px wide
└── Button (HUG width, HUG height)     → stays at natural size
```

### Common auto-layout configurations

**Card container (fixed width, hugs height):**
```js
frame.layoutMode = 'VERTICAL';
frame.resize(400, 1);                     // set width
frame.primaryAxisSizingMode = 'AUTO';     // re-set: hug height
frame.counterAxisSizingMode = 'FIXED';    // keep width at 400
```

**Inline row (hugs both axes):**
```js
frame.layoutMode = 'HORIZONTAL';
frame.primaryAxisSizingMode = 'AUTO';
frame.counterAxisSizingMode = 'AUTO';
```

**Full-width child row (fills parent, hugs height):**
```js
// After appending to parent:
row.layoutSizingHorizontal = 'FILL';
row.layoutSizingVertical = 'HUG';
```

**Space-between row (label left, value right):**
```js
frame.layoutMode = 'HORIZONTAL';
frame.primaryAxisAlignItems = 'SPACE_BETWEEN';
frame.counterAxisAlignItems = 'CENTER';
// After appending to parent:
frame.layoutSizingHorizontal = 'FILL';
```

### Alignment

```js
// Primary axis (direction of flow)
frame.primaryAxisAlignItems = 'MIN';           // start (top/left)
frame.primaryAxisAlignItems = 'CENTER';        // center
frame.primaryAxisAlignItems = 'MAX';           // end (bottom/right)
frame.primaryAxisAlignItems = 'SPACE_BETWEEN'; // distribute with equal gaps

// Counter axis (perpendicular)
frame.counterAxisAlignItems = 'MIN';      // top/left
frame.counterAxisAlignItems = 'CENTER';   // center
frame.counterAxisAlignItems = 'MAX';      // bottom/right
frame.counterAxisAlignItems = 'BASELINE'; // text baseline alignment
```

### Wrapping (tag clouds, chip groups)

```js
frame.layoutMode = 'HORIZONTAL';
frame.layoutWrap = 'WRAP';
frame.itemSpacing = 6;           // horizontal gap
frame.counterAxisSpacing = 6;    // vertical gap between wrapped rows
frame.counterAxisSizingMode = 'AUTO'; // height grows with wrapping
```

### Absolute positioning within auto-layout

For elements that float above the flow (notification badges, close buttons, decorative indicators):

```js
const badge = figma.createFrame();
parent.appendChild(badge);
badge.layoutPositioning = 'ABSOLUTE';
badge.x = 90;
badge.y = -10;
badge.constraints = { horizontal: 'MAX', vertical: 'MIN' }; // stick to top-right
```

**Z-order rule:** Children render in array order — index 0 is at the BACK, last child is at the FRONT. Absolute-positioned children follow the same rule.

---

## 4. Spacing as Hierarchy

Spacing is not decoration — it's the primary tool for visual grouping. The principle: **tight within related groups, generous between distinct groups.**

```
Section A (items related to each other)
  item spacing: 4–8px
  ─── generous gap: 24–32px ───
Section B (different topic)
  item spacing: 4–8px
```

### How to implement in Figma

**Option A — itemSpacing on the parent:**
Use when all children have equal gaps.
```js
frame.itemSpacing = 8; // uniform gap between all children
```

**Option B — Wrapper frames with paddingTop:**
Use when sections need different spacing from what's above them.
```js
const sectionB = figma.createFrame();
sectionB.layoutMode = 'VERTICAL';
sectionB.paddingTop = 24;  // creates visual gap from section A
sectionB.itemSpacing = 8;  // tight spacing within section B
sectionB.fills = [];
```

**Option C — Dividers as section breaks:**
Use when a visual line is needed between sections.
```js
const divider = figma.createRectangle();
divider.name = 'Divider';
divider.resize(100, 1);
// Bind fill to border color variable
parent.appendChild(divider);
divider.layoutSizingHorizontal = 'FILL';
```

**Never create spacer frames.** Use `itemSpacing`, `paddingTop`, or wrapper frames — not empty frames with fixed heights.

---

## 5. Variable Binding — The Theming Foundation

### Why variables, not hardcoded colors

Every fill, stroke, and text color must be bound to a variable. This enables:
- Light/dark mode switching via mode changes on a parent frame
- Design system consistency across the file
- Easy global updates when tokens change

### Binding colors to fills and strokes

You CANNOT use `setBoundVariable` for fills or strokes. You MUST use `setBoundVariableForPaint`:

```js
// 1. Create a paint object with a placeholder color
let paint = { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 };

// 2. Bind the variable to the paint
paint = figma.variables.setBoundVariableForPaint(paint, 'color', myColorVariable);

// 3. Assign the paint to the node
node.fills = [paint];
```

The placeholder color `{ r: 1, g: 1, b: 1 }` is required by the API but gets overridden by the variable at render time. Use the light-mode resolved value as the placeholder for accurate rendering in the default mode.

### Binding dimensions to variables

For spacing, radius, and sizing — use `setBoundVariable` directly:

```js
node.setBoundVariable('paddingTop', spacingVar);
node.setBoundVariable('paddingBottom', spacingVar);
node.setBoundVariable('itemSpacing', gapVar);
node.setBoundVariable('topLeftRadius', radiusVar);
node.setBoundVariable('topRightRadius', radiusVar);
node.setBoundVariable('bottomLeftRadius', radiusVar);
node.setBoundVariable('bottomRightRadius', radiusVar);
node.setBoundVariable('width', widthVar);
```

### Binding effects to variables

Effects (shadows, blur) use `setBoundVariableForEffect`:

```js
const effectsCopy = [...node.effects];
effectsCopy[0] = figma.variables.setBoundVariableForEffect(
  effectsCopy[0], 'radius', radiusVariable
);
node.effects = effectsCopy;
```

### Creating variable collections with modes

```js
const collection = figma.variables.createVariableCollection('Semantic Colors');
const lightModeId = collection.modes[0].modeId;
collection.renameMode(lightModeId, 'Light');
const darkModeId = collection.addMode('Dark');

const bgVar = figma.variables.createVariable('background', collection, 'COLOR');
bgVar.setValueForMode(lightModeId, { r: 1, g: 1, b: 1 });       // white
bgVar.setValueForMode(darkModeId, { r: 0.04, g: 0.04, b: 0.04 }); // near-black
```

### Variable aliases (primitive → semantic)

```js
const alias = figma.variables.createVariableAlias(primitiveVariable);
semanticVariable.setValueForMode(lightModeId, alias);
```

### Setting modes on frames

```js
// Set dark mode — all child variable bindings resolve to dark values
frame.setExplicitVariableModeForCollection(collection, darkModeId);

// Check current mode
frame.explicitVariableModes;   // only modes set directly on this frame
frame.resolvedVariableModes;   // all modes including inherited from parents

// Clear mode (inherit from parent)
frame.clearExplicitVariableModeForCollection(collection);
```

### Reading existing variable bindings

```js
node.boundVariables;
// Returns: { fills: [VariableAlias], cornerRadius: VariableAlias, ... }
```

### Semantic token mapping — which variable for which property

**Source:** shadcn/ui theming convention (ui.shadcn.com/docs/theming). Each CSS variable maps to a specific UI purpose. Using the wrong token (e.g., `foreground` for a border) breaks theming.

| UI element | Fill variable | Stroke variable | Text variable |
|---|---|---|---|
| Dialog/popover bg | `base/popover` | `base/border` (NOT foreground) | — |
| Card bg | `base/card` | `base/border` | — |
| Page bg | `base/background` | — | — |
| Primary button | `base/primary` | — | `base/primary-foreground` |
| Outline button | `custom/background dark:input\30` | `base/border` | `base/foreground` |
| Destructive tint button | `custom/destructive\20 dark:destructive\40` | — | `base/destructive` |
| Input field | `custom/background dark:input\30` | `base/input` | `base/foreground` |
| Title text | — | — | `base/foreground` |
| Description text | — | — | `base/muted-foreground` |
| Helper/caption text | — | — | `base/muted-foreground` |
| Warning text | — | — | `base/destructive` |
| Warning box | `custom/destructive\20 dark:destructive\40` | `custom/destructive\20 dark:destructive\40` | — |
| Dialog ring/border | — | `base/foreground` at 5% opacity OR `custom/outline\10 dark:outline\20` | — |
| Muted surface (key display) | `base/muted` | `base/border` | — |

**Common mistakes:**
- Using `foreground` for borders — foreground is for TEXT, `border` is for borders
- Using `destructive` at 100% for tint buttons — use the Mode collection opacity variants
- Using `background` for input fills — inputs use `custom/background dark:input\30` (translucent)

### Opacity-modified colors — use the Mode collection

**Never create opacity-modified color variables from scratch.** The Shadcn Figma kit's Mode collection has pre-computed opacity variants with DIFFERENT values per mode (dark mode uses higher opacity because the base color is lighter on dark backgrounds).

```
Example: destructive button fill
  Light mode: destructive color at 20% → Mode var: custom/destructive\20 dark:destructive\40
  Dark mode: destructive color at 40% (NOT 20%)
```

Alpha values must be baked into the variable's RGBA value. Paint opacity tricks break variable connections.

### Always build BOTH light and dark variants

When building components on canvas, create two parent frames — one with Light mode set, one with Dark mode set. The same variable-bound children render correctly in both modes. This ensures parity and catches token issues early.

---

## 6. Text Handling

### The font loading requirement

**Every text property change requires the font to be loaded first.** This is async:

```js
// Load a specific font
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

// Load the font already on a text node
await figma.loadFontAsync(textNode.fontName);

// Load all fonts on a multi-font text node
await Promise.all(
  textNode.getRangeAllFontNames(0, textNode.characters.length)
    .map(figma.loadFontAsync)
);
```

Properties that require font loading: `characters`, `fontSize`, `fontName`, applying styles via [`setTextStyleIdAsync`](https://developers.figma.com/docs/plugins/api/TextNode/#settextstyleidasync) (assigning `textStyleId` directly is deprecated and fails under `documentAccess: "dynamic-page"`), `textCase`, `textDecoration`, `letterSpacing`, `lineHeight`, and all `setRange*` methods.

Properties that do NOT require font loading: `fills`, `fillStyleId`, `strokes`, `strokeWeight`.

### Creating styled text

```js
const text = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
text.characters = 'Hello World';
text.fontSize = 14;
text.lineHeight = { unit: 'PIXELS', value: 20 };
text.letterSpacing = { unit: 'PERCENT', value: 0 };
text.textAlignHorizontal = 'LEFT';

// Bind text color to variable
let textPaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 };
textPaint = figma.variables.setBoundVariableForPaint(textPaint, 'color', foregroundVar);
text.fills = [textPaint];
```

### Text sizing in auto-layout

```js
// Text that fills parent width and wraps
parent.appendChild(text);
text.layoutSizingHorizontal = 'FILL';
text.layoutSizingVertical = 'HUG';
text.textAutoResize = 'HEIGHT'; // text height adjusts to content
```

### Applying text styles — ALWAYS DO THIS FIRST

**Before setting fontSize/fontName/lineHeight manually, check if a text style exists.** The file's style library is the source of truth for typography — manual properties are a fallback.

```js
// PREFERRED: apply text style from library
const styles = await figma.getLocalTextStylesAsync();
const bodyStyle = styles.find(s => s.name === 'text-sm/leading-normal/regular');
if (bodyStyle) {
  await textNode.setTextStyleIdAsync(bodyStyle.id);
}

// FALLBACK: manual properties only if no matching style exists
// This should be rare — most projects have a complete style library
```

**The workflow:**
1. Load all text styles at the start of a build: `const styles = await figma.getLocalTextStylesAsync()`
2. Build a lookup: `const styleMap = {}; styles.forEach(s => styleMap[s.name] = s);`
3. For each text node, find the matching style name from system.md type scale
4. Apply via `setTextStyleIdAsync` — this sets fontSize, fontName, lineHeight, letterSpacing all at once
5. Only set manual properties if no style matches

---

## Retrieval Queries

- How to build UI on Figma canvas programmatically with auto-layout
- Figma Plugin API auto-layout nesting patterns and sizing modes
- Variable binding fills strokes text colors Figma Plugin API
- Build order sequence for Figma canvas operations
- Figma text handling font loading text styles
- Spacing as hierarchy in Figma auto-layout
- Figma variable collections modes theming
