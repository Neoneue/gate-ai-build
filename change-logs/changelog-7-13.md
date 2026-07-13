# UI Changelog: 2026-07-13

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-10.md`](./changelog-7-10.md)

---

## Sections

### Design system reference page: dark mode + theme toggle + token catalog `e6663e4`

**`public/design-system.html`** (relocated from repo root), **`biome.jsonc`**

Relocated the standalone `design-system.html` reference page from the repo root into `public/` (now served at `/design-system.html`) as part of a root-structure cleanup, and expanded it three ways:

- **Dark mode.** Added a `[data-theme="dark"]` block to the page's inline `<style>` mirroring `src/index.css`'s `.dark` block — semantic tokens (`--background`, `--card`, `--foreground`, `--border`, `--input`, `--ring`, `--destructive`, `--canvas`), the 5-points-darker chart palette (`--chart-1..8`), and the black-based elevation shadows. The raw ramps stay theme-independent as declared in `:root`.
- **Light/dark toggle.** A control pinned top-right sets `data-theme` on `<html>`, persists the choice to `localStorage`, and initializes from stored value else `prefers-color-scheme`. The whole page re-themes so light/dark are directly comparable; label + icon update on flip; `body` got a 0.2s color/background transition.
- **Tokens section.** New "Tokens" section, 9 groups / 82 rows (neutral/blue/success/warning/danger ramps, semantic tokens, chart palette, radius, elevation). Each row is a live swatch + token name + resolved value; values are read via a probe element and re-render on theme change, so they always reflect the active theme.

The page stays fully self-contained (inline CSS + vanilla JS, no build deps) and lint-excluded — `biome.jsonc`'s two exclusion paths were updated from the old root location to `public/design-system.html` (the move had pulled the file into a linted path). Verified in-browser: toggle flips and persists, tokens re-resolve, 0 console errors, dark body text renders white on neutral-950.

### Repo hygiene — root cleanup, data-model + changelog docs `c7592f6`

Not dashboard UI, logged for traceability. Root file-structure cleanup: `design-system.html` → `public/`; `.gitignore` now ignores `*.code-workspace`; `data-model.md` route refs updated `/requests` → `/messages` (component/type names unchanged); `changelog-7-10.md` reorganized into Global + per-page sections. Config and root docs (`design.md`, `data-model.md`, `README`, `CLAUDE.md`) intentionally left at root — moving them breaks tooling or committed links.
