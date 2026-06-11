import { Plus } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/ui/page-title";
import { Switch } from "@/components/ui/switch";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Timestamp } from "@/components/ui/timestamp";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { PlanComparisonDialog } from "@/pages/plan-comparison-dialog";

/* ─────────────────────────────────────────────────────────────────────────
 * Billing page — Free-plan duplicate (route: /billing-free, sidebar: "Billing")
 *
 * Three sections stacked: plan + credits row (50/50), and the History
 * table. Mock data assumes a fresh workspace with one $25 top-up and two
 * gateway-request debits — reconciles with the Credits hero ($24.98 = the
 * running balance after the last history row).
 * ───────────────────────────────────────────────────────────────────────── */

export function BillingFree() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="billing"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      <PlanCreditsRow />
      <HistorySection />
    </DashboardChrome>
  );
}

function PageHeader() {
  return (
    <div className="flex max-w-1/2 flex-col gap-2">
      <PageTitle>Billing</PageTitle>
      <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-tight">
        Plan, credits, and transaction history.
      </p>
    </div>
  );
}

/* ─── Plan + Credits row (3/2 split) ─────────────────────────────────── */

function PlanCreditsRow() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <PlanCard />
      <CreditsCard />
    </div>
  );
}

function PlanCard() {
  const [compareOpen, setCompareOpen] = useState(false);
  return (
    <Card className="min-w-0 pb-0!">
      <CardHeader>
        <CardTitle>Your plan</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <HeroNumeric size="lg">Free</HeroNumeric>
        <p className="m-0 text-pretty font-sans text-neutral-800 text-sm">
          BYOK gateway plus a tamper-evident audit trail, no security pipeline.
          Upgrade to Pro for prompt-injection scans, PII redaction, and a
          cryptographically verifiable audit trail fingerprinted to
          Constellation&rsquo;s Digital Evidence layer.
        </p>
        <p className="m-0 font-sans text-neutral-500 text-sm">
          Free plan — no renewal needed
        </p>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-border border-t py-2">
        <Button onClick={() => setCompareOpen(true)} variant="outline">
          Manage subscription
        </Button>
      </CardFooter>
      <PlanComparisonDialog
        onOpenChange={setCompareOpen}
        onUpgrade={() => setCompareOpen(false)}
        open={compareOpen}
      />
    </Card>
  );
}

type AutoRechargeConfig = {
  enabled: boolean;
  threshold: number;
  topUp: number;
  monthlyCap: number | null;
};

const AUTO_RECHARGE_STORAGE_KEY = "billing.autoRecharge.v2";
const AUTO_RECHARGE_DEFAULTS: AutoRechargeConfig = {
  enabled: false,
  threshold: 0,
  topUp: 0,
  monthlyCap: null,
};

function readAutoRecharge(): AutoRechargeConfig {
  if (typeof window === "undefined") {
    return AUTO_RECHARGE_DEFAULTS;
  }
  try {
    const raw = window.localStorage.getItem(AUTO_RECHARGE_STORAGE_KEY);
    if (!raw) {
      return AUTO_RECHARGE_DEFAULTS;
    }
    const parsed = JSON.parse(raw) as Partial<AutoRechargeConfig>;
    return {
      enabled:
        typeof parsed.enabled === "boolean"
          ? parsed.enabled
          : AUTO_RECHARGE_DEFAULTS.enabled,
      threshold:
        typeof parsed.threshold === "number"
          ? parsed.threshold
          : AUTO_RECHARGE_DEFAULTS.threshold,
      topUp:
        typeof parsed.topUp === "number"
          ? parsed.topUp
          : AUTO_RECHARGE_DEFAULTS.topUp,
      monthlyCap:
        typeof parsed.monthlyCap === "number" ? parsed.monthlyCap : null,
    };
  } catch {
    return AUTO_RECHARGE_DEFAULTS;
  }
}

function CreditsCard() {
  const [addOpen, setAddOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [auto, setAuto] = useState<AutoRechargeConfig>(readAutoRecharge);

  return (
    <Card className="min-w-0 pb-0!">
      <CardHeader>
        <CardTitle>Credits</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <HeroNumeric size="lg">$0.00</HeroNumeric>
        <p className="m-0 text-pretty font-sans text-neutral-800 text-sm">
          Used for requests routed through our gateway. Each call is charged at
          our per-model rate. Security and audit are included.
        </p>
        <dl className="m-0 mt-3 flex flex-col gap-2 text-sm">
          <CreditStatRow label="Used this month" mono value="$0.00" />
          <CreditStatRow
            label="Auto-recharge"
            value={
              auto.enabled ? `+$${auto.topUp} below $${auto.threshold}` : "Off"
            }
          />
          <CreditStatRow label="Last top-up" value="Never" />
        </dl>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-border border-t py-2">
        <Button onClick={() => setAutoOpen(true)} variant="outline">
          Auto-recharge
        </Button>
        <Button onClick={() => setAddOpen(true)}>
          <Plus
            aria-hidden
            className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none"
            data-icon="inline-start"
          />
          Add credits
        </Button>
      </CardFooter>
      <AddCreditsDialog onOpenChange={setAddOpen} open={addOpen} />
      <AutoRechargeDialog
        initial={auto}
        key={autoOpen ? "open" : "closed"}
        onOpenChange={setAutoOpen}
        onSave={(next) => {
          setAuto(next);
          try {
            window.localStorage.setItem(
              AUTO_RECHARGE_STORAGE_KEY,
              JSON.stringify(next)
            );
          } catch {
            /* storage unavailable — drop silently */
          }
          setAutoOpen(false);
        }}
        open={autoOpen}
      />
    </Card>
  );
}

/* ─── Add credits dialog ─────────────────────────────────────────────── */

const CREDIT_PRESETS = [25, 50, 100, 500] as const;

function AddCreditsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");

  const customNum = Number(custom);
  const customValid =
    custom.length > 0 &&
    Number.isFinite(customNum) &&
    customNum >= 5 &&
    customNum <= 1000;
  const amount =
    custom.length > 0 ? (customValid ? customNum : null) : selected;
  const canSubmit = amount !== null;

  return (
    <Dialog
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setSelected(null);
          setCustom("");
        }
      }}
      open={open}
    >
      <DialogContent
        className="gap-4"
        style={{ width: 500, minWidth: 500, maxWidth: 500 }}
      >
        <DialogHeader>
          <DialogTitle className="font-medium font-sans text-lg/6 text-neutral-900">
            Add credits
          </DialogTitle>
          <DialogDescription>
            Min {formatCurrency(MIN_TOPUP, { minFrac: 0, maxFrac: 0 })} · Max{" "}
            {formatCurrency(MAX_TOPUP, { minFrac: 0, maxFrac: 0 })}.
          </DialogDescription>
        </DialogHeader>

        {/* Preset tiles. Single-select; typing a custom amount clears
            the preset selection. */}
        <div
          aria-label="Credit amount"
          className="grid grid-cols-4 gap-2"
          role="radiogroup"
        >
          {CREDIT_PRESETS.map((value) => {
            const isSelected = custom.length === 0 && selected === value;
            return (
              <button
                aria-checked={isSelected}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-md border font-medium font-sans text-sm tabular-nums transition-colors",
                  isSelected
                    ? "border-border bg-muted text-neutral-900"
                    : "border-border bg-card text-neutral-900 hover:bg-neutral-50"
                )}
                key={value}
                onClick={() => {
                  setSelected(value);
                  setCustom("");
                }}
                role="radio"
                type="button"
              >
                {formatCurrency(value, { minFrac: 0, maxFrac: 0 })}
              </button>
            );
          })}
        </div>

        {/* Custom amount */}
        <div className="flex flex-col gap-2">
          <label
            className="m-0 font-medium font-sans text-neutral-500 text-sm"
            htmlFor="add-credits-custom"
          >
            Amount (USD)
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-neutral-500 text-sm"
            >
              $
            </span>
            <Input
              className="pl-7 font-mono text-sm tabular-nums"
              id="add-credits-custom"
              inputMode="decimal"
              max="1000"
              min="5"
              onChange={(e) => {
                setCustom(e.target.value);
                if (e.target.value.length > 0) {
                  setSelected(null);
                }
              }}
              placeholder="0"
              step="1"
              type="number"
              value={custom}
            />
          </div>
        </div>

        <p className="m-0 text-pretty font-sans text-neutral-500 text-sm">
          You&rsquo;ll be redirected to Stripe Checkout. Your balance updates
          within seconds of payment confirmation.
        </p>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button disabled={!canSubmit} type="button">
            Continue to checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Auto-recharge dialog ───────────────────────────────────────────── */

function AutoRechargeDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  initial: AutoRechargeConfig;
  onSave: (next: AutoRechargeConfig) => void;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [thresholdStr, setThresholdStr] = useState(
    initial.threshold === 0 ? "" : String(initial.threshold)
  );
  const [topUpStr, setTopUpStr] = useState(
    initial.topUp === 0 ? "" : String(initial.topUp)
  );
  const [capStr, setCapStr] = useState(
    initial.monthlyCap === null ? "" : String(initial.monthlyCap)
  );

  const threshold = Number(thresholdStr);
  const topUp = Number(topUpStr);
  const monthlyCap = capStr.trim() === "" ? null : Number(capStr);

  const thresholdValid =
    thresholdStr.length > 0 && Number.isFinite(threshold) && threshold > 0;
  const topUpValid = topUpStr.length > 0 && Number.isFinite(topUp) && topUp > 0;
  const capValid =
    monthlyCap === null || (Number.isFinite(monthlyCap) && monthlyCap > 0);
  const canSave = !enabled || (thresholdValid && topUpValid && capValid);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="gap-4"
        style={{ width: 500, minWidth: 500, maxWidth: 500 }}
      >
        <DialogHeader>
          <DialogTitle className="font-medium font-sans text-lg/6 text-neutral-900">
            Auto-recharge
          </DialogTitle>
          <DialogDescription>
            Top up credits automatically when balance drops.
          </DialogDescription>
        </DialogHeader>

        {/* Enable card */}
        <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-neutral-50 p-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p
              className="m-0 font-medium font-sans text-neutral-900 text-sm"
              id="ar-enable-label"
            >
              Enable auto-recharge
            </p>
            <p className="m-0 text-pretty font-sans text-neutral-500 text-sm">
              We&apos;ll charge your default card to top up.
            </p>
          </div>
          <Switch
            aria-labelledby="ar-enable-label"
            checked={enabled}
            className="mt-1 shrink-0"
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* When balance drops below */}
          <div className="flex flex-col gap-2">
            <label
              className="m-0 font-medium font-sans text-neutral-500 text-sm"
              htmlFor="ar-threshold"
            >
              When balance drops below
            </label>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-neutral-500 text-sm"
              >
                $
              </span>
              <Input
                className="pl-7 font-mono text-sm tabular-nums disabled:opacity-50"
                disabled={!enabled}
                id="ar-threshold"
                inputMode="decimal"
                min="1"
                onChange={(e) => setThresholdStr(e.target.value)}
                placeholder="0"
                step="1"
                type="number"
                value={thresholdStr}
              />
            </div>
          </div>

          {/* Top-up amount */}
          <div className="flex flex-col gap-2">
            <label
              className="m-0 font-medium font-sans text-neutral-500 text-sm"
              htmlFor="ar-topup"
            >
              Top-up amount
            </label>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-neutral-500 text-sm"
              >
                $
              </span>
              <Input
                className="pl-7 font-mono text-sm tabular-nums disabled:opacity-50"
                disabled={!enabled}
                id="ar-topup"
                inputMode="decimal"
                min="1"
                onChange={(e) => setTopUpStr(e.target.value)}
                placeholder="0"
                step="1"
                type="number"
                value={topUpStr}
              />
            </div>
          </div>
        </div>

        {/* Monthly cap */}
        <div className="flex flex-col gap-2">
          <label
            className="m-0 font-medium font-sans text-neutral-500 text-sm"
            htmlFor="ar-cap"
          >
            Monthly cap{" "}
            <span className="font-normal text-neutral-400">
              (leave blank for no cap)
            </span>
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-neutral-500 text-sm"
            >
              $
            </span>
            <Input
              className="pl-7 font-mono text-sm tabular-nums disabled:opacity-50"
              disabled={!enabled}
              id="ar-cap"
              inputMode="decimal"
              min="1"
              onChange={(e) => setCapStr(e.target.value)}
              placeholder="0"
              step="1"
              type="number"
              value={capStr}
            />
          </div>
        </div>

        {enabled && thresholdValid && topUpValid && (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-neutral-50 px-4 py-3">
            <p className="m-0 text-pretty font-sans text-neutral-800 text-sm">
              When your balance drops below{" "}
              <span className="font-medium text-neutral-900">${threshold}</span>
              , we&apos;ll add{" "}
              <span className="font-medium text-neutral-900">${topUp}</span> to
              your account
              {monthlyCap !== null && capValid ? (
                <>
                  , up to{" "}
                  <span className="font-medium text-neutral-900">
                    ${monthlyCap}/month
                  </span>
                </>
              ) : (
                <>
                  {" "}
                  with{" "}
                  <span className="font-medium text-neutral-900">
                    no monthly cap
                  </span>
                </>
              )}
              .
            </p>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            disabled={!canSave}
            onClick={() =>
              onSave({
                enabled,
                threshold: thresholdValid ? threshold : initial.threshold,
                topUp: topUpValid ? topUp : initial.topUp,
                monthlyCap,
              })
            }
            type="button"
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreditStatRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-neutral-500">{label}</dt>
      <dd
        className={
          mono
            ? "m-0 font-mono text-neutral-900 tabular-nums"
            : "m-0 text-neutral-900"
        }
      >
        {value}
      </dd>
    </div>
  );
}

/* ─── History ────────────────────────────────────────────────────────── */

const MIN_TOPUP = 5;
const MAX_TOPUP = 1000;

type HistoryRow = {
  id: string;
  date: Date;
  type: "Gateway request" | "Credits added";
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
};

// Newest first. Credits-added rows render the amount in success-700 to mark
// the inflow; debits use the default foreground tone.
const HISTORY_ROWS: HistoryRow[] = [
  {
    id: "h-3",
    date: new Date(2026, 4, 12, 16, 47, 12),
    type: "Gateway request",
    amount: -0.01,
    balanceAfter: 24.98,
  },
  {
    id: "h-2",
    date: new Date(2026, 4, 12, 14, 22, 5),
    type: "Gateway request",
    amount: -0.01,
    balanceAfter: 24.99,
  },
  {
    id: "h-1",
    date: new Date(2026, 4, 12, 9, 14, 38),
    type: "Credits added",
    amount: 25.0,
    balanceAfter: 25.0,
  },
];

const fmtAmount = (n: number) =>
  formatCurrency(n, { signDisplay: "exceptZero" });
const fmtUsd = (n: number) => formatCurrency(n);

function historySortValue(
  row: HistoryRow,
  key: string
): string | number | null {
  switch (key) {
    case "date":
      return row.date.getTime();
    case "type":
      return row.type;
    case "amount":
      return row.amount;
    case "balanceAfter":
      return row.balanceAfter;
    default:
      return null;
  }
}

function HistorySection() {
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = React.useMemo(
    () => sortRows(HISTORY_ROWS, sort, historySortValue),
    [sort]
  );
  return (
    <Card density="flush">
      <CardHeader className="py-3">
        <CardTitle>History</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableTableHead
              className="whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="date"
            >
              Date
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="type"
            >
              Type
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="amount"
            >
              Amount
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="balanceAfter"
            >
              Balance after
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => (
            <TableRow className="hover:bg-transparent" key={row.id}>
              <TableCell className="whitespace-nowrap text-neutral-800">
                <Timestamp date={row.date} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-neutral-800">
                {row.type}
              </TableCell>
              <TableCell
                className={cn(
                  "whitespace-nowrap text-right font-mono tabular-nums",
                  row.amount > 0 ? "text-success-700" : "text-neutral-800"
                )}
              >
                {fmtAmount(row.amount)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono text-foreground tabular-nums">
                {fmtUsd(row.balanceAfter)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
