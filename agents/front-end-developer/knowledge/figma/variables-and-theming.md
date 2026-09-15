# Figma Variables & Theming — The Complete Guide

> **Reading order:** `plugin-api.md` → `mcp-workflow.md` (when using MCP to read/write variables) → `canvas-building.md` → `canvas-elements.md` → `component-architecture.md` → This file

> **Source:** Figma Plugin API official documentation (developers.figma.com), Figma working-with-variables guide, Figma Plugin API typings.

> This file teaches how to think about variables, collections, modes, and theming in Figma. The API reference tells you the methods. This file tells you the architecture — how to structure a variable system that scales.

---

## 1. What Variables Are

Variables in Figma are named, reusable values that can be bound to design properties. They are the equivalent of CSS custom properties or design tokens.

A variable has:
- A **name** (e.g., `background`, `primary`, `spacing-md`)
- A **type** (COLOR, FLOAT, STRING, BOOLEAN)
- A **value per mode** (light mode = white, dark mode = near-black)
- A **collection** it belongs to

When a variable is bound to a node property, the node resolves the variable's value based on the active mode. Change the mode, all bound properties update automatically.

---

## 2. Variable Types

Four types, matching what they can control:

### COLOR
RGB(A) values. Used for fills, strokes, text colors, effect colors.

```js
const colorVar = figma.variables.createVariable('foreground', collection, 'COLOR');
colorVar.setValueForMode(lightModeId, { r: 0.04, g: 0.04, b: 0.04 });  // near-black
colorVar.setValueForMode(darkModeId, { r: 0.97, g: 0.97, b: 0.97 });   // near-white
```

### FLOAT
Numbers. Used for spacing, radius, dimensions, opacity, font size, stroke weight.

```js
const spacingVar = figma.variables.createVariable('spacing-md', collection, 'FLOAT');
spacingVar.setValueForMode(defaultModeId, 16);
```

### STRING
Text strings. Used for font families, text content bound to variables.

```js
const fontVar = figma.variables.createVariable('font-body', collection, 'STRING');
fontVar.setValueForMode(defaultModeId, 'Inter');
```

### BOOLEAN
True/false. Used for visibility toggles, feature flags in prototyping.

```js
const showVar = figma.variables.createVariable('show-sidebar', collection, 'BOOLEAN');
showVar.setValueForMode(defaultModeId, true);
```

---

## 3. Variable Collections

A collection groups related variables and defines their modes (like light/dark). Think of a collection as a namespace with multiple value columns.

```
Collection: "Semantic Colors"
┌─────────────────────┬────────────┬────────────┐
│ Variable            │ Light      │ Dark       │
├─────────────────────┼────────────┼────────────┤
│ background          │ #FFFFFF    │ #0A0A0A    │
│ foreground          │ #0A0A0A    │ #FAFAFA    │
│ primary             │ #171717    │ #EDEDED    │
│ border              │ #E5E5E5    │ #2E2E2E    │
│ muted-foreground    │ #737373    │ #A3A3A3    │
└─────────────────────┴────────────┴────────────┘
```

### Creating a collection with modes

```js
const collection = figma.variables.createVariableCollection('Semantic Colors');
const lightModeId = collection.modes[0].modeId;
collection.renameMode(lightModeId, 'Light');
const darkModeId = collection.addMode('Dark');
```

### Reading existing collections

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
for (const col of collections) {
  console.log(col.name, col.modes); // [{modeId: '...', name: 'Light'}, ...]
  for (const varId of col.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(varId);
    console.log(v.name, v.resolvedType, v.valuesByMode);
  }
}
```

### Collection structure

```js
collection.name;         // "Semantic Colors"
collection.modes;        // [{ modeId: '1:0', name: 'Light' }, { modeId: '1:1', name: 'Dark' }]
collection.variableIds;  // ['VariableID:2:0', 'VariableID:2:1', ...]
```

---

## 4. The Three-Layer Token Architecture

Design systems use a three-layer variable structure. Each layer references the one below it:

```
Layer 1: Primitives (raw values)
    gray-50: #FAFAFA
    gray-900: #0A0A0A
    blue-500: #3B82F6
    radius-8: 8

Layer 2: Semantic (purpose-driven aliases)
    background → gray-50 (light) / gray-900 (dark)
    foreground → gray-900 (light) / gray-50 (dark)
    primary → gray-900 (light) / gray-200 (dark)

Layer 3: Component (component-specific)
    button-bg → primary
    card-bg → background
    input-border → border
```

### Implementing with variable aliases

Aliases let a variable reference another variable instead of a raw value:

```js
// Layer 1: Primitive collection (no modes — raw values)
const primitives = figma.variables.createVariableCollection('Primitives');
const gray50 = figma.variables.createVariable('gray-50', primitives, 'COLOR');
gray50.setValueForMode(primitives.modes[0].modeId, { r: 0.98, g: 0.98, b: 0.98 });

const gray900 = figma.variables.createVariable('gray-900', primitives, 'COLOR');
gray900.setValueForMode(primitives.modes[0].modeId, { r: 0.04, g: 0.04, b: 0.04 });

// Layer 2: Semantic collection (with light/dark modes)
const semantic = figma.variables.createVariableCollection('Semantic');
const lightId = semantic.modes[0].modeId;
semantic.renameMode(lightId, 'Light');
const darkId = semantic.addMode('Dark');

const bgVar = figma.variables.createVariable('background', semantic, 'COLOR');
// Light: background → gray-50 (alias)
bgVar.setValueForMode(lightId, figma.variables.createVariableAlias(gray50));
// Dark: background → gray-900 (alias)
bgVar.setValueForMode(darkId, figma.variables.createVariableAlias(gray900));
```

### Why three layers?

- **Primitives** are the raw palette. They never change between modes.
- **Semantic** tokens map primitives to purposes. They switch between modes.
- **Component** tokens map semantic tokens to specific components. They allow per-component customization.

You can skip Layer 3 (component tokens) in simpler systems. But never skip Layer 2 — hardcoding raw values means no theming.

---

## 5. Binding Variables to Nodes

### Colors (fills, strokes, text)

Colors MUST use `setBoundVariableForPaint` — not `setBoundVariable`:

```js
// Create a paint with a placeholder color
let paint = { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 };

// Bind the color variable to the paint
paint = figma.variables.setBoundVariableForPaint(paint, 'color', backgroundVar);

// Assign paint to the node
node.fills = [paint];
```

**The placeholder color matters.** It's used for rendering in the default mode. Use the light-mode resolved value as the placeholder for accurate display:

```js
// If backgroundVar resolves to white in light mode:
let paint = { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 }; // white placeholder
paint = figma.variables.setBoundVariableForPaint(paint, 'color', backgroundVar);
```

### Strokes — same pattern as fills

```js
let strokePaint = { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 }, opacity: 1 };
strokePaint = figma.variables.setBoundVariableForPaint(strokePaint, 'color', borderVar);
node.strokes = [strokePaint];
node.strokeWeight = 1;
node.strokeAlign = 'INSIDE';
```

### Dimensions (spacing, radius, size)

These use `setBoundVariable` directly on the node:

```js
// Spacing
node.setBoundVariable('paddingTop', spacingVar);
node.setBoundVariable('paddingBottom', spacingVar);
node.setBoundVariable('paddingLeft', spacingVar);
node.setBoundVariable('paddingRight', spacingVar);
node.setBoundVariable('itemSpacing', gapVar);

// Corner radius (each corner individually)
node.setBoundVariable('topLeftRadius', radiusVar);
node.setBoundVariable('topRightRadius', radiusVar);
node.setBoundVariable('bottomLeftRadius', radiusVar);
node.setBoundVariable('bottomRightRadius', radiusVar);

// Dimensions
node.setBoundVariable('width', widthVar);
node.setBoundVariable('height', heightVar);
```

### Effects

Effects use `setBoundVariableForEffect`:

```js
const effectsCopy = [...node.effects];
effectsCopy[0] = figma.variables.setBoundVariableForEffect(
  effectsCopy[0], 'radius', blurRadiusVar
);
node.effects = effectsCopy;
```

### Layout grids

```js
const gridsCopy = [...node.layoutGrids];
gridsCopy[0] = figma.variables.setBoundVariableForLayoutGrid(
  gridsCopy[0], 'count', columnCountVar
);
node.layoutGrids = gridsCopy;
```

### Visibility (boolean variables)

```js
node.setBoundVariable('visible', showSidebarVar);
// Node visibility now follows the boolean variable value
```

---

## 6. Mode Switching — How Theming Works

### Setting modes on frames

Any frame can have an explicit mode for a collection. All children inherit that mode:

```js
// Set dark mode on this frame — all descendants resolve dark values
frame.setExplicitVariableModeForCollection(semanticCollection, darkModeId);

// Clear explicit mode — inherit from parent
frame.clearExplicitVariableModeForCollection(semanticCollection);
```

### Mode inheritance

Modes cascade from parent to child, just like CSS custom properties inherit:

```
Page (no explicit mode — uses file default)
├── Light Section (explicit: Light mode)
│   ├── Card (inherits Light)
│   └── Card (inherits Light)
└── Dark Section (explicit: Dark mode)
    ├── Card (inherits Dark — all variables resolve to dark values)
    └── Card (inherits Dark)
```

### Reading resolved modes

```js
// All modes including inherited
const resolved = frame.resolvedVariableModes;
// { 'VariableCollectionId:1:0': '1:2', 'VariableCollectionId:2:0': '2:1' }

// Only modes explicitly set on this frame
const explicit = frame.explicitVariableModes;
// { 'VariableCollectionId:1:0': '1:2' }
```

### Resolving variable values for a specific context

```js
const result = variable.resolveForConsumer(frame);
// Returns: { value: { r: 0.04, g: 0.04, b: 0.04 }, resolvedType: 'COLOR' }
// The value depends on what mode the frame resolves to
```

---

## 7. Side-by-Side Theming (Light + Dark Previews)

To show both themes on the same page, create two parent frames and set different modes:

```js
// Build the design once as a function
function buildCard() {
  const card = figma.createFrame();
  // ... build structure with variable bindings ...
  return card;
}

// Light version — variables resolve to light mode by default
const lightCard = buildCard();
lightCard.name = 'Light — Card';

// Dark version — set dark mode on the frame
const darkCard = buildCard();
darkCard.name = 'Dark — Card';
darkCard.setExplicitVariableModeForCollection(semanticCollection, darkModeId);

// Position on canvas
lightCard.x = 0;
lightCard.y = 0;
darkCard.x = 0;
darkCard.y = lightCard.height + 80;
```

**Key principle:** The component code is identical. The only difference is which mode is active on the parent frame. This is why variable binding matters — one codebase, multiple themes.

---

## 8. Extended Variable Collections (Theming at Scale)

For multi-brand or multi-theme systems, Figma supports **extended collections** — a child collection that inherits from a parent and overrides specific values.

> **Enterprise-only:** Official docs state [`VariableCollection.extend`](https://developers.figma.com/docs/plugins/api/VariableCollection/) and [`extendLibraryCollectionByKeyAsync`](https://developers.figma.com/docs/plugins/api/properties/figma-variables-extendlibrarycollectionbykeyasync/) are limited to the **Enterprise** plan; calls **throw** on other tiers (e.g. `Cannot create extended collections outside of enterprise plan`). Do not use these APIs in generic agent scripts unless the org is Enterprise.

```js
// Create a base collection
const base = figma.variables.createVariableCollection('Base Theme');
// ... add variables with values ...

// Create an extended collection (theme variant) — Enterprise only
const brandTheme = base.extend('Brand A Theme');
// brandTheme inherits all variables and modes from base
// Override specific values:
const brandPrimary = await figma.variables.getVariableByIdAsync(primaryVarId);
brandPrimary.setValueForMode(brandTheme.modes[0].modeId, { r: 0, g: 0.4, b: 1 });
```

### From library collections

```js
const extended = await figma.variables.extendLibraryCollectionByKeyAsync(
  'library-collection-key',
  'My Brand Override'
);
```

### Reading overrides

```js
extended.variableOverrides;
// Map of variable IDs to their overridden values in this extended collection
```

**Use case:** A design system publishes a base theme. Each product extends it and overrides only the brand-specific tokens (primary color, font, etc.) while inheriting everything else.

---

## 9. Variable Scoping

Variables can be scoped to limit where they appear in the Figma UI:

```js
// Set code syntax for a variable (how it appears in code)
variable.setVariableCodeSyntax('WEB', '--background');
variable.setVariableCodeSyntax('ANDROID', 'colorBackground');
variable.setVariableCodeSyntax('iOS', 'backgroundColor');
```

### Scoping to specific properties

By default, a COLOR variable can be bound to any color property (fills, strokes, effects). You can restrict this:

```js
variable.scopes = ['FILL_COLOR'];
// Now this variable only appears as an option for fill colors, not strokes

// Available scopes:
// COLOR: FILL_COLOR, STROKE_COLOR, EFFECT_COLOR, TEXT_FILL_COLOR
// FLOAT: WIDTH_HEIGHT, GAP, CORNER_RADIUS, PADDING, STROKE_FLOAT, TEXT_CONTENT, EFFECT_FLOAT, OPACITY, FONT_SIZE, LINE_HEIGHT, LETTER_SPACING, PARAGRAPH_SPACING, PARAGRAPH_INDENT
```

**Why scope?** A variable named `border` should only appear for strokes and borders, not for fill colors. Scoping keeps the variable picker clean and prevents misuse.

---

## 10. Practical Token Structures

### Minimal system (2 collections)

Good for small projects:

```
Collection: "Colors" (modes: Light, Dark)
  background, foreground, card, card-foreground
  primary, primary-foreground
  secondary, secondary-foreground
  muted, muted-foreground
  border, input, ring
  destructive, destructive-foreground

Collection: "Dimensions" (no modes — single set)
  spacing-xs: 4
  spacing-sm: 8
  spacing-md: 16
  spacing-lg: 24
  spacing-xl: 32
  radius-sm: 6
  radius-md: 8
  radius-lg: 10
```

### Full system (3 collections)

Good for design systems:

```
Collection: "Primitives" (no modes)
  gray-50 through gray-950
  blue-500, red-500, green-500
  radius-4, radius-6, radius-8, radius-10
  space-4, space-8, space-12, space-16, space-20, space-24, space-32

Collection: "Semantic" (modes: Light, Dark)
  background → gray-50 / gray-950
  foreground → gray-950 / gray-50
  primary → gray-900 / gray-200
  (all semantic tokens alias into primitives)

Collection: "Component" (modes: Light, Dark)
  button-primary-bg → primary
  button-primary-fg → primary-foreground
  card-bg → card
  card-border → border
  (all component tokens alias into semantic)
```

### Typography variables

```
Collection: "Typography" (no modes)
  font-size-xs: 12
  font-size-sm: 14
  font-size-base: 16
  font-size-lg: 18
  font-size-xl: 20
  font-size-2xl: 24
  line-height-xs: 16
  line-height-sm: 20
  line-height-base: 24
  line-height-lg: 28
```

---

## 11. Variable Naming Conventions

### Flat naming (simple systems)

```
background
foreground
primary
border
muted-foreground
```

### Grouped naming (larger systems)

```
color/background
color/foreground
color/primary
spacing/sm
spacing/md
spacing/lg
radius/sm
radius/md
radius/lg
```

Figma displays `/` as folder hierarchy in the variable panel.

### Rules

- Use lowercase with hyphens: `muted-foreground` not `MutedForeground`
- Be semantic, not descriptive: `primary` not `dark-gray`, `destructive` not `red`
- Group by purpose with `/`: `color/primary`, `spacing/md`
- Keep names aligned with your CSS variables or design token names
- Never name by raw value: `gray-200` is a primitive name, not a semantic one

---

## 12. Reading and Inspecting Variables

### Get all local variables

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
for (const col of collections) {
  for (const varId of col.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(varId);
    console.log(v.name, v.resolvedType);
    for (const [modeId, value] of Object.entries(v.valuesByMode)) {
      if (value.type === 'VARIABLE_ALIAS') {
        // This value aliases another variable
        const aliased = await figma.variables.getVariableByIdAsync(value.id);
        console.log(`  Mode ${modeId}: → ${aliased.name}`);
      } else {
        console.log(`  Mode ${modeId}: ${JSON.stringify(value)}`);
      }
    }
  }
}
```

### Check what variables are bound to a node

```js
const bindings = node.boundVariables;
// {
//   fills: [{ type: 'VARIABLE_ALIAS', id: 'VariableID:28:44' }],
//   topLeftRadius: { type: 'VARIABLE_ALIAS', id: 'VariableID:30:2' },
//   itemSpacing: { type: 'VARIABLE_ALIAS', id: 'VariableID:31:0' },
// }
```

### Resolve a variable's current value for a node

```js
const variable = await figma.variables.getVariableByIdAsync('VariableID:28:44');
const result = variable.resolveForConsumer(node);
// { value: { r: 1, g: 1, b: 1 }, resolvedType: 'COLOR' }
```

---

## 13. Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `setBoundVariable` for fills | Use `setBoundVariableForPaint` on a paint object |
| Hardcoded placeholder with wrong color | Use the light-mode value as placeholder |
| Mode set on wrong frame | Set on the outermost container — children inherit |
| Modifying immutable array in place | Clone the array, modify the copy, reassign |
| Creating modes without renaming | Always rename: `collection.renameMode(id, 'Light')` |
| Variable named by value (`gray-200`) | Name by purpose (`border`, `muted`) at semantic layer |
| Missing alias chain | Semantic variables should alias primitives, not repeat raw values |
| Not scoping variables | Scope to relevant properties to keep the picker clean |
| Cross-collection aliasing issues | A variable can only alias another variable of the same type |
| Forgetting async on variable reads | `getVariableByIdAsync` and `getLocalVariableCollectionsAsync` are async |

---

## 14. Checklist: Setting Up a Theme System

```
□ Define primitive palette (raw colors, spacing values, radii)
□ Create primitive collection (single mode, raw values)
□ Define semantic tokens (map purposes to primitives)
□ Create semantic collection with Light + Dark modes
□ Set aliases: semantic → primitive for each mode
□ Bind all node properties to semantic variables (never primitives directly)
□ Test: set dark mode on a frame, verify all nodes switch correctly
□ Name variables consistently (lowercase, hyphens, semantic names)
□ Scope variables to appropriate property types
□ Document decisions in design.md
```

---

## Retrieval Queries

- Figma variables collections modes theming Plugin API
- How to create variable collections with light dark modes
- Variable binding fills strokes dimensions effects Figma
- Three-layer token architecture primitives semantic component
- Variable aliases createVariableAlias Figma Plugin API
- Mode switching setExplicitVariableModeForCollection inheritance
- Extended variable collections theming at scale
- Variable scoping setVariableCodeSyntax
- Reading inspecting variables boundVariables resolveForConsumer
- Side-by-side light dark theme previews Figma
