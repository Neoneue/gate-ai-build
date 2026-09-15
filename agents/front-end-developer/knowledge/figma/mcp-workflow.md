# Figma MCP Workflow — How to Use the MCP Tools Effectively

> **Reading order:** Read this alongside `canvas-building.md`. This file covers the MCP tool layer — how to call the tools, read responses, plan operations, and verify results. The canvas patterns file covers the code you write inside `use_figma` calls.

> **Canonical docs (Figma):** [Figma MCP Server](https://developers.figma.com/docs/figma-mcp-server/), [Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/), [Write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/), [Plans, access, and permissions](https://developers.figma.com/docs/figma-mcp-server/plans-access-and-permissions/), [Plugin API](https://developers.figma.com/docs/plugins/api/api-reference/). Prefer these over third-party writeups when behavior disagrees.

> **MCP server variants:** Different hosts may register **more than one** Figma-related MCP server. Tool **names** match Figma’s catalog (`get_design_context`, `use_figma`, …); the **invocation name** in the client (e.g. `mcp__…__get_metadata`) depends on install. Check the local tool descriptors under your MCP config for **required parameters** — read-only and plugin-backed tools do not always share the same schema (some omit `fileKey` and rely on the linked file or current selection).

---

## 1. Tool surface — read, write, and “human-like” workflow

Figma documents the MCP server as a **growing set** of tools, not a fixed five. Group them by intent:

| Intent | Typical tool names | Notes |
|--------|-------------------|--------|
| Structure / IDs | `get_metadata` | Sparse XML: ids, names, types, layout, bounds. **Official support:** [Figma Design only](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/#get_metadata) — not listed for Figma Make; use `get_design_context` for Make. |
| Rich context + reference code | `get_design_context` | Primary tool for design → code. **Official support:** [Figma Design and Figma Make](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/#get_design_context). |
| Pixel proof | `get_screenshot` | **Official support:** [Figma Design, FigJam](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/#get_screenshot). |
| Tokens on canvas | `get_variable_defs` | **Official support:** [Figma Design only](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/#get_variable_defs) — per *Tools and prompts*. |
| FigJam | `get_figjam`, `generate_diagram` | FigJam-specific reads/diagram generation per [Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/). |
| Design system discovery | `search_design_system` | Search libraries for components, variables, styles (`query` + `fileKey`). |
| Canvas writes | `use_figma` | **Official support:** [Figma Design, FigJam](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/#use_figma-remote-only). Runs JS with the **`figma` global** ([Write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/): Plugin API context). |
| Web → Figma | `generate_figma_design` | Capture/import flows; follow tool instructions (polling, `outputMode`, etc.). |
| New file | `create_new_file` | Creates a new Design/FigJam file (remote/server-dependent). |
| Code Connect | `get_code_connect_map`, `add_code_connect_map`, `get_code_connect_suggestions`, `send_code_connect_mappings`, … | Mapping design nodes to repo components — not a substitute for canvas layout rules. |
| Agent rules file | `create_design_system_rules` | Generates guidance for the agent; does not edit the canvas. |
| Identity / plan | `whoami` | Remote/server-dependent. |

**“Use Figma like a human”** in practice means: **inspect** (structure + screenshot + variables) → **reuse** (`search_design_system`, instances, variables) → **edit the document model** (auto-layout, properties, modes) via `use_figma` → **verify** (`get_screenshot`). The Plugin API does **not** drive the desktop UI (clicks, tools palette); it mutates nodes the same end state a designer would reach through panels, within [documented API limits](https://developers.figma.com/docs/plugins/).

**Official `use_figma` limitations** (from [Write to canvas → Current limitations](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/) — **always re-read the live page**; wording can change): **20kb output response limit per call**; **no assets (image) support yet** — including no importing components that have images/videos, or creating GIFs; **custom fonts aren’t supported yet**; components must be **manually published** before Code Connect completes; **beta-level quality**; tool **evolving**. Plan smaller scripted steps and prefer vector + variables + library components until those limits change.

---

### get_metadata
Returns the structural tree of a Figma node in XML format — node IDs, names, types, positions, sizes. No visual data, no code, no screenshots.

**Use when:**
- Mapping the file structure (what pages exist, what frames are on a page)
- Finding specific node IDs by name
- Understanding the frame hierarchy before modifications
- Counting elements, checking names, reading positions

**Parameters (check your MCP schema):** Often `nodeId` only (optional → current selection). May omit `fileKey` when the client has a linked file context.

**Product fit:** Figma’s docs list **`get_metadata` for Figma Design only** — for **Figma Make**, use **`get_design_context`** ([Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)). If your **local MCP tool description** adds stricter rules (e.g. “never call `get_metadata` for Make”), follow the descriptor when using that host.

**Response format:** XML tree with `<frame>`, `<text>`, `<instance>`, `<symbol>`, `<ellipse>`, `<rounded-rectangle>` elements, each with `id`, `name`, `x`, `y`, `width`, `height` attributes.

**Reading the response:**
```xml
<frame id="72:2" name="Light — Standup" x="40" y="0" width="564" height="690">
  <frame id="72:3" name="Frame" x="32" y="32" width="165" height="48">
    <text id="72:4" name="Friday, April 4" ... />
```
- `id` is the node ID you use for further calls
- `name` is the layer name in Figma — case-sensitive, read exactly as shown
- `<symbol>` elements are component variants inside a component set
- `<instance>` elements are component instances (buttons, icons, etc.)
- `hidden="true"` means the node is invisible

### get_design_context
The primary tool for design-to-code workflows. Returns reference code, a screenshot, and contextual metadata for a node. Much richer than `get_metadata`.

**Official supported file types:** Figma Design **and** Figma Make ([Tools and prompts → get_design_context](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/#get_design_context)).

**Use when:**
- You need to understand what a design looks like (screenshot included)
- You need code reference for implementing the design
- Starting design-to-code translation work

**Parameters (check your MCP schema):** Typically `nodeId` (optional → selection); some hosts omit `fileKey` when context is implicit. Optional logging fields (`clientLanguages`, `clientFrameworks`) and `forceCode`, `artifactType`, `taskType` where supported.
- `excludeScreenshot` — set `true` only to save context (not recommended)

**Response includes:**
- Generated reference code (React + Tailwind by default — adapt to your stack)
- Screenshot of the node
- Component metadata, Code Connect mappings if configured
- Design annotations

### get_screenshot
Captures a visual screenshot of a specific node.

**Official supported file types:** Figma Design **and** FigJam ([Tools and prompts → get_screenshot](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/#get_screenshot)).

**Use when:**
- Verifying results after a `use_figma` call (MANDATORY — always pair these)
- Checking the current state of a design before modifications
- Comparing before/after states

**Parameters (check your MCP schema):** Some MCP hosts require both **`fileKey` and `nodeId`** for `get_screenshot`. Others may only require `nodeId` (selection fallback). Check your tool descriptor.

**Rule:** After every `use_figma` call, immediately call `get_screenshot` in the same response. No text between them. Study the screenshot and describe what you see before responding to the user.

### get_variable_defs
Returns variable definitions bound to a specific node — color tokens, typography tokens, spacing tokens.

**Official supported file types:** Figma Design only ([Tools and prompts → get_variable_defs](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/#get_variable_defs)).

**Use when:**
- Understanding what variables are used in existing designs
- Checking that your variable bindings match the design system
- Auditing token usage across a file

**Parameters (check your MCP schema):** Often **`fileKey` + `nodeId`** on plugin-backed tools; selection-based hosts may differ.

**Response format:** JSON mapping variable names to resolved values:
```json
{
  "foreground": "#0a0a0a",
  "muted-foreground": "#737373",
  "text-sm/leading-normal/medium": "Font(family: \"Inter\", style: Medium, size: 14, weight: 500, lineHeight: 20, letterSpacing: 0)",
  "radius/md": "8"
}
```

### use_figma
Executes JavaScript in a **Plugin API context** with the global `figma` object. This is the general-purpose tool for **reading AND writing** — create, modify, delete, and inspect nodes (pages, frames, components, variables, styles, text, etc.) — the same document model a designer edits in the UI, subject to API and MCP limits.

**⚠️ This is your PRIMARY tool for ANY Figma data question.** If the user asks "what font sizes exist?", "what variables are defined?", "what letter spacing do text styles use?", "how many components are there?" — reach for `use_figma` with a Plugin API read call FIRST, not `get_metadata` or repo file searches.

**Use when:**
- **ANY question about Figma file data** — text styles, paint styles, effect styles, grid styles, variables, component properties, node properties, layer structure
- Creating new frames, text, shapes, components
- Modifying existing designs (text changes, color rebinding, layout adjustments)
- Building complete screens or components
- Batch-querying or auditing nodes across a page or file

**Parameters (check your MCP schema):**
- `fileKey` (required) — target file
- `code` (required) — JavaScript executed with `figma` available; **there is no separate `nodeId` argument on the tool** — resolve nodes inside your script with `figma.getNodeByIdAsync`, `findOne`, `findAll`, or page traversal, and use `await figma.setCurrentPageAsync(page)` before touching nodes on other pages
- `description` (required) — short human summary of what the script does
- `skillNames` (optional) — only when skill docs ask you to pass it (logging)

**Critical rules:**
- **Write calls:** Every `use_figma` call that **creates or modifies** the canvas MUST be followed by `get_screenshot` immediately (same turn; see §9)
- **Read calls:** `use_figma` calls that only **return data** (e.g. `getLocalTextStylesAsync()`) do NOT need a screenshot — just use the returned data
- Prefer `search_design_system` before inventing new components when libraries exist
- Code must follow the build order from `canvas-building.md` (for writes)
- Project tokens: follow **project `design.md`** — no stray hardcoded colors/spacing/radii (for writes)
- Respect **dynamic page loading**: on large files, use `PageNode.loadAsync` / `figma.loadAllPagesAsync` patterns from `plugin-api.md` before assuming `children` are populated

**Choosing `use_figma` vs `generate_figma_design`:** Figma’s tool description: default to **`use_figma`** for writes; use **`generate_figma_design`** when capturing a web page/view into Figma for the first time (then iterate with `use_figma`).

---

## 2. use_figma for Reading — Plugin API Query Methods

`use_figma` is not just a write tool. It runs **any** Plugin API JavaScript, including reads. For data questions about the Figma file, this is almost always faster and more complete than `get_metadata` or `get_variable_defs`.

### Decision tree: which tool for which question?

| Question | Tool | Why not the others |
|----------|------|--------------------|
| "What text styles exist? What's the letter spacing?" | **`use_figma`** → `getLocalTextStylesAsync()` | `get_variable_defs` returns a flat string, not structured style data |
| "What paint/color styles are defined?" | **`use_figma`** → `getLocalPaintStylesAsync()` | `get_metadata` has no style info |
| "What effect styles exist?" | **`use_figma`** → `getLocalEffectStylesAsync()` | Not exposed by any other tool |
| "What variables/tokens are in the file?" | **`use_figma`** → `getLocalVariablesAsync()` | `get_variable_defs` only shows bindings on ONE node |
| "What variable collections and modes exist?" | **`use_figma`** → `getLocalVariableCollectionsAsync()` | Not exposed elsewhere |
| "What components exist? What are their properties?" | **`use_figma`** → page traversal + `componentPropertyDefinitions` | `get_metadata` shows tree structure but not properties |
| "What does this node look like?" | **`get_screenshot`** | Visual — code can't return pixels |
| "What's the node tree structure?" | **`get_metadata`** | Quick structural overview; fine for tree shape |
| "Give me reference code for this node" | **`get_design_context`** | Returns code + screenshot + hints |
| "What variables are bound to this specific node?" | **`get_variable_defs`** | Scoped to one node's bindings |

### Common read patterns

**Text styles (font, size, weight, line height, letter spacing):**
```js
const styles = await figma.getLocalTextStylesAsync();
return JSON.stringify(styles.map(s => ({
  name: s.name,
  fontSize: s.fontSize,
  fontName: s.fontName,
  lineHeight: s.lineHeight,
  letterSpacing: s.letterSpacing
})));
```

**Paint styles (colors, gradients):**
```js
const styles = await figma.getLocalPaintStylesAsync();
return JSON.stringify(styles.map(s => ({
  name: s.name,
  paints: s.paints
})));
```

**Variables and collections:**
```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
return JSON.stringify(collections.map(c => ({
  name: c.name,
  modes: c.modes,
  variableCount: c.variableIds.length
})));
```

**Single variable lookup:**
```js
const vars = await figma.variables.getLocalVariablesAsync();
const match = vars.filter(v => v.name.includes('primary'));
return JSON.stringify(match.map(v => ({
  name: v.name,
  resolvedType: v.resolvedType,
  valuesByMode: v.valuesByMode
})));
```

**Node properties (any node by ID):**
```js
const node = await figma.getNodeByIdAsync('22:1400');
return JSON.stringify({
  name: node.name, type: node.type,
  width: node.width, height: node.height,
  fills: node.fills, strokes: node.strokes,
  layoutMode: node.layoutMode,
  componentPropertyDefinitions: node.componentPropertyDefinitions
});
```

### ⚠️ Local vs Library styles — critical gotcha

`getLocalTextStylesAsync()`, `getLocalPaintStylesAsync()`, etc. return only styles **defined in the current file**. If the file **imports styles from a library** (common with the Arca kit), the library styles are NOT returned — even though they appear in the Figma UI and are applied to canvas nodes.

**Symptoms:** You call `getLocalTextStylesAsync()` and get styles with all-zero letter spacing, but the Figma UI shows `-1%`. The local copies are stale/duplicates; the real styles come from the library.

**How to detect:** Compare style IDs returned by `getLocalTextStylesAsync()` against `textStyleId` on actual canvas text nodes. If they don't match, the nodes use library styles.

**Solutions (in order of preference):**
1. **Query the library source file directly.** If you know the library file's key, call `use_figma` with that fileKey to read the canonical style definitions. Check **project `design.md`** or ask the user for the library file key.
2. **Read styles from canvas nodes.** Find a text node that uses the style, read its `letterSpacing`, `fontSize`, `fontName` properties directly — these reflect the applied (library) style, not the stale local copy.
3. **Use `search_design_system`** with `includeStyles: true` — this searches across all linked libraries.

### Key principle

**When in doubt, use `use_figma` with a read script.** It gives you the full Plugin API — anything a Figma plugin can read, you can read. The other tools (`get_metadata`, `get_variable_defs`) are convenience shortcuts for narrower questions, not replacements. **For library-sourced data, query the library source file directly (ask the user for the file key if unknown).**

---

## 3. Workflow: Understanding an Existing Design

Before modifying anything, build a mental model of the design:

### Step 0 — Answer data questions directly (if the user asked one)
If the user asked about styles, variables, components, or properties — **go straight to `use_figma` with a read script** (see §2). Don't detour through `get_metadata` or file searches. Examples:
- "What letter spacing?" → `getLocalTextStylesAsync()`
- "What variables?" → `getLocalVariablesAsync()` / `getLocalVariableCollectionsAsync()`
- "What components?" → page traversal with `findAll(n => n.type === 'COMPONENT')`

### Step 1 — Get the page structure
```
Call: get_metadata — pass parameters required by YOUR tool schema (often nodeId for a page e.g. 0:1; fileKey when the tool requires it)
Read: What frames exist? What are their names and positions?
Note: Top-level frame IDs for the elements you'll work with
```

### Step 2 — Get variable/style definitions
```
Option A (quick): get_variable_defs(fileKey, nodeId) on a representative frame
Option B (complete): use_figma with getLocalVariablesAsync() / getLocalTextStylesAsync()
Note: Variable names to use when binding, style properties for parity
```

### Step 3 — Get the visual context
```
Call: get_screenshot(fileKey, nodeId) on the frame you'll modify
Study: What does it look like? What's the hierarchy? What needs to change?
Describe: Write out what you see before planning changes
```

### Step 4 — Deep dive on specific nodes (if needed)
```
Call: get_metadata or use_figma with getNodeByIdAsync for detailed properties
Read: What's the internal structure? What children exist? What are the exact names?
Note: Node IDs for the specific elements you'll touch
```

**Only then** plan your modifications. Never write `use_figma` code based on assumptions about the structure.

---

## 3. Workflow: Building a New Design

### Step 1 — Read knowledge files
Before any Figma work in a session, read:
1. **Host `design.md`** (Theme + Project) — tokens, component specs
2. `knowledge/figma/canvas-building.md` — build order, patterns
3. `knowledge/figma/component-architecture.md` — if building components
4. `knowledge/figma/variables-and-theming.md` — if working with variables

### Step 2 — Plan the frame tree
Write out the nesting structure before writing code:
```
Card (VERTICAL, padding 24, gap 0)
├── Header (HORIZONTAL, space-between)
│   ├── Title (text, 20px semibold, foreground)
│   └── Badge (frame, secondary bg, 12px medium)
├── Divider (rectangle, 1px, border color)
└── Content (VERTICAL, gap 12)
    └── Row (HORIZONTAL, gap 8)
```

### Step 3 — Get existing variable names
```
Call: get_variable_defs(fileKey, existingNodeId) on any existing design in the file
Note: Exact variable names for colors, typography, spacing
```

### Step 4 — Write the use_figma code
Follow the build order from `canvas-building.md`:
1. Create leaf nodes (text, shapes, icons)
2. Create parent frames with auto-layout
3. Append children to parents
4. Set child sizing (FILL/HUG) AFTER appending
5. Bind variables to fills, strokes, dimensions
6. Set mode on outermost container if needed

### Step 5 — Verify
```
Call: get_screenshot(fileKey, newNodeId) immediately after use_figma
Study: Does it match the plan? Check hierarchy, spacing, variable binding
Fix: If anything is wrong, make another use_figma call to fix — then screenshot again
```

---

## 4. Workflow: Modifying an Existing Design

### Step 1 — Read the current state
```
Call: get_metadata on the frame to modify (arguments per your tool schema)
Read: Note exact node IDs, names, and types of elements you'll change
```

### Step 2 — Screenshot the current state
```
Call: get_screenshot(fileKey, nodeId)
Study: Describe what you see — this is your "before" reference
```

### Step 3 — Plan surgical edits
For each change, determine the approach:
- Text change → `findOne` by name, load font, set characters
- Color change → rebuild paint with `setBoundVariableForPaint`, reassign fills
- Visibility toggle → `node.visible = false/true`
- Component swap → `instance.swapComponent(newComp)`, re-set text after
- Add new element → create node, `appendChild` to existing frame
- Layout change → modify `layoutMode`, `itemSpacing`, etc. in place

### Step 4 — Execute and verify
```
Call: use_figma with surgical changes (not full rebuilds)
Call: get_screenshot immediately after
Study: Describe what changed, verify nothing broke
```

---

## 5. Batching vs Splitting Operations

### When to batch in one use_figma call
- Creating a complete frame with all its children
- Multiple property changes on the same node
- Building a component variant set
- Operations that depend on each other (create → append → set sizing)

### When to split into multiple use_figma calls
- Operations on different pages (need `setCurrentPageAsync` between them)
- Creating a complex design in stages where you need to verify each stage
- When a single call would exceed reasonable code complexity
- When you need to read data from the first call to inform the second

**Rule (writes only):** After EVERY `use_figma` **write** call, call `get_screenshot`. If you split into 3 write calls, that's 3 screenshots. Read calls don't need screenshots.

---

## 6. Reading get_metadata Responses

### Identifying element types
```xml
<frame>              → Frame or auto-layout container
<text>               → Text node
<instance>           → Component instance (button, icon, etc.)
<symbol>             → Component variant inside a component set
<ellipse>            → Circle or ellipse shape
<rounded-rectangle>  → Rectangle with corner radius
<rectangle>          → Rectangle without corner radius
<vector>             → Vector path
```

### Finding specific nodes
Scan by `name` attribute:
- `name="Button"` → a button instance
- `name="Variant=Primary, Size=Default, State=Default"` → a specific variant
- `name="Icon / ArrowRight"` → a library icon instance
- `name="Divider"` → a divider element
- `hidden="true"` → hidden node (don't try to modify unless making visible)

### Understanding the tree
The XML nesting mirrors the Figma layer hierarchy:
```xml
<frame id="72:2" name="Card">           ← parent frame
  <frame id="72:3" name="Header">       ← child frame (auto-layout group)
    <text id="72:4" name="Title" />      ← grandchild (leaf node)
  </frame>
</frame>
```

Node IDs from `get_metadata` are what you use in `use_figma` code:
```js
const card = await figma.getNodeByIdAsync('72:2');
const title = await figma.getNodeByIdAsync('72:4');
```

---

## 7. Working with Pages

### Finding all pages
The file's root pages can be discovered by calling `get_metadata` on page IDs. Page IDs in Figma follow the format `X:Y` where the first number is sequential. Common page IDs:
- `0:1` — typically the first page
- `80:2`, `112:646`, `192:36` — other pages (IDs are not predictable)

If you don't know a page ID, ask the user for the Figma URL — the `node-id` parameter in the URL gives you the node ID (convert `-` to `:`).

### Switching pages in use_figma
```js
// Find the target page
const page = figma.root.children.find(p => p.name === 'Components');
if (page) {
  await figma.setCurrentPageAsync(page);
  // Now you can create/modify nodes on this page
}
```

---

## 8. Error Handling

### Common MCP errors

**"The node ID provided was invalid"**
- The node doesn't exist or was deleted
- The node ID format is wrong (must be `X:Y` with colon, not dash)
- The node is on a page that isn't the current page

**"You currently have nothing selected"**
- `get_variable_defs` sometimes requires a node to be selected
- Try with a specific node ID instead of a page ID

**Hook blocks the call**
- The pre-hook detected missing methodology citations or hardcoded values
- Read the hook error message — it tells you exactly what's missing
- Fix the code to include citations and use design.md values

**Large response (exceeds token limit)**
- The node has too many children (e.g., icon library with 1468 icons)
- Response gets saved to a file — read it with the Read tool
- For large pages, query specific frames instead of the whole page

---

## 9. The Atomic Pair: use_figma → get_screenshot (WRITES ONLY)

**For write calls** (creating, modifying, deleting canvas content), every `use_figma` is immediately followed by `get_screenshot`. No text, no analysis, no other tool calls between them.

```
1. Call use_figma (create/modify something)
2. Call get_screenshot (see what happened)
3. Study the screenshot (describe what you see in detail)
4. Respond to the user (with proof of what you verified)
```

If the screenshot reveals problems:
```
5. Call use_figma (fix the problems)
6. Call get_screenshot (verify the fix)
7. Study again (confirm the fix worked)
8. Then respond
```

**Never say "done" without a screenshot that proves it.** Never describe what you built without looking at the screenshot first.

**For read calls** (querying styles, variables, node properties — anything that returns data without changing the canvas), **no screenshot is needed**. Just use the returned data directly. Examples of read calls:
- `getLocalTextStylesAsync()`, `getLocalPaintStylesAsync()`
- `getLocalVariablesAsync()`, `getLocalVariableCollectionsAsync()`
- `getNodeByIdAsync()` for property inspection
- `findAll()` / `findOne()` for search queries

---

## 10. Code Comments in use_figma

**For write calls only.** Read-only scripts (queries, inspections) do not need methodology citations — keep them minimal and focused.

For write calls, the pre-hook evaluator checks for:
- Variable binding (not hardcoded values)
- Correct build order
- Values from design.md

Include comments that reference your sources in write scripts:
```js
// design.md: card padding 24px, border 1px --border, radius-lg 10px
// canvas-building.md: build order — create leaves → parent frames → appendChild → sizing → bind variables
```

For read scripts, a short description is enough:
```js
// Read all text styles with letter spacing values
const styles = await figma.getLocalTextStylesAsync();
return JSON.stringify(styles.map(s => ({ name: s.name, letterSpacing: s.letterSpacing })));
```

---

## 11. Libraries, Dev Mode, and parity limits

- **Enabling team libraries** in a file is a **human/UI (or org admin) action** — not something the Plugin API performs. Plugins consume library assets that are **already available** in the file, typically via **`importComponentByKeyAsync`** / variable import patterns. See Figma’s [Plugin API introduction](https://developers.figma.com/docs/plugins/) and [figma.teamLibrary](https://developers.figma.com/docs/plugins/api/figma-teamlibrary/).
- **Dev Mode plugins** are **read-only** for most document edits; do **design-time writes** (frames, components, variables) in **Design** context / standard plugin execution, not by expecting Dev-mode-only tooling to reshape the canvas. See [Working in Dev Mode](https://developers.figma.com/docs/plugins/working-in-dev-mode/).
- **Code Connect** maps components to repo code via CLI/UI workflows; use MCP Code Connect tools where configured — it does not replace variable binding or auto-layout discipline on canvas.

---

## Retrieval Queries

- Figma MCP tools get_metadata get_design_context get_screenshot use_figma
- How to use Figma MCP tools effectively workflow
- use_figma for reading querying text styles paint styles variables
- Plugin API read methods getLocalTextStylesAsync getLocalPaintStylesAsync getLocalVariablesAsync
- Which Figma MCP tool to use decision tree
- Reading Figma metadata XML response understanding node structure
- Figma MCP workflow build modify verify screenshot
- Batching vs splitting Figma MCP operations
- Figma MCP error handling invalid node hook blocks
- Atomic pair use_figma get_screenshot verification writes only
- Understanding existing Figma designs via MCP tools
- Working with Figma pages finding nodes via MCP
