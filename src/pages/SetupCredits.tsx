import { CreditCard, Lock, Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SetupIconChip, SetupScaffold } from "@/pages/onboarding-shared";

/* ─── /setup-credits-default ────────────────────────────────────────────────
 * Pay-as-you-go credit top-up, reached from the Manual setup PAYG note. Back
 * breadcrumb → Manual setup (PAYG).
 * ────────────────────────────────────────────────────────────────────────── */

const AMOUNTS = [10, 25, 50, 100] as const;

export function SetupCredits() {
  const [amount, setAmount] = useState<number>(25);

  return (
    <SetupScaffold
      backLabel="Manual setup"
      backTo="/setup-manual-default?bill=payg"
      subtitle="Pay-as-you-go draws from your credit balance."
      title="Credits"
    >
      <Card density="flush">
        {/* Balance header */}
        <div className="flex flex-wrap items-center gap-3 border-border border-b px-6 py-4">
          <SetupIconChip icon={Wallet} tone="success" />
          <div className="flex flex-col gap-1">
            <h2 className="type-heading-16 m-0 text-foreground">
              Current balance
            </h2>
            <p className="type-copy-14 m-0 text-muted-foreground">
              Auto-reload keeps you from running dry mid-request.
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="type-heading-24 text-foreground tabular-nums">
              $0.00
            </div>
            <div className="type-copy-12 text-muted-foreground">
              No credits yet
            </div>
          </div>
        </div>

        {/* Add credits */}
        <div className="flex flex-col gap-4 p-6">
          <h3 className="type-label-14 m-0 text-foreground">Add credits</h3>
          <div
            aria-label="Credit amount"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            role="radiogroup"
          >
            {AMOUNTS.map((value) => {
              const selected = amount === value;
              return (
                <button
                  aria-checked={selected}
                  className={cn(
                    "type-label-14 flex h-12 items-center justify-center rounded-sm border tabular-nums outline-none transition-[colors,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-border bg-card text-foreground hover:border-neutral-300"
                  )}
                  key={value}
                  onClick={() => setAmount(value)}
                  role="radio"
                  type="button"
                >
                  ${value}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <CreditCard aria-hidden data-icon="inline-start" />
              Add ${amount} in credits
            </Button>
            <span className="type-copy-14 inline-flex items-center gap-1 text-muted-foreground">
              <Lock aria-hidden className="size-4" strokeWidth={1.75} />
              Secure checkout via Stripe
            </span>
          </div>

          <label className="flex w-fit items-center gap-3">
            <Switch defaultChecked size="lg" />
            <span className="type-copy-14 text-foreground">
              Auto-reload $25 when my balance drops below $5
            </span>
          </label>
        </div>
      </Card>
    </SetupScaffold>
  );
}
