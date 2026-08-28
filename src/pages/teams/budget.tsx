import { DetailList, DetailRow } from "@/components/ui/detail-list";
import {
  BUDGET_ENFORCEMENT_LABEL,
  BUDGET_WINDOW_LABEL,
  budgetBlockThreshold,
  budgetPercentLabel,
  budgetProgress,
  type TeamBudget,
} from "@/data/teams";
import { formatCurrency } from "@/lib/formatters";

/* ─────────────────────────────────────────────────────────────────────────
 * Budget chrome shared by the Teams list (org budget card) and the team
 * detail page (Budget tab). One meter, one summary — so the org bar and the
 * team bar can never drift into two different readings of the same shape.
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
  const over = spend > budget.amount;
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
        {/* Fill is the primary ink until the cap is passed, then destructive.
            Colour is the only thing that changes on overspend — the geometry
            stays put, so the bar never lies about being fuller than 100%. */}
        <div
          className={
            over
              ? "h-full rounded-full bg-destructive transition-[width] duration-200 ease-out motion-reduce:transition-none"
              : "h-full rounded-full bg-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
          }
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

export function BudgetSummary({
  spend,
  budget,
  meterLabel,
}: {
  spend: number;
  budget: TeamBudget;
  meterLabel: string;
}) {
  const blockThreshold = budgetBlockThreshold(budget);
  return (
    <div className="flex flex-col gap-4">
      <BudgetMeter budget={budget} label={meterLabel} spend={spend} />
      {/* Nested one level inside the tab's Card, so the list steps down a
          radius tier (8px card → 4px inner). */}
      <DetailList className="rounded-xs">
        <DetailRow label="Name" value={budget.name} />
        <DetailRow label="Window" value={BUDGET_WINDOW_LABEL[budget.window]} />
        <DetailRow
          label="Amount"
          value={
            <span className="type-mono-14 text-foreground">
              {formatCurrency(budget.amount)}
            </span>
          }
        />
        <DetailRow
          label="Enforcement"
          value={BUDGET_ENFORCEMENT_LABEL[budget.enforcement]}
        />
        <DetailRow
          label="Warn threshold"
          value={
            <span className="type-mono-14 text-foreground">
              {budget.warnThreshold}%
            </span>
          }
        />
        {/* Only a hard budget has a block point. On a soft one the row would
            be a number that never fires. */}
        {blockThreshold === null ? null : (
          <DetailRow
            label="Block threshold"
            value={
              <span className="type-mono-14 text-foreground">
                {blockThreshold}%
              </span>
            }
          />
        )}
        <DetailRow
          label="Current spend"
          value={
            <span className="type-mono-14 text-foreground">
              {formatCurrency(spend)}
            </span>
          }
        />
      </DetailList>
    </div>
  );
}
