# UI Changelog: 2026-10-16

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-15.md`](./changelog-10-15.md)

---

## Components

### Component canvas: EmptyState size comparison and touch-size note `dd33d87`

- `/component-canvas.html` (dev-only). Before: the EmptyState group showed one
  "title + body" example. After: it shows `size="page"` beside `size="card"`
  (design.md TableEmptyState, owner 2026-10-13).
- A comment on the Button sizes notes that the touch step-ups (design.md Touch
  targets, owner 2026-10-14) show only on a touch device or under DevTools
  touch emulation.
- Files: `src/pages/component-canvas/groups-surfaces.tsx`,
  `src/pages/component-canvas/groups-actions.tsx`.

## Sections

### Onboarding Gate Connect setup: routes every app `e33a59e`

- Rule (owner 2026-10-15): Gate Connect detects every app and routing is on by
  default. Applies to `/improved-connect-onboarding` (`PrepareSetup` in
  `improved-setup.tsx`); Manual is unchanged.
- "Select an app" and its tip are gone on Gate Connect; Manual keeps its app
  dropdown.
- Aside art. Before: the App, Gate, Model route figure. After: the start page's
  orbit art `ConnectArt loop` (`improved-art.tsx`), a new run every 5s (3500ms
  run, 1300ms hold `CONNECT_LOOP_HOLD_MS`, 200ms reset). `use-onboarding-motion.ts`
  reads a per-root hold from `data-motion-loop` (empty keeps 3000ms, so ChatArt
  is unchanged); new `art-hub-unlit` reset keyframe in `onboarding-motion.css`.
  Reduced motion shows the still end frame. The aside is a `route-stage` motion
  root on Manual only.
- Steps after download. Before: "Sign in to Gate Connect." / "Toggle Routing On
  for (app)." / a per-app restart step. After: "Sign in to Gate Connect." /
  "Apps are routed by default." / "Quit and reopen any app that was already
  running."
- Button. "I've connected (app)" is now "Ready to test connection".
- Check connection names no app on Gate Connect: helper "Send this from any app
  to check the connection.", the error drops "from (app)", and the route
  figure's app tile is a generic "App" with an `AppWindow` icon
  (`ImprovedRouteFigure` in `improved-parts.tsx`).

### Onboarding phone start: second card reads "Set up Gate access" `e33a59e`

- `MobileStart` in `improved-start.tsx`, Path B card. Before: title "Continue on
  desktop" (`type-heading-16`, Monitor `size-4`), description "Email a setup
  link to (email)". After: title "Set up Gate access" (`type-heading-20`, Monitor
  `size-5`); description "Connect AI apps like Claude Code and Codex on your
  computer to Gate.", a line break, then "Start getting prompt protection,
  token saving options, ways to track team spend, and more."
- The email line sits in its own group with the button (`gap-2`) and reads
  "We'll email (email)." before a send and "We sent it to (email)." after one
  (audit ux-4).

### Onboarding: audit 2026-10-16 fixes (ux-1, 4, 6, 10, 11, 14) `e33a59e`

- Checklist: `audits/2026-10/audit-10-16.md`.
- ux-1. Check connection, Try again and Send the message use `aria-disabled`
  plus an early return instead of `disabled`, so focus no longer drops to the
  page. On a pass, focus moves to the new success `StatusRow`, which gained an
  optional `ref` prop and renders `tabIndex={-1}` (`improved-parts.tsx`,
  `improved-setup.tsx`).
- ux-6. Sign-in "Create an account" and sign-up "Sign in" get a 36px-tall tap
  area below `md` (`max-md:` `::after` recipe, as the show-password toggle). No
  visual change (`OnboardingSignIn.tsx`, `OnboardingSignUp.tsx`).
- ux-10. Protection demo error "Send it again." is now "Try again." to match
  its button.
- ux-11. Tasks menu label "See token savings" is now "See your token savings"
  (`onboarding-chrome.tsx`), matching the complete page row.
- ux-14. "Try Gate Chat instead" and the four explore rows use `ExternalLinkIcon`
  (the new-tab icon, owner 2026-10-13) instead of `ArrowUpRight`; chat
  quick-action chips keep `ArrowUpRight` (`improved-parts.tsx`,
  `current-verify.tsx`).

### data-model.md: onboarding workspace synced with the code `e33a59e`

- Rows and notes updated: Manual setup row, checkout callers, step 3 timing
  `ROUTE_CHECK_MS` 5000ms, failed check dims group 2, diagram edges, handoff
  route URL-only, `SHOW_BILLING_CHOICE`, phone links and Get started rows,
  keyless Gate Chat traffic, Gate Connect art loop, StatusRow focus.
