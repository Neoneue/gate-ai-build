# UI Changelog: 2026-10-15

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-14.md`](./changelog-10-14.md)

---

## Sections

### Onboarding: Gate Chat use fills the workspace data pages, across tabs `9af0c55`

- Rule (owner 2026-10-14): "any gate chat usage while on an onboarding session
  adds to it", from the desktop or the phone chat, in the same tab or a new
  one. Before: the workspace pages showed only the setup's two messages and
  the chat was in memory per tab. After: every settled Gate Chat reply is a
  request on the workspace pages.
- Chat store. Before: `onboarding-chat-store.ts` lived in memory. After: it
  persists to localStorage `gate-onboarding-chat-state` (new
  `onboarding-chat-storage.ts`), stays in sync across tabs through the
  `storage` event, validates what it reads, and does not save a streamed reply
  until it settles. A fresh onboarding run clears it. Phone pages read the same
  shared store.
- One merged source (new `onboarding-workspace-traffic.ts`, hook
  `use-workspace-traffic.ts`): the setup's 2 messages plus every settled Gate
  Chat reply. Overview, Messages, Activity, Conversations, Security and Token
  savings on desktop all read it, so counts reconcile across pages.
- Chat rows. Status Success, guardrail Allow, cost as the chat showed it, key
  `gate-connect (...)` as the live product logs it, 0 saved tokens. Each chat
  is one Conversations row. A compare turn counts one request per model (Reqs
  column).
- Overview preview tables are capped at 5 rows (the Dashboard's cap). OPEN:
  the owner has not confirmed 5 versus 8.
- Files: `data-model.md`, `OnboardingActivity.tsx`, `OnboardingConversations.tsx`,
  `OnboardingLayout.tsx`, `OnboardingMessages.tsx`,
  `OnboardingMobileConversations.tsx`, `OnboardingMobileOverview.tsx`,
  `OnboardingProvider.tsx`, `OnboardingSecurity.tsx`,
  `OnboardingSetupOverview.tsx`, `OnboardingTokenSavings.tsx`,
  `onboarding-chat-store.ts`, `onboarding-demo-traffic.ts`,
  `onboarding-setup-traffic.ts`, new `onboarding-chat-storage.ts`,
  `onboarding-workspace-traffic.ts`, `use-workspace-traffic.ts` and their tests.

### Onboarding setup: protection demo shows the blocked threat in red; Manual app tip `741c45f`

- Protection demo only (the test message is unchanged). Before: the app tile,
  wire 1 and its packet were blue like a normal check, and the blocked badge on
  wire 2 was a gray circle-slash. After: the app tile's tap ring (`art-tap`,
  new `--tap-ring`) and wire 1's packet and run are red (new `threat` prop on
  `RouteFigure` and `ImprovedRouteFigure`, set while the demo runs and once
  caught).
- Result beat. At the result Gate swells and its border turns from blue to red
  (`art-route-caught`, 800ms); at about 280ms a red circle-slash pops in on
  wire 2 (`art-pop`, scale 0.9 to 1, was a gray `text-input` fade); at about
  840ms Gate's border turns green and the shield badge lands. The resting frame
  is a green Gate with the shield, the red slash and a neutral model. Under
  reduced motion it lands on the resting frame.
- Manual "Select an app". Before: only Gate Connect had the Info tooltip. After:
  Manual has it too: "Just a starting point. Your base URL and key work in any
  app you choose, not only this one."
- Files: `improved-art.tsx`, `improved-parts.tsx`, `improved-setup.tsx`,
  `onboarding-motion.css`.
