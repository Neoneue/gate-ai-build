import type { TeamBudget } from "@/data/teams";

/* ─────────────────────────────────────────────────────────────────────────
 * Budget band ladder — the single place a budget bar's colour is decided.
 *
 * Its own module rather than a helper inside `budget.tsx` so that file keeps
 * exporting components only and doesn't trip
 * `react-refresh/only-export-components` (repo convention: split, don't
 * disable — see components/ui/chart-geometry.ts, pages/payg-config.ts).
 * Two surfaces read it — the Teams list row meter and the detail page's
 * Budget tab meter — so a row that reads amber opens onto an amber bar
 * (charts-must-reconcile: one constant, two readings).
 * ───────────────────────────────────────────────────────────────────────── */

/** Which band the spend has reached against its cap.
 *
 *  under  → below the warn threshold
 *  warned → at or past `amount × warnThreshold%`, but still inside the cap
 *  over   → past the cap itself (a hard budget is blocking by now) */
export type BudgetBand = "under" | "warned" | "over";

export function budgetBand(spend: number, budget: TeamBudget): BudgetBand {
  if (spend > budget.amount) {
    return "over";
  }
  if (
    budget.amount > 0 &&
    spend >= (budget.amount * budget.warnThreshold) / 100
  ) {
    return "warned";
  }
  return "under";
}

/** Fill tone per band. `warning-600` is the documented SOLID status fill
 *  (design.md §status: "warning-600 for solid mid", the same value StatusDot
 *  paints), so the warn band carries status intent and reads in both themes
 *  without a per-theme override. */
const BAND_FILL: Record<BudgetBand, string> = {
  under: "bg-primary",
  warned: "bg-warning-600",
  over: "bg-destructive",
};

export function budgetFillClass(spend: number, budget: TeamBudget): string {
  return BAND_FILL[budgetBand(spend, budget)];
}
