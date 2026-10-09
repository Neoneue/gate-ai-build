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

### Data retention card follows the PRD `a325048`

Settings > Data retention (`src/pages/settings/DataRetentionCard.tsx`,
AG-1021), every tier: `/settings` (Pro), `/settings-free` and
`/settings-default` (Free), `/settings-enterprise`. Built to the PRD text and
the Free mockup's content (mockups are illustrative; styling is ours).

- **Section subtitle.** Before: "How long Gate keeps prompt and response
  content…". After, PRD verbatim: "How long Gate keeps request logs and
  prompt and response content for this organization." (`Settings.tsx`).
- **Card header.** "Retention window" (`CardHeader` / `CardTitle`) with the
  PRD description: records deleted within 24 hours of expiry, cannot be
  recovered, audit hashes, proofs and Digital Evidence anchors kept.
- **Field row.** A hairline above it. Before: the card title doubled as the
  label. After: the label is the plan name ("Free plan", "Pro plan",
  "Enterprise plan"), the input keeps its 80px width and "days" beside it,
  screen-reader name "Retention window in days". Helper, plain muted:
  Free "Retention is set by your plan. Upgrade to Pro to shorten the
  window, or to Enterprise to shorten or extend it."; Pro and Enterprise
  "Ceiling: 90 days. Minimum 0 days. Shortening deletes older records on
  the next run and cannot be undone." The 2026-10-07 bold plan limit is
  gone (the plan-name label is the one foreground line).
- **Readouts.** Before: four label-over-value facts. After: a framed
  details list (`DetailList` new `flush` variant, `dl` / `dt` / `dd`, label
  `w-44` column, full-width row dividers inside a `rounded-md border` frame;
  term over value below 448px of list width, nothing wraps). Rows, PRD
  labels: Current window, Oldest retained record, Records in window, Next
  deletion run, Last changed (Pro and Enterprise only; "Never" until a
  save), Usage metrics (owner addition: Free 90 days, Pro and Enterprise
  180, `metricsRetentionDays(tier)`, Info tooltip "Set by your plan,
  separate from the retention window." on the label, the Teams budget
  trigger).
- **Footer (Pro and Enterprise).** Before: Save, with Cancel only while
  editing. After: "Every change is recorded on the audit trail." left;
  Reset (outline, disabled until edited) and Save changes right. Free: no
  footer (not mutable); the Free plan banner below is unchanged.
- **Enterprise.** A one-line note card under the Retention window card:
  "Enterprise ceiling: 90 days. Your contract sets the ceiling; to raise
  it, contact support." (PRD: the Extended retention card becomes a
  one-line note with a Contact support link). Ceiling is the 90-day
  default (owner).
- **Lengthen toast.** "Records already deleted are not restored. Their
  audit anchors remain verifiable."
- **Shorten dialog.** Before: "Your N messages from before {date} will be
  deleted on {run}." plus a consequence callout, "Keep N days". After:
  "{N} records older than {date} become eligible for deletion on the next
  run, {run}. This cannot be undone, and raising the window later does not
  restore them."; a boxed `DetailList` (`labelClassName` `w-52`) with
  Current window, New window, Records eligible for deletion "{n} of
  {total}", Audit hashes and anchors "Kept"; the 0-day note at 0; "Need the
  content? Export CSV from Messages[, or push to your SIEM,] before the run."
  (SIEM on Enterprise only); Cancel and destructive "Shorten to N days".
- **Not built.** Pending clamp state: built, then removed (no way to show
  more than one state per route yet).

### Data retention: Free footer upgrade, Enterprise support, copy `f205ce4`

Settings > Data retention (`src/pages/settings/DataRetentionCard.tsx`),
follow-up to `a325048`.

- **Free card.** Before: a disabled 30 input beside "Free plan", the
  helper "Retention is set by your plan. Upgrade to Pro…", no footer, and
  the Free plan banner under the card. After: no input (it repeated the
  readout); a `FieldTitle` "Free plan details" over the helper "Pro plan
  lets you shorten the window or extend it to 90 days. On Enterprise, a
  contract can extend it further."; Current window reads "30 days
  (fixed)"; the card footer holds only an outline "Upgrade to Pro" (sparkle
  icon) that opens the plan comparison. The banner is removed from this
  card (Policies keeps its own). PRD mockup 03: "the footer action is the
  upgrade".
- **Pro above-ceiling error.** Before: "For a longer window, move to
  Enterprise." After: "Pro keeps up to 90 days. An Enterprise contract can
  allow a longer window; to ask about one, contact us." (link to the plans
  page, whose Enterprise card says "Contact us").
- **Enterprise ceiling note.** Before: "contact support" linked to
  `/billing-enterprise/plans`, where that label sits on the Free and Pro
  rungs. After: it opens the Contact support dialog in place
  (`ContactDialog`, now exported from `ManageSubscription.tsx`); closing it
  returns focus to the link.
- **Description.** Sentences swapped (kept first, then deleted), and
  "Digital Evidence anchors" became "Digital Evidence fingerprints", the
  site's UI term. Same swap in the lengthen toast ("Their Digital Evidence
  fingerprints remain verifiable.") and the shorten dialog row ("Audit
  hashes and fingerprints").
- **Shorten dialog.** Before: "Need the content? Export CSV from
  Messages…" as a muted line. After: the same line in a `Callout` above
  the footer.

### Data retention card in action, details and footer sections `095623a`

Settings > Data retention (`src/pages/settings/DataRetentionCard.tsx`),
follow-up to `f205ce4`. Every tier now reads as sections with one job each.

- **Action section (Pro and Enterprise).** Before: label "Pro plan" /
  "Enterprise plan", helper "Ceiling: 90 days. Minimum 0 days. Shortening
  deletes older records on the next run and cannot be undone." After: label
  "Choose how long to keep records"; Pro helper "Your plan allows any window
  from 0 to 90 days. On Enterprise, a contract can extend it further."
  (Enterprise helper not reworked yet).
- **Details section (every tier).** A hairline, then a `FieldTitle`
  "Free plan details" / "Pro plan details" / "Enterprise plan details"
  that labels the section (`aria-labelledby`), over the framed readout list.
  The Current window row stays on every tier (PRD mockup 01: "the figures a
  customer needs to confirm the setting is working").
- **Free.** Before: a "Free plan details" title over the helper, above the
  list, and a button-only footer. After: no action section; the helper "Pro
  plan lets you shorten the window or extend it to 90 days." is the footer's
  note beside Upgrade to Pro, the same note-plus-action shape as the paid
  footer. The "On Enterprise…" sentence moved from Free to Pro.

### Retention copy earns its place, Enterprise path at the moment of need `e7b4be4`

Settings > Data retention (`src/pages/settings/DataRetentionCard.tsx`),
follow-up to `095623a`. Rule: one home per number (typed value: the input;
saved value: Current window; range: the helper), and every string says one
thing nothing else on the card says.

- **Pro.** Helper before: "Your plan allows any window from 0 to 90 days. On
  Enterprise, a contract can extend it further." After: "Your plan allows
  any window from 0 to 90 days." Above-ceiling error before: "Pro keeps up to
  90 days. An Enterprise contract can allow a longer window; to ask about
  one, contact us." After: "Enter 90 or less. On Enterprise, a contract can
  extend it further; contact us." (the Enterprise path appears only when the
  limit is hit).
- **Enterprise.** Helper: "Your contract allows any window from 0 to 90
  days. To raise the ceiling, contact support." (the link opens the Contact
  support dialog). The separate ceiling note card under the card is removed:
  the helper is the PRD's one-line note of the ceiling. Error: "Enter 90 or
  less."
- **Shorten dialog.** Body before: "{N} records older than {date} become
  eligible for deletion on the next run, {run}. …" After: "Records older
  than {date} are deleted on the next run, {run}. This cannot be undone, and
  raising the window later does not restore them." The "New window" row is
  removed (the title states it).

### Owner email replaced with a placeholder `fa0039f`

The mock owner keeps their name; the address is `chad@example.com` in the
sidebar, user menu, feedback form, Settings profile, Notifications, the
Default team roster, the captured transcripts and their PII finding matches,
and docs. Onboarding's setup-link email and workspace use the mockup
placeholders (`alex@example.com`, "Alex's workspace").

## Components

### Sidebar upgrade card: corner dismiss, sparkle inset `83257d6`

`src/components/ui/sidebar-upgrade-card.tsx`, rendered by
`src/components/ui/sidebar.tsx` on Free and Default workspaces.

- **Sparkle.** Before: 8px from the top and right (`top-2 right-2`). After:
  12px from the top, 16px from the right (`top-3 right-4`).
- **Dismiss.** Before: none. After: a round outline X (`Button`
  `variant="outline" size="icon-xs" shape="circle"`, 24px, aria-label
  "Dismiss") floating on the card's top-right corner, 8px out
  (`-top-2 -right-2`). It is a sibling of the card button inside a
  `relative` wrapper, not nested in it.
- **State.** Dismissing hides the card and its `px-3 pb-4` slot for the
  visit; it comes back on a full reload (`src/data/upgrade-card-store.ts`,
  in memory, the notifications-store shape).

## Conventions

### UI gate requires `Precedent:` and a written gate file `64cac04`

The ux-laws gate is nine labelled lines. `Precedent:` names the tested
competitor pattern and the repo component it maps to (file:line), or
`new component:` and why; `scripts/require-skill.mjs` blocks UI writes
without it. A gate counts when written with the Write tool or an Edit that
holds it. Updated: `ux-laws` SKILL.md section 4, `.claude/rules/ux-laws.md`,
`.claude/agents/front-end-developer.md`, `CLAUDE.md`, the animator note;
`require-skill.test.mjs` 75/75.

### Animator kit lessons `0e9f43b`

`agents/animator/knowledge/working-rules.md`: illustration art is tuned by
craft (design.md Motion is for primitives); art that depicts the live UI
copies its styling and words. `agents/animator/skills/INDEX.md`: a final
`emil-design-eng` polish pass on every build and a polish-skills table.

### ux-laws: a plan-locked card's upgrade may sit in its own footer `37e5e2b`

`.claude/rules/ux-laws.md` and `agents/front-end-developer/skills/ux-laws/SKILL.md`
section 3. Before: the 2026-10-07 correction kept every plan action out of a
card footer. After: one exception, a read-only, plan-locked settings card's
upgrade is that card's own action and sits in its own footer, where Save sits
on the editable tiers (Data retention on Free). A promo banner for one locked
setting is named the wrong surface.
