import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HeroNumeric } from '@/components/ui/hero-numeric';
import { Input } from '@/components/ui/input';
import { PageTitle } from '@/components/ui/page-title';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * Billing page (route: /billing, sidebar: "Billing")
 *
 * Three sections stacked: plan + credits row (50/50), and the History
 * table. Mock data assumes a fresh workspace with one $25 top-up and two
 * gateway-request debits — reconciles with the Credits hero ($24.98 = the
 * running balance after the last history row).
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
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader />
      <PlanCreditsRow />
      <HistorySection />
    </DashboardChrome>
  );
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-2 max-w-1/2">
      <PageTitle>Billing</PageTitle>
      <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
        Plan, payment method, and invoice history.
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
  return (
    <Card className="min-w-0 pb-0!">
      <CardHeader>
        <CardTitle>Plan</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <HeroNumeric size="lg">Free</HeroNumeric>
        <p className="font-sans text-sm text-ink-800 m-0 text-pretty">
          BYOK gateway plus a tamper-evident audit trail, no security pipeline. Upgrade to Pro for prompt-injection scans, PII redaction, and a cryptographically verifiable audit trail anchored to Constellation's Digital Evidence layer.
        </p>
        <p className="font-sans text-sm text-ink-500 m-0">Free plan — no renewal</p>
      </CardContent>
      <CardFooter className="justify-end gap-4 border-t border-border">
        <Button>
          <Sparkles data-icon="inline-start" aria-hidden />
          Upgrade to Pro
        </Button>
      </CardFooter>
    </Card>
  );
}

type AutoRechargeConfig = {
  enabled: boolean;
  threshold: number;
  topUp: number;
  monthlyCap: number | null;
};

const AUTO_RECHARGE_STORAGE_KEY = 'billing.autoRecharge.v2';
const AUTO_RECHARGE_DEFAULTS: AutoRechargeConfig = {
  enabled: false,
  threshold: 0,
  topUp: 0,
  monthlyCap: null,
};


function readAutoRecharge(): AutoRechargeConfig {
  if (typeof window === 'undefined') return AUTO_RECHARGE_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(AUTO_RECHARGE_STORAGE_KEY);
    if (!raw) return AUTO_RECHARGE_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AutoRechargeConfig>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : AUTO_RECHARGE_DEFAULTS.enabled,
      threshold: typeof parsed.threshold === 'number' ? parsed.threshold : AUTO_RECHARGE_DEFAULTS.threshold,
      topUp: typeof parsed.topUp === 'number' ? parsed.topUp : AUTO_RECHARGE_DEFAULTS.topUp,
      monthlyCap: typeof parsed.monthlyCap === 'number' ? parsed.monthlyCap : null,
    };
  } catch {
    return AUTO_RECHARGE_DEFAULTS;
  }
}

function CreditsCard() {
  const [addOpen, setAddOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [auto, setAuto] = useState<AutoRechargeConfig>(readAutoRecharge);

  useEffect(() => {
    try {
      window.localStorage.setItem(AUTO_RECHARGE_STORAGE_KEY, JSON.stringify(auto));
    } catch {
      /* storage unavailable — drop silently */
    }
  }, [auto]);
  return (
    <Card className="min-w-0 pb-0!">
      <CardHeader>
        <CardTitle>Credits</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <HeroNumeric size="lg">$24.98</HeroNumeric>
        <p className="font-sans text-sm text-ink-800 m-0 text-pretty">
          Used for requests routed through our gateway. Each call is charged at our per-model rate. Security and audit are included.
        </p>
        <dl className="flex flex-col gap-2 text-sm m-0 mt-3">
          <CreditStatRow label="Used this month" value="$0.02" mono />
          <CreditStatRow
            label="Auto-recharge"
            value={auto.enabled ? `+$${auto.topUp} below $${auto.threshold}` : 'Off'}
          />
          <CreditStatRow label="Last top-up" value="May 12, 2026" />
        </dl>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t border-border">
        <Button variant="outline" onClick={() => setAutoOpen(true)}>Auto-recharge</Button>
        <Button onClick={() => setAddOpen(true)}>
          <Plus data-icon="inline-start" aria-hidden />
          Add credits
        </Button>
      </CardFooter>
      <AddCreditsDialog open={addOpen} onOpenChange={setAddOpen} />
      <AutoRechargeDialog
        key={autoOpen ? 'open' : 'closed'}
        open={autoOpen}
        onOpenChange={setAutoOpen}
        initial={auto}
        onSave={(next) => {
          setAuto(next);
          setAutoOpen(false);
        }}
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
  const [custom, setCustom] = useState('');

  const customNum = Number(custom);
  const customValid =
    custom.length > 0 && Number.isFinite(customNum) && customNum >= 5 && customNum <= 1000;
  const amount = custom.length > 0 ? (customValid ? customNum : null) : selected;
  const canSubmit = amount !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setSelected(null);
          setCustom('');
        }
      }}
    >
      <DialogContent
        className="gap-4"
        style={{ width: 500, minWidth: 500, maxWidth: 500 }}
      >
        <DialogHeader>
          <DialogTitle className="font-sans text-lg/6 font-medium text-ink-900">
            Add credits
          </DialogTitle>
          <DialogDescription>
            Min $5 · Max $1,000.
          </DialogDescription>
        </DialogHeader>

        {/* Preset tiles. Single-select; typing a custom amount clears
            the preset selection. */}
        <div
          role="radiogroup"
          aria-label="Credit amount"
          className="grid grid-cols-4 gap-2"
        >
          {CREDIT_PRESETS.map((value) => {
            const isSelected = custom.length === 0 && selected === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setSelected(value);
                  setCustom('');
                }}
                className={cn(
                  'inline-flex h-10 items-center justify-center rounded-md border font-sans text-sm font-medium tabular-nums transition-colors',
                  isSelected
                    ? 'border-border bg-muted text-ink-900'
                    : 'border-border bg-card text-ink-900 hover:bg-ink-50',
                )}
              >
                ${value.toLocaleString()}
              </button>
            );
          })}
        </div>

        {/* Custom amount */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="add-credits-custom"
            className="font-sans text-sm font-medium text-ink-500 m-0"
          >
            Amount (USD)
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-500 pointer-events-none"
            >
              $
            </span>
            <Input
              id="add-credits-custom"
              type="number"
              inputMode="decimal"
              min="5"
              max="1000"
              step="1"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                if (e.target.value.length > 0) setSelected(null);
              }}
              placeholder="0"
              className="pl-7 font-mono text-sm tabular-nums"
            />
          </div>
        </div>

        <p className="font-sans text-sm text-ink-500 m-0 text-pretty">
          You'll be redirected to Stripe Checkout. Your balance updates within seconds of payment confirmation.
        </p>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="button" disabled={!canSubmit}>
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
  const [thresholdStr, setThresholdStr] = useState(initial.threshold === 0 ? '' : String(initial.threshold));
  const [topUpStr, setTopUpStr] = useState(initial.topUp === 0 ? '' : String(initial.topUp));
  const [capStr, setCapStr] = useState(initial.monthlyCap !== null ? String(initial.monthlyCap) : '');

  const threshold = Number(thresholdStr);
  const topUp = Number(topUpStr);
  const monthlyCap = capStr.trim() === '' ? null : Number(capStr);

  const thresholdValid = thresholdStr.length > 0 && Number.isFinite(threshold) && threshold > 0;
  const topUpValid = topUpStr.length > 0 && Number.isFinite(topUp) && topUp > 0;
  const capValid = monthlyCap === null || (Number.isFinite(monthlyCap) && monthlyCap > 0);
  const canSave = !enabled || (thresholdValid && topUpValid && capValid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-4"
        style={{ width: 500, minWidth: 500, maxWidth: 500 }}
      >
        <DialogHeader>
          <DialogTitle className="font-sans text-lg/6 font-medium text-ink-900">
            Auto-recharge
          </DialogTitle>
          <DialogDescription>
            Top up credits automatically when balance drops.
          </DialogDescription>
        </DialogHeader>

        {/* Enable card */}
        <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-ink-50 p-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p id="ar-enable-label" className="font-sans text-sm font-medium text-ink-900 m-0">
              Enable auto-recharge
            </p>
            <p className="font-sans text-sm text-ink-500 m-0 text-pretty">
              We&apos;ll charge your default card to top up.
            </p>
          </div>
          <Switch
            aria-labelledby="ar-enable-label"
            checked={enabled}
            onCheckedChange={setEnabled}
            className="mt-1 shrink-0"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* When balance drops below */}
          <div className="flex flex-col gap-2">
            <label htmlFor="ar-threshold" className="font-sans text-sm font-medium text-ink-500 m-0">
              When balance drops below
            </label>
            <div className="relative">
              <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-500 pointer-events-none">$</span>
              <Input
                id="ar-threshold"
                type="number"
                inputMode="decimal"
                min="1"
                step="1"
                value={thresholdStr}
                onChange={(e) => setThresholdStr(e.target.value)}
                disabled={!enabled}
                placeholder="0"
                className="pl-7 font-mono text-sm tabular-nums disabled:opacity-50"
              />
            </div>
          </div>

          {/* Top-up amount */}
          <div className="flex flex-col gap-2">
            <label htmlFor="ar-topup" className="font-sans text-sm font-medium text-ink-500 m-0">
              Top-up amount
            </label>
            <div className="relative">
              <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-500 pointer-events-none">$</span>
              <Input
                id="ar-topup"
                type="number"
                inputMode="decimal"
                min="1"
                step="1"
                value={topUpStr}
                onChange={(e) => setTopUpStr(e.target.value)}
                disabled={!enabled}
                placeholder="0"
                className="pl-7 font-mono text-sm tabular-nums disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Monthly cap */}
        <div className="flex flex-col gap-2">
          <label htmlFor="ar-cap" className="font-sans text-sm font-medium text-ink-500 m-0">
            Monthly cap <span className="font-normal text-ink-400">(leave blank for no cap)</span>
          </label>
          <div className="relative">
            <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-500 pointer-events-none">$</span>
            <Input
              id="ar-cap"
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={capStr}
              onChange={(e) => setCapStr(e.target.value)}
              disabled={!enabled}
              placeholder="0"
              className="pl-7 font-mono text-sm tabular-nums disabled:opacity-50"
            />
          </div>
        </div>

        {enabled && thresholdValid && topUpValid && (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-ink-50 px-4 py-3">
            <p className="font-sans text-sm text-ink-800 m-0 text-pretty">
              When your balance drops below{' '}
              <span className="font-medium text-ink-900">${threshold}</span>, we&apos;ll add{' '}
              <span className="font-medium text-ink-900">${topUp}</span> to your account
              {monthlyCap !== null && capValid
                ? <>, up to <span className="font-medium text-ink-900">${monthlyCap}/month</span></>
                : <> with <span className="font-medium text-ink-900">no monthly cap</span></>}
              .
            </p>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => onSave({ enabled, threshold: thresholdValid ? threshold : initial.threshold, topUp: topUpValid ? topUp : initial.topUp, monthlyCap })}
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
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className={
          mono
            ? 'font-mono tabular-nums text-ink-900 m-0'
            : 'text-ink-900 m-0'
        }
      >
        {value}
      </dd>
    </div>
  );
}

/* ─── History ────────────────────────────────────────────────────────── */

type HistoryRow = {
  id: string;
  date: string;
  type: 'Gateway request' | 'Credits added';
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
};

// Newest first. Credits-added rows render the amount in success-700 to mark
// the inflow; debits use the default foreground tone.
const HISTORY_ROWS: HistoryRow[] = [
  { id: 'h-3', date: 'May 12, 2026', type: 'Gateway request', amount: -0.01, balanceAfter: 24.98 },
  { id: 'h-2', date: 'May 12, 2026', type: 'Gateway request', amount: -0.01, balanceAfter: 24.99 },
  { id: 'h-1', date: 'May 12, 2026', type: 'Credits added',   amount:  25.00, balanceAfter: 25.00 },
];

const fmtAmount = (n: number): string => {
  const abs = Math.abs(n).toFixed(2);
  if (n > 0) return `+$${abs}`;
  if (n < 0) return `-$${abs}`;
  return `$${abs}`;
};

const fmtUsd = (n: number): string => `$${n.toFixed(2)}`;

function HistorySection() {
  return (
    <Card density="flush">
      <CardHeader className="py-3">
        <CardTitle>History</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="whitespace-nowrap">Date</TableHead>
            <TableHead className="whitespace-nowrap">Type</TableHead>
            <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
            <TableHead className="text-right whitespace-nowrap">Balance after</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {HISTORY_ROWS.map((row) => (
            <TableRow key={row.id} className="hover:bg-transparent">
              <TableCell className="whitespace-nowrap text-ink-800">{row.date}</TableCell>
              <TableCell className="whitespace-nowrap text-ink-800">{row.type}</TableCell>
              <TableCell
                className={cn(
                  'text-right whitespace-nowrap font-mono tabular-nums',
                  row.amount > 0 ? 'text-success-700' : 'text-ink-800',
                )}
              >
                {fmtAmount(row.amount)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap font-mono tabular-nums text-foreground">
                {fmtUsd(row.balanceAfter)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
