import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CreditCard, History, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Eyebrow } from '@/components/ui/eyebrow';
import { HeroNumeric } from '@/components/ui/hero-numeric';
import { Input } from '@/components/ui/input';
import { PageTitle } from '@/components/ui/page-title';
import { Switch } from '@/components/ui/switch';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * Billing page (route: /billing, sidebar: "Billing")
 *
 * Four sections stacked: plan + credits row (3/2 split), payment method,
 * history. No eyebrow above the page title. History uses the canonical
 * Table primitive when populated; empty state stands in until charges
 * exist. Mock data assumes a fresh workspace: Free plan, $0 credits,
 * nothing used, no payment method, no history.
 * ───────────────────────────────────────────────────────────────────────── */

export function Billing() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      breadcrumbCurrent="Billing"
      activeNavId="billing"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader />
      <PlanCreditsRow />
      {/* Payment method + Billing contact — hidden for now; preserved for re-enable. */}
      <div className="hidden">
        <PaymentBillingRow />
      </div>
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
        <Eyebrow as="div">Plan</Eyebrow>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <HeroNumeric size="lg">Free</HeroNumeric>
        <p className="font-sans text-sm text-ink-800 m-0 text-pretty">
          BYOK gateway + audit trail, no security pipeline. Upgrade to Pro to unlock prompt-injection scans, PII redaction, and the full Constellation Gate audit trail.
        </p>
        <p className="font-sans text-sm text-ink-500 m-0">Free plan — no renewal</p>
      </CardContent>
      <CardFooter className="justify-end gap-4 border-t border-ink-200">
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
        <Eyebrow as="div">Credits</Eyebrow>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <HeroNumeric size="lg">$0</HeroNumeric>
        <p className="font-sans text-sm text-ink-800 m-0 text-pretty">
          Used for requests routed through our gateway. Each call is charged at our per-model rate. Security and audit are included.
        </p>
        <dl className="flex flex-col gap-2 text-sm m-0 mt-3">
          <CreditStatRow label="Used this month" value="$0" mono />
          <CreditStatRow
            label="Auto-recharge"
            value={auto.enabled ? `+$${auto.topUp} below $${auto.threshold}` : 'Off'}
          />
          <CreditStatRow label="Last top-up" value="Never" />
        </dl>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t border-ink-200">
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
                    ? 'border-ink-500 bg-ink-100 text-ink-900'
                    : 'border-ink-200 bg-white text-ink-900 hover:bg-ink-50',
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
        <div className="flex items-start justify-between gap-4 rounded-md border border-ink-200 bg-ink-50 p-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-sans text-sm font-medium text-ink-900 m-0">
              Enable auto-recharge
            </p>
            <p className="font-sans text-sm text-ink-500 m-0 text-pretty">
              We&apos;ll charge your default card to top up.
            </p>
          </div>
          <Switch
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
          <div className="flex flex-col gap-2 rounded-md border border-ink-200 bg-ink-50 px-4 py-3">
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

/* ─── Payment method + Billing contact (50/50) ───────────────────────── */

function PaymentBillingRow() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <PaymentMethodCard />
      <BillingContactCard />
    </div>
  );
}

function PaymentMethodCard() {
  return (
    <Card className="min-w-0 pb-0!">
      <CardHeader>
        <Eyebrow as="div">Payment method</Eyebrow>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <p className="font-sans text-sm text-ink-800 m-0 text-pretty">
          Charged for subscription renewals and credit top-ups.
        </p>
        <div className="flex items-center gap-3 rounded-md border border-ink-200 bg-ink-50 px-4 py-3 min-w-0">
          <span
            aria-hidden
            className="inline-flex items-center justify-center h-6 px-2 rounded-xs border border-ink-700 text-ink-700 font-mono text-xs font-medium tracking-wider shrink-0"
          >
            CARD
          </span>
          <span className="font-sans text-sm text-ink-500 truncate">
            No payment method on file.
          </span>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-4 border-t border-ink-200">
        <Button variant="secondary">
          <CreditCard data-icon="inline-start" aria-hidden />
          Add payment method
        </Button>
      </CardFooter>
    </Card>
  );
}

function BillingContactCard() {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <Eyebrow as="div">Billing contact</Eyebrow>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <p className="font-sans text-sm text-ink-800 m-0 text-pretty">
          Receipts and renewal notices route to this address.
        </p>
        <div className="flex flex-col gap-1">
          <p className="font-sans text-sm font-medium text-ink-900 m-0">
            Chad Ponticas
          </p>
          <address className="font-sans text-sm not-italic text-ink-500 m-0">
            1900 Lake Houston Drive<br />
            Houston, TX 77302
          </address>
          <p className="font-mono text-sm text-ink-500 m-0 truncate">
            chad@constellationnetwork.io
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── History ────────────────────────────────────────────────────────── */

function HistorySection() {
  return (
    <Card density="flush">
      <div className="flex flex-col gap-1 p-4 min-w-0">
        <Eyebrow as="div">History</Eyebrow>
        <p className="font-sans text-sm/5 tracking-tight text-ink-500 text-pretty m-0">
          Past charges and credit top-ups.
        </p>
      </div>

      {/* Empty branch — fresh workspace has no charges. When data lands,
          swap this for `<Table>` + rows. */}
      <EmptyState
        className="border-t border-ink-200 rounded-none shadow-none"
        icon={
          <div
            aria-hidden
            className="flex items-center justify-center rounded-md bg-ink-100"
            style={{ width: 48, height: 48, flexShrink: 0 }}
          >
            <History className="text-ink-600" strokeWidth={1.5} style={{ width: 24, height: 24 }} />
          </div>
        }
        title="No history yet"
        body="Charges and credit top-ups will appear here once your workspace starts routing requests."
      />
    </Card>
  );
}
