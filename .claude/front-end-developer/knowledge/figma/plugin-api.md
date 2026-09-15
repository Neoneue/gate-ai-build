# Figma Plugin API — Practical Reference

> **Reading order:** Read this before any Figma MCP work. This covers how Figma actually works — not design methodology, not UI kits, not CSS frameworks. Pure Figma.

---

## MCP execution vs the desktop UI

Code you send through the Figma MCP tool **`use_figma`** runs as **Plugin API** JavaScript with the global `figma` object — see Figma’s [Write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/). You are **not** automating clicks in the editor chrome; you **mutate the document** (nodes, variables, styles) the same way a plugin would. Human designers use panels and shortcuts; agents set properties in code. Outcomes can match if you follow the same model: **pages → frames → auto-layout → instances/variables/modes**.

Official MCP docs list **beta limits** for that path — see [Write to canvas → Current limitations](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/).

### `createAutoLayout` (MCP / Plugin API)

Figma documents [`figma.createAutoLayout`](https://developers.figma.com/docs/plugins/api/properties/figma-createautolayout/) as creating a frame with auto layout already enabled (both axes default to hug content). The same API reference states this API is **available via `use_figma` in the MCP server**; use it when it simplifies “append child then set FILL” flows. Prefer reading the current Plugin API page for full behavior.

---

## Dynamic page loading (large files)

Figma is moving toward **on-demand page loading**. For plugins (including MCP `use_figma`), that means:

- Prefer **`figma.getNodeByIdAsync`** over deprecated sync patterns where your manifest uses dynamic document access.
- Before traversing all pages or deep trees, use **`figma.loadAllPagesAsync()`** and/or **`PageNode.loadAsync()`** as described in Figma’s [Migrating to dynamic page loading](https://developers.figma.com/docs/plugins/migrating-to-dynamic-loading/) and [DocumentNode](https://developers.figma.com/docs/plugins/api/DocumentNode/) / [PageNode](https://developers.figma.com/docs/plugins/api/PageNode/) references.

If a script “sees” empty `children` or missing nodes, **load the page first** rather than assuming the ID is wrong.

---

## Core Concepts

### Everything is a Node
Figma's document is a tree: `Document → Page → Frame/Group/Component → children`. Every element has an `id`, `name`, `type`, and position (`x`, `y`).

### Immutable Arrays
Fills, strokes, effects, and layout grids are **immutable arrays**. You cannot modify them in place. You must clone, modify, and set back:

```js
// WRONG — does nothing
node.fills[0].color = { r: 1, g: 0, b: 0 };

// RIGHT — clone, modify, reassign
const fills = [...node.fills];
fills[0] = { ...fills[0], color: { r: 1, g: 0, b: 0 } };
node.fills = fills;
```

This applies to `fills`, `strokes`, `effects`, and `layoutGrids`.

### Frame Fills Are Backgrounds
Frame fills render BEHIND children. A fill on a frame does NOT obscure text or other child nodes inside it. Children always render on top of the frame's fill. This is fundamental — never avoid adding fills to frames out of fear of hiding content.

---

## Frames & Auto-Layout

### Creating a Frame
```js
const frame = figma.createFrame();
frame.name = 'Card';
frame.resize(400, 300); // width, height
```

### Auto-Layout
```js
frame.layoutMode = 'VERTICAL';  // or 'HORIZONTAL', 'NONE', 'GRID'
frame.itemSpacing = 16;         // gap between children
frame.paddingTop = 24;
frame.paddingBottom = 24;
frame.paddingLeft = 24;
frame.paddingRight = 24;
```

### Sizing Modes
```js
// Primary axis = direction of layout (vertical → height, horizontal → width)
frame.primaryAxisSizingMode = 'AUTO';   // hug content
frame.primaryAxisSizingMode = 'FIXED';  // fixed size

// Counter axis = perpendicular
frame.counterAxisSizingMode = 'AUTO';   // hug
frame.counterAxisSizingMode = 'FIXED';  // fixed
```

**Critical rule:** `resize()` sets BOTH axes to FIXED, overriding any AUTO mode. If you need fixed width + hugging height:
```js
frame.resize(400, 1);                    // sets both to FIXED
frame.primaryAxisSizingMode = 'AUTO';    // override back to hug on primary axis
```
Always set sizing modes AFTER resize. Better yet, avoid resize on auto-layout frames entirely.

### Child Sizing
```js
// Children inside auto-layout can fill or hug
child.layoutSizingHorizontal = 'FILL';  // stretch to fill parent width
child.layoutSizingVertical = 'HUG';     // hug content height

// IMPORTANT: layoutSizingHorizontal = 'FILL' can ONLY be set AFTER
// the child is appended to an auto-layout parent
parent.appendChild(child);
child.layoutSizingHorizontal = 'FILL';  // works
```

### Alignment
```js
// Align children along primary axis
frame.primaryAxisAlignItems = 'MIN';           // start
frame.primaryAxisAlignItems = 'CENTER';        // center
frame.primaryAxisAlignItems = 'MAX';           // end
frame.primaryAxisAlignItems = 'SPACE_BETWEEN'; // distribute

// Align children along counter axis
frame.counterAxisAlignItems = 'MIN';      // top/left
frame.counterAxisAlignItems = 'CENTER';   // center
frame.counterAxisAlignItems = 'MAX';      // bottom/right
frame.counterAxisAlignItems = 'BASELINE'; // text baseline alignment
```

### Spacing Rules
- Use `itemSpacing` for gaps between children
- Use `paddingTop/Bottom/Left/Right` for internal padding
- For different gaps between sections, use wrapper frames with different `paddingTop` values

### Wrapping
```js
frame.layoutWrap = 'WRAP';          // children wrap to next line
frame.counterAxisSpacing = 8;       // gap between wrapped rows
```

---

## Fills & Strokes

### Setting Fills
```js
// Solid fill
node.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 }];

// Multiple fills (first in array = visually on top)
node.fills = [
  { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.3 },  // overlay
  { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 },     // base
];

// No fill
node.fills = [];
```

### Setting Strokes
```js
node.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 }, opacity: 1 }];
node.strokeWeight = 1;
node.strokeAlign = 'INSIDE';  // or 'OUTSIDE', 'CENTER'
```

### Binding Variables to Fills/Strokes
You CANNOT use `setBoundVariable` for fills or strokes. You MUST use `setBoundVariableForPaint`:

```js
// WRONG — throws "fills and strokes variable bindings must be set on paints directly"
node.setBoundVariable('fills', 0, colorVariable);

// RIGHT — create paint, bind variable, set on node
let paint = { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 };
paint = figma.variables.setBoundVariableForPaint(paint, 'color', colorVariable);
node.fills = [paint];

// The initial color { r: 1, g: 1, b: 1 } is a PLACEHOLDER.
// The variable binding overrides it at render time.
// The placeholder is required by the API — you cannot skip it.
```

### Binding Variables to Strokes
Same pattern as fills:
```js
let strokePaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 };
strokePaint = figma.variables.setBoundVariableForPaint(strokePaint, 'color', borderVariable);
node.strokes = [strokePaint];
```

---

## Variables & Modes

### Variable Collections and Modes
A variable collection groups related variables and can have multiple modes (e.g., Light/Dark):

```js
const collection = figma.variables.createVariableCollection('Semantic');
collection.renameMode(collection.modes[0].modeId, 'Light');
const darkModeId = collection.addMode('Dark');
```

### Creating Variables
```js
const colorVar = figma.variables.createVariable('primary', collection, 'COLOR');
colorVar.setValueForMode(lightModeId, { r: 0, g: 0, b: 0 });
colorVar.setValueForMode(darkModeId, { r: 1, g: 1, b: 1 });
```

### Variable Aliases (Semantic → Primitive)
```js
const alias = figma.variables.createVariableAlias(primitiveVariable);
semanticVariable.setValueForMode(lightModeId, alias);
```

### Setting Modes on Frames
Frames can have an explicit mode that all children inherit:

```js
// Set dark mode on a frame — all child nodes resolve variables in dark mode
frame.setExplicitVariableModeForCollection(collection, darkModeId);

// Check what mode a frame uses
frame.explicitVariableModes;   // explicitly set modes
frame.resolvedVariableModes;   // resolved modes (including inherited)

// Clear explicit mode (inherit from parent)
frame.clearExplicitVariableModeForCollection(collection);
```

### Binding Variables to Simple Properties
```js
// Width, height, corner radius, padding, etc.
node.setBoundVariable('width', floatVariable);
node.setBoundVariable('cornerRadius', radiusVariable);
node.setBoundVariable('paddingTop', spacingVariable);
node.setBoundVariable('itemSpacing', gapVariable);
```

### Reading Variable Values
```js
const variable = await figma.variables.getVariableByIdAsync('VariableID:28:44');
const value = variable.valuesByMode[modeId];
// value is { r, g, b, a } for COLOR, number for FLOAT
// or { type: 'VARIABLE_ALIAS', id: '...' } for aliases
```

### Getting All Variables
```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
for (const col of collections) {
  for (const varId of col.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(varId);
    // v.name, v.valuesByMode, v.resolvedType
  }
}
```

---

## Text

### Creating Text
```js
const text = figma.createText();
// MUST load font before setting characters
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
text.characters = 'Hello world';
```

### Font Loading
You MUST load a font before modifying text properties. This is async:
```js
await figma.loadFontAsync(textNode.fontName);  // load current font
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });  // load specific
// Note: "Semi Bold" has a space. "Extra Bold" has a space. Not "SemiBold".
```

### Text Properties
```js
text.fontSize = 14;
text.lineHeight = { unit: 'PIXELS', value: 20 };  // or { unit: 'PERCENT', value: 150 }
text.fontName = { family: 'Inter', style: 'Medium' };
text.textAlignHorizontal = 'LEFT';  // 'CENTER', 'RIGHT', 'JUSTIFIED'
text.textAlignVertical = 'TOP';     // 'CENTER', 'BOTTOM'
text.letterSpacing = { unit: 'PERCENT', value: 0 };
```

### Text Styles
```js
// Create
const style = figma.createTextStyle();
style.name = 'text-sm/leading-normal/medium';
style.fontSize = 14;
style.lineHeight = { unit: 'PIXELS', value: 20 };
style.fontName = { family: 'Inter', style: 'Medium' };

// Apply to a text node — prefer async (official: assigning `textStyleId` is deprecated; throws under `documentAccess: "dynamic-page"`)
await figma.loadFontAsync(textNode.fontName); // fonts for the node must be loaded
await textNode.setTextStyleIdAsync(style.id);

// List local text styles — prefer async (`getLocalTextStyles` is deprecated per Plugin API updates)
const styles = await figma.getLocalTextStylesAsync();
```

See [TextNode → setTextStyleIdAsync](https://developers.figma.com/docs/plugins/api/TextNode/#settextstyleidasync) and the deprecations list in [Plugin API updates](https://developers.figma.com/docs/plugins/updates/page/5/).

### Text Fill Color
Text color is set via fills, same as any other node:
```js
let paint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 };
paint = figma.variables.setBoundVariableForPaint(paint, 'color', foregroundVar);
textNode.fills = [paint];
```

---

## Components & Instances

### Creating a Component
```js
const component = figma.createComponent();
component.name = 'Button';
component.layoutMode = 'HORIZONTAL';
// Add children, set fills, etc.
```

### Component Sets (Variant Groups)
A component set groups multiple component variants:
```js
const variants = [primaryComponent, outlineComponent, ghostComponent];
const componentSet = figma.combineAsVariants(variants, parentFrame);
componentSet.name = 'Button';
```

### Component Properties
```js
// Add properties to a component
component.addComponentProperty('Label', 'TEXT', 'Button');
component.addComponentProperty('Show Icon', 'BOOLEAN', false);
component.addComponentProperty('Icon', 'INSTANCE_SWAP', defaultIconNodeId);

// Read property definitions
component.componentPropertyDefinitions;
// { 'Label#0:1': { type: 'TEXT', defaultValue: 'Button' }, ... }
```

### Creating Instances
```js
const instance = component.createInstance();
instance.x = 100;
instance.y = 200;

// Add to a parent
parent.appendChild(instance);
```

### Swapping Component on Instance
Changes which component an instance points to — preserves position and overrides where possible:
```js
instance.swapComponent(differentComponent);
```

### Setting Instance Properties
Per [InstanceNode → setProperties](https://developers.figma.com/docs/plugins/api/InstanceNode/#setproperties): property names must match `componentPropertyDefinitions` (with `#…` suffix for `TEXT`, `BOOLEAN`, and `INSTANCE_SWAP`). **`SLOT` properties are not supported** — calling `setProperties` for a slot throws **`cannotSetSlotProperty`**. On name collision, **`VARIANT` properties take priority**.

```js
// Set text, boolean, variant properties
instance.setProperties({
  'Label#0:1': 'Click me',
  'Show Icon#0:2': true,
  'Size': 'Large',  // variant property (no #ID suffix for variants)
});

// Read current properties
instance.componentProperties;
```

### Instance Text Overrides
To change text inside an instance, find the text node and modify it:
```js
const textNode = instance.findOne(n => n.type === 'TEXT');
await figma.loadFontAsync(textNode.fontName);
textNode.characters = 'New label';
```
**Warning:** For component instances with TEXT properties, prefer `setProperties` over direct text editing. Direct edits may create overrides that conflict with component properties.

---

## Pages & Navigation

### Working with Pages
```js
// List all pages
const pages = figma.root.children;

// Find a page by name
const page = figma.root.children.find(p => p.name === 'Components');

// Switch to a page (REQUIRED before modifying nodes on that page)
await figma.setCurrentPageAsync(page);

// Create a new page
const newPage = figma.createPage();
newPage.name = 'New Page';
```

### Finding Nodes
```js
// By ID (prefer async in dynamic-page / MCP contexts)
const node = await figma.getNodeByIdAsync('72:42');

// Find in a subtree
const texts = frame.findAll(n => n.type === 'TEXT');
const firstButton = frame.findOne(n => n.name === 'Button');

// Find children (direct only)
const child = frame.children.find(c => c.name === 'Header');
```

---

## Common Gotchas

### 1. resize() Sets Both Axes to FIXED
`resize()` overrides any AUTO sizing mode on both axes:
```js
frame.resize(400, 1);
frame.primaryAxisSizingMode = 'AUTO';  // re-set after resize
```

### 2. Fills/Strokes Use Paint Binding, Not Node Binding
`setBoundVariable` does not work on fills or strokes. Use `setBoundVariableForPaint` on a paint object:
```js
let paint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 };
paint = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
node.fills = [paint];
```

### 3. layoutSizingHorizontal Requires Auto-Layout Parent
`layoutSizingHorizontal = 'FILL'` only works after the node is appended to an auto-layout parent:
```js
parent.appendChild(child);
child.layoutSizingHorizontal = 'FILL';
```

### 4. Font Loading is Mandatory and Async
Modifying text properties without loading the font first throws an error:
```js
await figma.loadFontAsync(text.fontName);
text.characters = 'Hello';
```

### 5. Font Style Names Have Spaces
```js
{ family: 'Inter', style: 'Semi Bold' }   // not 'SemiBold'
{ family: 'Inter', style: 'Extra Bold' }   // not 'ExtraBold'
{ family: 'Inter', style: 'Extra Light' }  // not 'ExtraLight'
```

### 6. Instance Children Have Compound IDs
Instance children have IDs like `I155:982;131:2522`. These are valid but become stale if the instance is removed. When iterating instances, filter by `node.type === 'INSTANCE'` to avoid processing nested internal nodes.

### 7. Variable Placeholder Colors Affect Rendering
`setBoundVariableForPaint` requires a SolidPaint with an initial color. This color is used for rendering — use the variable's light mode resolved color, not an arbitrary gray:
```js
// Use the actual light mode value as initial color
let paint = { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 }; // white = --card light
paint = figma.variables.setBoundVariableForPaint(paint, 'color', cardVar);
// Renders white in light mode, variable resolves to dark in dark mode
```

### 8. setCurrentPageAsync Before Cross-Page Operations
You must switch to a page before creating or modifying nodes on it:
```js
await figma.setCurrentPageAsync(targetPage);
// Now you can create/modify nodes on targetPage
```

### 9. findAll Returns Nested Instance Children
`frame.findAll(n => n.type === 'INSTANCE')` returns BOTH top-level instances AND nested instances inside them (icons, etc.). Filter by checking parent chain if you only want top-level:
```js
const topLevelInstances = frame.findAll(n => {
  if (n.type !== 'INSTANCE') return false;
  let parent = n.parent;
  while (parent && parent.id !== frame.id) {
    if (parent.type === 'INSTANCE') return false;
    parent = parent.parent;
  }
  return true;
});
```

### 10. clipsContent Masks Drop Shadows
`clipsContent = true` clips everything outside the frame boundary — including drop shadows, glows, and any child overflow. This matches “clip to frame” behavior in the UI. See [FrameNode → clipsContent](https://developers.figma.com/docs/plugins/api/FrameNode/#clipscontent-boolean).

```js
// clipsContent = true — shadow may be clipped / not visible outside bounds
// clipsContent = false — content and effects can extend outside the frame bounds
```

Set `clipsContent = false` when drop shadows or overflowing children should remain visible. (The API docs do not state a universal default for every creation path; if clipping surprises you, inspect or set this property explicitly.)

### 11. Library Content Appears as INSTANCE Nodes
Published library components (like Lucide icons) appear as INSTANCE nodes in consuming files, not COMPONENT nodes. `findAll(n => n.type === 'COMPONENT')` returns 0 for library content. Use `type === 'INSTANCE'` to find them, then resolve the main component **asynchronously** (sync `mainComponent` is deprecated; prefer [`getMainComponentAsync`](https://developers.figma.com/docs/plugins/api/InstanceNode/#getmaincomponentasync)) and `importComponentByKeyAsync` to create new instances:
```js
const icons = page.findAll(n => n.type === 'INSTANCE' && n.name.includes('Icon /'));
const icon = icons[0];
const main = await icon.getMainComponentAsync();
if (!main) throw new Error('Main component unavailable');
const comp = await figma.importComponentByKeyAsync(main.key);
const newInstance = comp.createInstance();
```

### 12. Component Swaps May Reset Text
After `swapComponent()`, the instance text reverts to the new component's default. Re-set text if needed:
```js
instance.swapComponent(newComponent);
const text = instance.findOne(n => n.type === 'TEXT');
if (text) {
  await figma.loadFontAsync(text.fontName);
  text.characters = 'My custom label';
}
```

---

## Effects & Rendering

### Drop Shadows
```js
node.effects = [
  {
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offset: { x: 0, y: 1 },
    radius: 3,
    spread: 0,
    visible: true,
    blendMode: 'NORMAL'
  }
];
// Multiple shadows: array order = render order (first = topmost)
```

### Inner Shadows & Blur
```js
// Inner shadow
{ type: 'INNER_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.05 }, offset: { x: 0, y: 2 }, radius: 4, spread: 0, visible: true, blendMode: 'NORMAL' }

// Background blur
{ type: 'BACKGROUND_BLUR', radius: 10, visible: true }

// Layer blur
{ type: 'LAYER_BLUR', radius: 4, visible: true }
```

### Absolute Positioning in Auto-Layout
Auto-layout frames can have children that opt out of the flow:
```js
child.layoutPositioning = 'ABSOLUTE';  // opts out of auto-layout flow
child.x = 10;  // manual position relative to parent
child.y = 10;
```

**Z-order rule:** In Figma, children render in array order — first child (index 0) is at the BACK, last child is at the FRONT. This applies to both auto-layout and absolute children. Use `insertChild(0, node)` to place behind other content.

**Interaction with auto-layout:** Absolute children don't affect the parent's auto-layout sizing. They float above or behind the flow children depending on their index in the children array.

### Opacity & Blend Mode
```js
node.opacity = 0.5;           // 0 to 1
node.blendMode = 'MULTIPLY';  // or 'NORMAL', 'SCREEN', 'OVERLAY', etc.
```

---

## Library Components

### Finding Library Content
Published library components appear as INSTANCE nodes in consuming files. Their main component lives in the library file, not locally.

```js
// Step 1: Find instances on the page
const icons = page.findAll(n => n.type === 'INSTANCE' && n.name.includes('Icon /'));
const icon = icons[0];

// Step 2: Main component — use getMainComponentAsync() (sync `mainComponent` is deprecated)
const mainComp = await icon.getMainComponentAsync(); // null if unavailable
const compKey = mainComp?.key;
const compName = mainComp?.name;

// Step 3: Import and instantiate (guard if main component unavailable)
if (!compKey) throw new Error('Main component not loaded');
const comp = await figma.importComponentByKeyAsync(compKey);
const newInstance = comp.createInstance();
```

### Reading Node Bindings
```js
// What variables are bound to this node?
node.boundVariables;
// Returns: { fills: [VariableAlias], strokes: [VariableAlias], cornerRadius: VariableAlias, ... }

// What mode is this node resolving?
node.resolvedVariableModes;   // all modes (inherited + explicit)
node.explicitVariableModes;   // only explicitly set modes

// What component properties does this instance have?
instance.componentProperties;
// Returns: { 'Size': { type: 'VARIANT', value: 'lg' }, 'Label#0:1': { type: 'TEXT', value: 'Button' } }
```

---

## Node Lifecycle & Safe Modifications

### Removing Nodes
```js
node.remove();  // permanently deletes the node
// After removal, any reference to this node or its children is INVALID
// Do not access node.id, node.parent, etc. after remove()
```

### Hiding vs Removing
```js
node.visible = false;  // hides but preserves — can be restored
node.remove();         // destroys the node in the document
```

**Undo:** Per [figma.commitUndo](https://developers.figma.com/docs/plugins/api/properties/figma-commitundo/), plugin actions are **not** committed to the editor’s undo history **by default**; call `figma.commitUndo()` to group steps so the user can undo them. Do not assume you can “undo” a `remove()` from code without that history model — treat `remove()` as destructive for your script’s references either way.

### Stale References
Node references become invalid when:
- The node is removed (`node.remove()`)
- The node is inside an instance that gets swapped (`swapComponent`)
- The page is switched and the node is on a different page

```js
// SAFE pattern: re-fetch by ID after operations that might invalidate
const id = node.id;
// ... do some operations ...
const freshRef = await figma.getNodeByIdAsync(id);  // prefer async (required under dynamic document access)
if (freshRef) { /* still valid */ }
```

### Modifying Existing Designs
Available approaches for changing existing content without recreating:
- Modify properties in place: `node.fills = [...]`, `node.cornerRadius = ...`
- Swap components on instances: `instance.swapComponent(newComp)`
- Reparent nodes: `newParent.appendChild(existingNode)`
- Hide nodes: `node.visible = false`

---

## Retrieval Queries

- Figma Plugin API reference for variables fills strokes auto-layout
- How to bind variables to paints in Figma setBoundVariableForPaint
- Figma auto-layout sizing modes primaryAxisSizingMode counterAxisSizingMode
- Creating components variants instances in Figma Plugin API
- Figma variable modes dark mode light mode setExplicitVariableModeForCollection
- Common Figma Plugin API mistakes and gotchas
- How fills strokes and children render in Figma frames
- Working with text nodes fonts and text styles in Figma
