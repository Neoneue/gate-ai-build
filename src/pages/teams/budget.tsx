import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BUDGET_ENFORCEMENT_LABEL,
  BUDGET_WINDOW_LABEL,
  BUDGET_WINDOW_RESET_COPY,
  BUDGET_WINDOW_RESET_SHORT,
  budgetPercentLabel,
  budgetProgress,
  type TeamBudget,
  type WindowReading,
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
 *
 * Everything here reads ONE window: a budget can run several at once, so the
 * caller picks which reading to render (the list row shows the tightest, the
 * Budget tab shows the selected tab) and hands down that window's spend and
 * cap. Nothing in this file chooses a window for itself.
 * ───────────────────────────────────────────────────────────────────────── */

export function BudgetMeter({
  spend,
  cap,
  warnThreshold,
  label,
}: {
  spend: number;
  /** The selected window's cap, in USD. */
  cap: number;
  /** Percent of the cap at which the budget warns — shared across windows. */
  warnThreshold: number;
  /** Accessible name for the meter — "Org budget used", "Platform budget used". */
  label: string;
}) {
  const fraction = budgetProgress(spend, cap) ?? 0;
  return (
    <div className="flex flex-col gap-2">
      <div
        aria-label={label}
        aria-valuemax={cap}
        aria-valuemin={0}
        aria-valuenow={spend}
        aria-valuetext={`${formatCurrency(spend)} of ${formatCurrency(cap)}`}
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
            budgetFillClass(spend, cap, warnThreshold)
          )}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="type-mono-14 text-foreground">
          {formatCurrency(spend)}
          <span className="text-muted-foreground">
            {" "}
            of {formatCurrency(cap)}
          </span>
        </span>
        <span className="type-mono-14 text-muted-foreground">
          {budgetPercentLabel(spend, cap)} used
        </span>
      </div>
    </div>
  );
}

/** One fact: label over value. No hint line (2026-09-01): the hints
 *  repeated the meter's percent and the dialog's enforcement copy, and the
 *  Window reset sentence wrapped to two lines. What a hint carried that was
 *  new now lives inside the value ("80% ($16.00)", "Weekly, rolling"); the
 *  teaching copy (soft vs hard, what a rolling window is) moved into an
 *  Info tooltip on the eyebrow, the TokenSavings benefit-row recipe. */
function BudgetFact({
  label,
  value,
  tip,
  mono = false,
}: {
  label: string;
  value: string;
  /** Tooltip body behind the eyebrow's Info glyph. */
  tip: string;
  /** Numeric values take the mono tabular voice; worded ones stay sans. */
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1">
        <span className="type-label-12 text-muted-foreground">{label}</span>
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <span
                {...props}
                aria-label={`About ${label}`}
                className="-m-1 inline-flex shrink-0 cursor-help rounded-sm p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Info aria-hidden className="size-3.5" strokeWidth={1.75} />
              </span>
            )}
          />
          <TooltipContent>{tip}</TooltipContent>
        </Tooltip>
      </span>
      <span
        className={cn(
          mono ? "type-mono-14" : "type-copy-14",
          "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function BudgetSummary({
  reading,
  budget,
  meterLabel,
}: {
  /** The window being read: its cap, its spend, its scaled usage. */
  reading: WindowReading;
  /** Enforcement and warn percent are shared across a budget's windows. */
  budget: TeamBudget;
  meterLabel: string;
}) {
  const { window, cap, spend } = reading;
  const over = spend > cap;
  const hard = budget.enforcement === "hard";
  return (
    <div className="flex flex-col gap-4">
      <BudgetMeter
        cap={cap}
        label={meterLabel}
        spend={spend}
        warnThreshold={budget.warnThreshold}
      />
      {/* Four facts: the meter above already states spend, cap, and percent,
          so what is left is what the operator would otherwise compute: what
          remains, what happens at the cap, where the alert fires (with its
          dollar figure), and the window with its reset behaviour. */}
      <div className="grid @3xl:grid-cols-4 @xl:grid-cols-2 grid-cols-1 gap-4">
        <BudgetFact
          label={over ? "Over budget by" : "Remaining"}
          mono
          tip={
            over
              ? "How far spend in this window has passed its cap."
              : "What is left of this window's cap before it is used up."
          }
          value={formatCurrency(Math.abs(cap - spend))}
        />
        <BudgetFact
          label="Enforcement"
          tip={`${BUDGET_ENFORCEMENT_LABEL.soft}. ${BUDGET_ENFORCEMENT_LABEL.hard}.`}
          value={hard ? "Hard" : "Soft"}
        />
        <BudgetFact
          label="Warn at"
          mono
          tip="Percent of the cap at which the warning alert fires, with the dollar figure that works out to."
          value={`${budget.warnThreshold}% (${formatCurrency((cap * budget.warnThreshold) / 100)})`}
        />
        <BudgetFact
          label="Window"
          tip={BUDGET_WINDOW_RESET_COPY[window]}
          value={`${BUDGET_WINDOW_LABEL[window]}, ${BUDGET_WINDOW_RESET_SHORT[window]}`}
        />
      </div>
    </div>
  );
}
