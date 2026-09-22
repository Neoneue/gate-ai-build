import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { PageTitle } from "@/components/ui/page-title";
import { ReceiptIcon } from "@/components/ui/receipt";
import { SectionTitle } from "@/components/ui/section-title";
import { SquareArrowUpIcon } from "@/components/ui/square-arrow-up";
import { ENTERPRISE_REVOKED_ON } from "@/data/billing-enterprise";
import { BILLING_PERIOD_END } from "@/data/billing-history";
import { PRO_SEAT_RATE_USD } from "@/data/billing-pro";
import { MEMBER_ROWS } from "@/data/team-members";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatCurrency, formatDateNumeric } from "@/lib/formatters";
import { withTierOf } from "@/lib/plan";
import { CreditStatRow, CreditsCard } from "@/pages/billing/CreditsCard";
import { HistoryLedger } from "@/pages/billing/HistorySection";
import { PaymentMethodCard } from "@/pages/billing/PaymentMethodCard";
import { CancelPlanDialog } from "@/pages/cancel-plan-dialog";

/* ─────────────────────────────────────────────────────────────────────────
 * Billing page (route: /billing, sidebar: "Billing")
 *
 * Three sections stacked: plan + credits row (50/50), and the History
 * table. Mock data assumes a fresh workspace with one $25 top-up, two
 * gateway-request debits, and two micro-adjustments — reconciles with the
 * Credits hero ($49.99, the running balance after the last history row, shown to two decimals).
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

        <div className="flex flex-col gap-4">
          <SectionTitle as="h2">Plan</SectionTitle>
          <PlanCard />
        </div>

        <div className="mt-2 flex flex-col gap-4">
          <SectionTitle as="h2">Credits</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            <CreditsCard />
            <PaymentMethodCard />
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-4">
          {/* No section-title-with-action precedent existed, so: title block
              left, action right, `items-start` so the button aligns to the
              h2 line rather than to the centre of the two-line block. */}
          <div className="flex items-start justify-between gap-4">
            <SectionTitle as="h2">Billing history</SectionTitle>
            <Button className="shrink-0" size="sm" variant="outline">
              <ReceiptIcon aria-hidden data-icon="inline-start" size={16} />
              Invoice portal
            </Button>
          </div>
          <Card density="flush">
            <HistoryLedger />
          </Card>
        </div>
      </div>
    </DashboardChrome>
  );
}

function PageHeader() {
  return (
    <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
      <PageTitle>Billing</PageTitle>
      <p className="type-copy-18 m-0 text-pretty text-muted-foreground">
        Everything you pay for Gate, in one place.
      </p>
    </div>
  );
}

function PlanCard() {
  const { pathname } = useLocation();
  // Kept mounted with no trigger on this page since 2026-09-22: the plan
  // ladder moved to `/billing/plans`, and the Free card's "Downgrade plan"
  // there owns this dialog now. Left in place so the Billing-side entry
  // point is a one-line re-add rather than a re-import.
  const [cancelOpen, setCancelOpen] = useState(false);
  return (
    <Card className="min-w-0 pb-0!" tone="pro">
      {/* `gap-3`: the Credits card's flat rhythm, verbatim. Hero, plan
          description and the seats subtitle read as one 12px column; the
          `dl`'s own `mt-3` opens the 24px band that carries the hairline. */}
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-3">
          {/* Plan name carries its tier badge ink (user direction 2026-09-16). */}
          <HeroNumeric className="text-tier-pro" size="lg">
            Pro
          </HeroNumeric>
          <p className="type-copy-14 m-0 text-pretty text-foreground">
            Scans every request sent through your own provider keys for prompt
            injections, credential leaks and PII. Includes the full
            Constellation Gate audit trail.
          </p>
        </div>

        {/* Seats facts, flat on the card (user direction 2026-09-16): no inset
            chrome and no second title, so the plan card reads as one surface.
            The subtitle stays with the plan description above the hairline,
            and the numbers below it line up as a label/value stat list. Same
            shape on all three tiers so a plan change reads as the same
            surface with different values. */}
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          Each member of your organization uses one seat. Invitations count once
          they're accepted.
        </p>
        {/* Hairline between the description block and its data, the same
            `border-t` the CardFooter uses: without it the `dt` labels read as
            a continuation of the subtitle. It sits 24px under the subtitle
            (`gap-3` plus `mt-3`) and 12px over the first row (`pt-3`): the
            Credits card's band, so the two cards on this page match. */}
        <dl className="type-copy-14 m-0 mt-3 flex flex-col gap-2 border-border border-t pt-3">
          <CreditStatRow label="Seats" mono value={MEMBER_ROWS.length} />
          <CreditStatRow
            label="Price"
            mono
            value={`${formatCurrency(PRO_SEAT_RATE_USD)} / user / month`}
          />
          <CreditStatRow label="Renews on" mono value={BILLING_PERIOD_END} />
          <CreditStatRow
            label="Next invoice"
            mono
            value={`${formatCurrency(MEMBER_ROWS.length * PRO_SEAT_RATE_USD)} on ${BILLING_PERIOD_END}`}
          />
        </dl>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-border border-t py-2">
        <Button
          nativeButton={false}
          render={<Link to={withTierOf(pathname, "/billing/plans")} />}
          size="sm"
          variant="outline"
        >
          <SquareArrowUpIcon aria-hidden data-icon="inline-start" size={16} />
          Manage subscription
        </Button>
      </CardFooter>
      <CancelPlanDialog onOpenChange={setCancelOpen} open={cancelOpen} />
    </Card>
  );
}
