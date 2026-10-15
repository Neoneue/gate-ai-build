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

### Onboarding Gate Chat: attach on phone; files go with the prompt `6f9880a`

- Phone Gate Chat composer (Mobile A and B). Before: no attach key (removed
  2026-10-12). After: attach leads the toolbar like desktop (paperclip, a
  separator from `sm`, then the model picker). The picker's `-ml-2.5` pull
  moved to attach's edge pull (`EDGE_KEY_START`). Compare stays desktop-only.
- Send still needs a prompt, as the main Gate Chat composer. Picked files go
  with that prompt: `sendScripted` takes them, the turn's `attachments` hold
  id, filename, bytes and content type, and the composer clears them with the
  draft. The thread draws such a turn with the shared `ChatMessage`
  (attachment chips). The reply stays scripted from the prompt.
- The picker now records each file's size and type as optional `ChatPickedFile`
  fields; the main Gate Chat ignores them.
- Saved chat history keeps a turn's attachments, checks each one and drops a
  malformed one without losing the turn.
- Files: `onboarding-chat-composer.tsx`, `OnboardingChat.tsx`,
  `onboarding-chat-store.ts`, `onboarding-chat-storage.ts`,
  `onboarding-chat-message.tsx`, `chat-attachment-picker.tsx`.

### Onboarding phone: Option B chat drawer gets Main; Overview row opens the real Overview `ad9ef23`

- Option B phone chat drawer (the phone demo chat without the Mobile A tab
  mark). Before: the drawer ended on credits. After: it ends on a ghost "Main"
  link with an ArrowLeft, under credits, back to B's two-card phone start
  (`/overview-onboarding`). A separator sits above it, as the shared rail's
  "Back to dashboard". New optional `mainPath` prop on `OnboardingChatSidebar`;
  `OnboardingChat` passes it only on Option B. Mobile A's way back stays the
  site menu.
- Site menu. Before: the Overview row and the menu brand opened Option B's
  phone start on B. After: both open the phone Overview
  (`/overview-mobile-onboarding`) on A and B, empty at first, then filled by
  the chat's traffic. The chat top bar logo still uses `phoneOverviewPath()`
  (B's phone start on B).
- Comments in `onboarding-routes.ts` refreshed to match; no logic change there.
- Files: `onboarding-chat-sidebar.tsx`, `OnboardingChat.tsx`,
  `onboarding-chat-top-bar.tsx`, `onboarding-routes.ts`.

### Onboarding: Gate Chat traffic carries no API key; key sections stay Default `89f3057`

- Rule (owner 2026-10-15): "There are no keys assigned until after desktop
  setup or this breaks the demo showing false data". Before: Gate Chat
  messages and conversations carried Gate Connect's caller label as their key,
  so the key tables and Activity key sections filled with a key that does not
  exist. After: they carry no key (`keyLabel: null`).
- Key cells. A new `NO_KEY` mark (`"—"` in `onboarding-workspace-traffic.ts`)
  renders in the Key column of Messages, Conversations, the Overview security
  preview and Security events. The key filters on Messages and Conversations
  list only real keys, and key search skips the empty value.
- Grouping. `workspaceGroups(..., "apiKey")` skips keyless messages, so no
  key group is made for Gate Chat.
- Desktop Activity. Before: "Top API keys" and "Recent key usage" filled as
  soon as any message existed. After: both show their Default empty states
  ("No API keys yet" and ActivityDefault's "No usage yet") until a message
  used a real API key (Manual setup's; Gate Connect's caller label is not a
  key either), through `keyedMessages` in `OnboardingActivity.tsx`. Phone
  Activity already showed both empty.
- Tests: `onboarding-workspace-traffic.test.ts` asserts chat rows have no key
  and that the key groups hold only setup's messages.
- Files: `onboarding-workspace-traffic.ts`, `OnboardingActivity.tsx`,
  `OnboardingConversations.tsx`, `OnboardingMessages.tsx`,
  `OnboardingSecurity.tsx`, `OnboardingSetupOverview.tsx`,
  `onboarding-workspace-traffic.test.ts`.

### Onboarding phone: Option B menus get "Get started"; Overview is always the real Overview `4ec7c66`

- Rule (owner 2026-10-15): on Option B the phone landing
  (`/overview-onboarding`) is "Get started", mirroring the desktop rail's Get
  started row (desktop hosts the setup steps; the phone hosts only the
  landing). Loop: Get started, Gate Chat, data pages, Get started.
- Site menus. Before: B's start page menu had Overview pointing at the start
  page itself, and no Get started row. After: `phoneSiteSections(overviewPath,
  improved?)` adds a "Get started" row (ListChecks, `SETUP_NAV_ID`) above
  Overview, linking to the landing while `!setupTasksDone(improved)`. B's
  start page menu and the chat site menu pass it (the chat menu not in a
  Mobile A tab). Overview now always opens the phone Overview
  (`/overview-mobile-onboarding`).
- Active row. B's start page highlights Get started (`onboarding-chrome.tsx`).
- Chat drawer. The foot link "Main" is renamed "Get started" and hides on the
  same rule (`setupTasksDone`).
- Mobile A unchanged.
- Files: `onboarding-routes.ts`, `improved-start.tsx`,
  `onboarding-chat-top-bar.tsx`, `onboarding-chrome.tsx`,
  `OnboardingChat.tsx`, `onboarding-chat-sidebar.tsx`.
