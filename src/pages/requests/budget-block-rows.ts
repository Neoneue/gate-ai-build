import { useMemo } from "react";
import { fallbackRequestUuid, REQUEST_ROWS_ALL } from "@/data/requests";
import {
  BUDGET_WINDOW_LABEL,
  BUDGET_WINDOW_RESET_COPY,
  budgetReadings,
  keyById,
  type TeamRow,
  usageForTeam,
} from "@/data/teams";
import { formatCurrency } from "@/lib/formatters";
import { MODEL_ROWS } from "@/pages/activity-data";
import { budgetStatus } from "@/pages/teams/budget-band";
import { useTeams } from "@/pages/teams/teams-store";
import type { RequestRow } from "./types";

/* ─────────────────────────────────────────────────────────────────────────
 * Budget-blocked requests on the Messages page (PRD §3 Hard-budget block:
 * "a blocked request returns a distinct budget error identifying it as a
 * team or org budget block (not the generic usage-limit error)"; AG-695
 * "the blocked state: what an admin sees when a cap has blocked traffic,
 * and which cap did it").
 *
 * The seed has no blocked-by-budget request because no seeded team is over
 * a hard cap. Lower a team's hard budget under its spend on the Teams page
 * and the gateway would refuse its next message: this module synthesizes
 * that message, ONE per blocking team, so the demo shows the row the PRD
 * describes. status `error` + guardrail `block` reuse the two existing
 * badges; `code` 429; the reason names the team and the window, the same
 * sentence the team page's breach banner uses. Nothing renders while every
 * team is inside its caps.
 * ───────────────────────────────────────────────────────────────────────── */

/** The user message on the blocked request (user 2026-09-03). */
export const BUDGET_BLOCK_USER_MESSAGE =
  "Update our data-model.md with our changes";

export function budgetBlockRows(teams: TeamRow[]): RequestRow[] {
  const rows: RequestRow[] = [];
  for (const team of teams) {
    const budget = team.budget;
    if (budget?.enforcement !== "hard") {
      continue;
    }
    const usage = usageForTeam(team);
    const blocking = budgetReadings(usage, budget).find(
      (r) =>
        budgetStatus(
          r.spend,
          r.cap,
          budget.warnThreshold,
          budget.enforcement,
          budget.blockThreshold
        ) === "blocking"
    );
    if (!blocking) {
      continue;
    }
    // The team's first live key, and the model that key last used in the
    // seed, so the row points at real entities on this team.
    const key = team.keyIds.map((id) => keyById(id)).find((k) => k);
    if (!key) {
      continue;
    }
    const lastForKey = REQUEST_ROWS_ALL.find((r) => r.keyId === key.name);
    const model =
      lastForKey?.model ??
      usage.byModel[0]?.id ??
      MODEL_ROWS[0]?.key ??
      "anthropic/claude-opus-4-7";
    const vendor =
      lastForKey?.vendor ??
      MODEL_ROWS.find((m) => m.key === model)?.vendor ??
      "anthropic";
    const conversation =
      lastForKey?.conversation ?? REQUEST_ROWS_ALL[0]?.conversation ?? "";
    const windowLabel = BUDGET_WINDOW_LABEL[blocking.window].toLowerCase();
    // Authored day/time shape ("Jun 6" / "00:50:45"): the table parses these
    // through parseAuthoredDayTime and shifts them onto the demo clock, so a
    // pre-shifted string here read as an invalid date. The newest seeded row
    // is already "now"; this message sits beside it.
    const newest = REQUEST_ROWS_ALL[0];
    rows.push({
      day: newest?.day ?? "Jun 6",
      time: newest?.time ?? "00:00:00",
      relative: "now",
      status: "error",
      guardrail: "block",
      code: "429",
      vendor,
      model,
      conversation,
      keyId: key.name,
      inTokens: "0",
      outTokens: "0",
      latency: "0.01s",
      cost: "—",
      compression: "—",
      // UUID-shaped like every other row: the Message cell's id line takes
      // the first two dash segments, so a `budget-block-<team>` id read as
      // the words "budget-block" (user 2026-09-04). Seeded on the team so the
      // deep link stays stable across reloads.
      requestId: fallbackRequestUuid(`budget-block-${team.id}`),
      summary: "Blocked by team budget",
      blockReason: "budget",
      errorCode: "team_budget_exceeded",
      errorDetail: `Team budget block. "${team.name}" has used ${formatCurrency(blocking.spend)} of its ${formatCurrency(blocking.cap)} ${windowLabel} cap, so the gateway refused this message before it reached the provider. ${BUDGET_WINDOW_RESET_COPY[blocking.window]}`,
    });
  }
  return rows;
}

/** Live: re-derives whenever a team's budget or spend changes in the store. */
export function useBudgetBlockRows(): RequestRow[] {
  const teams = useTeams();
  return useMemo(() => budgetBlockRows(teams), [teams]);
}
