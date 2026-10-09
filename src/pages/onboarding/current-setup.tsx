import { Plus, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { randomHex } from "@/lib/utils";
import {
  CreateKeyButton,
  CreateKeyDialog,
  KeyCreatedDialog,
} from "@/pages/ApiKeys";
import { AddCreditsDialog } from "@/pages/billing/CreditsCard";
import {
  ConnectTabs,
  DownloadGateConnectDialog,
} from "@/pages/DashboardDefault";
import {
  CurrentScaffold,
  DOCS_URL,
  DocsLink,
  GateConnectWindow,
  ImageChoiceCard,
  StepCard,
  StepHeading,
} from "@/pages/onboarding/current-parts";
import {
  ONBOARDING_ROUTES,
  type SetupFrom,
} from "@/pages/onboarding/onboarding-routes";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";
import { ModelPicker } from "@/pages/SetupManual";

/* ─── Current flow: choose a path and connect ───────────────────────────────
 * Steps 1-2 of the mockup's Current flow: billing path (Overview), connection
 * choice, then one of three setup pages (Gate Connect, Manual BYOK, PAYG).
 * Reuses the existing setup parts where they match the mockup: the Gate
 * Connect download dialog and the client config tabs (DashboardDefault),
 * the create-key dialogs (ApiKeys), the Add credits dialog (Billing) and
 * the model picker (SetupManual).
 * ───────────────────────────────────────────────────────────────────────── */

/** Step 1: "How do you want to use Gate?" (the mockup's /overview). */
export function CurrentStart() {
  const navigate = useNavigate();
  return (
    <CurrentScaffold step={1}>
      <div className="flex flex-col gap-6">
        <StepHeading size="section" title="How do you want to use Gate?">
          This is only about how model usage is billed, not your protection, and
          you can change it later.{" "}
          <DocsLink href={`${DOCS_URL}/billing/plans/`}>
            How billing works
          </DocsLink>
        </StepHeading>
        <div className="grid @lg:grid-cols-2 gap-4">
          <ImageChoiceCard
            body="Keep your existing Claude, OpenAI, or Gemini accounts. Gate sits in front and your providers keep billing you directly."
            image="/onboarding/image-byok.png"
            onClick={() => navigate(ONBOARDING_ROUTES.connect)}
            title="Route my existing subscriptions"
          />
          <ImageChoiceCard
            body="No provider accounts needed. Top up a balance with Gate and use Gate's own models, billed per token."
            image="/onboarding/image-payg.png"
            onClick={() => navigate(`${ONBOARDING_ROUTES.manual}?bill=payg`)}
            title="Pay-as-you-go"
          />
        </div>
      </div>
    </CurrentScaffold>
  );
}

/** Step 1, BYOK branch: "How should we connect?". */
export function CurrentConnect() {
  const navigate = useNavigate();
  return (
    <CurrentScaffold back={ONBOARDING_ROUTES.start} step={1}>
      <div className="flex flex-col gap-6">
        <StepHeading title="How should we connect?">
          Gate Connect is a tiny menu-bar app that routes the models you already
          run; manual setup points a client at Gate’s base URL with a key. Both
          apply the exact same protection.
        </StepHeading>
        <div className="grid @lg:grid-cols-2 gap-4">
          <ImageChoiceCard
            badge="Recommended"
            body="Install Gate Connect, toggle Proxy On, and your AI messages route through Gate. No code."
            image="/onboarding/image-connect.png"
            onClick={() => navigate(ONBOARDING_ROUTES.gateConnect)}
            title="Gate Connect"
          />
          <ImageChoiceCard
            body="No app to install. Point your client at Gate's base URL and add a key. Best if you use an SDK or CLI."
            image="/onboarding/image-manual.png"
            onClick={() => navigate(`${ONBOARDING_ROUTES.manual}?bill=byok`)}
            title="Manual setup"
          />
        </div>
      </div>
    </CurrentScaffold>
  );
}

/** Marks step 1 done on reaching a setup page (the mockup's `no("path")`). */
function useMarkPathChosen() {
  const { current, updateCurrent } = useOnboarding();
  useEffect(() => {
    if (!current.path) {
      updateCurrent({ path: true });
    }
  }, [current.path, updateCurrent]);
}

/** "Listen for my message": finishes step 2 and opens the listening step. */
function ListenButton({
  from,
  disabled = false,
}: {
  from: SetupFrom;
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  const { updateCurrent } = useOnboarding();
  return (
    <Button
      disabled={disabled}
      onClick={() => {
        updateCurrent({ connected: true });
        navigate(`${ONBOARDING_ROUTES.listening}?from=${from}`);
      }}
      size="default"
    >
      <Radio aria-hidden data-icon="inline-start" strokeWidth={1.75} />
      Listen for my message
    </Button>
  );
}

/** Step 2: Gate Connect. */
export function CurrentGateConnect() {
  useMarkPathChosen();
  return (
    <CurrentScaffold back={ONBOARDING_ROUTES.connect} step={2}>
      <div className="flex flex-col gap-6">
        <StepHeading title="Set up Gate Connect">
          Three quick steps. Gate Connect does the routing for you.{" "}
          <DocsLink
            href={`${DOCS_URL}/getting-started/quickstart-gate-connect/`}
          >
            Full guide
          </DocsLink>
        </StepHeading>
        <div className="flex flex-col gap-4">
          <StepCard
            action={<DownloadGateConnectDialog />}
            active
            description="Available for macOS, Windows, and Linux."
            n={1}
            title="Download Gate Connect"
          />
          <StepCard
            active
            description="Open the Gate Connect app and sign in using your Constellation Gate account, then toggle Proxy On to start routing your messages."
            footer={<GateConnectWindow />}
            n={2}
            title="Sign in and connect"
          />
          <StepCard
            action={<ListenButton from="gate-connect" />}
            active
            description="Open Claude, ChatGPT, Codex, or any AI model you prefer, and send a message."
            n={3}
            title="Send a message from your app"
          />
        </div>
      </div>
    </CurrentScaffold>
  );
}

/** Shared create-key flow: CreateKeyDialog, then the one-time reveal. */
function useCreateKey() {
  const { updateCurrent } = useOnboarding();
  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const dialogs = (
    <>
      <CreateKeyDialog
        onCreate={() => {
          setCreateOpen(false);
          setCreatedKey(`sk-gw-${randomHex(64)}`);
        }}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />
      <KeyCreatedDialog
        fullKey={createdKey}
        onClose={() => {
          setCreatedKey(null);
          updateCurrent({ keyCreated: true });
        }}
      />
    </>
  );
  return { open: () => setCreateOpen(true), dialogs };
}

function KeyAction({ onCreate }: { onCreate: () => void }) {
  const { current } = useOnboarding();
  return current.keyCreated ? (
    <span className="type-copy-14 text-muted-foreground">API key created.</span>
  ) : (
    <CreateKeyButton onClick={onCreate}>Create API key</CreateKeyButton>
  );
}

/** Step 2: Manual setup (BYOK) or pay-as-you-go, by `?bill=`. */
export function CurrentManual() {
  const [searchParams] = useSearchParams();
  useMarkPathChosen();
  return searchParams.get("bill") === "payg" ? <PaygSetup /> : <ByokSetup />;
}

function ByokSetup() {
  const { current } = useOnboarding();
  const createKey = useCreateKey();
  const ready = current.keyCreated;
  return (
    <CurrentScaffold back={ONBOARDING_ROUTES.connect} step={2}>
      <div className="flex flex-col gap-6">
        <StepHeading title="Manual setup">
          No coding. Point a tool you already run at Gate by changing one
          setting — its base URL — and adding your Gate key.
        </StepHeading>
        <div className="flex flex-col gap-4">
          <StepCard
            action={<KeyAction onCreate={createKey.open} />}
            active
            description="One key the app uses to sign in."
            n={1}
            title="Create your first key"
          />
          <StepCard
            active={ready}
            description="These two settings work for any OpenAI or Anthropic-compatible client."
            dimmed={!ready}
            footer={
              <Card className="flex flex-1 flex-col" density="flush">
                <ConnectTabs
                  byokOnly
                  codeMaxHeight="h-[216px]"
                  floatingCopy
                  hideStrip
                  showGateConnect={false}
                />
              </Card>
            }
            n={2}
            title="Set your base URL and key"
          />
          <StepCard
            action={<ListenButton disabled={!ready} from="manual" />}
            active={ready}
            description="Open Claude, ChatGPT, Codex, or any AI model you prefer, and send a message."
            dimmed={!ready}
            n={3}
            title="Send a message from your app"
          />
        </div>
      </div>
      {createKey.dialogs}
    </CurrentScaffold>
  );
}

function PaygSetup() {
  const { current, updateCurrent } = useOnboarding();
  const createKey = useCreateKey();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const funded = current.balanceUsd > 0;
  const modelReady = funded && current.modelChosen;
  const ready = modelReady && current.keyCreated;
  return (
    <CurrentScaffold back={ONBOARDING_ROUTES.start} step={2}>
      <div className="flex flex-col gap-6">
        <StepHeading title="Set up pay-as-you-go">
          No subscription needed. You only pay for the tokens you use.{" "}
          <DocsLink href={`${DOCS_URL}/billing/plans/`}>
            How billing works
          </DocsLink>
        </StepHeading>
        <div className="flex flex-col gap-4">
          <StepCard
            action={
              <div className="flex flex-wrap items-center gap-3">
                {funded ? (
                  <Badge variant="success">
                    You have ${current.balanceUsd} credits
                  </Badge>
                ) : null}
                <Button
                  onClick={() => setCreditsOpen(true)}
                  size="default"
                  variant={funded ? "outline" : "default"}
                >
                  <Plus aria-hidden data-icon="inline-start" />
                  Add credits
                </Button>
              </div>
            }
            active
            description="Top up your balance. Gate draws down as your tokens are used."
            n={1}
            title="Add credits"
          />
          <StepCard
            action={
              <PaygModelPicker
                onChange={(model) =>
                  updateCurrent({ model, modelChosen: true })
                }
                value={current.model}
              />
            }
            active={funded}
            description="Choose which Gate model your tokens will use."
            dimmed={!funded}
            n={2}
            title="Select a model"
          />
          <StepCard
            action={<KeyAction onCreate={createKey.open} />}
            active={modelReady}
            description="One key the app uses to sign in."
            dimmed={!modelReady}
            n={3}
            title="Create your first key"
          />
          <StepCard
            active={ready}
            description="Set these in your client. Use the model you picked above."
            dimmed={!ready}
            footer={
              <Card className="flex flex-1 flex-col" density="flush">
                <ConnectTabs
                  codeMaxHeight="h-[216px]"
                  floatingCopy
                  hideStrip
                  paygOnly
                  showGateConnect={false}
                />
              </Card>
            }
            n={4}
            title="Point your app to Gate"
          />
          <StepCard
            action={<ListenButton disabled={!ready} from="payg" />}
            active={ready}
            description="Open Claude, ChatGPT, Codex, or any AI model you prefer, and send a message."
            dimmed={!ready}
            n={5}
            title="Send a message from your app"
          />
        </div>
      </div>
      <AddCreditsDialog
        onCheckout={(amount) =>
          updateCurrent({ balanceUsd: current.balanceUsd + amount })
        }
        onOpenChange={setCreditsOpen}
        open={creditsOpen}
      />
      {createKey.dialogs}
    </CurrentScaffold>
  );
}

/** The SetupManual model combobox, owning its own open / search state. Any
 *  interaction with it counts as choosing (SetupManual's rule). */
export function PaygModelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (model: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <ModelPicker
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery("");
          onChange(value);
          setTimeout(() => searchRef.current?.focus(), 50);
        }
      }}
      onQueryChange={setQuery}
      onSelect={(handle) => {
        onChange(handle);
        setOpen(false);
      }}
      open={open}
      query={query}
      searchRef={searchRef}
      value={value}
    />
  );
}
