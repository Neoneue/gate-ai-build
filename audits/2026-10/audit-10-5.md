# Audit - 2026-10-05

Read-only reviews by the `front-end-developer` agent. Checklist: tick an
item when it is applied and verified, then append the commit hash to the
item's first line. Pick items by ID ("ux-3, ux-17"). Paths are relative
to `src/`. Already decided, not re-flagged: see the settled table in
`.claude/skills/ui-audit/SKILL.md`.

The `ux-laws` run is split one section per law or corrected pattern that
found something (`## ux-laws: <Law>`), sections ordered by worst severity,
pages under each. Laws that found nothing are listed once under Compliant.
Part 1 holds the sections with a HIGH (ux-1 to ux-56) and the run notes;
the MEDIUM / LOW-only sections (ux-59 to ux-96) are in
[`audit-10-5-2.md`](./audit-10-5-2.md). IDs ux-14, ux-57, ux-58 and ux-77
to ux-81 were removed (user, 2026-10-05): unwired mockup controls, not
design findings. Remaining IDs keep their numbers.

## Summary

- Why: baseline for the new `ux-laws` skill (31 laws plus 7 corrected patterns), first run over the whole site.
- Tested: ux-laws, whole site: app shell, shared primitives and every route with its Free / Default / Pro / Enterprise twins; six review agents (shell on Opus, five page sets on Sonnet), code only, no browser.
- Found: 88 items, 6 HIGH / 48 MEDIUM / 34 LOW across 16 laws and patterns (104 reviewer items, 8 folded as cross-reviewer duplicates, 8 unwired mockup controls removed); 0 applied, 0 skipped, 88 open.
- Opinion: Qualified. Worst open: ux-17 Notifications shows the admin-only org section to every role; ux-23 Models column sorts reorder only the current page.
- Next: user confirms severities and picks items; 10 Decision needed lines (user); copy items go through `triage-copy` before applying.

## Runs

| # | Time (CT) | Skill | Scope | Items | Applied | File |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 22:02 | ux-laws | whole site: layouts, shared primitives, every route twin (six agents) | ux-1 to ux-96 (8 removed) | 0/88 | ux-1 to ux-56 here, ux-59 to ux-96 in audit-10-5-2.md |

## ux-laws: Mental Model

### Global

- [ ] **ux-1 MEDIUM** `mental-model` components/ui/sidebar.tsx:219, components/ui/sidebar.tsx:372
  - Before: `target="_blank"`
  - After: render the `newTab` row as `<Link to={item.pageId}>` with the sibling recipe (mirror components/ui/sidebar.tsx:379-387 expanded, :226-234 collapsed)
  - Why: Gate Chat is styled exactly like every in-app nav row but opens a new tab, so the click breaks Back and the in-place move the row predicts, with no cue on the row (grep: `target="_blank"` at sidebar.tsx:219 and :372).
- [ ] **ux-2 MEDIUM** `mental-model` pages/Dashboard.tsx:826, pages/security/EventsTable.tsx:740
  - Before: `/conversations?open=${row.conversationId}` (Overview "Latest conversations" row) and `` navigate(`/conversations?open=${conversationId}`) `` (Security event Conversation link)
  - After: `` withTierOf(pathname, `/conversations-trace/${id}`) `` for both, mirror pages/Conversations.tsx:480-481
  - Why: both entries open the `?open=` dialog over the Conversations list (EventsTable also drops the tier suffix) while every Conversations row opens the trace page, so one entity has two detail surfaces and detail surfaces are pages (grep: 2 hits for `/conversations?open=`).
- [ ] **ux-3 MEDIUM** `mental-model` pages/RequestsFindings.tsx:67, pages/conversations/ConversationDetail.tsx:417, pages/conversations/ConversationDetail.tsx:496, pages/conversations/ConversationDetail.tsx:575, pages/cancel-plan-dialog.tsx:137
  - Before: `<ExternalLink aria-hidden data-icon="inline-end" />` (and `<ExternalLinkIcon ... />` on the `Cancel plan` confirm)
  - After: `<ArrowRight aria-hidden data-icon="inline-end" />` on the in-app drill-ins (mirror pages/onboarding-shared.tsx:114); no icon on `Cancel plan`, matching `Keep plan`
  - Why: the glyph says "opens elsewhere" but every one of these does a same-tab `navigate` or an in-place confirm, so a normal drill-in and a destructive step both promise a new tab (grep: `<ExternalLink` 4 hits, `ExternalLinkIcon` 1 render in cancel-plan-dialog.tsx).
- [ ] **ux-4 MEDIUM** `mental-model` pages/Activity.tsx:280, pages/requests/hero-data.ts:361, pages/requests/HeroMetric.tsx:81
  - Before: `all: "All time",` and `deltaNote: "All time",` beside a `+24.8%` / `+18.2%` delta
  - After: no delta when the range is All: `delta={scope.scoped || range === "all" ? undefined : k.spend.delta}` on the three `CompactKpi` (Activity.tsx:308, :324, :340) and the same guard in HeroMetric.tsx:81
  - Why: All is the landing range on Activity and Messages, and its delta tag reads "+24.8% All time", a change figure with no prior period, so the first number a user sees cannot be interpreted (grep: `"All time"` 2 hits, default range "all" at Requests.tsx:34).
- [ ] **ux-5 MEDIUM** `mental-model` pages/teams/dialogs.tsx:978, pages/Team.tsx:402
  - Before: `Remove member` (the confirm label in both dialogs)
  - After: dialogs.tsx:978 reads `Remove from team` (words from its title at dialogs.tsx:959); Team.tsx:402 keeps `Remove member`
  - Why: the Members page revokes workspace access while the team dialog only moves the person to the default team, yet both confirm with one label, so the lower-stakes action cannot be told from the higher-stakes one at the click (grep: `Remove member` at Team.tsx:402 and dialogs.tsx:978).
- [ ] **ux-6 MEDIUM** `mental-model` pages/cancel-plan-dialog.tsx:121, pages/cancel-plan-dialog.tsx:136, data/plans.ts:323
  - Before: `<AlertDialogTitle>Cancel your plan?</AlertDialogTitle>`
  - After: `CancelPlanDialog` takes `title` and `confirmLabel`; the Manage subscription entry passes `Downgrade to Free?` / `Downgrade to Free`, Settings keeps `Cancel your plan?` / `Cancel plan`
  - Why: the button says Downgrade to Free, the dialog asks "Cancel your plan?", confirms with "Cancel plan" and toasts "Plan cancellation scheduled", three verbs for one move to Free, so the user cannot predict the outcome (grep: `Downgrade to Free` at plans.ts:323, `Cancel your plan?` at cancel-plan-dialog.tsx:121).
- [ ] **ux-7 LOW** `mental-model` components/ui/ask-ai-composer.tsx:140
  - Before: `className={hasText || isBusy ? "opacity-100" : "opacity-50"}`
  - After: `disabled={!(hasText || isBusy)}` (the primitive's `disabled:opacity-50` draws the same fade)
  - Why: the empty send key is faded to look disabled yet stays a live, focusable target whose click does nothing, so look and behavior disagree (grep: 1 hit in ask-ai-composer.tsx).
- [ ] **ux-8 LOW** `mental-model` components/ui/multi-select.tsx:213, components/ui/multi-select.tsx:174
  - Before: `publish(options.map((o) => o.value));`
  - After: `publish([...new Set([...selection, ...filteredOptions.map((o) => o.value)])]);` with `allSelected` tested over `filteredOptions`
  - Why: with `searchable` on, "(Select All)" ticks options the search has hidden, where users expect it to act on the visible rows; no page pairs the two today (grep: the one searchable site, teams/dialogs.tsx:747, sets `selectAll={false}`).

### Activity

- [ ] **ux-9 LOW** `mental-model` pages/Activity.tsx:806, pages/ActivityDefault.tsx:106
  - Before: `<SectionTitle>Recent key usage</SectionTitle>`
  - After: `<SectionTitle>Key usage</SectionTitle>`
  - Why: the section is every key's totals for the selected range in authored order, not a latest-first feed, and the page lands on All, so "Recent" promises an order the table does not deliver (grep: `Recent key usage` 2 hits).

### Messages

- [ ] **ux-10 MEDIUM** `mental-model` pages/requests/RequestsTable.tsx:471, pages/requests/RequestsTable.tsx:494
  - Before: `Response` and `Guardrail` (filter labels, aria-labels, `All responses` / `All guardrails`)
  - After: `Status` and `Security` as labels and aria-labels, items `All status` and `All security`, the words the column heads use
  - Why: the columns are Status and Security but their filters are Response and Guardrail, so a user looking from the head to the filter finds no matching name (grep: `Status` head at RequestsTable.tsx:688 vs `Response` at :471, `Security` at :696 vs `Guardrail` at :494).
- [ ] **ux-11 MEDIUM** `mental-model` pages/requests/RequestsTable.tsx:488
  - Before: `<SelectItem value="slow">{"Slow > 10s"}</SelectItem>`
  - After: `<SelectItem value="slow">Slow</SelectItem>`, the word the Latency marker already uses
  - Why: the option matches `row.slow === true`, and 62 of the 122 slow rows are 10s or under (first is 3.98s), so the label promises a threshold the filter never applies (grep: 122 `slow: true` rows in data/requests.ts, 62 with latency at or under 10s).
- [ ] **ux-12 MEDIUM** `mental-model` pages/requests/RequestsTable.tsx:556
  - Before: `title="No messages"` with `body="Individual messages routed through the gateway will appear here."` under `isEmpty`
  - After: when `query` is set or `activeFilterCount > 0`, render the no-match state worded like Activity.tsx:861-862 with its noun swapped; else the current state
  - Why: `isEmpty` is also true for a search or filter with no match, and the card then says messages "will appear here", which reads as no traffic yet and hides the cause; Activity separates the two (grep: `No keys match` at Activity.tsx:862, one `isEmpty ?` branch at RequestsTable.tsx:556).
- [ ] **ux-13 LOW** `mental-model` pages/requests/RequestDetailBody.tsx:973
  - Before: `` `Lines ${offset}-${offset + match.length} (${match.length} chars)` ``
  - After: `` `Chars ${offset}-${offset + match.length}` ``
  - Why: the value is a character offset from `indexOf`, labelled "Lines", and the parenthetical repeats end minus start, so a reader hunts for line numbers and reads one figure twice (grep: 1 hit at RequestDetailBody.tsx:973).

### Security events

- [ ] **ux-15 MEDIUM** `mental-model` pages/security/EventsTable.tsx:319
  - Before: `placeholder="Search events…"`
  - After: `placeholder="Search by key…"`, the Key column's own label
  - Why: the field says it searches events but the filter tests only the key name, so a type, conversation id or request id returns an empty table (grep: `r.key.toLowerCase().includes(q)` at EventsTable.tsx:265 is the only test).

### Audit trail

- [ ] **ux-16 MEDIUM** `mental-model` pages/AuditRecordDialog.tsx:131
  - Before: `{truncateHex(row.anchor, 4, 4)}` in the Fingerprint DetailRow
  - After: `<span className="type-mono-14 break-all text-foreground">{row.anchor}</span>`, as the Event ID row does at :101
  - Why: the table says full values appear in the record, yet the record cuts the fingerprint to 4 plus 4 characters, so the one value a user would verify is unusable (grep: `truncateHex(row.anchor, 4, 4)` at AuditTrail.tsx:662 and AuditRecordDialog.tsx:131).

### Notifications

- [ ] **ux-17 HIGH** `mental-model` pages/Notifications.tsx:448
  - Before: `{showOrgSection ? (` with no role read, under `As an org admin you receive these for the whole organization`
  - After: `const isAdmin = useViewRole() === "admin";` in NotificationsSurface, then `{showOrgSection && isAdmin ? (`, as Settings.tsx:90 and Limits.tsx:99 do
  - Why: the Organization section is admin-only by its own copy and the catalog header, yet the page never reads Viewing as, so Manager and Member views see and toggle org-wide types addressed to an admin (grep: `useViewRole` 0 hits in Notifications.tsx; "Org-level catalog (admin only)" in data/notification-catalog.ts).

### Teams

- [ ] **ux-18 LOW** `mental-model` pages/TeamsEnterprise.tsx:625, pages/TeamsEnterprise.tsx:738, pages/TeamsEnterprise.tsx:742
  - Before: `<TeamRowActions onDelete={onDelete} onRename={onRename} row={row} />`
  - After: `{row.isDefault ? null : <TeamRowActions onDelete={onDelete} onRename={onRename} row={row} />}`, mirror TeamDetailEnterprise.tsx, which already hides the action on the Default team
  - Why: the Default team's kebab opens a menu whose two items are both disabled, so the control promises actions and delivers a dead end (grep: `disabled={row.isDefault}` at TeamsEnterprise.tsx:738 and :742).

### Billing

- [ ] **ux-19 MEDIUM** `mental-model` pages/BillingFree.tsx:786
  - Before: `Charged for subscription renewals and credit top-ups.`
  - After: `Charged for credit top-ups.` (mirror BillingEnterprise.tsx:114)
  - Why: the Free plan card says nothing renews and shows "No renewal", and the card under it says it pays subscription renewals, so one screen makes two claims about one fact (grep: the sentence at BillingFree.tsx:786 and the Pro default at PaymentMethodCard.tsx:26).
- [ ] **ux-20 MEDIUM** `mental-model` data/plans.ts:372, pages/ManageSubscription.tsx:371
  - Before: `ctaCaption: PRO_CAPTION,` (`"$20/user/month after your 14-day trial ends"`)
  - After: `ctaCaption: "",` on the `tier === "pro"` card at plans.ts:372 only, and render the caption `<p>` only when `plan.ctaCaption` is non-empty
  - Why: a paying Pro org's current-plan card claims a trial the org is not in while its Billing page shows Renews on and Next invoice (grep: `PRO_CAPTION` at plans.ts:235, :356, :372; `trial` 0 hits in Billing.tsx).
- [ ] **ux-21 MEDIUM** `mental-model` pages/BillingEnterprise.tsx:378, data/plans.ts:408
  - Before: `Want to add or remove seats, or change your plan?`
  - After: at plans.ts:408 `actions: [CURRENT_PLAN_ACTION, SUPPORT_ACTION()],` so Contact support sits on the Enterprise card of an Enterprise org
  - Why: the footer's seat question sends the user to a ladder whose Enterprise card offers no support action, while Contact support sits under Free and Pro, so the question has no answer where it points (grep: `SUPPORT_ACTION()` at plans.ts:329 and :384 only).
- [ ] **ux-22 LOW** `mental-model` pages/Upgrade.tsx:198, pages/Upgrade.tsx:192
  - Before: `<PageTitle>Limits & quotas</PageTitle>` with `activeNavId="limits"`
  - After: `<PageTitle>Compare plans</PageTitle>` with `activeNavId="billing"`; drop the caps subtitle (:199-202) and the duplicate h2 (:206-211)
  - Why: /upgrade is titled Limits & quotas and lights Limits but its only content is a Free versus Pro comparison, so a deep link lands on a page whose title contradicts its body (grep: `Limits & quotas` at Upgrade.tsx:198, `activeNavId="limits"` at :192).

### Models

- [ ] **ux-23 HIGH** `mental-model` pages/Models.tsx:438, pages/Models.tsx:611
  - Before: `<ModelsTable onSelect={selectPaid} rows={pageRows} />`
  - After: call `useTableSort()` in `ModelsSurface`, sort `rows` with `sortRows` before slicing into `pageRows`, pass `sort` and `toggleSort` down; mirror billing/HistorySection.tsx:222-237
  - Why: the column heads sort only the 25 rows already sliced for the page, so Input ascending shows page one's cheapest, not the catalog's, and disagrees with the toolbar's Cheapest input (grep: `pageRows` sliced at Models.tsx:309, passed at :438, sorted inside at :611).

### Token savings

- [ ] **ux-24 MEDIUM** `mental-model` pages/token-savings-summary.ts:482, pages/token-savings/SummaryCard.tsx:334, pages/TokenSavingsDefault.tsx:79
  - Before: `body: "There are no savings to report. Try a longer range.",`
  - After: `SummaryCard` takes an optional `noTrafficBody`; `TokenSavingsDefault` passes `There are no savings to report.`
  - Why: the Default twin has no range control, yet its Summary tells the user to try a longer range, so the copy names a control this twin does not render (grep: `Try a longer range` 1 hit, rendered unconditionally at SummaryCard.tsx:334).
- [ ] **ux-25 LOW** `mental-model` pages/TokenSavings.tsx:320, pages/teams/TokenSavingsPane.tsx:387
  - Before: `toast.success("TTL saved");`
  - After: `disabled={!enabled}` on the TTL `Select` at TokenSavings.tsx:317 and `disabled={locked || !enabled}` at TokenSavingsPane.tsx:384
  - Why: TTL stays editable and answers "TTL saved" while caching is off, whereas Auto-recharge disables its dependent fields when off, so two settings surfaces disagree on what an off switch means (grep: `disabled={!enabled}` 3 hits in billing/CreditsCard.tsx).

### Chat

- [ ] **ux-26 LOW** `mental-model` pages/Chat.tsx:317
  - Before: `onClick={() => navigate(pathname, { replace: true })}` on `Retry` under "This conversation couldn’t be loaded."
  - After: `<Button nativeButton={false} render={<Link to={chatHomePath(pathname)} />} size="sm" variant="outline">` labelled `{CHAT_COPY.newChat}`
  - Why: Retry re-renders the same id, which the comment at :314 admits stays unloadable, so the one control on a dead conversation promises a recovery it cannot deliver (grep: same-pathname navigate at Chat.tsx:317).

### Setup

- [ ] **ux-27 MEDIUM** `mental-model` pages/SetupManual.tsx:126
  - Before: `<CopyButton label="API key" mode="label" size="sm" text="Copy" value={maskedKey} />`
  - After: delete the CopyButton (:121-127); the "API key created" strip keeps the masked key as plain text
  - Why: Copy puts a masked, unusable `sk-gw-…1a2b` on the clipboard, and pasting it into the config step yields an invalid key (grep: `value={maskedKey}` at SetupManual.tsx:126).
- [ ] **ux-28 LOW** `mental-model` pages/SetupGateConnect.tsx:47
  - Before: `description="Menu-bar app for Mac and Windows."`
  - After: `description="Menu-bar app for Mac, Windows, and Linux."`
  - Why: the step names two platforms, then its own Download dialog offers three, so the label contradicts the behavior one click later (grep: `PlatformId = "mac" | "windows" | "linux"` at DashboardDefault.tsx:194).

### Sign in / up

- [ ] **ux-29 LOW** `mental-model` pages/SignUp.tsx:44
  - Before: first `<Field>` is `Work email` (:44-57), second is `Invite code` (:59-73), under the title `Enter your invite code`
  - After: swap the two `<Field>` blocks so `Invite code` comes first
  - Why: the title names the code but the first thing asked is an email, so the page's stated job and its first field disagree (grep: `Enter your invite code` at SignUp.tsx:34, `Work email` at :46).

### Settings

- [ ] **ux-30 MEDIUM** `mental-model` pages/Settings.tsx:411, pages/Settings.tsx:331, pages/Settings.tsx:384, pages/Settings.tsx:433, pages/Settings.tsx:439
  - Before: card `Delete this organization` and button `Delete organization` (:393, :405) against dialog `Delete account and data?`, `Keep account`, phrase `Delete my account`, toast `Account deletion scheduled`
  - After: one noun end to end, organization form: `Delete organization?`, `Keep organization`, `Delete organization`, `DELETE_CONFIRM_PHRASE = "Delete my organization"`, toast `Organization deletion scheduled`
  - Why: the trigger says organization and the confirm step says account, so on the most destructive flow the user cannot tell which object the typed phrase erases (grep: account wording at Settings.tsx:331, :384, :411, :433, :439 vs organization at :393, :405).
- [ ] **ux-31 MEDIUM** `mental-model` pages/Settings.tsx:138
  - Before: `Profile, security, logging, and integrations`
  - After: `Profile, security, and account management`
  - Why: the subtitle lists logging and integrations, which the page does not have, so its own promise sends users hunting elsewhere (grep: `logging` and `integrations` 1 hit each, the subtitle at Settings.tsx:138).

### Limits

- [ ] **ux-32 LOW** `mental-model` pages/Limits.tsx:165, pages/LimitsFree.tsx:137
  - Before: `Cap spend, tokens, or requests for the whole org, a team, or a single`
  - After: `Cap spend, tokens, or requests for the whole org or a single`
  - Why: the intro offers a team scope but Create limit lists only Org-wide and keys, so the sentence promises a control the form lacks (grep: `LIMIT_SCOPES` at Limits.tsx:486-490 has no team entry).

## ux-laws: Similarity

### Global

- [ ] **ux-33 HIGH** `similarity` pages/TokenSavings.tsx:572, pages/Policies.tsx:149, pages/Policies.tsx:443, pages/plan-comparison-dialog.tsx:242
  - Before: `onClick={() => setCompareOpen(true)}`
  - After: mirror pro-upgrade-card.tsx:23-31: `<Button nativeButton={false} render={<Link to={withTierOf(pathname, "/billing/plans")} />} size="sm" variant="promo">`, drop the `PlanComparisonDialog` mount and `compareOpen` state
  - Why: Free and Default "Upgrade to Pro" on Token savings and Policies still opens the two-rung comparison dialog that the `/billing/plans` page replaced on 2026-09-22 (ManageSubscription.tsx:55-60), so one CTA has three behaviors and two ladders that drift; twin of ux-52 (grep: `setCompareOpen(true)` 3 hits).
- [ ] **ux-34 MEDIUM** `similarity` components/ui/alert-dialog.tsx:118
  - Before: `font-heading font-medium text-base sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2`
  - After: `type-heading-20 sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2` (mirror components/ui/dialog.tsx:348)
  - Why: AlertDialog titles render at 16px while every Dialog title is 20px, so delete-account, cancel-plan and delete-chat confirms read one rung below every other dialog title (design.md:897).
- [ ] **ux-35 MEDIUM** `similarity` components/ui/view-role-switch.tsx:38
  - Before: `<SelectTrigger aria-label="Viewing as" className={className} size="sm">`
  - After: `<SelectTrigger aria-label="Viewing as" className={className}>` (default 36px, matching the workspace switcher)
  - Why: the two scope pickers sit side by side at 32px / 12px and 36px / 14px, so one control group reads as two kinds of control (grep: `size="default"` at workspace-switcher.tsx:53).
- [ ] **ux-36 LOW** `similarity` components/ui/date-range-picker.tsx:340
  - Before: `<Button onClick={handleCancel} size="sm" variant="ghost">`
  - After: `<Button onClick={handleCancel} size="sm" variant="outline">` (mirror components/ui/multi-select.tsx:352-357)
  - Why: Cancel is ghost here but outline in MultiSelect and every dialog footer, so the same secondary action looks different per picker (design.md:1352).
- [ ] **ux-37 LOW** `similarity` components/ui/segmented.tsx:172
  - Before: `"absolute top-0 left-0 rounded-xs bg-card shadow-xs"`
  - After: `"absolute top-0 left-0 rounded-xs border border-border-active bg-popover shadow-xs"` (mirror components/ui/segmented-pill.tsx:86)
  - Why: Segmented and SegmentedPill draw the same sliding thumb two ways, so the bell's Unread / All filter and the page pill selectors read as different controls (design.md:812).

### Overview

- [ ] **ux-38 MEDIUM** `similarity` pages/Dashboard.tsx:789
  - Before: `{row.slow ? "slow" : row.status}`
  - After: mirror pages/requests/RequestsTable.tsx:878-880: `<Badge variant={responseVariant(row)}>{responseLabel(row)}</Badge>`
  - Why: the Overview preview shows a warning "slow" badge where Messages shows Success for the same row (slow lives on the Latency cell, data.ts:84), so one message changes status one click later (grep: `row.slow` 2 hits in Dashboard.tsx:782 and :789).

### Messages

- [ ] **ux-39 LOW** `similarity` pages/requests/RequestsTable.tsx:838
  - Before: `className="cursor-pointer transition-[background-color] duration-150 ease-out motion-reduce:transition-none"` on a `TableRow` with `onClick={() => openRow(row)}`
  - After: `<NavTableRow key={requestRowId(row)} onActivate={() => openRow(row)}>`, mirror pages/Dashboard.tsx:750-757
  - Why: the busiest drill-in list hand-builds what `NavTableRow` is and lacks its press fill, so Overview rows of the same entity give press feedback and Messages rows do not (grep: `NavTableRow` 7 hits in Dashboard.tsx, 0 in RequestsTable.tsx).

### Conversations

- [ ] **ux-40 MEDIUM** `similarity` pages/conversations/ConversationDetail.tsx:442, pages/conversations/ConversationDetail.tsx:342
  - Before: the Findings only tab renders both panels unconditionally while Errors guards `errorCount === 0` at :518, and the Findings badge hides at zero (`findingCount > 0 &&`)
  - After: mirror :518-521 with a `findingCount === 0` empty line, and render the Findings badge unconditionally like :348-352
  - Why: peer tabs handle empty differently, so a conversation with no findings opens to a blank panel while Errors explains itself (grep: `errorCount === 0` 1 hit, `findingCount === 0` 0 hits).

### Security events

- [ ] **ux-41 MEDIUM** `similarity` pages/security/EventsTable.tsx:121
  - Before: `invalid: "warning",`
  - After: `invalid: "outline",`
  - Why: Invalid, a dismissed false positive, wears the same amber as flagged in the adjacent Action column, so a resolved row looks as alarming as a live one (grep: `invalid: "warning"` at EventsTable.tsx:121).
- [ ] **ux-42 LOW** `similarity` pages/Security.tsx:225, pages/security/events-data.ts:492
  - Before: `stroke="var(--color-neutral-400)"` on the redacted tooltip series (and `color: "var(--color-neutral-400)"` in the chart config)
  - After: `var(--color-warning-500)` in both, matching the Action types bar at Security.tsx:371-374
  - Why: the tooltip dots Redacted grey while the bar and the table badge show it amber, so one category has two colors on one page (grep: `neutral-400` 1 hit in each file).

### Members

- [ ] **ux-43 LOW** `similarity` pages/Team.tsx:342, pages/Team.tsx:613, pages/TeamDetailEnterprise.tsx:1643
  - Before: `<TableHead className="w-[10%] whitespace-nowrap pr-4 pl-0 text-right">` (a visible Actions header, columns Member, Joined, Role)
  - After: order Member, Role, Joined and use `<TableHead aria-label="Actions" className="w-12" />`, mirror TeamDetailEnterprise.tsx:1634-1643
  - Why: the same roster is two different tables, so the Role control sits in a different column per surface (grep: `aria-label="Actions"` at TeamDetailEnterprise.tsx:1643, visible header at Team.tsx:342 and :613).

### Setup

- [ ] **ux-44 LOW** `similarity` pages/SetupManual.tsx:352
  - Before: `border-success-600 bg-success-50 text-success-700` on every `StepHeading` badge, unconditional
  - After: mirror SetupGateConnect.tsx:150-160: `StepHeading` takes `active` and uses `border-border text-muted-foreground` until its step is reached
  - Why: Gate Connect greys steps not yet reached while Manual paints all four green from first paint, so one step marker means two things inside one onboarding (grep: `border-success-600` at SetupManual.tsx:352 unconditional, SetupGateConnect.tsx:155 conditional).

### Limits

- [ ] **ux-45 LOW** `similarity` pages/LimitsFree.tsx:276, pages/LimitsFree.tsx:279
  - Before: `<TableCell className="type-mono-14 whitespace-nowrap text-foreground">` for Threshold and Used under `numeric` heads
  - After: add `text-right` to both, mirror Limits.tsx:370 and :373
  - Why: the heads are right-aligned while the figures sit left, so the Free twin's columns read offset and differ from Pro for the same data (grep: `text-right` present on the Limits.tsx cells, absent at LimitsFree.tsx:276, :279).

## ux-laws: One primary action

### Global

- [ ] **ux-46 HIGH** `one-primary` components/ui/pagination.tsx:58
  - Before: `"border-primary bg-primary font-medium text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary",`
  - After: `"border-border bg-accent font-medium text-accent-foreground hover:bg-accent hover:text-accent-foreground",` (the selected-state fill, mirror components/ui/sidebar.tsx:263)
  - Why: the current page number wears the neutral-900 primary-action fill in every table footer, so a state indicator competes with the page's one primary button, while every other current state uses `bg-accent` (design.md:1352).
- [ ] **ux-47 MEDIUM** `one-primary` pages/SetupConnect.tsx:34, pages/DashboardDefault.tsx:560
  - Before: `ctaVariant="default"` on both ChoiceCards (SetupConnect.tsx:25 and :34, DashboardDefault.tsx:537 and :560)
  - After: delete `ctaVariant="default"` on the second card in each file so it takes the ChoiceCard default `outline`
  - Why: two equal filled CTAs side by side give a new workspace no recommended path, while ChoiceCard defaults to outline and onboarding-shared.tsx:19-21 names one primary path (grep: `ctaVariant="default"` 4 hits, 2 per file).

### API keys

- [ ] **ux-48 MEDIUM** `one-primary` pages/ApiKeys.tsx:223, pages/DashboardDefault.tsx:371
  - Before: `<Button disabled={disabled} onClick={onClick} size={size}>` (Create key) and `<Button size="default">` (Download Gate Connect)
  - After: a `variant` pass-through on DownloadGateConnectDialog so UsageInfo renders `variant="outline"`; the Overview hero keeps default
  - Why: the header and the Automatic card each show a filled black button on one screen, so a page whose job is keys has no single next step (grep: both Buttons default variant, Download mounted via ConnectTabs at ApiKeys.tsx:364).

### Team detail

- [ ] **ux-49 MEDIUM** `one-primary` pages/TeamDetailEnterprise.tsx:1610, pages/TeamDetailEnterprise.tsx:1594
  - Before: `<Button onClick={() => setAddOpen(true)} size="default">`
  - After: `<Button onClick={() => setAddOpen(true)} size="sm" variant="outline">`, mirror the empty-state CTA at Team.tsx:552-557
  - Why: every newly created team shows the toolbar Add member and an empty-state Add member, both filled, so one action carries two primaries in one view (grep: `setAddOpen(true)` at :1594 and :1610, both default).

### Billing

- [ ] **ux-50 MEDIUM** `one-primary` pages/BillingFree.tsx:802, pages/billing/PaymentMethodCard.tsx:71
  - Before: `<Button className="ml-auto shrink-0" size="sm">`
  - After: `<Button className="ml-auto shrink-0" size="sm" variant="outline">`, mirror `Update card` at PaymentMethodCard.tsx:80, so `Add credits` is the one fill
  - Why: Free, Default and card-less Enterprise show a filled Add card beside a filled Add credits, so neither leads while Add credits is the common task (grep: 2 hits).

### Chat

- [ ] **ux-51 LOW** `one-primary` pages/chat/chat-sidebar.tsx:156, pages/chat/chat-sidebar.tsx:201
  - Before: `onClick={onNewChat}` on a default-variant `Button`
  - After: `variant="outline"` on both New chat buttons; Send stays the one solid primary
  - Why: once a draft is typed the view shows two solid primaries, New chat in the rail and Send in the composer, so the real action loses emphasis (grep: `onClick={onNewChat}` 2 hits, no variant).

### Policies

- [ ] **ux-52 MEDIUM** `one-primary` pages/Policies.tsx:446, pages/Policies.tsx:152
  - Before: `variant="promo"` on `Upgrade to Pro` in the Free banner and again in `ProBenefitsCard`
  - After: `variant="outline"` on the in-card Button (:446); the banner stays the one promo
  - Why: Free and Default get two same-label promo CTAs on one page, so the upsell is said and styled twice; twin of ux-33 (grep: `variant="promo"` at Policies.tsx:152 and :446).

## ux-laws: Collapsible row

### Global

- [ ] **ux-53 HIGH** `collapsible-row` pages/Policies.tsx:337, pages/teams/PoliciesPane.tsx:193
  - Before: `aria-expanded={expanded}` on the `IconActionButton` chevron; the header row (icon, title, `StatusBadge`) is inert
  - After: make the header one full-width `<button type="button" aria-expanded={expanded}>` inside the heading, `w-full text-left hover:bg-accent-muted`, chevron at the right edge; delete the `IconActionButton`, same in both files
  - Why: only the 24px chevron opens a policy card, so the title users read is not what they must aim at, against the full-width section-row pattern; reaches Policies on every tier plus both Teams Settings tabs (grep: `aria-expanded={expanded}` at Policies.tsx:338 and PoliciesPane.tsx:194, both on the IconActionButton).

### Billing

- [ ] **ux-54 MEDIUM** `collapsible-row` pages/billing/HistorySection.tsx:150, pages/billing/HistorySection.tsx:156
  - Before: `onClick={() => setExpanded((v) => !v)}` on the chevron only, row `className="hover:bg-transparent"`
  - After: the grouped-day `TableRow` carries the `onClick` and `cursor-pointer` and drops `hover:bg-transparent`; the chevron stays for the keyboard, mirror Models.tsx:678-682
  - Why: a grouped "Gateway messages (N)" day expands only from the small chevron and its row has the hover fill removed, so the row looks inert (grep: 1 hit of the toggle, on the IconActionButton).

## ux-laws: Working Memory

### Global

- [ ] **ux-55 HIGH** `working-memory` pages/requests/RequestsTable.tsx:374, pages/security/EventsTable.tsx:339, pages/AuditTrail.tsx:430
  - Before: `onClick={openFilters}` opening a staged-draft filters `Dialog` (open, pick, Apply)
  - After: inline filter controls that show their own value, mirror pages/Conversations.tsx:596-628 (MultiSelect and `DateRangePicker size="sm"` on Audit trail), and delete the staged-draft dialogs
  - Why: the filters live in a modal that covers the table being filtered and afterwards only a count badge remains, so triage (show flagged or blocked) costs four steps and relies on recall (grep: `onClick={openFilters}` 3 hits; RequestsTable.tsx:361-366 records the modal as a reversible PROTOTYPE).

### Teams

- [ ] **ux-56 LOW** `working-memory` pages/TeamDetailEnterprise.tsx:292, pages/TeamsEnterprise.tsx:183
  - Before: `{teamRole ? null : <BackLink href={listPath} label="Teams" />}`
  - After: `<BackLink href={archived ? listPath + "?tab=archived" : listPath} label="Teams" />` and seed `listTab` from `useSearchParams().get("tab")`
  - Why: a row opened from Archived returns to the bare list, and the tab is local state, so Back lands on Current teams and the user must find Archived again (grep: `useState` for `listTab` at TeamsEnterprise.tsx:183).

## ux-laws: run notes

### Decision needed

- ux-55: the filters modal is a recorded, reversible PROTOTYPE (RequestsTable.tsx:361-366); keep it or go inline (user, open).
- ux-47: which onboarding path leads; the item demotes the second card in each pair (user, open).
- ux-92: auto-reload default; off unless the PRD fixes default-on (user, open).
- ux-32: Limits intro names a team scope the form lacks: cut the words, or add a team scope on Enterprise (user, open).
- ux-17: confirm the Notifications PRD makes the org section admin-only (user, open).
- ux-59: the org Token savings page uses the same badge plus switch pairing, so it may be settled (user, open).
- ux-56: adds `?tab=` to the deep-link contract in data-model.md (user, open).
- design.md conflicts raised once, not filed: Feedback FAB `variant="promo"` (feedback-fab.tsx:112, design.md:1343) vs promo for upgrade CTAs only (design.md:1345); Sign out red at rest (user-menu.tsx:72, design.md:421) vs quiet-destructive; hover fill on every `TableRow` (table.tsx:152) vs fill means "opens something"; `PanelHeading` at `type-label-14` (RequestDetailBody.tsx:644, design.md:1789) shares its items' tier; Team overview header and its blocks all `type-heading-24` (TeamDetailEnterprise.tsx:521, :593, design.md:895); `CopyButton size="inline-xs"` 20x20 (copy-button.tsx:49) has no design.md entry under the 24px floor (user, open).
- Not filed, each needs a new element or an owner call: collapsed-rail icons have no hover label; bell "Archive all" has no undo; Default twins of Conversations, Security and Audit trail name no next step when empty; Mark false positive has no undo; Free Token savings upsell headline may overstate (TokenSavings.tsx:396-397) (user, open).
- Copy changes (ux-5, 6, 9, 10, 11, 12, 13, 15, 19, 22, 24, 28, 30, 31, 32, 62, 65, 68) run through `triage-copy` before applying (user, open).

### Not verified

- Every page at 390px: all six reviewers read code only.
- Feedback FAB below lg: computed to cover the pagination Next button at scroll end from 608 to 1023px (`pb-8` at DashboardChrome.tsx:257 under a 48px FAB).
- Workspace switcher moves into the rail (DashboardChrome.tsx:167, :211-218) against design.md:489 and :1972; needs a top-bar width probe from 1024 to 1280px.
- ux-74 and ux-75: Save position and toolbar growth inferred from classes.
- ux-95 and the Add credits amount (CreditsCard.tsx:343, BillingFree.tsx:452): pasting `$1,000` into `type="number"`.
- ux-40: whether any seed conversation has zero findings.
- Overview 3-up preview tables at the 1154 and 1226px content widths (Dashboard.tsx:705).
- AuthLayout entrance (about 860ms to opaque, computed from the gsap params) against Doherty.
- Manager and Member gating on Teams, read in code only.

### Compliant, checked and clean

- common-region: each card holds one group; no card in card in any scope.
- uniform-connectedness: KPI rails, chart dividers, the trace timeline and the site map spine tie their members.
- pragnanz: KPI strips, policy cards, limit rows and conversation rows each read as one object.
- figure-ground: dialogs, Sheet and the composer separate from their pages; the selected finding is the only tinted card.
- cognitive-load: decoration is texture only, aria-hidden and pointer-events-none.
- miller and chunking: tables page at 10 to 25, long IDs chunked with the full value on drill-in (except ux-16).
- serial-position: title, then primary at top right, then tabs or tables on every page.
- von-restorff: one filled emphasis per view outside the one-primary items.
- selective-attention: promo appears only on upgrade CTAs and the FAB (raised as a conflict); no status looks like an ad.
- aesthetic-usability: shared row recipes keep alignment and rhythm; mismatches are filed under similarity.
- hick and choice-overload: 4 or fewer choices per decision point; pickers mark the current row.
- tesler and parkinson: forms prefill defaults (limit scope, budget caps, invite role, notification prefs).
- goal-gradient and zeigarnik: Gate Connect steps show reached and waiting; "Finding N of M" shows position.
- selectable-row: drill-in rows are full-row targets with hover fill (Teams, Conversations, Models, notifications).
- edit-action-placement: section and card actions sit at the right of their header or footer everywhere.
- operate-density: 48px rows, tight section rhythm, no marketing spacing outside the auth shell.
- fitts touch 44px: design.md:1963-1967 sets 36 / 32 / 24 and INDEX.md already overrides the skill, so not filed.

Verdict (run 1): Qualified. 88 findings, 6 HIGH; the worst are misleading controls on the demo path (ux-17, ux-23, ux-55), none stops a page from rendering.

## Patterns

- `mental-model`: ux-1 to ux-32. Labels, glyphs and titles promising what the control does not do; review-time. Sub-class: bare route literals without `withTierOf` (ux-2, ux-82), a lint candidate.
- `similarity`: ux-33 to ux-45. One role drawn two ways; review-time.
- `one-primary`: ux-46 to ux-52. Lint candidate: more than one default-variant Button in one page file.
- `collapsible-row`: ux-53, ux-54. Lint candidate: `aria-expanded` on an `IconActionButton`.
- `working-memory`: ux-55, ux-56. State that vanishes behind a modal or a Back; review-time.
- `occam`: ux-59 to ux-70. One value printed twice in one view; review-time.
- `proximity`: ux-71 to ux-76. A control or hint placed away from what it acts on; review-time.
- `flow`: ux-82 to ux-86. Extra steps or lost input mid-task; review-time.
- `quiet-destructive`: ux-87, ux-88. A destructive MenuItem that acts without confirm or undo; review-time.
- `postel`: ux-94, ux-95. Lint candidate: `type="number"` on a money input.
