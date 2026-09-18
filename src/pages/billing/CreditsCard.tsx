import { Plus } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import { OptionTile } from "@/components/ui/option-tile";
import { RefreshCWIcon } from "@/components/ui/refresh-cw";
import { Switch } from "@/components/ui/switch";
import { CREDIT_BALANCE_USD, lastTopUpLabel } from "@/data/billing-history";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
 * Credits card and its two dialogs, lifted VERBATIM out of Billing.tsx on
 * 2026-09-16 so the Enterprise page can render the same surface instead of
 * duplicating ~500 lines. Pay-as-you-go credits are plan-independent: the
 * balance funds gateway-routed requests on every paid tier, so Pro and
 * Enterprise share this module. Free keeps its own copies (BillingFree.tsx),
 * which differ.
 *
 * `CreditStatRow` is exported because the Seats sub-card on both pages uses
 * the same label/value row.
 * ───────────────────────────────────────────────────────────────────── */

const MIN_TOPUP = 5;
const MAX_TOPUP = 1000;

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

/** Evaluated once at module scope, not as a default parameter: a default is
 *  re-evaluated on every render, and `lastTopUpLabel()` does a `.find` over the
 *  ledger plus a date format on each call. */
const DEFAULT_LAST_TOP_UP = lastTopUpLabel();

export function CreditsCard({
  /** PAYG credit balance. Defaults to the live ledger balance, which is what
   *  Pro and every provisioned Enterprise org shows; a freshly granted org
   *  with billing not yet set up passes 0. */
  balance = CREDIT_BALANCE_USD,
  /** Formatted "Last top-up" value, or null when there has never been one.
   *  Defaults to the newest `Credits added` row in the ledger. */
  lastTopUp = DEFAULT_LAST_TOP_UP,
}: {
  balance?: number;
  lastTopUp?: string | null;
} = {}) {
  const [addOpen, setAddOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [auto, setAuto] = useState<AutoRechargeConfig>(readAutoRecharge);

  return (
    <Card className="min-w-0 pb-0!">
      <CardContent className="flex flex-1 flex-col gap-3">
        <HeroNumeric>{formatCurrency(balance)}</HeroNumeric>
        <p className="type-copy-14 m-0 text-pretty text-foreground">
          Used for messages routed through our gateway. Each call is charged at
          our per-model rate. Security and audit are included.
        </p>
        {/* Same hairline the plan sub-cards use: a 1px `border-border`
            rule centred in a 24px band (12px above from `mt-3`, 12px
            below from `pt-3`), so the stat rows read as data under the
            description instead of more of it. */}
        <dl className="type-copy-14 m-0 mt-3 flex flex-col gap-2 border-border border-t pt-3">
          <CreditStatRow
            label="Used this month"
            mono
            value={`${formatCurrency(0)} / ${formatCurrency(balance)}`}
          />
          <CreditStatRow
            label="Auto-recharge"
            value={
              auto.enabled ? `+$${auto.topUp} below $${auto.threshold}` : "Off"
            }
          />
          {/* No top-up yet is an absence, not a value: it goes quiet in the
              muted tone rather than reading as a real date. */}
          <CreditStatRow
            label="Last top-up"
            muted={lastTopUp === null}
            value={lastTopUp ?? "None yet"}
          />
        </dl>
      </CardContent>
      {/* Both buttons stay in the zero state: they are the way out of it. */}
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
      {/* Fixed 500px modal; only shrinks on a phone. Width fills the viewport minus
            16px gutters, capped at 500px. The `!` cap beats DialogContent's base
            `sm:max-w-sm` (384px) so 500px always wins — no per-breakpoint width. */}
      <DialogContent
        className="gap-4"
        style={{ width: "calc(100% - 2rem)", maxWidth: 500 }}
      >
        <DialogHeader>
          <DialogTitle className="type-heading-20 text-foreground">
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
              <OptionTile
                key={value}
                onClick={() => {
                  setSelected(value);
                  setCustom("");
                }}
                onKeyDown={(event) => onPresetKeyDown(event, index)}
                ref={(el) => {
                  presetRefs.current[index] = el;
                }}
                selected={isSelected}
                tabIndex={
                  selectedPreset === null
                    ? index === 0
                      ? 0
                      : -1
                    : isSelected
                      ? 0
                      : -1
                }
              >
                {formatCurrency(value, { minFrac: 0, maxFrac: 0 })}
              </OptionTile>
            );
          })}
        </div>

        {/* Custom amount */}
        <div className="flex flex-col gap-2">
          <label
            className="type-label-14 m-0 text-muted-foreground"
            htmlFor="add-credits-custom"
          >
            Amount (USD)
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="type-mono-14 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
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
              className="type-mono-14 pl-7"
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

        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
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
      {/* Fixed 500px modal; only shrinks on a phone. Width fills the viewport minus
            16px gutters, capped at 500px. The `!` cap beats DialogContent's base
            `sm:max-w-sm` (384px) so 500px always wins — no per-breakpoint width. */}
      <DialogContent
        className="gap-4"
        style={{ width: "calc(100% - 2rem)", maxWidth: 500 }}
      >
        <DialogHeader>
          <DialogTitle className="type-heading-20 text-foreground">
            Auto-recharge
          </DialogTitle>
          <DialogDescription>
            Top up credits automatically when balance drops.
          </DialogDescription>
        </DialogHeader>

        {/* Enable card */}
        <div className="flex items-start justify-between gap-4 rounded-md border border-border p-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p
              className="type-label-14 m-0 text-foreground"
              id="ar-enable-label"
            >
              Enable auto-recharge
            </p>
            <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
              We&apos;ll charge your default card to top up.
            </p>
          </div>
          <Switch
            aria-labelledby="ar-enable-label"
            checked={enabled}
            className="shrink-0"
            onCheckedChange={setEnabled}
            size="lg"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
          {/* When balance drops below */}
          <div className="flex flex-col gap-2">
            <label
              className="type-label-14 m-0 text-muted-foreground"
              htmlFor="ar-threshold"
            >
              When balance drops below
            </label>
            <div className="relative">
              <span
                aria-hidden
                className="type-mono-14 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              >
                $
              </span>
              <Input
                aria-describedby={
                  thresholdInvalid ? "ar-threshold-error" : undefined
                }
                aria-invalid={thresholdInvalid}
                className="type-mono-14 pl-7 disabled:opacity-50"
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
              className="type-label-14 m-0 text-muted-foreground"
              htmlFor="ar-topup"
            >
              Top-up amount
            </label>
            <div className="relative">
              <span
                aria-hidden
                className="type-mono-14 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              >
                $
              </span>
              <Input
                aria-describedby={topUpInvalid ? "ar-topup-error" : undefined}
                aria-invalid={topUpInvalid}
                className="type-mono-14 pl-7 disabled:opacity-50"
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
            className="type-label-14 m-0 text-muted-foreground"
            htmlFor="ar-cap"
          >
            Monthly cap{" "}
            <span className="font-normal text-muted-foreground">
              (leave blank for no cap)
            </span>
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="type-mono-14 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            >
              $
            </span>
            <Input
              aria-describedby={capInvalid ? "ar-cap-error" : undefined}
              aria-invalid={capInvalid}
              className="type-mono-14 pl-7 disabled:opacity-50"
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
          <div className="flex flex-col gap-2 rounded-md border border-border bg-card-muted px-4 py-3">
            <p className="type-copy-14 m-0 text-pretty text-foreground">
              When your balance drops below{" "}
              <span className="font-medium text-foreground">${threshold}</span>,
              we&apos;ll add{" "}
              <span className="font-medium text-foreground">${topUp}</span> to
              your account
              {monthlyCap !== null && capValid ? (
                <>
                  , up to{" "}
                  <span className="font-medium text-foreground">
                    ${monthlyCap}/month
                  </span>
                </>
              ) : (
                <>
                  {" "}
                  with{" "}
                  <span className="font-medium text-foreground">
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

export function CreditStatRow({
  label,
  value,
  mono = false,
  muted = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  /** Quiet tone for an absent value ("None yet"), the BillingFree shape. */
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
