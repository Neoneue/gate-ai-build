# Figma knowledge — documentation verification log

This file records **how** Figma-related knowledge was checked against primary sources so the agent (and humans) can trust or re-run verification. It is **not** a tutorial.

## Last full audit

- **Date:** 2026-04-12  
- **Scope:** `knowledge/figma/*.md` (Plugin API + MCP workflow + canvas/component/variable guides), cross-refs in `knowledge/shadcn/*` and `knowledge/core/*` that assert Figma/MCP behavior.

## Pass 2 — `figma.*` symbol sweep (same date)

**Method:** Grep every `figma.<identifier>` in `knowledge/figma/*.md` (excluding `documentation-sources.md` self-reference), then batch **Context7** `query-docs` on `/websites/developers_figma` for deprecations + variable collection rules + `visible` binding.

**`figma.*` APIs appearing in knowledge files (inventory):**  
`createFrame`, `createText`, `createRectangle`, `createEllipse`, `createComponent`, `createComponentFromNode`, `createPage`, `createTextStyle`, `createAutoLayout`, `combineAsVariants`, `loadFontAsync`, `importComponentByKeyAsync`, `importComponentSetByKeyAsync`, `getNodeByIdAsync`, `setCurrentPageAsync`, `root`, `currentPage`, `variables.createVariableCollection`, `variables.createVariable`, `variables.createVariableAlias`, `variables.setBoundVariableForPaint`, `variables.setBoundVariableForEffect`, `variables.setBoundVariableForLayoutGrid`, `variables.getVariableByIdAsync`, `variables.getLocalVariableCollectionsAsync`, `variables.extendLibraryCollectionByKeyAsync`, `VariableCollection` methods `renameMode`, `addMode`, `extend`, `setExplicitVariableModeForCollection`, `clearExplicitVariableModeForCollection`, `setBoundVariable` (node fields inc. `visible`), `resolveForConsumer`, `getLocalTextStylesAsync`, `setTextStyleIdAsync`, `getMainComponentAsync` (replacing deprecated patterns in edited samples).

**Pass 2 corrections (verified via [Plugin API updates / deprecations](https://developers.figma.com/docs/plugins/updates/page/5/) + [VariableCollection](https://developers.figma.com/docs/plugins/api/VariableCollection/) + [VariableBindableNodeField](https://developers.figma.com/docs/plugins/api/VariableBindableNodeField/)):**

| Issue | Fix |
|--------|-----|
| `figma.getLocalTextStyles()` deprecated | Examples → `await figma.getLocalTextStylesAsync()` in `plugin-api.md` |
| `textNode.textStyleId = …` deprecated; throws under `dynamic-page` | Examples → `await textNode.setTextStyleIdAsync(…)` in `plugin-api.md` |
| `InstanceNode.mainComponent` deprecated | Icon/library examples → `await instance.getMainComponentAsync()` in `plugin-api.md`, `component-architecture.md` |
| `VariableCollection.extend` / `extendLibraryCollectionByKeyAsync` | Documented **Enterprise-only** with official links in `variables-and-theming.md` |
| Font-loading list still cited raw `textStyleId` | `canvas-building.md` → cite `setTextStyleIdAsync` + deprecation note |
| Vague `rescale` doc URL | `canvas-elements.md` → link to official `rescale` on `SliceNode` |

**`setBoundVariable('visible', …)`** — Confirmed: `'visible'` is a valid [`VariableBindableNodeField`](https://developers.figma.com/docs/plugins/api/VariableBindableNodeField/) (Context7 + official type list).

## Sources used (in priority order)

1. **Official Figma Developer Docs** — `https://developers.figma.com/docs/...`  
   - Fetched directly: [Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/), [Write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/), [InstanceNode → setProperties](https://developers.figma.com/docs/plugins/api/InstanceNode/#setproperties), [FrameNode](https://developers.figma.com/docs/plugins/api/FrameNode/), [createFrame](https://developers.figma.com/docs/plugins/api/properties/figma-createframe/).
2. **Context7** (indexed mirror of developer docs + MCP guide):  
   - `/websites/developers_figma` — Plugin API, variables, text, layout, nodes.  
   - `/figma/mcp-server-guide` — MCP workflows and tool naming (cross-check only; if this disagrees with `developers.figma.com`, **the official site wins**).

> **Limit:** Context7’s `query-docs` tool is rate-limited per request; this audit used **multiple batched queries** plus **direct URL fetches** for MCP limits and tool support matrices. Not every sentence in every knowledge file was compared to a unique doc paragraph.

## High-risk claims — verified against official API / MCP pages

| Topic | Verified via |
|--------|----------------|
| `figma.variables.setBoundVariableForPaint` for paint color binding; simple fields use `setBoundVariable` | [figma-variables](https://developers.figma.com/docs/plugins/api/figma-variables/), [Working with variables](https://developers.figma.com/docs/plugins/working-with-variables/) |
| `loadFontAsync` required before changing text that affects layout/rendering | [loadFontAsync](https://developers.figma.com/docs/plugins/api/properties/figma-loadfontasync/) |
| `layoutSizingHorizontal` / `FILL` only on auto-layout children; throws if invalid | [layoutSizingHorizontal](https://developers.figma.com/docs/plugins/api/properties/nodes-layoutsizinghorizontal/) |
| `rescale` vs `resize` | Node methods (e.g. [rescale](https://developers.figma.com/docs/plugins/api/SliceNode/) / resize docs) |
| `getNodeByIdAsync` vs sync `getNodeById` under dynamic loading | [Migrating to dynamic page loading](https://developers.figma.com/docs/plugins/migrating-to-dynamic-loading/) |
| `createBooleanOperation` deprecated; prefer `union` / `subtract` / `intersect` / `exclude` | [createBooleanOperation](https://developers.figma.com/docs/plugins/api/properties/figma-createbooleanoperation/) |
| `InstanceNode.setProperties` — does **not** support `SLOT`; throws `cannotSetSlotProperty`; variant name collision behavior | [InstanceNode → setProperties](https://developers.figma.com/docs/plugins/api/InstanceNode/#setproperties) |
| MCP tool **supported file types** (`get_metadata` Design only; `get_design_context` Design + Make; `get_variable_defs` Design only; `use_figma` Design + FigJam) | [Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/) |
| MCP `use_figma` limitations (e.g. **20kb** output per call, assets/fonts gaps, beta) | [Write to canvas → Current limitations](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/) |
| `figma.commitUndo` vs default plugin undo history | [commitUndo](https://developers.figma.com/docs/plugins/api/properties/figma-commitundo/) |
| `figma.createAutoLayout` and MCP note | [createAutoLayout](https://developers.figma.com/docs/plugins/api/properties/figma-createautolayout/) |
| `getLocalTextStylesAsync` replaces `getLocalTextStyles`; `setTextStyleIdAsync` replaces `textStyleId` assignment | [Plugin API updates / deprecations](https://developers.figma.com/docs/plugins/updates/page/5/) |
| `getMainComponentAsync` replaces sync `mainComponent` | Same deprecations page |
| `VariableCollection.extend` / `extendLibraryCollectionByKeyAsync` — Enterprise | [VariableCollection](https://developers.figma.com/docs/plugins/api/VariableCollection/), [extendLibraryCollectionByKeyAsync](https://developers.figma.com/docs/plugins/api/properties/figma-variables-extendlibrarycollectionbykeyasync/) |

## Corrections made from this audit

- **`plugin-api.md`:** Documented official **`SLOT` / `cannotSetSlotProperty`** rule for `setProperties`; replaced misleading “cannot undo via API” with **`commitUndo` / undo-history** behavior; stale `getNodeById` example → **`getNodeByIdAsync`**; removed **unverified** claim that new frames default `clipsContent` to `true` (not stated on FrameNode/createFrame pages retrieved — set explicitly when needed). **Pass 2:** text styles → **`getLocalTextStylesAsync`** + **`setTextStyleIdAsync`**; library flows → **`getMainComponentAsync`**.
- **`component-architecture.md`:** **Pass 2:** library icon example → **`getMainComponentAsync`**.
- **`variables-and-theming.md`:** **Pass 2:** **Enterprise-only** callout for extended collections.
- **`canvas-building.md`:** **Pass 2:** font-loading / text-style wording aligned with **`setTextStyleIdAsync`** deprecation path.
- **`canvas-elements.md`:** **Pass 2:** **`rescale`** citation link.

## Residual gaps (honest)

- **Semantic** review of every numeric example (sizes, radii) against your `system.md` / file — not done here.  
- **shadcn → Figma** mapping files are **parity guides**; token names must still be checked against the project’s `globals.css` and the live Figma file.  
- **Paper** docs mention Figma only for product comparison — they were **not** re-verified against Figma docs.  
- **Product defaults** (e.g. exact default boolean for `clipsContent` on every node creation path) should be confirmed in the current API page or by experiment if precision matters.

## How to re-verify

1. Open the **symbol** you use (e.g. `FrameNode`, `InstanceNode`) on `developers.figma.com`.  
2. For MCP behavior, open **Tools and prompts** and **Write to canvas**.  
3. Optionally run Context7 `resolve-library-id` → `query-docs` with library `/websites/developers_figma` and a tight question naming the API symbol.
