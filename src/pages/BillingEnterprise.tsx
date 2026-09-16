import { Headset, OctagonAlert } from "lucide-react";
import * as React from "react";
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { Monogram } from "@/components/ui/monogram";
import { initialsOf } from "@/components/ui/monogram-types";
import { PageTitle } from "@/components/ui/page-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { Timestamp } from "@/components/ui/timestamp";
import {
  ENTERPRISE_SEAT_RATE_USD,
  type EnterpriseBillingState,
  type EnterpriseBillingView,
  enterpriseBillingView,
  enterpriseSeatCount,
  nextInvoiceUsd,
  parseEnterpriseBillingState,
  type SeatChange,
} from "@/data/billing-enterprise";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatCurrency, formatDateNumeric } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { BillingHistorySection } from "@/pages/billing/BillingHistorySection";

/* ─────────────────────────────────────────────────────────────────────────
 * Billing — ENTERPRISE twin (route: /billing-enterprise, sidebar: "Billing")
 *
 * Enterprise is a Support-granted entitlement billed BY SEAT through its own
 * Stripe configuration (ticket `enterprise-billing-plan-surface`). It cannot
 * be self-upgraded, downgraded or cancelled, so this page deliberately drops
 * everything the Pro twin carries for self-serve commerce: the plan
 * comparison / cancel dialogs, the Credits card, Add-credits, Auto-recharge
 * and the payment-method card. The checkout CTA is replaced by a route to
 * Constellation Support. Free and Pro keep their own files untouched.
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
  // ONE source for every section. A day-one org cannot also have months of
  // invoices and a seat change, so the period, the changes and the invoices
  // are resolved together per state rather than each section reaching for
  // the current-month seed independently.
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
      {/* Plan, then what moved this period, then the history. NO
          payment-method card and NO credits card: Constellation Support
          provisions the Enterprise Stripe billing (H2 PRD), so the org has
          no card of its own to manage, and no PRD sentence puts a credit
          balance on this tier. */}
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <PageHeader onStateChange={onStateChange} state={state} />
        <StateBanner view={view} />
        <PlanCard view={view} />
        <SeatChangesSection view={view} />
        <BillingHistorySection rows={view.invoices} />
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
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Your Enterprise plan, seats, and invoices.
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
        {formatDateNumeric(view.grantedOn)}, and your first seat invoice is
        below.
      </Callout>
    );
  }
  if (view.state === "unprovisioned") {
    return (
      <Callout>
        Enterprise was added to your organization on{" "}
        {formatDateNumeric(view.grantedOn)}. We're still setting up billing, so
        nothing has been charged yet. Your seat pricing and invoices will appear
        here shortly.
      </Callout>
    );
  }
  if (view.state === "past-due") {
    // Only the seat charge can fail; a credit receipt is already settled.
    // Nothing failed means nothing to report, so the banner slot collapses.
    if (view.failedInvoice === null) {
      return null;
    }
    return (
      <PastDueBanner
        amount={view.failedInvoice.amount}
        invoicedOn={view.failedInvoice.date}
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
          "m-0",
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
  const unprovisioned = view.state === "unprovisioned";
  const seats = enterpriseSeatCount();

  return (
    <Card className="min-w-0 pb-0!" tone="enterprise">
      <CardHeader>
        <CardTitle>Your plan</CardTitle>
      </CardHeader>
      {/* `gap-6`: the identity block (hero + description) and the Seats
          sub-card are two different things, so 24px separates them while the
          hero and its description stay a 12px pair. */}
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-3">
          {/* Plan name carries its tier badge ink (user direction 2026-09-16). */}
          <HeroNumeric
            className="text-violet-700 dark:text-violet-300"
            size="lg"
          >
            Enterprise
          </HeroNumeric>
          <p className="type-copy-14 m-0 text-pretty text-foreground">
            Everything in Pro, plus organization-wide compression and security
            settings for all of your teams. Billed per seat.
          </p>
        </div>

        {/* Seats inset — the Pro twin's recipe, shaped like a Card: a header
            block of title (16px label voice) over subtitle, then the numbers
            as a label/value stat list rather than stacked sentences, so the
            four facts an admin scans for line up in one column instead of
            hiding inside prose (user direction 2026-09-16). Seat CHANGES are
            their own table card outside this one, because a growing org
            outgrows a sentence. */}
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card-muted p-4">
          <div className="flex flex-col gap-1">
            <p className="type-label-16 m-0 text-foreground">Seats</p>
            <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
              Each member of your organization uses one seat. Invitations count
              once they're accepted.
            </p>
          </div>
          {/* Hairline between the block's heading and its data, the same
              `border-t` the CardFooter uses: without it the `dt` labels read
              as a continuation of the subtitle. `pt-3` against the column's
              `gap-3` centres the rule in a 24px band. */}
          <dl className="type-copy-14 m-0 flex flex-col gap-2 border-border border-t pt-3">
            <StatRow label="Seats" mono value={seats} />
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
        </div>
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2 border-border border-t py-2">
        <p className="type-copy-14 m-0 mr-auto text-pretty text-muted-foreground">
          Want to add seats or change your plan? Constellation Support can help.
        </p>
        {/* No-op, like the Pro twin's `Invoice portal` / `Update card`. */}
        <Button size="sm" variant="outline">
          <Headset
            aria-hidden
            data-icon="inline-start"
            size={16}
            strokeWidth={1.75}
          />
          Contact support
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ─── Seat changes ───────────────────────────────────────────────────── */

function changeSortValue(row: SeatChange, key: string): string | number | null {
  switch (key) {
    case "member":
      return row.name;
    case "kind":
      return row.kind;
    case "date":
      return row.date.getTime();
    case "amount":
      return row.proratedUsd;
    default:
      return null;
  }
}

/** Mid-period seat movement, its own table card between the plan and the
 *  invoices (user direction 2026-09-16). A sentence inside the plan card
 *  stopped scaling the moment a second person moved; a table does not. The
 *  member cell is the Members table's cell verbatim (Team.tsx
 *  `MemberRowView`) so the same person reads the same way on both surfaces.
 *  Additions carry a prorated charge; removals carry none — the seat is paid
 *  through this period and simply comes off the next invoice. */
function SeatChangesSection({ view }: { view: EnterpriseBillingView }) {
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = React.useMemo(
    () => sortRows(view.changes, sort, changeSortValue),
    [view.changes, sort]
  );

  // Nothing has been billed yet, so there is no period to report changes
  // against — the card would be an empty promise rather than an empty state.
  if (!view.showChanges) {
    return null;
  }

  return (
    <Card density="flush">
      <CardHeader className="py-3">
        <CardTitle>Changes this period</CardTitle>
        <CardDescription>
          New seats are prorated to your renewal date. Removed seats come off
          your next invoice.
        </CardDescription>
      </CardHeader>
      {sortedRows.length === 0 ? (
        <TableEmptyState
          body="Seats added or removed before your renewal will show up here."
          title="No seat changes this period"
        />
      ) : (
        /* `table-fixed` + a `w-[N%]` on every head, the Members table's
           recipe (Team.tsx:295): auto layout hands the slack to whichever
           cell can grow most — here the stacked name + email — and starves
           the rest. Fixed layout reads the widths off the header row alone,
           so the last column lands flush against the table's right padding.
           Shares sum to 100. Member is the one column that truncates (the
           name and email spans carry `truncate`), so it does not bound the
           table; the binding column is Date at 24%, which needs 113px for
           "Sep 15, 2026" plus padding. Measured floor is 472px, rounded up
           to `min-w-[480px]`; below it the heads overflow their cells
           instead of the table scrolling. */
        <Table className="min-w-[480px] table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableTableHead
                className="w-[34%] whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="member"
              >
                Member
              </SortableTableHead>
              <SortableTableHead
                className="w-[18%] whitespace-nowrap text-right"
                numeric
                onSort={toggleSort}
                sort={sort}
                sortKey="kind"
              >
                Seats
              </SortableTableHead>
              <SortableTableHead
                className="w-[24%] whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="date"
              >
                Date
              </SortableTableHead>
              <SortableTableHead
                className="w-[24%] whitespace-nowrap text-right"
                numeric
                onSort={toggleSort}
                sort={sort}
                sortKey="amount"
              >
                Amount
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((change) => (
              <TableRow className="hover:bg-transparent" key={change.id}>
                <TableCell className="whitespace-nowrap">
                  <div className="flex min-w-0 items-center gap-3">
                    <Monogram
                      initials={initialsOf(change.name)}
                      size="md"
                      tone={change.avatarTone}
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span
                        className="type-label-14 truncate text-foreground"
                        title={change.name}
                      >
                        {change.name}
                      </span>
                      <span
                        className="type-copy-12 truncate text-muted-foreground tracking-snug"
                        title={change.email}
                      >
                        {change.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                  {change.kind === "added" ? "+1" : "-1"}
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                  <Timestamp date={change.date} format="dateNumeric" />
                </TableCell>
                {change.kind === "added" ? (
                  <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                    {formatCurrency(change.proratedUsd)}
                  </TableCell>
                ) : (
                  /* A removal is billed through the period and simply comes
                     off the next invoice, so it costs nothing NOW. $0.00 in
                     the muted ink keeps the column numeric and comparable
                     rather than breaking it with a word. */
                  <TableCell className="type-mono-14 whitespace-nowrap text-right text-muted-foreground">
                    {formatCurrency(0)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
