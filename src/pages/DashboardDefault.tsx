import { Radio } from "@base-ui/react/radio";
import {
  ArrowLeftRight,
  BarChart2,
  Check,
  Download,
  MessageSquare,
  Plus,
  ShieldAlert,
  XIcon,
  Zap,
} from "lucide-react";
import { type ComponentType, type ElementType, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import {
  AnthropicIcon,
  GeminiIcon,
  GrokIcon,
  MetaIcon,
  OpenAIIcon,
} from "@/components/icons/model-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { KpiRail } from "@/components/ui/kpi-rail";
import { PageTitle } from "@/components/ui/page-title";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SectionTitle } from "@/components/ui/section-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { cn } from "@/lib/utils";

const GATEWAY_URL = "https://gateway-staging.constellationgate.ai";

// These tabs configure agent apps to route through the gateway — you point
// the tool at Gate, not the model provider. Claude Code + Codex read base-URL
// env vars; OpenClaw is Gate-native and takes a small plugin config.
const HERO_CLAUDE_CODE_BYOK = `import Anthropic from "@anthropic-ai/sdk";

// BYOK — your own Anthropic key. The gateway proxies to the upstream
// you name in X-Gate-Upstream-Url and adds security + audit.
const client = new Anthropic({
  baseURL: "${GATEWAY_URL}",
  apiKey: "sk-ant-…YOUR_ANTHROPIC_KEY",
  defaultHeaders: {
    "X-Gate-Api-Key": "sk-gw-…YOUR_GATEWAY_KEY",
    "X-Gate-Upstream-Url": "https://api.anthropic.com",
  },
});

const msg = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 256,
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(msg.content);`;

// PAYG terminal config — Claude Code routes through the gateway via the
// OpenRouter-compatible provider. Configs supplied by the gateway devs.
const HERO_CLAUDE_CODE_PAYG = `export ANTHROPIC_BASE_URL="${GATEWAY_URL}"
export ANTHROPIC_API_KEY="sk-gw-..."
export ANTHROPIC_CUSTOM_HEADERS='X-Gate-Provider: openai_compatible'

claude code "your prompt"`;

const HERO_CODEX_BYOK = `import OpenAI from "openai";

// BYOK — your own OpenAI key. The gateway proxies to the upstream
// you name in X-Gate-Upstream-Url and adds security + audit.
const client = new OpenAI({
  baseURL: "${GATEWAY_URL}/v1",
  apiKey: "sk-…YOUR_OPENAI_KEY",
  defaultHeaders: {
    "X-Gate-Api-Key": "sk-gw-…YOUR_GATEWAY_KEY",
    "X-Gate-Upstream-Url": "https://api.openai.com",
  },
});

const msg = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(msg.choices[0].message.content);`;

const HERO_CODEX_PAYG = `export OPENAI_API_KEY="sk-gw-..."

codex exec \\
  -c 'model_providers.gateway.base_url="${GATEWAY_URL}/v1"' \\
  -c 'model_providers.gateway.env_key="OPENAI_API_KEY"' \\
  -c 'model_providers.gateway.wire_api="responses"' \\
  -c 'model_providers.gateway.http_headers."X-Gate-Provider"="openai_compatible"' \\
  -c 'model_provider="gateway"' \\
  -m "anthropic/claude-sonnet-4-5" \\
  "your prompt"`;

const HERO_OPENCLAW_BYOK = `import { OpenClawGenAI } from "@openclaw/genai";

// BYOK — your own OpenClaw API key. The gateway proxies to the upstream
// you name in X-Gate-Upstream-Url and adds security + audit.
const client = new OpenClawGenAI({
  apiKey: "YOUR_OPENCLAW_API_KEY",
  apiVersion: "v1",
  httpOptions: {
    baseUrl: "${GATEWAY_URL}/openclaw",
    headers: {
      "X-Gate-Api-Key": "sk-gw-…YOUR_GATEWAY_KEY",
      "X-Gate-Upstream-Url": "https://generativelanguage.googleapis.com",
    },
  },
});

const res = await client.models.generateContent({
  model: "gemini-2.5-pro",
  contents: "Hello!",
});
console.log(res.text);`;

const HERO_OPENCLAW_PAYG = `{
  "models": {
    "providers": {
      "swarm-deck": {
        "baseUrl": "${GATEWAY_URL}",
        "apiKey": "sk-gw-...",
        "api": "openai-completions",
        "headers": { "X-Gate-Provider": "openai_compatible" },
        "models": [{ "id": "anthropic/claude-sonnet-4-5", "name": "anthropic/claude-sonnet-4-5" }]
      }
    }
  }
}`;

const KEYWORDS = new Set([
  "import",
  "export",
  "from",
  "const",
  "let",
  "var",
  "await",
  "new",
  "async",
  "function",
  "return",
  "class",
]);

type CodeToken = {
  text: string;
  type: "keyword" | "string" | "comment" | "property" | "plain";
};

function tokenizeLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    // Line comment — consumes to end of line. Strings are handled below, so a
    // `//` inside a URL ("https://…") is tokenized as a string and never
    // reaches here.
    if (ch === "/" && line[i + 1] === "/") {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === ch) {
          j++;
          break;
        }
        j++;
      }
      tokens.push({ text: line.slice(i, j), type: "string" });
      i = j;
    } else if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) {
        j++;
      }
      const word = line.slice(i, j);
      // Object/JSON key: an identifier immediately followed by `:` renders in
      // the property hue, matching the CodeBlock theme.
      const type = KEYWORDS.has(word)
        ? "keyword"
        : line[j] === ":"
          ? "property"
          : "plain";
      tokens.push({ text: word, type });
      i = j;
    } else {
      if (tokens.length > 0 && tokens[tokens.length - 1].type === "plain") {
        tokens[tokens.length - 1].text += ch;
      } else {
        tokens.push({ text: ch, type: "plain" });
      }
      i++;
    }
  }
  return tokens;
}

export function CodePanel({ snippet }: { snippet: string }) {
  const lines = snippet.split("\n");
  return (
    <div className="overflow-x-auto p-4">
      {lines.map((line, i) => (
        <div className="flex gap-4 leading-relaxed" key={i}>
          <span className="w-4 shrink-0 select-none text-right font-mono text-neutral-400 text-xs tabular-nums">
            {i + 1}
          </span>
          <span className="flex-1 whitespace-pre font-mono text-xs">
            {tokenizeLine(line).map((tok, j) => {
              // Match the CodeBlock (CodeCard) theme tokens so every code
              // surface shares one syntax palette: amber keywords, green
              // strings/values, blue keys, muted comments.
              const cls =
                tok.type === "keyword"
                  ? "text-[var(--color-syntax-keyword)]"
                  : tok.type === "string"
                    ? "text-[var(--color-syntax-terminal-blue)]"
                    : tok.type === "property"
                      ? "text-[var(--color-syntax-property)]"
                      : tok.type === "comment"
                        ? "text-neutral-500"
                        : "text-neutral-900";
              return (
                <span className={cls} key={j}>
                  {tok.text}
                </span>
              );
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

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
  const effectiveMode = paygOnly ? "payg" : mode;
  const code = hasModes ? (effectiveMode === "byok" ? byok! : payg!) : snippet!;
  return (
    <div className="flex h-full flex-col">
      {hasModes && (
        <div
          className={`flex items-center gap-4 border-border border-b px-4 ${paygOnly ? "h-10 justify-start" : "justify-between py-2"}`}
        >
          {!paygOnly && (
            <div
              aria-label="Gateway billing mode"
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-sm border border-border bg-card px-1"
              role="radiogroup"
            >
              {(["byok", "payg"] as const).map((m) => (
                <button
                  aria-checked={mode === m}
                  className={`flex h-6 items-center rounded-xs px-2 font-medium text-xs transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    mode === m
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-700"
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
          <span className="text-neutral-500 text-xs">
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
    requires: "Requires Windows 10 or later",
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
    requires: "Requires macOS 12 or later",
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
    requires: "Requires a modern 64-bit Linux distribution",
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

function DownloadGateConnectDialog() {
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
          <Button>
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
            <DialogTitle className="m-0 font-semibold text-lg text-neutral-900 tracking-tight">
              Download Gate <span className="text-blue-700">Connect</span>
            </DialogTitle>
            <DialogDescription className="m-0 text-pretty text-neutral-500 text-sm">
              The menu-bar app that connects your desktop agents to Gate
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
            <span className="font-medium text-neutral-900 text-sm">
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
                    className="group/platform relative flex h-[92px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card outline-none transition-[colors,box-shadow,scale] duration-150 ease-out will-change-transform hover:border-neutral-300 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] data-checked:border-neutral-900 data-checked:shadow-xs motion-reduce:active:scale-100"
                    key={id}
                    value={id}
                  >
                    {detected === id && (
                      <span className="absolute -top-2 left-1/2 inline-flex h-5 -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-neutral-900 px-2 font-semibold text-[10px]/[16px] text-white tracking-wide">
                        Detected
                      </span>
                    )}
                    <Radio.Indicator
                      className="absolute top-2 right-2 inline-flex size-4 items-center justify-center rounded-full bg-neutral-900 text-white"
                      keepMounted={false}
                    >
                      <Check aria-hidden className="size-3" strokeWidth={2.5} />
                    </Radio.Indicator>
                    <img alt="" aria-hidden className="size-6" src={p.icon} />
                    <span className="font-medium text-neutral-900 text-sm">
                      {p.label}
                    </span>
                  </Radio.Root>
                );
              })}
            </RadioGroup>
          </div>

          {/* Build picker */}
          <div className="flex flex-col gap-3">
            <span className="font-medium text-neutral-900 text-sm">
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
                        ? "border-neutral-900"
                        : "border-border hover:border-neutral-300"
                    }`}
                    key={b.id}
                  >
                    <RadioGroupItem
                      className="size-5 [&_[data-slot=radio-group-indicator]]:size-5"
                      value={b.id}
                    />
                    <span className="font-medium text-neutral-900 text-sm">
                      {b.kind}
                    </span>
                    <span className="font-medium text-neutral-900 text-sm">
                      {b.arch}
                    </span>
                    <span className="text-neutral-500 text-sm">{b.detail}</span>
                    <span className="ml-auto whitespace-nowrap text-neutral-500 text-sm tabular-nums">
                      {b.size}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Version + requirement line — two texts, 8px gap (no separator), per Figma */}
          <p className="m-0 flex items-center gap-2 text-neutral-500 text-xs">
            <span>{spec.version}</span>
            <span>{spec.requires}</span>
          </p>
        </div>

        {/* FOOTER */}
        <div className="border-border border-t px-6 py-6">
          <Button className="h-12 w-full" onClick={() => setOpen(false)}>
            <Download className="size-4" data-icon="inline-start" /> Download
            for {spec.label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OverviewHeroCard() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle as="h2">Get started</SectionTitle>
      <Card className="flex-1" density="flush">
        <div className="flex flex-1 flex-col gap-6 p-8 max-xl:p-6">
          <div className="flex max-w-1/2 flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 font-medium text-neutral-700 text-sm tabular-nums"
              >
                1
              </span>
              <h3 className="m-0 font-medium text-lg text-neutral-900">
                Create your first API key
              </h3>
            </div>
            <p className="m-0 text-pretty text-base text-neutral-500">
              Your API key is what routes traffic through Gate, adding
              prompt-injection defense and a tamper-evident audit trail to every
              request. Use it with our Gate Connect app, or any AI coding tools
              you configure manually.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/api-keys")}>
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
              variant="outline"
            >
              Read API docs{" "}
              <ExternalLinkIcon aria-hidden data-icon="inline-end" size={16} />
            </Button>
          </div>
        </div>
        <div className="border-border border-t p-8 max-xl:p-6">
          <FirstRequestInfo />
        </div>
        <WorksWithFooter />
      </Card>
    </section>
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
            <h2 className="m-0 font-medium text-2xl text-neutral-900 tracking-tight">
              Create your first API key
            </h2>
            <p className="m-0 max-w-[432px] text-pretty text-neutral-500 text-sm">
              Your API key is what routes traffic through Gate, adding
              prompt-injection defense and a tamper-evident audit trail to every
              request. Use it with our Gate Connect app, or any AI coding tools
              you configure manually.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/api-keys")}>
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
          <Icon className="size-4 shrink-0 text-neutral-600" />
        ) : (
          <img alt="" aria-hidden className="size-4 shrink-0" src={src} />
        )}
        <span className="whitespace-nowrap text-neutral-700 text-sm">
          {name}
        </span>
      </>
    );
    return asButtons ? (
      <button
        className={`flex h-12 shrink-0 items-center gap-2 rounded-none px-3 transition-colors duration-150 ease-out hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset ${hide ?? ""}`}
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
      <span className="shrink-0 whitespace-nowrap text-neutral-500 text-sm">
        {label}
      </span>
      {asButtons ? (
        <div className="flex h-12 items-center">{chips}</div>
      ) : (
        chips
      )}
      {showMore && (
        <span className="shrink-0 whitespace-nowrap text-neutral-500 text-sm italic">
          + more
        </span>
      )}
    </div>
  );
}

/** Per-tab captions for the paygOnly strip (e.g. the Models page). */
const PAYG_TAB_CAPTIONS: Record<"claude-code" | "codex" | "openclaw", string> =
  {
    "claude-code": "Anthropic-shape CLI. Point base URL + key at the gateway.",
    codex: "OpenAI Responses CLI. Inline-config the gateway as a provider.",
    openclaw: "Edit ~/.openclaw/openclaw.json — gateway as a provider.",
  };

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
  titleClassName = "text-2xl font-medium tracking-tight text-neutral-900 m-0",
  titleAs: TitleTag = "h3",
  showGateConnect = true,
  paygOnly = false,
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
  const effectiveMode = paygOnly ? "payg" : mode;
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
                  className={`text-pretty text-neutral-500 text-sm ${textMaxWidth} m-0`}
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
          caption={paygOnly ? PAYG_TAB_CAPTIONS["claude-code"] : undefined}
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
          caption={paygOnly ? PAYG_TAB_CAPTIONS.codex : undefined}
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
          caption={paygOnly ? PAYG_TAB_CAPTIONS.openclaw : undefined}
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

function OverviewUsageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Token usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div
            aria-hidden
            className="flex size-12 items-center justify-center rounded-md bg-muted"
          >
            <BarChart2 className="size-5 text-neutral-700" strokeWidth={1.75} />
          </div>
          <span className="text-neutral-500 text-sm">No usage data yet</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TokenSavingsStrip() {
  return (
    <KpiRail columns={3}>
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 bg-card p-6">
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-md bg-muted"
        >
          <BarChart2 className="size-5 text-neutral-700" strokeWidth={1.75} />
        </div>
        <span className="text-neutral-500 text-sm">No requests yet</span>
      </div>
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 bg-card p-6">
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-md bg-muted"
        >
          <Zap className="size-5 text-neutral-700" strokeWidth={1.75} />
        </div>
        <span className="text-neutral-500 text-sm">No token savings yet</span>
      </div>
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 bg-card p-6">
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-md bg-muted"
        >
          <ShieldAlert className="size-5 text-neutral-700" strokeWidth={1.75} />
        </div>
        <span className="text-neutral-500 text-sm">No threats yet</span>
      </div>
    </KpiRail>
  );
}

function LatestRequestsTable() {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-xs">
      <div className="flex shrink-0 items-center justify-between border-border border-b px-4 py-3">
        <h3 className="m-0 font-medium text-neutral-900 text-sm">
          Latest requests
        </h3>
        <Link
          className="-mx-2 -my-2 rounded-sm px-2 py-2 text-neutral-500 text-xs outline-none transition-colors duration-100 ease-out hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-ring/50"
          to="/requests"
        >
          View all →
        </Link>
      </div>
      <table aria-label="Latest requests" className="w-full text-sm">
        <tbody>
          <tr>
            <td colSpan={4}>
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div
                  aria-hidden
                  className="flex size-12 items-center justify-center rounded-md bg-muted"
                >
                  <ArrowLeftRight
                    className="size-5 text-neutral-700"
                    strokeWidth={1.75}
                  />
                </div>
                <span className="text-neutral-500 text-sm">
                  No requests yet
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RecentConversationsTable() {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-xs">
      <div className="flex shrink-0 items-center justify-between border-border border-b px-4 py-3">
        <h3 className="m-0 font-medium text-neutral-900 text-sm">
          Latest conversations
        </h3>
        <Link
          className="-mx-2 -my-2 rounded-sm px-2 py-2 text-neutral-500 text-xs outline-none transition-colors duration-100 ease-out hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-ring/50"
          to="/conversations"
        >
          View all →
        </Link>
      </div>
      <table aria-label="Latest conversations" className="w-full text-sm">
        <tbody>
          <tr>
            <td colSpan={4}>
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div
                  aria-hidden
                  className="flex size-12 items-center justify-center rounded-md bg-muted"
                >
                  <MessageSquare
                    className="size-5 text-neutral-700"
                    strokeWidth={1.75}
                  />
                </div>
                <span className="text-neutral-500 text-sm">
                  No conversations yet
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SecurityEventsTable() {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-xs">
      <div className="flex shrink-0 items-center justify-between border-border border-b px-4 py-3">
        <h3 className="m-0 font-medium text-neutral-900 text-sm">
          Latest security events
        </h3>
        <Link
          className="-mx-2 -my-2 rounded-sm px-2 py-2 text-neutral-500 text-xs outline-none transition-colors duration-100 ease-out hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-ring/50"
          to="/security"
        >
          View all →
        </Link>
      </div>
      <table aria-label="Latest security events" className="w-full text-sm">
        <tbody>
          <tr>
            <td colSpan={4}>
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div
                  aria-hidden
                  className="flex size-12 items-center justify-center rounded-md bg-muted"
                >
                  <ShieldAlert
                    className="size-5 text-neutral-700"
                    strokeWidth={1.75}
                  />
                </div>
                <span className="text-neutral-500 text-sm">
                  No security events yet
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const FIRST_REQUEST_TAB_IDS = [
  "gate-connect",
  "claude-code",
  "codex",
  "openclaw",
];

function FirstRequestInfo() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab =
    tabParam && FIRST_REQUEST_TAB_IDS.includes(tabParam) ? tabParam : undefined;
  const rightDefaultTab =
    defaultTab && defaultTab !== "gate-connect" ? defaultTab : undefined;
  return (
    <section className="@container/connect flex flex-col gap-6">
      <div className="flex max-w-1/2 flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 font-medium text-neutral-700 text-sm tabular-nums"
          >
            2
          </span>
          <h3 className="m-0 text-balance font-medium font-sans text-lg text-neutral-900">
            Making your first request
          </h3>
        </div>
        <p className="m-0 font-sans text-base text-neutral-500">
          There are two ways to start making requests using your API key. With{" "}
          <span className="font-medium">Gate Connect</span>, setup is automatic,
          so you can skip the code entirely. Want to configure it yourself? Use
          the code snippets to do it by hand.
        </p>
      </div>

      {/* Two cards: Gate Connect (1-click setup, no tab strip) on the left,
          the manual-setup code tabs (no Gate Connect tab) on the right.
          Side-by-side with a 24px gap; stacks full-width below lg. */}
      <div className="flex @min-[993px]/connect:flex-row flex-col gap-6">
        {/* Each card gets an h4 label above it (outside the card, so no
            height impact) so the two setup paths — Automatic vs Manual — read
            as a matched pair even though the right card is a code card with no
            internal title slot. */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <CardTitle as="h4">Automatic</CardTitle>
          <Card className="flex flex-1 flex-col" density="flush">
            <div className="flex flex-1 flex-col">
              <ConnectTabs
                fillHeight
                gateConnectOnly
                imageClassName="pointer-events-none select-none absolute top-1/2 right-0 -translate-y-1/2 @min-[1632px]/connect:translate-y-[calc(-50%_+_8px)] translate-x-[clamp(0px,calc(253px_-_34.375cqw),88px)] w-[491.144px] @min-[993px]/connect:translate-x-[calc(clamp(0px,calc(296.64px_-_18cqw),72px)_+_clamp(0px,calc(534.856px_-_42.857cqw),24px))] @min-[993px]/connect:w-[clamp(467.756px,calc(306.735px_+_12.9023cqw),517.301px)] scale-[0.6914426] origin-right @min-[992px]/connect:@max-[1192px]/connect:hidden"
                textMaxWidth="max-w-[350px] @min-[993px]/connect:max-w-[clamp(302px,calc(42px_+_20.8333cqw),382px)]"
                titleAs="h4"
                titleClassName="text-lg font-medium text-neutral-900 text-balance m-0"
              />
            </div>
          </Card>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <CardTitle as="h4">Manual</CardTitle>
          <Card className="flex flex-1 flex-col" density="flush">
            <div className="flex-1">
              <ConnectTabs
                codeMaxHeight="h-[216px]"
                defaultTab={rightDefaultTab}
                floatingCopy
                showGateConnect={false}
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
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
      <div className="flex max-w-1/2 flex-col gap-2">
        <PageTitle>Overview</PageTitle>
        <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-snug">
          Monitor request volume, token usage, spend, and security signals
          across your gateway.
        </p>
      </div>
      <div className="mb-2">
        <OverviewHeroCard />
      </div>{" "}
      <div className="flex flex-col gap-4">
        <SectionTitle as="h2">Activity This Week</SectionTitle>
        <TokenSavingsStrip />
        <OverviewUsageChart />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <LatestRequestsTable />
        <RecentConversationsTable />
        <SecurityEventsTable />
      </div>
    </DashboardChrome>
  );
}
