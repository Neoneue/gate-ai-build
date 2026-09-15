# Figma live-MCP mode extraction protocol

**Highest-fidelity source of truth.** Use when the user provides a `figma.com/design/...`, `figma.com/board/...`, or `figma.com/make/...` URL, or references a Figma file.

Figma is the *design source*, so tokens come out **named at the source** (e.g. `Primitives/color/brand/500`, not just `#0E1012`). Bound variables, published text styles, component-set variants, and collection modes (light ↔ dark ↔ high-contrast) are all retrievable through the official Figma MCP — no inference.

**Tools:** Only `mcp__plugin_figma_figma__*`. Never `figma-console` MCP, never `figma_execute`, never the Desktop Bridge plugin.

## 0. Parse the URL

| URL pattern | What to extract |
|---|---|
| `figma.com/design/:fileKey/:fileName?node-id=1-2` | `fileKey` + convert `node-id` dashes to colons → `1:2` |
| `figma.com/design/:fileKey/branch/:branchKey/:fileName` | **Use `branchKey` as `fileKey`** — branch overrides main |
| `figma.com/board/:fileKey/...` | FigJam file — call `get_figjam`, not `get_design_context` |
| `figma.com/make/:makeFileKey/...` | Figma Make file — use `makeFileKey` |

If no node-id is provided, the user's current selection is used. Ask the user to select the target artboard or component first when possible — it anchors every downstream call.

## 1. Preflight

```
mcp__plugin_figma_figma__whoami
mcp__plugin_figma_figma__get_libraries
```

`whoami` confirms the MCP has file access. `get_libraries` tells you which design-system libraries this file subscribes to — critical because **tokens and text styles that live in a subscribed library are not directly enumerable from the consuming file**. If the target file consumes a kit, you may need the kit's own `fileKey` to pull its variables directly.

Classify the file in one sentence:
- **Kit / design system file** — primary home of variables + components. Run full extraction here.
- **Product file** — consumes a kit. Read tokens through `get_design_context` (they come back bound to the kit's collection/name). For the full token catalog, open the kit file separately.
- **FigJam / Make** — different tool surface; only get_figjam / make-specific context applies.

## 2. Structural overview

```
mcp__plugin_figma_figma__get_metadata(fileKey, nodeId)
```

Returns XML with node IDs, types, names, positions, sizes — no styles. This is the a11y-tree equivalent. Use it to:

- Identify page structure (artboards, frames, component sets)
- Find canonical component nodes to query in step 4
- Spot naming conventions (e.g. `Button/Primary/Default`, `Button/Primary/Hover`) that reveal the variant grid

Skip this step for Figma Make files — it's not supported.

## 3. Pull all variable collections — the `:root` equivalent

```
mcp__plugin_figma_figma__get_variable_defs(fileKey, nodeId?)
```

Returns every variable collection the node (or file) references: colors, spacing, radii, typography-relevant numeric tokens, and — critically — **modes** (light / dark / brand-alt / high-contrast).

Map the response into `design.md` as:

- **§2 Colors** — each color variable becomes a cited row (`#0E1012 ← figma-live: Primitives/color/neutral/950, mode=Light`) + an entry in the YAML `colors` block. For a multi-mode collection, list each mode side by side in the table; YAML ships light-mode values.
- **§3 Typography (numeric)** — font-size / line-height / letter-spacing if stored as variables, feeding the YAML `typography` block. Font families are rarely variables; pull those from step 4.
- **§4 Layout + §6 Shapes** — spacing scale (`--space-*`) into YAML `spacing`; radius scale (`--radius-*`) into YAML `rounded`.

Add a **Collections & Modes** subsection at the top of §2 when the file has more than one mode, mapping each variable name to its mode-specific value.

## 4. Per-component extraction — `get_design_context`

```
mcp__plugin_figma_figma__get_design_context(fileKey, nodeId)
```

**The primary tool.** Returns React+Tailwind code, a screenshot, and contextual hints for one node. Run it once per canonical component visible in the design:

1. Primary button (filled / commit) — note variant state if it's a component-set node
2. Secondary button (outlined / ghost)
3. Icon-only button
4. Text input — default, focused, error (each is typically a variant in a component set)
5. Card / container
6. Table row / data cell (if the kit includes data components)
7. Nav item — active / inactive
8. Tab — active / inactive
9. Chip / badge / pill
10. Modal / dialog shell (for §6 L4 elevation)
11. Popover / menu shell (for §6 L3 elevation)
12. Heading scale — H1, H2, body (when represented as text-style samples)

For each, read the returned code + hints for:

- `font-family` / `font-size` / `font-weight` / `line-height` / `letter-spacing` — may be literal OR `var(--...)` when bound to a text-style or variable
- `background-color`, `color`, `border` — will cite `var(--...)` when bound; will be a raw hex when unbound (flag as lower-confidence)
- `border-radius`, `padding`, `gap`
- `box-shadow` — for §6 elevation
- **Code Connect mapping** — if hints include a `// @figma codeConnect: import Button from ...` line, the kit is already wired to a component library; record the path. Downstream agents can use the real component instead of re-implementing.
- **Component variants** — when the node is a component-set, hints enumerate available properties (`variant=primary|secondary|ghost`, `size=sm|md|lg`, `state=default|hover|active|disabled`). Capture the full variant matrix.

## 5. Text styles

Published text styles are the Figma analogue of a type scale. Three ways to get them:

- **Best:** if the file has published text styles, they appear in the variable/style catalog via `get_variable_defs` or embedded in the `get_design_context` output as `textStyle: "heading/h1"`.
- **Via representative node:** sample a canonical H1, body, caption text node with `get_design_context` — the returned CSS cites the style name.
- **Library text styles consumed from another file are not reachable** on the consuming file. Navigate to the library file (using its own `fileKey`) and re-run §3–5.

For each text style record: `name ← figma-live: textStyle=<name> — font-family: ... / size / weight / line-height / letter-spacing`.

## 6. Screenshot for §1 tone + verification

```
mcp__plugin_figma_figma__get_screenshot(fileKey, nodeId)
```

Save to `<product>/_scratch/figma-<nodeName>.png`. This feeds §1 Overview (prose description of the aesthetic) and serves as a visual check against the token values — if the screenshot looks black-on-white but your tokens say `#FF0000`, something mis-resolved.

## 7. Citation format

- `#0E1012 ← figma-live: fileKey=abc123, Primitives/color/neutral/950, mode=Light`
- `24px ← figma-live: fileKey=abc123, Typography/size/heading/h1 (bound variable)`
- `font-family: "Inter" ← figma-live: textStyle=heading/h1, node=5:12`
- `shadow-md ← figma-live: get_design_context node=12:45, effects[0] = Drop Shadow, 0 4px 8px rgba(0,0,0,0.08)`
- `variant=primary|secondary|ghost ← figma-live: component-set properties on Button node 8:1`

Always capture the **variable path** (`Primitives/color/brand/500`), not just the hex. Variable paths are the app's canonical names and travel cleanly into code (e.g. Tailwind `theme.extend.colors.brand[500]`, shadcn semantic tokens).

## 8. Modes (light / dark / etc.)

When `get_variable_defs` returns a collection with multiple modes, document **every mode** in `design.md`. Typical layout:

```markdown
### Collections & Modes

This kit defines 2 modes in the `Primitives` collection:

| Token | Light | Dark | Source |
|---|---|---|---|
| `color/surface/default` | `#FFFFFF` | `#0E1012` | figma-live: Primitives, mode=Light / Dark |
| `color/content/default` | `#181B1E` | `#F4F5F6` | figma-live: Primitives, mode=Light / Dark |
```

Do not collapse modes into one column — that's how dark-mode bugs get written back into code.

## 9. Component sets & variants

A component set (the pink-purple bundled component node) exposes variant properties via `get_design_context` hints (and via `get_metadata` naming). Typical shape:

```
Button
  variant: primary | secondary | ghost | destructive
  size:    sm | md | lg
  state:   default | hover | active | disabled | focus-visible
  icon:    none | leading | trailing | only
```

For §7 Components + the YAML `components` block, render **one block per variant intersection worth documenting** — realistically: (primary, secondary, ghost) × (default, disabled) × default size. Don't document every combinatorial cell; pick the ones with distinct visual tokens.

Mature kits can expose 100+ button variants, but they typically collapse to ~6 distinct token sets once you factor out icon/size/state — that's what §7 should capture.

## 10. Where Figma live-MCP fails

| Symptom | Diagnosis | Action |
|---|---|---|
| `get_variable_defs` returns `[]` | File uses ad-hoc hex fills, no published variables | Fall back to per-node `get_design_context`; tag values as `figma-observed` (still higher trust than screenshot `observed`, because the source data is the design file) |
| Text styles unreachable | File consumes library styles, none are local | Navigate to the library file directly — it has its own `fileKey` |
| `get_design_context` returns absolute-positioned freeform CSS | Loosely structured design (no auto-layout, no components) | Use the returned screenshot + note "unstructured source; recommend codifying in the kit before building" |
| Node is inside a component instance and overrides are opaque | Nested overrides | Navigate to the component definition, not the instance |
| FigJam board URL | Wrong tool surface | Call `get_figjam`; do not attempt `get_design_context` |
| Figma Make URL | Different file type | Request `makeFileKey`; `get_metadata` is unsupported |

## 11. Hybrid mode: Figma + live-browser

When a product has both a Figma kit file and a deployed app:

1. Run Figma protocol — capture named tokens (`Primitives/color/...`) and component-set variants.
2. Run browser live-MCP protocol — capture the computed CSS custom properties in the running app.
3. **Cross-reference.** For each Figma variable, find the matching CSS variable in the browser. Record matches and **flag drift**:
   > `⚠ drift — Figma says color/brand/500 = #0E1012; browser computed --color-primary = #000000. Code is one step off the design.`

When the Figma kit and the live code diverge, surface that mismatch in the extraction summary — it's the work list for a design↔code reconciliation. Don't embed it as a section in `design.md`.

## 12. Stop conditions

- Variables + text styles + representative component contexts captured → fill the template in one pass.
- File is a product consumer of a library and library tokens don't appear → ask user for the library file URL; re-run against that.
- Design file has no variables, no text styles, no components (pure flat design) → tell the user the kit needs codification before extraction will be useful; offer to extract what's there but flag it as low-structure.
- Repeated MCP errors / rate limits → fall back to screenshot mode on the Figma node (`get_screenshot` still works even when context calls fail) and mark tokens as `observed`.

## 13. Efficiency notes

- **One `get_variable_defs` per file** (scoped to the whole file, not per-node) — dumps everything in one round-trip.
- **One `get_design_context` per canonical component** — 10–12 calls covers a typical kit.
- **Cache the variable dump to `<product>/_scratch/figma-variables.json`** — if you need to re-reference, read the cache; don't re-query.
- **Never send_code_connect_mappings or add_code_connect_map without explicit user request.** The extractor is a reader, not a writer. Code Connect is a separate, opt-in workflow.
- **Never create or modify nodes.** This skill does not draw on the canvas. If the user asks for design edits, route to the Paper/Figma build skills instead.
