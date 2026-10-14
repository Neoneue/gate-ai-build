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

### Segmented controls step up on touch screens `213aeed`

- `SegmentedPill` (the All / 24H / 7D / 30D range pickers and the Tokens /
  Spend toggles, 23 call sites) gets `pointer-coarse:` `min-h` floors, the
  same pattern as Button, Input and Select (`de0d7f7`). Before: a phone
  showed the pointer sizes. After: items `sm` 24 becomes 32 and `default`
  32 becomes 36; the container grows 8px with them (`sm` 32 becomes 40,
  `default` 40 becomes 44). A mouse never sees it. `segmented-pill.tsx`.
- `design.md`: the Touch targets line lists SegmentedPill items 32 / 36.
- Proof: Overview, Messages and Activity (8 controls) at 390px touch: items
  32, track 40, the sliding thumb sits exactly on the pressed item, no
  horizontal overflow. At 1280px mouse unchanged (24 / 32).
- Not touch targets, so left alone: the `IconActionButton` row icons
  (Revoke, Remove, Expand, 24px visible) already have a 48px hit area
  (`after:-inset-3`). Still small on touch, for a later sprint: the Models
  copy icons and Inspect links.
- Not yet tested: iPads. Touch sizes apply there too, on the desktop layout.

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

### Onboarding setup: models follow the app; Manual picks its app in a dropdown `2862183`

- Gate Connect setup: "Select a model" is hidden (`SHOW_CONNECT_MODEL_PICKER = false`).
  Model choice lives in the app, per tool, defaulting to App default. Before:
  a model picker in setup. After: none.
- Setup route figure is App -> Gate -> Model on both billing types (3D box
  icon, label "Model"). Before: the figure ended at a cloud labelled "Your
  provider". Manual Gate credits names the picked model, and Manual now shows
  the app node too.
- Test messages on Gate Connect report the app's own model. Codex's own model
  is GPT-5.3-Codex (was GPT-4.1, which fails Codex's tools);
  `onboarding-setup-traffic.test.ts` updated to match.
- Manual: the snippet's six app tabs (only four fit, two hid off-screen)
  become a "Select an app" dropdown listing all six, on both billing types.
  The code card shows only the chosen app's snippet (`hideTabs`).
- Manual order. Existing subscriptions: key, billing, Select an app, Set your
  base URL and key, steps. Gate credits: key, billing, Add credits, Select an
  app, Select a model, Point your app to Gate, steps. Everything is always
  shown: all after the key is dimmed until a key exists; on Gate credits the
  app, model, snippet and steps stay dimmed until credits are added.
- Manual Gate credits model list follows the app (`manualModelsFor`): Claude
  Code lists Anthropic models only; Codex lists the GPT-5 family and opens on
  GPT-5.3-Codex; OpenCode, Hermes, OpenClaw and OpenAI SDK list the full
  catalog.
- Manual OpenAI SDK snippet passes `providerHint={null}` (no
  `X-Gate-Provider: bedrock`): a pinned request never fails over and the
  catalog has no Bedrock models, so the pin would refuse every listed model.
  Other snippets and the six captions match the Gate repo's `connect-tabs.tsx`.
- Files: `improved-setup.tsx`, `improved-data.ts`, `improved-parts.tsx`,
  `improved-art.tsx`, `onboarding-connect-tabs.tsx`.

### Onboarding sign-up: Name placeholder reads John Doe `53136d1`

- Sign-up Name field placeholder. Before: "Jane Doe". After: "John Doe". It was
  the only "Jane" in `src`.
- Files: `OnboardingSignUp.tsx`.

### Onboarding: Gate Chat credits match this run, Billing adds credits, no chat setup toast `dace448`

- Gate Chat credits. Before: its stored balance (`gate-onboarding-credits`)
  reset only when a tab first loaded the landing page, so reaching it in-app
  (the logo) kept earlier runs' credits and showed a stale $50. After: the new
  `syncOnboardingBalance` runs whenever the landing page shows, and sets Gate
  Chat's balance to this run's setup balance: $0 until credits are added, then
  the amount added. Paid models in Gate Chat stay refused at $0 and unlock with
  any balance (existing rule, desktop and phone alike).
- "Setup complete" toast. Before: it fired on Gate Chat's first message. After:
  opening Gate Chat is not a setup, so no toast; the state update stays.
- Billing: Add credits works in onboarding. `BillingFree` gets an optional
  `onCheckout(amount)` (the site's own Billing is unchanged without it).
  `OnboardingBilling` sends the chosen amount ($25, $50, $100, $500 or custom)
  through the same mock checkout as setup and returns to Billing. Billing
  purchases are marked `source: "billing"` and show on Billing's card and
  history on either billing type (credits can always be bought on Billing);
  setup credits keep the 2026-10-13 rule (shown on Gate credits only).
- Tests: `onboarding-billing.test.ts` covers both.
- Files: `BillingFree.tsx`, `OnboardingBilling.tsx`, `OnboardingCheckout.tsx`,
  `OnboardingLayout.tsx`, `onboarding-billing.ts`, `onboarding-billing.test.ts`,
  `onboarding-credits.ts`, `onboarding-state.ts`.
