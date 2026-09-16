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
 * ───────────────────────────────────────────────────────────────────── */

export function PaymentMethodCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment method</CardTitle>
        <CardDescription>
          Charged for subscription renewals and credit top-ups.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 rounded-md border border-border bg-card-muted p-4">
          <span className="type-label-12 inline-flex h-10 items-center rounded-sm border border-border bg-card px-2 text-foreground">
            VISA
          </span>
          <div className="flex flex-col">
            <span className="type-copy-14 text-foreground">•••• 4242</span>
            <span className="type-copy-14 text-muted-foreground">
              Expires 01/27
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-border border-t py-2">
        <Button size="sm" variant="outline">
          <CreditCardIcon aria-hidden data-icon="inline-start" size={16} />
          Update card
        </Button>
      </CardFooter>
    </Card>
  );
}
