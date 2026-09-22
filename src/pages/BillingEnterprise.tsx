import { OctagonAlert } from "lucide-react";
import type * as React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SquareArrowUpIcon } from "@/components/ui/square-arrow-up";
import {
  ENTERPRISE_SEAT_RATE_USD,
  type EnterpriseBillingState,
  type EnterpriseBillingView,
  enterpriseBillingView,
  enterprisePlanSeats,
  enterpriseSeatCount,
  nextInvoiceUsd,
  parseEnterpriseBillingState,
} from "@/data/billing-enterprise";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatCurrency, formatDateNumeric } from "@/lib/formatters";
import { withTierOf } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { CreditsCard } from "@/pages/billing/CreditsCard";
import { HistoryLedger } from "@/pages/billing/HistorySection";
import { PaymentMethodCard } from "@/pages/billing/PaymentMethodCard";

/* ─────────────────────────────────────────────────────────────────────────
 * Billing — ENTERPRISE twin (route: /billing-enterprise, sidebar: "Billing")
 *
 * Enterprise is a Support-granted entitlement billed BY SEAT (ticket
 * `enterprise-billing-plan-surface`). It cannot be self-upgraded, downgraded
 * or cancelled, so the plan card routes to the Manage subscription ladder,
 * where every Enterprise rung points at Constellation Support rather than a
 * checkout. Seats are a PLAN quantity read as utilization ("4 of 4"); seat
 * changes happen on the plan via Support, so there is no proration and no
 * per-member costing on this page (PM + user, call 2026-09-17). Billing
 * history is the one PAYG credit ledger Pro shows, no Plan tab.
 *
 * `?state=` is a one-way preview link (like `?range=`): it is read, never
 * stripped. `revoked` is NOT handled here — a revoked org is back on Pro, so
 * that notice renders on `/billing`.
 * ───────────────────────────────────────────────────────────────────────── */

export function BillingEnterprise() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = parseEnterpriseBillingState(searchParams.get("state"));
  // ONE source for every section, resolved per state.
  const view = enterpriseBillingView(state);

  // The preview switch writes the same `?state=` the page already reads, so a
  // pasted link and a picked state are the same surface. `replace` keeps the
  // back button pointing at wherever the user came from rather than at a
  // chain of previews.
  const onStateChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === "active") {
      params.delete("state");
    } else {
      params.set("state", next);
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <DashboardChrome
      activeNavId="billing"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Three sections, the Settings page pattern: an h2 plus one sentence
          OUTSIDE the card, so a card carries content and actions only. H1
          Billing PRD order: plan, credit balance, history. */}
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <PageHeader onStateChange={onStateChange} state={state} />
        <StateBanner view={view} />

        <div className="flex flex-col gap-4">
          <SectionTitle as="h2">Plan</SectionTitle>
          <PlanCard view={view} />
        </div>

        <div className="mt-2 flex flex-col gap-4">
          <SectionTitle as="h2">Credits</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            <CreditsCard
              balance={view.creditBalance}
              lastTopUp={view.lastTopUp}
            />
            {/* Support invoices the Enterprise seat charge directly, so the
                card on file only ever pays a credit top-up here. */}
            <PaymentMethodCard
              description="Charged for credit top-ups."
              empty={!view.hasCard}
            />
          </div>
        </div>

        {/* Pro's Billing history, verbatim: title left, Invoice portal right,
            one flush card with the PAYG ledger. */}
        <div className="mt-2 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <SectionTitle as="h2">Billing history</SectionTitle>
            <Button className="shrink-0" size="sm" variant="outline">
              <ReceiptIcon aria-hidden data-icon="inline-start" size={16} />
              Invoice portal
            </Button>
          </div>
          <Card density="flush">
            <HistoryLedger rows={view.ledgerRows} />
          </Card>
        </div>
      </div>
    </DashboardChrome>
  );
}

/* ─── Header + state switch ──────────────────────────────────────────── */

/** Plain-language names for the preview states: the switch reads as "what is
 *  happening to this org", not as an internal enum. `revoked` is deliberately
 *  absent — that org is back on Pro, so its notice lives on `/billing` and
 *  offering it here would only be a redirect out of the page. */
const STATE_LABEL: Record<EnterpriseBillingState, string> = {
  active: "Current",
  granted: "Upgraded to Enterprise",
  unprovisioned: "Billing being set up",
  "past-due": "Payment failed",
};

function PageHeader({
  state,
  onStateChange,
}: {
  state: EnterpriseBillingState;
  onStateChange: (next: string) => void;
}) {
  return (
    // Title block left, state switch right; `flex-wrap` drops the switch
    // under the subtitle once the column is too narrow to hold both.
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        <PageTitle>Billing</PageTitle>
        <p className="type-copy-18 m-0 text-pretty text-muted-foreground">
          Everything your organization pays for Gate, in one place.
        </p>
      </div>
      <Select onValueChange={onStateChange} value={state}>
        <SelectTrigger
          aria-label="Billing state"
          className="w-auto shrink-0"
          size="sm"
        >
          <SelectValue>{STATE_LABEL[state]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">{STATE_LABEL.active}</SelectItem>
          <SelectItem value="granted">{STATE_LABEL.granted}</SelectItem>
          <SelectItem value="unprovisioned">
            {STATE_LABEL.unprovisioned}
          </SelectItem>
          <SelectItem value="past-due">{STATE_LABEL["past-due"]}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/* ─── State banners ──────────────────────────────────────────────────── */

/** Danger banner for the past-due preview. Same recipe as
 *  `BudgetBreachBanner` (src/pages/teams/budget.tsx): `role="alert"`, a 16px
 *  OctagonAlert in an `h-5` wrapper so it centres on the first title line,
 *  title in the label voice over body copy. Non-focusable: it reports state,
 *  it offers no control. Copy is the fact and nothing else: no PRD or ticket
 *  line defines what happens to an Enterprise org after a failed charge, so
 *  the banner does not promise access, retries or a Support route. */
function PastDueBanner({
  amount,
  invoicedOn,
}: {
  amount: number;
  invoicedOn: Date;
}) {
  return (
    <div
      className="flex items-start gap-2 rounded-md border border-danger-200 bg-danger-50 p-3 dark:border-destructive/30 dark:bg-destructive/10"
      role="alert"
    >
      <span aria-hidden className="flex h-5 shrink-0 items-center">
        <OctagonAlert
          aria-hidden
          className="size-4 text-danger-800 dark:text-danger-300"
          strokeWidth={1.75}
        />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="type-label-14 m-0 text-danger-800 dark:text-danger-300">
          Payment failed
        </p>
        <p className="type-copy-14 m-0 text-pretty text-danger-800 dark:text-danger-300">
          We couldn't collect {formatCurrency(amount)} on{" "}
          {formatDateNumeric(invoicedOn)}.
        </p>
      </div>
    </div>
  );
}

function StateBanner({ view }: { view: EnterpriseBillingView }) {
  if (view.state === "granted") {
    return (
      <Callout>
        Welcome to Enterprise. Your organization was upgraded on{" "}
        {formatDateNumeric(view.grantedOn)}.
      </Callout>
    );
  }
  if (view.state === "unprovisioned") {
    return (
      <Callout>
        Enterprise was added to your organization on{" "}
        {formatDateNumeric(view.grantedOn)}. We're still setting up seat
        billing; your seat pricing and next invoice will appear here shortly.
        Credits keep working as before.
      </Callout>
    );
  }
  if (view.state === "past-due") {
    if (view.failedCharge === null) {
      return null;
    }
    return (
      <PastDueBanner
        amount={view.failedCharge.amount}
        invoicedOn={view.failedCharge.date}
      />
    );
  }
  return null;
}

/* ─── Plan ───────────────────────────────────────────────────────────── */

/** A period's `end` is the exclusive bound (the 1st of next month), so the
 *  period a person reads runs to the day before it. Built from the parts
 *  rather than by subtracting 24h, which a DST boundary would shift. */
function periodLastDay(end: Date): Date {
  return new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
}

/** The Pro Credits card's `CreditStatRow` (Billing.tsx), copied rather than
 *  lifted — the Free twin does the same. `muted` is the one addition: an
 *  unprovisioned value is a placeholder, not data, and reads as such. */
function StatRow({
  label,
  value,
  mono = false,
  muted = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="type-label-14 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "type-copy-14 m-0",
          mono && "font-mono tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function PlanCard({ view }: { view: EnterpriseBillingView }) {
  const { pathname } = useLocation();
  const unprovisioned = view.state === "unprovisioned";
  const seats = enterpriseSeatCount();
  const planSeats = enterprisePlanSeats();

  return (
    <Card className="min-w-0 pb-0!" tone="enterprise">
      {/* `gap-3`: the Credits card's flat rhythm, verbatim. Hero, plan
          description and the seats subtitle read as one 12px column; the
          `dl`'s own `mt-3` opens the 24px band that carries the hairline. */}
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-3">
          {/* Plan name carries its tier badge ink (user direction 2026-09-16). */}
          <HeroNumeric className="text-tier-enterprise" size="lg">
            Enterprise
          </HeroNumeric>
          <p className="type-copy-14 m-0 text-pretty text-foreground">
            Everything in Pro, plus organization-wide compression and security
            settings for all of your teams. Billed per seat.
          </p>
        </div>

        {/* Seats facts, flat on the card (user direction 2026-09-16): no
            inset chrome and no second title, so the plan card reads as one
            surface. The subtitle stays with the plan description above the
            hairline, and the numbers below it line up as a label/value stat
            list instead of hiding inside prose. */}
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          Each member of your organization uses one seat. Invitations count once
          they're accepted.
        </p>
        {/* Hairline between the description block and its data, the same
            `border-t` the CardFooter uses: without it the `dt` labels read
            as a continuation of the subtitle. It sits 24px under the subtitle
            (`gap-3` plus `mt-3`) and 12px over the first row (`pt-3`): the
            Credits card's band, so the two cards on this page match. */}
        <dl className="type-copy-14 m-0 mt-3 flex flex-col gap-2 border-border border-t pt-3">
          {/* Utilization, not a headcount: seats in use of seats on the plan
              (PM + user, call 2026-09-17). */}
          <StatRow label="Seats" mono value={`${seats} of ${planSeats}`} />
          <StatRow
            label="Price per seat"
            mono={!unprovisioned}
            muted={unprovisioned}
            value={
              unprovisioned
                ? "After billing is set up"
                : `${formatCurrency(ENTERPRISE_SEAT_RATE_USD)} / seat / month`
            }
          />
          <StatRow
            label="Current period"
            mono={!unprovisioned}
            muted={unprovisioned}
            value={
              unprovisioned
                ? "Not started"
                : `${formatDateNumeric(view.period.start)} to ${formatDateNumeric(periodLastDay(view.period.end))}`
            }
          />
          <StatRow
            label="Next invoice"
            mono={!unprovisioned}
            muted={unprovisioned}
            value={
              unprovisioned
                ? "After billing is set up"
                : `${formatCurrency(nextInvoiceUsd())} on ${formatDateNumeric(view.period.end)}`
            }
          />
        </dl>
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2 border-border border-t py-2">
        <p className="type-copy-14 m-0 mr-auto text-pretty text-muted-foreground">
          Want to add or remove seats, or change your plan?
        </p>
        {/* The plan ladder, same destination and label as every other tier
            (2026-09-22): an Enterprise org opening it sees Enterprise marked
            as its current plan. */}
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
    </Card>
  );
}
