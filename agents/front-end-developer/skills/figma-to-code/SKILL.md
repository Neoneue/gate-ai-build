---
name: figma-to-code
description: Bring a Figma frame back to React / HTML code. Primary tool is `get_design_context`. This skill enforces verbatim extraction discipline (no fabricated text, icons, or variants) and handles both single-component extraction and multi-component flow extraction (whole screens, multiple states). For flows, follows a strict spec-first pipeline so build agents work from transcribed truth, never from memory or screenshots alone.
argument-hint: "[Figma URL or fileKey+nodeId, target file path or workspace path, scope: component|flow]"
license: MIT
metadata:
  author: front-end-developer
  version: "2.0.0"
---

# figma-to-code

Extract a Figma frame into production React code. `get_design_context` returns reference JSX; this skill is the **adaptation + discipline** layer that prevents the most expensive failure mode: shipping a build full of plausible-looking but fabricated content (text, icons, variants, prop shapes) that doesn't actually match Figma.

This skill covers two scopes:

1. **Single component** — one button, one card, one section. The original `figma-to-code` flow.
2. **Flow / screen** — a whole app screen made of many sub-components (status bar, header, balance section, action buttons, transaction list, tab bar, etc.), often with multiple states (empty, populated, loading, error, dialog-open). Output is a folder of React components plus a composition. **Read `references/multi-component-flow.md` whenever the scope is a flow.**

## Hard rules — anti-fabrication discipline (read first, every time)

These rules exist because the most common failure on this skill is producing a "looks right but isn't" build. The output passes a casual eye but breaks under user scrutiny because text strings, icon SVGs, or variant flags were invented from training data, the agent's screenshot interpretation, or pattern-matching against known libraries.

1. **Every text string must trace to a Figma text-node read.** Subtitles, labels, timestamps, button copy, status strings — read the actual text node's value via `get_design_context` or `get_metadata` and use that string verbatim. **Mock data in Figma IS the canonical content** (e.g. `MoonPay`, `0x123acb…`, `Coinbase Inc.`, `10m ago`, `Failed`) — not placeholder for "real" content. If the user wants different content, they'll tell you. Do not invent timestamps, addresses, names, or any string Figma already specifies.

2. **Every icon SVG must come from `get_design_context` on the icon's specific node. No exceptions.** Capture the exact `d=` path data, `viewBox`, `stroke-width`, `stroke-linecap`, `stroke-linejoin` from the Figma response. Do not pattern-match icon names to a known library (Heroicons, Lucide, Carbon, Phosphor) — names drift across versions, names lie about path shape, and pattern-matching looks fine in code review then ships wrong glyphs the moment the designer customizes anything. If the icon node is named `heroicons-outline/cog-6-tooth`, you still extract the path from the rendered node — you do **not** substitute the published Heroicons v2 path "because it's the same icon." Do not skip extraction "because the canonical and Figma renderings look identical right now" — Figma is the source of truth, identical-today does not mean identical-tomorrow, and the moment a designer tweaks a stroke or rounds a corner, the canonical-path build silently diverges. Always extract. Always inline what Figma renders. No judgment calls.

3. **Every variant flag (halo, badge, branding, accent) must trace to a specific Figma node.** "Three of four cards have a halo" is not justification for adding a halo to the fourth — read the fourth card's node and check whether the halo property is present. Per-instance overrides are common; do not generalize.

4. **Prop shapes must be read, not guessed.** Before writing a component invocation in any render script, preview harness, or test, read the target component's `.tsx` file and use the actual prop names. `<ActionButton kind="buy" />` looks plausible but compiles to broken output if the real prop is `{ icon, label }`.

5. **When uncertain, ASK before inventing.** "What text should go here?" / "Which state is canonical, empty or populated?" / "Should I include the brand-image avatars or use generic icons?" — these questions cost 30 seconds. Inventing answers costs 30 minutes of rework when the user catches the fabrication.

See `references/anti-fabrication-examples.md` for concrete failure cases from past sessions.

## When to use

- After `code-to-figma` + team iteration, to bring refinements back
- When a designer hands off a Figma frame ready for implementation
- When extracting a whole app screen or flow into a component library (motion graphics, marketing site, design-system kit)
- When a Figma component set has been updated and the code needs to follow

**Don't use when:**
- The Figma file is a sketch/wireframe — ask for variable binding + auto-layout completion first
- The frame has no variables bound — output will be raw hex, breaks downstream token discipline. Either run `design-extractor` first to document, or ask the user to bind tokens in Figma.

## Prerequisites

1. **Official Figma MCP connected** — `mcp__plugin_figma_figma__*`. `whoami` returns data.
2. **fileKey + nodeId** — parse from URL (`node-id=1-2` → nodeId `1:2`)
3. **Target path** — for single components: target file. For flows: target workspace folder. Never guess.
4. **Active contract loaded** — `globals.css` + `components/ui/*.tsx` so you know which raw elements can be swapped for shadcn primitives

## Required reading before first extraction

- `knowledge/figma/mcp-workflow.md` §get_design_context + §Code Connect
- `knowledge/shadcn/default-tokens.md` — recognize shadcn semantic Tailwind in the output
- `knowledge/figma/figma-component-reference.md` — inverse mapping (shadcn ↔ Figma frame names)
- **`references/anti-fabrication-examples.md`** — five concrete failure cases and how to avoid them
- **`references/multi-component-flow.md`** — only when extracting a flow / whole screen

## Pre-flight — ask these BEFORE the first MCP call

The biggest source of rework is starting extraction against the wrong node or the wrong state. Two minutes of confirmation saves an hour of rebuild.

1. **Scope: component or flow?** "One button" vs "the whole wallet screen with all its sub-components." Determines whether you follow the single-component path below or `references/multi-component-flow.md`.
2. **Which state is canonical?** Most screens have many states in Figma — empty, populated, loading, error, success, dialog-open, with/without notification, etc. Get the node IDs for each state the user wants represented. **Don't assume the first node URL is the canonical state.**
3. **Which file/folder?** Confirm the target before writing.
4. **New or update existing?** If updating, preserve the existing prop signature; only replace the JSX body.
5. **Single mode or light + dark?** If Figma has mode variables, one frame typically renders both via semantic tokens — you'll capture both modes in one extraction.

## Process — single component

For multi-component flows, jump to `references/multi-component-flow.md` after step 1.

### 1. Confirm scope

See pre-flight. Don't proceed until the four answers are explicit.

### 2. Check for Code Connect mappings

```
Call: get_code_connect_map({ fileKey })
```

Returns mapped components. If the target frame (or its descendants) has mappings, **honor them** — the team already decided which React component that frame corresponds to. Output imports the mapped component instead of generated markup.

### 3. Pull the design context (primary tool)

```
Call: get_design_context({ fileKey, nodeId, clientFrameworks: "react,nextjs", clientLanguages: "typescript,css" })
```

Returns:
- **Reference code** — React + Tailwind JSX. Adapt to the project stack — never copy-paste verbatim.
- **Screenshot** — your visual target. Keep it in view.
- **Component metadata** — variant props on component-set nodes, designer annotations.
- **Code Connect hints** — referenced inline if mappings exist.

Note while reading the output:

- Arbitrary Tailwind values (`rounded-[26px]`, `h-[36px]`) — preserve arbitrary or map to scale (decide per case)
- **Hardcoded hex** — red flag. Source frame didn't bind variables. Flag in the adaptation; don't paper over.
- **Absolute-positioned elements** — preserve or restructure per project convention.
- **Figma exports text as `<p>` regardless of intended semantic role.** Don't trust the JSX tags from the export for h1/h2/h3 hierarchy — judge from visual size + position. Set the right semantic tag in your adaptation.
- **Image fills named `Screenshot_*` or similar** — these are flattened raster regions in the design. Confirm with the user whether the body should be live text in code (almost always yes for marketing/blog content). Don't ship the screenshot.

### 4. Pull variable bindings (optional precision)

```
Call: get_variable_defs({ fileKey, nodeId })
```

Returns flat map of variable names to resolved values. Use to rewrite hardcoded OKLCH in `get_design_context` output to semantic Tailwind classes (`bg-[oklch(0.97 0 0)]` → `bg-muted`).

### 5. Verbatim transcription pass — text and icons

Before adapting the JSX, dump the literal content. This is the discipline check:

- **Text**: list every text-node value the frame contains. Subtitle, label, button copy, timestamp, status string, alt text. Each one is a string you'll use verbatim in `defaultProps` or as a prop default. Do not paraphrase, normalize, or invent.
- **Icons**: for every icon in the frame, drill into the icon's specific node and call `get_design_context` on it (not on the parent). Capture the SVG path data verbatim. If the icon is a Code Connect mapped component, prefer the mapped import. Otherwise inline the SVG.

If the Figma `get_design_context` response exceeds the tool result size limit (often happens for full screens), the tool persists output to a file. **Read it in full, in chunks if needed**. Skipping persisted output because "the truncated preview looks fine" is exactly how text strings get fabricated.

### 6. Adapt the JSX

**Honor Code Connect mappings first.** For any descendant node with a mapping, use the mapped component import:

```tsx
// get_design_context output (before mapping):
<button className="h-9 px-4 py-2 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2">
  <CheckIcon className="h-4 w-4" />
  Save
</button>

// After Code Connect swap:
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

<Button>
  <Check className="h-4 w-4" />
  Save
</Button>
```

**Swap raw elements for shadcn primitives** even when Code Connect isn't mapped — same swap table as `paper-to-code/SKILL.md` §3. Read `components/ui/*.tsx` to know what's installed.

**Adapt imports** to project conventions:
- Icons → installed icon set (`lucide-react`, `@carbon/icons-react`, `@heroicons/react`, or inline SVG)
- `cn()` from `@/lib/utils`
- shadcn primitives from `@/components/ui/*`
- Types from project-local paths

**Restore React idioms:**
- Props (`onClick`, `onChange`, `value`, `disabled`) — ask user what interactions are needed
- State (`useState`, `useReducer` as needed)
- Dynamic content — replace static values with real prop interfaces, but **keep the exact Figma strings as `defaultProps`**, not invented placeholders
- Server vs client boundary (Next.js App Router) — decide `"use client"` based on state/handlers

**Mode handling:** if Figma has dark mode variables bound, the output Tailwind already carries semantic classes (`bg-background`, `text-foreground`) that resolve per-mode via the project's `.dark` toggle. One component handles both modes — don't generate two.

### 7. Verify against the screenshot

Open the Figma screenshot side-by-side with your adapted code. Confirm:

- Same visual hierarchy
- Same spacing rhythm
- Same component choices (shadcn primitives where available)
- **Text strings match Figma verbatim** — not paraphrased
- **Icons match Figma verbatim** — same shape, same stroke style
- **All variants (halo / badge / state) match per-instance** — not generalized across siblings
- No hardcoded hex remaining (unless flagged as "needs token" for design.md drift)

### 8. Write to target

```
Write: <target file path>
```

Confirm with user before overwriting an existing file.

### 9. Drift entries (optional)

If the project maintains a `design.md`:
- Any value in the Figma extract that disagreed with `design.md` declared tokens → flag in Drift
- Any new component pattern → add to §4 Components
- If `get_variable_defs` revealed a new token → add with `figma-live` confidence tag

### 10. Hand off

Tell the user:
- File written at `<path>`
- Any prop restoration that still needs their input
- Any Code Connect mappings honored (by name)
- Any drift flagged for review
- **Anything you couldn't verify against Figma** — be explicit about gaps. "I extracted the icon SVG verbatim but the response didn't include the stroke-width; I used 1.5 as the project default. Confirm or correct."

## Process — multi-component flow

When extracting a whole screen / flow with multiple sub-components and possibly multiple states, the single-component flow above doesn't scale. Read **`references/multi-component-flow.md`** for the spec-first pipeline:

1. **Inventory pass** — list every sub-component and every state-frame node ID
2. **Verbatim spec extraction** — JSON file with every text node, every icon SVG, every token, every asset URL — type-checked against a schema
3. **Component build** — react components built from the spec, never from memory
4. **Preview render** — durable, type-checked SSR preview script (not regenerated from memory each iteration)
5. **Visual audit** — diff each component against its Figma reference screenshot
6. **defaultProps verification** — every string and value in `defaultProps` traces back to a specific Figma node ID

The reference also documents the spec schema, the preview-script pattern, and the file/folder layout that makes the pipeline replicatable across flows (wallet, send, receive, settings, etc.).

## Common failure modes (what NOT to do)

These are real mistakes from past sessions. See `references/anti-fabrication-examples.md` for full case studies.

1. **Inventing transaction subtitles.** "Today, 9:24 AM" / "Yesterday, 6:41 PM" — when Figma had `MoonPay`, `0x123acb…`, `Coinbase Inc.` sitting in text nodes. Cause: extracted the wrong state-frame, then made up data instead of asking for the right one.
2. **Pattern-matching icons by Heroicon name.** Spec said `heroicons-outline/cog-6-tooth`, agent imported the published Heroicons v2 path — but Figma's rendered glyph at that node had drifted from canonical. Different shape, looks wrong, ships wrong. Fix: extract path from `get_design_context` on the icon node.
3. **Generalizing a variant across siblings.** Three of four app cards have a yellow halo; agent added halo to the fourth. Figma actually had no halo on the fourth (the brand image covered any underlying fill). Fix: read each instance node, don't generalize.
4. **Guessing component prop shapes.** Render script wrote `<ActionButton kind="buy" />` from memory; real prop was `{ icon, label }`. Empty pill chrome shipped to preview. Fix: read the component file before invoking.
5. **Re-writing the SSR preview script from memory each iteration.** Each rewrite introduced a new regression. Fix: persist `scripts/preview.ts` in the workspace, type-check it alongside the components.

## Gotchas

See `references/gotchas.md` for the full list. Highlights:

- **20 KB output limit** on `get_design_context` — complex frames truncate. Extract sub-trees if needed.
- **`get_design_context` is unavailable at page/canvas level** on some MCP hosts — query a specific child node.
- **Hardcoded hex in output means unbound source** — fix in Figma, not in code.
- **Absolute positioning** translates to `style="position: absolute; ..."` — match project convention.
- **Code Connect code generation** runs even when mappings exist; `disableCodeConnect: true` overrides if needed (rare).
- **Frame names vs component names** — `Variant=Primary, Size=Default` becomes variant props on shadcn components, not className text.
- **Library-sourced styles** — library components arrive as `instance` nodes; `get_design_context` handles them but variable names may need querying the library `fileKey` directly.
- **Figma exports text as `<p>` regardless of intended role.** Trust visual hierarchy, not the export tags.
- **Persisted-output files from oversized responses** must be read in full. Skipping = invented content.

## Output

- Updated or new React component file(s) at the target path
- Honored Code Connect mappings (listed in reply)
- Drift entries surfaced for `design.md` review
- Open questions for the user (interactions / props that need confirmation)
- For flows: spec file, component folder, preview HTML, all type-checked together
