# Audit - 2026-10-05 (part 2)

Part 2 of audit-10-5. Summary and Patterns are in part 1.

## Runs

| # | Time (CT) | Skill | Scope | Items | Applied |
| --- | --- | --- | --- | --- | --- |
| 1 | 22:02 | ux-laws (MEDIUM / LOW-only law sections) | whole site: layouts, shared primitives, every route twin (six agents) | ux-59 to ux-96 (ux-77 to ux-81 removed) | 0/33 |

## ux-laws: Occam's Razor

### Global

- [ ] **ux-59 LOW** `occam` pages/teams/TokenSavingsPane.tsx:337, pages/teams/TokenSavingsPane.tsx:511, pages/TokenSavings.tsx:272, pages/TokenSavings.tsx:610
  - Before: `action={<StatusBadge on={enabled} />}` (and `on={advancedEnabled}`)
  - After: drop the `action` prop so the Switch in the body is the only On/Off reading
  - Why: Caching and Compression cards are always open, so the header badge and the body Switch state one value twice in one card (grep: 4 hits of `action={<StatusBadge on=` across the two files).

### Activity

- [ ] **ux-60 LOW** `occam` pages/Activity.tsx:404, pages/Activity.tsx:628
  - Before: `<p className="type-copy-14 m-0 text-muted-foreground">{subtitle}</p>`
  - After: delete that `<p>`, the `subtitle` prop and `subtitleFor`; the card title and selected pill carry the ranking basis
  - Why: each Top card's subtitle is derived one to one from the pill selected beside it, so every card states its lens twice in one header (grep: `subtitleFor` 4 hits).

### Conversations

- [ ] **ux-61 LOW** `occam` pages/conversations/ConversationDetail.tsx:384, pages/conversations/ConversationDetail.tsx:463, pages/conversations/ConversationDetail.tsx:544
  - Before: `<span className="text-foreground">{row.initiator}</span>` in each tab footer
  - After: the footer keeps the started timestamp only; the key stays once in the identity row (:260)
  - Why: the key is printed in the header and again in three tab footers, so one value shows twice in one view (grep: `row.initiator` 4 hits).

### API keys

- [ ] **ux-62 MEDIUM** `occam` pages/ApiKeys.tsx:270, pages/ApiKeys.tsx:622, pages/ApiKeys.tsx:692, pages/ApiKeys.tsx:721
  - Before: `The full key will only be shown once. Store it securely.` (plus three more once-only sentences and the checkbox label)
  - After: delete the step-1 note (:617-624) and the step-2 `DialogDescription` (:691-693); the step-2 note (:712-724) carries the fact once
  - Why: one fact is said five times across the empty state and two dialogs, so the warning that matters, with the key on screen, is diluted (grep: 4 once-only sentences at :270, :622, :692, :721 plus the checkbox).
- [ ] **ux-63 MEDIUM** `occam` pages/ApiKeys.tsx:429, pages/ApiKeys.tsx:469
  - Before: `sortKey="status"` head and the cell `<Badge variant="success">Active</Badge>`
  - After: drop the Status column (head :425-432, cell :465-471) and rebalance widths; the Active and Revoked tabs state it
  - Why: each tab holds one status, so the column prints the same badge on every row and sorting by it orders nothing (grep: tabs filter on revoked at ApiKeys.tsx:134-136).

### Team detail

- [ ] **ux-64 MEDIUM** `occam` pages/teams/SettingsStack.tsx:68
  - Before: `{locked && lockedBy ? <Callout>{lockedBy}</Callout> : null}`
  - After: keep the Callout at line 59 (above Policies) and delete the one at line 68 (above Token savings), as the docstring at :21-23 describes
  - Why: a locked team, and every manager view, shows the same "who set it" sentence twice on one tab (grep: `locked && lockedBy` at SettingsStack.tsx:59 and :68).

### Billing

- [ ] **ux-65 MEDIUM** `occam` pages/BillingFree.tsx:143
  - Before: `Free is a single-seat workspace with nothing to renew. Upgrade to Pro`
  - After: the subtitle reads `Upgrade to Pro to add teammates.`; the Seats and Renews on rows carry the other two facts
  - Why: the subtitle restates the Seats and Renews on values printed directly below, so values appear twice (grep: `nothing to renew` at :143 vs `No renewal` at :158).
- [ ] **ux-66 LOW** `occam` pages/Billing.tsx:171
  - Before: `` value={`${formatCurrency(MEMBER_ROWS.length * PRO_SEAT_RATE_USD)} on ${BILLING_PERIOD_END}`} ``
  - After: `value={formatCurrency(MEMBER_ROWS.length * PRO_SEAT_RATE_USD)}`; the date stays on the Renews on row
  - Why: the renewal date prints on Renews on and again inside Next invoice two lines below (grep: `BILLING_PERIOD_END` rendered at Billing.tsx:167 and :171).

### Token savings

- [ ] **ux-67 MEDIUM** `occam` pages/token-savings/SummaryCard.tsx:352
  - Before: `<Lede loading={loading} model={model} />`
  - After: delete that line; `Figures` at :353 keeps both numbers with their denominators
  - Why: the lede prints the removed-token and cache-answer counts and the Figures cells directly under it print the same two numbers again (grep: `<Lede` at SummaryCard.tsx:352 above `Figures` at :353).
- [ ] **ux-68 LOW** `occam` pages/TokenSavings.tsx:288, pages/teams/TokenSavingsPane.tsx:353
  - Before: `Serve cached responses instead of round-tripping to providers.`
  - After: the inset card's `<p>` keeps only `Identical concurrent messages are deduplicated automatically.`; the header `Reuse identical responses.` stays
  - Why: the Caching card says one idea twice within a few lines (grep: 2 hits of the serve-cached sentence).

### Setup

- [ ] **ux-69 LOW** `occam` pages/SetupModels.tsx:71, pages/SetupModels.tsx:98
  - Before: `<TableHead>Status</TableHead>` and `<Badge variant="success">Available</Badge>`
  - After: delete the Status head (:71) and the Status cell (:97-99)
  - Why: every row prints the same green Available badge, so the column informs nothing and competes with the prices the page exists to show (grep: 1 `variant="success"` at SetupModels.tsx:98, constant per row).

### Limits

- [ ] **ux-70 LOW** `occam` pages/Limits.tsx:545, pages/LimitsFree.tsx:394
  - Before: `` return `${prefix}${u} / ${prefix}${t}`; ``
  - After: `` return `${prefix}${u}`; `` and drop the unused `tNum` and `t`
  - Why: each row prints the cap twice, in Threshold and as the tail of Used, and the tail widens a table that already scrolls sideways (grep: `usedLabel` ends with the threshold at Limits.tsx:545 and LimitsFree.tsx:394).

## ux-laws: Proximity

### Conversations

- [ ] **ux-71 MEDIUM** `proximity` pages/conversations/ConversationDetail.tsx:397, pages/conversations/ConversationDetail.tsx:476, pages/conversations/ConversationDetail.tsx:556
  - Before: `text="Copy ID"` on a `CopyButton` of `row.conversationId` inside the Request trace panel footer, beside View request
  - After: one `<CopyButton label="conversation ID" mode="label" size="sm" text="Copy ID" value={row.conversationId} />` next to the ID in the identity row (:255-258); delete the three footer copies
  - Why: Copy ID copies the conversation but sits beside a step-scoped button far from the ID it copies, grouped with the wrong object, three times (grep: `text="Copy ID"` 3 hits).

### Security events

- [ ] **ux-72 MEDIUM** `proximity` pages/security/EventsTable.tsx:960
  - Before: `<Label className="type-label-14" htmlFor="event-verdict">` at the footer's left edge, its Select at the right edge with Add note between
  - After: `<DialogScrollFooter className="justify-between">` with Add note first, then the Label and Select together in `flex items-center gap-3`
  - Why: the label is a dialog width and an unrelated button away from its control, so Mark event reads as a footer heading, not a field (grep: `htmlFor="event-verdict"` at :960, `id="event-verdict"` at :995).

### Team detail

- [ ] **ux-73 LOW** `proximity` pages/teams/dialogs.tsx:545, pages/teams/dialogs.tsx:597
  - Before: `Notify org admins on warnings` in the Enforcement field
  - After: move the `div.mt-4` block (dialogs.tsx:538-559) under the recipients helper line inside the Warn threshold field
  - Why: the switch sits one field above the sentence that states who hears a warning, which the switch changes, so cause and effect are a field apart (grep: `notifyAdmins` read at :549 and :597).

### Chat

- [ ] **ux-74 MEDIUM** `proximity` pages/chat/chat-memory-panel.tsx:257
  - Before: `<DialogFooter>` holding `Save memory`, below the add fields and below the `max-h-64` memories list (:245)
  - After: move the `Save memory` Button into the add block as `className="self-end"` after the Textarea Field; delete the `DialogFooter`
  - Why: the action that submits name and fact sits under a scrolling list of unrelated rows, up to 256px from its inputs, so users hunt for it (grep: `DialogFooter` at :257 after the list at :245).
- [ ] **ux-75 MEDIUM** `proximity` pages/chat/chat-attachment-picker.tsx:164, pages/chat/chat-composer.tsx:206
  - Before: `{picked.length > 0 ? (<ul className="flex flex-wrap gap-2">` inside the picker, mounted in the toolbar row as `order-2 shrink-0 sm:order-1`
  - After: lift `picked` into `ChatComposer` and render the chip `<ul>` above the textarea; the picker keeps only the paperclip Menu
  - Why: attached files stack under the paperclip inside the control row, so the model picker and Send re-centre around a taller block instead of the chips sitting with the prompt (grep: `picked.length > 0` at chat-attachment-picker.tsx:164).

### Sign in / up

- [ ] **ux-76 MEDIUM** `proximity` pages/SignUp.tsx:94
  - Before: `Your invite code is single-use. Find it in your welcome email.` as a `<p>` under the submit button, the "or" rule and Google
  - After: move this `<p>` into the invite `<Field>` (:59-73) directly under the Input as `<p className="type-copy-12 text-muted-foreground">`
  - Why: the hint that answers "where do I get a code" sits away from the field it explains, so a user stuck on the code never meets it (grep: `welcome email` at SignUp.tsx:94, invite Field ends at :73).

## ux-laws: Flow

### Global

- [ ] **ux-82 MEDIUM** `flow` pages/Dashboard.tsx:733, pages/Dashboard.tsx:814, pages/Dashboard.tsx:869, pages/requests/RequestDetailBody.tsx:78
  - Before: `viewAllTo="/messages"` (also `/conversations`, `/security`) and `const tunePolicy = () => navigate("/policies");`
  - After: `viewAllTo={withTierOf(pathname, "/messages")}` and the same wrap on the other three, mirror Dashboard.tsx:747 and RequestDetailBody.tsx:68
  - Why: from a Free or Enterprise page these send a bare Pro path, so the click lands in the Pro twin with different chrome while the row link beside them stays in-tier (grep: `withTierOf` 1 call in Dashboard.tsx vs 3 bare `viewAllTo`, 1 bare `/policies` navigate).
- [ ] **ux-83 LOW** `flow` components/ui/feedback-fab.tsx:53
  - Before: `if (!next) {` (runs `resetForm` on every close)
  - After: `function handleOpenChange(next: boolean) { setOpen(next); }` (the reset stays in `handleSubmit`)
  - Why: Esc, the X or a stray backdrop click deletes the whole typed message mid-task (grep: `resetForm` 3 hits, one on every close path).

### API keys

- [ ] **ux-84 MEDIUM** `flow` pages/ApiKeys.tsx:745
  - Before: `disabled={!saved}` on Done, gated by `I&rsquo;ve saved this key to a secret manager.`
  - After: delete the `saved` state and the Checkbox block (:726-739); Done is a plain `DialogClose` default Button
  - Why: the last step of the main create path adds a mandatory tick that is not a gate, since Esc, the X and an outside press all close the dialog without it (grep: `disabled={!saved}` at :745; onOpenChange closes on every path at :670-676).

### Chat

- [ ] **ux-85 LOW** `flow` pages/chat/chat-export-dialog.tsx:133
  - Before: `{state.kind === "ready" ? (` rendering a separate Download Button after the format buttons disappear
  - After: each format button builds the Blob and clicks a hidden `<a download>` in the same handler; drop the `ready` state and its Download Button (:133-151)
  - Why: picking a format only prepares the file and hides the format row, so one export takes three steps and a wrong pick means close and reopen (grep: `kind: "ready"` at :23, rendered at :133).

### Setup

- [ ] **ux-86 MEDIUM** `flow` pages/SetupManual.tsx:258, pages/SetupManual.tsx:270, pages/SetupManual.tsx:274
  - Before: `modelChosen ? null : "pointer-events-none opacity-50"` on steps 3 and 4, and `<WaitingStrip active={modelChosen}>`
  - After: gate on `configRevealed` at :258, :270, :274 and :276
  - Why: step 2 already shows a selected model (`MODEL_OPTIONS[0]`) yet steps 3 and 4 stay inert until the picker is opened, so a user who accepts the default must open and dismiss it to continue (grep: `setModelChosen(true)` only on picker open at :222 and select at :231).

## ux-laws: Quiet destructive

### Members

- [ ] **ux-87 LOW** `quiet-destructive` pages/Team.tsx:668
  - Before: `onSelect: () => onRevoke(row),`
  - After: route Revoke invite through a confirm Dialog shaped like Team.tsx:370-406
  - Why: Revoke invite removes the row at once with neither confirm nor Undo, while Remove member on the sibling tab confirms (grep: `onRevoke` at :668, handler at :148 filters and toasts only).

### Limits

- [ ] **ux-88 MEDIUM** `quiet-destructive` pages/Limits.tsx:435, pages/LimitsFree.tsx:325
  - Before: `<MenuItem onClick={onRemove} variant="destructive">` with `removeLimit` filtering state at once
  - After: `onClick={() => setConfirmOpen(true)}` opening an `AlertDialog` with Cancel and a destructive `Remove limit`, mirror chat-sidebar.tsx:626-666
  - Why: removing a spend cap runs on one click with no confirm and no undo, so a mis-click in a dense row silently drops the guard (grep: `onClick={onRemove}` 2 hits).

## ux-laws: Fitts's Law

### Global

- [ ] **ux-89 MEDIUM** `fitts` pages/requests/RequestsTable.tsx:765, pages/requests/RequestsTable.tsx:1084, pages/requests/RequestsTable.tsx:1110, pages/TokenSavings.tsx:453, pages/teams/TokenSavingsPane.tsx:475, pages/teams/budget.tsx:251
  - Before: `-m-1 inline-flex cursor-help rounded-sm p-1` (with or without `shrink-0`) around a `size-3.5` Info glyph
  - After: `-m-2` and `p-2` on every trigger (30px target, same layout)
  - Why: a 14px glyph plus 4px padding is a 22px target under the 24px floor (design.md:1967), on the only way to read what each badge or pass means, hand-copied at 6 sites (grep: 6 hits of `cursor-help rounded-sm p-1` in 4 files).

## ux-laws: Hierarchy

### Conversations

- [ ] **ux-90 MEDIUM** `hierarchy` pages/conversations/ConversationDetail.tsx:246
  - Before: the visible title is the word `Conversation`; `row.title` appears only in `` titleAriaLabel={`Conversation ${row.title}`} `` at :248
  - After: `<DialogTitleBlock mode={variant === "page" ? "static" : "dialog"} titleAriaLabel=...>{row.title}</DialogTitleBlock>`
  - Why: the list names each conversation by its title, but the page is headed with a generic word and an ID, so the thing opened is not foreground and cannot be confirmed (grep: `row.title` 1 hit, inside `titleAriaLabel`).

## ux-laws: Active User

### Conversations

- [ ] **ux-91 MEDIUM** `active-user` pages/conversations/ConversationDetail.tsx:402, pages/conversations/ConversationDetail.tsx:481, pages/conversations/ConversationDetail.tsx:560
  - Before: `disabled={!activeRequestId}` on View request, the only default-variant Button
  - After: render View request only once a step is selected: `{activeRequestId ? <Button ...>View request</Button> : null}` (glyph per ux-3)
  - Why: the trace page's one forward action looks dead on arrival and nothing says selecting a step enables it, so a user who wants the request has to guess (grep: `disabled={!activeRequestId}` 3 hits).

## ux-laws: Cognitive Bias

### Setup

- [ ] **ux-92 MEDIUM** `cognitive-bias` pages/SetupCredits.tsx:84
  - Before: `<Switch defaultChecked size="lg" />` for "Auto-reload $25 when my balance drops below $5"
  - After: `<Switch size="lg" />`, off until the user turns it on
  - Why: a recurring charge arrives pre-switched on under "Add $25 in credits", so a one-off buyer opts into future payments without choosing to (grep: `defaultChecked` 1 hit at SetupCredits.tsx:84).

## ux-laws: Jakob's Law

### Global

- [ ] **ux-93 MEDIUM** `jakob` components/ui/sidebar.tsx:243
  - Before: `"flex size-6 items-center justify-center rounded-full font-medium font-mono text-xs"` (a static monogram div at the foot of the collapsed rail)
  - After: wrap the monogram in `<UserMenu align="end" side="right" sideOffset={12}>` with a `<button aria-label="User menu" type="button">` trigger, mirror components/ui/sidebar.tsx:582-595
  - Why: with the rail collapsed the avatar does nothing and the top bar has no avatar, so Sign out has no entry point where every console user expects the avatar to open the account menu (design.md:1909).

## ux-laws: Postel's Law

### Notifications

- [ ] **ux-94 LOW** `postel` pages/Notifications.tsx:968, pages/Notifications.tsx:994
  - Before: `count: countOr(Number(e.target.value), 1),` (and the `windowHours` twin)
  - After: bind each Input to a string draft and normalise on blur with `countOr(Number(draft), 1)`
  - Why: backspacing to empty is coerced to 1 on the same keystroke, so the number cannot be cleared and retyped (grep: 2 hits at :968 and :994).

### Team detail

- [ ] **ux-95 LOW** `postel` pages/teams/dialogs.tsx:471
  - Before: `type="number"` on the USD cap input
  - After: `type="text"` with `inputMode="decimal"`, parsing `Number(value.replace(/[$,\s]/g, ""))` in `amountValid` (dialogs.tsx:310-313); the two percent fields stay numeric
  - Why: number inputs drop a pasted dollar sign or thousands comma, so a valid 1,000 can read as empty and trip the amount error (grep: `type="number"` 3 hits in teams/dialogs.tsx, only :471 is money).

## ux-laws: Pareto Principle

### Teams

- [ ] **ux-96 LOW** `pareto` pages/TeamsEnterprise.tsx:503, pages/TeamsEnterprise.tsx:123
  - Before: `<TableHead className="w-[36%] whitespace-nowrap">Budget</TableHead>`
  - After: `<SortableTableHead className="w-[36%] whitespace-nowrap" onSort={toggleSort} sort={sort} sortKey="budget">Budget</SortableTableHead>`
  - Why: Budget answers which team is nearest its cap, the admin's most common read, yet it is the one data column that cannot be sorted though its accessor exists (grep: `sortKey="budget"` 0 hits, `case "budget"` at :123).
