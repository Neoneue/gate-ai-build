import { Plus } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCardIcon } from "@/components/ui/credit-card";
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
import { ReceiptIcon } from "@/components/ui/receipt";
import { RefreshCWIcon } from "@/components/ui/refresh-cw";
import { SquareArrowUpIcon } from "@/components/ui/square-arrow-up";
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
import { PlanComparisonDialogPro } from "@/pages/plan-comparison-dialog-pro";

/* ─────────────────────────────────────────────────────────────────────────
 * Billing page (route: /billing, sidebar: "Billing")
 *
 * Three sections stacked: plan + credits row (50/50), and the History
 * table. Mock data assumes a fresh workspace with one $25 top-up, two
 * gateway-request debits, and two micro-adjustments — reconciles with the
 * Credits hero ($24.99238 = the running balance after the last history row).
 * ───────────────────────────────────────────────────────────────────────── */

export function Billing() {
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
      <PaymentMethodCard />
      <HistorySection />
    </DashboardChrome>
  );
}

function PageHeader() {
  return (
    <div className="flex max-w-1/2 flex-col gap-2">
      <PageTitle>Billing</PageTitle>
      <p className="type-copy-16 m-0 text-pretty text-neutral-500 tracking-snug">
        Manage your plan, track credit usage, and review every gateway
        transaction.
      </p>
    </div>
  );
}

/* ─── Plan + Credits row (3/2 split) ─────────────────────────────────── */

function PlanCreditsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        <HeroNumeric size="lg">Pro</HeroNumeric>
        <p className="type-copy-14 m-0 text-pretty text-neutral-800">
          Scans every request sent through your own provider keys for prompt
          injections, credential leaks and PII. Includes the full Constellation
          Gate audit trail.
        </p>
        <p className="type-copy-14 m-0 text-neutral-500">
          Renews on Jun 12, 2026 · $20 / month
        </p>

        {/* Seats inset */}
        <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-neutral-50 p-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="type-label-14 m-0 text-neutral-900">Seats</p>
            <p className="type-copy-14 m-0 text-pretty text-neutral-500">
              Billed per seat. Accepting an invite adds a prorated seat; removed
              seats stop billing next cycle.
            </p>
          </div>
          <p className="type-copy-14 m-0 whitespace-nowrap text-neutral-800">
            1 seat × $20 = $20 / month
          </p>
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
        <HeroNumeric size="lg">$24.99238</HeroNumeric>
        <p className="type-copy-14 m-0 text-pretty text-neutral-800">
          Used for requests routed through our gateway. Each call is charged at
          our per-model rate. Security and audit are included.
        </p>
        <dl className="m-0 mt-3 flex flex-col gap-2 text-sm">
          <CreditStatRow label="Used this month" mono value="$0.02 / $24.99" />
          <CreditStatRow
            label="Auto-recharge"
            value={
              auto.enabled ? `+$${auto.topUp} below $${auto.threshold}` : "Off"
            }
          />
          <CreditStatRow label="Last top-up" value="May 12, 2026 · $25" />
        </dl>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-border border-t py-2">
        <Button onClick={() => setAutoOpen(true)} size="sm" variant="outline">
          <RefreshCWIcon aria-hidden data-icon="inline-start" size={16} />
          Auto-recharge
        </Button>
        <Button onClick={() => setAddOpen(true)} size="sm">
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
  const selectedPreset = custom.length === 0 ? selected : null;
  const presetRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const movePresetSelection = (nextIndex: number) => {
    const nextValue = CREDIT_PRESETS[nextIndex];
    setSelected(nextValue);
    setCustom("");
    requestAnimationFrame(() => {
      presetRefs.current[nextIndex]?.focus();
    });
  };

  const onPresetKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowDown" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowUp"
    ) {
      return;
    }

    event.preventDefault();
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      movePresetSelection((index + 1) % CREDIT_PRESETS.length);
      return;
    }

    movePresetSelection(
      (index - 1 + CREDIT_PRESETS.length) % CREDIT_PRESETS.length
    );
  };

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
      {/* Mobile-first width: below md the dialog fills the viewport minus 16px gutters
          (capped at 500px); from md (≥768px) up it locks to a fixed 500px. Must override
          three base width classes — w-full, max-w-[calc(100%-2rem)], and sm:max-w-sm (384px,
          a separate twMerge variant group that otherwise caps the dialog from 640px up). */}
      <DialogContent className="w-[calc(100%-2rem)] max-w-[500px] gap-4 sm:max-w-[500px] md:w-[500px]">
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
          {CREDIT_PRESETS.map((value, index) => {
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
                onKeyDown={(event) => onPresetKeyDown(event, index)}
                ref={(el) => {
                  presetRefs.current[index] = el;
                }}
                role="radio"
                tabIndex={
                  selectedPreset === null
                    ? index === 0
                      ? 0
                      : -1
                    : isSelected
                      ? 0
                      : -1
                }
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
            className="type-copy-14 m-0 font-medium text-neutral-500"
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
              aria-describedby={
                custom.length > 0 && !customValid
                  ? "add-credits-custom-error"
                  : undefined
              }
              aria-invalid={custom.length > 0 && !customValid}
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
          {custom.length > 0 && !customValid && (
            <p
              aria-live="polite"
              className="type-copy-12 m-0 text-destructive"
              id="add-credits-custom-error"
            >
              Enter an amount between{" "}
              {formatCurrency(MIN_TOPUP, { minFrac: 0, maxFrac: 0 })} and{" "}
              {formatCurrency(MAX_TOPUP, { minFrac: 0, maxFrac: 0 })}.
            </p>
          )}
        </div>

        <p className="type-copy-14 m-0 text-pretty text-neutral-500">
          You&rsquo;ll be redirected to Stripe Checkout. Your balance updates
          within seconds of payment confirmation.
        </p>

        <DialogFooter>
          <DialogClose
            render={<Button size="sm" type="button" variant="outline" />}
          >
            Cancel
          </DialogClose>
          <Button disabled={!canSubmit} size="sm" type="button">
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
  const thresholdInvalid = enabled && !thresholdValid;
  const topUpInvalid = enabled && !topUpValid;
  const capInvalid = enabled && capStr.trim().length > 0 && !capValid;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      {/* Mobile-first width: below md the dialog fills the viewport minus 16px gutters
          (capped at 500px); from md (≥768px) up it locks to a fixed 500px. Must override
          three base width classes — w-full, max-w-[calc(100%-2rem)], and sm:max-w-sm (384px,
          a separate twMerge variant group that otherwise caps the dialog from 640px up). */}
      <DialogContent className="w-[calc(100%-2rem)] max-w-[500px] gap-4 sm:max-w-[500px] md:w-[500px]">
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
              className="type-label-14 m-0 text-neutral-900"
              id="ar-enable-label"
            >
              Enable auto-recharge
            </p>
            <p className="type-copy-14 m-0 text-pretty text-neutral-500">
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

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
          {/* When balance drops below */}
          <div className="flex flex-col gap-2">
            <label
              className="type-copy-14 m-0 font-medium text-neutral-500"
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
                aria-describedby={
                  thresholdInvalid ? "ar-threshold-error" : undefined
                }
                aria-invalid={thresholdInvalid}
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
            {thresholdInvalid && (
              <p
                aria-live="polite"
                className="type-copy-12 m-0 text-destructive"
                id="ar-threshold-error"
              >
                Enter a threshold greater than $0.
              </p>
            )}
          </div>

          {/* Top-up amount */}
          <div className="flex flex-col gap-2">
            <label
              className="type-copy-14 m-0 font-medium text-neutral-500"
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
                aria-describedby={topUpInvalid ? "ar-topup-error" : undefined}
                aria-invalid={topUpInvalid}
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
            {topUpInvalid && (
              <p
                aria-live="polite"
                className="type-copy-12 m-0 text-destructive"
                id="ar-topup-error"
              >
                Enter a top-up amount greater than $0.
              </p>
            )}
          </div>
        </div>

        {/* Monthly cap */}
        <div className="flex flex-col gap-2">
          <label
            className="type-copy-14 m-0 font-medium text-neutral-500"
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
              aria-describedby={capInvalid ? "ar-cap-error" : undefined}
              aria-invalid={capInvalid}
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
          {capInvalid && (
            <p
              aria-live="polite"
              className="type-copy-12 m-0 text-destructive"
              id="ar-cap-error"
            >
              Monthly cap must be greater than $0, or left blank.
            </p>
          )}
        </div>

        {enabled && thresholdValid && topUpValid && (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-neutral-50 px-4 py-3">
            <p className="type-copy-14 m-0 text-pretty text-neutral-800">
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
          <DialogClose
            render={<Button size="sm" type="button" variant="outline" />}
          >
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
            size="sm"
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
  type: "Gateway request" | "Credits added" | "Adjustment";
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
};

// Newest first. Credits-added rows render the amount in success-700 to mark
// the inflow; debits use the default foreground tone.
const HISTORY_ROWS: HistoryRow[] = [
  {
    id: "h-5",
    date: new Date(2026, 4, 29, 14, 30, 0),
    type: "Adjustment",
    amount: 0.005_29,
    balanceAfter: 24.992_38,
  },
  {
    id: "h-4",
    date: new Date(2026, 4, 29, 10, 15, 0),
    type: "Adjustment",
    amount: 0.007_09,
    balanceAfter: 24.987_09,
  },
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
  formatCurrency(n, { signDisplay: "exceptZero", maxFrac: 5 });
const fmtUsd = (n: number) => formatCurrency(n, { maxFrac: 5 });

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

function PaymentMethodCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment method</CardTitle>
        <CardDescription>
          Charged for subscription renewals and credit top-ups.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 rounded-md border border-border bg-neutral-50 p-4">
          <span className="inline-flex h-10 items-center rounded-sm border border-border bg-card px-2 font-medium text-neutral-800 text-xs">
            VISA
          </span>
          <div className="flex flex-col">
            <span className="type-copy-14 text-neutral-800">•••• 4242</span>
            <span className="type-copy-14 text-neutral-500">Expires 01/27</span>
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
        <CardDescription>Past charges and credit top-ups.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            <ReceiptIcon aria-hidden data-icon="inline-start" size={16} />
            Invoice portal
          </Button>
        </CardAction>
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
