# UI Changelog: 2026-07-20

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-17.md`](./changelog-7-17.md)

---

## Conventions

_None today._

## Components

_None today._

## Sections

### Settings: single Full name field + responsive Profile / Passkey layout `cda8187`

**`src/pages/Settings.tsx`** (renders both `/settings` and `/settings-free`; `SettingsFree` wraps `<Settings />`)

Four changes to the Settings page, all scoped to this file:

- **Full name field.** The Profile form's separate "First name" and "Last name" inputs were replaced by a single "Full name" field (`autoComplete="name"`, id `settings-full-name`), spanning full width via `sm:col-span-2`. Backing state collapsed from `firstName`/`lastName` to one `fullName` ("Chad Ponticas"); Reset/Save dirty-tracking updated to match. Applies at all breakpoints.
- **Mobile field stacking.** The Profile form grid went from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`, so fields stack to a single column below `sm`. Fixes the Email value clipping at 390px where the 2-col grid squeezed inputs to ~150px.
- **Full-width card subtitles.** Both card subtitles (Profile "View and update…", Security "Passkeys — …") were wrapping early because they inherit `text-wrap: pretty` from the global `body` rule (`src/index.css`). Added the `text-wrap` utility (`text-wrap: wrap`) to those two `<CardDescription>` elements so each line fills the full card width before wrapping. Scoped to Settings — the global rule, `card.tsx`, and the page-header subtitle are untouched.
- **Responsive Passkey row.** The "Add a passkey" button now stacks below the title/description on mobile + tablet and returns inline-right on desktop. Wrapper: `flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:gap-4`; button carries `lg:ml-auto`. Below `lg` = `[title, text, button]` stacked, left-aligned; `lg`+ = button pushed right, matching the original inline layout.
