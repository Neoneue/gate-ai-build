/**
 * Shared Alerts types. Leaf module in the same shape as
 * `pages/conversations/types.ts` and `pages/requests/types.ts`: types only, no
 * runtime, and it imports nothing from a page — so the data layer, the Rules
 * tab, the create wizard, and the Events tab all pull their types from here
 * without a cycle.
 *
 * The model is deliberately small. An alert rule is one condition, one
 * threshold, one window, and a fan-out list of channels; a rule fires when the
 * observed value for its condition over its window reaches the threshold. There
 * is no comparator axis (every condition is `observed >= threshold`), no
 * percent-change mode, and no per-key scope — the product is org-scoped.
 */

/** Operator-assigned urgency. Drives badge tone and notification copy only;
 *  it does NOT affect whether a rule fires. */
export type AlertSeverity = "info" | "warning" | "critical";

/**
 * What a rule watches. Closed set — every condition must have an entry in
 * `CONDITION_CATALOG` and a derivation in `observedValue()`, so adding one is a
 * two-file change and cannot ship half-wired.
 *
 * Two accrual families sit inside this union, and the difference matters when
 * reading a value (see `CONDITION_CATALOG[c].accrual`):
 *   • cumulative — `cost_threshold`, `security_events`. The value accrues over
 *     the window, so a longer window always reads higher.
 *   • rate       — `error_rate`, `tokens_per_hour`, `latency_p95`. The value is
 *     a ratio, average, or percentile measured across the window, so a longer
 *     window is not automatically a bigger number.
 */
export type AlertConditionType =
  | "cost_threshold"
  | "error_rate"
  | "tokens_per_hour"
  | "security_events"
  | "latency_p95";

/** Unit of a measurement window. No hour: the smallest unit an operator picks
 *  is a day, and the units above it (week / month / year) are what a longer
 *  lookback is expressed in. */
export type AlertWindowUnit = "day" | "week" | "month" | "year";

/** Measurement window as a composed duration: a positive integer `count` of a
 *  `unit`. "2 days", "1 week", "4 months", "2 years". Replaces the old fixed
 *  `"1h" | "1d" | "1w"` enum so an operator can name any lookback.
 *
 *  Honesty boundary: the workload fixtures span ~7 days, so only windows whose
 *  days-equivalent is ≤ 7 have a real observed value (see `observedValue` and
 *  `windowDays` in `data.ts`). Anything longer — every month, every year, weeks
 *  beyond one, days beyond seven — has no full period in the data yet and
 *  `observedValue` returns `null` rather than a fabricated figure. `count` is
 *  always ≥ 1. */
export type AlertWindow = { count: number; unit: AlertWindowUnit };

export type AlertChannelType = "email" | "slack" | "webhook";

/** One notification destination. `target` is type-dependent — an email
 *  address, a Slack `#channel` or channel ID, or an https webhook URL — and is
 *  validated by `validateChannelTarget()`, which the wizard shares with this
 *  module so the form and the seed data agree on what is well-formed. */
export type AlertChannel = {
  type: AlertChannelType;
  target: string;
};

export type AlertRule = {
  /** `alr_` + 8 hex. Same shape as the site's other entity ids (`cnv_9fed01e5`,
   *  `req_*`, `evt_*`); derived from the rule name, never hand-typed. */
  id: string;
  /** What an operator would actually call it ("Daily spend cap"). */
  name: string;
  condition: AlertConditionType;
  /** Fires when the observed value reaches this. Units follow the condition —
   *  USD, percent, tokens/hour, event count, or milliseconds — per
   *  `CONDITION_CATALOG[condition].unit`. */
  threshold: number;
  window: AlertWindow;
  severity: AlertSeverity;
  /** A disabled rule is evaluated by nothing and notifies no one. It keeps its
   *  history, so `lastFiredAt` may be set on a rule that is off today. */
  enabled: boolean;
  /** Fan-out list — one firing notifies every channel, and each delivery
   *  succeeds or fails independently (see `AlertEvent.deliveries`). */
  channels: AlertChannel[];
  /** When the rule was created. Derived from the mock anchor, not `new Date()`,
   *  so table sort order is stable across renders and test runs. */
  createdAt: Date;
  /** Most recent firing, or null for a rule that has never fired. Always equals
   *  the newest `AlertEvent.firedAt` carrying this rule's id. */
  lastFiredAt: Date | null;
};

/** Triage state of a single firing. `open` needs someone; `acknowledged` means
 *  a human has it; `resolved` means the condition cleared or was fixed. */
export type AlertEventStatus = "open" | "acknowledged" | "resolved";

/** Outcome of pushing one firing to one channel. `pending` is in-flight, not a
 *  terminal state — only the newest firing should carry it. */
export type ChannelDeliveryOutcome = "delivered" | "failed" | "pending";

/**
 * One firing of one rule. Records the numbers AS OBSERVED at firing time:
 * `observed` and `thresholdAtFiring` are both stored so the Events tab can
 * still explain a historical firing after the rule's threshold is edited.
 *
 * Carries no `requestId` / `conversationId` / event-id backlink by design —
 * every condition is an aggregate over a window, not a property of one row, so
 * there is no single request a firing could honestly point at.
 */
export type AlertEvent = {
  /** `alv_` + 8 hex, derived from the rule id + firing index. */
  id: string;
  /** Always resolves to an `AlertRule.id` in `SEEDED_ALERT_RULES`. */
  ruleId: string;
  firedAt: Date;
  /** The observed value that crossed the threshold, in the condition's unit.
   *  Format it with `formatObservedValue(rule.condition, observed)`. */
  observed: number;
  /** The rule's threshold at the moment it fired — snapshot, not a live read of
   *  `AlertRule.threshold`. */
  thresholdAtFiring: number;
  status: AlertEventStatus;
  /** One entry per channel the rule had when it fired. Inlined rather than
   *  broken out as a named type: it is only ever read through an `AlertEvent`,
   *  and a standalone `AlertDelivery` export would invite drift from
   *  `AlertRule.channels`. */
  deliveries: {
    channel: AlertChannel;
    outcome: ChannelDeliveryOutcome;
  }[];
};
