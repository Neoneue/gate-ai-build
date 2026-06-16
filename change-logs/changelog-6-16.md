# UI Changelog: 2026-06-16

Running log of UI changes for 06-16. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-15.md`](./changelog-6-15.md).

---

## Components

### Workspace switcher: blue PRO plan badge `da8cd10`

The top-bar workspace plan badge now uses the `info` variant (blue,
`bg-blue-700/10 text-blue-600`) when the surface is Pro; Free stays `neutral`.
`variant={plan === "Pro" ? "info" : "neutral"}` in `workspace-switcher.tsx`.

## Sections

### Policies: hide card-title scan-tag badge `5e22442`

Removed the per-card `scanTag` `<Badge>` next to each policy title (e.g. "Input +
Output scan") in `Policies.tsx`. `config.scanTag` data and the `Badge` import are
kept (Badge still backs the action-option DEFAULT badge), so restoring is a
one-line re-add of `<Badge variant="info">{config.scanTag}</Badge>`.

### Conversations: KPI sparkline hover tooltips `2e9de49`

All three Overview KPI cards (Conversations, Avg Turns, Avg Cost / Conv) now show
the CompactSpark hover tooltip — crosshair + a card with a muted date over the
value. Added a local `sparkDates(range, customRange)` helper (same
`SPARK_TIME/DAY/MONTH` formatters + `SPARK_TODAY` anchor as `TokenSavings.tsx`)
tuned to the fixed 9-point spark arrays, with a `custom`-range branch that
interpolates `from`→`to`. Per-card `valueFormatter`: count (thousands-sep),
1-decimal turns, `$0.000` cost. Wired via `tooltip` + `labels={sparkLabels}` +
`valueFormatter` on each `<CompactSpark>`. Labels are illustrative (the spark
arrays are authored, not entity-derived), per the carried-over comment.

### Token Savings + Conversations: 24h spark labels read "12:00 PM" `2e9de49`

`SPARK_TIME` on both pages now includes `minute: "2-digit"` (`hour: "numeric",
minute: "2-digit"`), so 24h hover labels render "12:00 PM" instead of "12 PM".
Steps land on the hour, so minutes are always `:00`.

### Requests: KPI chart tooltip matched to CompactSpark `c00e265`

The hero `AreaChart` tooltip now mirrors the CompactSpark KPI tooltips:
`hideIndicator` drops the dot swatch, the value renders as a value-only
`font-medium text-foreground text-sm` span (drops the "Requests/6h" series-name
row), `labelClassName="font-normal text-muted-foreground"` mutes the date header,
and `gap-1` tightens spacing. Date still comes from the `time` dataKey; cursor
(dashed neutral-500) and the on-line active dot are unchanged.

### Security: Total Events tooltip matched to CompactSpark `e8a4a79`

Same restyle as the Requests tooltip, applied to the Total Events `AreaChart` in
`Security.tsx`: `hideIndicator`, value-only `font-medium text-foreground text-sm`
span (drops the "Events" series-name row), `font-normal text-muted-foreground`
date header, `gap-1`. Date from the `time` dataKey; cursor + active dot unchanged.

### Billing: Your plan auto-renew removed, modals widened, helper text 12px `846a63e`

Three `Billing.tsx` changes:

- **Your plan card** — removed the Auto-renew inset (the bordered toggle row
  reading "Auto-renew / Renews automatically on…") and its dead `autoRenew`
  state. `Switch` import kept (still used by the auto-recharge toggle).
- **Add credits + Auto-recharge dialogs** — appended `sm:max-w-[500px]` to each
  `DialogContent`. They were `max-w-[500px]` but the `DialogContent` primitive's
  base `sm:max-w-sm` won at ≥640px and capped them at 384px; now a true 500px on
  desktop.
- **Input validation helper text** — both dialogs' error lines
  (`text-destructive`) went `text-sm` → `text-xs` (12px/16px).

## Components

### `formatSparkLabel` — one tooltip date-label format for every chart `9d1133d`

New shared formatter in `lib/formatters.ts` is the single source for all KPI-rail
and area-chart hover labels: `Mar 01, 2026` (date only) or, with `withTime`,
`Mar 01, 2026 14:30` (24-hour, no AM/PM; `hourCycle: "h23"` so midnight is `00:00`
not `24:00`). Replaces the per-page/per-range Intl formatters that had drifted
(some AM/PM, some missing the year, some month-only). Time is shown only for
sub-daily buckets: the three rails pass `withTime` for 24H only (All/7D/30D/custom
are date-only — no meaningless `00:00`); the Requests/Security area charts bucket
sub-daily on every range, so they pass `withTime=true` throughout.

## Sections

### Conversations / Token Savings / Activity KPI rails — dated hover tooltips `9d1133d`

All three CompactSpark rails now share the `formatSparkLabel` tooltip. Token
Savings and Conversations `sparkDates` format through it; Activity gains
`getRangeDates()` (the page's Apr-27-anchored bucket dates, proven byte-identical
to the existing `getRangeLabels` axis output) and lights up all three cards with
`tooltip` + a per-metric `valueFormatter` (USD / count / tokens).

### Conversations count sparkline reconciles to the KPI total `9d1133d`

The Conversations count card distributes the KPI total across its bucket shape
via largest-remainder rounding, so the per-bucket volume sums **exactly** to the
total (850 all-time, 420/100/16 for 30D/7D/24H, dynamic for custom) — mirroring
the backend `getStats`, where the daily buckets and the count agree. The line can
still spike up/down; it is not cumulative. Avg Turns / Avg Cost (averages) are
untouched.

### Requests / Security area-chart tooltips matched + dated `9d1133d`

Both hero area charts read their date header from a per-bucket `label` field
(`formatSparkLabel(date, true)`); the `time` field still drives the axis ticks, so
the axis is unchanged. Combined with the earlier `hideIndicator` / value-only
restyle, the two charts now match the rails.
