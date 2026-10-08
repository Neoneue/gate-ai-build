# UI Changelog: 2026-10-08

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-7.md`](./changelog-10-7.md)

---

## Sections

### Onboarding workspace (Improved flow) `20a1696`

A new first-run workspace, rebuilt from the onboarding mockup
(`docs/onboarding-mockup/`, local only) inside the dashboard chrome. Only the
Improved flow is presented; the Current flow's screens are built and hidden.

- **Workspace switcher.** Before: Enterprise, Pro, Default, Free. After: a
  fifth entry, "Onboarding" (`neutral` badge), that always opens
  `/overview-onboarding` (`toOnboardingPath()`, `src/lib/plan.ts`).
- **Tier plumbing, gated on `isOnboardingSurface`.** No roles
  (`isTeamRoleSurface`), Free plan (`src/data/plans.ts`), the Default nav
  with Overview on `/overview-onboarding` (`ONBOARDING_SIDEBAR_SECTIONS`),
  Gate Chat credits as non-Pro (`chat-data.ts`). Leaving the workspace for
  Pro lands on `/overview`.
- **Routes** (`src/App.tsx`, layout `OnboardingLayout`):
  `/overview-onboarding`, `/improved-{handoff,link,connect,verify,complete}-onboarding`,
  `/chat-onboarding(/:conversationId)`; the hidden Current flow's
  `/setup-*-onboarding` routes redirect to step 1.
- **Always from step 1.** Flow state lives in React state only. A refresh
  or a cold load of any later step returns to `/overview-onboarding`.
- **Top bar.** `DashboardChrome` gained an optional `topBarAction` slot
  (renders nothing unless passed). Onboarding passes the mockup's "Get
  started n/N" progress button, which becomes "Setup complete".
- **Steps.** Method picker (Gate Chat / Gate Connect / Manual setup, equal
  widths), phone start (Gate Chat or email a setup link), handoff, setup
  link (valid by default), Prepare your setup (App, Billing, model, credits,
  Gate Connect download or API key + six client configs), Check connection,
  You're live on Gate (protection demo in a full-width collapsible row).
- **Reused, additive only.** `AddCreditsDialog` exported with an optional
  `onCheckout` (Billing passes nothing), `ModelPicker` exported from
  `SetupManual.tsx`. Assets: `public/onboarding/`,
  `public/icons/providers/{codex,claude-code,hermes,openclaw-color}.svg`.
- **Motion hooks.** Every animated art root takes a `ref` and carries
  `data-motion-root`; parts carry `data-motion`; the route figure and the
  handoff art carry `data-state`. Motion is the animator's
  (`onboarding-motion.css`, `use-onboarding-motion.ts`).
- **Owner follow-ups.** "Explore first" removed from every Improved step
  header (`ImprovedHeader`); the Gate Chat card's "Free model" badge moved
  from `outline` to `info` (blue wash).
- **Illustration motion (animator, owner-tuned).** Gate Chat card restyled
  as the live chat (light prompt bubble, reply card with typing dots, blue
  send key); Manual setup card is a `client.ts` editor retyping
  `baseURL: /v1` above a green `200` reply; Gate Connect card taps each app
  in turn (1px blue ring, `shadow-sm`, 1.11 swell) while a blue arc laps the
  orbit, then the hub swells and its border rests blue (`--pace: 1.4`, about
  3.5s). Placeholder bars sweep once, then rest solid. Replay on mouse hover
  or keyboard focus only; reduced motion fades each art in over 200ms with
  no movement. Method cards press to `scale-[0.99]` and their art stage has
  a 1px `border-border`.
