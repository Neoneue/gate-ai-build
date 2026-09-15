# Figma Canvas — Elements and Operations

> **Reading order:** `plugin-api.md` + `mcp-workflow.md` → `canvas-building.md` (foundations) → This file (elements, modifications, icons) → `component-architecture.md` (deep component patterns)

> **Source:** Figma Plugin API official documentation (developers.figma.com), Material Design icon guidelines (m2.material.io), Apple SF Symbols HIG (developer.apple.com), Helena Zhang "7 Principles of Icon Design" (uxdesign.cc), Lucide docs (lucide.dev).

> This file covers working with specific element types — components, effects, icons — plus page navigation, modifying existing designs, and common mistakes. For build order, auto-layout, spacing, variables, and text, see `canvas-building.md`.

---

## 1. Components and Instances

### Creating a component

```js
const button = figma.createComponent();
button.name = 'Button';
button.layoutMode = 'HORIZONTAL';
button.paddingTop = 8;
button.paddingBottom = 8;
button.paddingLeft = 16;
button.paddingRight = 16;
button.primaryAxisAlignItems = 'CENTER';
button.counterAxisAlignItems = 'CENTER';
button.itemSpacing = 8;
// Add children, fills, etc.
```

### Component properties

Four types of component properties:

```js
// TEXT — editable text content
component.addComponentProperty('Label', 'TEXT', 'Button');

// BOOLEAN — show/hide toggles
component.addComponentProperty('Show Icon', 'BOOLEAN', false);

// INSTANCE_SWAP — swap nested components (icons, avatars)
component.addComponentProperty('Icon', 'INSTANCE_SWAP', defaultIconNodeId);

// VARIANT — defined by combining as variants (not added manually)
```

### Creating variant sets

```js
// Create individual variant components
const primary = figma.createComponent();
primary.name = 'Variant=Primary, Size=Default';

const outline = figma.createComponent();
outline.name = 'Variant=Outline, Size=Default';

// Combine into a component set
const componentSet = figma.combineAsVariants([primary, outline], figma.currentPage);
componentSet.name = 'Button';
```

**Variant naming convention:** `PropertyName=Value, PropertyName=Value`. This is how Figma derives variant properties from component names.

### Instantiating and configuring

```js
// From local component
const instance = component.createInstance();

// From library component (by key)
const importedComp = await figma.importComponentByKeyAsync('component-key-here');
const instance = importedComp.createInstance();

// Set properties on instance
instance.setProperties({
  'Label#0:1': 'Click me',           // TEXT (includes #ID suffix)
  'Show Icon#0:2': true,              // BOOLEAN (includes #ID suffix)
  'Variant': 'Primary',               // VARIANT (no #ID suffix)
  'Size': 'lg',                       // VARIANT (no #ID suffix)
});

// Read current properties
const props = instance.componentProperties;
```

### Swapping components

```js
instance.swapComponent(differentComponent);
// WARNING: text reverts to new component's default — re-set if needed
const textChild = instance.findOne(n => n.type === 'TEXT');
if (textChild) {
  await figma.loadFontAsync(textChild.fontName);
  textChild.characters = 'Custom Label';
}
```

---

## 2. Effects

### Drop shadows (from a shadow scale)

```js
node.effects = [{
  type: 'DROP_SHADOW',
  color: { r: 0, g: 0, b: 0, a: 0.10 },
  offset: { x: 0, y: 1 },
  radius: 3,
  spread: 0,
  visible: true,
  blendMode: 'NORMAL'
}];

// Multiple shadows (array order = render order, first = topmost)
node.effects = [
  { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.10 },
    offset: { x: 0, y: 1 }, radius: 3, spread: 0, visible: true, blendMode: 'NORMAL' },
  { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.10 },
    offset: { x: 0, y: 2 }, radius: 4, spread: -1, visible: true, blendMode: 'NORMAL' },
];
```

**Critical:** Set `clipsContent = false` on any frame with drop shadows. `clipsContent = true` clips everything outside the frame boundary — including shadows.

### Inner shadows and blur

```js
// Inner shadow
{ type: 'INNER_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.05 },
  offset: { x: 0, y: 2 }, radius: 4, spread: 0, visible: true, blendMode: 'NORMAL' }

// Background blur (for glassmorphism)
{ type: 'BACKGROUND_BLUR', radius: 10, visible: true }

// Layer blur
{ type: 'LAYER_BLUR', radius: 4, visible: true }
```

---

## 3. Pages and Navigation

### Working with pages

```js
// List all pages
const pages = figma.root.children;

// Find a page by name
const page = figma.root.children.find(p => p.name === 'Components');

// Switch to a page — REQUIRED before modifying nodes on that page
await figma.setCurrentPageAsync(page);

// Create a new page
const newPage = figma.createPage();
newPage.name = 'New Page';
```

### Finding nodes

```js
// By ID
const node = await figma.getNodeByIdAsync('72:42');

// Search in a subtree
const allTexts = frame.findAll(n => n.type === 'TEXT');
const firstButton = frame.findOne(n => n.name === 'Button');

// Direct children only
const child = frame.children.find(c => c.name === 'Header');

// Top-level instances only (excluding nested)
const topLevel = frame.findAll(n => {
  if (n.type !== 'INSTANCE') return false;
  let parent = n.parent;
  while (parent && parent.id !== frame.id) {
    if (parent.type === 'INSTANCE') return false;
    parent = parent.parent;
  }
  return true;
});
```

---

## 4. Modifying Existing Designs

### Read before writing

Always read a node's current state before modifying. Don't assume values:

```js
const node = await figma.getNodeByIdAsync(nodeId);
// Read actual values
node.name;              // actual name — case matters
node.layoutMode;        // actual layout
node.fills;             // actual fills with variable bindings
node.boundVariables;    // what variables are bound
node.componentProperties; // for instances — actual property values
```

### Surgical edits over rebuilds

| Situation | Approach |
|-----------|----------|
| Change text | `loadFont` → set `characters` |
| Change colors | Rebind variables via `setBoundVariableForPaint` |
| Toggle visibility | `node.visible = false` (reversible) |
| Swap icon/component | `instance.swapComponent(newComp)` + re-set text |
| Add content | Create new nodes, `appendChild()` to existing frame |
| Change layout direction | Modify `layoutMode` in place |
| Full structural redesign | Rebuild — but only after confirming with user |

### Hiding vs removing

```js
node.visible = false;  // hidden but preserved — can restore
node.remove();         // permanent deletion — no undo via API
```

**Prefer `visible = false` for reversible changes.** Use `remove()` only when certain.

### Stale node references

Node references become invalid when:
- The node is removed
- The node is inside an instance that gets swapped
- The page is switched

```js
// Safe pattern: re-fetch by ID after risky operations
const id = node.id;
// ... do operations that might invalidate ...
const fresh = await figma.getNodeByIdAsync(id);
if (fresh) { /* still valid */ }
```

---

## 5. Working with Library Icons (Lucide)

Library icons like Lucide are INSTANCE nodes with internal VECTOR children. The vectors use stroke-based rendering with a color variable already bound.

### Icon internal structure
```
Icon / Check (INSTANCE, 24x24)
  fills: []        ← empty — no background on the instance
  strokes: []      ← empty at instance level
  └── Vector (VECTOR)
        fills: []  ← empty — icons are stroke-based, not filled
        strokes: [{ color bound to 'base/foreground' variable }]
        strokeWeight: 2
```

### Correct workflow
```js
// 1. Import by component key
const comp = await figma.importComponentByKeyAsync('icon-key-here');

// 2. Instantiate
const icon = comp.createInstance();
icon.name = 'Status Icon';

// 3. Resize if needed
icon.resize(20, 20);

// 4. Adjust strokeWeight for optical balance (OPTIONAL)
const vector = icon.findOne(n => n.type === 'VECTOR');
if (vector) {
  vector.strokeWeight = 1.5; // match visual weight of accompanying text
}

// 5. Append to parent
parent.appendChild(icon);

// 6. DONE — don't touch fills or stroke color
```

### Stroke weight — matching icons to typography

Icon stroke weight is a design decision grounded in optical balance with the surrounding typography. The principle comes from three authoritative sources:

**Material Design** (m2.material.io/design/iconography/system-icons): System icons use a consistent 2dp stroke width across all instances at the standard 24dp size. This unifies the icon family visually.

**Apple SF Symbols** (developer.apple.com/design/human-interface-guidelines/sf-symbols): SF Symbols ship in nine weights — from Ultralight to Black — that match the San Francisco system font weights. Icons automatically align with text in all weights and sizes. The key insight: **icon weight should match font weight**, not font size.

**Helena Zhang, "7 Principles of Icon Design"** (uxdesign.cc): Visual weight of an icon is determined by fill, stroke thickness, size, and shape. Keeping these parameters consistent across a set builds harmony. Icons should be optically balanced with surrounding text — not just geometrically centered.

**Lucide defaults** (lucide.dev/guide/basics/stroke-width): Lucide icons default to 2px stroke width at 24px. The `absoluteStrokeWidth` prop prevents stroke from scaling with icon size. In Figma, stroke weight stays fixed when you resize an instance.

**The rule: match icon stroke weight to the font weight of accompanying text.**

| Text Weight | Font Weight Value | Icon Size | Icon Stroke |
|-------------|-------------------|-----------|-------------|
| Bold | 700 | 20-24px | 2px |
| Semi Bold | 600 | 16-20px | 2px |
| Medium | 500 | 16px | 1.5px |
| Regular (14px+) | 400 | 16px | 1.5px |
| Regular (12px) | 400 | 14px | 1px |
| Light | 300 | 14px | 1px |

This is optical, not mathematical. The icon should feel the same visual density as the text beside it. When in doubt:
- Bold text demands bold strokes (2px) — a thin icon next to bold text looks weak
- Regular text at small sizes demands lighter strokes — a thick icon next to light text overpowers it
- Always squint-test: blur your eyes and check if the icon and text feel the same weight

**Use `rescale()`, not `resize()`, to change icon size.** Per the Plugin API (e.g. [`rescale` on scene nodes](https://developers.figma.com/docs/plugins/api/SliceNode/#rescalescale-number-void)), `rescale(scale)` matches the **Scale tool** — it scales the node proportionally, including vector geometry. `resize(w, h)` changes the outer box and can distort vector children when misused.

```js
// RIGHT — scale icon from 24px to 16px proportionally
icon.rescale(16 / 24); // Scale factor = target / current

// WRONG — stretches the frame, distorts vector paths
icon.resize(16, 16);
```

**After rescaling, stroke weight scales too.** A 24px icon with 2px stroke rescaled to 16px will have ~1.33px stroke. If you need a specific weight, set it explicitly after scaling:
```js
icon.rescale(16 / 24);
const vector = icon.findOne(n => n.type === 'VECTOR');
if (vector) vector.strokeWeight = 1.5;
```

**Never detach icon instances to resize them.** Detaching destroys the component link and turns the instance into a raw frame with loose vectors. Work with the instance directly — both `rescale()` and `strokeWeight` work on instances.

### What NOT to do
```js
// WRONG — creates a filled rectangle behind the icon vectors
icon.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 }];

// WRONG — overrides the library's variable binding on the vector strokes
const vec = icon.findOne(n => n.type === 'VECTOR');
vec.strokes = [myCustomPaint]; // breaks the base/foreground variable binding

// RIGHT — the icon color is already bound to base/foreground
// It resolves automatically when a parent frame has dark mode set
// Just resize and adjust strokeWeight if needed
```

### Theming
Icon color adapts automatically via the `base/foreground` variable. When a parent frame has `setExplicitVariableModeForCollection(collection, darkModeId)`, all icon strokes resolve to the dark foreground color. No manual color intervention needed.

---

## 6. Common Mistakes and Fixes

| Mistake | Cause | Fix |
|---------|-------|-----|
| Invisible shadows | `clipsContent = true` on frame with drop shadow | Set `clipsContent = false` |
| FILL doesn't work | Set before appending to auto-layout parent | Append first, set sizing after |
| resize() breaks hug | `resize()` sets both axes to FIXED | Re-set `primaryAxisSizingMode = 'AUTO'` after resize |
| Text not showing | Font not loaded before setting characters | `await figma.loadFontAsync(...)` before text changes |
| Colors not variable-bound | Used `setBoundVariable` for fills | Use `setBoundVariableForPaint` on a paint object |
| Wrong variant applied | Case mismatch in property names | Read `componentPropertyDefinitions` — use exact names |
| findAll returns too many | Returns nested instance children | Filter by parent chain for top-level only |
| Cross-page edits fail | Operating on nodes from non-current page | `await figma.setCurrentPageAsync(page)` first |
| Immutable array error | Modifying fills/strokes in place | Clone array, modify copy, reassign: `node.fills = [...]` |
| Layout jumps after resize | resize() on auto-layout frame | Avoid resize on auto-layout; use sizing modes instead |
| Icon renders as filled rectangle | Set fills on icon instance frame | Don't touch icon fills — icons are stroke-based vectors |
| Icon color doesn't theme | Overrode vector stroke with custom paint | Don't override stroke color — library variable handles theming |
| Icon too heavy at small sizes | Default 2px stroke at 12-16px size | Adjust strokeWeight on vector child to match text weight optically |
| Icon vectors distorted after sizing | Used `resize()` instead of `rescale()` | Use `rescale(factor)` — equivalent to Scale Tool, preserves vector paths |
| Icon detached and broken | Detached instance to resize/modify | Never detach — use `rescale()` and `strokeWeight` on the instance directly |
| Icon wrapped in extra frame | Manually created wrapper around icon instance | Icon components already have their own frame — just place the instance |

---

## 7. Pre-Build Checklist

Before writing canvas code:

```
□ Read system.md — know your tokens and personality direction
□ Read canvas-building.md — know the build order
□ Define information hierarchy — primary, secondary, tertiary
□ Plan the frame tree — sketch the nesting structure
□ List which variables to bind
□ Check existing components — search before building custom
□ Plan build order — inside-out, bottom-up, variables last
```

After every canvas modification:

```
□ Take a screenshot immediately
□ Study the screenshot — describe what you see
□ Check hierarchy — does primary content read first?
□ Check spacing — tight within groups, generous between?
□ Check variable binding — no hardcoded colors?
□ Check clipsContent — shadows not clipped?
□ Verify on both modes if applicable
```

---

## Retrieval Queries

- Creating components variants instances Figma Plugin API
- Figma effects drop shadow inner shadow clipsContent
- Modifying existing Figma designs without rebuilding
- Common Figma Plugin API mistakes and fixes
- Dark mode light mode variable modes Figma Plugin API
- Working with Lucide icons in Figma stroke weight optical balance
- Icon stroke weight matching font weight typography
- Figma pages navigation finding nodes
