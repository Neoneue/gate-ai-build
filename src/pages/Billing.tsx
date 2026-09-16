import { useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { PageTitle } from "@/components/ui/page-title";
import { SquareArrowUpIcon } from "@/components/ui/square-arrow-up";
import { ENTERPRISE_REVOKED_ON } from "@/data/billing-enterprise";
import { BILLING_PERIOD_END } from "@/data/billing-history";
import { PRO_SEAT_RATE_USD } from "@/data/billing-pro";
import { MEMBER_ROWS } from "@/data/team-members";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatCurrency, formatDateNumeric } from "@/lib/formatters";
import { CreditStatRow, CreditsCard } from "@/pages/billing/CreditsCard";
import { HistorySection } from "@/pages/billing/HistorySection";
import { PaymentMethodCard } from "@/pages/billing/PaymentMethodCard";
import { CancelPlanDialog } from "@/pages/cancel-plan-dialog";
import { PlanComparisonDialogPro } from "@/pages/plan-comparison-dialog-pro";

/* ─────────────────────────────────────────────────────────────────────────
 * Billing page (route: /billing, sidebar: "Billing")
 *
 * Three sections stacked: plan + credits row (50/50), and the History
 * table. Mock data assumes a fresh workspace with one $25 top-up, two
 * gateway-request debits, and two micro-adjustments — reconciles with the
 * Credits hero ($49.99238 = the running balance after the last history row).
 *
 * The Credits card and the Payment method card live in `src/pages/billing/`
 * since 2026-09-16; the Enterprise twin renders the same two modules.
 * ───────────────────────────────────────────────────────────────────────── */

export function Billing() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  // `?state=revoked` is the one-way preview link for the Enterprise -> Pro
  // transition (ticket `enterprise-billing-plan-surface`): Support removed the
  // entitlement, so the org lands back on this page and needs to be told why
  // its plan changed. Absent the param this page is unchanged.
  const [searchParams] = useSearchParams();
  const revoked = searchParams.get("state") === "revoked";

  return (
    <DashboardChrome
      activeNavId="billing"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Content stays fluid, then caps so the cards don't stretch across
          ultrawide displays. CONTAINER query, not viewport: the Ask AI
          panel narrows this column without narrowing the window. `@5xl`
          (1024px inline-size) is the same number as the `max-w-5xl` cap, so
          the class is a no-op until the column is wide enough to bind. */}
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <PageHeader />
        {revoked && (
          <Callout>
            Your organization moved from Enterprise to Pro on{" "}
            {formatDateNumeric(ENTERPRISE_REVOKED_ON)}. Seats are now billed at
            $20 per seat.
          </Callout>
        )}
        <PlanCreditsRow />
        <PaymentMethodCard />
        <HistorySection />
      </div>
    </DashboardChrome>
  );
}

function PageHeader() {
  return (
    <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
      <PageTitle>Billing</PageTitle>
      <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
        Manage your plan, track credit usage, and review every gateway
        transaction.
      </p>
    </div>
  );
}

/* ─── Plan + Credits (stacked, each full-width row) ──────────────────── */

function PlanCreditsRow() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <PlanCard />
      <CreditsCard />
    </div>
  );
}

function PlanCard() {
  const [compareOpen, setCompareOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  return (
    <Card className="min-w-0 pb-0!" tone="pro">
      <CardHeader>
        <CardTitle>Your plan</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-3">
          {/* Plan name carries its tier badge ink (user direction 2026-09-16). */}
          <HeroNumeric
            className="text-indigo-700 dark:text-indigo-300"
            size="lg"
          >
            Pro
          </HeroNumeric>
          <p className="type-copy-14 m-0 text-pretty text-foreground">
            Scans every request sent through your own provider keys for prompt
            injections, credential leaks and PII. Includes the full
            Constellation Gate audit trail.
          </p>
        </div>

        {/* Seats sub-card — the Enterprise twin's recipe: a header block of
            title over subtitle, a hairline, then the numbers as a label/value
            stat list. Same shape on all three tiers so a plan change reads as
            the same surface with different values. */}
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card-muted p-4">
          <div className="flex flex-col gap-1">
            <p className="type-label-16 m-0 text-foreground">Seats</p>
            <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
              Each member of your organization uses one seat. Invitations count
              once they're accepted.
            </p>
          </div>
          <dl className="type-copy-14 m-0 flex flex-col gap-2 border-border border-t pt-3">
            <CreditStatRow label="Seats" mono value={MEMBER_ROWS.length} />
            <CreditStatRow
              label="Price"
              mono
              value={`${formatCurrency(PRO_SEAT_RATE_USD)} / user / month`}
            />
            <CreditStatRow label="Renews on" value={BILLING_PERIOD_END} />
            <CreditStatRow
              label="Next invoice"
              mono
              value={`${formatCurrency(MEMBER_ROWS.length * PRO_SEAT_RATE_USD)} on ${BILLING_PERIOD_END}`}
            />
          </dl>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-border border-t py-2">
        <Button
          onClick={() => setCompareOpen(true)}
          size="sm"
          variant="outline"
        >
          <SquareArrowUpIcon aria-hidden data-icon="inline-start" size={16} />
          Manage subscription
        </Button>
      </CardFooter>
      <PlanComparisonDialogPro
        onDowngrade={() => setCancelOpen(true)}
        onOpenChange={setCompareOpen}
        onUpgrade={() => setCompareOpen(false)}
        open={compareOpen}
      />
      <CancelPlanDialog onOpenChange={setCancelOpen} open={cancelOpen} />
    </Card>
  );
}
