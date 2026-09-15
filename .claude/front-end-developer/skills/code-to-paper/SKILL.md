---
name: code-to-paper
description: Push existing React / HTML / shadcn code to a Paper canvas artboard for visual iteration. Use when the team has code shipping and wants to fix visual issues (spacing, hierarchy, rhythm, color) faster than round-tripping through the dev server. Sibling skill `paper-to-code` brings refinements back. Different from `paper-parallel-build` (that's for building new, from scratch).
argument-hint: "[component path or URL path to sync]"
license: MIT
metadata:
  author: front-end-developer
  version: "1.0.0"
---

# code-to-paper

Take an existing React component (or raw HTML) and render it into a Paper artboard. The canvas becomes your visual scratchpad — you see the current state of the shipped UI, the agent does `update_styles` edits in real time, and you verify visually without a dev-server reload loop.

## When to use

- User says "push this component to Paper", "let's iterate on this in Paper", "refine this visually", or names a component file + Paper
- User points at a visually broken UI and the fix is easier to see than to code — spacing, hierarchy, weight, rhythm, alignment
- Before `paper-to-code` brings the tightened version back
- Any time round-tripping through the dev server is slower than the agent editing a canvas artboard directly

**Don't use when:**
- Starting from scratch with no code yet → use `paper-parallel-build` (parallel authoring)
- Pure interaction work (state, validation, handlers) — Paper is static
- User wants a Figma deliverable — use `code-to-figma` instead

## Prerequisites

1. **Paper MCP connected** — `get_basic_info` returns data. If not: tell the user to open Paper Desktop with a file loaded.
2. **A source to translate** — a React `.tsx` file path, a URL to a live page the user can point at, or HTML already in the conversation.
3. **Active contract loaded** — the host app's `globals.css` (or `contract/globals.md` + installed shadcn component source). **Read globals.css first** to build the complete OKLCH token map. Skip this and colors drift.

## Required reading before first canvas call this session

- `knowledge/paper/mcp-workflow.md` — tool schemas, atomic pairs, update_styles discipline
- `knowledge/paper/canvas-building.md` §0 Token Resolution — how to build the OKLCH token map
- `knowledge/paper/canvas-building.md` §1 Inline Styles vs Tailwind — layout inline, colors via Tailwind

## Process

### 1. Read the source code

Read the React component file (or HTML source). Identify:

- **Component imports** — shadcn primitives (`Button`, `Card`, `Input`, `Dialog`, etc.) that need expansion to raw HTML for Paper
- **State and handlers** — `useState`, `useEffect`, `onClick`, `onChange` → **strip these** (Paper is static)
- **Conditional rendering** — pick the default/primary state to show on canvas
- **Dynamic expressions** — replace with representative static values (not Lorem ipsum — real-looking content)
- **Tailwind classes** — identify color classes (keep), layout classes (convert to inline styles per canvas-building.md §1)

### 2. Build the token map

Open `globals.css` for the project. Extract every OKLCH value under `:root` AND `.dark`. Resolve any shadcn class used in the component to its concrete OKLCH:

```
text-primary-foreground    → oklch(0.985 0 0)   (light) / oklch(0.205 0 0)   (dark)
bg-card                    → oklch(1 0 0)       (light) / oklch(0.205 0 0)   (dark)
border-border              → oklch(0.922 0 0)   (light) / oklch(1 0 0 / 10%) (dark)
```

Hold the map in conversation context — every `write_html` / `update_styles` call references it.

### 3. Plan the HTML tree (visual output, not 1:1 DOM)

**Flatten React wrappers that don't change visual output.** Paper's canvas should mirror the VISUAL output, not the JSX nesting. Keep wrappers that define distinct spacing zones (different `gap` values); drop wrappers that exist for `.map()`, conditional rendering, or component boundaries with no visual effect. See canvas-building.md §2.

Write the tree as a comment block:

```
Card (flex-col, p-6, gap-6, rounded-2xl, ring-1)
├── Header (flex, justify-between, items-center)
│   ├── Title (text-base font-medium)
│   └── Badge (h-5 px-2 rounded-full bg-secondary)
├── Separator (h-px bg-border)
└── Content (flex-col, gap-3)
    └── Row (flex, gap-2, items-center)
```

### 4. Create the artboard

```
Call: create_artboard({
  name: "<Component Name> — Light",
  styles: { width: "<px>", height: "<px>" }
})
```

Size from the React component's container width if fixed; otherwise `1440px × 900px` desktop or `393px × 852px` mobile. Returns an artboard ID — capture it for subsequent calls.

For dark variant, create a second artboard with `backgroundColor: "oklch(0.145 0 0)"` (or the project's dark canvas value).

### 5. Translate and write HTML

Convert React to Paper HTML:

- **Strip** `import`, hooks, handlers, component boundaries
- **Expand** shadcn primitives to raw HTML using the token map (see `paper-parallel-build/SKILL.md` Component Expansion Rules for the common mappings)
- **Layout** — always inline styles: `style="display: flex; flex-direction: column; gap: 16px; padding: 24px;"`
- **Color + typography** — Tailwind classes (`bg-card`, `text-muted-foreground`, `text-sm`, `font-medium`) OR exact OKLCH inline when tokens aren't reliable
- **Typography completeness** — every text element MUST have font-size (px), font-weight, line-height (px), letter-spacing (em). Missing line-height is the #1 visual discrepancy vs the live site.
- **Buttons** — MUST include `display: flex; align-items: center; justify-content: center;` or text won't vertically center

```
Call: write_html({
  targetNodeId: artboardId,
  html: "<complete HTML string>",
  mode: "insert-children"
})
```

Build incrementally — one visual group per call when the component is complex (header, then body, then footer). Each call renders live in Paper; the user watches.

### 6. Screenshot + verify (atomic)

```
Call: get_screenshot({ nodeId: artboardId, scale: 2 })
```

Study the screenshot. Describe what you see before responding. Check:

- Hierarchy reads correctly (swap test — blur your eyes, can you still tell what's primary?)
- Spacing rhythm matches the code intent (no compound spacing — gap + padding in same axis)
- Colors match the token map (no drift — exact OKLCH from globals.css)
- Typography completeness (no missing line-heights, no wrong weights)
- Alignment (vertical lanes in repeated rows)

### 7. Iterate with update_styles (not rebuild)

When the user gives feedback, prefer **surgical `update_styles`** over rebuilding:

```
Call: update_styles({
  updates: [
    { nodeIds: ["title-id"], styles: { "fontSize": "18px", "lineHeight": "28px" } },
    { nodeIds: ["badge-id"], styles: { "backgroundColor": "oklch(0.97 0 0)" } }
  ]
})
```

After each `update_styles`, immediately `get_screenshot` and verify. After 2 failed patches on the same area, stop patching — delete children and rebuild (structural issues need a clean reset, see canvas-building.md §Phase).

### 8. Dark mode

For dark variant, use the same HTML structure with swapped OKLCH values (or Tailwind semantic classes that resolve per artboard). Create a second artboard with dark canvas and repeat. Paper has no mode-switching yet — two artboards, explicit values.

### 9. Hand off

Once the canvas is tightened, tell the user:

- The artboard ID(s) to reference later
- That `paper-to-code` can now pull the refinements back into the React source
- Any Open Questions the visual iteration surfaced (e.g. "the 14 px body felt cramped — we bumped to 15 px on canvas; confirm before I write it back to code")

```
Call: finish_working_on_nodes()   ← mandatory, no args releases all indicators
```

## Gotchas (stack-specific; see `references/gotchas.md` for the full list)

- `write_html(replace)` **deletes the target node** — use `insert-children` unless you truly want to replace
- `margin` isn't supported — use parent `gap` or child `padding`
- Tailwind LAYOUT classes (`flex`, `h-12`, `w-[120px]`) are unreliable — use inline styles for layout
- Rich text (mixed colors in one text node) isn't supported — split into separate elements
- Node IDs change after structural writes — re-fetch with `get_tree_summary` before next `update_styles`
- Paper MCP can disconnect mid-session — `get_basic_info` to check; ask user to re-open the Paper file

## Output

- One or more named Paper artboards with the component rendered
- Screenshot of each, studied and described
- Hand-off note to the user: ready for visual feedback, ready for `paper-to-code` when tightened
