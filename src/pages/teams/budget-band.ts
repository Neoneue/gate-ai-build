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
 *  over   → AT or past the cap. A hard budget cannot pass its cap (the
 *           gateway refuses the request that would), so 100% IS its
 *           terminal, blocking state and reads red; a soft budget keeps
 *           counting past 100% and reads red as "exceeded". Until
 *           2026-09-02 this was a strict `>`, so a team sitting exactly on
 *           its cap read amber like a team at 80% (AG-695: "how a team at
 *           80 percent reads differently from one at 100 percent"). */
export type BudgetBand = "under" | "warned" | "over";

export function budgetBand(
  spend: number,
  cap: number,
  warnThreshold: number
): BudgetBand {
  if (cap > 0 && spend >= cap) {
    return "over";
  }
  if (cap > 0 && spend >= (cap * warnThreshold) / 100) {
    return "warned";
  }
  return "under";
}

/** Fill tone per band. `warning-600` is the documented SOLID status fill
 *  (design.md §status, the same value StatusDot paints). Under was
 *  `bg-primary` until 2026-08-31: the primary fill rendered near-white on
 *  the dark theme and read as an unfilled track; green also matches the
 *  AG-514 build's budget-bar states (under=green / warn=amber /
 *  over=destructive). */
const BAND_FILL: Record<BudgetBand, string> = {
  // Under and warned read as left-to-right gradients (500 darker at the
  // origin, 400 lighter at the leading edge) per user direction 2026-08-31;
  // over stays the solid destructive fill.
  under: "bg-gradient-to-r from-success-500 to-success-400",
  warned: "bg-gradient-to-r from-warning-500 to-warning-400",
  over: "bg-destructive",
};

/** Fill for one window's meter: the window's spend against ITS cap, with
 *  the budget's shared warn percent. */
export function budgetFillClass(
  spend: number,
  cap: number,
  warnThreshold: number
): string {
  return BAND_FILL[budgetBand(spend, cap, warnThreshold)];
}

/** The status WORD next to a meter: colour alone is not a state (colour-
 *  blind readers, skimming). Competitor pattern (AWS / GCP / Azure budgets
 *  show OK / Warning / Exceeded as text). `ok` renders nothing: a healthy
 *  budget needs no label. `blocking` is a hard budget at its cap, the state
 *  in which the gateway is refusing requests; `exceeded` is a soft budget
 *  past its cap, still serving. */
export type BudgetStatus = "ok" | "warning" | "exceeded" | "blocking";

export function budgetStatus(
  spend: number,
  cap: number,
  warnThreshold: number,
  enforcement: "soft" | "hard"
): BudgetStatus {
  const band = budgetBand(spend, cap, warnThreshold);
  if (band === "over") {
    return enforcement === "hard" ? "blocking" : "exceeded";
  }
  return band === "warned" ? "warning" : "ok";
}

export const BUDGET_STATUS_LABEL: Record<
  Exclude<BudgetStatus, "ok">,
  string
> = {
  warning: "Warning",
  exceeded: "Exceeded",
  blocking: "Blocking",
};

/** Badge tone per status, in the Badge primitive's variant vocabulary. */
export const BUDGET_STATUS_VARIANT: Record<
  Exclude<BudgetStatus, "ok">,
  "warning" | "destructive"
> = {
  warning: "warning",
  exceeded: "destructive",
  blocking: "destructive",
};
