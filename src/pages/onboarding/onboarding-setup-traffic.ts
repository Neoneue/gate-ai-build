import { costOf } from "@/data/models";
import { formatChartTooltipDate } from "@/lib/formatters";
import {
  appNameOf,
  DEMO_TOKENS_IN,
  DEMO_TOKENS_OUT,
  type ImprovedModel,
  OWNER_EMAIL,
  TEST_TOKENS_IN,
  TEST_TOKENS_OUT,
  testModelOf,
} from "@/pages/onboarding/improved-data";
import type { ImprovedState } from "@/pages/onboarding/onboarding-state";

/* ─── The desktop setup's two messages, as the dashboard logs them ──────────
 * Owner direction 2026-10-13: the Overview after setup
 * (`/overview-setup-onboarding`) shows exactly the two messages step 3 sent:
 * the test message (success, allow) when "Check connection" passed, and the
 * protection demo message (blocked prompt injection) when the demo passed.
 *
 * ONE source: every tile, chart and table on that page reads this, so the
 * counts and sums reconcile. Same model for both (`testModelOf`), the step 3
 * token counts, and cost: $0.00 on provider billing, the catalog list price
 * over those tokens on Gate credits. MOCK: no Gate record exists, so there
 * is no request id and no detail page. Null until both steps passed.
 * ───────────────────────────────────────────────────────────────────────── */

export type SetupMessage = {
  id: "test" | "demo";
  sentAt: Date;
  model: ImprovedModel;
  inTokens: number;
  outTokens: number;
  costUsd: number;
  guardrail: "allow" | "block";
};

export type SetupTraffic = {
  /** Newest first: the demo message, then the test message. */
  messages: readonly SetupMessage[];
  /** The key column's caller: the selected key's name for Manual setup;
   *  for Gate Connect (OAuth, no key name) gate-main's substitute,
   *  `gate-connect (<first 12 chars of email>...)` (requests.ts
   *  `keyLabel`). */
  keyLabel: string;
  /** The app the messages came from. */
  app: string;
};

/** List price of a step 2 model. IMPROVED_MODELS writes a version with a
 *  dot ("openai/gpt-4.1") where the catalog id uses a dash
 *  ("openai/gpt-4-1"), so the dashed form is tried second; a model the
 *  catalog does not list costs $0.00. */
function listCost(modelId: string, inTokens: number, outTokens: number) {
  return (
    costOf(modelId, inTokens, outTokens) ||
    costOf(modelId.replaceAll(".", "-"), inTokens, outTokens)
  );
}

export function setupTraffic(state: ImprovedState): SetupTraffic | null {
  if (
    !(state.received && state.caught) ||
    state.receivedAt === null ||
    state.caughtAt === null
  ) {
    return null;
  }
  const model = testModelOf(state);
  const payg = state.billing === "payg";
  const message = (
    id: SetupMessage["id"],
    sentAt: number,
    inTokens: number,
    outTokens: number,
    guardrail: SetupMessage["guardrail"]
  ): SetupMessage => ({
    id,
    sentAt: new Date(sentAt),
    model,
    inTokens,
    outTokens,
    costUsd: payg ? listCost(model.id, inTokens, outTokens) : 0,
    guardrail,
  });
  const key =
    state.connection === "manual"
      ? state.keys.find((k) => k.id === state.selectedKeyId)?.name
      : undefined;
  return {
    messages: [
      message("demo", state.caughtAt, DEMO_TOKENS_IN, DEMO_TOKENS_OUT, "block"),
      message(
        "test",
        state.receivedAt,
        TEST_TOKENS_IN,
        TEST_TOKENS_OUT,
        "allow"
      ),
    ],
    keyLabel: key ?? `gate-connect (${OWNER_EMAIL.slice(0, 12)}...)`,
    app: appNameOf(state),
  };
}

export const tokensOf = (m: SetupMessage) => m.inTokens + m.outTokens;

/** Seven days ending on the newest message's day, the Overview's "Activity
 *  this week": each day's chart label (`formatChartTooltipDate`, the
 *  Dashboard's axis and tooltip shape) and the messages that fall in it. */
export function setupWeek(traffic: SetupTraffic): {
  labels: string[];
  days: SetupMessage[][];
} {
  const end = new Date(traffic.messages[0]?.sentAt ?? Date.now());
  end.setHours(0, 0, 0, 0);
  const dates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(end);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });
  const range = { start: dates[0] ?? end, end: dates[6] ?? end };
  return {
    labels: dates.map((d) => formatChartTooltipDate(d, "day", range)),
    days: dates.map((day, index) => {
      const from = day.getTime();
      const to = dates[index + 1]?.getTime() ?? Number.POSITIVE_INFINITY;
      return traffic.messages.filter(
        (m) => m.sentAt.getTime() >= from && m.sentAt.getTime() < to
      );
    }),
  };
}
