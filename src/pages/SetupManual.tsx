import { Box, CreditCard, Info, KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnthropicIcon, OpenAIIcon } from "@/components/icons/model-providers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { ExternalLinkIcon } from "@/components/ui/external-link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextLink } from "@/components/ui/text-link";
import { CodePanel } from "@/pages/DashboardDefault";
import { SetupScaffold, WaitingStrip } from "@/pages/onboarding-shared";

/* ─── /setup-manual-default?bill=byok|payg ──────────────────────────────────
 * The hand-config path, reached from BYOK → Manual and directly from the
 * pay-as-you-go outcome on Overview. Billing mode is fixed by the prior choice
 * (carried via ?bill=), so there's no in-page BYOK/PAYG toggle — the context
 * strip + "Change" link own that. Back breadcrumb: Connect options (BYOK) or
 * Overview (PAYG), matching the concept's flow.
 * ────────────────────────────────────────────────────────────────────────── */

type BillingMode = "byok" | "payg";
type ToolId = "claude-code" | "codex" | "openclaw";

const GATEWAY_URL = "https://gateway.constellationgate.ai";
const MASKED_KEY = "sk-gw-7Q2••••••••••••f9A1";

const BILL_CONTEXT: Record<BillingMode, { context: string; subtitle: string }> =
  {
    byok: {
      context: "Using your existing subscription, your own key.",
      subtitle: "Create a key, add the config, and route your own plan.",
    },
    payg: {
      context: "Pay as you go, billed through Gate credits.",
      subtitle: "Create a key, add credits, then drop in the config.",
    },
  };

const SNIPPETS: Record<BillingMode, Record<ToolId, string>> = {
  byok: {
    "claude-code": `export ANTHROPIC_BASE_URL="${GATEWAY_URL}"
export ANTHROPIC_API_KEY="sk-ant-•••YOUR_KEY"
export GATE_KEY="sk-gw-7Q2•••f9A1"`,
    codex: `[gate]
base_url = "${GATEWAY_URL}"
upstream_key = "sk-•••YOUR_OPENAI_KEY"
gate_key = "sk-gw-7Q2•••f9A1"`,
    openclaw: `openclaw config set base_url ${GATEWAY_URL}
openclaw config set upstream_key sk-•••YOUR_KEY
openclaw config set gate_key sk-gw-7Q2•••f9A1`,
  },
  payg: {
    "claude-code": `export ANTHROPIC_BASE_URL="${GATEWAY_URL}"
export ANTHROPIC_API_KEY="sk-gw-7Q2•••f9A1"   // Gate covers model access`,
    codex: `[gate]
base_url = "${GATEWAY_URL}"
gate_key = "sk-gw-7Q2•••f9A1"   // PAYG, no provider key`,
    openclaw: `openclaw config set base_url ${GATEWAY_URL}
openclaw config set gate_key sk-gw-7Q2•••f9A1   // PAYG`,
  },
};

const TOOL_TABS: { id: ToolId; label: string; icon: typeof AnthropicIcon }[] = [
  { id: "claude-code", label: "Claude Code", icon: AnthropicIcon },
  { id: "codex", label: "Codex", icon: OpenAIIcon },
];

export function SetupManual() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bill: BillingMode =
    searchParams.get("bill") === "payg" ? "payg" : "byok";

  const [tool, setTool] = useState<ToolId>("claude-code");
  const [keyCreated, setKeyCreated] = useState(false);

  const backTo =
    bill === "byok" ? "/setup-connect-default" : "/overview-default";
  const backLabel = bill === "byok" ? "Connect options" : "Overview";

  return (
    <SetupScaffold
      backLabel={backLabel}
      backTo={backTo}
      subtitle={BILL_CONTEXT[bill].subtitle}
      title="Manual setup"
    >
      <Card density="flush">
        <div className="flex flex-col gap-6 p-6">
          {/* Billing-mode context + change affordance */}
          <div className="flex items-center gap-3 rounded-sm border border-border bg-neutral-50 px-4 py-3">
            <Info
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={1.75}
            />
            <span className="type-copy-14 flex-1 text-foreground">
              {BILL_CONTEXT[bill].context}
            </span>
            <TextLink
              className="type-label-14"
              onClick={() =>
                navigate(
                  bill === "byok"
                    ? "/setup-connect-default"
                    : "/overview-default"
                )
              }
            >
              Change
            </TextLink>
          </div>

          {/* Step 1 — create key */}
          <div className="flex flex-col gap-3">
            <h2 className="type-label-14 m-0 text-foreground">
              1. Create your API key
            </h2>
            {keyCreated ? (
              <div className="flex items-center gap-3 rounded-sm border border-success-200 bg-success-50 px-4 py-3">
                <span
                  aria-hidden
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-success-700"
                >
                  <KeyRound className="size-4" />
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="type-label-14 text-success-800">
                    API key created
                  </span>
                  <span className="font-mono text-success-800/80 text-xs tabular-nums">
                    {MASKED_KEY}
                  </span>
                </div>
                <CopyButton
                  label="API key"
                  mode="label"
                  size="sm"
                  text="Copy"
                  value={MASKED_KEY}
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-neutral-50 px-4 py-3">
                <span
                  aria-hidden
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-700"
                >
                  <KeyRound className="size-4" />
                </span>
                <div className="flex min-w-[180px] flex-1 flex-col gap-1">
                  <span className="type-label-14 text-foreground">
                    Create a key for the config below
                  </span>
                  <span className="type-copy-14 text-muted-foreground">
                    Generated instantly. Revoke anytime.
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
                  size="sm"
                  variant="outline"
                >
                  API docs
                  <ExternalLinkIcon
                    aria-hidden
                    data-icon="inline-end"
                    size={16}
                  />
                </Button>
                <Button onClick={() => setKeyCreated(true)} size="sm">
                  <Plus aria-hidden data-icon="inline-start" />
                  Create key
                </Button>
              </div>
            )}
          </div>

          {/* PAYG-only note → credits / models subpages */}
          {bill === "payg" ? (
            <div className="flex items-start gap-3 rounded-sm border border-blue-200 bg-blue-50 px-4 py-3">
              <CreditCard
                aria-hidden
                className="mt-px size-4 shrink-0 text-blue-700"
                strokeWidth={1.75}
              />
              <div className="flex flex-col gap-2">
                <p className="type-copy-14 m-0 text-foreground">
                  Runs on Gate credits. Top up, then call any model at pooled
                  rates. Gate Connect for pay-as-you-go is coming soon.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    className="-mx-3"
                    onClick={() => navigate("/setup-credits-default")}
                    size="sm"
                    variant="link"
                  >
                    <Plus aria-hidden data-icon="inline-start" />
                    Add credits
                  </Button>
                  <Button
                    className="-mx-3"
                    onClick={() => navigate("/setup-models-default")}
                    size="sm"
                    variant="link"
                  >
                    <Box aria-hidden data-icon="inline-start" />
                    See all available models
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Step 2 — tool config snippet */}
          <div className="flex flex-col gap-3">
            <h2 className="type-label-14 m-0 text-foreground">
              2. Which tool are you using?
            </h2>
            <Tabs
              className="flex flex-col gap-0"
              onValueChange={(v) => setTool(v as ToolId)}
              value={tool}
            >
              <TabsList className="px-0" variant="line">
                {TOOL_TABS.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger key={id} value={id}>
                    <Icon className="size-4" />
                    {label}
                  </TabsTrigger>
                ))}
                <TabsTrigger value="openclaw">
                  <img
                    alt=""
                    aria-hidden
                    className="size-4"
                    src="/icons/providers/openclaw.svg"
                  />
                  OpenClaw
                </TabsTrigger>
              </TabsList>
              {(["claude-code", "codex", "openclaw"] as ToolId[]).map((id) => (
                <TabsContent className="mt-3" key={id} value={id}>
                  <div className="relative overflow-hidden rounded-sm border border-border bg-card">
                    <div className="max-h-[260px] overflow-y-auto">
                      <CodePanel snippet={SNIPPETS[bill][id]} />
                    </div>
                    <div className="absolute right-3 bottom-3">
                      <CopyButton
                        className="shadow-xs"
                        label="config snippet"
                        mode="label"
                        size="sm"
                        text="Copy"
                        value={SNIPPETS[bill][id]}
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <WaitingStrip>
            Run your tool once and we&rsquo;ll confirm it&rsquo;s working.
          </WaitingStrip>
        </div>
      </Card>
    </SetupScaffold>
  );
}
