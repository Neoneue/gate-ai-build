import { ArrowLeft, CreditCard, Store } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { wait } from "@/pages/onboarding/improved-data";
import { addOnboardingCredits } from "@/pages/onboarding/onboarding-credits";
import { ONBOARDING_ROUTES } from "@/pages/onboarding/onboarding-routes";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";

/* ─── OnboardingCheckout ────────────────────────────────────────────────────
 * `/checkout-onboarding`: a mock of the hosted card checkout that "Add
 * credits" hands off to (owner 2026-10-13, from the old design's "2b - PAYG
 * setup" frame), so the demo walks the real top-up path: pick an amount in
 * the dialog, land here, Pay, return to setup with the balance added.
 * Back returns to setup with the dialog open again, to cancel or change the
 * amount. Built from the repo's own primitives and tokens; no payment
 * brand's marks or colours. Nothing is charged: Pay waits a beat, then adds
 * the credits to the setup state and the shared onboarding balance (the
 * Gate Chat tab reads it, onboarding-credits.ts).
 * ───────────────────────────────────────────────────────────────────────── */

/** Router state the setup page passes in. */
export interface CheckoutState {
  amount: number;
  returnTo: string;
}

/** The card-processing fee line, as the old design's checkout showed it. */
const PROCESSING_FEE_RATE = 0.05;
/** How long the mock payment "processes" before returning. */
const PAY_MS = 1200;

const MERCHANT = "Constellation Gate AI";

export function OnboardingCheckout() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { updateImproved } = useOnboarding();
  const [paying, setPaying] = useState(false);
  const checkout = state as CheckoutState | null;

  if (!checkout?.amount) {
    return <Navigate replace to={ONBOARDING_ROUTES.improvedConnect} />;
  }
  const { amount, returnTo } = checkout;
  const fee = Math.round(amount * PROCESSING_FEE_RATE * 100) / 100;
  const total = amount + fee;

  const back = () => navigate(returnTo, { state: { reopenCredits: true } });
  const pay = async () => {
    setPaying(true);
    await wait(PAY_MS);
    updateImproved((current) => ({
      balanceUsd: current.balanceUsd + amount,
    }));
    addOnboardingCredits(amount);
    navigate(returnTo, { replace: true });
  };

  return (
    <main className="grid min-h-svh bg-card md:grid-cols-2">
      <section className="flex flex-col gap-10 bg-background px-6 py-12 md:px-16">
        <div className="flex items-center gap-3">
          <Button
            aria-label={`Back to ${MERCHANT}`}
            onClick={back}
            size="icon-sm"
            variant="ghost"
          >
            <ArrowLeft aria-hidden strokeWidth={1.75} />
          </Button>
          <span className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
            <Store aria-hidden className="size-4" strokeWidth={1.75} />
          </span>
          <span className="type-label-14 text-foreground">{MERCHANT}</span>
        </div>
        <div className="flex flex-col gap-2">
          <p className="type-copy-16 m-0 text-muted-foreground">
            Pay {MERCHANT}
          </p>
          <p className="type-heading-40 m-0 text-foreground tabular-nums">
            {formatCurrency(total)}
          </p>
        </div>
        <dl className="m-0 flex max-w-md flex-col gap-5">
          <LineItem
            detail={`Adds ${formatCurrency(amount)} to your credit balance`}
            label="Add Gate credits"
            value={formatCurrency(amount)}
          />
          <LineItem
            detail="5.00% card-processing fee"
            label="Processing fee"
            value={formatCurrency(fee)}
          />
        </dl>
      </section>

      <section className="flex flex-col items-center px-6 py-12 md:px-16">
        <div className="flex w-full max-w-md flex-col gap-6">
          <Card className="flex flex-col" density="flush">
            <PaymentRow label="Email">
              <span className="type-copy-14 text-foreground">
                user@example.com
              </span>
            </PaymentRow>
            <PaymentRow label="Payment">
              <span className="type-copy-14 text-foreground">Pay in full</span>
            </PaymentRow>
            <PaymentRow label="Pay with" last>
              <span className="inline-flex items-center gap-2">
                <CreditCard
                  aria-hidden
                  className="size-4 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <span className="type-copy-14 text-foreground">
                  Visa •••• 4242
                </span>
              </span>
            </PaymentRow>
          </Card>
          <Button
            aria-busy={paying}
            className="w-full"
            disabled={paying}
            onClick={() => void pay()}
            size="touch"
          >
            {paying ? "Processing…" : `Pay ${formatCurrency(total)}`}
          </Button>
          <p className="type-copy-12 m-0 text-center text-muted-foreground">
            Demo checkout. No card is charged.
          </p>
        </div>
      </section>
    </main>
  );
}

function LineItem({
  label,
  detail,
  value,
}: {
  label: string;
  detail: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-1">
        <dt className="type-label-14 text-foreground">{label}</dt>
        <dd className="type-copy-12 m-0 text-muted-foreground">{detail}</dd>
      </div>
      <dd className="type-mono-14 m-0 text-foreground">{value}</dd>
    </div>
  );
}

function PaymentRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-6 px-5 py-4",
        !last && "border-border border-b"
      )}
    >
      <span className="type-copy-14 w-20 shrink-0 text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
