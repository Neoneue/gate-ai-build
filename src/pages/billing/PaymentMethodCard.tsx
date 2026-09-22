import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCardIcon } from "@/components/ui/credit-card";

/* ──────────────────────────────────────────────────────────────────────
 * Payment method card, lifted VERBATIM out of Billing.tsx on 2026-09-16 so
 * the Enterprise page can render the same surface. The card on file pays
 * both the subscription renewal and any credit top-up, on every paid tier.
 *
 * `empty` is the no-card state a freshly provisioned org starts in. Its row
 * and its `Add card` action are the Free page's pattern verbatim
 * (BillingFree.tsx:798), so the two tiers cannot drift; the two moved into
 * the row together on 2026-09-22.
 * ───────────────────────────────────────────────────────────────────── */

export function PaymentMethodCard({
  /** What the card on file pays for. Pro renews a subscription AND funds
   *  top-ups; Enterprise is invoiced by Support, so only top-ups. */
  description = "Charged for subscription renewals and credit top-ups.",
  /** No card on file yet: the row reports the absence and offers the way in
   *  rather than an update. */
  empty = false,
}: {
  description?: string;
  empty?: boolean;
} = {}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment method</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* The action lives in the row, not a CardFooter: it acts on THIS
            card on file rather than on the section, and a second saved card
            would want its own button instead of one ambiguous footer action.
            `flex-wrap` + `ml-auto` keeps the row one line at every width it
            fits and drops the button to its own right-aligned line when the
            text and the button run out of room. */}
        <div className="flex flex-wrap items-center gap-4 rounded-xs border border-border bg-card-muted px-4 py-3">
          {empty ? (
            <>
              <span className="type-label-12 inline-flex h-10 shrink-0 items-center rounded-sm border border-border bg-card px-2 text-foreground">
                CARD
              </span>
              <span className="type-copy-14 min-w-0 text-foreground">
                No payment method on file
              </span>
            </>
          ) : (
            <>
              <span className="type-label-12 inline-flex h-10 shrink-0 items-center rounded-sm border border-border bg-card px-2 text-foreground">
                VISA
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="type-copy-14 text-foreground">•••• 4242</span>
                <span className="type-copy-14 text-muted-foreground">
                  Expires 01/27
                </span>
              </div>
            </>
          )}
          {empty ? (
            <Button className="ml-auto shrink-0" size="sm">
              <Plus
                aria-hidden
                className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none"
                data-icon="inline-start"
              />
              Add card
            </Button>
          ) : (
            <Button className="ml-auto shrink-0" size="sm" variant="outline">
              <CreditCardIcon aria-hidden data-icon="inline-start" size={16} />
              Update card
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
