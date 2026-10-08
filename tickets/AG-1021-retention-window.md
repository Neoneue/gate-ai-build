# Configurable data retention v1 (org setting, tiered)

Ticket [AG-1021](https://constellationnetwork.atlassian.net/browse/AG-1021), epic [AG-1018](https://constellationnetwork.atlassian.net/browse/AG-1018).
PRD: [Configurable data retention v1](https://app.notion.com/p/3eca94bd4b4f818aad7ec1372a5adde1)
(Notion, Horizon 2, status Draft, revised 2026-10-06). The
PRD is the spec; re-read it live before each chunk, since it is still a draft.

An organization owner or admin sets how long Gate keeps request logs, prompt
and response content, and Gate Chat history: one number of days, org-wide,
bounded by the plan. 0 days means content is never stored. Audit hashes,
proofs and Digital Evidence anchors are never deleted.

Tick an item only after the owner approves it on localhost. Each chunk is done
only when every box in it is ticked, including its verify box.

---

## Rules that apply to every chunk

- Free is fixed at 30 days (read-only). Pro: 0 to 90. Enterprise: 0 to a
  contract ceiling (default 90, same as Pro; set by Constellation, default 90;
  the mock uses 90, owner 2026-10-08: "use 90 for enterprise it's the
  default", over the 365 example in the PRD mockup and Jira AC). New orgs
  start at the ceiling.
- Metrics retention is separate from the window and fixed per tier: Free 90
  days, Pro 180, Enterprise 180 (live pricing page; PRD "What the window
  governs": "the 90-day and 180-day pricing-page figures stay tier-fixed in
  v1"). Nobody edits it on any tier. The window, the deletion run and a
  0-day window never touch metrics. Source of the numbers:
  `metricsRetentionDays(tier)` in `src/lib/retention.ts`.
- Only owners and admins see or change the setting. Members and team managers
  see the Messages statement only.
- The value in Settings and the window stated on Messages are always the same
  number, and the oldest-record date is the same on both.
- Every statement about deletion says audit anchors are kept, in the same
  sentence or the next one.
- No pricing, add-on or purchase language anywhere (pricing deferred
  2026-10-06).
- PRD mockups are examples: build to `design.md` and our primitives.
- UI work goes through `front-end-developer` under the UI gate (INDEX,
  ux-laws, written gate, visual-hierarchy, one build skill).
- Every number comes from real mock rows; no synthetic figures.

---

## Chunk 1: Settings card and shorten confirmation

Routes: `/settings` (Pro), `/settings-free`, `/settings-default` (Free),
`/settings-enterprise`. File: `src/pages/Settings.tsx` and its twins.

- [ ] Tier prop added to `Settings` and passed from every route and twin
      (`App.tsx`, `SettingsFree.tsx`, `SettingsDefault.tsx`)
- [ ] "Data retention" section between Security and Account management,
      above Erase stored data
- [ ] Section hidden for member and team-manager views (`useViewRole`)
- [ ] Window field in days, with ceiling and floor named
- [ ] Stat rows: oldest retained record, records in window, next run, last
      change
- [ ] Free: disabled field fixed at 30 days, no card footer; the shared Free
      plan banner below the card says briefly what Pro adds, with Upgrade to
      Pro (owner 2026-10-07: no per-plan list and no upgrade button in the
      card)
- [ ] Pro: a value above 90 shows an inline error naming the ceiling and the
      Enterprise path (no toast)
- [ ] Enterprise: ceiling note with a Contact support link, no purchase
      language
- [ ] Lengthening saves without a dialog and says deleted records are not
      restored
- [ ] Owner addition (2026-10-07, not in the PRD): Cancel (outline) shows
      next to Save only while an edit is unsaved, and restores the saved
      window
- [ ] Owner addition (2026-10-07): the plan limit (30 / 90 / 90 days) is
      emphasized in the description on every tier, and "Retention window"
      uses the card title style of the sibling Settings cards. Superseded
      2026-10-08: the field label is the plan name ("Free plan", "Pro plan",
      "Enterprise plan") and the helper under it is plain muted text, since
      the bold limit under the label "conflicts visually"
- [ ] Enterprise line makes clear the window is set here and only the
      contract ceiling goes through Contact support (owner 2026-10-07:
      "Contact support to change it" read as the window)
- [ ] Lengthen toast says deleted messages are not restored AND that their
      fingerprints are kept (PRD: every deletion statement names the anchors)
- [ ] 0 days: card says what it turns off (stored content, response cache,
      Gate Chat history) and that requests stay billed, listed and verifiable
- [ ] Owner addition (2026-10-08): metrics retention shown read-only,
      tier-fixed (Free 90, Pro and Enterprise 180), per PRD 'What the window
      governs'. Built as a fifth fact, "Usage metrics", the last cell of
      the fact grid, value from `metricsRetentionDays(tier)`. The note "Set
      by your plan, separate from the retention window." (draft, copywriter
      to confirm) is a tooltip on an Info icon after the label (owner
      2026-10-08), the Teams budget fact pattern. Not a control on any
      tier; no separate card
- [ ] Metrics fact stays at its tier value at 0 days, before and after Save,
      and the 0-day callout does not imply metrics are deleted
- [ ] Verify on localhost: Usage metrics reads 90 days on `/settings-free`
      and `/settings-default`, 180 days on `/settings` and
      `/settings-enterprise`, light and dark
- [ ] Shorten dialog: record count and cutoff date, run time, irreversible,
      raising later restores nothing
- [ ] Shorten dialog: audit hashes and anchors kept
- [ ] Shorten dialog: export paths (CSV from Messages; SIEM push on
      Enterprise only)
- [ ] Shorten dialog: destructive confirm, 24px above the footer buttons
- [ ] Count in the dialog equals the count the mock "run" would delete
- [ ] Verify: `npx tsc -b`, `ultracite check src`, `lint:design`, vitest
- [ ] Verify on localhost: Enterprise shorten flow, Pro value above 90, Free
      read-only, member view hides the section
- [ ] Owner checked on localhost

## Chunk 2: Messages retention statement

Routes: `/messages`, `/messages-default`, `/messages-free`,
`/messages-enterprise` (`Requests`, `RequestsDefault`, `RequestsFree`).

- [ ] One line above the table: window, oldest record date, anchors remain
      verifiable, link to the Settings card
- [ ] Same info style as the Billing page banner
- [ ] Window and oldest date read from the same source as the Settings card
- [ ] 0 days variant: "this organization does not retain content"
- [ ] Shown to every role that can open Messages
- [ ] Present on every Messages twin (run `verify-twins`)
- [ ] Decide with owner: does the table hide rows older than the window, or
      is the mock already inside it
- [ ] Verify: gates plus localhost on all four routes
- [ ] Owner checked on localhost

## Chunk 3: Gate Chat expiry marker

Routes: `/chat`, `/chat-free`, `/chat-default`, `/chat-enterprise` (and
`/:conversationId`). File: `src/pages/Chat.tsx`, `src/pages/chat/`.

- [ ] Marker in place of older messages, naming the window ("Earlier
      messages expired under your organization's N-day retention window")
- [ ] Never an empty conversation when history is gone
- [ ] 0 days variant: Chat says history is off
- [ ] Present on every Chat route
- [ ] Verify: gates plus localhost
- [ ] Owner checked on localhost

## Chunk 4: Existing copy that now contradicts the PRD

- [ ] `src/pages/cancel-plan-dialog.tsx:83`: downgrade now clamps after a
      3-day grace period with two reminder emails, not immediately
- [ ] `src/pages/Settings.tsx:441` (Cancel plan card): same correction
- [ ] Copy changes go through `triage-copy` before applying
- [ ] In-app plan copy matches the live pricing page (owner 2026-10-08: "we
      need to not be stale"; overrides the earlier "leave to AG-973" note
      for the in-app lists only):
  - [ ] Audit trail detail drops "(30 day retention)" (fingerprints are
        permanent, PRD): `src/data/plans.ts:153`,
        `plan-comparison-dialog.tsx:62`, `plan-comparison-dialog-pro.tsx:61`
  - [ ] Free list gains "Data retention: 30-day log retention, 90-day
        metrics retention" (plans.ts and both dialogs)
  - [ ] Pro list gains "Data retention: 90-day log retention, 180-day
        metrics retention" (plans.ts and both dialogs)
  - [ ] Enterprise retention row: owner picks keep or live-page wording
        ("Custom retention periods and volume pricing")
  - [ ] Dialog rows use the existing feature-row pattern and an icon from
        the same set (front-end-developer)
- [ ] Owner approved wording

## Chunk 5: Audit Trail touchpoint (confirm with owner first)

The PRD says window changes and deletion-run summaries go on the anchored
audit trail.

- [ ] Decide with owner: add mock "retention window changed" and "deletion
      run" records to Audit Trail, or leave for later
- [ ] If yes: records on every Audit Trail twin, numbers reconcile with
      Settings

## Chunk 6: Records and docs

- [ ] `data-model.md` updated (back up to `.bak` first): tier ceilings,
      retention fields, metrics retention per tier, which surfaces read them
- [ ] Changelog entry per UI change (`change-logs/`)
- [ ] Tests for the retention helper (ceiling per tier, eligible count,
      oldest date)
- [x] Tests for `metricsRetentionDays` (Free 90, Pro and Enterprise 180),
      `retention.test.ts`
- [ ] DRAFT decision recorded: type-to-confirm or not. (Enterprise mock
      ceiling settled 2026-10-08 by the owner: the 90-day default.)

---

## Out of scope here (owned elsewhere; listed so nothing is missed)

- Admin portal "Maximum retention (days)" override field (admin console)
- Scheduled clamp state in Settings (PRD P0: new ceiling and clamp date
  after a downgrade or lowered maximum; Jira AC: "A pending clamp shows its
  date in the card"). Built then removed 2026-10-08 (owner: "we'll need a
  way to show multiple states somehow"). Blocked on a way to demo more than
  one state per route; the product builds the clamp state from the PRD
- Deletion run, 0-day write path, response cache off (Gate Core, AG-984)
- Clamp reminder emails and send log (AG-508, AG-512, AG-823)
- Website pricing page and plans doc copy (AG-973, PRD owner). The in-app plan
  lists are in Chunk 4 (owner 2026-10-08)
- Admin API read (P1), SIEM push of run summaries (P1)
- Legal hold, per-key or per-team windows, automatic export (not in v1)

## Open questions in the PRD (watch for changes)

- Metrics retention: proposed to stay tier-fixed in v1 (PRD owner to settle).
  The PRD names no UI for it; the read-only Settings fact is an owner
  addition (2026-10-08). If the PRD changes to "follows the window", the
  fact and `metricsRetentionDays` change with it
- Training pool deletion: engineering to confirm
- Legal hold demand from sales
- API write access at launch
