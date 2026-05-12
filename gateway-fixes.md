# Gateway Fixes

Running checklist of CTO feedback per section. Check items off as they ship.

---

## Requests

CTO feedback (verbatim, 2026-05-12):

> Looks pretty close but a few minor details to correct.
> - "Time" needs to be a datetime
> - Conversation needs to be linked to the conversation
> - Need proper time range selectors — are we just allowing 1h/7d/30d or custom ranges?
> - What does the graph look like with sparse data (say 5 req/day)? It shouldn't be cumulative
> - The table needs a column for security blocks — maybe this is a status but not sure
> - Should we be able to see the difference between a BYOK and paid gateway request here? Maybe we use the cost column for that?
> - "Every generation routed through the gateway. Click any row to inspect prompts, security scans and the audit anchor." huh? Let's get some better copy in there.

### Checklist

- [x] **Conversation link.** Conversation cell in row, header link in modal, and "Open Conversation" footer button all navigate to `/conversations?open=<id>` and open the conversation modal pre-filled. URL is shareable; close strips the param.
- [x] **Bonus — modal dismiss flicker fix.** Backdrop and popup both snapped back to opacity 1 between animation-end and unmount. Added `data-closed:fill-mode-forwards` to overlay and popup in `dialog.tsx`. Benefits every dialog in the app.
- [x] **Time → datetime.** Stacked format consistent across tables: relative on top, absolute datetime below.
- [x] **Range presets.** Pill is now **1H · 24H · 7D · 30D**.
- [x] **Range pill drives the table.** Switching 1H/24H/7D/30D swaps rows, relative timestamps, absolute datetimes, and pagination total. Page resets to 1 on range change.
- [ ] **Range pill drives the hero + chart.** Hero number, eyebrow ("REQUESTS / 1H"), delta vs prior period, and chart geometry should all reflect the active range. Couples with the chart-geometry item below.
- [ ] **Chart geometry adaptive to range + density.** Area chart for 1H/24H (minute / 5-min buckets). Bar chart for 7D/30D (daily buckets) and any sparse case (low non-zero point count) — bars are honest at low density and remove the "cumulative?" misread.
- [x] **Security blocks in the table.** Overload Status as two-tier when a request was blocked at the gateway: top line `BLOCKED` badge (destructive), bottom line mono caption with the reason (`PII redaction` / `prompt injection` / `model allowlist` / `spend cap`). Add "Blocked" to the status filter.
- [x] **BYOK vs Gateway.** Two-tier Cost cell. Top: dollar amount (or `—` for BYOK). Bottom: `Gateway` or `BYOK` label (mono xs, ink-500). Matches the Time cell pattern.
- [x] **Page copy.** Replace current subtitle. Candidates:
  1. `A live log of every model call routed through your gateway — latency, cost, tokens, and security verdict for each one.` *(recommended)*
  2. `Every model call across the gateway. Latency, cost, tokens, security verdict.`
  3. `Inspect any model call that crossed the gateway, with the security verdict and audit trail attached.`

---

## Request modal

CTO/Marcus feedback (2026-05-12):

> - On the messages section, I don't understand what system/user/tool/assistant are supposed to be on this request? Maybe work with Marcus to understand the real fields that would be available.
> - The section headers on messages are too washed out / don't stand out compared to the text. Need something else except the white background on white background with plain text.
> - I feel like the stats area should have an audit pass/fail section.
> - Can we put compression here also? Tokens saved?
> - Need a way to open up the full request context like we talked about.

### Checklist

- [x] **Messages tab — real request fields.** Replaced the turn-by-turn transcript with a JSON request body panel (model, messages array, max_tokens, temperature, stream). Light gray surface (`bg-ink-50`), brand-palette syntax coloring (blue-700 keys, success-700 values). Sample `content` varies per row by status + guardrail reason so each scenario reads like a plausible payload.
- [ ] **Section header contrast inside the modal body.** "Request body" and other in-modal labels sit as plain text on white and don't stand out. Need a treatment with visible boundary or contrast — not just sans text on the same surface.
- [x] **Audit pass/fail in the stats rail.** KPI rail bumped from 4 to 5 columns. New Audit tile mirrors the row's gateway action: `pass` (success-700 green) for success/error, `flagged` (warning amber), `redacted` (ink-700 neutral), `blocked` (destructive red). Visible at the top of the modal alongside latency/cost/tokens — no tab switch needed to see the verdict.
- [ ] **Compression / tokens saved.** Surface compression savings in the stats area. Likely a new tile: "Tokens saved" or "Compression %". Reconcile with the Token Savings page so the definition matches.
- [ ] **Open the full request context.** Need an affordance to expand from the row-level modal to the full request context (raw payload, full conversation, or trace view — TBD which).
