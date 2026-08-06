import {
  CircleAlertIcon,
  DollarSignIcon,
  FlagIcon,
  GaugeIcon,
  InfoIcon,
  type LucideIcon,
  OctagonAlertIcon,
  ShieldAlertIcon,
  TimerIcon,
} from "lucide-react";
import { CONDITION_CATALOG, windowDays } from "./data";
import type {
  AlertChannelType,
  AlertConditionType,
  AlertEvent,
  AlertEventStatus,
  AlertRule,
  AlertSeverity,
  ChannelDeliveryOutcome,
} from "./types";

/**
 * Presentation vocabulary shared by the Rules tab, the Events tab, the firing
 * dialog and the create wizard: badge tones, sort ordinals, display labels, and
 * the sort accessors.
 *
 * Component-free on purpose, the same split `data.ts` keeps. Both live outside
 * the page modules so a table, a dialog and a form can agree on what "critical"
 * looks like without importing each other — and so `react-refresh` never sees a
 * module exporting a component next to a constant.
 *
 * The line between this file and `data.ts`: `data.ts` owns what is TRUE (the
 * catalog, the derived observed values, the seeds, validation). This file owns
 * how it is SHOWN. Nothing here invents a value.
 */

/* ─── Conditions and windows ────────────────────────────────────────────── */

/** Every condition in catalog order — the wizard's step-1 list, the Rules
 *  filter, and the source of both orderings. */
export const CONDITION_ORDER = Object.keys(
  CONDITION_CATALOG
) as AlertConditionType[];

/** Windows now sort by their days-equivalent (`windowDays`), so the Rules
 *  column orders "1 day < 2 days < 1 week < 3 months < 2 years" by real
 *  duration rather than by the label's text. The old per-literal order map is
 *  gone with the enum. */

/**
 * Glyph per condition — the wizard's step-1 tiles and the firing dialog's
 * Condition row.
 *
 * It lives in the UI layer beside the badge maps, never in `data.ts`: the
 * catalog owns what a condition IS, this owns what it LOOKS like, and a data
 * module that imported an icon set would drag React into the one file the tests
 * read without rendering anything.
 *
 * **Every choice avoids a glyph already bound to a nav item**, because a second
 * meaning for the same shape is worse than no glyph:
 *   • `DollarSign` — spend. `CreditCard` is Billing, `Coins` is Token Savings.
 *   • `CircleAlert` — errors. `TriangleAlert` is the Security-events nav item.
 *   • `Gauge`      — a throughput RATE, which is what tokens-per-hour is.
 *                    `Coins` would read "money" and is the Token Savings nav
 *                    glyph besides.
 *   • `ShieldAlert`— guardrail actions. `Shield` is Limits, `ShieldCheck` is in
 *                    use elsewhere; the alert badge distinguishes this one.
 *   • `Timer`      — latency. Unbound, and the most literal glyph in the set.
 */
export const CONDITION_ICON: Record<AlertConditionType, LucideIcon> = {
  cost_threshold: DollarSignIcon,
  error_rate: CircleAlertIcon,
  tokens_per_hour: GaugeIcon,
  security_events: ShieldAlertIcon,
  latency_p95: TimerIcon,
};

/* ─── Severity ──────────────────────────────────────────────────────────── */

/** Urgency ranking, so sorting Severity puts the rules that page someone at one
 *  end instead of ordering them "critical, info, warning" alphabetically. */
export const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

/** Filter/picker order — least to most urgent, matching `SEVERITY_ORDER`. */
export const SEVERITY_VALUES: AlertSeverity[] = ["info", "warning", "critical"];

export const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

/** Tone per severity. Badge's own status variants — no new tones. Info takes
 *  the blue `info` variant (`bg-blue-700/10 text-blue-600`, badge.tsx), so the
 *  Severity column matches the blue the wizard's Info tile already uses;
 *  warning and critical keep their semantic tones. */
export const SEVERITY_BADGE: Record<
  AlertSeverity,
  "info" | "warning" | "destructive"
> = {
  info: "info",
  warning: "warning",
  critical: "destructive",
};

/**
 * Glyph per severity — the STATIC title glyph on every step-2 severity tile,
 * shown regardless of selection. Independent of `SEVERITY_TILE_SELECTED`, which
 * is the selected-only border and fill; both apply together.
 *
 * **`TriangleAlert` is deliberately absent.** It is the canonical warning glyph
 * and it is also the Security-events NAV item, so using it here would give one
 * shape two meanings one level apart — the constraint that also kept it out of
 * `CONDITION_ICON`. lucide has no second triangle-alert, so the geometric
 * circle → triangle → octagon ladder is not available; these three are the best
 * unbound set:
 *   • `Info`        — literal and universal for "awareness only".
 *   • `Flag`        — the site's OWN warning verb: the Policies action named
 *                     `flag` is the one that carries `border-warning-500` /
 *                     `bg-warning-25`, the exact tone the Warning tile takes on
 *                     selection. Flagging something IS the warning action here.
 *   • `OctagonAlert`— top-of-scale stop semantics for "act immediately".
 *
 * None is bound to a nav item, and none repeats a glyph from `CONDITION_ICON`,
 * so no two tiles in the same wizard can read as the same thing.
 */
export const SEVERITY_ICON: Record<AlertSeverity, LucideIcon> = {
  info: InfoIcon,
  warning: FlagIcon,
  critical: OctagonAlertIcon,
};

/**
 * Border + fill for a SELECTED severity tile in the wizard. Unselected tiles
 * keep `OptionTile`'s own neutral chrome, exactly like the condition tiles and
 * the unselected Policies actions.
 *
 * The warning and critical strings are `policies/config.ts`'s
 * `ACTION_ACTIVE_BORDER` + `ACTION_ACTIVE_FILL` for `flag` and `block`,
 * VERBATIM — this is the same "tinted selected surface" job, and the site
 * already sanctions these ramp steps for it. Each carries its own dark
 * counterpart, so the pair flips rather than being a raw ramp frozen in light.
 * `border-destructive` needs no `dark:` because it is already semantic.
 *
 * Info takes the blue equivalent of that same `-25` pattern rather than
 * `Badge variant="info"`'s heavier `bg-blue-700/10` wash. Reason: the three
 * tones have to read as ONE ladder, and a 10% blue-700 fill is visibly stronger
 * than a `-25` tint — it would make the LEAST urgent severity the loudest tile
 * on the step, inverting the hierarchy the tones exist to express. Ink is
 * untouched on all three; this is border and fill only.
 */
export const SEVERITY_TILE_SELECTED: Record<AlertSeverity, string> = {
  info: "border-blue-500 bg-blue-25 dark:border-blue-400 dark:bg-blue-500/10",
  warning:
    "border-warning-500 bg-warning-25 dark:border-warning-400 dark:bg-warning-500/10",
  critical: "border-destructive bg-danger-25 dark:bg-danger-500/10",
};

/* ─── Firing status ─────────────────────────────────────────────────────── */

/** Triage ranking: what still needs a human sorts to one end. */
export const STATUS_ORDER: Record<AlertEventStatus, number> = {
  open: 0,
  acknowledged: 1,
  resolved: 2,
};

export const STATUS_VALUES: AlertEventStatus[] = [
  "open",
  "acknowledged",
  "resolved",
];

export const STATUS_LABEL: Record<AlertEventStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

/**
 * Tone per triage status, from Badge's existing status variants.
 *
 * The tones track the LIFECYCLE, not the severity: `open` is the only state
 * that still needs a human, so it takes the danger tone; `acknowledged` means
 * someone has it but the condition has not cleared, which is the warning tone's
 * exact meaning; `resolved` is the one genuinely good outcome on this surface,
 * so it earns `success` rather than `neutral` — a triage queue where the
 * finished rows read as merely "inactive" hides the thing an operator most
 * wants to see, which is progress.
 *
 * Severity and status therefore both reach for the danger tone on a critical
 * open firing. That is not a collision to design away: they are two independent
 * axes (how bad it is / whether anyone has it) and a row that is both is
 * genuinely the most urgent row in the table.
 */
export const STATUS_BADGE: Record<
  AlertEventStatus,
  "destructive" | "warning" | "success"
> = {
  open: "destructive",
  acknowledged: "warning",
  resolved: "success",
};

/** The next triage state, or null when the firing is already terminal. Drives
 *  both the row menu and the dialog footer, so the two cannot disagree about
 *  what is available. */
export function nextStatuses(status: AlertEventStatus): AlertEventStatus[] {
  if (status === "open") {
    return ["acknowledged", "resolved"];
  }
  if (status === "acknowledged") {
    return ["resolved"];
  }
  return [];
}

/** Verb for a transition, for buttons and menu items. */
export const STATUS_ACTION_LABEL: Record<AlertEventStatus, string> = {
  open: "Reopen",
  acknowledged: "Acknowledge",
  resolved: "Resolve",
};

/* ─── Channels and delivery ─────────────────────────────────────────────── */

/** Display order for the channel glyph cluster, so two rules with the same
 *  channel types always render them in the same order regardless of the order
 *  the operator happened to add them in. */
export const CHANNEL_GLYPH_ORDER: AlertChannelType[] = [
  "email",
  "slack",
  "webhook",
];

export const CHANNEL_NAME: Record<AlertChannelType, string> = {
  email: "Email",
  slack: "Slack",
  webhook: "Webhook",
};

/** The distinct channel TYPES a rule notifies, in display order. Three Slack
 *  channels are still one Slack glyph. */
export function channelTypesOf(rule: AlertRule): AlertChannelType[] {
  return CHANNEL_GLYPH_ORDER.filter((type) =>
    rule.channels.some((channel) => channel.type === type)
  );
}

/** Channel-type list as prose, for the glyph cluster's accessible name. */
export function channelSummary(rule: AlertRule): string {
  return channelTypesOf(rule)
    .map((type) => CHANNEL_NAME[type])
    .join(", ");
}

/**
 * Dot tone per delivery outcome.
 *
 * `pending` is `neutral`, not `warning`: it is in-flight, and nothing has gone
 * wrong yet. Painting an in-flight delivery amber would report the operator's
 * own latency as a problem, and would leave no tone free for the state that IS
 * a problem.
 */
export const DELIVERY_DOT: Record<
  ChannelDeliveryOutcome,
  "success" | "danger" | "neutral"
> = {
  delivered: "success",
  failed: "danger",
  pending: "neutral",
};

export const DELIVERY_LABEL: Record<ChannelDeliveryOutcome, string> = {
  delivered: "Delivered",
  failed: "Failed",
  pending: "Pending",
};

/* ─── Shared call-site recipes ──────────────────────────────────────────── */

/**
 * Layout-only override that lets `<OptionTile>` carry a title + description
 * stack instead of the single centred line its two original call sites needed.
 *
 * Box and flow utilities only — intrinsic height, direction, alignment,
 * internal padding, text alignment. None of them touches colour, border,
 * radius, shadow, weight, size or tracking, so the tile keeps every visual the
 * primitive owns, including its `rounded-md` and both fills. `Limits.tsx` makes
 * the same move on `<SelectItem>` (`h-auto items-start py-2`) for its two-line
 * key rows. It lives here rather than being pasted per file so the consumers
 * cannot drift; if a third surface appears, it becomes an `OptionTile` size.
 */
export const DESCRIBED_TILE = "h-auto flex-col items-start gap-1 p-4 text-left";

/** `alr_` + 8 hex — the shape every seeded rule carries. `data.ts` derives its
 *  hex from the rule name so a fixture stays stable across runs; a rule the
 *  operator just created has no such requirement, so it takes a random one. */
export function newAlertRuleId(): string {
  return `alr_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

/* ─── Rows and sort accessors ───────────────────────────────────────────── */

/**
 * A firing joined to the rule that produced it.
 *
 * The join is live rather than snapshotted: severity, condition and window are
 * properties of the RULE (an `AlertEvent` records only what was measured), so
 * renaming or re-tuning a rule in the wizard updates its history too. The
 * numbers stay frozen — `observed` and `thresholdAtFiring` are on the event
 * precisely so an old firing can still be explained after the rule moves.
 *
 * `rule` is non-optional because `firingRows` drops any firing it cannot
 * resolve, which upholds the invariant `types.ts` states for `ruleId`.
 */
export type FiringRow = {
  event: AlertEvent;
  rule: AlertRule;
};

export function firingRows(
  events: AlertEvent[],
  rules: AlertRule[]
): FiringRow[] {
  const byId = new Map(rules.map((rule) => [rule.id, rule]));
  return events.flatMap((event) => {
    const rule = byId.get(event.ruleId);
    return rule ? [{ event, rule }] : [];
  });
}

/** Comparable value per sortable Rules column. Channels (a glyph set with no
 *  single comparable value) and Enabled (a control, not data) stay plain
 *  `TableHead` per design.md §7 Lists/Tables. */
export function ruleSortValue(
  row: AlertRule,
  key: string
): string | number | null {
  switch (key) {
    case "name":
      return row.name;
    case "condition":
      return CONDITION_CATALOG[row.condition].label;
    case "threshold":
      return row.threshold;
    case "window":
      return windowDays(row.window);
    case "severity":
      return SEVERITY_ORDER[row.severity];
    case "lastFired":
      // null → sorts last in both directions (`sortRows` contract), which is
      // right: "never fired" is absence of a value, not the oldest one.
      return row.lastFiredAt?.getTime() ?? null;
    default:
      return null;
  }
}

/** Comparable value per sortable Events column. Observed and threshold sort on
 *  the RAW numbers, not their formatted strings — `formatObservedValue` groups
 *  thousands, and "600,000 / hr" would otherwise sort as text. */
export function firingSortValue(
  row: FiringRow,
  key: string
): string | number | null {
  switch (key) {
    case "alert":
      return row.rule.name;
    case "severity":
      return SEVERITY_ORDER[row.rule.severity];
    case "observed":
      return row.event.observed;
    case "threshold":
      return row.event.thresholdAtFiring;
    case "status":
      return STATUS_ORDER[row.event.status];
    case "fired":
      return row.event.firedAt.getTime();
    default:
      return null;
  }
}
