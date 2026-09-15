---
name: code-to-figma
description: Push existing React / HTML / shadcn code to a Figma frame for team-visible design iteration. Uses `use_figma` with strict 6-phase build order to create auto-layout frames with bound variables and applied text styles. Use when the team needs Figma-based review, variable binding, or design-system handoff. Sibling skill `figma-to-code` brings refinements back.
argument-hint: "[component path, destination Figma file key, and parent node ID]"
license: MIT
metadata:
  author: front-end-developer
  version: "1.0.0"
---

# code-to-figma

Translate an existing React component into a Figma frame tree with proper auto-layout, bound variables, and applied text styles. Figma becomes the team-visible design artifact; refinements made there get pulled back via `figma-to-code`.

## When to use

- User says "push this to Figma", "sync this component to the design file", "make this visible to the designers"
- The team's design system lives in Figma (variables, text styles, component libraries) and new code should reflect there
- Before a designer takes over for visual refinement that needs variable-bound tokens
- Prep for design-system publishing (component + variants in a library file)

**Don't use when:**
- Starting from scratch with no code — a designer should author in Figma first, then use `design-extractor` to pull tokens back
- The Figma file isn't set up for the stack — verify variables + text styles exist via `get_variable_defs` before writing

## Prerequisites

1. **Official Figma MCP connected** — `mcp__plugin_figma_figma__*`. Never `figma-console`. `whoami` returns data.
2. **Target file + parent node** — a `fileKey` and a `nodeId` (typically a page or section frame where the new component should land). Ask the user for the Figma URL and parse.
3. **Source code** — a React `.tsx` path or component in the conversation
4. **Variables + text styles exist in the target file** — run `get_variable_defs` on any existing node to confirm. If the file has no variables, this skill can't bind correctly — tell the user and stop.

## Required reading before first write

- `knowledge/figma/plugin-api.md` — Plugin API fundamentals, the `figma` global, font loading, immutable arrays
- `knowledge/figma/mcp-workflow.md` — `use_figma` discipline, atomic screenshot pair for writes, 20 KB output limit
- `knowledge/figma/canvas-building.md` §2 Build Order + §5 Variable Binding — the 6-phase sequence that prevents silent failures
- `knowledge/figma/variables-and-theming.md` — `setBoundVariableForPaint` vs `setBoundVariable`, mode inheritance
- `knowledge/figma/build-recipe.md` — end-to-end recipe if this is the first Figma work in the session

## Process

### 1. Gather the contract

```
Call: get_variable_defs({ fileKey, nodeId: <any existing node with bindings> })
```

Capture the exact variable names (`base/primary`, `base/muted-foreground`, `radius/md`, etc.) — these are the strings you'll pass to `setBoundVariableForPaint` / `setBoundVariable`.

```
Call: use_figma({ fileKey, description: "read local text styles", code: "const styles = await figma.getLocalTextStylesAsync(); return JSON.stringify(styles.map(s => ({ id: s.id, name: s.name })));" })
```

Capture style names + IDs. You'll use these for `setTextStyleIdAsync` — never hardcode `fontSize` / `lineHeight` / `fontName` per project hard rule.

**Library gotcha:** if the file consumes a kit (Arca, BRIDGE, etc.), local styles/variables may be empty. Ask the user for the kit's fileKey and pull from there — see `mcp-workflow.md` §Local vs Library Styles.

### 2. Read the source code

Identify shadcn imports, strip state/handlers, pick default states, identify Tailwind classes. Additionally note:

- **Component structure must mirror DOM 1:1 in Figma** (unlike Paper where we flatten). Every wrapper `<div>` becomes a frame. This preserves Code Connect accuracy and downstream `get_design_context` roundtrip fidelity.
- **shadcn primitives** — check if Code Connect mappings exist (`get_code_connect_map({ fileKey })`). If yes, reuse the mapped component via `importComponentByKeyAsync`. If no, build from scratch.

### 3. Plan the frame tree

Write the tree in text, mirroring the JSX nesting 1:1:

```
Card (VERTICAL auto-layout, padding 24, gap 24, bg base/card, radius radius/lg)
├── Header (HORIZONTAL, space-between, counterAxisAlignItems: CENTER)
│   ├── Title (text, text-lg/leading-normal/medium style)
│   └── Badge (instance of Badge component or frame + text)
├── Divider (rectangle, 1px, fill base/border)
└── Body (VERTICAL, gap 12)
    └── Row (HORIZONTAL, gap 8, counterAxisAlignItems: CENTER)
```

Note which sizing mode each frame needs (`AUTO` for hug, `FIXED` for explicit width).

### 4. Write the Plugin API script (6-phase order)

This is the discipline — violating order causes silent failures. See `canvas-building.md` §2 for the canonical phases.

```js
// PHASE 1 — Create leaf nodes (inside-out)
// Load fonts before touching text properties
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
const title = figma.createText();
title.characters = "Order Summary";

// Apply text style (NEVER hardcode fontSize / lineHeight)
const textStyles = await figma.getLocalTextStylesAsync();
const lgMedium = textStyles.find(s => s.name === 'text-lg/leading-normal/medium');
await title.setTextStyleIdAsync(lgMedium.id);

// Bind text color to variable
const fgVar = (await figma.variables.getLocalVariablesAsync())
  .find(v => v.name === 'base/foreground');
let textPaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 };
textPaint = figma.variables.setBoundVariableForPaint(textPaint, 'color', fgVar);
title.fills = [textPaint];

// PHASE 2 — Create parent frames with auto-layout
const card = figma.createFrame();
card.layoutMode = 'VERTICAL';
card.itemSpacing = 24;
card.paddingTop = 24; card.paddingBottom = 24;
card.paddingLeft = 24; card.paddingRight = 24;
card.resize(400, 1);
card.primaryAxisSizingMode = 'AUTO';   // re-set after resize — resize sets both to FIXED
card.counterAxisSizingMode = 'FIXED';

// PHASE 3 — Append children to parents (inside-out)
card.appendChild(header);
card.appendChild(divider);
card.appendChild(body);

// PHASE 4 — Set child sizing AFTER appending (this is the #1 bug source)
header.layoutSizingHorizontal = 'FILL';
divider.layoutSizingHorizontal = 'FILL';
body.layoutSizingHorizontal = 'FILL';

// PHASE 5 — Bind variables on containers
const cardVar = (await figma.variables.getLocalVariablesAsync())
  .find(v => v.name === 'base/card');
let cardPaint = { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 };
cardPaint = figma.variables.setBoundVariableForPaint(cardPaint, 'color', cardVar);
card.fills = [cardPaint];

const radiusVar = (await figma.variables.getLocalVariablesAsync())
  .find(v => v.name === 'radius/lg');
card.setBoundVariable('topLeftRadius', radiusVar);
card.setBoundVariable('topRightRadius', radiusVar);
card.setBoundVariable('bottomLeftRadius', radiusVar);
card.setBoundVariable('bottomRightRadius', radiusVar);

// PHASE 6 — Set mode on outermost container (for dark variant)
// (skip if building light mode only; Figma mode inheritance cascades down)

// Place on the target page / under the parent node
const parent = await figma.getNodeByIdAsync('<parent nodeId>');
parent.appendChild(card);
```

Keep scripts **small** — `use_figma` has a **20 KB output limit per call**. For complex components, split into multiple `use_figma` calls (one per subtree, then wire them together).

### 5. Screenshot immediately (atomic pair)

```
Call: get_screenshot({ fileKey, nodeId: <new card ID> })
```

Study it. Describe what you see. No text or other tool calls between `use_figma` and `get_screenshot`.

### 6. Verify discipline

Before presenting:

- Every fill / stroke / text color bound via `setBoundVariableForPaint` — no orphan hex (check `node.fills[0].boundVariables`)
- Every text node has `setTextStyleIdAsync` applied — no hardcoded `fontSize` / `lineHeight` / `fontName`
- Frame tree mirrors DOM 1:1 — no collapsed wrappers
- Radii bound via `setBoundVariable('topLeftRadius', ...)` + 3 siblings — not hardcoded `cornerRadius`
- Auto-layout sizing set **after** append — check `layoutSizingHorizontal` / `layoutSizingVertical` on child nodes

If any fail: surgical `use_figma` fix + `get_screenshot` again. Never say "done" without visual proof.

### 7. Dark mode (optional)

For dark variant — same frame structure, plus:

```js
const darkModeId = <mode ID from get_variable_defs>;
const collection = <collection with light/dark modes>;
card.setExplicitVariableModeForCollection(collection, darkModeId);
```

All child variable bindings resolve to dark values via mode inheritance. **Do not** create parallel hex values — that breaks the variable system.

### 8. Hand off

Tell the user:

- Node ID(s) of the created frame(s) for future reference
- `figma-to-code` can pull back after team iteration
- If Code Connect mappings exist on the shadcn components used, confirm the mapping caught them (they should already have `codeConnectSrc` on import)

## Gotchas (see `references/gotchas.md` for full list)

- `resize()` overrides `primaryAxisSizingMode` / `counterAxisSizingMode` to `FIXED` — re-set them after
- `layoutSizingHorizontal = 'FILL'` only works **after** `appendChild` — pre-append FILL is a silent failure
- Font names have spaces: `'Semi Bold'` not `'SemiBold'`, `'Extra Bold'` not `'ExtraBold'`
- Immutable arrays (fills, strokes, effects, layoutGrids) — clone, modify, reassign; never mutate in place
- `setBoundVariable` doesn't work for fills — MUST use `setBoundVariableForPaint` on a paint object
- Libraries: local `getLocalVariables*` returns empty if the kit is imported — query the kit's fileKey directly
- `use_figma` 20 KB output limit — split complex builds into multiple scripts
- Dynamic page loading — use `await figma.setCurrentPageAsync(page)` and `await page.loadAsync()` before touching nodes on other pages
- Figma MCP banned: never `mcp__figma-console__*`, never `figma_execute`, never Desktop Bridge plugin

## Output

- New Figma frame tree under the specified parent node
- Screenshot confirming visual match to the source
- List of any decisions made during translation (component swaps, omitted interactions, mode handling)
- Hand-off note: ready for team review, ready for `figma-to-code` when refined
