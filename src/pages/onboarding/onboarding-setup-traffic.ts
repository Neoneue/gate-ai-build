import { costOf } from "@/data/models";
import { formatChartTooltipDate } from "@/lib/formatters";
import {
  appNameOf,
  DEMO_TOKENS_IN,
  DEMO_TOKENS_OUT,
  type ImprovedModel,
  OWNER_EMAIL,
  SETUP_TOKENS_SAVED,
  TEST_MESSAGE,
  TEST_TOKENS_IN,
  TEST_TOKENS_OUT,
  testModelOf,
} from "@/pages/onboarding/improved-data";
import type { ImprovedState } from "@/pages/onboarding/onboarding-state";

/* ─── The desktop setup's two messages, as the dashboard logs them ──────────
 * Owner direction 2026-10-13: the workspace's Overview
 * (`/overview-setup-onboarding`) and data pages show exactly the messages
 * step 3 sent, one at a time as each lands: the test message (success,
 * allow) once "Check connection" passed, then the protection demo message
 * (blocked prompt injection) once the demo passed. A user can open
 * Overview, Messages or Activity between the two, so every page reads 1
 * message, then 2.
 *
 * ONE source: every tile, chart and table on that page reads this, so the
 * counts and sums reconcile. Same model for both (`testModelOf`), the step 3
 * token counts, and cost: $0.00 on provider billing, the catalog list price
 * over those tokens on Gate credits. MOCK: no Gate record exists, so there
 * is no request id and no detail page. Null until the test message passed.
 * ───────────────────────────────────────────────────────────────────────── */

export type SetupMessage = {
  id: "test" | "demo";
  sentAt: Date;
  model: ImprovedModel;
  inTokens: number;
  outTokens: number;
  /** Input tokens Gate's compression removed (`SETUP_TOKENS_SAVED`). */
  savedTokens: number;
  costUsd: number;
  guardrail: "allow" | "block";
};

/** The messages as one conversation, one turn per message (owner
 *  2026-10-13): both came from the same app session during setup. */
export type SetupConversation = {
  id: string;
  /** The first turn's prompt, as Conversations titles a session. */
  title: string;
  startedAt: Date;
  updatedAt: Date;
  turns: number;
  inTokens: number;
  outTokens: number;
  costUsd: number;
};

export type SetupTraffic = {
  /** Newest first: the demo message (once it passed), then the test
   *  message. */
  messages: readonly SetupMessage[];
  /** The key column's caller: the selected key's name for Manual setup;
   *  for Gate Connect (OAuth, no key name) gate-main's substitute,
   *  `gate-connect (<first 12 chars of email>...)` (requests.ts
   *  `keyLabel`). */
  keyLabel: string;
  /** The app the messages came from. */
  app: string;
  /** Who bills the two messages: Gate on Gate credits ("payg"), the
   *  user's provider on Existing subscriptions, as the Messages cost cell
   *  shows it. */
  billing: ImprovedState["billing"];
  conversation: SetupConversation;
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
  if (!state.received || state.receivedAt === null) {
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
    savedTokens: SETUP_TOKENS_SAVED,
    costUsd: payg ? listCost(model.id, inTokens, outTokens) : 0,
    guardrail,
  });
  const key =
    state.connection === "manual"
      ? state.keys.find((k) => k.id === state.selectedKeyId)?.name
      : undefined;
  const test = message(
    "test",
    state.receivedAt,
    TEST_TOKENS_IN,
    TEST_TOKENS_OUT,
    "allow"
  );
  const demo =
    state.caught && state.caughtAt !== null
      ? message(
          "demo",
          state.caughtAt,
          DEMO_TOKENS_IN,
          DEMO_TOKENS_OUT,
          "block"
        )
      : null;
  const messages = demo ? [demo, test] : [test];
  const newest = demo ?? test;
  return {
    messages,
    keyLabel: key ?? GATE_CONNECT_KEY_LABEL,
    app: appNameOf(state),
    billing: state.billing,
    conversation: {
      id: SETUP_CONVERSATION_ID,
      title: TEST_MESSAGE,
      startedAt: test.sentAt,
      updatedAt: newest.sentAt,
      turns: messages.length,
      inTokens: messages.reduce((sum, m) => sum + m.inTokens, 0),
      outTokens: messages.reduce((sum, m) => sum + m.outTokens, 0),
      costUsd: messages.reduce((sum, m) => sum + m.costUsd, 0),
    },
  };
}

/** gate-main's caller for OAuth traffic, which has no key name: Gate
 *  Connect's messages and Gate Chat's (owner 2026-10-14) both log under it
 *  (requests.ts `keyLabel`). */
export const GATE_CONNECT_KEY_LABEL = `gate-connect (${OWNER_EMAIL.slice(0, 12)}...)`;

/** The setup conversation's id: mock, no Gate record exists. */
export const SETUP_CONVERSATION_ID = "cnv_setup";

/** Gate's compression over the messages: tokens saved and the share of
 *  input tokens, one decimal ("0.1%"). */
export function setupCompression(traffic: SetupTraffic): {
  savedTokens: number;
  inTokens: number;
  percent: string;
} {
  const savedTokens = traffic.messages.reduce((s, m) => s + m.savedTokens, 0);
  const inTokens = traffic.messages.reduce((s, m) => s + m.inTokens, 0);
  const pct = inTokens === 0 ? 0 : (savedTokens / inTokens) * 100;
  return { savedTokens, inTokens, percent: `${pct.toFixed(1)}%` };
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
