import type { ReactElement } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExternalLinkIcon } from "@/components/ui/external-link";

/* ─────────────────────────────────────────────────────────────────────────
 * Cancel plan — shared confirm dialog
 *
 * ONE dialog, two entry points: the Settings account-management "Cancel plan"
 * card and the Billing "Downgrade plan" action inside PlanComparisonDialogPro.
 * It was extracted out of Settings so that removing it from Settings later is
 * a one-line change and the Billing path is untouched — the whole reason this
 * file exists.
 *
 * Controlled: the caller owns `open` / `onOpenChange`. There is no built-in
 * trigger by default because Billing opens it programmatically (after the
 * comparison dialog finishes closing). Settings passes its CardFooter button
 * as `trigger` so that card keeps its native `AlertDialogTrigger` behaviour
 * (aria-haspopup, focus return) exactly as before the extraction.
 *
 * Width is a call-site override at 500px (up from the primitive's 384px
 * `sm:max-w-sm`) — it carries more copy than a one-line confirm. It repeats
 * the primitive's full variant chain (`data-[size=default]:sm:`) on purpose:
 * a bare `sm:max-w-[500px]` is specificity (0,1,0) and would silently LOSE to
 * the primitive's `data-[size=default]:sm:max-w-sm` at (0,2,0), and
 * tailwind-merge does not treat the two variant sets as conflicting so it
 * strips neither. Matching the chain lets merge drop the default. Mobile
 * stays on the primitive's `max-w-xs` — 500px would overflow a 375px viewport.
 *
 * The footer carries `mt-2`, which is how `<DialogFooter>` encodes the house
 * 24px action-band gap (design.md §7: "the `mt-2` lifts the action band ~24px
 * below the last field") — 8px on top of the content grid's `gap-4`.
 * `<AlertDialogFooter>` is the one footer in the family that does not bake it
 * in, so it is supplied here rather than left at 16px.
 *
 * Cancelling a plan is reversible by resubscribing, so — unlike the delete
 * flow in Settings — there is intentionally NO type-to-confirm gate here,
 * only the intro + warning callout + a single destructive confirm.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Period end shown in the cancel-plan intro. MUST match the "Renews on …"
 * line on the Pro Billing page (`Billing.tsx`, "Your plan" card) — same
 * workspace, same subscription, so the two surfaces cannot be allowed to
 * disagree. Exported so `Billing.tsx` reads this one definition instead of
 * repeating the literal; the durable fix if the date ever goes dynamic is a
 * billing data source both import from.
 */
export const BILLING_PERIOD_END = "Jun 12, 2026";

/**
 * Tinted warning callout used by both confirm dialogs. The recipe is the
 * established in-dialog one from `ApiKeys.tsx` (two call sites there), lifted
 * to a shared component so the string exists once. `rounded-md` (8px) steps
 * the radius DOWN one tier from the dialog shell's `rounded-xl` (16px) per the
 * concentric-radius rule. Warning tone, not danger: the destructive register
 * is already carried by the title and the confirm button, so amber reads as
 * "here is what happens" instead of competing with them.
 *
 * Exported because the Settings delete dialog uses the identical recipe —
 * keeping it here means one copy, not two. Four call sites across the app now;
 * wants promoting to a `<Callout tone="warning">` primitive eventually, which
 * is out of scope for this move.
 */
export function ConsequenceCallout({ items }: { items: string[] }) {
  return (
    <div
      className="rounded-md border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-500/30 dark:bg-warning-500/15"
      role="note"
    >
      <ul className="type-copy-14 m-0 flex list-disc flex-col gap-1 pl-4 text-warning-700 dark:text-warning-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const CANCEL_CONSEQUENCES = [
  "Data retention reverts to the Free-tier window; anything older is pruned under the retention policy and is not restored if you upgrade again.",
  "Unused subscription days are not refunded.",
  "Your prepaid pay-as-you-go balance stays usable.",
];

type CancelPlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Optional trigger element (Settings passes its CardFooter button). When
   * omitted the dialog is opened programmatically by the caller — the Billing
   * downgrade path. Typed `ReactElement` because Base UI's `render` prop
   * merges its trigger props onto a single element.
   */
  trigger?: ReactElement;
};

export function CancelPlanDialog({
  open,
  onOpenChange,
  trigger,
}: CancelPlanDialogProps) {
  // Same behaviour at both entry points, by construction: close + the house
  // "scheduled action" toast. Baked in rather than passed by each caller so
  // the two entry points cannot drift.
  function handleConfirm() {
    onOpenChange(false);
    toast("Plan cancellation scheduled", {
      description:
        "Pro access continues to the end of the current billing period.",
    });
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      {trigger ? <AlertDialogTrigger render={trigger} /> : null}
      <AlertDialogContent className="data-[size=default]:sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel your plan?</AlertDialogTitle>
          <AlertDialogDescription>
            Renewal stops, and access continues until the end of your current
            billing period on{" "}
            <span className="type-label-14 text-foreground">
              {BILLING_PERIOD_END}
            </span>
            . This workspace then moves to the Free tier. You can reactivate
            renewal any time before then.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ConsequenceCallout items={CANCEL_CONSEQUENCES} />
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>Keep plan</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} variant="destructive">
            Cancel plan
            <ExternalLinkIcon aria-hidden data-icon="inline-end" size={16} />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
