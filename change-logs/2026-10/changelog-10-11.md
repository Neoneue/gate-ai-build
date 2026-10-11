# UI Changelog: 2026-10-11

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-10.md`](./changelog-10-10.md)

---

## Sections

### Onboarding Gate Chat: sign-up path and Onboarding version `7dd4a24`

Phone flow from the "Onboarding by device" PRD: `/sign-in-onboarding` ->
"Create an account" -> `/sign-up-onboarding` -> submit -> `/chat-onboarding`.
The main Gate Chat (`src/pages/Chat.tsx`, `src/pages/chat/`,
`src/layouts/ChatLayout.tsx`, used by Free, Default, Pro and Enterprise) is
unchanged.

- Routes (`App.tsx`): `/sign-in-onboarding` and `/sign-up-onboarding` render
  the same SignIn and SignUp screens under AuthLayout. `/chat-onboarding`
  before: the shared `Chat` under `ChatLayout`; after: `OnboardingChat` under
  `OnboardingChatLayout`.
- `SignIn.tsx` / `SignUp.tsx`: links use `withTierOf`, so the onboarding pair
  link to each other. A SignUp submit on an `-onboarding` path navigates to
  `/chat-onboarding` with router state `ONBOARDING_SIGNUP_STATE`.
  `/sign-in` and `/sign-up` are unchanged.
- `onboarding-routes.ts`: adds `ONBOARDING_SIGN_IN`, `ONBOARDING_SIGNUP_STATE`
  and `isOnboardingSignup`. `OnboardingLayout.tsx`: a signup can start the
  flow on the page it lands on.
- `nav-sections.ts`: the Onboarding workspace sidebar's Gate Chat row before
  opened `/chat-default` (the main version) in a new tab; after it opens
  `/chat-onboarding` in the same tab.
- `OnboardingChat.tsx` (copy of `Chat.tsx`): clean slate store (no
  conversations, memories, favourites or last-used models); the first send
  opens the demo conversation as the first chat. Credits $0.00, no Upgrade to
  Pro, no workspace switcher. Phone menu top row: full logo (unlinked
  `BrandLockup`) left, X close (`SheetClose`) right, with a divider. Default
  model Qwen3.8 Flash (free, from `src/data/free-models.ts`, priced Free).
  Helper line under the composer: "This model is free. Gate scans every
  message."
- `OnboardingChatLayout.tsx`: `ChatLayout` without the top bar and without
  Ask AI; the conversation bar is the first row.
- `onboarding-chat-sidebar.tsx`: "Sign out" with `LogoutIcon` (to
  `/sign-in-onboarding`) replaces "Back to dashboard".
- `onboarding-chat-header.tsx`: no Upgrade button; opens the onboarding memory
  panel (`onboarding-chat-memory-panel.tsx`, reads the onboarding store).
- `onboarding-chat-composer.tsx`: the model is fixed text (20px logo,
  `type-label-16`); no picker, no add-a-second-model, no attachments.
- `onboarding-chat-store.ts`: the in-memory onboarding chat store.
