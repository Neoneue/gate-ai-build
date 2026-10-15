import { ArrowRight, CirclePlus, Info, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { CopyButton } from "@/components/ui/copy-button";
import { ExternalLinkIcon } from "@/components/ui/external-link";
import { InputGroupAddon } from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextLink } from "@/components/ui/text-link";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cn, randomHex } from "@/lib/utils";
import { CreateKeyDialog, KeyCreatedDialog } from "@/pages/ApiKeys";
import { AddCreditsDialog, CreditStatRow } from "@/pages/billing/CreditsCard";
import { DownloadGateConnectDialog } from "@/pages/DashboardDefault";
import { StepIndicator } from "@/pages/onboarding/current-parts";
import { ProtectedAndLive } from "@/pages/onboarding/current-verify";
import { AppIcon } from "@/pages/onboarding/improved-art";
import {
  ATTACK_MESSAGE,
  appNameOf,
  CATALOG_CLIENT,
  CATALOG_MODELS,
  CLIENT_GROUPS,
  clientOf,
  DEMO_TOKENS_IN,
  DEMO_TOKENS_OUT,
  IMPROVED_CLIENTS,
  IMPROVED_MODELS,
  type ImprovedModel,
  manualModelsFor,
  modelOf,
  TEST_MESSAGE,
  TEST_TOKENS_IN,
  TEST_TOKENS_OUT,
  testModelOf,
  wait,
} from "@/pages/onboarding/improved-data";
import {
  ImprovedColumn,
  ImprovedHeader,
  ImprovedRouteFigure,
  SetupGroup,
  StatusRow,
  TryGateChatLink,
} from "@/pages/onboarding/improved-parts";
import type { CheckoutState } from "@/pages/onboarding/OnboardingCheckout";
import { OnboardingChrome } from "@/pages/onboarding/onboarding-chrome";
import { ConnectTabs } from "@/pages/onboarding/onboarding-connect-tabs";
import {
  NEW_TAB_CUE,
  ONBOARDING_ROUTES,
  openInNewTab,
  simulateFlag,
} from "@/pages/onboarding/onboarding-routes";
import type { ImprovedBilling } from "@/pages/onboarding/onboarding-state";
import { useIsMobileSetup } from "@/pages/onboarding/use-is-mobile-setup";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";
import { GUARDRAIL_BADGE } from "@/pages/requests/data";

/* ─── Improved flow: prepare, verify, ready ─────────────────────────────────
 * Steps 2-3 and the finish of the mockup's Improved flow, for the two
 * desktop methods (Gate Connect, Manual). Billing is independent of the
 * connection: provider account or Gate credits, chosen on the same page.
 * The Gate Chat method skips both steps: it runs through the existing Gate
 * Chat page (`/chat-onboarding`) and lands on the ready page from there.
 * ───────────────────────────────────────────────────────────────────────── */

/** Step 3's "Check connection" and protection demo each run 5s (owner
 *  2026-10-13): two packets reach Gate, at 0s and 3s, before the result
 *  (onboarding-motion.css, Setup route). The start page keeps
 *  SIMULATED_MS. */
const ROUTE_CHECK_MS = 5000;

const BILLING_OPTIONS: {
  value: ImprovedBilling;
  title: string;
  detail: string;
}[] = [
  {
    value: "existing",
    title: "Existing subscriptions",
    detail: "Your provider bills usage",
  },
  { value: "payg", title: "Gate credits", detail: "Pay as you go, any model" },
];

/** Step 2's billing choice, on Gate Connect and Manual setup (owner
 *  2026-10-13). The PRD allows it: the tool is picked first (release outcome
 *  3), and billing comes "when the tool needs it" (desktop step 4); the
 *  official repo has a pay-as-you-go Manual path (SetupManual.tsx PaygSetup).
 *  Set to false to hide it (both then run on Existing subscriptions). */
const SHOW_BILLING_CHOICE = true;

/** Gate Connect's "Select a model" (owner 2026-10-14: hidden for now, the
 *  desktop app picks each tool's model). True brings it back. */
const SHOW_CONNECT_MODEL_PICKER = false;

/** The official Manual setup block's app tabs (onboarding-connect-tabs.tsx,
 *  ported from the official repo), in its order. */
const MANUAL_TABS: readonly string[] = [
  "claude-code",
  "codex",
  "opencode",
  "hermes",
  "openclaw",
  "openai-sdk",
];

/** A new app, billing type or model needs a fresh test message and demo
 *  run (owner 2026-10-13): step 3 and the menu's checks start over. */
const RESET_CHECKS = {
  received: false,
  caught: false,
  finished: false,
} as const;

/** `/improved-connect-onboarding`: "Prepare your setup". */
export function ImprovedConnect() {
  const { improved } = useOnboarding();
  if (improved.connection === "gate-chat") {
    return <Navigate replace to={ONBOARDING_ROUTES.chat} />;
  }
  // Rendered at every width (owner direction 2026-10-08): the phone handoff
  // auto-opens the setup link into this desktop setup screen.
  return (
    <OnboardingChrome>
      <PrepareSetup />
    </OnboardingChrome>
  );
}

function PrepareSetup() {
  const navigate = useNavigate();
  const { improved, updateImproved } = useOnboarding();
  const location = useLocation();
  // Back from the mock checkout reopens the dialog to cancel or re-pick.
  const [creditsOpen, setCreditsOpen] = useState(
    () =>
      (location.state as { reopenCredits?: boolean } | null)?.reopenCredits ===
      true
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState("");

  const connect = improved.connection === "gate-connect";
  // Gate Connect has no billing step (owner 2026-10-14; gate repo
  // SetupConnect.tsx and SetupGateConnect.tsx: Gate Connect is the
  // existing-subscriptions path, and credits are bought on Billing for the
  // app's Gate models and Gate Chat), so it always runs on Existing
  // subscriptions.
  const payg = !connect && improved.billing === "payg";
  useEffect(() => {
    if (connect && improved.billing === "payg") {
      updateImproved({ billing: "existing" });
    }
  }, [connect, improved.billing, updateImproved]);
  const funded = !payg || improved.balanceUsd > 0;
  const client = clientOf(improved);
  const app = appNameOf(improved);
  const model = modelOf(improved);
  const keySelected = improved.keys.some(
    (key) => key.id === improved.selectedKeyId
  );
  const clients = IMPROVED_CLIENTS.filter(
    (option) => !connect || option.id !== "openai-sdk"
  );
  // Manual setup's app is the original block's tab; an app it has no tab
  // for (picked earlier on Gate Connect) falls back to its first tab.
  const manualTab = MANUAL_TABS.includes(client.id) ? client.id : "claude-code";
  useEffect(() => {
    if (!connect && client.id !== manualTab) {
      updateImproved({ client: manualTab, connected: false, ...RESET_CHECKS });
    }
  }, [connect, client.id, manualTab, updateImproved]);
  // Manual on Gate credits lists only the models the tab's app can use; a
  // pick the new app cannot use moves to its list's first model (owner
  // 2026-10-14).
  const manualModels = manualModelsFor(manualTab);
  useEffect(() => {
    if (
      !connect &&
      payg &&
      !manualModels.some((option) => option.id === model.id)
    ) {
      updateImproved({ model: manualModels[0].id, ...RESET_CHECKS });
    }
  }, [connect, payg, manualModels, model.id, updateImproved]);

  // Billing, then on Gate credits the model and credits: after the app on
  // Gate Connect, after the key on Manual setup (owner 2026-10-13).
  const billingSections = (
    <>
      {SHOW_BILLING_CHOICE ? (
        <SetupGroup
          description="Choose how model usage is paid for."
          title="Select your billing type"
        >
          <RadioGroup
            aria-label="Select your billing type"
            className="@xl:grid-cols-2"
            onValueChange={(value) => {
              if (value !== improved.billing) {
                updateImproved({
                  billing: value as ImprovedBilling,
                  connected: false,
                  ...RESET_CHECKS,
                });
              }
            }}
            value={improved.billing}
          >
            {BILLING_OPTIONS.map((option) => {
              const checked = improved.billing === option.value;
              const detailId = `setup-billing-${option.value}`;
              return (
                <label
                  className={cn(
                    "grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-md border bg-card p-4 text-left transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:bg-accent-muted motion-reduce:transition-none",
                    checked
                      ? "border-foreground shadow-sm"
                      : "border-border shadow-xs hover:border-input"
                  )}
                  key={option.value}
                >
                  <RadioGroupItem
                    aria-describedby={detailId}
                    value={option.value}
                  />
                  <span className="type-label-14 text-foreground">
                    {option.title}
                  </span>
                  <span
                    className="type-copy-12 col-start-2 text-muted-foreground"
                    id={detailId}
                  >
                    {option.detail}
                  </span>
                </label>
              );
            })}
          </RadioGroup>
        </SetupGroup>
      ) : null}

      {/* Gate Connect's model pick: hidden for now (owner 2026-10-14). Per
          the Gate Connect PRD the desktop app picks each tool's model,
          starting on the tool's own default. Manual's picker sits below its
          app tabs instead (manualModelPicker). */}
      {payg && connect && SHOW_CONNECT_MODEL_PICKER ? (
        <SetupGroup
          description="Choose which Gate model your tokens will use."
          title="Select a model"
        >
          {client.id === CATALOG_CLIENT ? (
            <CatalogModelPicker
              models={CATALOG_MODELS}
              onChange={(next) =>
                updateImproved({ model: next, ...RESET_CHECKS })
              }
              value={model.id}
            />
          ) : (
            <Select
              onValueChange={(next) =>
                updateImproved({ model: String(next), ...RESET_CHECKS })
              }
              value={model.id}
            >
              <SelectTrigger
                aria-label="Select a model"
                className="w-full"
                id="setup-model"
                size="lg"
              >
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <VendorAvatar decorative vendor={model.vendor} />
                    {model.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {IMPROVED_MODELS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <span className="flex items-center gap-2">
                      <VendorAvatar decorative vendor={option.vendor} />
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </SetupGroup>
      ) : null}

      {payg ? (
        <SetupGroup
          description="Credits pay for your model usage. Gate draws them down as your tokens are used."
          title="Add credits"
        >
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* The balance's one home on this page (owner
                          2026-10-09); `CreditStatRow`'s label and mono
                          value voices, label over value so the action
                          can sit on the right. */}
                <dl className="m-0 flex flex-col gap-1">
                  <dt className="type-label-14 text-muted-foreground">
                    Credit balance
                  </dt>
                  <dd className="type-copy-14 m-0 font-mono text-foreground tabular-nums">
                    {formatCurrency(improved.balanceUsd)}
                  </dd>
                </dl>
                <Button
                  onClick={() => setCreditsOpen(true)}
                  size="default"
                  variant={funded ? "outline" : "default"}
                >
                  {funded ? "Add more credits" : "Add credits"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </SetupGroup>
      ) : null}
    </>
  );

  const acknowledge = () => {
    updateImproved({ connected: true, pathChosen: true });
    navigate(ONBOARDING_ROUTES.verify);
  };

  // "Select an app" (owner 2026-10-14): Gate Connect's first step; on Manual
  // it replaces the snippet's tabs and follows the key, billing and credits,
  // since the app decides which models work and the snippet's shape. Both
  // methods carry the tip (Manual's added owner 2026-10-14).
  const appSection = (
    <SetupGroup
      description="Which app do you want to protect?"
      tip={
        connect
          ? "Just a starting point. Gate Connect can route any of your apps, not only this one."
          : "Just a starting point. Your base URL and key work in any app you choose, not only this one."
      }
      title="Select an app"
    >
      <Select
        onValueChange={(value) =>
          updateImproved({
            client: String(value),
            connected: false,
            ...RESET_CHECKS,
            // The default (Claude Fable 5) is already an Anthropic
            // model, so Claude Code keeps it; no per-app swap.
          })
        }
        value={client.id}
      >
        <SelectTrigger
          aria-label="Select an app"
          className="w-full"
          id="setup-app"
          size="lg"
        >
          <SelectValue>
            <span className="flex items-center gap-2">
              <AppIcon src={client.icon} />
              {client.label}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CLIENT_GROUPS.map((group) => {
            const members = clients.filter(
              (option) => option.group === group.id
            );
            return members.length > 0 ? (
              <SelectGroup key={group.id}>
                <SelectLabel>{group.label}</SelectLabel>
                {members.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <span className="flex items-center gap-2">
                      <AppIcon src={option.icon} />
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null;
          })}
        </SelectContent>
      </Select>
    </SetupGroup>
  );

  return (
    <ImprovedColumn>
      <BackLink href={ONBOARDING_ROUTES.start} label="Setup method" />
      <ImprovedHeader
        action={<TryGateChatLink />}
        title={connect ? "Set up Gate Connect" : "Manual setup"}
      />
      <div className="grid @4xl:grid-cols-[5fr_6fr] items-start gap-10">
        <aside
          className="relative @4xl:sticky @4xl:top-6 grid min-h-75 place-items-center rounded-md border border-border bg-muted p-4"
          data-motion-no-replay=""
          data-motion-root="route-stage"
        >
          {/* Keyed on the route it shows: a new app, billing or model
              remounts the figure, so its sequence replays from frame one
              (onboarding-motion.css, Setup route). */}
          <ImprovedRouteFigure
            // Gate Connect has one billing, so its figure carries no billing
            // badge (owner 2026-10-14); Manual keeps it.
            caption={
              connect
                ? undefined
                : payg
                  ? "Uses Gate credits"
                  : "Billed by your provider"
            }
            centered
            improved={improved}
            key={`${client.id}:${improved.billing}:${model.id}`}
          />
        </aside>
        <div className="flex min-w-0 flex-col gap-6">
          {connect ? appSection : null}

          {/* Dimmed and inert until there are credits (owner 2026-10-13:
              hide branches, dim sequences). */}
          {connect ? (
            <div
              aria-disabled={!funded || undefined}
              className={cn(!funded && "opacity-50")}
              inert={!funded}
            >
              <SetupGroup
                description={
                  improved.downloaded
                    ? "Start routing your messages through Gate."
                    : "Available for macOS, Windows, and Linux."
                }
                title={
                  improved.downloaded
                    ? "Sign in and connect"
                    : "Download Gate Connect"
                }
              >
                <Card>
                  <CardContent className="flex flex-col gap-4">
                    {improved.downloaded ? (
                      <ol className="m-0 flex list-none flex-col gap-3 p-0">
                        {[
                          "Sign in to Gate Connect.",
                          `Toggle Routing On for ${app}.`,
                          ...(client.restartStep ? [client.restartStep] : []),
                        ].map((text, index) => (
                          <li className="flex items-center gap-3" key={text}>
                            <StepIndicator n={index + 1} state="upcoming" />
                            <span className="type-copy-14 text-foreground">
                              {text}
                              {/* Download again sits on the sign-in step, the
                                  one that needs the app, muted so the button
                                  stays the card's one action (owner
                                  2026-10-14; was a link beside it). */}
                              {index === 0 ? (
                                <span className="text-muted-foreground">
                                  {" "}
                                  Not installed?{" "}
                                  <DownloadGateConnectDialog
                                    trigger="link"
                                    triggerLabel="Download"
                                  />
                                </span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    {/* Gate credits can't be bought in the Gate Connect app,
                        so the step that sets each app's model source says
                        where they are (owner 2026-10-14). */}
                    {improved.downloaded ? (
                      <p className="type-copy-14 m-0 flex items-start gap-3 text-muted-foreground">
                        {/* An info mark sets the note apart from the
                            numbered steps above (owner 2026-10-14), the same
                            mark as the "Select an app" tip. */}
                        {/* The step circles' 24px slot and 12px gap, so the
                            mark centres under the numbers and the text starts
                            where the steps' text does (owner 2026-10-14). */}
                        <span className="flex h-5 w-6 shrink-0 items-center justify-center">
                          <Info
                            aria-hidden
                            className="size-4"
                            strokeWidth={1.75}
                          />
                        </span>
                        <span>
                          To use Gate models in Gate Connect, add Gate credits
                          on{" "}
                          <TextLink to="/billing-onboarding">Billing</TextLink>.
                        </span>
                      </p>
                    ) : null}
                    {/* 24px above the action, the footer-button gap (owner
                        2026-10-14); the download row has nothing above it. */}
                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-4",
                        improved.downloaded && "mt-2"
                      )}
                    >
                      {improved.downloaded ? (
                        <Button onClick={acknowledge} size="default">
                          I've connected {app}
                          <ArrowRight aria-hidden data-icon="inline-end" />
                        </Button>
                      ) : (
                        <>
                          <DownloadGateConnectDialog
                            onDownload={() =>
                              updateImproved({ downloaded: true })
                            }
                          />
                          <TextLink
                            className="type-label-14"
                            onClick={() => updateImproved({ downloaded: true })}
                          >
                            I already have Gate Connect
                          </TextLink>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </SetupGroup>
            </div>
          ) : null}

          {/* Manual: the key first, always (owner 2026-10-13, restated
              2026-10-14). */}
          {connect ? null : (
            <SetupGroup
              description="One key the app uses to sign in."
              title={
                improved.keys.length > 0
                  ? "Select an active key or create a new one"
                  : "Create your first key"
              }
            >
              <div className="flex flex-wrap items-center gap-3">
                {/* The original Manual setup's key select (gate repo,
                    pages/setup/SetupManual.tsx, 176px wide), always shown:
                    disabled while the workspace has no active key, with
                    the owner's placeholder until one is picked (owner
                    2026-10-13). */}
                <Select
                  disabled={improved.keys.length === 0}
                  onValueChange={(value) =>
                    updateImproved({
                      selectedKeyId: value ? String(value) : null,
                      received: false,
                    })
                  }
                  value={improved.selectedKeyId ?? ""}
                >
                  <SelectTrigger aria-label="API key" className="w-44">
                    <SelectValue>
                      {improved.keys.find(
                        (key) => key.id === improved.selectedKeyId
                      )?.name ?? (
                        <span className="text-muted-foreground">
                          Select an active key
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {improved.keys.map((key) => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setCreateOpen(true)}
                  size="default"
                  variant={keySelected ? "outline" : "default"}
                >
                  {/* The original's circled plus (SetupManual.tsx). */}
                  <CirclePlus aria-hidden data-icon="inline-start" />
                  Create API key
                </Button>
              </div>
            </SetupGroup>
          )}

          {/* Manual after the key (owner 2026-10-14): billing, credits on
              Gate credits, the app, then on Gate credits the model the app
              can use (manualModelsFor). Dimmed and inert until a key is
              chosen (owner 2026-10-13: hide branches, dim sequences). */}
          {connect ? null : (
            <div
              aria-disabled={!keySelected || undefined}
              className={cn(
                "flex flex-col gap-6",
                !keySelected && "opacity-50"
              )}
              inert={!keySelected}
            >
              {billingSections}
              {/* The app on both billings (owner 2026-10-14: a dropdown lists
                  all six apps where the snippet's tabs showed four). Gate
                  credits adds the model the app can use, both dimmed and
                  inert until credits are added. */}
              {payg ? null : appSection}
              {payg ? (
                <div
                  aria-disabled={!funded || undefined}
                  className={cn("flex flex-col gap-6", !funded && "opacity-50")}
                  inert={!funded}
                >
                  {appSection}
                  <SetupGroup
                    description="Choose which Gate model your tokens will use."
                    title="Select a model"
                  >
                    <CatalogModelPicker
                      models={manualModels}
                      onChange={(next) =>
                        updateImproved({ model: next, ...RESET_CHECKS })
                      }
                      value={model.id}
                    />
                  </SetupGroup>
                </div>
              ) : null}
            </div>
          )}

          {/* The snippet comes last and only once it can work: hidden until a
              key is chosen and, on Gate credits, there is a balance; the app
              and model always have a value by then (owner 2026-10-14: hide
              it, never show it dimmed under a live title). */}
          {/* Always shown, dimmed until a key and, on Gate credits, a
              balance (owner 2026-10-14). */}
          {connect ? null : (
            <div
              aria-disabled={!(keySelected && funded) || undefined}
              className={cn(!(keySelected && funded) && "opacity-50")}
              inert={!(keySelected && funded)}
            >
              <SetupGroup
                // The official pair per billing (SetupManual.tsx: BYOK step 2,
                // PaygSetup step 4), since Gate credits snippets add the model.
                description={
                  payg
                    ? "Set these in your client."
                    : "These two settings work for any OpenAI or Anthropic-compatible client."
                }
                title={
                  payg ? "Point your app to Gate" : "Set your base URL and key"
                }
              >
                {/* The official Manual setup's block (gate repo,
                  pages/setup/SetupManual.tsx), showing only the chosen app's
                  snippet: its tabs became "Select an app" (owner
                  2026-10-14). */}
                <Card className="flex flex-1 flex-col" density="flush">
                  <ConnectTabs
                    byokOnly={!payg}
                    codeMaxHeight="max-h-[216px]"
                    defaultTab={manualTab}
                    floatingCopy
                    hideStrip
                    // The app is picked above on both billings, so the snippet
                    // drops its tabs (owner 2026-10-14).
                    hideTabs
                    key={manualTab}
                    onTabChange={(tab) =>
                      updateImproved({
                        client: tab,
                        connected: false,
                        ...RESET_CHECKS,
                      })
                    }
                    paygModel={model.id}
                    paygOnly={payg}
                    // No Bedrock pin on the OpenAI SDK snippet (owner
                    // 2026-10-14): a pinned request never fails over (gate
                    // repo, resolve-upstream.ts), and the catalog serves
                    // every model through OpenRouter, so a pin would refuse
                    // them all. Unpinned, it routes like the other Chat
                    // Completions apps.
                    providerHint={null}
                    showGateConnect={false}
                  />
                </Card>
                {/* The finishing steps as a numbered card, the same pattern as
                    Gate Connect's "Sign in and connect" (owner 2026-10-13).
                    Shown with the snippet (owner 2026-10-14). */}
                <Card>
                  <CardContent className="flex flex-col gap-4">
                    <ol className="m-0 flex list-none flex-col gap-3 p-0">
                      {[
                        `Paste the code into ${app}'s config.`,
                        "Add your saved key secret.",
                        ...(client.restartStep ? [client.restartStep] : []),
                      ].map((text, index) => (
                        <li className="flex items-center gap-3" key={text}>
                          <StepIndicator n={index + 1} state="upcoming" />
                          <span className="type-copy-14 text-foreground">
                            {text}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <Button
                      className="mt-2 self-start"
                      disabled={!(keySelected && funded)}
                      onClick={acknowledge}
                      size="default"
                    >
                      I've saved my settings
                      <ArrowRight aria-hidden data-icon="inline-end" />
                    </Button>
                  </CardContent>
                </Card>
              </SetupGroup>
            </div>
          )}
        </div>
      </div>

      <AddCreditsDialog
        onCheckout={(amount) =>
          // Hands off to the mock hosted checkout; Pay there adds the
          // credits and returns here, Back reopens this dialog.
          navigate(ONBOARDING_ROUTES.checkout, {
            state: {
              amount,
              returnTo: ONBOARDING_ROUTES.improvedConnect,
            } satisfies CheckoutState,
          })
        }
        onOpenChange={setCreditsOpen}
        open={creditsOpen}
      />
      <CreateKeyDialog
        onCreate={({ name }) => {
          setCreateOpen(false);
          setPendingName(name);
          setCreatedKey(`sk-gw-${randomHex(64)}`);
        }}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />
      <KeyCreatedDialog
        fullKey={createdKey}
        onClose={() => {
          const id = `key_${randomHex(8)}`;
          setCreatedKey(null);
          updateImproved((state) => ({
            keys: [...state.keys, { id, name: pendingName || "API key" }],
            selectedKeyId: id,
          }));
        }}
      />
    </ImprovedColumn>
  );
}

/** "Select a model": a model list behind the same 40px trigger as the other
 *  apps' Select, with a search input pinned in the popup above a scrolling
 *  list (owner 2026-10-09). Manual passes the tab's app's list (owner
 *  2026-10-14). */
function CatalogModelPicker({
  models,
  value,
  onChange,
}: {
  models: readonly ImprovedModel[];
  value: string;
  onChange: (model: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = models.find((model) => model.id === value) ?? null;
  return (
    <Combobox
      isItemEqualToValue={(item, current) => item.id === current.id}
      items={models}
      itemToStringLabel={(item) => item.label}
      onInputValueChange={setQuery}
      onValueChange={(next) => {
        if (next) {
          onChange(next.id);
        }
      }}
      value={selected}
    >
      <ComboboxTrigger
        aria-label="Select a model"
        className="w-full"
        id="setup-model"
        size="lg"
      >
        <ComboboxValue>
          {(current: ImprovedModel | null) =>
            current ? (
              <>
                <VendorAvatar decorative vendor={current.vendor} />
                <span className="truncate">{current.label}</span>
              </>
            ) : null
          }
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput
          aria-label="Search models"
          placeholder="Search models…"
          showTrigger={false}
        >
          <InputGroupAddon>
            <Search aria-hidden strokeWidth={1.75} />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxEmpty>No models match “{query}”</ComboboxEmpty>
        <ComboboxList>
          {(item: ImprovedModel) => (
            <ComboboxItem key={item.id} value={item}>
              <VendorAvatar decorative vendor={item.vendor} />
              <span className="truncate">{item.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/** `/improved-verify-onboarding`: "Check connection". */
export function ImprovedVerify() {
  const { improved } = useOnboarding();
  if (improved.connection === "gate-chat") {
    return <Navigate replace to={ONBOARDING_ROUTES.chat} />;
  }
  return (
    <OnboardingChrome>
      <VerifyConnection />
    </OnboardingChrome>
  );
}

function VerifyConnection() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { improved, updateImproved } = useOnboarding();
  const [checking, setChecking] = useState(false);
  const [running, setRunning] = useState(false);
  // The product's failure states: the test message or the protection demo
  // message did not go through, with a retry. The mockup previews them with
  // `?simulate=` (onboarding-routes.ts): read once on mount, the flagged
  // step fails its first attempt and the retry succeeds.
  const [pendingFail] = useState(() => {
    const flag = simulateFlag(search);
    return {
      connection: flag === "fail-connection" || flag === "fail-both",
      demo: flag === "fail-demo" || flag === "fail-both",
    };
  });
  const [attempts, setAttempts] = useState({ connection: 0, demo: 0 });
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [demoFailed, setDemoFailed] = useState(false);
  const app = appNameOf(improved);
  const client = clientOf(improved);
  const model = modelOf(improved);
  const testModel = testModelOf(improved);
  // The demo runs the check's sequence again from a reset figure; a demo
  // that gets no result shows the check's error state.
  const route = running
    ? "live"
    : demoFailed
      ? "error"
      : improved.caught
        ? "blocked"
        : improved.received
          ? "done"
          : checking
            ? "live"
            : connectionFailed
              ? "error"
              : "idle";
  const routeRun = improved.caught
    ? "caught"
    : attempts.demo > 0
      ? `demo-${attempts.demo}`
      : improved.received
        ? "received"
        : `check-${attempts.connection}`;

  // "Check connection" is simulated by the page itself: a short check, then
  // the first message lands (the mockup's received state), or, previewing
  // the failure state, the first check fails.
  const check = async () => {
    const fail = pendingFail.connection && attempts.connection === 0;
    setAttempts((count) => ({ ...count, connection: count.connection + 1 }));
    setConnectionFailed(false);
    setChecking(true);
    await wait(ROUTE_CHECK_MS);
    setChecking(false);
    if (fail) {
      setConnectionFailed(true);
      return;
    }
    updateImproved({
      received: true,
      connected: true,
      receivedAt: Date.now(),
    });
  };

  const runDemo = () => {
    const fail = pendingFail.demo && attempts.demo === 0;
    setAttempts((count) => ({ ...count, demo: count.demo + 1 }));
    setDemoFailed(false);
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      if (fail) {
        setDemoFailed(true);
        return;
      }
      updateImproved({ caught: true, caughtAt: Date.now() });
    }, ROUTE_CHECK_MS);
  };

  return (
    <ImprovedColumn>
      <BackLink
        href={ONBOARDING_ROUTES.improvedConnect}
        label="Connection settings"
      />
      <ImprovedHeader action={<TryGateChatLink />} title="Check connection" />
      {/* Step 2's layout (owner 2026-10-13): the route stage on the left,
          the labelled groups on the right, the primary action at the foot
          of the right column. */}
      <div className="grid @4xl:grid-cols-[5fr_6fr] items-start gap-10">
        <aside
          className="relative @4xl:sticky @4xl:top-6 grid min-h-75 place-items-center rounded-md border border-border bg-muted p-4"
          data-motion-no-replay=""
          data-motion-root="route-stage"
        >
          {/* Step 2's left-to-right route run, reused (owner 2026-10-13):
              the figure is keyed on the check or demo attempt, so it plays
              on arrival and runs the check each time one starts; a fail
              turns it to error without a remount, and a pass or a caught
              demo remounts it to play the result (onboarding-motion.css,
              Setup route). */}
          <ImprovedRouteFigure
            centered
            improved={improved}
            key={`${client.id}:${improved.billing}:${model.id}:${routeRun}`}
            state={route}
            threat={running || improved.caught}
          />
        </aside>
        <div className="flex min-w-0 flex-col gap-6">
          <SetupGroup title="Send a test message">
            <Card>
              {/* The step's pass or fail line leads the card once it has
                  one (owner 2026-10-13); the details sit below it. */}
              <CardContent className="flex flex-col gap-4">
                {improved.received ? (
                  <>
                    <StatusRow tone="success">Message received</StatusRow>
                    {/* What Gate saw for the test message (PRD desktop
                        step 3): CreditStatRow's label and value voices,
                        the Messages page's labels. */}
                    <MessageStats
                      guardrail="allow"
                      model={testModel}
                      tokensIn={TEST_TOKENS_IN}
                      tokensOut={TEST_TOKENS_OUT}
                    />
                  </>
                ) : (
                  <>
                    {connectionFailed ? (
                      <StatusRow tone="error">
                        Gate didn’t receive the test message from {app}. Check
                        your connection settings, then try again.
                      </StatusRow>
                    ) : null}
                    <p className="type-copy-14 m-0 text-muted-foreground">
                      Send this from {app} to check the connection.
                    </p>
                    <div className="flex max-w-full items-center gap-3 rounded-sm border border-border bg-card py-2 pr-2 pl-4 text-left">
                      <span className="type-mono-14 wrap-anywhere min-w-0 flex-1 text-foreground">
                        {TEST_MESSAGE}
                      </span>
                      <CopyButton label="test message" value={TEST_MESSAGE} />
                    </div>
                    <Button
                      className="self-start"
                      disabled={checking}
                      onClick={() => void check()}
                      size="default"
                    >
                      {checking ? (
                        <Loader2
                          aria-hidden
                          className="animate-spin motion-reduce:animate-none"
                          data-icon="inline-start"
                        />
                      ) : null}
                      {checking
                        ? "Checking connection…"
                        : connectionFailed
                          ? "Try again"
                          : "Check connection"}
                      {checking ? null : (
                        <ArrowRight aria-hidden data-icon="inline-end" />
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </SetupGroup>

          {/* The demo follows the connection check (owner
              2026-10-13): moved here from the ready page, now required. */}
          {/* Dimmed and inert until the connection passed (owner 2026-10-13:
              hide branches, dim sequences): the whole route stays in view. */}
          <div
            aria-disabled={!improved.received || undefined}
            className={cn(!improved.received && "opacity-50")}
            inert={!improved.received}
          >
            <SetupGroup title="Run the protection demo">
              <Card>
                <CardContent className="flex flex-col gap-4">
                  {improved.caught ? (
                    <>
                      <StatusRow tone="success">
                        Prompt injection blocked.
                      </StatusRow>
                      {/* What Gate saw for the demo message, card 1's rows
                          (owner 2026-10-13); the message field leaves. */}
                      <MessageStats
                        guardrail="block"
                        model={testModel}
                        tokensIn={DEMO_TOKENS_IN}
                        tokensOut={DEMO_TOKENS_OUT}
                      />
                    </>
                  ) : null}
                  {demoFailed ? (
                    <StatusRow tone="error">
                      Gate didn’t get a result for that message. Send it again.
                    </StatusRow>
                  ) : null}
                  {/* Card 1's format (owner 2026-10-13): the message in a
                      bordered mono field with its copy button, so the user
                      can send it, then the action below. Both leave once
                      the demo passed, as card 1's do; Finish setup is the
                      one primary. */}
                  {improved.caught ? null : (
                    <div className="flex max-w-full items-center gap-3 rounded-sm border border-border bg-card py-2 pr-2 pl-4 text-left">
                      <span className="type-mono-14 wrap-anywhere min-w-0 flex-1 text-foreground">
                        {ATTACK_MESSAGE}
                      </span>
                      <CopyButton
                        label="protection demo message"
                        value={ATTACK_MESSAGE}
                      />
                    </div>
                  )}
                  {improved.caught ? null : (
                    <Button
                      className="self-start"
                      disabled={running}
                      onClick={runDemo}
                      size="default"
                    >
                      {running ? (
                        <Loader2
                          aria-hidden
                          className="animate-spin motion-reduce:animate-none"
                          data-icon="inline-start"
                        />
                      ) : null}
                      {running
                        ? "Checking message…"
                        : demoFailed
                          ? "Try again"
                          : "Send the message"}
                      {running ? null : (
                        <ArrowRight aria-hidden data-icon="inline-end" />
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </SetupGroup>
          </div>

          {/* Shown only once the demo passed (owner 2026-10-13). */}
          {improved.received && improved.caught ? (
            <Button
              className="self-start"
              onClick={() => {
                // Sets "Tasks" in the top-bar menu and unlocks the final page.
                updateImproved({ finished: true });
                navigate(ONBOARDING_ROUTES.improvedComplete);
              }}
              size="default"
            >
              Finish setup
              <ArrowRight aria-hidden data-icon="inline-end" />
            </Button>
          ) : null}
        </div>
      </div>
    </ImprovedColumn>
  );
}

/** What Gate saw for one step 3 message (PRD desktop step 3): the model,
 *  tokens in / out and the Security result, in CreditStatRow's label and
 *  value voices with the Messages page's labels and guardrail badge. */
function MessageStats({
  model,
  tokensIn,
  tokensOut,
  guardrail,
}: {
  model: ImprovedModel;
  tokensIn: number;
  tokensOut: number;
  guardrail: "allow" | "block";
}) {
  return (
    <dl className="m-0 flex flex-col gap-2">
      <CreditStatRow
        label="Model"
        value={
          <span className="inline-flex items-center gap-2">
            <VendorAvatar decorative vendor={model.vendor} />
            {model.label}
          </span>
        }
      />
      <CreditStatRow
        label="Tokens In/Out"
        mono
        value={
          <>
            {formatNumber(tokensIn)}
            <span className="text-muted-foreground">
              {" / "}
              {formatNumber(tokensOut)}
            </span>
          </>
        }
      />
      <CreditStatRow
        label="Security"
        value={
          <Badge variant={GUARDRAIL_BADGE[guardrail].variant}>
            {guardrail}
          </Badge>
        }
      />
    </dl>
  );
}

/** `/improved-complete-onboarding`: the Current flow's "You're protected
 *  and live" body (owner 2026-10-13), in the steps' centered column. The
 *  Gate Chat path keeps "Continue chatting" as its primary action. */
export function ImprovedComplete() {
  const navigate = useNavigate();
  const { improved, updateImproved } = useOnboarding();
  const chat = improved.connection === "gate-chat";
  const mobile = useIsMobileSetup();
  // Only Finish setup opens this page (owner 2026-10-13); arriving any
  // other way returns to the step still due. The Gate Chat path has no
  // Finish setup: its first message completes setup.
  if (
    chat
      ? !improved.received
      : !(improved.finished && improved.received && improved.caught)
  ) {
    return (
      <Navigate
        replace
        to={
          improved.pathChosen
            ? chat
              ? ONBOARDING_ROUTES.chat
              : improved.connected
                ? ONBOARDING_ROUTES.verify
                : ONBOARDING_ROUTES.improvedConnect
            : ONBOARDING_ROUTES.start
        }
      />
    );
  }

  return (
    <OnboardingChrome>
      <ImprovedColumn>
        <ProtectedAndLive
          action={
            <Button
              // Full width on a phone, like every phone-flow action.
              className={mobile ? "w-full" : "self-start"}
              onClick={() =>
                // Gate Chat opens in a new tab on desktop (owner 2026-10-13).
                chat && !mobile
                  ? openInNewTab(ONBOARDING_ROUTES.chat)
                  : navigate(
                      // The Overview after setup: the setup's own two
                      // messages, in this tab's state (owner 2026-10-13).
                      chat
                        ? ONBOARDING_ROUTES.chat
                        : ONBOARDING_ROUTES.setupOverview
                    )
              }
              size="default"
            >
              {chat ? "Continue chatting" : "Visit Overview"}
              {chat && !mobile ? (
                <span className="sr-only"> {NEW_TAB_CUE}</span>
              ) : null}
              {/* The new-tab icon only where it opens a new tab (owner
                  2026-10-13): desktop Gate Chat. */}
              {chat && !mobile ? (
                <ExternalLinkIcon
                  aria-hidden
                  data-icon="inline-end"
                  size={16}
                />
              ) : (
                <ArrowRight aria-hidden data-icon="inline-end" />
              )}
            </Button>
          }
          onVisit={(task) =>
            updateImproved((state) => ({
              tasks: { ...state.tasks, [task]: true },
            }))
          }
          tasks={improved.tasks}
        />
      </ImprovedColumn>
    </OnboardingChrome>
  );
}
