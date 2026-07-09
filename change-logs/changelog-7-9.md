# UI Changelog: 2026-07-09

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-7.md`](./changelog-7-7.md)

---

## Conventions

### Dark mode: `.dark` token theme + provider `12846e7`

**`src/index.css`, `src/hooks/use-theme.tsx`, `src/components/ui/theme-toggle.tsx`, `index.html`, `src/main.tsx`, `src/components/ui/sonner.tsx`, `src/layouts/DashboardChrome.tsx`, `src/components/ui/table.tsx`**

First dark theme. It is driven entirely by a `.dark` class on `<html>` that re-points the semantic tokens; no component reads a color directly, so surfaces that already use semantic utilities (`bg-card`, `text-foreground`, `border-border`, …) invert for free.

- **Token layer** (`index.css`): added a `.dark` block on the shadcn/Geist dark scale. Elevation is inverted vs. light (base is the darkest plane, raised surfaces step lighter): bg / sidebar `neutral-950`, card `neutral-900`, popover / muted / secondary `neutral-800`, accent (hover) `neutral-700`. Text: `foreground` white, `muted-foreground` `neutral-300`. Borders are translucent white (`border` white/10%, `input` white/15%) so hairlines read on any surface. Added `color-scheme` to `:root`/`.dark`, and a new `--surface-strong` / `--surface-strong-foreground` token pair for intentional dark surfaces (hero chart card, code cards) that stay dark in both themes.
- **Provider** (`use-theme.tsx` + `main.tsx`): `ThemeProvider` + `useTheme`. Binary light/dark, follows the OS preference until the user makes an explicit choice, persisted to `localStorage`.
- **No-flash**: a blocking inline script in `index.html` sets the class before React mounts.
- **Toggle**: top-bar sun/moon `ThemeToggle` reusing the sidebar toggle's icon cross-fade.
- **Sonner**: toasts track the active theme and route through `--popover` / `--border` instead of hardcoded neutrals.
- **Fixes surfaced by the change**: `DashboardChrome` content canvas `bg-neutral-50` → `bg-background` (was white in dark); shared `Table` header `bg-neutral-50` → `bg-muted` (sits one elevation step above the card in both themes).

Known follow-up: ~460 remaining raw color utilities (`text-neutral-*`, `bg-neutral-*`, `bg-white`) across pages/components do not invert yet; a semantic-token sweep is queued.

### Text-color token sweep — pass 1 `4249b81`

**~70 files across `src/pages` and `src/components/ui`**

App-wide pass 1: every **standalone** text color now uses the semantic tokens so it inverts in dark. `text-neutral-900/800` → `text-foreground`; `text-neutral-700/600/500/400/300` → `text-muted-foreground` (interactive hover/focus states brighten to `foreground`). ~297 swaps, run by three parallel agents plus a reconciling pass.

- Also retuned the light token: `--muted-foreground` `neutral-500` → `neutral-600` (darker/more legible muted text in light); dark stays `neutral-300`. Net pair: `foreground` = neutral-900 / white, `muted-foreground` = neutral-600 / neutral-300.
- `RequestDetailModal` message bodies promoted `neutral-700` → `text-foreground` (primary content, not muted).
- **Deferred to the surface pass** (text entangled with a raw background — must swap bg + text together): input/select/search controls (`bg-neutral-50`), the neutral `Badge` + count chips + `inline-code` (`bg-neutral-100`), the sidebar active-item chip, and the always-dark `code-card`/`code-panel` surfaces.

### Surface + tint token sweep — primitives (pass 2) `0a32743`

**16 primitives in `src/components/ui/` + `design.md`**

Pass 2 of the dark sweep. The remaining raw `bg-*` / `border-*` / `fill`/`stroke-*` neutrals and the light status tints on the shared primitives now map to semantic tokens, so inputs, badges, menus, charts, and inner-card chrome invert under `.dark`. The user-visible complaints (inputs, badges, dashed chart lines, inner cards, menus) all trace to these primitives, so each fix cascades app-wide.

- **Inputs / controls** — field wash `bg-neutral-50` retired to `bg-muted`: `Input`, `Textarea`, `InputGroup`, `SearchInput` icon, the `select-variants` trigger (+ `data-placeholder` text), `RadioGroup` unchecked fill. Disabled fills `bg-neutral-100` → `bg-muted`.
- **Menus / dropdowns** — highlight fills `bg-neutral-100` → `bg-accent` (`Menu` item, `Select` item, `MultiSelect` options); `MenuSeparator` `bg-neutral-200` → `bg-border`; the destructive menu item gains a dark tint fill + `text-danger-300`.
- **Badges / chips** — neutral `Badge` → `bg-muted` / `text-muted-foreground` / `hover:bg-accent`; the success / warning / danger / info status variants gain `dark:` tint variants (ramp mid at low alpha for the fill + `-300` text, mirroring the existing `dark:bg-destructive/20` idiom); `TabsCount`, `Tag`, `InlineCode` → `bg-muted`.
- **Charts** — `Chart` gridlines / tooltip cursor / reference lines `stroke-neutral-200`/`-400` → `stroke-border`, axis ticks `fill-neutral-500` → `fill-muted-foreground`, background sectors + tooltip-cursor rectangle `fill-neutral-100` → `fill-muted`. Fixes the dashed data / KPI gridlines that did not invert.
- **Inner cards** — `KpiRail` inset divider `before:bg-neutral-200` → `before:bg-border`; `CodeCard` header `bg-neutral-100` → `bg-muted`, tab hover `bg-white/60` → `bg-accent`, amber token-highlight gains a dark variant. The always-dark terminal chrome (`bg-neutral-800`/`-700`) is left intentional.

**`design.md`** — added the **Dark mode (`.dark` theme)** subsection under §2 Colors: the full light/dark token contract table, the `--surface-strong` pair, the raw→token surface map, the status-tint dark convention, and the kept-intentional list. Retired the `bg-neutral-50` field-wash "permitted exception"; updated the quick-reference (`--muted-foreground` neutral-600, dark-aware header) and the step-950 role. This is the tracked contract for the theme.

## Components

### Overview preview tables → shared primitives + `NavTableRow` `253c8c0`

**`src/pages/Dashboard.tsx`, `src/components/ui/table.tsx`, `src/components/ui/card.tsx`**

The Overview's three "Latest …" preview tables were hand-rolled `<table>`/`<thead>`/`<h3>` with raw neutral colors that did not invert in dark. Rebuilt on shared components; themed the primitives they rely on.

- `Dashboard.tsx`: `LatestRequestsTable` / `RecentConversationsTable` / `SecurityEventsTable` now compose `Card` + `CardTitle` + the shared `Table` primitives + `Badge`, wrapped in a local `PreviewCard` shell that DRYs the three identical card headers. Clickable rows use the new `NavTableRow`. Two intentional shifts from using the primitives: card titles move from `type-label-14` to the `CardTitle` voice (`type-heading-16`), and preview cells from 12px to the primitive's 14px.
- `table.tsx`: swept to semantic tokens — `TableCell` → `text-foreground`, `TableHead`/`TableCaption` → `text-muted-foreground`, `TableRow` hover/selected + `TableFooter` fills → `bg-accent`/`bg-muted`. Added `NavTableRow`: a keyboard-accessible clickable row (`role="link"`, `tabIndex`, `onClick`, Enter/Space) built on `TableRow`.
- `card.tsx`: `Card` base `text-neutral-900` → `text-card-foreground`; `CardDescription` `text-neutral-500` → `text-muted-foreground`. Light unchanged, dark fixed.

### Title + eyebrow primitives use semantic text tokens `ae3f47c`

**`src/components/ui/page-title.tsx`, `section-title.tsx`, `section-heading.tsx`, `eyebrow.tsx`**

`PageTitle` / `SectionTitle` / `SectionHeading` baked in raw `text-neutral-900`, and `Eyebrow` raw `text-neutral-500`, so titles and eyebrows rendered dark-on-dark in dark mode. Switched to `text-foreground` / `text-muted-foreground`. Light is identical (foreground=neutral-900, muted-foreground=neutral-500 in light); fixes every page title, section title, and eyebrow across the app in dark.

### Dark-mode fixes: segmented controls + monochrome vendor icons `2d0d7a1`

**`src/components/ui/segmented-pill.tsx`, `segmented.tsx`, `src/components/icons/vendor-meta.tsx`**

- Segmented tracks used raw `bg-neutral-100` (near-white in dark) → `bg-background`. The pill's active thumb `bg-card` → `bg-popover` so it sits one elevation step lighter than the card in dark (still white in light). The connected-variant active segment `bg-neutral-900`/`text-white` → `surface-strong` tokens.
- OpenAI and xAI brand marks used a fixed `#3D3D3D` and disappeared on dark; switched to `var(--foreground)` so the monochrome logos render near-black in light and white in dark. Colored brand marks (Anthropic, Gemini, etc.) unchanged.

## Sections
