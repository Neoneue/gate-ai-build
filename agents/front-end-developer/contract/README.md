# Contract — what ships with the agent

## Three layers (who owns what)

| Layer | Typical contents | Shipped with agent? |
| ----- | ---------------- | --------------------- |
| **1 — Globals** | Variable architecture, default scales, reset + semantic CSS variable story | **Yes** — this folder (`contract/globals.md`) |
| **2 — Theme** | Preset skin, overrides, component-pattern deltas | **No** — host adds when they pick / swap a theme |
| **3 — Project** | Product direction, surfaces, spacing rhythm, decisions log | **No** — host adds as the product evolves |

**How to do steps 1→3 on a greenfield project:** follow **`agent/front-end-developer.md`** → *Design System Sequencing* and *Design System Authority* (read `contract/globals.md` + scaffold `globals.css` first; add Theme/Project docs when ready). The agent encodes the **process**; only Layer 1 markdown ships here.

## Bundled (every drop-in)

| File | Role |
|------|------|
| **`globals.md`** | **Layer 1** — stable Tailwind v4 + shadcn variable architecture, scales, Figma collection mental model. Hosts may mirror or extend in their own docs; this copy is **self-contained** for the agent. |

The model reads **`contract/globals.md`** relative to the **`front-end-developer/`** package root.

## Not bundled (per host project)

| File | Role |
|------|------|
| **`app/globals.css`** (or your app’s CSS entry) | **Numeric source of truth** — OKLCH values Tailwind maps to semantic classes. Usually from `shadcn init` + your theme. |
| **Host `system.md`** | **Layer 2–3** — Theme + Project when the host extracts or writes them. Optional until a product repo exists. |
| **`theme-manifest.json`** | Machine theme state — optional, host-only. |

## Authority order

1. **Host `system.md`** — wins for anything it explicitly defines (Theme + Project).  
2. Else **`contract/globals.md`** + host **`globals.css`** — baseline tokens, type, spacing, radii.  
3. **`.impeccable.md`** — audience, voice, principles (does not replace token math).

## Maintenance

When you evolve Layer 1 in your **authoritative template**, copy updates into **`front-end-developer/contract/globals.md`** so shipped bundles stay aligned.
