import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Info,
  KeyRound,
  Plus,
  Search,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { ExternalLinkIcon } from "@/components/ui/external-link";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TextLink } from "@/components/ui/text-link";
import { MODEL_OPTIONS } from "@/data/models";
import { cn, randomHex } from "@/lib/utils";
import {
  CreateKeyButton,
  CreateKeyDialog,
  KeyCreatedDialog,
} from "@/pages/ApiKeys";
import { ConnectTabs } from "@/pages/DashboardDefault";
import { PaygToolConfigCard } from "@/pages/Models";
import {
  AnimatedEllipsis,
  SetupScaffold,
  WaitingStrip,
} from "@/pages/onboarding-shared";

/* ─── /setup-manual-default?bill=byok|payg ──────────────────────────────────
 * Two onboarding shapes sharing the create-key flow (API Keys dialogs):
 *   • BYOK ("Manual setup") — create a key, then add the Manual config from
 *     /api-keys (ConnectTabs).
 *   • PAYG ("Pay as you go") — the only PAYG path today: create a key, choose a
 *     model, configure your agent with the model-detail PAYG config card, then
 *     send your first request.
 * Billing mode is carried via ?bill= (context strip + Change link).
 * ────────────────────────────────────────────────────────────────────────── */

type BillingMode = "byok" | "payg";

// Demo balance. "Add credits" is a secondary action on the model step, shown
// only while the workspace has no credits (matches /setup-credits-default).
const CREDIT_BALANCE = 0;

const BILL_META: Record<
  BillingMode,
  { title: string; subtitle: string; context: string }
> = {
  byok: {
    title: "Manual setup",
    subtitle: "Create a key, add the config, and route your own plan.",
    context: "Using your existing subscription, your own key.",
  },
  payg: {
    title: "Run models pay-as-you-go",
    subtitle:
      "No provider accounts needed. Add credits and call any model, billed through Gate.",
    context: "Pay as you go, billed through Gate credits.",
  },
};

export function SetupManual() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bill: BillingMode =
    searchParams.get("bill") === "payg" ? "payg" : "byok";

  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [keySaved, setKeySaved] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  // Gated flow (both modes): step 2 stays dimmed until the user creates a key
  // or cancels the dialog. PAYG additionally gates steps 3 & 4 behind the first
  // interaction with the model selector.
  const [configRevealed, setConfigRevealed] = useState(false);
  const [modelChosen, setModelChosen] = useState(false);
  const [modelHandle, setModelHandle] = useState(MODEL_OPTIONS[0].handle);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const backTo =
    bill === "byok" ? "/setup-connect-default" : "/overview-default";
  const backLabel = bill === "byok" ? "Connect options" : "Overview";

  const handleCreate = () => {
    setCreateOpen(false);
    setCreatedKey(`sk-gw-${randomHex(64)}`);
  };

  // Step 1 is identical across both modes.
  const createKeyStep = (
    <div className="rounded-md border border-border bg-card p-4">
      {keySaved && maskedKey ? (
        <div className="flex items-center gap-3 rounded-sm border border-success-200 bg-success-50 px-4 py-3 dark:border-success-500/30 dark:bg-success-500/15">
          <span
            aria-hidden
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-success-700 dark:text-success-400"
          >
            <KeyRound className="size-4" />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <span className="type-label-14 text-success-800 dark:text-success-300">
              API key created
            </span>
            <span className="type-mono-12 text-success-800/80 dark:text-success-300/80">
              {maskedKey}
            </span>
          </div>
          <CopyButton
            label="API key"
            mode="label"
            size="sm"
            text="Copy"
            value={maskedKey}
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[180px] flex-1 flex-col gap-1">
            <span className="type-label-14 text-foreground">
              Create a key to authenticate your messages
            </span>
            <span className="type-copy-14 text-muted-foreground">
              Generated instantly. Shown once.
            </span>
          </div>
          <Button
            onClick={() =>
              window.open(
                "https://docs.constellationgate.ai",
                "_blank",
                "noopener,noreferrer"
              )
            }
            size="default"
            variant="outline"
          >
            API docs
            <ExternalLinkIcon aria-hidden data-icon="inline-end" size={16} />
          </Button>
          <CreateKeyButton onClick={() => setCreateOpen(true)} />
        </div>
      )}
    </div>
  );

  return (
    <SetupScaffold
      backLabel={backLabel}
      backTo={backTo}
      subtitle={BILL_META[bill].subtitle}
      title={BILL_META[bill].title}
    >
      <Card density="flush">
        <div className="flex flex-col gap-6 p-6">
          {/* Billing-mode context + change affordance */}
          <div className="flex items-center gap-3 rounded-sm border border-border px-4 py-3">
            <Info
              aria-hidden
              className="size-4 shrink-0 text-blue-600 dark:text-blue-400"
              strokeWidth={1.75}
            />
            <span className="type-copy-14 flex-1 text-foreground">
              {BILL_META[bill].context}
            </span>
            <TextLink
              className="type-label-14 inline-flex items-center gap-1"
              onClick={() =>
                navigate(
                  bill === "byok"
                    ? "/setup-connect-default"
                    : "/overview-default"
                )
              }
            >
              Change
              <ArrowUpRight
                aria-hidden
                className="size-3.5 shrink-0"
                strokeWidth={1.75}
              />
            </TextLink>
          </div>

          {bill === "payg" ? (
            <>
              {/* Step 1 — create key */}
              <div className="flex flex-col gap-3">
                <StepHeading n={1}>Create an API key</StepHeading>
                {createKeyStep}
              </div>

              {/* Step 2 — choose a model. Dimmed until the user creates a key
                  or cancels the dialog. */}
              <div
                className={cn(
                  "flex flex-col gap-3 transition-opacity duration-150 ease-out",
                  configRevealed ? null : "pointer-events-none opacity-50"
                )}
              >
                <StepHeading n={2}>Choose a model</StepHeading>
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-4">
                  <ModelPicker
                    onOpenChange={(open) => {
                      setModelPickerOpen(open);
                      if (open) {
                        // First interaction with the selector reveals steps 3-4.
                        setModelChosen(true);
                        setModelQuery("");
                        // Focus the search input after the popover animates in
                        setTimeout(() => searchRef.current?.focus(), 50);
                      }
                    }}
                    onQueryChange={setModelQuery}
                    onSelect={(handle) => {
                      setModelHandle(handle);
                      setModelChosen(true);
                      setModelPickerOpen(false);
                    }}
                    open={modelPickerOpen}
                    query={modelQuery}
                    searchRef={searchRef}
                    value={modelHandle}
                  />
                  {CREDIT_BALANCE === 0 ? (
                    <Button
                      className="ml-auto"
                      onClick={() => navigate("/setup-credits-default")}
                      size="default"
                      variant="outline"
                    >
                      <Plus aria-hidden data-icon="inline-start" />
                      Add credits
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Step 3 — configure your agent (shared model-detail PAYG config).
                  Dimmed until the user interacts with the model selector. */}
              <div
                className={cn(
                  "flex flex-col gap-3 transition-opacity duration-150 ease-out",
                  modelChosen ? null : "pointer-events-none opacity-50"
                )}
              >
                <StepHeading n={3}>Configure your agent</StepHeading>
                <PaygToolConfigCard handle={modelHandle} />
              </div>

              {/* Step 4 — first request. Un-dims with step 3; spinner starts
                  once the model selector has been used. */}
              <div
                className={cn(
                  "flex flex-col gap-3 transition-opacity duration-150 ease-out",
                  modelChosen ? null : "pointer-events-none opacity-50"
                )}
              >
                <StepHeading n={4}>Send your first request</StepHeading>
                <WaitingStrip active={modelChosen}>
                  Listening for your first request
                  {modelChosen ? <AnimatedEllipsis /> : null}
                </WaitingStrip>
              </div>
            </>
          ) : (
            <>
              {/* Step 1 — create key */}
              <div className="flex flex-col gap-3">
                <StepHeading n={1}>Create your API key</StepHeading>
                {createKeyStep}
              </div>

              {/* Step 2 — exact Manual config component from /api-keys.
                  Dimmed until the user creates a key or cancels the dialog.
                  The listening strip sits 12px below the snippet card (gap-3). */}
              <div
                className={cn(
                  "flex flex-col gap-3 transition-opacity duration-150 ease-out",
                  configRevealed ? null : "pointer-events-none opacity-50"
                )}
              >
                <StepHeading n={2}>Add the config</StepHeading>
                <Card className="flex flex-1 flex-col" density="flush">
                  <div className="flex-1">
                    <ConnectTabs
                      byokOnly
                      codeMaxHeight="h-[216px]"
                      floatingCopy
                      hideStrip
                      showGateConnect={false}
                    />
                  </div>
                </Card>
                <WaitingStrip active={configRevealed}>
                  Listening for you to send your first request
                  {configRevealed ? <AnimatedEllipsis /> : null}
                </WaitingStrip>
              </div>
            </>
          )}
        </div>
      </Card>

      <CreateKeyDialog
        onCancel={() => setConfigRevealed(true)}
        onCreate={handleCreate}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />
      <KeyCreatedDialog
        fullKey={createdKey}
        onClose={() => {
          if (createdKey) {
            setMaskedKey(`sk-gw-…${createdKey.slice(-4)}`);
          }
          setCreatedKey(null);
          setKeySaved(true);
          setConfigRevealed(true);
        }}
      />
    </SetupScaffold>
  );
}

/** Step heading with the green numbered circle (matches Gate Connect steps). */
function StepHeading({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
}) {
  return (
    <h2 className="type-label-14 m-0 flex items-center gap-2 text-foreground">
      <span
        aria-hidden
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-success-600 bg-success-50 text-success-700 tabular-nums dark:bg-success-500/15 dark:text-success-300"
      >
        {n}
      </span>
      {children}
    </h2>
  );
}

/* ─── Model combobox ─────────────────────────────────────────────────────── */

function ModelPicker({
  value,
  open,
  onOpenChange,
  onSelect,
  query,
  onQueryChange,
  searchRef,
}: {
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (handle: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}) {
  const selected = MODEL_OPTIONS.find((m) => m.handle === value);
  const filtered = MODEL_OPTIONS.filter((m) =>
    m.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger
        aria-label="Choose a model"
        className="group/select flex h-9 w-full select-none items-center justify-between gap-2 whitespace-nowrap rounded-sm border border-border bg-muted pr-3 pl-4 text-foreground text-sm outline-none transition-[colors,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-72"
      >
        <span className="flex flex-1 items-center gap-2 overflow-hidden">
          {selected ? (
            <>
              <VendorAvatar decorative vendor={selected.vendor} />
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Choose a model</span>
          )}
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-aria-expanded/select:rotate-180 motion-reduce:transition-none"
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-0" sideOffset={6}>
        {/* Sticky search bar */}
        <div className="flex items-center gap-2 border-border border-b px-3 py-2">
          <Search
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search models…"
            ref={searchRef}
            type="search"
            value={query}
          />
        </div>

        {/* Filtered list */}
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="type-copy-14 px-3 py-6 text-center text-muted-foreground">
              No models match &ldquo;{query}&rdquo;
            </p>
          ) : (
            filtered.map((m) => (
              <button
                className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-xs px-3 text-foreground text-sm outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[active=true]:bg-accent"
                data-active={m.handle === value}
                key={m.handle}
                onClick={() => onSelect(m.handle)}
                type="button"
              >
                <VendorAvatar decorative vendor={m.vendor} />
                <span className="flex-1 truncate text-left">{m.label}</span>
                {m.handle === value ? (
                  <Check
                    aria-hidden
                    className="size-4 shrink-0 text-blue-600 dark:text-blue-400"
                    strokeWidth={2}
                  />
                ) : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
