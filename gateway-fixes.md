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
- [ ] **Freshness indicator.** Show "updated at" timestamp next to the range selector so users know data recency. (Custom range picker scoped out — presets only.)
- [ ] **Chart geometry adaptive to range + density.** Area chart for 1H/24H (minute / 5-min buckets). Bar chart for 7D/30D (daily buckets) and any sparse case (low non-zero point count) — bars are honest at low density and remove the "cumulative?" misread.
- [x] **Security blocks in the table.** Pattern A (Portkey-style status overload), validated against Portkey / Lakera / Datadog / LangSmith precedent. Status column carries a destructive `Blocked` badge as the row-level signal — no separate column eating horizontal space for mostly-empty data. "Blocked" added to the status filter so triage is one click. Modal header badge swaps to `Blocked` for blocked rows. Modal Audit tab marks the matching guardrail check as `Block` (destructive) with reason copy while the other four checks stay `Pass` — row and modal stay coherent. Bonus: Time cell `gap-0.5` → `gap-0` for 4px-grid compliance.
- [x] **Status vocabulary aligned to gateway actions (Marcus, 2026-05-12 Slack).** Replaced HTTP-leaning labels (Throttled / Timeout / 4xx / 5xx) with five gateway-action statuses: `Success` (green), `Flagged` (amber — guardrail flagged content but allowed it through), `Redacted` (blue — gateway stripped PII before sending), `Blocked` (red — guardrail rejected), `Error` (red — provider 4xx/5xx). HTTP code lives in the modal Details tab as a code-colored Badge. Audit tab check states extended from `pass/block` to `pass/flag/redact/block` — a Flagged row shows the matching check in amber, Redacted in blue, Blocked in red. `warn` status retired; existing 429/408 rows rolled into Error. `blockReason` field renamed to `guardrailReason` since the same dimension drives flag/redact/block all three.
- [ ] **BYOK vs Gateway.** Two-tier Cost cell. Top: dollar amount (or `—` for BYOK). Bottom: `Gateway` or `BYOK` label (mono xs, ink-500). Matches the Time cell pattern.
- [x] **Page copy.** Subtitle now reads: *"Every model call across your gateway, captured as it happens. Kept for debugging and audit."* Names what the page is (real-time capture) and the two audiences (debugging, audit) without listing columns, baking in UI instructions, or using jargon like "audit anchor".
