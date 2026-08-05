/**
 * Pure data + helpers for the Alerts page: the condition catalog, the window
 * options, the observed-value derivation, display formatting, seeded rules and
 * firings, wizard templates, and channel-target validation. No JSX, no React —
 * same split as `requests/data.ts` and `conversations/data.ts`, so the page
 * modules stay component-only (react-refresh) and the test file can read this
 * without importing a page.
 *
 * ── THE ONE RULE IN HERE ──────────────────────────────────────────────────
 * Nothing in this file is a hand-authored number. Every observed value,
 * threshold, and timestamp DERIVES from constants that already exist elsewhere
 * on the site, because an alert that claims "spend hit $40" while the Activity
 * page says $39.61 is worse than no alert at all. What IS authored here is
 * intent: which conditions an operator watches, how much headroom a threshold
 * leaves (a *factor*, never a number), and how firings are spaced (in units of
 * the rule's own window). The arithmetic does the rest.
 *
 * Sources, per condition:
 *   cost_threshold  → TOTAL_7D_BASE_DOLLARS  (pages/activity-data.ts)
 *   tokens_per_hour → TOTAL_7D_BASE_TOKENS   (pages/activity-data.ts)
 *   security_events → eventsTotal() / EVENTS_PER_DAY (pages/security/events-data.ts)
 *   error_rate      → REQUEST_ROWS_* status counts (data/requests.ts)
 *   latency_p95     → REQUEST_ROWS_* latency distribution (data/requests.ts)
 *   timestamps      → ANCHOR + minutesBeforeAnchor() (pages/security/events-data.ts)
 *   window scaling  → RANGE_SCALE (lib/range.ts)
 */

import { REQUEST_ROWS_7D, REQUEST_ROWS_24H } from "@/data/requests";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { RANGE_SCALE } from "@/lib/range";
import {
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_TOKENS,
} from "@/pages/activity-data";
import type { RequestRow } from "@/pages/requests/types";
import { eventsTotal, minutesBeforeAnchor } from "@/pages/security/events-data";
import type {
  AlertChannel,
  AlertChannelType,
  AlertConditionType,
  AlertEvent,
  AlertEventStatus,
  AlertRule,
  AlertSeverity,
  AlertWindow,
  AlertWindowUnit,
  ChannelDeliveryOutcome,
} from "./types";

/* ─── Window arithmetic ─────────────────────────────────────────────────────
 * A window is now a composed duration ({count, unit}), so the fixed per-literal
 * maps are gone and everything derives from ONE number: the window's
 * days-equivalent. Only windows inside the workload's real 7-day horizon have
 * an observed value; past it, `observedValue` returns null (see §Observed).
 *
 * The scale still reuses the site's own factors rather than inventing new ones:
 * one day is RANGE_SCALE["24h"] = 0.16 of the 7-day base (the Activity page
 * models 24h as the busiest, most-recent day of a ramping week, so 0.16 and not
 * 1/7), and a full week is 1.0. A window between one day and one week is a
 * linear interpolation of those two REAL anchors — the same way `lib/range.ts`
 * effectiveScale() prices an arbitrary custom range at days/7. It lands exactly
 * on the anchors at 1 and 7 days, grows monotonically, and asserts nothing
 * beyond "accrual between a day and a week is roughly even," a documented
 * approximation, never a hand-authored figure. */

const HOURS_PER_DAY = 24;

/** Days per unit. `month` and `year` are the conventional 30 / 365-day
 *  approximations — they exist only to place a window firmly BEYOND the 7-day
 *  horizon (so `observedValue` degrades), never to compute a real number, so
 *  their exact length never feeds a displayed figure. */
const DAYS_PER_UNIT: Record<AlertWindowUnit, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};

/** The workload fixtures span one week. A window longer than this has no full
 *  period in the data, so its observed value is `null`, not an extrapolation. */
const HONEST_HORIZON_DAYS = 7;

/** A window's length in days. The single number every window computation keys
 *  off. */
export function windowDays(window: AlertWindow): number {
  return window.count * DAYS_PER_UNIT[window.unit];
}

/** Whether the workload data covers a full period of this window. */
export function windowHasHistory(window: AlertWindow): boolean {
  return windowDays(window) <= HONEST_HORIZON_DAYS;
}

/** Fraction of the 7-day base a d-day window covers, for 1 ≤ d ≤ 7. Linear
 *  between the two real anchors (0.16 at one day, 1.0 at one week); callers only
 *  reach it once `windowHasHistory` is true. */
function windowScale(days: number): number {
  const ONE_DAY = RANGE_SCALE["24h"];
  const FULL_WEEK = 1;
  if (days <= 1) {
    return ONE_DAY;
  }
  return (
    ONE_DAY + ((days - 1) * (FULL_WEEK - ONE_DAY)) / (HONEST_HORIZON_DAYS - 1)
  );
}

/** Unit options for the wizard's window dropdown (the `count` is a sibling
 *  number input). Sentence-case labels; ordered shortest-first so a longer
 *  window reads further down the list. */
export const WINDOW_OPTIONS: { value: AlertWindowUnit; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

/** A window as operator-facing text: "1 day", "2 days", "1 week", "4 months".
 *  Pluralises on the count. Single source for the Rules-table column, the
 *  wizard preview, and the firing dialog. */
export function formatWindow(window: AlertWindow): string {
  const unit = window.count === 1 ? window.unit : `${window.unit}s`;
  return `${window.count} ${unit}`;
}

/* ─── Condition catalog ─────────────────────────────────────────────────── */

type ConditionUnit = "usd" | "percent" | "tokens_per_hour" | "count" | "ms";

type ConditionMeta = {
  /** Human name for the wizard's condition picker and the Rules table. */
  label: string;
  /** One sentence an operator can act on — what fires, measured how. */
  description: string;
  unit: ConditionUnit;
  /** Does the value accrue over the window, or is it a rate measured across it?
   *  The wizard's preview copy reads differently for each ("Spend over the last
   *  24 hours" vs "Error rate measured over 24 hours"), and only `cumulative`
   *  conditions are expected to grow with the window. */
  accrual: "cumulative" | "rate";
  /** Suffix for the threshold input's trailing adornment. */
  thresholdSuffix: string;
  /** Display precision. `formatObservedValue` reads this, so the stored number
   *  and the rendered number are never two different claims. */
  decimals: number;
  /** Where the value comes from, in one line — kept next to the condition so
   *  the provenance survives a future edit to this file. */
  source: string;
};

export const CONDITION_CATALOG = {
  cost_threshold: {
    label: "Spend threshold",
    description:
      "Fires when workspace spend accrued over the window reaches the threshold.",
    unit: "usd",
    accrual: "cumulative",
    thresholdSuffix: "USD",
    decimals: 2,
    source: "TOTAL_7D_BASE_DOLLARS scaled to the window",
  },
  error_rate: {
    label: "Error rate",
    description:
      "Fires when the share of requests returning an upstream error reaches the threshold.",
    unit: "percent",
    accrual: "rate",
    thresholdSuffix: "%",
    decimals: 1,
    source: "share of REQUEST_ROWS_* with status === 'error'",
  },
  tokens_per_hour: {
    label: "Tokens per hour",
    description:
      "Fires when the average hourly token throughput across the window reaches the threshold.",
    unit: "tokens_per_hour",
    accrual: "rate",
    thresholdSuffix: "tokens / hr",
    decimals: 0,
    source: "TOTAL_7D_BASE_TOKENS scaled to the window, divided by its hours",
  },
  security_events: {
    label: "Security events",
    description:
      "Fires when the number of guardrail actions — blocked, flagged, or redacted — reaches the threshold.",
    unit: "count",
    accrual: "cumulative",
    thresholdSuffix: "events",
    decimals: 0,
    source: "eventsTotal() for the matching range",
  },
  latency_p95: {
    label: "p95 latency",
    description:
      "Fires when the 95th-percentile request latency over the window reaches the threshold.",
    unit: "ms",
    accrual: "rate",
    thresholdSuffix: "ms",
    decimals: 0,
    source: "95th percentile of REQUEST_ROWS_* latency",
  },
} satisfies Record<AlertConditionType, ConditionMeta>;

/* ─── Observed values ───────────────────────────────────────────────────── */

const PERCENT = 100;
const MS_PER_SECOND = 1000;
const P95 = 95;

function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

/** Request population for a window, chosen by its days-equivalent.
 *
 *  The site models request volume per RANGE, not per day: `REQUEST_ROWS_24H` is
 *  the 24-hour population and `REQUEST_ROWS_7D` the 7-day one. There is no
 *  per-day population between them, so a window reads the coarsest real sample
 *  that fits — exactly one day reads the single-day population, any multi-day
 *  window (2 days through a week) reads the multi-day one. Both rate conditions
 *  inherit this, and it is the one place the existing constants cannot support a
 *  window at day granularity; the alternative would be fabricating a per-day
 *  request sample that was never captured. Callers only reach it for windows
 *  inside the 7-day horizon. */
function rowsForDays(days: number): RequestRow[] {
  return days <= 1 ? REQUEST_ROWS_24H : REQUEST_ROWS_7D;
}

/** Latency in seconds off the row's display string ("2.30s" → 2.3). */
function latencySeconds(row: RequestRow): number {
  return Number.parseFloat(row.latency);
}

/** Linear-interpolated percentile (the R-7 / NumPy-default definition) over a
 *  pre-sorted ascending series. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const rank = (p / PERCENT) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const at = (i: number) => sorted[i] ?? 0;
  if (low === high) {
    return at(low);
  }
  return at(low) + (at(high) - at(low)) * (rank - low);
}

function errorRatePercent(rows: RequestRow[]): number {
  if (rows.length === 0) {
    return 0;
  }
  const errors = rows.filter((row) => row.status === "error").length;
  return (errors / rows.length) * PERCENT;
}

function latencyP95Ms(rows: RequestRow[]): number {
  const sorted = rows
    .map(latencySeconds)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  return percentile(sorted, P95) * MS_PER_SECOND;
}

/** Security-event count for a d-day window (1 ≤ d ≤ 7). Anchored on the site's
 *  two real range totals — 12 for one day (`eventsTotal("24h")`) and 117 for a
 *  week (`eventsTotal("7d")`) — so the Alerts page and the Security page cannot
 *  disagree at either end, and linearly interpolated between, the same
 *  documented approximation the cost scale uses. Reads its endpoints, not
 *  `d × EVENTS_PER_DAY`, precisely because the site authors those two totals
 *  independently (a week is not seven average days). */
function securityEventCount(days: number): number {
  const DAY_TOTAL = eventsTotal("24h", null);
  const WEEK_TOTAL = eventsTotal("7d", null);
  if (days <= 1) {
    return DAY_TOTAL;
  }
  return Math.round(
    DAY_TOTAL +
      ((days - 1) * (WEEK_TOTAL - DAY_TOTAL)) / (HONEST_HORIZON_DAYS - 1)
  );
}

/**
 * The current observed value for a condition over a window, in the condition's
 * unit, already rounded to its display precision — or `null` when the window
 * reaches past the workload's 7-day horizon.
 *
 * ONE source of truth. The wizard's live preview under the window field, the
 * Events tab's observed-vs-threshold column, every seeded threshold, and every
 * seeded firing all read this function — so the preview, the rows, and the KPIs
 * reconcile by construction rather than by three places agreeing to type the
 * same number.
 *
 * THE HONESTY BOUNDARY. The workload constants span ~7 days. A window longer
 * than that (any month, any year, weeks beyond one, days beyond seven) has no
 * full period in the data, so this returns `null` and every caller shows
 * "not enough history yet" rather than an invented figure. There is no code
 * path that extrapolates a longer window.
 */
export function observedValue(
  condition: AlertConditionType,
  window: AlertWindow
): number | null {
  if (!windowHasHistory(window)) {
    return null;
  }
  const days = windowDays(window);
  const scale = windowScale(days);
  const { decimals } = CONDITION_CATALOG[condition];
  switch (condition) {
    case "cost_threshold":
      return round(TOTAL_7D_BASE_DOLLARS * scale, decimals);
    case "tokens_per_hour":
      return round(
        (TOTAL_7D_BASE_TOKENS * scale) / (days * HOURS_PER_DAY),
        decimals
      );
    case "security_events":
      return round(securityEventCount(days), decimals);
    case "error_rate":
      return round(errorRatePercent(rowsForDays(days)), decimals);
    case "latency_p95":
      return round(latencyP95Ms(rowsForDays(days)), decimals);
    default:
      return 0;
  }
}

/** `observedValue` for a SEEDED rule or template. Every seed sits inside the
 *  honest 7-day window by construction (§Seeds keeps them there), so a `null`
 *  here is a seed bug, not a runtime state — throwing makes it fail at module
 *  load and in the test import instead of silently seeding a zero. */
function seedObserved(
  condition: AlertConditionType,
  window: AlertWindow
): number {
  const value = observedValue(condition, window);
  if (value === null) {
    throw new Error(
      `Seed ${condition} at ${formatWindow(window)} exceeds the 7-day workload horizon; seeds must stay inside it.`
    );
  }
  return value;
}

/** Display string for a value in a condition's unit. Currency through the
 *  shared `formatCurrency` (2dp), counts and token rates through `formatNumber`
 *  so grouping follows the user's locale, percentages at one decimal per the
 *  site's compression-percent convention. Units that are intrinsic to reading
 *  the number (`$`, `%`, `/hr`, `ms`) are included; a bare event count is not
 *  suffixed, because the surface that shows it labels the column.
 *
 *  The token rate is `600,000/hr`, unspaced. It was `600,000 / hr` until
 *  2026-08-05: the spaced form is 17px wider in `type-mono-14`, and it was the
 *  single widest cell in the Rules table — enough on its own to push the nine
 *  columns past their card at the `xl` cap. Unspaced is also how a rate reads
 *  in running text ("$/hr", "km/h"), so the tighter form is the more correct
 *  one; the space was never the convention here. `ms` keeps its space because
 *  that is a unit following a number, not a denominator. */
export function formatObservedValue(
  condition: AlertConditionType,
  value: number
): string {
  const meta = CONDITION_CATALOG[condition];
  const rounded = round(value, meta.decimals);
  switch (meta.unit) {
    case "usd":
      return formatCurrency(rounded);
    case "percent":
      return `${rounded.toFixed(meta.decimals)}%`;
    case "tokens_per_hour":
      return `${formatNumber(rounded)}/hr`;
    case "ms":
      return `${formatNumber(rounded)} ms`;
    default:
      return formatNumber(rounded);
  }
}

/* ─── Ids and timestamps ────────────────────────────────────────────────── */

/** Deterministic 8-hex digest (FNV-1a). Gives ids in the site's existing shape
 *  (`cnv_9fed01e5`) without hand-typing hex, and keeps them stable across runs
 *  so a deep link into a firing does not change between builds. */
function shortHex(seed: string): string {
  const OFFSET_BASIS = 0x81_1c_9d_c5;
  const PRIME = 0x01_00_01_93;
  const HEX_WIDTH = 8;
  let hash = OFFSET_BASIS;
  for (const char of seed) {
    hash = Math.imul(hash ^ char.charCodeAt(0), PRIME) >>> 0;
  }
  return hash.toString(16).padStart(HEX_WIDTH, "0");
}

/** The fixture year `minutesBeforeAnchor` uses as scaffolding. It returns only
 *  month/day/hour/minute, so the year is re-applied here to build a real Date
 *  for sorting and for the shared `formatTimestamp`. Never `new Date()` — the
 *  same reason `ANCHOR` is a constant: these rows must not drift between
 *  renders or test runs. */
const ANCHOR_YEAR = 2026;

function anchorDate(minutesAgo: number): Date {
  const { month, day, hour, minute } = minutesBeforeAnchor(minutesAgo);
  return new Date(ANCHOR_YEAR, month, day, hour, minute);
}

/* ─── Seeded rules ──────────────────────────────────────────────────────── */

/**
 * A threshold as a FACTOR of what the window currently reads, rounded to a step
 * an operator would actually type.
 *
 * This is the whole no-synthetic-numbers mechanism: the factor is the product
 * decision (0.9 = "we crossed this", 1.25 = "leave headroom"), the number is
 * arithmetic over live constants. Re-price the model catalog tomorrow and these
 * thresholds move with it instead of quietly becoming fiction.
 */
function thresholdFor(
  condition: AlertConditionType,
  window: AlertWindow,
  factor: number,
  step: number
): number {
  const raw = seedObserved(condition, window) * factor;
  const CENTS = 2;
  return round(Math.round(raw / step) * step, CENTS);
}

type RuleSeed = {
  name: string;
  condition: AlertConditionType;
  window: AlertWindow;
  severity: AlertSeverity;
  enabled: boolean;
  /** Threshold as a multiple of the window's observed value. Below 1 = already
   *  crossed, so the rule has a firing history; above 1 = headroom. */
  factor: number;
  /** Rounding step for the derived threshold, in the condition's unit. */
  step: number;
  channels: AlertChannel[];
  /** Whether this rule owns seeded firings. A disabled rule owns none. */
  fires: boolean;
};

const OPS_EMAIL = "ops@constellationgate.ai";
const SECURITY_EMAIL = "security@constellationgate.ai";
const PAGERDUTY_WEBHOOK = "https://events.pagerduty.com/integration/v2/enqueue";

/** Four rules, four conditions, mixed severities, one switched off. Names are
 *  what an operator writes, not what a fixture generator writes. */
const RULE_SEEDS: RuleSeed[] = [
  {
    name: "Daily spend cap",
    condition: "cost_threshold",
    window: { count: 1, unit: "day" },
    severity: "critical",
    enabled: true,
    factor: 0.9,
    step: 5,
    channels: [
      { type: "email", target: OPS_EMAIL },
      { type: "slack", target: "#gate-ops" },
    ],
    fires: true,
  },
  {
    name: "Error rate spike",
    condition: "error_rate",
    // Migrated off the removed "1h" unit. Error rate reads the 24-hour request
    // population at any window of one day or less, so a one-day window reads the
    // exact same sample the old "1h" did — the observed value, and this derived
    // threshold, are unchanged; only the honest label moved.
    window: { count: 1, unit: "day" },
    severity: "warning",
    enabled: true,
    factor: 0.75,
    step: 0.5,
    channels: [
      { type: "slack", target: "#gate-oncall" },
      { type: "webhook", target: PAGERDUTY_WEBHOOK },
    ],
    fires: true,
  },
  {
    name: "Guardrail event burst",
    condition: "security_events",
    window: { count: 1, unit: "day" },
    severity: "critical",
    enabled: true,
    factor: 0.5,
    step: 1,
    channels: [
      { type: "email", target: SECURITY_EMAIL },
      { type: "slack", target: "#gate-security" },
      { type: "webhook", target: PAGERDUTY_WEBHOOK },
    ],
    fires: true,
  },
  {
    // Off since the eval backfill — kept so the history stays readable, which
    // is also why a disabled rule must still render in the Rules table.
    name: "Token throughput ceiling",
    condition: "tokens_per_hour",
    // Migrated off the removed "1h" unit. Token throughput is an hourly RATE, so
    // its value is invariant to the window's length past the sample it reads;
    // one day reads the same 24-hour scale the old "1h" did, so the observed
    // hourly figure and this headroom threshold are unchanged.
    window: { count: 1, unit: "day" },
    severity: "info",
    enabled: false,
    factor: 1.25,
    step: 25_000,
    channels: [{ type: "email", target: OPS_EMAIL }],
    fires: false,
  },
];

const FIRINGS_PER_RULE = 4;

/**
 * When rule `ruleIndex` fired for the `k`-th time, in minutes before the mock
 * anchor (k = 0 is the most recent).
 *
 * Spacing is one window per firing, which is the honest cadence: a rule with a
 * 1-day window cannot legitimately fire twice in the same day. The per-rule
 * phase is a 24th of that same window, so three rules on the same schedule do
 * not all land on the identical minute — no clock constant is invented, every
 * offset is a multiple of the rule's own window.
 */
function firingMinutesAgo(
  ruleIndex: number,
  k: number,
  window: AlertWindow
): number {
  const MINUTES_PER_DAY = HOURS_PER_DAY * 60;
  const windowMinutes = windowDays(window) * MINUTES_PER_DAY;
  const phase = Math.round(((ruleIndex + 1) * windowMinutes) / HOURS_PER_DAY);
  return phase + k * windowMinutes;
}

export const SEEDED_ALERT_RULES: AlertRule[] = RULE_SEEDS.map(
  (seed, index) => ({
    id: `alr_${shortHex(seed.name)}`,
    name: seed.name,
    condition: seed.condition,
    threshold: thresholdFor(
      seed.condition,
      seed.window,
      seed.factor,
      seed.step
    ),
    window: seed.window,
    severity: seed.severity,
    enabled: seed.enabled,
    channels: seed.channels,
    // One window older than its oldest firing — the rule existed before it fired.
    createdAt: anchorDate(
      firingMinutesAgo(index, FIRINGS_PER_RULE, seed.window)
    ),
    lastFiredAt: seed.fires
      ? anchorDate(firingMinutesAgo(index, 0, seed.window))
      : null,
  })
);

/* ─── Seeded firings ────────────────────────────────────────────────────── */

/** Triage state by age: the two newest firings are still open, the next has
 *  been picked up, the oldest is closed. Indexed by firing index `k`. */
const STATUS_BY_AGE: AlertEventStatus[] = [
  "open",
  "open",
  "acknowledged",
  "resolved",
];

export const SEEDED_ALERT_EVENTS: AlertEvent[] = (() => {
  const events: AlertEvent[] = SEEDED_ALERT_RULES.flatMap((rule, index) => {
    if (!RULE_SEEDS[index].fires) {
      return [];
    }
    return Array.from({ length: FIRINGS_PER_RULE }, (_unused, k) => ({
      id: `alv_${shortHex(`${rule.id}:${k}`)}`,
      ruleId: rule.id,
      firedAt: anchorDate(firingMinutesAgo(index, k, rule.window)),
      // Computed, never a literal: the value the rule would read right now for
      // its own condition and window. Every seeded rule sits inside the 7-day
      // horizon, so this is always a real number (`seedObserved` throws if a
      // seed ever strays past it).
      observed: seedObserved(rule.condition, rule.window),
      thresholdAtFiring: rule.threshold,
      status: STATUS_BY_AGE[k] ?? "resolved",
      deliveries: rule.channels.map((channel) => ({
        channel,
        outcome: "delivered" as ChannelDeliveryOutcome,
      })),
    }));
  });

  // Delivery outcomes are positional rather than authored, so they follow the
  // schedule instead of encoding assumptions about which rule is newest.
  // Newest firing with a webhook is still in flight; the one before it is the
  // failure every real integration eventually shows.
  const webhookFirings = events
    .filter((event) =>
      event.deliveries.some((d) => d.channel.type === "webhook")
    )
    .sort((a, b) => b.firedAt.getTime() - a.firedAt.getTime());
  const setWebhookOutcome = (
    event: AlertEvent | undefined,
    outcome: ChannelDeliveryOutcome
  ) => {
    for (const delivery of event?.deliveries ?? []) {
      if (delivery.channel.type === "webhook") {
        delivery.outcome = outcome;
      }
    }
  };
  setWebhookOutcome(webhookFirings[0], "pending");
  setWebhookOutcome(webhookFirings[1], "failed");

  return events;
})();

/* ─── Wizard templates ─────────────────────────────────────────────────── */

type TemplateSeed = {
  name: string;
  description: string;
  condition: AlertConditionType;
  window: AlertWindow;
  severity: AlertSeverity;
  factor: number;
  step: number;
  /** Channel type the wizard pre-selects. No target — that is the operator's to
   *  supply, and `validateChannelTarget` gates it. */
  channelType: AlertChannelType;
};

/** Starter templates for the create wizard's pre-fill and for the
 *  template-seeded empty state. Every factor is ABOVE 1 on purpose: a rule
 *  created from a template must not fire the instant it is saved, or the
 *  operator's first experience of alerting is a false positive. Between them
 *  the four cover the one condition no seeded rule uses (`latency_p95`), so the
 *  catalog is fully exercised by the fixtures. */
const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    name: "Daily spend cap",
    description:
      "Catch a spend spike the day it happens instead of at the invoice.",
    condition: "cost_threshold",
    window: { count: 1, unit: "day" },
    severity: "critical",
    factor: 1.25,
    step: 5,
    channelType: "email",
  },
  {
    name: "Error rate spike",
    description:
      "Page someone when upstream failures climb past a normal hour.",
    condition: "error_rate",
    // Off the removed "1h": a one-day window is the shortest supported, and
    // error rate reads the same 24-hour population there, so the suggested
    // threshold is unchanged.
    window: { count: 1, unit: "day" },
    severity: "critical",
    factor: 1.5,
    step: 0.5,
    channelType: "webhook",
  },
  {
    name: "p95 latency regression",
    description:
      "Notice a slow provider before users describe the app as broken.",
    condition: "latency_p95",
    window: { count: 1, unit: "day" },
    severity: "warning",
    factor: 1.2,
    step: 1000,
    channelType: "slack",
  },
  {
    name: "Guardrail event burst",
    description:
      "Know when blocks, flags, and redactions cluster — the shape of an attack.",
    condition: "security_events",
    window: { count: 1, unit: "day" },
    severity: "warning",
    factor: 1.5,
    step: 5,
    channelType: "slack",
  },
];

export const ALERT_TEMPLATES: {
  id: string;
  name: string;
  description: string;
  condition: AlertConditionType;
  window: AlertWindow;
  severity: AlertSeverity;
  /** Pre-filled threshold, derived with headroom over the current observed
   *  value. Editable in the wizard — this is a starting point, not a lock. */
  threshold: number;
  channelType: AlertChannelType;
}[] = TEMPLATE_SEEDS.map((seed) => ({
  id: `alt_${shortHex(`template:${seed.name}`)}`,
  name: seed.name,
  description: seed.description,
  condition: seed.condition,
  window: seed.window,
  severity: seed.severity,
  threshold: thresholdFor(seed.condition, seed.window, seed.factor, seed.step),
  channelType: seed.channelType,
}));

/* ─── Channel validation ───────────────────────────────────────────────── */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
/** Slack channel name: `#` + lowercase alphanumeric, dot, hyphen, underscore.
 *  Slack's own cap is 80 characters including the `#`. */
const SLACK_NAME_PATTERN = /^#[a-z0-9][a-z0-9._-]{0,78}$/;
/** Slack channel ID: `C` (public/private) or `G` (legacy group) + 8-10 more. */
const SLACK_ID_PATTERN = /^[CG][A-Z0-9]{8,10}$/;

const CHANNEL_NOUN: Record<AlertChannelType, string> = {
  email: "email address",
  slack: "Slack channel",
  webhook: "webhook URL",
};

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate one channel target. Returns an error message to show under the
 * field, or null when the target is well-formed.
 *
 * A pure function on purpose: the wizard's form code stays thin, the seed data
 * above is checked by the same rules the operator is held to, and the test file
 * can assert both directions without rendering anything.
 */
export function validateChannelTarget(
  type: AlertChannelType,
  target: string
): string | null {
  const value = target.trim();
  if (value === "") {
    return `Add ${type === "email" ? "an" : "a"} ${CHANNEL_NOUN[type]}.`;
  }
  switch (type) {
    case "email":
      return EMAIL_PATTERN.test(value)
        ? null
        : `Enter a valid email address, e.g. ${OPS_EMAIL}.`;
    case "slack":
      return SLACK_NAME_PATTERN.test(value) || SLACK_ID_PATTERN.test(value)
        ? null
        : "Use a channel name like #gate-alerts or a channel ID like C01ABC2DEF3.";
    default:
      return isHttpsUrl(value)
        ? null
        : "Webhook URLs must start with https:// — plain http is rejected.";
  }
}
