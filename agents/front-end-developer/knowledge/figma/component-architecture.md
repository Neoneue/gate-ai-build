# Figma Component Architecture — Building Flexible, Reusable Components

> **Reading order:** `plugin-api.md` → `mcp-workflow.md` (e.g. `search_design_system`, `use_figma`) → `canvas-building.md` → This file → `variables-and-theming.md`

> **Source:** Figma Plugin API official documentation (developers.figma.com), Figma component property typings, Figma plugin-samples.

> This file teaches how to architect Figma components that work like a human designer built them — flexible, maintainable, and properly structured for design systems.

---

## 1. Component vs Frame — When to Componentize

Not everything should be a component. Components exist to enable **reuse with controlled variation.**

**Make it a component when:**
- It appears in multiple places across the file or project
- It has defined states (hover, focus, disabled, pressed)
- It has configurable content (text, icons, visibility toggles)
- It's part of a design system (buttons, inputs, cards, badges)

**Keep it as a frame when:**
- It's a one-off layout specific to a single page
- It has no meaningful states or variants
- Making it a component would add complexity without reuse benefit

**Rule:** A component with zero instances is waste. A repeated pattern without a component is technical debt.

---

## 2. Component Anatomy

A Figma component is a frame that can be instantiated. Instances inherit the component's structure and can override specific properties.

```js
// Create a component (same as creating a frame, but reusable)
const button = figma.createComponent();
button.name = 'Button';
button.layoutMode = 'HORIZONTAL';
button.primaryAxisAlignItems = 'CENTER';
button.counterAxisAlignItems = 'CENTER';
button.itemSpacing = 8;
button.paddingTop = 10;
button.paddingBottom = 10;
button.paddingLeft = 16;
button.paddingRight = 16;
```

### Convert existing frame to component

```js
const component = figma.createComponentFromNode(existingFrame);
// The frame is replaced by a component with the same children and properties
```

---

## 3. The Four Property Types

Component properties make components configurable without detaching instances. There are exactly four types:

### VARIANT — Switches between component states

Variant properties are defined by the naming convention of components inside a component set. Each component's name encodes its variant values:

```
Button / Variant=Primary, Size=Default, State=Default
Button / Variant=Primary, Size=Default, State=Hover
Button / Variant=Outline, Size=lg, State=Disabled
```

Figma parses these names to create variant properties automatically.

**When to use:** Visual states (Default/Hover/Focus/Disabled/Pressed), size variations (sm/Default/lg), style variations (Primary/Outline/Ghost).

**API — reading variant options:**
```js
const definitions = componentSet.componentPropertyDefinitions;
// {
//   Variant: { type: 'VARIANT', defaultValue: 'Primary', variantOptions: ['Primary', 'Outline', 'Ghost', ...] },
//   Size:    { type: 'VARIANT', defaultValue: 'Default', variantOptions: ['sm', 'Default', 'lg', 'icon'] },
//   State:   { type: 'VARIANT', defaultValue: 'Default', variantOptions: ['Default', 'Hover', 'Focus', ...] },
// }
```

**API — setting on an instance:**
```js
instance.setProperties({
  'Variant': 'Primary',     // no #ID suffix for VARIANT properties
  'Size': 'lg',
  'State': 'Hover',
});
```

**Critical:** Variant property values are **case-sensitive**. `'Default'` is not `'default'`. Always read `variantOptions` from the component set to get the exact strings.

### BOOLEAN — Show/hide toggles

Controls visibility of nested layers. Used for optional elements like icons, badges, labels.

```js
// Adding to a component
const propName = component.addComponentProperty('Show Icon', 'BOOLEAN', false);
// Returns: 'Show Icon#0:1' (name with unique ID suffix)
```

**When to use:** Optional left/right icons on buttons, optional descriptions on cards, optional badges, any element that may or may not be present.

**API — setting on an instance:**
```js
instance.setProperties({
  'Show Icon#0:1': true,    // BOOLEAN uses the full name with #ID suffix
});
```

### TEXT — Editable text content

Exposes a text node's content as a property. Users can change the text without entering the component.

```js
const propName = component.addComponentProperty('Label', 'TEXT', 'Button');
// Returns: 'Label#0:2'
```

**When to use:** Button labels, card titles, badge text, any text the consumer needs to customize.

**API — setting on an instance:**
```js
instance.setProperties({
  'Label#0:2': 'Submit Order',
});
```

### INSTANCE_SWAP — Swap nested components

Allows consumers to swap a nested component instance for a different one. Most commonly used for icons.

```js
const propName = component.addComponentProperty('Icon', 'INSTANCE_SWAP', defaultIconNodeId);
// Returns: 'Icon#0:3'
```

**Preferred values** constrain what can be swapped in:
```js
component.addComponentProperty('Icon', 'INSTANCE_SWAP', defaultIconId, {
  preferredValues: [
    { type: 'COMPONENT', key: 'specificIconKey' },
    { type: 'COMPONENT_SET', key: 'iconSetKey' },  // allows any variant from a set
  ]
});
```

**When to use:** Icons in buttons, avatars in user cards, status icons in badges, any nested component that varies by context.

**API — setting on an instance:**
```js
instance.setProperties({
  'Icon#0:3': importedIconComponent.id,  // node ID of the component to swap in
});
```

### Property Name Format

- **VARIANT** properties: plain names without suffix (`'Size'`, `'State'`)
- **BOOLEAN, TEXT, INSTANCE_SWAP** properties: names with `#ID` suffix (`'Label#0:1'`, `'Show Icon#0:2'`)
- The `#ID` suffix is a unique identifier. Use the full string from `componentPropertyDefinitions`.
- When setting properties with `setProperties()`, VARIANT names take priority if there's a collision.
- **`SLOT` properties:** [InstanceNode → setProperties](https://developers.figma.com/docs/plugins/api/InstanceNode/#setproperties) documents that **`SLOT` is not supported** and throws **`cannotSetSlotProperty`**.

---

## 4. Component Sets (Variant Groups)

A component set groups related component variants into a single switchable component.

### Creating a component set

```js
// 1. Create individual variant components with naming convention
const primaryDefault = figma.createComponent();
primaryDefault.name = 'Variant=Primary, Size=Default, State=Default';
// ... build internal structure ...

const primaryHover = figma.createComponent();
primaryHover.name = 'Variant=Primary, Size=Default, State=Hover';
// ... build internal structure ...

const outlineDefault = figma.createComponent();
outlineDefault.name = 'Variant=Outline, Size=Default, State=Default';
// ... build internal structure ...

// 2. Combine into a component set
const componentSet = figma.combineAsVariants(
  [primaryDefault, primaryHover, outlineDefault],
  figma.currentPage  // parent node
);
componentSet.name = 'Button';
```

### Naming convention rules

The name format is: `Property1=Value1, Property2=Value2`

- Property names and values are separated by `=`
- Multiple properties are separated by `, ` (comma + space)
- Property names should use Title Case
- Value names should match exactly what users see in the UI
- Keep property names short but descriptive

### Variant matrix structure

Plan your variant matrix before building. Example for a button:

```
Variant: Primary, Outline, Secondary, Ghost, Text, Destructive
Size:    sm, Default, lg, icon
State:   Default, Hover, Focus, Disabled, Pressed
```

Total variants = 6 × 4 × 5 = 120 components in the set.

**Don't build every combination.** If a variant is nonsensical (e.g., Text variant + icon size), omit it. Figma handles missing combinations gracefully — the UI just won't offer that option.

### Adding non-variant properties to a set

Component properties (BOOLEAN, TEXT, INSTANCE_SWAP) are added to the component set, not individual variants:

```js
componentSet.addComponentProperty('Label', 'TEXT', 'Button');
componentSet.addComponentProperty('Show Left Icon', 'BOOLEAN', false);
componentSet.addComponentProperty('Show Right Icon', 'BOOLEAN', false);
componentSet.addComponentProperty('Left Icon', 'INSTANCE_SWAP', defaultIconId);
componentSet.addComponentProperty('Right Icon', 'INSTANCE_SWAP', defaultIconId);
```

This makes the properties available on every variant in the set.

---

## 5. Component Internal Structure

### Layer naming

Name every layer meaningfully. Consumers see these names in the layers panel:

```
Button (component)
├── Left Icon (instance — controlled by INSTANCE_SWAP)
├── Label (text — controlled by TEXT property)
└── Right Icon (instance — controlled by INSTANCE_SWAP)
```

**Bad names:** `Frame 1`, `Group 2`, `Rectangle 4`
**Good names:** `Header`, `Title`, `Status Badge`, `Left Icon`, `Divider`

### Internal auto-layout

Components should use auto-layout internally so they adapt to content:

```js
const button = figma.createComponent();
button.layoutMode = 'HORIZONTAL';
button.primaryAxisAlignItems = 'CENTER';
button.counterAxisAlignItems = 'CENTER';
button.itemSpacing = 8;
button.primaryAxisSizingMode = 'AUTO';   // hug width to content
button.counterAxisSizingMode = 'AUTO';   // hug height to content
```

### Connecting properties to layers

After adding a property, connect it to the appropriate layer:

**Boolean → layer visibility:**
The boolean property controls the `visible` property of a specific child node. When you add a boolean property through the Figma UI, you select which layer it controls. In the API, this connection is made by applying the property to the node.

**Text → text node characters:**
The text property is connected to a text node. Changes to the property update the text content.

**Instance swap → instance node component:**
The swap property is connected to an instance node. Changing the property swaps which component the instance references.

---

## 6. Building a Complete Button Component (Example)

This demonstrates the full workflow of building a component set programmatically:

```js
async function buildButtonVariant(variantName, sizeName, stateName, options) {
  const { fills, textColor, strokeColor, fontSize, height, paddingH, paddingV, iconSize } = options;

  const comp = figma.createComponent();
  comp.name = `Variant=${variantName}, Size=${sizeName}, State=${stateName}`;

  // Auto-layout
  comp.layoutMode = 'HORIZONTAL';
  comp.primaryAxisAlignItems = 'CENTER';
  comp.counterAxisAlignItems = 'CENTER';
  comp.itemSpacing = 8;
  comp.paddingTop = paddingV;
  comp.paddingBottom = paddingV;
  comp.paddingLeft = paddingH;
  comp.paddingRight = paddingH;
  comp.primaryAxisSizingMode = 'AUTO';
  comp.counterAxisSizingMode = 'AUTO';

  // Fills (bound to variable)
  comp.fills = [fills];

  // Strokes (if applicable)
  if (strokeColor) {
    comp.strokes = [strokeColor];
    comp.strokeWeight = 1;
    comp.strokeAlign = 'INSIDE';
  }

  // Corner radius (bound to variable)
  comp.setBoundVariable('topLeftRadius', radiusMdVar);
  comp.setBoundVariable('topRightRadius', radiusMdVar);
  comp.setBoundVariable('bottomLeftRadius', radiusMdVar);
  comp.setBoundVariable('bottomRightRadius', radiusMdVar);

  // Shadow
  comp.effects = [shadowSm];
  comp.clipsContent = false;

  // Left icon (hidden by default)
  const leftIcon = defaultIconComp.createInstance();
  leftIcon.name = 'Left Icon';
  leftIcon.visible = false;
  leftIcon.resize(iconSize, iconSize);
  comp.appendChild(leftIcon);

  // Label text
  const label = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  label.characters = 'Button';
  label.fontSize = fontSize;
  label.fills = [textColor];
  label.name = 'Label';
  comp.appendChild(label);

  // Right icon (hidden by default)
  const rightIcon = defaultIconComp.createInstance();
  rightIcon.name = 'Right Icon';
  rightIcon.visible = false;
  rightIcon.resize(iconSize, iconSize);
  comp.appendChild(rightIcon);

  return comp;
}
```

### Sizing specs (example from a standard button system)

| Size | Height | Font Size | Padding H | Padding V | Icon Size |
|------|--------|-----------|-----------|-----------|-----------|
| sm | 36px | 12px | 12px | 8px | 16px |
| Default | 40px | 14px | 16px | 10px | 20px |
| lg | 44-48px | 16-18px | 32px | 12px | 20px |
| icon | 40×40 | — | centered | centered | 20px |

---

## 7. Working with Library Components

### Importing from a published library

```js
// Import a single component by key
const comp = await figma.importComponentByKeyAsync('component-key-string');
const instance = comp.createInstance();

// Import a component set by key
const set = await figma.importComponentSetByKeyAsync('set-key-string');
```

### Finding components in the current file

```js
// Local components
const localComponents = figma.currentPage.findAll(n => n.type === 'COMPONENT');

// Component sets
const localSets = figma.currentPage.findAll(n => n.type === 'COMPONENT_SET');
```

### Library icons appear as INSTANCE nodes

Published library components (like icon sets) appear as INSTANCE nodes in consuming files, not COMPONENT nodes:

```js
// WRONG — returns 0 for library content
const icons = page.findAll(n => n.type === 'COMPONENT');

// RIGHT — library content is instances
const icons = page.findAll(n => n.type === 'INSTANCE' && n.name.includes('Icon /'));

// Import and instantiate from library (prefer getMainComponentAsync — sync mainComponent is deprecated)
const mainComp = await icon.getMainComponentAsync();
const compKey = mainComp?.key;
const imported = await figma.importComponentByKeyAsync(compKey);
const newInstance = imported.createInstance();
```

### Detaching instances

```js
// Detach an instance — converts to a regular frame
// The children become regular nodes, losing their connection to the component
const detachedFrame = instance.detachInstance();
```

**Avoid detaching** unless you need to make structural changes that properties can't handle. Detached instances lose all component-level updates.

---

## 8. Reading Component Properties

Before modifying any component or instance, read its current properties:

### From a component set

```js
const defs = componentSet.componentPropertyDefinitions;
// {
//   Size: { type: 'VARIANT', defaultValue: 'Default', variantOptions: ['sm', 'Default', 'lg'] },
//   'Show Icon#0:0': { type: 'BOOLEAN', defaultValue: false },
//   'Label#0:1': { type: 'TEXT', defaultValue: 'Button' },
//   'Icon#0:2': { type: 'INSTANCE_SWAP', defaultValue: '1:1', preferredValues: [...] },
// }
```

### From an instance

```js
const props = instance.componentProperties;
// {
//   Size: { type: 'VARIANT', value: 'lg' },
//   'Show Icon#0:0': { type: 'BOOLEAN', value: true },
//   'Label#0:1': { type: 'TEXT', value: 'Submit' },
//   'Icon#0:2': { type: 'INSTANCE_SWAP', value: '5:10' },
// }
```

**Always read before setting.** Property names include auto-generated `#ID` suffixes that you cannot predict. Read `componentPropertyDefinitions` to get the exact property names.

---

## 9. Editing Component Properties

### Modifying existing properties

```js
// Rename, change default value, or set preferred values
componentSet.editComponentProperty('Label#0:1', {
  name: 'Button Text',
  defaultValue: 'Click Me',
});

// For INSTANCE_SWAP — set preferred values
componentSet.editComponentProperty('Icon#0:2', {
  preferredValues: [
    { type: 'COMPONENT_SET', key: 'lucide-icons-set-key' },
  ],
});
```

### Deleting properties

```js
componentSet.deleteComponentProperty('Show Icon#0:0');
// Only works for BOOLEAN, TEXT, and INSTANCE_SWAP
// VARIANT properties cannot be deleted this way — remove variant components instead
```

---

## 10. Component Architecture Patterns

### Pattern A: Simple component (no variants)

For components that have one visual style but configurable content:

```
Avatar (component)
├── Image (rectangle with image fill or initials)
└── Status Dot (ellipse — controlled by boolean)

Properties:
  - Show Status: BOOLEAN (default: false)
  - Image: INSTANCE_SWAP or image fill
```

### Pattern B: Variant set with properties

For components with visual states AND configurable content:

```
Button (component set)
├── Variant=Primary, Size=Default, State=Default
├── Variant=Primary, Size=Default, State=Hover
├── ...
│
Properties on set:
  - Variant: VARIANT
  - Size: VARIANT
  - State: VARIANT
  - Label: TEXT
  - Show Left Icon: BOOLEAN
  - Show Right Icon: BOOLEAN
  - Left Icon: INSTANCE_SWAP
  - Right Icon: INSTANCE_SWAP
```

### Pattern C: Compound component

For complex components made of smaller components:

```
Card (component)
├── Header (frame)
│   ├── Title: TEXT property
│   └── Badge: nested component instance (INSTANCE_SWAP)
├── Content (frame)
│   └── Description: TEXT property
└── Actions (frame)
    ├── Primary Button: nested instance (INSTANCE_SWAP)
    └── Secondary Button: nested instance (INSTANCE_SWAP)

Properties:
  - Title: TEXT
  - Description: TEXT
  - Show Badge: BOOLEAN
  - Badge: INSTANCE_SWAP
  - Primary Action: INSTANCE_SWAP
  - Show Secondary: BOOLEAN
  - Secondary Action: INSTANCE_SWAP
```

### Pattern D: Icon-only variant

For components that have a text-based and icon-only version:

```
Button / Variant=Primary, Size=icon, State=Default
  layoutMode: HORIZONTAL
  width: 40, height: 40  (fixed square)
  padding: 0 all sides
  primaryAxisAlignItems: CENTER
  counterAxisAlignItems: CENTER
  └── Icon (20×20, centered)
```

The icon-only variant is its own component in the set — not a boolean toggle on the text variant. This is because the layout fundamentally changes (no text, square aspect ratio, centered icon).

---

## 11. Common Mistakes

| Mistake | Fix |
|---------|-----|
| Case mismatch in variant values | Read `variantOptions` — use exact strings |
| Setting VARIANT with #ID suffix | VARIANT properties don't use #ID suffix |
| Setting BOOLEAN/TEXT without #ID suffix | These DO require the full `name#ID` string |
| Building every variant combination | Skip nonsensical combinations |
| Detaching to make changes | Use properties and `setProperties()` instead |
| Not naming internal layers | Name every layer meaningfully |
| Forgetting `clipsContent = false` | Components with shadows need this |
| Icon components with wrong findAll | Use `type === 'INSTANCE'` for library icons |
| Not reading definitions first | Always read `componentPropertyDefinitions` before setting |

---

## Retrieval Queries

- Figma component architecture properties variants instances
- Component property types BOOLEAN TEXT INSTANCE_SWAP VARIANT
- Figma component set variant naming convention
- How to create flexible Figma components programmatically
- Figma instance setProperties variant properties
- Component property definitions reading and setting
- Building button component variant set Figma Plugin API
- Library components importComponentByKeyAsync instances
- Compound component pattern Figma Plugin API
- Component internal structure auto-layout naming conventions
