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

## Components

### Overview preview tables → shared primitives + `NavTableRow` `253c8c0`

**`src/pages/Dashboard.tsx`, `src/components/ui/table.tsx`, `src/components/ui/card.tsx`**

The Overview's three "Latest …" preview tables were hand-rolled `<table>`/`<thead>`/`<h3>` with raw neutral colors that did not invert in dark. Rebuilt on shared components; themed the primitives they rely on.

- `Dashboard.tsx`: `LatestRequestsTable` / `RecentConversationsTable` / `SecurityEventsTable` now compose `Card` + `CardTitle` + the shared `Table` primitives + `Badge`, wrapped in a local `PreviewCard` shell that DRYs the three identical card headers. Clickable rows use the new `NavTableRow`. Two intentional shifts from using the primitives: card titles move from `type-label-14` to the `CardTitle` voice (`type-heading-16`), and preview cells from 12px to the primitive's 14px.
- `table.tsx`: swept to semantic tokens — `TableCell` → `text-foreground`, `TableHead`/`TableCaption` → `text-muted-foreground`, `TableRow` hover/selected + `TableFooter` fills → `bg-accent`/`bg-muted`. Added `NavTableRow`: a keyboard-accessible clickable row (`role="link"`, `tabIndex`, `onClick`, Enter/Space) built on `TableRow`.
- `card.tsx`: `Card` base `text-neutral-900` → `text-card-foreground`; `CardDescription` `text-neutral-500` → `text-muted-foreground`. Light unchanged, dark fixed.

## Sections
