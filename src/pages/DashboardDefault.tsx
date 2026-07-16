import { Radio } from "@base-ui/react/radio";
import { BadgeCheck, Check, Coins, Download, Plus, XIcon } from "lucide-react";
import { type ComponentType, type ElementType, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  AnthropicIcon,
  GeminiIcon,
  GrokIcon,
  MetaIcon,
  OpenAIIcon,
} from "@/components/icons/model-providers";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CodePanel } from "@/components/ui/code-panel";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DownloadIcon } from "@/components/ui/download";
import { ExternalLinkIcon } from "@/components/ui/external-link";
import { PageTitle } from "@/components/ui/page-title";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { cn } from "@/lib/utils";
import { ChoiceCard } from "@/pages/onboarding-shared";
import { PAYG_TOOL_CAPTIONS, paygConfigSnippet } from "@/pages/payg-config";

const BYOK_GATEWAY_URL = "https://gateway.constellationgate.ai";

// BYOK — Claude Code ~/.claude/settings.json
const HERO_CLAUDE_CODE_BYOK = `{
  "env": {
    "ANTHROPIC_BASE_URL": "${BYOK_GATEWAY_URL}",
    "ANTHROPIC_CUSTOM_HEADERS": "X-Gate-Api-Key: sk-gw-…your Gate key…\\nX-Gate-Upstream-Url: https://api.anthropic.com"
  }
}`;

const HERO_CLAUDE_CODE_PAYG = paygConfigSnippet("claude-code");
const HERO_CODEX_PAYG = paygConfigSnippet("codex");
const HERO_OPENCLAW_PAYG = paygConfigSnippet("openclaw");
// BYOK — Codex ~/.codex/config.toml (subscription auth via credential helper)
const HERO_CODEX_BYOK = `model_provider = "gate"

[model_providers.gate]
name = "Constellation Gate"
base_url = "${BYOK_GATEWAY_URL}/codex"
wire_api = "responses"

[model_providers.gate.http_headers]
"X-Gate-Api-Key" = "sk-gw-…your Gate key…"
"X-Gate-Upstream-Url" = "https://chatgpt.com/backend-api"

[model_providers.gate.auth]
command = "/Users/you/.codex/gate-credential-helper.sh"

# Subscription auth — no API key.
# NOTE: Gate Connect would handle this for you automatically.
# Run \`codex login\` once, then create the helper
# that prints your ChatGPT OAuth bearer from ~/.codex/auth.json. Codex calls it on
# every request, so token refresh is automatic. Use an absolute path above (no ~):
#
#   cat > ~/.codex/gate-credential-helper.sh <<'EOF'
#   #!/bin/sh
#   set -eu
#   AUTH_FILE="$HOME/.codex/auth.json"
#   TOKEN=$(sed -n 's/.*"access_token"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' "$AUTH_FILE" | head -1)
#   [ -z "$TOKEN" ] && TOKEN=$(sed -n 's/.*"OPENAI_API_KEY"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' "$AUTH_FILE" | head -1)
#   printf '%s' "$TOKEN"
#   EOF
#   chmod 700 ~/.codex/gate-credential-helper.sh`;

// BYOK — OpenClaw openclaw.json + ~/.openclaw/.env
const HERO_OPENCLAW_BYOK = `{
  "models": {
    "providers": {
      "openrouter": {
        "baseUrl": "${BYOK_GATEWAY_URL}",
        "apiKey": "\${OPENROUTER_API_KEY}",
        "api": "openai-completions",
        "headers": {
          "X-Gate-Api-Key": "sk-gw-…your Gate key…",
          "X-Gate-Upstream-Url": "https://openrouter.ai/api/v1"
        },
        "models": [
          { "id": "openrouter/auto", "name": "openrouter/auto" },
          { "id": "kimi-k2.5", "name": "kimi-k2.5" }
        ]
      }
    }
  }
}

// In ~/.openclaw/.env:  OPENROUTER_API_KEY=sk-or-…your OpenRouter key…
// Validate with:  openclaw doctor`;

/** Caption shown to the right of the BYOK/PAYG selector strip. */
const HERO_MODE_CAPTIONS: Record<"byok" | "payg", string> = {
  byok: "Bring your own provider key — gateway adds security + audit.",
  payg: "Pay-as-you-go on the gateway. Single key, no provider account needed.",
};

/**
 * Hero code tab: an optional BYOK/PAYG selector strip, the scrolling snippet
 * panel, and a bottom-right Copy footer. Pass `byok` + `payg` for tabs that
 * have both billing-mode variants (renders the strip); pass a single
 * `snippet` for tabs that don't (no strip).
 */
function HeroCodeTab({
  snippet,
  byok,
  payg,
  paygOnly = false,
  byokOnly = false,
  hideStrip = false,
  caption,
  maxHeightClass = "max-h-[192px]",
  mode = "byok",
  onModeChange,
}: {
  snippet?: string;
  byok?: string;
  payg?: string;
  /** Force the PAYG snippet and drop the BYOK/PAYG selector (caption stays). */
  paygOnly?: boolean;
  /** Force the BYOK snippet and drop the BYOK/PAYG selector (caption stays). */
  byokOnly?: boolean;
  /** Drop the mode/caption strip entirely (only meaningful when locked). */
  hideStrip?: boolean;
  /** Overrides the mode caption with a fixed per-tab string. */
  caption?: string;
  /** Tailwind max-h class for the scrolling snippet panel. */
  maxHeightClass?: string;
  /** Billing mode, controlled by the parent so one card-level Copy button can
   *  read the active code and the toggle stays in sync across tabs. The Copy
   *  button itself is rendered once at the card level (ConnectTabs), not here. */
  mode?: "byok" | "payg";
  onModeChange?: (next: "byok" | "payg") => void;
}) {
  const hasModes = Boolean(byok && payg);
  const lockMode = paygOnly || byokOnly;
  const effectiveMode = paygOnly ? "payg" : byokOnly ? "byok" : mode;
  const code = hasModes ? (effectiveMode === "byok" ? byok! : payg!) : snippet!;
  return (
    <div className="flex h-full flex-col">
      {hasModes && !hideStrip && (
        <div
          className={`flex items-center gap-4 border-border border-b px-4 ${lockMode ? "h-10 justify-start" : "justify-between py-2"}`}
        >
          {!lockMode && (
            <div
              aria-label="Gateway billing mode"
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-sm border border-border bg-card px-1"
              role="radiogroup"
            >
              {(["byok", "payg"] as const).map((m) => (
                <button
                  aria-checked={mode === m}
                  className={`type-label-12 flex h-6 items-center rounded-xs px-2 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    mode === m
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-muted-foreground"
                  }`}
                  key={m}
                  onClick={() => onModeChange?.(m)}
                  role="radio"
                  type="button"
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <span className="type-copy-12 text-muted-foreground">
            {caption ?? HERO_MODE_CAPTIONS[effectiveMode]}
          </span>
        </div>
      )}
      <div className={`${maxHeightClass} overflow-y-auto`}>
        <CodePanel snippet={code} />
      </div>
    </div>
  );
}

/* ─── Download Gate Connect modal ─────────────────────────────────────────
 * Figma node 514:42. 548px modal, three stacked regions (header / body /
 * footer) each owning its own 24px x-padding. Platform cards = a radiogroup
 * of toggle cards; build rows = a Base UI RadioGroup. Selecting a platform
 * swaps the build matrix, the version/requirements line, and the button
 * label. OS auto-detection drives the initial platform + the "Detected" pill
 * (the pill never moves off the truly-detected OS, even when the user picks
 * a different card).
 * ──────────────────────────────────────────────────────────────────────── */

type PlatformId = "mac" | "windows" | "linux";

type BuildOption = {
  id: string;
  /** "Installer" label prefix. */
  kind: string;
  /** Architecture name, e.g. "x64", "Apple Silicon". */
  arch: string;
  /** Muted parenthetical detail, e.g. "(x86-64 / AMD64)". */
  detail: string;
  size: string;
};

type PlatformSpec = {
  id: PlatformId;
  label: string;
  /** Brand-colored 24px OS icon. */
  icon: string;
  /** App version line. */
  version: string;
  /** Per-platform OS requirement sentence. */
  requires: string;
  builds: BuildOption[];
  /** Default-selected build id on platform switch. */
  defaultBuild: string;
};

const GATE_CONNECT_VERSION = "v1.4.2";

const PLATFORMS: Record<PlatformId, PlatformSpec> = {
  windows: {
    id: "windows",
    label: "Windows",
    icon: "/icons/os/windows-color.svg",
    version: GATE_CONNECT_VERSION,
    requires: "Requires Windows 10 or later.",
    defaultBuild: "win-x64",
    builds: [
      {
        id: "win-x64",
        kind: "Installer",
        arch: "x64",
        detail: "(x86-64 / AMD64)",
        size: "46.1 MB",
      },
      {
        id: "win-arm64",
        kind: "Installer",
        arch: "ARM64",
        detail: "(aarch64)",
        size: "45.0 MB",
      },
    ],
  },
  mac: {
    id: "mac",
    label: "macOS",
    icon: "/icons/os/macos-color.svg",
    version: GATE_CONNECT_VERSION,
    requires: "Requires macOS 12 or later.",
    defaultBuild: "mac-arm",
    builds: [
      {
        id: "mac-arm",
        kind: "Installer",
        arch: "Apple Silicon",
        detail: "(arm64)",
        size: "44.8 MB",
      },
      {
        id: "mac-intel",
        kind: "Installer",
        arch: "Intel",
        detail: "(x86-64)",
        size: "46.3 MB",
      },
    ],
  },
  linux: {
    id: "linux",
    label: "Linux",
    icon: "/icons/os/linux-color.svg",
    version: GATE_CONNECT_VERSION,
    requires: "Requires a modern 64-bit Linux distribution.",
    defaultBuild: "linux-x64",
    builds: [
      {
        id: "linux-x64",
        kind: "Installer",
        arch: "x64",
        detail: "(.AppImage / x86-64)",
        size: "47.2 MB",
      },
      {
        id: "linux-arm64",
        kind: "Installer",
        arch: "ARM64",
        detail: "(aarch64)",
        size: "46.0 MB",
      },
    ],
  },
};

const PLATFORM_ORDER: PlatformId[] = ["mac", "windows", "linux"];

/** Best-effort OS detection. Prefers the modern userAgentData hint, falls
 *  back to navigator.platform / userAgent. Defaults to Windows when unknown. */
function detectPlatform(): PlatformId {
  if (typeof navigator === "undefined") {
    return "windows";
  }
  const uaData = (
    navigator as Navigator & {
      userAgentData?: { platform?: string };
    }
  ).userAgentData;
  const hint = (
    uaData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    ""
  ).toLowerCase();
  if (
    hint.includes("mac") ||
    hint.includes("iphone") ||
    hint.includes("ipad")
  ) {
    return "mac";
  }
  if (
    hint.includes("linux") ||
    hint.includes("android") ||
    hint.includes("x11")
  ) {
    return "linux";
  }
  if (hint.includes("win")) {
    return "windows";
  }
  return "windows";
}

export function DownloadGateConnectDialog({
  onDownload,
}: {
  onDownload?: () => void;
} = {}) {
  const detected = useMemo(() => detectPlatform(), []);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<PlatformId>(detected);
  const [buildId, setBuildId] = useState<string>(
    PLATFORMS[detected].defaultBuild
  );

  const spec = PLATFORMS[platform];

  function selectPlatform(next: PlatformId) {
    setPlatform(next);
    setBuildId(PLATFORMS[next].defaultBuild);
  }

  return (
    <Dialog
      // Outside-press must NOT dismiss (operator-tool requirement: scrim is
      // inert, only the X and Escape close). Every other reason — close-press,
      // escape-key, trigger-press — passes through.
      onOpenChange={(next, details) => {
        if (!next && details.reason === "outside-press") {
          return;
        }
        setOpen(next);
      }}
      open={open}
    >
      <DialogTrigger
        render={
          <Button size="lg">
            <DownloadIcon aria-hidden data-icon="inline-start" size={16} />{" "}
            Download Gate Connect
          </Button>
        }
      />
      <DialogContent
        // 548px modal; regions own their padding, so strip the primitive's
        // gap-4 / p-6. rounded-xl (16px, LOCKED) stays from the primitive.
        className="w-[548px] max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[548px]"
        showCloseButton={false}
      >
        {/* HEADER */}
        <div className="relative flex items-start border-border border-b px-6 pt-4 pb-4">
          <div className="flex min-w-0 flex-col gap-0 pr-8">
            <DialogTitle className="type-heading-18 m-0 text-foreground tracking-tight">
              Download Gate{" "}
              <span className="text-blue-700 dark:text-blue-400">Connect</span>
            </DialogTitle>
            <DialogDescription className="type-copy-14 m-0 text-pretty text-muted-foreground">
              The menu-bar app that connects your desktop agents to Gate.
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Close"
            render={
              <Button
                className="absolute top-4 right-4"
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <XIcon className="size-5" />
          </DialogClose>
        </div>

        {/* BODY */}
        <div className="flex flex-col gap-4 px-6 pt-5 pb-5">
          {/* Platform picker */}
          <div className="flex flex-col gap-3">
            <span className="type-label-14 text-foreground">
              Choose your platform
            </span>
            <RadioGroup
              aria-label="Choose your platform"
              className="flex gap-3"
              onValueChange={(v) => selectPlatform(v as PlatformId)}
              value={platform}
            >
              {PLATFORM_ORDER.map((id) => {
                const p = PLATFORMS[id];
                return (
                  <Radio.Root
                    className="group/platform relative flex h-[92px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card outline-none transition-[colors,box-shadow,scale] duration-150 ease-out will-change-transform hover:border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] data-checked:border-foreground data-checked:shadow-xs motion-reduce:active:scale-100"
                    key={id}
                    value={id}
                  >
                    {detected === id && (
                      <span className="absolute -top-2 left-1/2 inline-flex h-5 -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-surface-strong px-2 font-semibold text-[10px]/[16px] text-surface-strong-foreground tracking-wide">
                        Detected
                      </span>
                    )}
                    <Radio.Indicator
                      className="absolute top-2 right-2 inline-flex size-4 items-center justify-center rounded-full bg-surface-strong text-surface-strong-foreground"
                      keepMounted={false}
                    >
                      <Check aria-hidden className="size-3" strokeWidth={2.5} />
                    </Radio.Indicator>
                    <img alt="" aria-hidden className="size-6" src={p.icon} />
                    <span className="type-label-14 text-foreground">
                      {p.label}
                    </span>
                  </Radio.Root>
                );
              })}
            </RadioGroup>
          </div>

          {/* Build picker */}
          <div className="flex flex-col gap-3">
            <span className="type-label-14 text-foreground">
              Choose your build
            </span>
            <RadioGroup
              aria-label="Choose your build"
              className="gap-3"
              onValueChange={(v) => setBuildId(v as string)}
              value={buildId}
            >
              {spec.builds.map((b) => {
                const selected = buildId === b.id;
                return (
                  <label
                    className={`flex h-[52px] cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 transition-colors duration-150 ease-out ${
                      selected
                        ? "border-foreground"
                        : "border-border hover:border-input"
                    }`}
                    key={b.id}
                  >
                    <RadioGroupItem
                      className="size-5 [&_[data-slot=radio-group-indicator]]:size-5"
                      value={b.id}
                    />
                    <span className="type-label-14 text-foreground">
                      {b.kind}
                    </span>
                    <span className="type-label-14 text-foreground">
                      {b.arch}
                    </span>
                    <span className="type-copy-14 text-muted-foreground">
                      {b.detail}
                    </span>
                    <span className="type-copy-14 ml-auto whitespace-nowrap text-muted-foreground tabular-nums">
                      {b.size}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Version + requirement line — two texts, 8px gap (no separator), per Figma */}
          <p className="type-copy-12 m-0 flex items-center gap-2 text-muted-foreground">
            <span>{spec.version}</span>
            <span>{spec.requires}</span>
          </p>
        </div>

        {/* FOOTER */}
        <div className="border-border border-t px-6 py-6">
          <Button
            className="h-12 w-full"
            onClick={() => {
              onDownload?.();
              setOpen(false);
            }}
            size="lg"
          >
            <Download className="size-4" data-icon="inline-start" /> Download
            for {spec.label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** New-workspace onboarding hero — two routing outcomes only (no outer card).
 *  Page title + subtitle live in DashboardDefault. */
function GetStartedCard() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ChoiceCard
        body="Route the plans you already pay for through Gate. Manage your own keys and billing plans."
        cta="Route my traffic"
        ctaVariant="default"
        icon={BadgeCheck}
        onClick={() => navigate("/setup-connect-default")}
        supports={
          <>
            Works with{" "}
            <span className="inline-flex align-middle">
              <VendorAvatar decorative vendor="anthropic" />
            </span>{" "}
            <span className="font-medium text-foreground">Claude</span> and{" "}
            <span className="inline-flex align-middle">
              <VendorAvatar decorative vendor="openai" />
            </span>{" "}
            <span className="font-medium text-foreground">Codex</span>{" "}
            subscriptions, plus your own provider keys.
          </>
        }
        title="Keep my existing subscriptions"
        tone="blue"
      />
      <ChoiceCard
        body="No provider accounts needed. Add credits and call any model, billed through Gate."
        cta="Get started"
        ctaVariant="default"
        icon={Coins}
        onClick={() => navigate("/setup-manual-default?bill=payg")}
        supports={
          <>
            Choose from hundreds of models, including{" "}
            <span className="inline-flex align-middle">
              <VendorAvatar decorative vendor="anthropic" />
            </span>{" "}
            <span className="font-medium text-foreground">Claude</span>,{" "}
            <span className="inline-flex align-middle">
              <VendorAvatar decorative vendor="openai" />
            </span>{" "}
            <span className="font-medium text-foreground">GPT</span>,{" "}
            <span className="inline-flex align-middle">
              <VendorAvatar decorative vendor="google" />
            </span>{" "}
            <span className="font-medium text-foreground">Gemini</span>, and
            many more.
          </>
        }
        title="Run models pay-as-you-go"
        tone="success"
      />
    </div>
  );
}

export function HeroCard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:gap-0">
      {/* Connect card */}
      <Card
        className="flex flex-1 flex-col xl:rounded-r-none xl:border-r-0"
        density="flush"
      >
        <div className="flex-1">
          <ConnectTabs gateConnectOnly />
        </div>
        <WorksWithFooter
          asButtons
          items={MANUAL_SETUP_ITEMS}
          label="Manual setup"
          showMore={false}
        />
      </Card>

      {/* Get started card */}
      <Card className="flex-1 xl:rounded-l-none" density="flush">
        <div className="flex flex-1 flex-col gap-6 p-8 max-xl:p-6">
          <div className="flex flex-col gap-2">
            <h2 className="type-heading-24 m-0 text-foreground tracking-tight">
              Create your first API key
            </h2>
            <p className="type-copy-14 m-0 max-w-[432px] text-pretty text-muted-foreground">
              Your API key is what routes traffic through Gate, adding
              prompt-injection defense and a tamper-evident audit trail to every
              request. Use it with our Gate Connect app, or any AI coding tools
              you configure manually.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/api-keys")} size="lg">
              <Plus
                className="size-4 transition-transform duration-150 ease-out group-hover/button:scale-[1.11] motion-reduce:transition-none"
                data-icon="inline-start"
              />{" "}
              Create key
            </Button>
            <Button
              onClick={() =>
                window.open(
                  "https://docs.constellationgate.ai",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              size="lg"
              variant="outline"
            >
              Read API docs{" "}
              <ExternalLinkIcon aria-hidden data-icon="inline-end" size={16} />
            </Button>
          </div>
        </div>
        <WorksWithFooter />
      </Card>
    </div>
  );
}

/** A footer chip: either a component icon (`Icon`) or an image (`src`). */
type FooterItem = {
  name: string;
  hide?: string;
  Icon?: ComponentType<{ className?: string }>;
  src?: string;
  /** ConnectTabs tab id to deep-link on the API Keys page (button footers). */
  tab?: string;
};

/** Provider list for the left "Works with" footer. */
const WORKS_WITH_ITEMS: FooterItem[] = [
  { Icon: OpenAIIcon, name: "OpenAI" },
  { Icon: GrokIcon, name: "xAI" },
  { Icon: AnthropicIcon, name: "Anthropic" },
  { Icon: GeminiIcon, name: "Google", hide: "xl:max-[1320px]:hidden" },
  { Icon: MetaIcon, name: "Meta", hide: "xl:max-[1512px]:hidden" },
];

/** Agent/model list for the right "Manual setup" footer — matches the tabs.
 *  `tab` deep-links the matching ConnectTabs tab on /api-keys. (Gemini has no
 *  dedicated tab yet; it points at the openclaw tab, which holds the Google
 *  SDK snippet.) */
const MANUAL_SETUP_ITEMS: FooterItem[] = [
  { Icon: AnthropicIcon, name: "Claude", tab: "claude-code" },
  { Icon: OpenAIIcon, name: "Codex", tab: "codex" },
  { src: "/icons/providers/openclaw.svg", name: "OpenClaw", tab: "openclaw" },
];

/** "<label> <chips> [+ more]" footer bar, shared by both hero cards. When
 *  `asButtons`, each chip is a full-height ghost button with hard (0px) edges. */
function WorksWithFooter({
  label = "Works with",
  showMore = true,
  items = WORKS_WITH_ITEMS,
  asButtons = false,
}: {
  label?: string;
  showMore?: boolean;
  items?: FooterItem[];
  asButtons?: boolean;
} = {}) {
  const navigate = useNavigate();
  const chips = items.map(({ Icon, src, name, hide, tab }) => {
    const inner = (
      <>
        {Icon ? (
          <Icon className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <img alt="" aria-hidden className="size-4 shrink-0" src={src} />
        )}
        <span className="type-copy-14 whitespace-nowrap text-muted-foreground">
          {name}
        </span>
      </>
    );
    return asButtons ? (
      <button
        className={`flex h-12 shrink-0 items-center gap-2 rounded-none px-3 transition-colors duration-150 ease-out hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset ${hide ?? ""}`}
        key={name}
        onClick={() => navigate(`/api-keys${tab ? `?tab=${tab}` : ""}`)}
        type="button"
      >
        {inner}
      </button>
    ) : (
      <div
        className={`flex shrink-0 items-center gap-2 ${hide ?? ""}`}
        key={name}
      >
        {inner}
      </div>
    );
  });
  return (
    <div
      className={`flex h-12 items-center gap-4 border-border border-t ${asButtons ? "pl-8 max-xl:pl-6" : "px-8 max-xl:px-6"}`}
    >
      <span className="type-copy-14 shrink-0 whitespace-nowrap text-muted-foreground">
        {label}
      </span>
      {asButtons ? (
        <div className="flex h-12 items-center">{chips}</div>
      ) : (
        chips
      )}
      {showMore && (
        <span className="type-copy-14 shrink-0 whitespace-nowrap text-muted-foreground italic">
          + more
        </span>
      )}
    </div>
  );
}

/** Per-tab captions for the paygOnly strip (e.g. the Models page). */
const PAYG_TAB_CAPTIONS = PAYG_TOOL_CAPTIONS;

/** Default per-breakpoint max-widths for the Gate Connect blurb. */
const CONNECT_TEXT_MAXW =
  "max-w-[368px] min-[1080px]:max-[1280px]:max-w-[440px] xl:max-[1535px]:max-w-[416px] 2xl:max-[1919px]:max-w-[320px] 3xl:max-w-[416px]";

/** Default Gate Connect app-preview image placement — tuned for the Overview
 *  hero (right card nearly full-viewport). Overridable per instance via
 *  ConnectTabs' `imageClassName` so other usages (e.g. the API Keys card) can
 *  reposition without disturbing the hero's responsive settings. */
const CONNECT_IMAGE_CLASS =
  "pointer-events-none select-none absolute top-[calc(50%_+_4px)] right-0 -translate-y-1/2 translate-x-[clamp(0px,calc(400px_-_20.8333vw),80px)] min-[1025px]:max-[1280px]:translate-x-0 min-[768px]:max-[1024px]:translate-x-[clamp(0px,calc(256px_-_25vw),64px)] max-[767px]:translate-x-0 3xl:translate-x-[8px] w-[clamp(479.75px,calc(429.25px_+_3.28776vw),492.375px)] scale-[0.658125] max-[1280px]:scale-[0.62522] origin-right xl:max-[1535px]:hidden";

/**
 * The connect card's tab strip + panels (Gate Connect / Claude Code / Codex /
 * OpenClaw). Shared between the Overview hero and the API Keys "Using your
 * key" section so they never drift. Drop it inside any flush <Card>.
 *
 * `textMaxWidth` overrides the Gate Connect blurb's max-width set so a given
 * usage (e.g. the narrower API Keys section) can size it independently.
 */
export function ConnectTabs({
  textMaxWidth = CONNECT_TEXT_MAXW,
  imageClassName = CONNECT_IMAGE_CLASS,
  titleClassName = "type-heading-24 tracking-tight text-foreground m-0",
  titleAs: TitleTag = "h3",
  showGateConnect = true,
  paygOnly = false,
  byokOnly = false,
  hideStrip = false,
  gateConnectOnly = false,
  fillHeight = false,
  codeMaxHeight,
  floatingCopy = false,
  defaultTab,
}: {
  textMaxWidth?: string;
  imageClassName?: string;
  titleClassName?: string;
  titleAs?: ElementType;
  showGateConnect?: boolean;
  paygOnly?: boolean;
  byokOnly?: boolean;
  hideStrip?: boolean;
  gateConnectOnly?: boolean;
  fillHeight?: boolean;
  codeMaxHeight?: string;
  floatingCopy?: boolean;
  defaultTab?: string;
} = {}) {
  const [activeTab, setActiveTab] = useState(
    defaultTab ?? (showGateConnect ? "gate-connect" : "claude-code")
  );
  const [mode, setMode] = useState<"byok" | "payg">("byok");
  const effectiveMode = paygOnly ? "payg" : byokOnly ? "byok" : mode;
  // Per-tab code, so a single card-level Copy button (rendered once, floating)
  // reflects the active tab + mode without a separate button per tab.
  const TAB_CODE: Record<string, { byok: string; payg: string }> = {
    "claude-code": { byok: HERO_CLAUDE_CODE_BYOK, payg: HERO_CLAUDE_CODE_PAYG },
    codex: { byok: HERO_CODEX_BYOK, payg: HERO_CODEX_PAYG },
    openclaw: { byok: HERO_OPENCLAW_BYOK, payg: HERO_OPENCLAW_PAYG },
  };
  const activeCode = TAB_CODE[activeTab]?.[effectiveMode];
  return (
    <Tabs
      className={cn("flex flex-1 flex-col gap-0", floatingCopy && "relative")}
      onValueChange={setActiveTab}
      value={activeTab}
    >
      {!gateConnectOnly && (
        <div className="flex items-center border-border border-b px-4">
          <TabsList className="h-12 border-b-0 px-0" variant="line">
            {showGateConnect && (
              <TabsTrigger value="gate-connect">
                <img
                  alt=""
                  aria-hidden
                  className="h-4 w-auto"
                  src="/gate-ai-logo-mark.png"
                />
                Gate Connect
              </TabsTrigger>
            )}
            <TabsTrigger value="claude-code">
              <AnthropicIcon className="size-4" />
              Claude Code
            </TabsTrigger>
            <TabsTrigger value="codex">
              <OpenAIIcon className="size-4" />
              Codex
            </TabsTrigger>
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
        </div>
      )}
      {showGateConnect && (
        <TabsContent
          className={`mt-0 ${fillHeight ? "flex flex-1 flex-col" : ""}`}
          value="gate-connect"
        >
          <div
            className={`relative h-full overflow-hidden ${fillHeight ? "flex-1" : "min-h-[232px]"}`}
          >
            {/* Decorative app preview — pre-faded asset, anchored right.
              Scale/position tuned per instruction. */}
            <img
              alt=""
              aria-hidden
              className={imageClassName}
              src="/gateconnect-app-fade.png"
            />
            <div
              className={`relative z-10 flex flex-col gap-6 p-8 max-xl:p-6 ${fillHeight ? "h-full" : ""}`}
            >
              <div className="flex flex-col gap-2">
                <TitleTag className={titleClassName}>
                  1-Click setup with Gate Connect
                </TitleTag>
                <p
                  className={`type-copy-14 text-pretty text-muted-foreground ${textMaxWidth} m-0`}
                >
                  Gate Connect is a tiny desktop app living in your menu bar.
                  Install, flip a switch, and your AI coding tools route through
                  Gate automatically. No config files, no environment variables,
                  no terminal. Claude Code, Cowork, Codex, and more are
                  supported.
                </p>
              </div>
              <div className="flex">
                <DownloadGateConnectDialog />
              </div>
            </div>
          </div>
        </TabsContent>
      )}
      <TabsContent className="mt-0" value="claude-code">
        <HeroCodeTab
          byok={HERO_CLAUDE_CODE_BYOK}
          byokOnly={byokOnly}
          caption={paygOnly ? PAYG_TAB_CAPTIONS["claude-code"] : undefined}
          hideStrip={hideStrip}
          maxHeightClass={codeMaxHeight}
          mode={mode}
          onModeChange={setMode}
          payg={HERO_CLAUDE_CODE_PAYG}
          paygOnly={paygOnly}
        />
      </TabsContent>
      <TabsContent className="mt-0" value="codex">
        <HeroCodeTab
          byok={HERO_CODEX_BYOK}
          byokOnly={byokOnly}
          caption={paygOnly ? PAYG_TAB_CAPTIONS.codex : undefined}
          hideStrip={hideStrip}
          maxHeightClass={codeMaxHeight}
          mode={mode}
          onModeChange={setMode}
          payg={HERO_CODEX_PAYG}
          paygOnly={paygOnly}
        />
      </TabsContent>
      <TabsContent className="mt-0" value="openclaw">
        <HeroCodeTab
          byok={HERO_OPENCLAW_BYOK}
          byokOnly={byokOnly}
          caption={paygOnly ? PAYG_TAB_CAPTIONS.openclaw : undefined}
          hideStrip={hideStrip}
          maxHeightClass={codeMaxHeight}
          mode={mode}
          onModeChange={setMode}
          payg={HERO_OPENCLAW_PAYG}
          paygOnly={paygOnly}
        />
      </TabsContent>
      {/* Single card-level Copy button — rendered once, floating bottom-right,
          reads the active tab + mode code. Not re-mounted per tab. */}
      {floatingCopy && activeCode && (
        <div className="absolute right-4 bottom-4">
          <CopyButton
            className="shadow-sm"
            label="code snippet"
            mode="label"
            size="sm"
            text="Copy code"
            value={activeCode}
          />
        </div>
      )}
    </Tabs>
  );
}

export function DashboardDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="overview"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex w-full flex-col gap-6 xl:max-w-5xl">
        <div className="flex flex-col gap-2">
          <PageTitle>Choose how to use Gate</PageTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground">
            However you connect, every request flows through Gate with
            prompt-injection defense, a tamper-evident audit trail, and lighter
            token bills from built-in compression.
          </p>
        </div>
        <GetStartedCard />
      </div>
    </DashboardChrome>
  );
}
