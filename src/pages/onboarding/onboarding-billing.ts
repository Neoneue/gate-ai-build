import type { HistoryRow } from "@/data/billing-history";
import { formatCurrency, formatDateNumeric } from "@/lib/formatters";
import type { BillingFreeCredits } from "@/pages/BillingFree";
import type { ImprovedState } from "@/pages/onboarding/onboarding-state";

/* ─── The onboarding workspace's credits (owner 2026-10-13) ─────────────────
 * A new workspace has no billing history and no credits. Credits show ONLY
 * once the user added some on Gate credits billing (step 2's Add credits,
 * the mock checkout): the Credits card's balance and Last top-up, and one
 * "Credits added" row per top-up in Billing history, newest first, each
 * with its running balance. On Existing subscriptions the provider bills
 * usage, so the card and the history stay empty whatever was added before
 * the switch.
 * ───────────────────────────────────────────────────────────────────────── */

export function onboardingCredits(improved: ImprovedState): BillingFreeCredits {
  // Setup top-ups count on Gate credits only (owner 2026-10-13). A top-up
  // bought on Billing itself counts on either billing type: credits can
  // always be bought there (owner 2026-10-14).
  const topUps = improved.topUps.filter(
    (t) =>
      (improved.billing === "payg" || t.source === "billing") &&
      Number.isFinite(t.at) &&
      Number.isFinite(t.amountUsd) &&
      t.amountUsd > 0
  );
  let balanceUsd = 0;
  const history: HistoryRow[] = topUps
    .map((t, index) => {
      balanceUsd += t.amountUsd;
      return {
        id: `onboarding-top-up-${index}`,
        date: new Date(t.at),
        type: "Credits added" as const,
        amount: t.amountUsd,
        balanceAfter: balanceUsd,
      };
    })
    .reverse();
  const newest = history[0];
  return {
    balanceUsd,
    // The shape of `lastTopUpLabel` (billing-history.ts): date, then amount.
    lastTopUp: newest
      ? `${formatDateNumeric(newest.date)} · ${formatCurrency(newest.amount, {
          minFrac: 0,
          maxFrac: 0,
        })}`
      : null,
    history,
  };
}
