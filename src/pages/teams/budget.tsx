import {
  BUDGET_WINDOW_LABEL,
  BUDGET_WINDOW_RESET_COPY,
  budgetPercentLabel,
  budgetProgress,
  type TeamBudget,
} from "@/data/teams";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { budgetFillClass } from "@/pages/teams/budget-band";

/* ─────────────────────────────────────────────────────────────────────────
 * Budget chrome shared by the Teams list (org budget card + the list's
 * compact per-row meter) and the team detail page (Budget tab). One meter,
 * one band ladder (`budget-band.ts`), one summary — so a row's bar and the
 * tab it opens can never drift into two different readings of the same
 * spend.
 * ───────────────────────────────────────────────────────────────────────── */

export function BudgetMeter({
  spend,
  budget,
  label,
}: {
  spend: number;
  budget: TeamBudget;
  /** Accessible name for the meter — "Org budget used", "Platform budget used". */
  label: string;
}) {
  const fraction = budgetProgress(spend, budget) ?? 0;
  return (
    <div className="flex flex-col gap-2">
      <div
        aria-label={label}
        aria-valuemax={budget.amount}
        aria-valuemin={0}
        aria-valuenow={spend}
        aria-valuetext={`${formatCurrency(spend)} of ${formatCurrency(budget.amount)}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
      >
        {/* Fill is primary ink under the warn threshold, the warning tone
            between warn and the cap, destructive past it. Colour is the only
            thing that changes across the three bands — the geometry stays put,
            so the bar never lies about being fuller than 100%. */}
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none",
            budgetFillClass(spend, budget)
          )}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="type-mono-14 text-foreground">
          {formatCurrency(spend)}
          <span className="text-muted-foreground">
            {" "}
            of {formatCurrency(budget.amount)}
          </span>
        </span>
        <span className="type-mono-14 text-muted-foreground">
          {budgetPercentLabel(spend, budget)} used
        </span>
      </div>
    </div>
  );
}

/** One fact: what it is, what it says, and what that means. The hint is the
 *  line that keeps the value from needing a second reading — "Warn at 80%"
 *  states the percent, the hint states the dollar figure it fires at. */
function BudgetFact({
  label,
  value,
  hint,
  mono = false,
}: {
  label: string;
  value: string;
  hint: string;
  /** Numeric values take the mono tabular voice; worded ones stay sans. */
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="type-label-12 text-muted-foreground">{label}</span>
      <span
        className={cn(
          mono ? "type-mono-14" : "type-copy-14",
          "text-foreground"
        )}
      >
        {value}
      </span>
      <p className="type-copy-12 m-0 text-pretty text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}

export function BudgetSummary({
  spend,
  budget,
  meterLabel,
}: {
  spend: number;
  budget: TeamBudget;
  meterLabel: string;
}) {
  const over = spend > budget.amount;
  const hard = budget.enforcement === "hard";
  return (
    <div className="flex flex-col gap-4">
      <BudgetMeter budget={budget} label={meterLabel} spend={spend} />
      {/* Four facts, not a label/value list: the meter above already states
          spend, cap, and percent, so what is left is the reading the operator
          has to do arithmetic for — what remains, what happens at the cap,
          where the alert fires, when the window turns over. */}
      <div className="grid @3xl:grid-cols-4 @xl:grid-cols-2 grid-cols-1 gap-4">
        <BudgetFact
          hint={`${budgetPercentLabel(spend, budget)} of the budget used`}
          label={over ? "Over budget by" : "Remaining"}
          mono
          value={formatCurrency(Math.abs(budget.amount - spend))}
        />
        <BudgetFact
          hint={
            hard
              ? "Blocks requests once the budget is used up."
              : "Alerts only. Never blocks a request."
          }
          label="Enforcement"
          value={hard ? "Hard" : "Soft"}
        />
        <BudgetFact
          hint={`Alert at ${formatCurrency((budget.amount * budget.warnThreshold) / 100)}.`}
          label="Warn at"
          mono
          value={`${budget.warnThreshold}%`}
        />
        <BudgetFact
          hint={BUDGET_WINDOW_RESET_COPY[budget.window]}
          label="Window"
          value={BUDGET_WINDOW_LABEL[budget.window]}
        />
      </div>
    </div>
  );
}
