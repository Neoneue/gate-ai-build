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

## Sections
