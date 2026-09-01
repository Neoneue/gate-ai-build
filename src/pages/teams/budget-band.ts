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

export function budgetBand(
  spend: number,
  cap: number,
  warnThreshold: number
): BudgetBand {
  if (spend > cap) {
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
