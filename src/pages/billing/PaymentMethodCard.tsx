import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
 * and its `Add card` footer are the Free page's pattern verbatim
 * (BillingFree.tsx:798), so the two tiers cannot drift.
 * ───────────────────────────────────────────────────────────────────── */

export function PaymentMethodCard({
  /** What the card on file pays for. Pro renews a subscription AND funds
   *  top-ups; Enterprise is invoiced by Support, so only top-ups. */
  description = "Charged for subscription renewals and credit top-ups.",
  /** No card on file yet: the row reports the absence and the footer offers
   *  the way in rather than an update. */
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
        <div className="flex items-center gap-4 rounded-xs border border-border bg-card-muted p-4">
          {empty ? (
            <>
              <span className="type-label-12 inline-flex h-10 items-center rounded-sm border border-border bg-card px-2 text-foreground">
                CARD
              </span>
              <span className="type-copy-14 text-foreground">
                No payment method on file
              </span>
            </>
          ) : (
            <>
              <span className="type-label-12 inline-flex h-10 items-center rounded-sm border border-border bg-card px-2 text-foreground">
                VISA
              </span>
              <div className="flex flex-col">
                <span className="type-copy-14 text-foreground">•••• 4242</span>
                <span className="type-copy-14 text-muted-foreground">
                  Expires 01/27
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-border border-t py-2">
        {empty ? (
          <Button size="sm">
            <Plus
              aria-hidden
              className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none"
              data-icon="inline-start"
            />
            Add card
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            <CreditCardIcon aria-hidden data-icon="inline-start" size={16} />
            Update card
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
