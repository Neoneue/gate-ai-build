# UI Changelog: 2026-09-09

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-9-8.md`](./changelog-9-8.md)

---

## Conventions

### Impeccable design skill updated to 4.3.1 `6093e0c`

Before: `.claude/skills/impeccable` was the 3.9.1 build with node hook
scripts (`scripts/hook.mjs`, `live/`, `detector/`) and the PostToolUse
design check ran through them. After: `npx impeccable update --project`
replaced the skill with the 4.x build: a shell launcher at
`scripts/impeccable`, a native engine under `scripts/bin/<platform>/`
(gitignored with `.impeccable/`; a fresh clone runs the update once to fetch
it), and four `impeccable-*` support agents in `.claude/agents/`. The hook in
`settings.local.json` now calls `scripts/impeccable hook` and skips when the
engine is absent. No dashboard pixels change; this is the design-quality
check every UI edit runs through.

## Components

### MenuItem rows are 36px below `lg` `5284e4f`

Before: every `MenuItem` (`src/components/ui/menu.tsx`) was 32px tall at
every width, so the workspace switcher and role switch menus inside the
mobile navigation sheet read tight and under-sized as touch targets. After:
`h-9 lg:h-8`, 36px below `lg`, unchanged 32px from `lg`. Two pixels more
above and below each row on phones, no desktop change. Applies to every
menu on the primitive.

### Notifications page: channel columns sit on the toggle axis; email frequency stacks `5284e4f`

Before: the Email / In-app column headers and their checkboxes ran in 64px
columns with 16px gaps, so on a phone the In-app column centred 16px left
of the delivery-channel toggle above it and the two boxes sat 80px apart;
the "In-app" header wrapped once the column narrowed. The email frequency
options were a 2 x 2 grid whose descriptions wrapped to three lines. After
(`src/pages/Notifications.tsx`, one file for all three twins): `CHANNEL_COL`
is `w-8`, the Switch's own 32px, so the last column centres at 16px card
padding + 16px, exactly under the toggle; `CHANNEL_GAP` is `gap-4` (16px) and
drives both the section-line header strip and the row cells, so the two
boxes sit 48px apart. Headers are `whitespace-nowrap` and centred on the
column axis, overflowing rather than wrapping. Email frequency is a single
column (`flex flex-col gap-3`), one option per row. Measured at 390 and
1440: In-app checkbox and header centre within 1px of the toggle.

### Notifications: full-width drop-down under the top bar below `lg` `5284e4f`

Before: the bell opened the desktop popover at every width: a fixed 400px
panel anchored to a 36px button, so on a 390px phone it overflowed and
clamped 5px from the edge, and on a tablet it floated as a narrow card
under the bell. After: below `lg` the panel is a full-width sheet hung from
the bottom edge of the 64px top bar (`src/components/ui/notifications-menu.tsx`
via a new `positionerClassName` prop on `PopoverContent`,
`src/components/ui/popover.tsx`): `fixed`, `inset-x-0`, `top-16`, no top
radius or top border so it meets the bar, stretching from 390px phones to
1023px tablets. It moves like the Sheet, not like a popover: it slides down
from behind the bar on open (300ms) and back up behind it on dismiss
(200ms) on `--ease-drawer`, with the Positioner clipping (`overflow-hidden`)
so the travelling panel is never painted over the bar; the primitive's
fade / zoom is switched off below `lg`. At `lg`+ nothing changes: 400px,
anchored to the bell, 8px offset, fade / zoom. The feedback FAB does not
move when the panel opens (checked at 390, 768 and 1440; the two earlier
screenshots were taken at different window widths). Separately, the FAB
(`src/components/ui/feedback-fab.tsx`) now sits on the page gutter:
`right-4 bottom-4` (16px) where the chrome runs `px-4`, `sm:right-6
sm:bottom-6` (24px) where it steps to `px-6`. Verified with Playwright at 390 x 844 (also
scrolled 400px), 768 x 1024 and 1440 x 900, 0 console errors.

### Mobile top bar: four controls, account actions inline in the nav sheet `5284e4f`

Before: below `lg` the top bar held six items (logo mark, bell, theme toggle,
"Ask AI" with label, "Docs" with label, hamburger), every one of them
outlined, so nothing read as primary and the bar crowded at 390px. The
account menu at the foot of the navigation sheet was the desktop avatar plus
"..." popover, a second overlay stacked on the drawer. After: below `lg` the
bar is logo mark, bell, icon-only Ask AI (`aria-label="Ask AI"`), hamburger.
The bell takes the new responsive `ghost-to-outline` Button variant
(`src/components/ui/button.tsx`, `ghost` below `lg`, byte-for-byte `outline`
from `lg`) and the mobile Ask AI takes `ghost`, so the hamburger is the only
bordered control. Docs, the theme toggle and the labelled Ask AI keep
`hidden lg:inline-flex`, so the desktop bar is unchanged. Inside the sheet
the popover row is `hidden lg:flex` and a new `SidebarAccountRows`
(`src/components/ui/sidebar.tsx`, `lg:hidden`) renders below the nav on
the Vercel / GitHub mobile account pattern: a tinted profile band
(`bg-card-muted`, `px-5 py-4`, 32px monogram, name, email) that splits
account from navigation, then 40px label-left icon-right rows: Theme (the whole
row toggles, same `useTheme().toggle` as the top bar; the trailing sun /
moon glyph reports the current state),
Account settings (UserRound), Docs (BookOpen), Sign out (LogoutIcon,
quiet, not red). Below `lg` the nav and this block
share one scroll container (`lg:contents` wrapper) so the rows travel with
the links instead of pinning to the foot and eating viewport, and nav rows
grow from 36px to 40px (`h-10 lg:h-9`) to match the account rows and give
a real touch target; at `lg`+ the rail keeps 36px rows, its `flex-1` nav
and pinned user area. `hideDocsButton` threads
through `MobileNav` -> `SidebarPanel` and omits the Docs row. Verified with
Playwright at 390 x 844, 390 x 667 and 1440 x 900: no horizontal overflow,
account rows scroll with the nav, theme row flips `html.dark`, desktop
menu still Settings + Sign out only, 0 console errors.
