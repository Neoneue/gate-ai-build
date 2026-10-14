# UI Changelog: 2026-10-14

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-13.md`](./changelog-10-13.md)

---

## Conventions

### Every control steps up on touch screens `de0d7f7`

- On a touch screen (`pointer-coarse:`, chosen by input device, not width;
  precedent Adobe Spectrum's mobile scale and Tailwind's documented
  `pointer-coarse:` variant) every size gets a `min-h` floor inside the
  primitive. Before: a phone showed the desktop sizes, with a separate
  `size="touch"` Button and width switches on Sign in and Sign up. After:
  Button xs / sm / default 24 / 32 / 36 becomes 32 / 36 / 44 (icon squares
  the same), Input and InputGroup 36 becomes 44 (Apple's 44pt minimum),
  Select sm / default / lg becomes 36 / 44 / 44.
- `InputGroupInput` drops Input's floor (`pointer-coarse:min-h-0`) so it does
  not overflow its group.
- Removed: Button `size="touch"` and its call sites, the Sign in and Sign up
  `useIsBelowMd` switches, the unused `use-is-below-md.ts` hook. The
  component canvas no longer lists `touch`.
- The final setup page's main action is full width on phones
  (`improved-setup.tsx`).
- `design.md`: Touch targets, button Sizes, the 36px Ceiling Rule, the One
  Responsive Entry Rule and the Input / InputGroup / Select entries updated.
- Proof: desktop 1280px, 378 controls on 15 pages measured before and after,
  0 differences. Phone 390px touch: buttons 44, fields 44, no horizontal
  overflow.

## Components

### Onboarding phone: Sign out returns to the demo's own sign-in `6e26ca2`

- Shared `SidebarPanel` gains an optional `signOutPath`. With it, the
  account-row Sign out is a `reloadDocument` Link; without it the row stays
  the inert button, so every other page is unchanged.
- The onboarding phone menu passes `phoneSignInPath()` (new in
  `onboarding-routes.ts`: A's sign-in in a Mobile A tab, else B's). The phone
  chat's site menu passes `chatSignInPath()`. The desktop chat rail's Sign
  out links also use `reloadDocument`. A full page load restarts the
  in-memory chat history clean.
- Mobile A signs up into Gate Chat, Mobile B into the phone start; Sign out
  returns each to its own sign-in.

### Onboarding auth pages on phones: logo, copyright and card spacing `6e26ca2`

- Below md: logo 20px from the top (`pt-5`), copyright 16px from the bottom
  (`pb-4`), at least 24px (`gap-y-6`) between each and the card. Before, the
  card touched them (0px) when it outgrew the screen. md and up unchanged
  (positions verified identical). `OnboardingAuthLayout.tsx`.

### Onboarding phone chat: follows the latest reply, tighter turns `6e26ca2`

- Follow-latest (`onboarding-chat-thread.tsx`, below lg): distance to the end
  is measured against the visual viewport and excludes the keyboard room
  padding; only the reader's own touch or wheel scroll (within 1s) turns
  following off. Fixes the scroll-to-latest button showing at the bottom and
  replies not following with the keyboard open.
- Spacing (below sm): prompt bubble to reply card 16 to 8px, between turns
  24 to 8px (copy glyph to next bubble 38 to 22px; the 44px touch row stays).

### Onboarding chat reply actions: Retry re-streams, Copy works on http `6e26ca2`

- Retry calls the new `onboardingChatStore.regenerateScripted(laneId)`,
  re-streaming the scripted reply. Before it did not replay.
- Copy falls back to the legacy copy command when `navigator.clipboard` is
  missing (a non-secure http LAN dev origin), in the shared
  `use-copy-feedback.ts`. Secure pages unchanged.

## Sections

### Onboarding: "Setup complete" toast fires once, only when it should `6e26ca2`

- No setup-state change or toast on a load that redirects (refresh or cold
  open of a conversation URL), never on a phone, and a fixed toast id so it
  cannot stack. Before: phone B refresh showed 2 toasts. After: 0. Desktop
  first send still shows 1. `OnboardingLayout.tsx`.
