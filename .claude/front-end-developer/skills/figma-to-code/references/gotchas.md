# Gotchas — figma-to-code

Edge cases and known issues with the Figma MCP extraction pipeline. Skim before each session; deep-read the relevant entries when you hit them.

## Tool-level

### `get_design_context` 20 KB output limit

Complex frames (full screens with many children) often exceed the inline-result size cap. When that happens:

- The tool returns an error or truncation message AND saves the full output to a file path
- **You must read the persisted file in full chunks** until you've covered every component / icon / text node you need
- Do not summarize from a truncation preview — that's how text gets fabricated (Case 1 in `anti-fabrication-examples.md`)

If even the file is too large to process at once, extract sub-trees:

```
get_design_context({ nodeId: <child-node-id> })
```

Drill down to component-level instances rather than asking for the whole screen at once.

### `get_design_context` unavailable at page/canvas level

On some MCP hosts, calling `get_design_context` on the root page node returns "nothing selected" or a similar error. The tool requires a specific child nodeId.

Workaround: call `get_metadata` first on the page, get the children's node IDs, then call `get_design_context` on a specific frame.

### Persisted output URL expiration

When `get_screenshot` returns an asset URL hosted at `https://www.figma.com/api/mcp/asset/<id>`, the URL is short-lived. Download immediately via `curl` if you'll need the image later. Do not pass these URLs back to the user as references — they'll be 404 by the time the user clicks.

## Figma source-side

### Hardcoded hex in output means unbound source

If `get_design_context` returns Tailwind with raw `#hex` values instead of semantic classes (`bg-[#fafafa]` vs `bg-background`), the source frame doesn't have variables bound. **This is a Figma issue, not a code issue** — fix in Figma, then re-extract.

Don't paper over by pattern-matching the hex to a guessed token name. Flag the gap in your report and ask the user to bind variables.

### Figma exports text as `<p>` regardless of intended semantic role

The reference JSX from `get_design_context` wraps every text node in `<p>`. Don't trust that for h1/h2/h3 hierarchy. Judge semantic level from:

- Visual size (largest text on page = h1)
- Position (top of page, top of section)
- Uniqueness (one h1 per page; section headings are h2)
- Designer annotation if available

Set the right semantic tag in the adapted code.

### Image fills named `Screenshot_*` are flattened raster regions

If a component's content is rendered as a single image fill with a name like `Screenshot 2026-04-28 at 12.01.42 PM`, the design's "body text" is actually a flattened image. Almost always a designer convenience, not the intended ship state.

Confirm with the user: should this be live text in code? (For blog posts, marketing pages, articles: yes.) If yes, ask the user for the source text — the screenshot is a placeholder, not the content.

### Library-sourced styles arrive as `instance` nodes

Components imported from a Figma library show up as `INSTANCE` nodes in `get_metadata`. `get_design_context` resolves them, but variable names may reference the library's `fileKey` rather than the consuming file's. To get exact tokens, query the library `fileKey` directly.

### Frame names vs component names

Figma frame names like `Variant=Primary, Size=Default` are **variant property values**, not class names. They become props on shadcn components, not part of the className text.

Wrong:
```tsx
<button className="Variant=Primary, Size=Default">Save</button>
```

Right:
```tsx
<Button variant="primary" size="default">Save</Button>
```

## Code-side

### Figma exports use arbitrary Tailwind values

Output often has `rounded-[26px]`, `h-[36px]`, etc. — exact-pixel values from Figma instead of scale steps. Decide per case:

- **Preserve arbitrary** when the value is intentionally off-scale (specific brand pill radius, magic ratio in a hero)
- **Map to scale** when the value is approximately a scale step (`rounded-[8px]` → `rounded-md`, `h-[40px]` → `h-10`)

When mapping, confirm the scale step exists — don't substitute `rounded-md` for `rounded-[26px]` because they're "close" — that's a 6px difference that ships visibly wrong.

### Absolute positioning preservation

Figma auto-layout maps cleanly to flexbox. Absolute-positioned children (overlays, badges, decorative chrome) come through as `style="position: absolute; top: 8px; right: 8px; ..."`.

Decide per project convention:

- **Tailwind project** — convert to `absolute top-2 right-2`
- **Inline-style project** — preserve as-is
- **Components-only library** (motion-graphics, design-system kit) — preserve as inline style if components must be portable

### Code Connect mappings exist even when you don't ask

`get_design_context` runs Code Connect resolution by default. If the team has set up mappings, the output will use the mapped React component. Usually correct.

Override with `disableCodeConnect: true` only when the user specifically wants raw markup (rare — usually for inspecting what a frame "really" contains).

### Mode handling — light + dark in one component

If the Figma file has `Mode: Light` and `Mode: Dark` variables bound, the output Tailwind already carries semantic classes (`bg-background`, `text-foreground`) that resolve per-mode via the project's `.dark` class toggle.

**Don't generate two separate components** ("WalletScreenLight" and "WalletScreenDark"). One component + semantic tokens + CSS custom properties handles both modes.

## Render-pipeline-side

### `tsc` doesn't read tsconfig.json when files are listed explicitly

```bash
npx tsc --noEmit wallet/*.tsx tokens.ts types.ts
```

This runs tsc, but it ignores any nearby `tsconfig.json` because explicit file lists override project mode. Pass flags directly:

```bash
npx tsc --noEmit \
  --jsx react-jsx \
  --target es2022 \
  --moduleResolution bundler \
  --module esnext \
  --strict \
  --skipLibCheck \
  --esModuleInterop \
  wallet/*.tsx tokens.ts types.ts
```

Or use `-p tsconfig.json` to compile in project mode (which reads `include`).

### `tsx` requires `jsx: react-jsx` in tsconfig.json or it fails at runtime

Running a `.tsx` script with `tsx <file>` requires either:

- `tsconfig.json` with `"jsx": "react-jsx"` in `compilerOptions`, OR
- An older-style top-of-file `import * as React from 'react'`

Without one of these, the script fails with `ReferenceError: React is not defined` at the first JSX expression.

### `@types/node` needed for `import { writeFileSync } from 'node:fs'`

If your render script imports from `node:fs` or any other Node built-in, `tsc` will error with `Cannot find module 'fs'` unless `@types/node` is installed and `"types": ["node"]` is in tsconfig.json (or the tsconfig-default `types` resolution finds it).

## Asset-side

### Figma asset URLs include 4-character session signatures

A Figma SVG/PNG asset URL like `https://www.figma.com/api/mcp/asset/abc123` is signed for the current MCP session. After the session closes, or after ~minutes, the URL 404s.

**Always download immediately via curl when you receive an asset URL.** Save to the workspace's `assets/` folder. Reference assets via local relative paths in code, never via the original Figma URLs.

### Inline SVG vs `<img src>` for icons

When extracting icons:

- **Stroke-only or fill-with-currentColor** icons → inline `<svg>` so they inherit text color
- **Multi-color brand glyphs** → can be inline SVG (preserve colors) or `<img>` to a saved file
- **Photographs / complex artwork** → `<img>` to a saved file

Inline SVG is the default for UI icons. Don't use `<img src="data:image/svg+xml;base64,...">` — that's bloat that breaks tree-shaking and inline styling.

### `paper-asset://` paths

If a Paper-derived component used `paper-asset:///path/to/file.svg` for image references, those are Paper-internal protocols. Convert to standard relative paths (`./assets/...`) before using outside Paper.
