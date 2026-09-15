# Multi-component flow extraction

Extracting a whole app screen / flow from Figma into a structured React component library. Use this when a single Figma frame contains many sub-components (status bar, header, card, list, tab bar, …) and possibly multiple states (empty, populated, loading, error, dialog-open). The deliverable is a folder of React components plus a composition, not a single component file.

This is the path for: motion-graphics flows, marketing pages composed of many sections, design-system showcase screens, app-flow extractions for documentation, anything where the unit of work is "the whole screen, byte-for-byte."

The single-component path in `SKILL.md` doesn't scale here because: there are too many sub-components to extract in one MCP call; multiple Figma states need merging into prop variants; the build needs a preview harness so the user can audit visually; and the strings/icons/values get fabricated unless the agent works from a transcribed spec rather than memory.

## The pipeline (six phases, run in order)

```
1. Inventory       (orchestrator + user)
2. Verbatim spec   (extraction agent)
3. Component build (build agent, reads spec)
4. Preview render  (durable script, type-checked)
5. Visual audit    (user + orchestrator)
6. Iteration       (small targeted edits, no full rebuilds)
```

Each phase has explicit inputs and outputs. Skipping a phase or merging two phases is the most common failure mode.

---

## Phase 1 — Inventory

**Done by:** orchestrator + user, before any MCP call.

**Output:** a written list of:

- The flow's name (e.g. `wallet`, `send`, `settings`)
- Which states are canonical (empty / populated / loading / error / dialog-open / …)
- The Figma node URL for each canonical state
- The target workspace folder (where components will live)
- The visual width target (mobile 393, desktop 1440, etc.)
- Any variants the user explicitly wants vs explicitly excludes (e.g. "include MoonPay/Coinbase brand avatars" or "use generic icon avatars only")

**Why this phase exists:** the single biggest source of rework is starting extraction against the wrong node or the wrong state. Most app screens have many sibling state-frames in Figma; the user knows which one is "the source of truth," but the agent doesn't.

**Anti-pattern (don't do):** "I'll start with whatever node URL was shared and figure out the states later." This produces a build for the wrong state, which the user catches on review, which forces a full rebuild.

---

## Phase 2 — Verbatim spec

**Done by:** extraction agent. Single-purpose: read Figma, dump truth, write nothing else.

**Output:** a JSON spec at `<workspace>/spec/<flow-name>.json` matching the schema below. Plus per-component reference screenshots at `<workspace>/spec/components/<name>.png` and a full-screen reference at `<workspace>/spec/<flow-name>.png`.

**The agent's only job is transcription.** It does not interpret, generalize, or pattern-match. It reads Figma nodes and writes their values. If it doesn't know, it leaves the field null and notes the gap — never invents.

### Spec schema (TypeScript)

```ts
type FlowSpec = {
  source: {
    fileKey: string;
    rootNodeIds: string[];   // one per canonical state
    extractedAt: string;     // ISO date
    figmaUrls: string[];
  };

  viewport: {
    width: number;
    height: number;
    background: string;      // verbatim from Figma — hex or oklch
  };

  tokens: {
    colors: Record<string, { value: string; usage: string }>;
    typography: Array<{
      role: string;
      fontFamily: string;
      fontWeight: number;
      fontSize: number;       // px
      lineHeight: number | string;
      letterSpacing: string;  // em or px
      usage: string;
    }>;
    spacing: Record<string, number>;     // tokens → px
    radii: Record<string, number>;
    shadows: Record<string, string>;
  };

  components: Array<{
    name: string;             // e.g. "TransactionRow"
    figmaNodeId: string;      // canonical instance
    bounds: { width: number; height: number };
    structure: string;        // concise layout description (flex direction, gaps, alignment)
    children: Array<ComponentChild>;
    screenshotPath: string;   // relative to spec/
    notes: string;            // only non-obvious gotchas

    // Per-instance variant data (do NOT generalize):
    instances: Array<{
      figmaNodeId: string;
      variantProps: Record<string, unknown>;
      textValues: Record<string, string>;  // every text node, verbatim
    }>;
  }>;

  icons: Array<{
    name: string;             // e.g. "header.cog", "transactionRow.received"
    figmaNodeId: string;
    viewBox: string;          // e.g. "0 0 24 24"
    paths: Array<{
      d: string;              // verbatim from Figma
      fill?: string;          // currentColor when stroked
      stroke?: string;
      strokeWidth?: number;
      strokeLinecap?: string;
      strokeLinejoin?: string;
    }>;
    notes: string;             // e.g. "drifted from canonical Heroicons v2 cog-6-tooth"
  }>;

  assets: Array<{
    name: string;             // e.g. "moonpay-logo"
    figmaNodeId: string;
    type: 'png' | 'svg';
    savedTo: string;          // relative to <workspace>/assets/
    sourceUrl: string;        // Figma asset URL (short-lived, for audit)
  }>;

  fullScreen: Array<{
    state: string;            // e.g. "populated", "empty"
    figmaNodeId: string;
    structure: string;        // ordered list of child component names
    componentInstances: Array<{
      componentName: string;  // matches components[].name
      instanceFigmaNodeId: string;
    }>;
  }>;
};
```

### Hard rules for extraction

1. **For each text node, dump the literal string value.** Do not paraphrase, normalize whitespace, or substitute placeholders. If Figma has `0x123acb…` (with the ellipsis character `…`), use `0x123acb…`, not `0x123acb...` (three dots).
2. **For each icon, drill into the icon's specific node and dump the SVG path data.** Don't pattern-match by Figma instance name to a Heroicons / Lucide / Phosphor library import. Names lie about path geometry.
3. **For each variant flag (halo, badge, accent), check every instance.** Three-of-four-have-X does not mean four-of-four. Read each instance node.
4. **The Figma `get_design_context` response often exceeds the tool result size limit.** When the tool persists output to a file, **read the file in full chunks** until you've found everything you need. Skipping persisted output is the single biggest source of fabricated content.
5. **If you can't determine a value from Figma, leave it null and note the gap in `notes`.** Do not invent. The build agent will refuse to ship a field with a `null` value, which is the correct behavior.

### What the spec is NOT

- Not a place for the extraction agent's interpretation, design opinions, or "iconRecipes" (mappings of Figma names to library imports)
- Not a place for default values or fallbacks the agent thinks would be sensible
- Not a place to skip values because they're "obvious" — extract them anyway

---

## Phase 3 — Component build

**Done by:** build agent. Reads the spec, writes React components and a composition.

**Output:** components in `<workspace>/<flow-name>/*.tsx`, a composition file (e.g. `<FlowName>Screen.tsx`), shared `tokens.ts`, shared `types.ts`, and a barrel `index.ts`.

### Hard rules for build

1. **Every value in component code must trace to a token in `tokens.ts` or a value in the spec.** No hardcoded colors, sizes, fonts, or spacings. If a value isn't in tokens, add it from the spec first.
2. **Every text string in `defaultProps` must come from the spec's `textValues` for the corresponding instance.** Never invent. If the spec has `subtitle: "MoonPay"`, the component's defaultProps says `subtitle: "MoonPay"`. If the spec is silent on a string, ask before defaulting.
3. **Every icon's SVG path must come from the spec's `icons[].paths`.** Inline as React components. No icon-library imports unless the user's project conventions require them (and even then, verify the library's path matches the spec — see `anti-fabrication-examples.md` Case 2).
4. **Per-instance variants are per-instance.** Map the spec's `instances[].variantProps` to the component's actual prop interface. Don't roll all instances up into a single "default" variant.
5. **Inline styles only** when the deliverable must be portable across renderers (Remotion, Next.js, plain React, MDX, etc.). Use `tokens.ts` values, not raw literals. When the deliverable lives in a known stack (Next.js + Tailwind), use the stack's idioms instead.
6. **TypeScript strict.** No `any`. Shared types in `types.ts`.

### Component file layout

```
<workspace>/
├── README.md                # what this is, file map, prop tables
├── tokens.ts                # from spec.tokens
├── types.ts                 # shared types (Transaction, ArcaApp, etc.)
├── assets/                  # from spec.assets
├── icons/                   # optional — if many icons share use, central registry
│   └── index.ts             # exports each icon as a React component
├── spec/                    # from Phase 2 — keep checked in
└── <flow-name>/             # the actual components
    ├── index.ts             # barrel export
    ├── <Flow>Screen.tsx     # composition + defaultProps
    └── *.tsx                # one file per component
```

### When to extract a shared `SectionHeader` component

If three or more components in the flow have the same heading pattern (`Title + chevron-right` or similar), extract it into a single `SectionHeader.tsx`. Don't duplicate the chevron SVG and the heading typography across components. Same goes for `BrandAvatar`, `IconAvatar`, `Pill`, etc. — extract once when the third instance shows up.

---

## Phase 4 — Preview render

**Done by:** persistent SSR render script in the workspace.

**Output:** a single HTML file at `<workspace>/preview.html` that renders the full screen plus a component gallery, openable via `file://` in any browser.

### Why a preview HTML?

Component-by-component visual audit is the only reliable way to catch the failure modes that type-checking misses (Case 4 in `anti-fabrication-examples.md`). The preview is a static HTML file because:

- Opens via `file://` — no dev server, no port, no node_modules in the workspace
- Renders the same React components users will consume — same code path, no separate "preview-only" components
- Can be regenerated from the source via one command
- Type-checked alongside the components, so prop-shape mismatches surface at compile time

### The render script lives in the repo

Put it at `<workspace>/scripts/preview.ts`. Include `<workspace>/scripts/package.json` with React + react-dom + tsx + @types/node + typescript pinned, plus a `tsconfig.json`. Then `tsx scripts/preview.ts` regenerates `preview.html` whenever components change.

**Do not** regenerate the script from memory each iteration. That's how Case 4 + Case 5 happen. The script is source code; treat it like any other file.

### Render script structure

```ts
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { tokens } from '../tokens';
import { <FlowName>Screen, defaultProps } from '../<flow-name>';
import * as components from '../<flow-name>';

// Override asset paths to be relative to preview.html location
const previewProps = { ...defaultProps, /* ...path overrides... */ };

const page = (
  <html>
    <head>{/* fonts, page styles */}</head>
    <body>
      <h2>Full Screen</h2>
      <<FlowName>Screen {...previewProps} />

      <h2>Component Gallery</h2>
      {/* one card per component, exercising all variants from spec */}
    </body>
  </html>
);

writeFileSync('<workspace>/preview.html', '<!DOCTYPE html>' + renderToStaticMarkup(page));
```

The Component Gallery should:

- Render each component in isolation at production width
- Exercise every variant from the spec (e.g. positive/negative/zero for a percent indicator; with/without halo for an avatar; empty/populated for a list)
- Use the components' real prop signatures — not made-up prop names

### Type-check the render script

Always include `scripts/preview.ts` in the same `tsc` invocation as the components:

```bash
cd <workspace> && \
  npx tsc --noEmit \
    --jsx react-jsx \
    --target es2022 \
    --moduleResolution bundler \
    --module esnext \
    --strict \
    --skipLibCheck \
    --esModuleInterop \
    scripts/preview.ts <flow-name>/*.tsx tokens.ts types.ts
```

If you skip the render script, you ship Case 4.

---

## Phase 5 — Visual audit

**Done by:** user, with the orchestrator helping diff.

**Process:**

1. Open `preview.html` in a browser
2. Open the Figma source screenshots side by side
3. Walk down the component gallery, comparing each component against its `spec/components/<name>.png`
4. Note any visual divergence

The orchestrator can use Chrome DevTools MCP to:
- Take screenshots at specific scroll positions
- Inspect computed styles on specific elements
- Verify color values, font families, spacing
- Confirm text content matches the spec

### Common divergences to look for

- Wrong icon (Case 2)
- Made-up text content (Case 1)
- Generalized variant (Case 3)
- Empty/broken component card in gallery (Case 4)
- Spacing or padding off — usually a token wasn't pulled from the spec
- Font weight subtly wrong — Figma exports often round font-weight values
- Stroke-width on icons wrong — check `references/gotchas.md`

---

## Phase 6 — Iteration

**Done by:** orchestrator, with surgical edits.

When the user flags a specific issue:

1. **Edit the source files directly.** Don't spawn a new agent to re-do the whole build for a one-icon swap.
2. **Re-run the existing render script.** `tsx scripts/preview.ts`. Don't rewrite the script.
3. **Re-type-check.** Same `tsc` invocation as before.
4. **Re-screenshot.** Confirm the change landed.

Surgical iteration is the payoff for the spec + persistent-script architecture. If you find yourself re-running Phase 2 or Phase 3 for a small change, the architecture broke down — diagnose where (usually: spec was lossy, or the agent worked from memory instead of the spec).

---

## Replicating across flows

Once the first flow ships, the second flow is dramatically faster because:

- `tokens.ts` is reusable — same Figma file, same design system
- `types.ts` extends naturally — add `SendForm`, `ReceiveAddress`, `Settings` types
- `assets/` accumulates — brand images persist
- `icons/index.ts` accumulates — central registry, deduplicated
- `scripts/preview.ts` extends — add a section per new flow
- The spec schema is identical

The pipeline for flow #2:

1. Phase 1: confirm canonical state(s), ask user for node IDs (5 min)
2. Phase 2: spec extraction agent (15–20 min for a screen with ~10 sub-components)
3. Phase 3: build agent reads spec, builds components, type-checks (15–25 min)
4. Phase 4: render script picks up the new flow automatically (just add a new section in preview.ts) (5 min)
5. Phase 5: visual audit (10 min)
6. Phase 6: targeted fixes (varies)

Total: ~60–90 minutes for a screen, half of which is agent execution time. The agent's wallclock is the floor; the human's time investment is just the inventory + audit phases.

---

## Anti-patterns specific to flow extraction

- **"Let me extract the screen and figure out the components afterward."** Inventory first. You'll discover three sub-screen states you didn't know about and rebuild.
- **"I'll just copy the inline icons from the Heroicons docs."** Read `anti-fabrication-examples.md` Case 2.
- **"The render script is just scaffolding, I'll regenerate it."** Read Case 5.
- **"This text looks like a placeholder, I'll substitute something more realistic."** Read Case 1. Figma's mock data IS the real content.
- **"Three of the four cards have a halo, the fourth was probably an oversight."** Read Case 3.
- **"I'll skip the type-check on the render script, the components compile fine."** Read Case 4.

---

## Output

When this pipeline completes, the user has:

- A workspace folder with React components organized by flow
- A spec file documenting every Figma value the build came from (auditable trail)
- A `preview.html` showing every component rendered at production width
- A persistent render script for future iteration
- A token + types layer that scales to additional flows from the same Figma file
- An assets folder with brand imagery

And — most importantly — a build the user can audit against Figma without finding fabricated content.
