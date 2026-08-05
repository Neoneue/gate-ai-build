/**
 * Alerts data-layer contract tests.
 *
 * The point of this file is not coverage — it is that the seeded alert story
 * cannot quietly stop being true. Every number in `data.ts` derives from a
 * constant that lives somewhere else on the site, so a change to the model
 * catalog, the request rows, or the security-event totals should either flow
 * through cleanly or fail here. It should never leave the Alerts page asserting
 * a spend figure the Activity page disagrees with.
 */

import { describe, expect, test } from "vitest";
import { REQUEST_ROWS_7D, REQUEST_ROWS_24H } from "@/data/requests";
import { RANGE_SCALE } from "@/lib/range";
import {
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_TOKENS,
} from "@/pages/activity-data";
import type { RequestRow } from "@/pages/requests/types";
import { eventsTotal } from "@/pages/security/events-data";
import {
  ALERT_TEMPLATES,
  CONDITION_CATALOG,
  formatObservedValue,
  formatWindow,
  observedValue,
  SEEDED_ALERT_EVENTS,
  SEEDED_ALERT_RULES,
  validateChannelTarget,
  WINDOW_OPTIONS,
  windowDays,
} from "./data";
import type { AlertConditionType, AlertWindow } from "./types";

const CONDITIONS = Object.keys(CONDITION_CATALOG) as AlertConditionType[];
/** WINDOW_OPTIONS now carries the UNIT choices, not whole windows. */
const UNITS = WINDOW_OPTIONS.map((option) => option.value);
/** Every window inside the honest 7-day horizon, so `observedValue` is a real
 *  number for each. The continuum of day-counts plus the one week that is its
 *  ceiling — the set the seeds and templates are also confined to. */
const HONEST_WINDOWS: AlertWindow[] = [
  { count: 1, unit: "day" },
  { count: 2, unit: "day" },
  { count: 5, unit: "day" },
  { count: 7, unit: "day" },
  { count: 1, unit: "week" },
];
/** A spread of windows PAST the horizon — every one must read null. */
const BEYOND_WINDOWS: AlertWindow[] = [
  { count: 8, unit: "day" },
  { count: 2, unit: "week" },
  { count: 1, unit: "month" },
  { count: 3, unit: "month" },
  { count: 1, unit: "year" },
  { count: 2, unit: "year" },
];
const CUMULATIVE = CONDITIONS.filter(
  (c) => CONDITION_CATALOG[c].accrual === "cumulative"
);
const RATE = CONDITIONS.filter((c) => CONDITION_CATALOG[c].accrual === "rate");

const DAY: AlertWindow = { count: 1, unit: "day" };
const WEEK: AlertWindow = { count: 1, unit: "week" };

const round = (value: number, decimals: number) =>
  Number(value.toFixed(decimals));

/* ─── Independent re-derivations ────────────────────────────────────────────
 * Deliberately recomputed here from the raw sources rather than imported from
 * `data.ts`. A reconciliation test that calls the same helper it is checking
 * proves only that the function is deterministic. */

function errorRateFrom(rows: RequestRow[]): number {
  const errors = rows.filter((row) => row.status === "error").length;
  return round((errors / rows.length) * 100, 1);
}

function p95MsFrom(rows: RequestRow[]): number {
  const sorted = rows
    .map((row) => Number.parseFloat(row.latency))
    .sort((a, b) => a - b);
  const rank = 0.95 * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const value =
    low === high
      ? sorted[low]
      : sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
  return round(value * 1000, 0);
}

describe("condition catalog", () => {
  test("every condition is fully described", () => {
    expect(CONDITIONS).toHaveLength(5);
    for (const condition of CONDITIONS) {
      const meta = CONDITION_CATALOG[condition];
      expect(meta.label.length).toBeGreaterThan(0);
      // A description an operator can act on, not a restatement of the label.
      expect(meta.description.endsWith(".")).toBe(true);
      expect(meta.decimals).toBeGreaterThanOrEqual(0);
      expect(meta.source.length).toBeGreaterThan(0);
    }
  });

  test("window options are the four duration units, sentence-cased", () => {
    expect(WINDOW_OPTIONS).toEqual([
      { value: "day", label: "Day" },
      { value: "week", label: "Week" },
      { value: "month", label: "Month" },
      { value: "year", label: "Year" },
    ]);
  });

  test("windowDays converts a composed window to its days-equivalent", () => {
    expect(windowDays({ count: 2, unit: "day" })).toBe(2);
    expect(windowDays({ count: 1, unit: "week" })).toBe(7);
    expect(windowDays({ count: 3, unit: "month" })).toBe(90);
    expect(windowDays({ count: 2, unit: "year" })).toBe(730);
  });

  test("formatWindow pluralises on the count", () => {
    expect(formatWindow({ count: 1, unit: "day" })).toBe("1 day");
    expect(formatWindow({ count: 2, unit: "day" })).toBe("2 days");
    expect(formatWindow({ count: 1, unit: "week" })).toBe("1 week");
    expect(formatWindow({ count: 4, unit: "month" })).toBe("4 months");
    expect(formatWindow({ count: 2, unit: "year" })).toBe("2 years");
  });
});

describe("observedValue reconciles with its sources", () => {
  test("cost_threshold anchors on the Activity page's real spend", () => {
    // The two grounded anchors: one week is the full 7-day base, one day is
    // its busiest-day share (RANGE_SCALE["24h"]).
    expect(observedValue("cost_threshold", WEEK)).toBe(
      round(TOTAL_7D_BASE_DOLLARS, 2)
    );
    expect(observedValue("cost_threshold", DAY)).toBe(
      round(TOTAL_7D_BASE_DOLLARS * RANGE_SCALE["24h"], 2)
    );
  });

  test("tokens_per_hour anchors on the 7d token base over the window's hours", () => {
    expect(observedValue("tokens_per_hour", WEEK)).toBe(
      round(TOTAL_7D_BASE_TOKENS / (7 * 24), 0)
    );
    expect(observedValue("tokens_per_hour", DAY)).toBe(
      round((TOTAL_7D_BASE_TOKENS * RANGE_SCALE["24h"]) / 24, 0)
    );
  });

  test("security_events reads the Security page's own range totals at the anchors", () => {
    expect(observedValue("security_events", WEEK)).toBe(
      eventsTotal("7d", null)
    );
    expect(observedValue("security_events", DAY)).toBe(
      eventsTotal("24h", null)
    );
  });

  test("error_rate is the request rows' own error share, by population", () => {
    // A one-day window reads the single-day population; any multi-day window
    // reads the multi-day one, because those are the only two request samples.
    expect(observedValue("error_rate", DAY)).toBe(
      errorRateFrom(REQUEST_ROWS_24H)
    );
    expect(observedValue("error_rate", { count: 2, unit: "day" })).toBe(
      errorRateFrom(REQUEST_ROWS_7D)
    );
    expect(observedValue("error_rate", WEEK)).toBe(
      errorRateFrom(REQUEST_ROWS_7D)
    );
  });

  test("latency_p95 is the request rows' 95th percentile in ms", () => {
    expect(observedValue("latency_p95", WEEK)).toBe(p95MsFrom(REQUEST_ROWS_7D));
    expect(observedValue("latency_p95", DAY)).toBe(p95MsFrom(REQUEST_ROWS_24H));
  });

  test("every condition over an in-horizon window is a finite positive number", () => {
    for (const condition of CONDITIONS) {
      for (const window of HONEST_WINDOWS) {
        const value = observedValue(condition, window);
        expect(value).not.toBeNull();
        expect(Number.isFinite(value)).toBe(true);
        expect(value as number).toBeGreaterThan(0);
      }
    }
  });

  test("error_rate stays a percentage", () => {
    for (const window of HONEST_WINDOWS) {
      expect(observedValue("error_rate", window) as number).toBeLessThanOrEqual(
        100
      );
    }
  });

  test("THE HONESTY BOUNDARY: no window past 7 days yields a number", () => {
    // The load-bearing rule. The workload spans ~7 days; anything longer has no
    // full period, so every condition returns null rather than an invented
    // figure. If this ever returns a number, a fabricated value is on screen.
    for (const window of BEYOND_WINDOWS) {
      expect(windowDays(window)).toBeGreaterThan(7);
      for (const condition of CONDITIONS) {
        expect(observedValue(condition, window)).toBeNull();
      }
    }
  });

  test("the horizon is exactly 7 days: a week resolves, eight days does not", () => {
    for (const condition of CONDITIONS) {
      expect(
        observedValue(condition, { count: 7, unit: "day" })
      ).not.toBeNull();
      expect(
        observedValue(condition, { count: 1, unit: "week" })
      ).not.toBeNull();
      expect(observedValue(condition, { count: 8, unit: "day" })).toBeNull();
    }
  });
});

describe("window scaling is monotonic inside the horizon", () => {
  test("cumulative conditions grow strictly with the window", () => {
    expect(CUMULATIVE.length).toBeGreaterThan(0);
    // A strictly increasing ladder of day-counts up to the week ceiling.
    const ladder: AlertWindow[] = [
      { count: 1, unit: "day" },
      { count: 2, unit: "day" },
      { count: 4, unit: "day" },
      { count: 7, unit: "day" },
    ];
    for (const condition of CUMULATIVE) {
      const values = ladder.map((w) => observedValue(condition, w) as number);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    }
  });

  test("a mid-horizon window sits strictly between the day and week anchors", () => {
    // The interpolation is honest only if it stays bounded by the two real
    // anchors it is drawn between — never below one day, never above one week.
    for (const condition of CUMULATIVE) {
      const day = observedValue(condition, DAY) as number;
      const week = observedValue(condition, WEEK) as number;
      const mid = observedValue(condition, { count: 4, unit: "day" }) as number;
      expect(mid).toBeGreaterThan(day);
      expect(mid).toBeLessThan(week);
    }
  });

  test("rate conditions are window-measured, not window-accumulated", () => {
    // Asserted separately and deliberately NOT ordered: a ratio, an average,
    // and a percentile do not grow because the window got longer. The 24h token
    // rate reads ABOVE the 7d rate precisely because RANGE_SCALE models 24h as
    // the busiest day of a ramping week (0.16 > 1/7) — a real property of the
    // workload, not a scaling bug.
    expect(RATE.length).toBeGreaterThan(0);
    for (const condition of RATE) {
      for (const window of HONEST_WINDOWS) {
        expect(observedValue(condition, window) as number).toBeGreaterThan(0);
      }
    }
    expect(observedValue("tokens_per_hour", DAY) as number).toBeGreaterThan(
      observedValue("tokens_per_hour", WEEK) as number
    );
  });
});

describe("seeded rules", () => {
  test("four rules, four conditions, mixed severities, one disabled", () => {
    expect(SEEDED_ALERT_RULES).toHaveLength(4);
    expect(new Set(SEEDED_ALERT_RULES.map((r) => r.condition)).size).toBe(4);
    expect(
      new Set(SEEDED_ALERT_RULES.map((r) => r.severity)).size
    ).toBeGreaterThanOrEqual(2);
    expect(SEEDED_ALERT_RULES.filter((r) => !r.enabled)).toHaveLength(1);
  });

  test("ids are unique and follow the site's entity-id shape", () => {
    const ids = SEEDED_ALERT_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^alr_[0-9a-f]{8}$/);
    }
  });

  test("every threshold is finite, positive, and sits in a coherent relation to the observed value", () => {
    for (const rule of SEEDED_ALERT_RULES) {
      expect(Number.isFinite(rule.threshold)).toBe(true);
      expect(rule.threshold).toBeGreaterThan(0);
      // Every seed lives inside the 7-day horizon, so its window has a real
      // observed value — a null here would mean a seed strayed past it.
      expect(windowDays(rule.window)).toBeLessThanOrEqual(7);
      const observed = observedValue(rule.condition, rule.window);
      expect(observed).not.toBeNull();
      const hasFired = rule.lastFiredAt !== null;
      // A rule with a firing history must have a threshold its window's
      // observed value actually reaches; one without must have headroom.
      if (hasFired) {
        expect(observed as number).toBeGreaterThanOrEqual(rule.threshold);
      } else {
        expect(observed as number).toBeLessThan(rule.threshold);
      }
    }
  });

  test("every channel target passes the validator the wizard uses", () => {
    for (const rule of SEEDED_ALERT_RULES) {
      expect(rule.channels.length).toBeGreaterThan(0);
      for (const channel of rule.channels) {
        expect(validateChannelTarget(channel.type, channel.target)).toBeNull();
      }
    }
  });

  test("timestamps are stable, real dates in the fixture year", () => {
    for (const rule of SEEDED_ALERT_RULES) {
      expect(Number.isFinite(rule.createdAt.getTime())).toBe(true);
      expect(rule.createdAt.getFullYear()).toBe(2026);
      if (rule.lastFiredAt) {
        // Created before it ever fired.
        expect(rule.createdAt.getTime()).toBeLessThan(
          rule.lastFiredAt.getTime()
        );
      }
    }
  });
});

describe("seeded firings", () => {
  const byRule = (ruleId: string) =>
    SEEDED_ALERT_EVENTS.filter((event) => event.ruleId === ruleId);

  test("about a dozen firings, ids unique and prefixed", () => {
    expect(SEEDED_ALERT_EVENTS).toHaveLength(12);
    const ids = SEEDED_ALERT_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^alv_[0-9a-f]{8}$/);
    }
  });

  test("every ruleId resolves to a seeded rule", () => {
    const known = new Set(SEEDED_ALERT_RULES.map((r) => r.id));
    for (const event of SEEDED_ALERT_EVENTS) {
      expect(known.has(event.ruleId)).toBe(true);
    }
  });

  test("statuses are mixed", () => {
    const statuses = SEEDED_ALERT_EVENTS.map((e) => e.status);
    expect(statuses.filter((s) => s === "open").length).toBeGreaterThanOrEqual(
      2
    );
    expect(statuses).toContain("acknowledged");
    expect(statuses).toContain("resolved");
  });

  test("open firings have observed at or above the threshold that fired", () => {
    for (const event of SEEDED_ALERT_EVENTS) {
      expect(Number.isFinite(event.observed)).toBe(true);
      expect(event.observed).toBeGreaterThan(0);
      expect(event.thresholdAtFiring).toBeGreaterThan(0);
      if (event.status === "open") {
        expect(event.observed).toBeGreaterThanOrEqual(event.thresholdAtFiring);
      }
    }
  });

  test("a disabled rule owns no firings at all", () => {
    for (const rule of SEEDED_ALERT_RULES.filter((r) => !r.enabled)) {
      expect(byRule(rule.id)).toHaveLength(0);
      expect(rule.lastFiredAt).toBeNull();
    }
  });

  test("lastFiredAt equals the rule's newest firing", () => {
    for (const rule of SEEDED_ALERT_RULES) {
      const firings = byRule(rule.id);
      if (firings.length === 0) {
        expect(rule.lastFiredAt).toBeNull();
        continue;
      }
      const newest = Math.max(...firings.map((f) => f.firedAt.getTime()));
      expect(rule.lastFiredAt?.getTime()).toBe(newest);
    }
  });

  test("firings of one rule are spaced a full window apart", () => {
    const MS_PER_DAY = 86_400_000;
    for (const rule of SEEDED_ALERT_RULES) {
      const times = byRule(rule.id)
        .map((f) => f.firedAt.getTime())
        .sort((a, b) => a - b);
      const windowMs = windowDays(rule.window) * MS_PER_DAY;
      for (let i = 1; i < times.length; i++) {
        expect(times[i] - times[i - 1]).toBe(windowMs);
      }
    }
  });

  test("deliveries cover every channel, mostly delivered", () => {
    const rules = new Map(SEEDED_ALERT_RULES.map((r) => [r.id, r]));
    const outcomes: string[] = [];
    for (const event of SEEDED_ALERT_EVENTS) {
      const rule = rules.get(event.ruleId);
      expect(event.deliveries).toHaveLength(rule?.channels.length ?? -1);
      for (const delivery of event.deliveries) {
        expect(
          validateChannelTarget(delivery.channel.type, delivery.channel.target)
        ).toBeNull();
        outcomes.push(delivery.outcome);
      }
    }
    expect(outcomes.filter((o) => o === "delivered").length).toBeGreaterThan(
      outcomes.length / 2
    );
    // Exactly one of each non-happy outcome, and both on a webhook.
    expect(outcomes.filter((o) => o === "failed")).toHaveLength(1);
    expect(outcomes.filter((o) => o === "pending")).toHaveLength(1);
  });

  test("pending sits only on the newest webhook firing", () => {
    // The data marks pending on the most recent firing that HAS a webhook (an
    // integration still in flight), which is not necessarily the most recent
    // firing overall — the newest firing may notify only email + Slack, which
    // deliver synchronously. Asserting the webhook-scoped newest is the real
    // invariant; the earlier "global newest" phrasing only held while the two
    // happened to coincide.
    const webhookFirings = SEEDED_ALERT_EVENTS.filter((event) =>
      event.deliveries.some((d) => d.channel.type === "webhook")
    );
    expect(webhookFirings.length).toBeGreaterThan(0);
    const newestWebhook = webhookFirings.reduce((a, b) =>
      b.firedAt.getTime() > a.firedAt.getTime() ? b : a
    );
    for (const event of SEEDED_ALERT_EVENTS) {
      const hasPending = event.deliveries.some((d) => d.outcome === "pending");
      expect(hasPending).toBe(event.id === newestWebhook.id);
    }
  });
});

describe("wizard templates", () => {
  test("four templates, all referencing a valid condition and an in-horizon window", () => {
    expect(ALERT_TEMPLATES).toHaveLength(4);
    for (const template of ALERT_TEMPLATES) {
      expect(CONDITIONS).toContain(template.condition);
      expect(UNITS).toContain(template.window.unit);
      // A template must have a real observed value to derive its threshold, so
      // it stays inside the 7-day horizon — never a month/year template.
      expect(windowDays(template.window)).toBeLessThanOrEqual(7);
      expect(["info", "warning", "critical"]).toContain(template.severity);
      expect(template.id).toMatch(/^alt_[0-9a-f]{8}$/);
      expect(template.description.length).toBeGreaterThan(0);
    }
  });

  test("every template threshold is finite, positive, and leaves headroom", () => {
    for (const template of ALERT_TEMPLATES) {
      expect(Number.isFinite(template.threshold)).toBe(true);
      expect(template.threshold).toBeGreaterThan(0);
      const observed = observedValue(template.condition, template.window);
      expect(observed).not.toBeNull();
      // A template must not produce a rule that fires the moment it is saved.
      expect(template.threshold).toBeGreaterThan(observed as number);
    }
  });

  test("templates cover the condition no seeded rule uses", () => {
    const seeded = new Set(SEEDED_ALERT_RULES.map((r) => r.condition));
    const templated = new Set(ALERT_TEMPLATES.map((t) => t.condition));
    for (const condition of CONDITIONS) {
      expect(seeded.has(condition) || templated.has(condition)).toBe(true);
    }
  });
});

describe("formatObservedValue", () => {
  test("renders each unit in the site's conventions", () => {
    expect(formatObservedValue("cost_threshold", 39.6144)).toContain("39.61");
    // Percentages carry one decimal, per the compression-percent convention.
    expect(formatObservedValue("error_rate", 6.6)).toBe("6.6%");
    expect(formatObservedValue("tokens_per_hour", 489_666.67)).toContain("/hr");
    expect(formatObservedValue("latency_p95", 33_230)).toContain("ms");
    expect(formatObservedValue("security_events", 12)).toBe("12");
  });

  test("never renders an empty string or NaN for any in-horizon reading", () => {
    for (const condition of CONDITIONS) {
      for (const window of HONEST_WINDOWS) {
        const observed = observedValue(condition, window);
        expect(observed).not.toBeNull();
        const out = formatObservedValue(condition, observed as number);
        expect(out.length).toBeGreaterThan(0);
        expect(out).not.toContain("NaN");
      }
    }
  });
});

describe("validateChannelTarget", () => {
  test("accepts well-formed targets", () => {
    expect(
      validateChannelTarget("email", "ops@constellationgate.ai")
    ).toBeNull();
    expect(validateChannelTarget("slack", "#gate-alerts")).toBeNull();
    expect(validateChannelTarget("slack", "C01ABC2DEF3")).toBeNull();
    expect(
      validateChannelTarget("webhook", "https://hooks.example.com/gate")
    ).toBeNull();
  });

  test("rejects malformed targets with a message, not a throw", () => {
    const bad: [Parameters<typeof validateChannelTarget>[0], string][] = [
      ["email", ""],
      ["email", "ops@localhost"],
      ["email", "not an email"],
      ["slack", "gate-alerts"],
      ["slack", "#Gate Alerts"],
      ["webhook", "http://hooks.example.com/gate"],
      ["webhook", "hooks.example.com"],
      ["webhook", ""],
    ];
    for (const [type, target] of bad) {
      const error = validateChannelTarget(type, target);
      expect(error).not.toBeNull();
      expect(error?.length ?? 0).toBeGreaterThan(0);
    }
  });

  test("trims before validating, so a pasted target with whitespace passes", () => {
    expect(
      validateChannelTarget("email", "  ops@constellationgate.ai  ")
    ).toBeNull();
  });
});
