# WDG audit — Group A (Dashboard, Requests, Conversations)

## Dashboard.tsx

### SERIOUS

- L:543 [GRID] `gap-y-2` on the legend flex row violates 4px-grid rule only when using `gap-y-1.5` — confirmed `gap-y-2` is used, so this is clean. (No finding.)

- L:570 [A11Y] `QuickActionItem` `<button>` has no `aria-label`; its accessible name comes only from two text spans inside it. The name is computed automatically from child text so this is valid — however the `ChevronRight` at L:584 is `aria-hidden` correctly. Clean.

- L:569 [FOCUS] `outline-none` at L:569 (`className="... outline-none ..."`) on `QuickActionItem` button — replaced by `focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset` in the same string. The replacement is present and correct, so the anti-pattern is mitigated. **No finding.**

- L:268 [GRID] `gap-x-4 gap-y-2` on the legend row (L:268) — `gap-y-2` is 8px, valid. `gap-x-4` is 16px, valid.

- L:439 [CARD] `py-3 px-4` on the RecentRequestsCard header row (L:439) — `px-4` = 16px (valid), `py-3` = 12px (valid). Clean.

- L:99 [CONTENT] `max-w-1/2` on the page title container is an arbitrary fraction class; in Tailwind v4 this resolves to 50%, which is valid.

- L:474 [CELL] Model `TableCell` at L:474 is missing `whitespace-nowrap` — it uses `max-w-[260px]` with a truncate `<span>` inside but the cell itself has no `whitespace-nowrap`. Combined with the inner div + span structure this works visually but breaks the project rule requiring every `TableHead` and `TableCell` to carry `whitespace-nowrap`.
  Fix: add `whitespace-nowrap` to `<TableCell className="max-w-[260px]">` at L:474.

- L:127 [KPI] KPI values (`"48,293"`, `"$1,247.82"`, etc.) are hardcoded string literals not derived from any constant — violates the charts-must-reconcile rule. The Dashboard KPI rail has no reconciliation anchor.
  Fix: extract totals into module-level constants (`TOTAL_REQUESTS`, `TOTAL_COST`, etc.) and derive both the KPI value and any downstream calculation from the same source.

- L:346–352 [DATA] `TOP_KEYS` cost array sums to `$1,139.89` but `HeroNumeric` at L:377 shows `$1,147.82` — these cannot both be correct without a reconciliation comment.
  Fix: make `HeroNumeric` derive its value by summing `TOP_KEYS.map(k => k.cost)`.

### MODERATE

- L:105 [COPY] Page description ends with a period and uses passive structure: "Traffic, spend and latency across every model on the gateway." Active voice preferred per WDG Content rules: e.g. "Monitor traffic, spend, and latency across every model."

- L:110 [COPY] Button label "Create Key" — Title Case is correct. No finding.

- L:192–199 [DATA] `VOLUME_DATA` tick labels use abbreviated month+day (`Apr 21`) with no year context and hardcoded numbers — no constant anchors these to a date relative to `ANCHOR`. Low severity given this is a chart annotation, but worth flagging.

---

## Requests.tsx

### SERIOUS

- L:1069 [A11Y] Search `<Input>` has `aria-label="Search requests"` but `placeholder="Search request…"` uses `…` (ellipsis) — correct per WDG Typography rule. **Clean on typography.** However `placeholder` text lacks an example pattern (WDG: "Placeholders end with `…` and show example pattern").
  Fix: `placeholder="Search by id, model, key…"` to match the Conversations pattern (which already does this correctly at L:319).

- L:1147 [A11Y] "Export CSV" `<Button>` has a `<Download>` icon with `aria-hidden` and adjacent text label — correctly labeled. No finding.

- L:1601 [COPY] Escaped unicode `\\u2019` in `sampleRequestContent` at L:1601 — this is a double-escaped literal. In a JS string `\\u2019` renders as the six characters `’`, not a curly apostrophe. The displayed content in the code block will show the raw escape sequence rather than `'`.
  Fix: use the actual character (`'`) or a single-escape `’`.

- L:1607 [COPY] Same issue: `\\u2019` in L:1607 (`'s`).
  Fix: same as above.

- L:1683 [COPY] `sampleResponseText` default return (L:1683) uses straight apostrophe `'` inside the string — consistent with JS string syntax, but the displayed user-facing text will show straight quotes. Per WDG Typography rule: curly quotes in user-visible strings.
  Fix: replace `I'm`, `I'd` with `I’m`, `I’d` (or actual curly chars).

- L:570 [GRID] `gap-x-2 gap-y-2` on the breakdown grid at L:572 — both 8px, valid.

### MODERATE

- L:553 [LAYOUT] `HeroMetricCard` root div at L:553 uses `p-4` (16px) — valid. No finding.

- L:1822 [A11Y] `RequestBodyPanel` scroll container at L:1822 — `max-h-80 overflow-y-auto` with no `overscroll-behavior: contain`. Inside a modal, inner scroll regions should contain overscroll so it doesn't bubble to the modal or page.
  Fix: add `overscroll-contain` class to the `<div className="flex flex-col gap-4 max-h-80 overflow-y-auto ...">`.

- L:1725 [FOCUS] `BodySection` toggle button uses `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset` — correct. No `outline-none` without replacement. Clean.

- L:1486 [A11Y] `TextLink` for conversation drill-through uses `onClick` handler with `aria-label`. This is a button-style interaction (navigate programmatically) rendered as a link primitive — acceptable since `TextLink` appears to wrap an `<a>` or `<button>`, but if it renders as `<a>` without `href`, keyboard navigation via Enter only (not Cmd+click) works. Verify `TextLink` renders as `<button>` for onClick-only usage or as `<a href>`.
  Severity: moderate — cannot confirm without reading the `TextLink` source.

---

## Conversations.tsx

### SERIOUS

- L:393 [A11Y] Interactive `<TableRow>` at L:389 has `tabIndex={0}` and `onKeyDown` (Enter/Space) — correct keyboard pattern for a clickable row. The row also has a nested `<RowActionButton>` at L:402 with its own `onClick`. This creates a double-activation path: pressing Enter on the row fires both the row `onKeyDown` and the button's native Enter activation, opening the dialog twice. Tab stops into the inner button, which then steals focus from the row tab stop.
  Fix: remove `tabIndex={0}` and `onKeyDown` from `<TableRow>` — let `RowActionButton` (which is a `<button>`) be the sole keyboard target for opening the dialog. The row `onClick` for mouse users remains.

- L:252 [DATA] `CONVERSATIONS_TOTAL = 100` is a standalone hardcoded constant. The KPI rail's "Conversations" tile at L:175 shows `conversationsValue` derived from this constant — that part reconciles. But the tile also shows `delta="+6.4%"` which implies a prior-period baseline of ~94 conversations. That baseline is never defined.
  Fix: define `CONVERSATIONS_PRIOR = 94` and derive the delta string from `((CONVERSATIONS_TOTAL - CONVERSATIONS_PRIOR) / CONVERSATIONS_PRIOR * 100).toFixed(1) + '%'`.

- L:629 [COPY] Footer at L:629: `Key <span>prod-web</span>` is hardcoded to `'prod-web'` regardless of which `stickyRow` is open. The row data carries `row.initiator` which is the correct per-row key.
  Fix: replace `prod-web` literal with `{stickyRow?.initiator ?? row.initiator}` (or reference `row` which is already in scope inside `ConversationDetailBody`).

### MODERATE

- L:810 [A11Y] `ConversationMessagesPanel` scroll region at L:809 uses `overscroll-contain` — correct. The `RequestTracePanel` scroll region at L:952 also uses `overscroll-contain` — correct.

- L:1040 [FOCUS] `TraceItem` button at L:1040 uses `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1` and `outline-none` — the `outline-none` is present. Replacement ring is present and correct. Valid mitigation.

- L:393–395 [GRID] `py-3 px-3` on `TraceItem` button is valid (12px, 12px). `-mx-2` negative margin is layout trick, not a spacing unit violation.

- L:399 [ANIM] `transition-colors duration-150 ease-out` on clickable `<TableRow>` — correct compositor-safe property (colors do trigger paint but are standard row hover). `motion-reduce:transition-none` gating is present. Clean.

- L:81 [DATA] `SPARK` data at L:75 contains arrays of raw float/int values (e.g. `avgCost: [0.101, 0.095, ...]`) that feed `CompactSpark` sparklines but are not derived from any cost source of truth. The KPI tile shows `"$0.082"` (hardcoded) while spark data ends at `0.082` — these align visually but are maintained independently.
  Fix: derive the terminal spark value and the displayed KPI value from the same constant.

---

## Clean

No file is fully clean. All three files pass on: semantic HTML structure, decorative icon `aria-hidden` usage, Base UI primitive usage (no Radix imports), `border-border` token usage (no raw `border-ink-N` in these files), modal dismiss pattern (`onOpenChangeComplete` for URL cleanup), and `motion-reduce` gating on transitions.
