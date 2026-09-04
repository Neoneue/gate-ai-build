import { Info, OctagonAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
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
  type BudgetEnforcement,
  budgetAlertRecipients,
  budgetBlockPoint,
  budgetBreachBody,
  budgetBreachTitle,
  budgetPercentLabel,
  budgetProgress,
  budgetReadings,
  budgetSpendShown,
  DEFAULT_BLOCK_THRESHOLD,
  type TeamBudget,
  type TeamUsage,
  type WindowReading,
} from "@/data/teams";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  BUDGET_STATUS_LABEL,
  BUDGET_STATUS_VARIANT,
  budgetFillClass,
  budgetStatus,
} from "@/pages/teams/budget-band";

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

/** The status WORD beside a meter: "Warning" / "Exceeded" / "Blocked".
 *  Colour alone is not a state (colour-blind readers, and a skimming admin
 *  reads words before hues), so every off-nominal meter carries the label.
 *  Renders NOTHING when the budget is fine: a healthy row stays quiet, which
 *  is what makes the loud ones legible (AG-695: "how a team at 80 percent
 *  reads differently from one at 100 percent"). Status comes from
 *  `budgetStatus`, never re-derived at a call site. */
export function BudgetStatusBadge({
  spend,
  cap,
  warnThreshold,
  enforcement,
  blockThreshold = DEFAULT_BLOCK_THRESHOLD,
}: {
  spend: number;
  cap: number;
  warnThreshold: number;
  enforcement: BudgetEnforcement;
  blockThreshold?: number;
}) {
  const status = budgetStatus(
    spend,
    cap,
    warnThreshold,
    enforcement,
    blockThreshold
  );
  if (status === "ok") {
    return null;
  }
  return (
    <Badge
      className={cn(
        // Budget status only (user 2026-09-02): the red rungs sit at a 10%
        // dark tint, matching the breach banner beside them. The primitive's
        // 20% stays for every other destructive badge on the site.
        BUDGET_STATUS_VARIANT[status] === "destructive" &&
          "dark:bg-destructive/10"
      )}
      variant={BUDGET_STATUS_VARIANT[status]}
    >
      {BUDGET_STATUS_LABEL[status]}
    </Badge>
  );
}

/** The warn threshold, marked on the track as a 1px hairline. Without it the
 *  amber fill announces the warn band only AFTER it is crossed: the mark is
 *  what lets an admin see how much headroom a green bar still has before the
 *  alert fires. Absolutely positioned so it paints over the fill, and skipped
 *  once the fill has reached the cap: a full bar has no headroom left to
 *  measure, and the mark would only add noise to the red state. Lives here so
 *  the list's compact meter and the detail meter cannot drift apart. */
export function BudgetWarnTick({
  warnThreshold,
  fraction,
}: {
  warnThreshold: number;
  /** Fill fraction, already clamped to [0, 1] by `budgetProgress`. */
  fraction: number;
}) {
  if (fraction >= 1) {
    return null;
  }
  return (
    <span
      aria-hidden
      className="absolute inset-y-0 w-px bg-foreground/40"
      style={{ left: `${warnThreshold}%` }}
    />
  );
}

export function BudgetMeter({
  spend,
  cap,
  warnThreshold,
  enforcement,
  blockThreshold = DEFAULT_BLOCK_THRESHOLD,
  label,
  loading = false,
}: {
  spend: number;
  /** The selected window's cap, in USD. */
  cap: number;
  /** Percent of the cap at which the budget warns — shared across windows. */
  warnThreshold: number;
  /** A hard budget cannot pass its block point, so its numbers stop there. */
  enforcement: BudgetEnforcement;
  /** Percent of the cap at which a hard budget blocks. */
  blockThreshold?: number;
  /** Accessible name for the meter — "Org budget used", "Development budget used". */
  label: string;
  /** Swap the fill and the two readings for skeletons while the roll-up is
   *  in flight. The TRACK keeps its exact 6px box, so nothing moves when
   *  the real fill lands. */
  loading?: boolean;
}) {
  const fraction = budgetProgress(spend, cap) ?? 0;
  // A hard budget's spend can never exceed its cap: the gateway refuses the
  // request that would take it there. Showing $21.40 of $20.00 on a bar that
  // physically blocks at $20.00 would be reporting a state the system cannot
  // enter. Soft budgets keep counting (showback), so they show spend as-is.
  const shown = budgetSpendShown(spend, cap, enforcement, blockThreshold);
  if (loading) {
    // No `role="meter"` while loading: a meter with no value announces a
    // reading the page does not have yet. `aria-busy` on the pane root plus
    // the page's one `role="status"` carry the wait instead.
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="type-mono-14 text-foreground">
            <SkeletonText className="w-32" />
          </span>
          <span className="type-mono-14 text-muted-foreground">
            <SkeletonText className="w-20" />
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div
        aria-label={label}
        aria-valuemax={cap}
        aria-valuemin={0}
        aria-valuenow={shown}
        aria-valuetext={`${formatCurrency(shown)} of ${formatCurrency(cap)}`}
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
      >
        {/* Fill is primary ink under the warn threshold, the warning tone
            between warn and the cap, destructive past it. Colour is the only
            thing that changes across the three bands — the geometry stays put,
            so the bar never lies about being fuller than 100%. */}
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none",
            budgetFillClass(
              spend,
              cap,
              warnThreshold,
              enforcement,
              blockThreshold
            )
          )}
          style={{ width: `${fraction * 100}%` }}
        />
        <BudgetWarnTick fraction={fraction} warnThreshold={warnThreshold} />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="type-mono-14 text-foreground">
          {formatCurrency(shown)}
          <span className="text-muted-foreground">
            {" "}
            of {formatCurrency(cap)}
          </span>
        </span>
        <span className="type-mono-14 text-muted-foreground">
          {budgetPercentLabel(spend, cap, enforcement, blockThreshold)} used
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
  loading = false,
}: {
  label: string;
  value: string;
  /** Tooltip body behind the eyebrow's Info glyph. */
  tip: string;
  /** Numeric values take the mono tabular voice; worded ones stay sans. */
  mono?: boolean;
  /** Swap the VALUE for a skeleton. The label and its Info tooltip stay:
   *  both are budget configuration the page already knows. */
  loading?: boolean;
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
        {loading ? <SkeletonText className="w-20" /> : value}
      </span>
    </div>
  );
}

export function BudgetSummary({
  reading,
  budget,
  meterLabel,
  hasManager,
  omitWindowFact = false,
  loading = false,
}: {
  /** The window being read: its cap, its spend, its scaled usage. */
  reading: WindowReading;
  /** Enforcement and warn percent are shared across a budget's windows. */
  budget: TeamBudget;
  meterLabel: string;
  /** Whether the team has a manager: decides the alert-recipient sentence. */
  hasManager: boolean;
  /** Drop the Window fact when the surrounding card already names the
   *  window (the stacked per-window cards on the Enterprise Budget tab). */
  omitWindowFact?: boolean;
  /** Skeleton every reading — the meter fill, its two lines, and each
   *  fact's value. Which FACTS appear is budget configuration, so the grid
   *  keeps its exact shape and only the values wait. */
  loading?: boolean;
}) {
  const { window, cap, spend } = reading;
  // `>=` not `>`: a HARD budget at exactly its cap is over, not almost over.
  // The gateway is already refusing requests there, so "Remaining $0.00" is
  // the honest first fact and "Over budget by" would be a lie (spend cannot
  // pass the cap). A SOFT budget landing exactly on the cap is likewise past
  // the line, not inside it.
  const hard = budget.enforcement === "hard";
  // A hard budget is "over" at its block point (the block percent of the
  // cap), a soft one at the cap.
  const blockPoint = budgetBlockPoint(
    cap,
    budget.enforcement,
    budget.blockThreshold
  );
  const over = spend >= blockPoint;
  // On a hard budget the remainder is what is left before the block, floored
  // at zero. On a soft one it is the overrun.
  const shown = budgetSpendShown(
    spend,
    cap,
    budget.enforcement,
    budget.blockThreshold
  );
  return (
    <div className="flex flex-col gap-4">
      <BudgetMeter
        blockThreshold={budget.blockThreshold}
        cap={cap}
        enforcement={budget.enforcement}
        label={meterLabel}
        loading={loading}
        spend={spend}
        warnThreshold={budget.warnThreshold}
      />
      {/* Four facts: the meter above already states spend, cap, and percent,
          so what is left is what the operator would otherwise compute: what
          remains, what happens at the cap, where the alert fires (with its
          dollar figure), and the window with its reset behaviour. */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          omitWindowFact
            ? "@xl:grid-cols-3"
            : "@3xl:grid-cols-4 @xl:grid-cols-2"
        )}
      >
        <BudgetFact
          label={over && !hard ? "Over budget by" : "Remaining"}
          loading={loading}
          mono
          tip={
            over && !hard
              ? "How far spend in this window has passed its cap."
              : "What is left of this window's cap before it is used up."
          }
          value={formatCurrency(Math.abs(blockPoint - shown))}
        />
        <BudgetFact
          label="Enforcement"
          tip={`${BUDGET_ENFORCEMENT_LABEL.soft}. ${BUDGET_ENFORCEMENT_LABEL.hard}.`}
          value={hard ? "Hard" : "Soft"}
        />
        <BudgetFact
          label="Warn at"
          mono
          tip={`Percent of the cap at which the warning alert fires, with the dollar figure that works out to. ${budgetAlertRecipients(hasManager, budget.notifyAdmins)}`}
          value={`${budget.warnThreshold}% (${formatCurrency((cap * budget.warnThreshold) / 100)})`}
        />
        {/* Only when the opt-out is ON: a budget alerting everyone is the
            default, and a fact reading "Admin alerts: On" would be noise on
            every other budget. Absent = normal (CTO 2026-09-03). */}
        {budget.enforcement === "soft" && !budget.notifyAdmins ? (
          <BudgetFact
            label="Admin alerts"
            tip="Org admins and owner opted out of warning alerts for this budget. The team's manager is still alerted."
            value="Off"
          />
        ) : null}
        {hard ? (
          <BudgetFact
            label="Block at"
            mono
            tip="Percent of the cap at which the gateway stops accepting this team's messages, with the dollar figure that works out to."
            value={`${budget.blockThreshold}% (${formatCurrency(blockPoint)})`}
          />
        ) : null}
        {omitWindowFact ? null : (
          <BudgetFact
            label="Window"
            tip={BUDGET_WINDOW_RESET_COPY[window]}
            value={`${BUDGET_WINDOW_LABEL[window]}, ${BUDGET_WINDOW_RESET_SHORT[window]}`}
          />
        )}
      </div>
    </div>
  );
}

/** Page-level alert for a team whose budget has reached or passed a cap.
 *
 *  It sits above the tabs, not inside the Budget tab, because the admin who
 *  needs it did not come looking for it: they opened the team to read the
 *  roster or chase a spike, and traffic is being refused right now. Burying
 *  the blocked state one tab deep means the only person who sees it is the
 *  person who already suspected it (AG-695).
 *
 *  ONE banner, one icon, one title per breached window: a team running a
 *  5-hour AND a weekly cap can breach both, and two stacked alert cards would
 *  read as two separate incidents rather than one team in trouble. The window
 *  is named in every title because that is the answer to "which cap did it".
 *  Returns null when nothing is breached, so the header collapses back to its
 *  normal rhythm with no reserved space. */
export function BudgetBreachBanner({
  teamName,
  budget,
  usage,
}: {
  teamName: string;
  budget: TeamBudget;
  /** The team roll-up; each window reads its own scaled projection of it. */
  usage: TeamUsage;
}) {
  const breached = budgetReadings(usage, budget).filter((r) => {
    const status = budgetStatus(
      r.spend,
      r.cap,
      budget.warnThreshold,
      budget.enforcement,
      budget.blockThreshold
    );
    return status === "blocking" || status === "exceeded";
  });
  if (breached.length === 0) {
    return null;
  }
  return (
    <div
      className="mb-2 flex items-start gap-2 rounded-md border border-danger-200 bg-danger-50 p-3 dark:border-destructive/30 dark:bg-destructive/10"
      role="alert"
    >
      {/* h-5 wrapper centers the 16px glyph on the first 20px title line, so
          the icon stays aligned when the copy wraps: the Callout pattern. */}
      <span aria-hidden className="flex h-5 shrink-0 items-center">
        <OctagonAlert
          className="size-4 text-danger-800 dark:text-danger-300"
          strokeWidth={1.75}
        />
      </span>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {breached.map((r) => (
          <li className="flex flex-col gap-1" key={r.window}>
            <p className="type-label-14 m-0 text-danger-800 dark:text-danger-300">
              {budgetBreachTitle(
                teamName,
                r.window,
                budget.enforcement,
                budget.blockThreshold
              )}
            </p>
            <p className="type-copy-14 m-0 text-pretty text-danger-800 dark:text-danger-300">
              {budgetBreachBody(r.window, r.spend, r.cap, budget.enforcement)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
