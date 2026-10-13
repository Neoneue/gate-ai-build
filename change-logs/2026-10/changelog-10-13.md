# UI Changelog: 2026-10-13

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-12.md`](./changelog-10-12.md)

---

## Sections

### Onboarding desktop: setup steps, real Gate Chat, setup Overview `c9c7663`

- Step 3 Check connection uses step 2's layout: "Send a test message", then
  a required "Run the protection demo" with matching success / error rows
  (`?simulate=fail-connection|fail-demo|fail-both` previews the errors).
- Final page "You're protected and live"; its task rows open in a new tab.
- Top-bar Get started / Tasks menu: per-path rows, forward only, opens only.
- Sidebar "Get started" item; Overview appears after Finish setup and opens
  `/overview-setup-onboarding`, a Pro-layout Overview fed by the two setup
  messages.
- Desktop onboarding Gate Chat is the real Gate Chat (attach, picker with
  the Free tab, compare), opens in a new tab, starts the user's own
  conversation; credits added in setup carry to the chat tab.
- Manual setup: the official repo's ConnectTabs ported
  (`onboarding-connect-tabs.tsx`), key step, official titles and subtitles.
  Gate Connect shows its billing choice below the app.
- Notifications and Ask AI are hidden during onboarding.

### Onboarding desktop: billing choice on both setup methods, Fable 5 default `0e35235`

- Before: Manual setup was BYOK only (c9c7663); the default model was
  DeepSeek V4 Flash and changing the app swapped the model.
- After: `SHOW_BILLING_CHOICE = true` in `improved-setup.tsx`. The billing type
  section (Gate credits adds "Select a model" + "Add credits") sits after the
  app on Gate Connect and, on Manual step 2, under the key, dimmed and inert
  until a key exists. The Manual base URL section is hidden until a key and
  dimmed until a balance on Gate credits; its title and subtitle follow the
  billing type, verbatim from the official product ("Set your base URL and
  key", "Point your app to Gate"). ConnectTabs gains `byokOnly`, `paygOnly`
  and `paygModel`. "I've saved my settings" needs a key plus a balance.
  Manual model is the full `CatalogModelPicker`.
- Defaults (`improved-data.ts`, `onboarding-state.ts`): `DEFAULT_PAYG_MODEL`
  is `anthropic/claude-fable-5`, first in `IMPROVED_MODELS`; an app change no
  longer swaps the model; initial state is `client: "claude-code"`,
  `connection: "gate-connect"`.
- Manual steps card; "Try Gate Chat" link in the header on steps 2-3; picker
  order Gate Connect, Manual, Gate Chat; download step and step 3 demo dimmed
  and inert until ready.

### Onboarding desktop: `/checkout-onboarding` page `0e35235`

- Before: Add credits had no destination in the onboarding demo.
- After: new `OnboardingCheckout.tsx`, routed in `App.tsx` and
  `onboarding-routes.ts`. Add credits sends `{amount, returnTo}`; Pay waits
  1.2s then adds the credits; a 5.00% fee line.

### Onboarding desktop: Manual route figure and landing card titles `0e35235`

- Before: Manual step 2 showed the 3-node figure with an app tile.
- After: a 2-node figure (Gate to "Your provider" or the picked model, no app
  tile), `data-route-nodes`, with 2-node timing in `onboarding-motion.css`.
- Landing page `/overview-onboarding` card titles in `improved-start.tsx`
  METHODS: "Gate Connect" becomes "Gate Connect setup", "Gate Chat" becomes
  "Try Gate Chat" ("Manual setup" unchanged).

### Onboarding desktop: step 3 route animation `0e35235`

- Before: Check connection and the protection demo ran an 850ms
  `DEMO_CHECK_MS` state change with solid success wires and an infinite
  `route-pulse` loop; a caption badge showed on step 3.
- After: both reuse step 2's route run (same dot, trailing dashed run, tap,
  swell, curves, pace) on a 5s schedule, `ROUTE_CHECK_MS = 5000`. Check: the
  app tile taps blue and returns to gray while a blue dot crosses into Gate
  at 0s and 3s; at 5s the Gate border turns green with a green ShieldCheck
  badge (replaces the circle Check), then a green dot and trail cross to the
  target (provider or picked model), whose border turns green. Protection
  demo: the same two blue sends, Gate green with the shield at 5s, no dot to
  the target, and a gray CircleSlash (`text-input`) on wire 2's midpoint.
- Error state (`?simulate=fail-connection|fail-demo|fail-both`): Gate red
  border (`border-destructive`) plus a red CircleSlash badge, nothing passed
  on, retry succeeds. RouteFigure `state` gains `"error"` and `"blocked"`.
- Wires are always gray dashes at rest. Reduced motion switches every state
  straight to its end state. Step 3 no longer shows the "Billed by your
  provider" / "Uses Gate credits" badge; step 2 keeps it.

### Onboarding desktop: Manual setup title, no upgrade promo, shorter model subtitle `4b67654`

- Before: step 2 title and its Improved progress row read "Set up Manual
  setup"; the sidebar "Upgrade to Pro plan" promo showed on onboarding
  surfaces; the "Select a model" subtitle read "Choose which Gate model your
  tokens will use. It only sets up your first config, and you can change it
  anytime."
- After: the title and progress row read "Manual setup" (Gate Connect keeps
  "Set up Gate Connect"); `upgradePath` is `undefined` when `isOnboarding`, so
  the promo is hidden there (Default and Free keep it); the subtitle reads
  "Choose which Gate model your tokens will use." and fits one line.
- Where: `improved-setup.tsx` (ImprovedHeader title, Select a model
  description), `onboarding-chrome.tsx` (`IMPROVED_PATH_STEPS` manual row),
  `OnboardingDashboardChrome.tsx` (`upgradePath`).

### Onboarding desktop: Gate Connect app defaults to Claude Code in emailed link and fallback `1f76bdc`

- Before: two spots still fell back to Codex after the default app became
  Claude Code: the setup an emailed link carries when the phone chose Gate
  Chat, and the app picked when the method switched to Gate Connect while
  OpenAI SDK was selected.
- After: both use `"claude-code"`.
- Where: `onboarding-state.ts` (`snapshotDesktopSetup`, `client`),
  `improved-start.tsx` (DesktopPicker connection switch fallback).

### Onboarding phone: A and B demos each start at their own signup `7e9da81`

- Before: one `/sign-in-onboarding` and `/sign-up-onboarding` for both phone
  demos; the chat's Sign out always returned to it, and signup always opened
  Mobile A's chat.
- After: `/sign-in-onboarding/a|b` and `/sign-up-onboarding/a|b` (the bare
  paths redirect to `/a`). `OnboardingSignIn` and `OnboardingSignUp` take a
  `version` prop. B's signup lands on the 2-card phone start
  `/overview-onboarding` without the Mobile A tab mark. The phone chat's Sign
  out returns B testers to `/sign-in-onboarding/b`.
- Where: `App.tsx`, `onboarding-routes.ts` (`ONBOARDING_AUTH`,
  `chatSignInPath()`), `OnboardingSignIn.tsx`, `OnboardingSignUp.tsx`,
  `onboarding-chat-sidebar.tsx`; `data-model.md` ("Onboarding workspace").

### Onboarding: Explore your Gateway rows stay in the onboarding workspace `7e9da81`

- Before: the final page's four "Explore your Gateway" rows opened the
  Default workspace pages (`/policies-default` and peers).
- After: they open `/policies-onboarding`, `/limits-onboarding`,
  `/token-savings-onboarding` and `/models-onboarding`, new routes that mount
  the Default twins inside the onboarding chrome.
- Where: `App.tsx` (new routes), `onboarding-routes.ts` (`ONBOARDING_EXITS`),
  `data-model.md`.

### Onboarding step 3: spinner on pending buttons `191ecb3`

- Before: Check connection and Send the message showed only a pending label.
- After: both show `Loader2` (`data-icon="inline-start"`,
  `animate-spin motion-reduce:animate-none`) while pending. `design.md`
  "Feedback and loading" gains the Button pending rule, and Skeleton is "the
  only loading motion for page data".
- Where: `improved-setup.tsx`, `design.md`.
