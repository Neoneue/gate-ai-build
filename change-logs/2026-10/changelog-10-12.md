# UI Changelog: 2026-10-12

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-11.md`](./changelog-10-11.md)

---

## Sections

### Onboarding phone demo: chat, signup and mobile pages with demo traffic `14f3b7d`

Onboarding versions only. The desktop dashboard and the main Gate Chat are
unchanged; every mobile part is a copy under `src/pages/onboarding/`.

- Signup: phone create-account screen on its own auth shell
  (`OnboardingSignUp.tsx`, `OnboardingAuthLayout.tsx`), leading into Gate Chat.
- Chat script (`src/data/onboarding-chat-script.ts`): scripted replies with
  logged-note and setup-link cards; email button states.
- Model picker (`onboarding-model-selector.tsx`): Free tab, Recent, and a
  refusal for paid models.
- Quick actions check off and leave, the setup-link chip stays, with motion.
- Demo traffic (`onboarding-demo-traffic.ts`, `onboarding-messages-hero.ts`):
  every demo message feeds the phone Overview, Messages, Activity and
  Conversations (`OnboardingMobile*.tsx`, `onboarding-mobile-parts.tsx`).
- Option B phone start shares the same chat; its Overview returns to the start
  page. A desktop onboarding narrowed below 767px uses Option B.
- `OnboardingDashboardChrome.tsx`: onboarding copy of the dashboard chrome.
- Docs: no-thrash page-copy rule; `data-model.md` updated.

### Onboarding phone: auth 44px targets and chat readable at 200% text `4229173`

Onboarding versions only. Desktop and the 100% phone render are unchanged
(byte-identical).

- Sign-in: onboarding copy of the sign-in page for `/sign-in-onboarding`
  (`OnboardingSignIn.tsx`).
- Auth buttons are full width and 44px tall below md; the show-password tap
  area is 36x36. Desktop unchanged.
- Chat at 200% text: the reply header and usage row wrap
  (`onboarding-chat-message.tsx`, `onboarding-chat-usage-row.tsx`).
- Helper line and picker count line spacing; the model chip truncates instead
  of hiding.
- Picker controls truncate and the active tab scrolls into view
  (`onboarding-model-selector.tsx`); the setup-link button is capped to the
  card.
