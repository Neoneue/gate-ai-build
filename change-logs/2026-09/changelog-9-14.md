# UI Changelog: 2026-09-14

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-9-9.md`](./changelog-9-9.md)

---

## Components

### Top bar logomark navigates to Overview below `lg` `e3642bb`

Before: below `lg` the top bar (`src/layouts/DashboardChrome.tsx`) carried the
logomark as a bare `<img>`, so tapping it did nothing, while the desktop rail's
logomark and the logo inside the navigation sheet both routed to the
workspace's Overview. After: the top-bar logomark is wrapped in the same
`aria-label="Go to overview"` button the rail uses, calling `onNavigate` with
the tier-aware `overviewPath` (`/overview`, `/overview-free`,
`/overview-default`, `/overview-enterprise`). Same focus ring as the rail.
Desktop unchanged (the button is `lg:hidden`).

### Top bar glyphs are 20px below `lg`, wrapper stays 36px `e3642bb`

Before: the three compact-bar controls (bell, icon-only Ask AI, hamburger)
rendered 16px glyphs inside the 36px `size="icon"` Button. After: the glyphs
are 20px below `lg` at the same 36px wrapper. Sparkles gets `className="size-5"
size={20}` and the hamburger `Menu` moves `size-4` -> `size-5`, both in
`DashboardChrome.tsx`. The bell (`src/components/ui/notifications-menu.tsx`)
gets `className="[&>svg]:size-5 lg:[&>svg]:size-4"` because `BellIcon` spreads
`className` onto a wrapper `<div>` and its svg is sized by the `size` prop;
from `lg` the bell returns to 16px so desktop is unchanged. Measured at 390px:
bell 20, Ask AI 20, hamburger 20, every wrapper 36; at 1280px: bell 16.

### Navigation sheet profile band on the card surface `e3642bb`

Before: the profile band at the foot of the mobile navigation sheet
(`SidebarAccountRows`, `src/components/ui/sidebar.tsx`) sat on `bg-card-muted`,
one step darker than the top bar and the sheet body. After: `bg-card`, the same
surface as the top bar, so the avatar, name and email row reads as part of the
sheet rather than an inset panel. The block is `lg:hidden`, so the desktop
avatar popover is untouched.
