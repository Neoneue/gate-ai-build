# Audit - 2026-10-16

Read-only reviews by the `front-end-developer` agent. Checklist: tick an
item when it is applied and verified, then append the commit hash to the
item's first line. Pick items by ID ("ux-1, ux-4"). Paths are relative
to `src/`. Already decided, not re-flagged: see the settled table in
`.claude/skills/ui-audit/SKILL.md`.

The `ux-laws` run is one section with a subsection per screen of the
Improved onboarding flow (Option B), in flow order; the law each item
breaks is its rule slug. Items marked "owner-decided" touch an element the
owner already settled and are filed only because a law is broken with new
evidence (a measurement taken in this run).

## Summary

- Why: owner asked for a full UX audit of the new onboarding flow (Option B, phone and desktop) with the `ux-laws` skill, fixes where confidence is high.
- Tested: ux-laws on 14 screens and states, walked in Playwright as a user would (state carried between steps): phone 390x844 touch (sign in, sign up, 2-card start, Check your email, Gate Chat landing, first reply and follow-ups, paid-model refusal), desktop 1440x1000 (picker, Gate Connect download and signed-in, Manual with key, billing and credits, checkout, Check connection idle / pass / fail-connection / fail-demo / fail-both, complete, setup link expired / account / workspace, Gate Chat path start); keyboard focus on the picker and Check connection; reduced motion on the phone start, step 2 and step 3.
- Found: 17 items, 2 HIGH / 7 MEDIUM / 8 LOW; 16 applied, 1 skipped, 0 open.
- Opinion: Qualified at run time (worst: ux-1 Check connection dropped keyboard focus to the page; ux-2 the phone chat scrolled the first answer out of view). All 16 applied and verified in the browser 2026-10-16, owner checked locally.
- Next: none. ux-13 kept as is by owner decision (see the item).

## Runs

| # | Time (CT) | Skill | Scope | Items | Applied |
| --- | --- | --- | --- | --- | --- |
| 1 | 09:55 | ux-laws | Improved onboarding flow (Option B), phone 390x844 and desktop 1440x1000, browser walk | ux-1 to ux-17 | 16/17 |

## ux-laws

### Global

- [x] **ux-14 LOW** `similarity` pages/onboarding/onboarding-chat-landing.tsx:177, pages/onboarding/improved-parts.tsx:138, pages/onboarding/current-verify.tsx:494, pages/onboarding/improved-start.tsx:193 e33a59e e33a59e
  - Before: `<ArrowUpRight` on the chat quick actions (sends a prompt in place) and on "Try Gate Chat instead" and the four explore rows (opens a new tab), while "Open Gate Chat" marks its new tab with `<ExternalLinkIcon`
  - After: one meaning per glyph across the flow, owner to pick (see Decision needed); the same class as audit-10-5 ux-3
  - Why: one arrow means "send here" on the chips and "new tab" on the setup links, and the new tab has two glyphs, so the icon cannot predict what a tap does (grep: `ArrowUpRight` 4 render sites in the Improved flow, onboarding-chat-landing.tsx:177 and :557, improved-parts.tsx:138, current-verify.tsx:494; `ExternalLinkIcon` 2, improved-start.tsx:193 and improved-setup.tsx:1274).

### Sign in and sign up (phone)

- [x] **ux-6 MEDIUM** `fitts` pages/onboarding/OnboardingSignIn.tsx:153, pages/onboarding/OnboardingSignUp.tsx:446 e33a59e e33a59e
  - Before: `<TextLink className="type-copy-12" to={ONBOARDING_AUTH[version].signUp}>` (and the sign-up footer's `Sign in` link), 16px tall on a touch screen
  - After: add `max-md:relative max-md:after:absolute max-md:after:inset-x-0 max-md:after:top-1/2 max-md:after:h-9 max-md:after:-translate-y-1/2` (the file's own show-password tap-area recipe, OnboardingSignIn.tsx:102, 36px as the owner set it there)
  - Why: Option B starts at sign-in and a new user's only way forward is this inline link, so the first tap of the demo lands on a 100x16 target, below ux-laws Fitts (44px on touch) and design.md's 24px floor; WCAG 2.5.8 exempts inline links, so this is a Fitts finding, not a WCAG one (getBoundingClientRect: Create an account 100x16, Sign in 37x16, at 390x844 touch).
- [x] **ux-15 LOW** `flow` pages/onboarding/OnboardingSignUp.tsx:400
  - Before: `disabled={!canCreate || pending !== null}` with no line naming what is missing; the EULA checkbox that gates it sits at the top of the card (owner-decided, live product parity 2026-10-12)
  - After: keep `disabled={pending !== null}` only and, on a submit with gaps, mark each unmet field with `FieldError` (components/ui/field.tsx), owner to confirm against the live product
  - Why: a user who fills name, email and a strong password still sees a dead Create account, and the reason (the EULA box) is 485px above it and off screen once the phone keyboard opens, so they cannot tell what to fix (getBoundingClientRect: checkbox y206, Create account y691 at 390x844).

### Phone start (two cards)

- [x] **ux-4 MEDIUM** `mental-model` pages/onboarding/improved-start.tsx:405 e33a59e e33a59e
  - Before: `We'll email{" "}` stays in the future tense after the link is sent, beside the button's "Re-send email"
  - After: a sent-state line once `improved.handoffSent || sentInChat` (string from the copywriter), same place, voice and 8px grouping
  - Why: the only proof of the send is the button's "Email sent!" for 2 seconds, then the card reads "We'll email `user@example.com`." next to "Re-send email", which says the email has not gone yet (measured: label "Email sent!" for 2000ms, then "Re-send email"; line text unchanged; 0 toasts).
- [x] **ux-5 MEDIUM** `similarity` pages/onboarding/improved-start.tsx:284, pages/onboarding/onboarding-computer-prompt.tsx:199, data/onboarding-chat-script.ts:79
  - Before: phone start `Sending link…` 3000ms, `Email sent!` 2000ms, no toast, `Re-send email`; chat offer `Sending email` 2000ms, toast `Setup link sent. Check your email on your computer.`, `Re-send email setup link` (owner-decided per surface, 2026-10-09 and 2026-10-12)
  - After: one send recipe for both surfaces (owner picks which; strings from the copywriter); the chat offer's toast already names the next step
  - Why: it is one action on one object, the same email, reachable twice in one run, yet it reports done two ways with three labels, so the user cannot carry what they learned on one surface to the other (measured: 0 toasts on the start, 1 in the chat; grep: `SEND_MS = 3000`, `emailSend: 2000`).

### Check your email (phone handoff)

- [x] **ux-16 LOW** `mental-model` pages/onboarding/improved-start.tsx:480, pages/onboarding/improved-start.tsx:567
  - Before: no control opens `/improved-handoff-onboarding`; reached by URL, its 3s auto-open runs the desktop link on the phone, which lands back on the phone start with the toast `Picked up your setup from your phone`
  - After: owner decides: retire the route (the 2026-10-09 decision keeps the phone on its start) or make it the email card's sent state with no auto-open (see Decision needed)
  - Why: the screen the data-model diagram shows after "email a setup link" is never reached, and when it is, the phone tells the user it picked up a setup from their phone, on that phone (grep: 0 `navigate` calls to `ONBOARDING_ROUTES.handoff`; measured: URL back to /overview-onboarding with that toast 3.5s after load at 390x844).

### Phone Gate Chat

- [x] **ux-2 HIGH** `peak-end` pages/onboarding/onboarding-chat-thread.tsx:92
  - Before: `followPageEnd(target)` on every `contentKey` change, including the two follow-up cards that append after the first reply (owner-decided follow-latest, 2026-10-14)
  - After: when the follow-ups mount after the first reply, scroll the user's first turn to the top of the thread under the top bars instead of to the page end; follow-latest resumes on the next send (the ChatGPT and Claude pattern: the user's turn pins to the top)
  - Why: the logged note and the email offer push the answer to the user's very first question above the fold, so the first reply Gate gives, the peak of the phone path, is never seen without scrolling back (getBoundingClientRect: first reply text top -50px, under 120px of top bars, viewport 844).
- [x] **ux-9 MEDIUM** `fitts` pages/onboarding/onboarding-computer-prompt.tsx:219
  - Before: `size="sm"` on "Email me the setup link", 36px on touch
  - After: `size="default"` (44px on touch), pending the design.md decision below
  - Why: this button is the phone path's conversion (PRD phone step 4) and is 36px on a touch screen, which design.md's touch ladder allows for `sm` but ux-laws Fitts puts at 44px (getBoundingClientRect: 175x36 at 390x844 touch; design.md:613).
- [x] **ux-7 MEDIUM** `tesler` data/onboarding-chat-script.ts:29
  - Before: `PAID_MODEL_HELPER = "Paid models need credits to use."` with send, Enter and all three quick actions off (owner-decided refused send, 2026-10-12)
  - After: the helper line carries one inline action back to the free default (`constellation/qwen3-8-flash-free`), a `TextLink` in the copy voice; string from the copywriter
  - Why: the line names the block but not the way out, so a new user with $0 credits who taps a paid model in the default list has every action dead and must work out to reopen the picker (measured: Send disabled, 3 of 3 quick actions disabled after picking Claude Opus 5; 0 actions in the helper line).
- [x] **ux-8 MEDIUM** `hicks-law` pages/onboarding/onboarding-model-selector.tsx:108
  - Before: `const DEFAULT_MODEL_VIEW: ModelView = "all";`
  - After: open on `"free"` in the phone demo chat while the onboarding balance is 0; All models stays one tap away
  - Why: a brand-new Free user with no credits opens the picker on 421 models where every non-free pick is refused (ux-7), while the Free tab that holds their usable choices sits beside it (measured: "Showing 421 of 421 models", default tab All models, balance $0.00).

### Set up Gate Connect and Manual setup (desktop step 2)

- [x] **ux-12 LOW** `mental-model` pages/onboarding/improved-setup.tsx:529
  - Before: `<TextLink to="/billing-onboarding">Billing</TextLink>` leaves setup in the same tab
  - After: `TextLink as="a" href="/billing-onboarding" rel="noopener noreferrer" target="_blank"` with the `NEW_TAB_CUE` span (mirror improved-parts.tsx:128-145)
  - Why: every other exit from setup in this flow opens a new tab so setup stays put (Try Gate Chat instead, the four explore rows), so the one same-tab exit breaks the pattern mid-step (grep: `target="_blank"` or `openInNewTab` on 3 setup exits, this link same-tab).
- [ ] **ux-13 LOW** `tesler` pages/onboarding/improved-setup.tsx:736
  - Skipped (owner 2026-10-16): the official product snippet is the source of truth for setup code, and filling in the key would put a live secret into copyable code.
  - Before: `"Add your saved key secret."` after the user created the key seconds earlier; the snippet keeps `sk-gw-…your Gate key…` (owner-decided: the user makes the key, official snippet verbatim, 2026-10-13)
  - After: owner decides whether the snippet fills in the key created this session while its secret is still in memory (the Stripe quickstart pattern)
  - Why: the system holds the secret it just showed, yet asks the user to paste it into a snippet by hand, the step most likely to go wrong in setup (measured: snippet lines 4 and 7 keep the placeholder after Create key in the same session).

### Check connection (desktop step 3)

- [x] **ux-1 HIGH** `focus-order` pages/onboarding/improved-setup.tsx:1039, pages/onboarding/improved-setup.tsx:1116 e33a59e e33a59e
  - Before: `disabled={checking}` and `disabled={running}` on Check connection, Try again and Send the message, and each button unmounts on a pass
  - After: `aria-disabled={checking}` / `aria-disabled={running}` with `if (checking) return;` / `if (running) return;` at the top of `check` / `runDemo` (mirror improved-start.tsx:266 and :413-414), and on a pass focus the new `StatusRow` given `tabIndex={-1}` (mirror improved-start.tsx:493-497)
  - Why: a disabled button gives up focus to the page, so a keyboard user who presses any of the three lands on the document and Tab restarts at the 20-row rail, and the `StatusRow` mounts with its text already inside, which screen readers often skip (WCAG 2.4.3) (measured: document.activeElement = body after Enter on Check connection, on the pass and on the fail-connection retry).
- [x] **ux-17 LOW** `similarity` pages/onboarding/improved-setup.tsx:1079, pages/onboarding/improved-art.tsx:572, pages/onboarding/improved-art.tsx:648
  - Before: `<StatusRow tone="success">Prompt injection blocked.</StatusRow>` beside the danger `block` badge, and `CircleSlash` in `text-destructive` for both the blocked attack (wire) and the failed connection (Gate tile)
  - After: the failed connection takes `CircleAlert` (the error StatusRow's glyph, improved-parts.tsx:234), so `CircleSlash` means blocked only
  - Why: one red glyph says "Gate stopped an attack" in one state and "your connection failed" in another, so the figure cannot tell success from failure at a glance (grep: `CircleSlash` 2 render sites in improved-art.tsx, states blocked and error).
- [x] **ux-10 LOW** `copy` pages/onboarding/improved-setup.tsx:1094 e33a59e e33a59e
  - Before: `Gate didn’t get a result for that message. Send it again.` above a button reading `Try again`
  - After: one verb in the line and the button (string from the copywriter)
  - Why: the error tells the user to "send it again" and the only action says "Try again", so the instruction and the control disagree (grep: 1 hit each at improved-setup.tsx:1094 and :1130).

### You're protected and live (complete)

- [x] **ux-3 MEDIUM** `no-duplication` pages/onboarding/onboarding-chrome.tsx:425, pages/onboarding/current-verify.tsx:430
  - Before: top bar `Tasks 0/4` with an Optional list of the same four tasks, and the page's `0/4 done`, progress bar and four rows (owner-decided parts, 2026-10-13)
  - After: one home for the count and the list on this page, owner to pick (see Decision needed)
  - Why: the same count and the same four tasks appear twice in one view and move together, against the standing law that every value appears once (gateway-context.md:95) (measured: "Tasks 1/4" and "1/4 done" both after one row click at 1440x1000).
- [x] **ux-11 LOW** `copy` pages/onboarding/onboarding-chrome.tsx:106, pages/onboarding/current-verify.tsx:358 e33a59e e33a59e
  - Before: `See token savings` (Tasks menu) and `See your token savings` (page row) for one task
  - After: one label for the task in both lists (string from the copywriter)
  - Why: the two lists sit in the same view and name the same task two ways, so they read as two tasks (grep: 1 hit each).

### Decision needed

- ux-3: resolved 2026-10-16, the top-bar menu is hidden on `/improved-complete-onboarding` (the page is the checklist).
- ux-9: resolved 2026-10-16, design.md Touch targets gained "Conversion action": a flow's conversion action is Button `default` (44px on touch), never `sm`.
- ux-14: resolved 2026-10-16 by the owner's 2026-10-13 rule (a new tab gets `ExternalLinkIcon`, improved-start.tsx:190) and the product (`ExternalLinkIcon` on a new-tab link, gate pages/Dashboard.tsx:59; `ArrowUpRight` on the chat chips, gate chat/chat-landing.tsx:41): the two new-tab sites take `ExternalLinkIcon`, the chips keep `ArrowUpRight`.
- ux-16: resolved 2026-10-16, `/improved-handoff-onboarding` retired (owner 2026-10-09: the phone stays on its start); data-model.md updated.
- ux-2, ux-5, ux-7, ux-15: resolved 2026-10-16, owner approved changing the earlier decisions; ux-13 kept as is.

### Compliant, checked and clean

- Choice Overload and Hick, desktop picker: three cards, Gate Connect preselected as the default, one primary action (Continue).
- One primary action: each step and state shows one filled button (picker, step 2 both methods, step 3 every state, complete, link screens, checkout).
- Doherty: every async action shows its pending state at once (Creating account, Sending link…, Checking connection…, Checking message…, Sending email).
- Goal-Gradient and Zeigarnik, desktop setup: Get started N/4 counts from 1/4 on step 2 and reaches 4/4 before Finish setup.
- Jakob, checkout: the hosted-checkout layout (order summary left, pay right, one Pay button) matches Stripe Checkout.
- Fitts, phone start and Check your email: both full-width actions are 44px on touch.
- Reduced motion: 0 running animations on the phone start, step 2 and step 3 with `prefers-reduced-motion: reduce` (14, 11 and 8 without).
- Failure states: fail-connection, fail-demo and fail-both each show an error StatusRow with a retry, keep the later group dimmed and recover on the retry.
- Figure-Ground, step 2 and step 3: dimmed groups are inert until their step opens.

Verdict (run 1): Qualified. Two HIGH items (ux-1 focus, ux-2 hidden first answer) are on the demo path but block no promotion of a mockup.

Files read in full: pages/onboarding/improved-start.tsx (690), pages/onboarding/improved-setup.tsx (1294), pages/onboarding/improved-parts.tsx (252), pages/onboarding/onboarding-chrome.tsx (481). Read by region: pages/onboarding/OnboardingSignIn.tsx, pages/onboarding/OnboardingSignUp.tsx (60-456), pages/onboarding/current-verify.tsx (300-509), pages/onboarding/onboarding-routes.ts (1-140, 290-320), pages/onboarding/onboarding-chat-thread.tsx (75-184), pages/onboarding/onboarding-computer-prompt.tsx (185-241), pages/onboarding/onboarding-model-selector.tsx (95-112), pages/onboarding/improved-art.tsx (565-660), pages/onboarding/OnboardingLayout.tsx (120-160). Not read: pages/ApiKeys.tsx, pages/DashboardDefault.tsx, pages/billing/CreditsCard.tsx, pages/onboarding/onboarding-connect-tabs.tsx, pages/onboarding/OnboardingCheckout.tsx (judged in the browser only).

## Patterns

- `focus-order`: ux-1. No lint; a vitest that presses Enter and asserts `document.activeElement` would catch it.
- `similarity`: ux-5, ux-14, ux-17. Same action or glyph, two behaviours.
- `copy`: ux-4, ux-10, ux-11. Copywriter, through the orchestrator.
- `tesler`: ux-7, ux-13. The system holds the answer and asks the user anyway.
- `fitts`: ux-6, ux-9. Touch targets under 44px on the phone path.
