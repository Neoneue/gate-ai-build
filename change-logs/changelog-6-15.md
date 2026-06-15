# UI Changelog: 2026-06-15

Running log of UI changes for 06-15. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-13.md`](./changelog-6-13.md).

> Entries below are committed on `dev` (not yet pushed); commit hash is stamped
> per entry. None of today's work is on `main`.

---

## Components

### Notifications dropdown menu (new) `45cb33f`

New `src/components/ui/notifications-menu.tsx`, exporting `NotificationsMenu`.
Bell-triggered top-bar dropdown, modeled on the shadcn notifications panel but
styled with our tokens/primitives.

- Built on our `Popover` / `PopoverTrigger` / `PopoverContent`, so it **inherits
  the standard dropdown open animation** (and the `data-closed:fill-mode-forwards`
  flicker fix) automatically — no hand-rolled motion. Follows the `user-menu.tsx`
  pattern: takes the bell `<Button>` as `children` and wraps it via
  `<PopoverTrigger render={children} />`. `PopoverContent` is `w-80 p-0` (each
  section owns its padding).
- **Header** — `<h2>` "Notifications" (modal-section voice: `font-medium text-sm
  text-neutral-900`) + ghost `size="icon-sm"` gear (`Settings`) button. Gear
  closes the popover then `navigate("/settings")`.
- **Toolbar strip** — `bg-muted` band with `border-y border-border`; `Segmented`
  pill "Unread / All" on the left + a right-aligned inert ghost text action whose
  label swaps `Mark all as read` (Unread) ↔ `Clear all` (All).
- **Empty state** — centered card-style icon chip (`size-12 rounded-full
  bg-muted` + static lucide `Bell size-5 text-neutral-700 strokeWidth={1.75}`,
  matching our default-card empty states) over text that swaps `No unread
  notifications` ↔ `All caught up!` (`text-sm text-neutral-500`).
- **No synthetic data:** there is no notification entity data, so both tabs
  render empty states only (matches the source screenshots).
- **Wiring** — `src/layouts/DashboardChrome.tsx`: the previously-inert bell
  `<Button>` (~line 156) is now wrapped by `NotificationsMenu`. No other chrome
  change.

Padding tuning after in-browser review:

- Header vertical padding `py-3` → `py-2` (12px → 8px).
- Header and toolbar horizontal padding `px-4` → `pl-4 pr-2` (right 16px → 8px)
  to correct the optical inset of the gear icon and the text action against the
  right edge.

### Segmented pill: indicator no longer animates on mount `45cb33f`

`src/components/ui/segmented.tsx` (pill variant). The sliding indicator's
transition was gated on `indicator.ready`, which applied the transition class in
the same commit that set the real position. The skip-first-paint trick this
relied on holds on static pages but is defeated inside an **opening popover**
(the popover's enter animation paints the zero-width indicator first), so the
indicator visibly slid into place when the notifications menu opened.

- Added an `animate` flag that flips `true` one frame after mount (via
  `requestAnimationFrame`). The transition class is now gated on `animate`
  instead of `indicator.ready`.
- Result: the indicator **paints in its resting place on mount** and animates
  **only on user selection**. No-op on static pages; popover remount on each
  open resets the flag, so reopening never slides.

### Sidebar: PRO-feature locks gated to FREE surfaces `863df29`

Lock icons on Token Savings / Limits / Events were hardcoded `locked: true` in
`nav-sections.ts`, so they rendered on PRO accounts too.

- New `src/lib/plan.ts` exports `FREE_SURFACE = /-(default|free)$/` and
  `isFreeSurface(pathname)` — single source of truth for plan tier.
- `workspace-switcher.tsx` now imports that helper (dropped its private regex),
  so the plan badge and the locks can't drift apart.
- `sidebar.tsx` gains a `showLocks` prop (default `false`), threaded into
  `SidebarExpanded`; the lock renders only when `item.locked && showLocks`.
  `DashboardChrome` computes `showLocks = isFreeSurface(pathname)` via
  `useLocation`.
- Net: locks show only on `-default`/`-free` routes (badge = FREE), hidden on
  PRO. `isDisabled` (`!item.pageId`) is unchanged, so PRO users still navigate
  the gated items.

### Chrome: Notifications bell button hidden for now `39af049`

Removed the bell trigger + `NotificationsMenu` from the top bar (and the unused
`BellIcon` / `NotificationsMenu` imports in `DashboardChrome.tsx`). The
`notifications-menu.tsx` component is kept in the tree; restore = re-add the
import and the `<NotificationsMenu><Button…/></NotificationsMenu>` block.

## Sections

### Settings: Notification preferences card, Profile copy, footer + responsive grid `45cb33f`

`src/pages/Settings.tsx`.

- **New "Notification preferences" card** below Security — `CardTitle`
  "Notification preferences" + `CardDescription` "Choose which notifications
  you'd like to receive." (header-only; no body yet).
- **Profile card copy** — title "Profile & organization" → **"Profile"**; added
  subtitle "View and update your personal and organization's information."
- **Profile footer** — vertical padding 16px → 8px (`CardFooter` gains `py-2`,
  horizontal unchanged at 16px).
- **Responsive width** — the cards container is wrapped in `grid grid-cols-12`;
  the cards span `col-span-12` (full width) up through xl and `2xl:col-span-9`
  (columns 1-9, whitespace in 10-12) at 1536px and above. Page header untouched.

### Settings: Profile field width + Email verification helper `6e813af`

`src/pages/Settings.tsx`, follow-up tuning after in-browser review.

- **Organization input width** — the Organization field was outside the Profile
  grid in a separate `mt-4` block with its `Input` capped at `max-w-md` (448px),
  so it rendered narrower than Display name. Moved it into the `grid grid-cols-2`
  as the third child (row 2, left column) and dropped `max-w-md`, so it now
  matches the Display name column width exactly. Grid `gap-4` replaces the old
  `mt-4` spacing.
- **Email helper text** — added below the Email input: "Verified at sign-in.
  Changing it requires re-verification through your identity provider."
  (`m-0 mt-1 text-pretty font-sans text-neutral-500 text-xs tracking-tight`,
  the repo's standard field-helper voice).

### Settings: split Display name into First / Last name `04927e6`

`src/pages/Settings.tsx`. The Profile form is now a 2×2 grid: **First name |
Last name** on row 1, **Email | Organization** on row 2 (Email moved down a
row). `PROFILE_DEFAULTS`, the `useState` fields, `dirty`, Save, and Reset all
moved from three fields to four (`firstName`, `lastName`, `email`,
`organization`); the inputs use `given-name` / `family-name` autocomplete.

### Overview (default): swap hero cards + retitle Get started `acbe2db`

`src/pages/DashboardDefault.tsx` `HeroCard`. **Gate Connect** now sits on the
left, **Get started** on the right (was reversed). The positional seam classes
were swapped along with the order so the two cards still butt together at xl+:
the left card flattens its right edge (`xl:rounded-r-none xl:border-r-0`), the
right card flattens its left edge (`xl:rounded-l-none`). Get started title:
"Get Started with Gate AI" → **"Create your first API key"**.

### Billing: Pro price $29 → $20, drop per-user framing `9ca54a8`

All Pro-price instances updated from `$29` to `$20` across `Billing.tsx`,
`Upgrade.tsx`, `SecurityDefault.tsx`, and both plan-comparison dialogs (`price`,
`ctaCaption`, trial captions, and the Billing seat breakdown). The Billing
renews line now reads `$20 / month` (was `$20 / user / month`). Note: the price
is still a hardcoded string in 5 places — no shared constant yet.

### Overview (default): rewrite Create-key card body copy `b4fbac7`

`src/pages/DashboardDefault.tsx`. Reworked the right-card body to be key-led
(matching the "Create your first API key" title): "Your API key is what routes
traffic through Gate, adding prompt-injection defense and a tamper-evident audit
trail to every request. Use it with our Gate Connect app, or any AI coding tools
you configure manually." (No em dash, per house style.)
