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
