import { useState } from "react";
/* Local stand-ins for the official repo's @gate/analytics types. */
export type SetupSnippetClient =
  | "claude-code"
  | "codex"
  | "opencode"
  | "hermes"
  | "openclaw"
  | "openai-sdk";

import { CodePanel } from "@/components/ui/code-panel";
import { CopyButton } from "@/components/ui/copy-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DownloadGateConnectDialog } from "@/pages/DashboardDefault";

/* The official repo's analytics control names; no-ops in this mockup. */
const controlSegment = (id: string) => id;
const childControl = (_control?: string) => (_name: string) => ({});

// Gateway base URL the snippets point at. Sourced from the dashboard's build
// env (matching Models.tsx) so staging and prod stay coherent — the examples a
// user copies always target the gateway for the environment they're looking at.
const GATEWAY_URL = "https://gateway.constellationgate.ai";

// Snippets that configure agent apps to route through the gateway. Each is the
// contents of the tool's config file (see TAB_DESCRIPTIONS for the path); BYOK proxies
// to an upstream you name, PAYG bills pay-as-you-go on the gateway key alone.
const HERO_CLAUDE_CODE_BYOK = `{
  "env": {
    "ANTHROPIC_BASE_URL": "${GATEWAY_URL}",
    "ANTHROPIC_CUSTOM_HEADERS": "X-Gate-Api-Key: sk-gw-…your Gate key…\\nX-Gate-Upstream-Url: https://api.anthropic.com"
  }
}`;

// PAYG model defaults per tool (used when no model has been chosen upstream,
// e.g. the API Keys page). The onboarding flow passes the picked model in.
const DEFAULT_PAYG_MODEL = "anthropic/claude-opus-4-8";
const DEFAULT_BACKGROUND_MODEL = "anthropic/claude-haiku-4-5";
const DEFAULT_PROVIDER_HINT = "bedrock";

const heroClaudeCodePayg = (
  model = DEFAULT_PAYG_MODEL,
  backgroundModel = DEFAULT_BACKGROUND_MODEL
) => `{
  "env": {
    "ANTHROPIC_BASE_URL": "${GATEWAY_URL}",
    "ANTHROPIC_API_KEY": "sk-gw-…your Gate key…",
    "ANTHROPIC_MODEL": "${model}",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "${backgroundModel}",
    "ANTHROPIC_CUSTOM_HEADERS": "X-Gate-Api-Key: sk-gw-…your Gate key…"
  }
}`;

const HERO_CODEX_BYOK = `model_provider = "gate"

[model_providers.gate]
name = "Constellation Gate"
base_url = "${GATEWAY_URL}/codex"
wire_api = "responses"

[model_providers.gate.http_headers]
"X-Gate-Api-Key" = "sk-gw-…your Gate key…"
"X-Gate-Upstream-Url" = "https://chatgpt.com/backend-api"

[model_providers.gate.auth]
command = "/Users/you/.codex/gate-credential-helper.sh"

# Subscription auth (no API key).
# NOTE: Gate Connect would handle this for you automatically.
# Run \`codex login\` once, then create the helper
# that prints your ChatGPT OAuth bearer from ~/.codex/auth.json. Codex calls it on
# every message, so token refresh is automatic. Use an absolute path above (no ~):
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

const heroCodexPayg = (model = DEFAULT_PAYG_MODEL) => `model_provider = "gate"
model = "${model}"

[model_providers.gate]
name = "Constellation Gate"
base_url = "${GATEWAY_URL}/v1"
wire_api = "responses"

[model_providers.gate.http_headers]
"X-Gate-Api-Key" = "sk-gw-…your Gate key…"`;

/* OpenCode reads `opencode.json`; each `provider` entry names the npm package
 * that speaks the wire, the connection under `options`, and the models it
 * offers. Both snippets below are the two configs published in
 * `docs/guides/opencode.md` — connect-tabs.snippets.test.ts holds them to it. */
const HERO_OPENCODE_BYOK = `{
  "provider": {
    "openrouter-gate": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OpenRouter through Gate",
      "options": {
        "baseURL": "${GATEWAY_URL}/v1",
        "apiKey": "sk-or-…your OpenRouter key…",
        "headers": {
          "X-Gate-Api-Key": "sk-gw-…your Gate key…",
          "X-Gate-Upstream-Url": "https://openrouter.ai/api"
        }
      },
      "models": {
        "openrouter/auto": { "name": "openrouter/auto" }
      }
    }
  }
}`;

const heroOpencodePayg = (model = DEFAULT_PAYG_MODEL) => `{
  "provider": {
    "gate": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Constellation Gate",
      "options": {
        "baseURL": "${GATEWAY_URL}/v1",
        "apiKey": "sk-gw-…your Gate key…"
      },
      "models": {
        "${model}": { "name": "${model}" }
      }
    }
  }
}`;

const HERO_OPENCLAW_BYOK = `{
  "models": {
    "providers": {
      "openrouter": {
        "baseUrl": "${GATEWAY_URL}/v1",
        "apiKey": "\${OPENROUTER_API_KEY}",
        "api": "openai-completions",
        "headers": {
          "X-Gate-Api-Key": "sk-gw-…your Gate key…",
          "X-Gate-Upstream-Url": "https://openrouter.ai/api"
        },
        "models": [
          { "id": "openrouter/auto", "name": "openrouter/auto" }
        ]
      }
    }
  }
}

// In ~/.openclaw/.env:  OPENROUTER_API_KEY=sk-or-…your OpenRouter key…
// Validate with:  openclaw doctor`;

const heroOpenclawPayg = (model = DEFAULT_PAYG_MODEL) => `{
  "models": {
    "providers": {
      "gate": {
        "baseUrl": "${GATEWAY_URL}/v1",
        "apiKey": "\${GATE_API_KEY}",
        "api": "openai-completions",
        "models": [
          { "id": "${model}", "name": "${model}" }
        ]
      }
    }
  }
}

// In ~/.openclaw/.env:  GATE_API_KEY=sk-gw-…your Gate key…
// List any Gate-catalog models you want under "models" above (id = provider/model).
// Validate with:  openclaw doctor`;

const HERO_HERMES_BYOK = `model:
  provider: custom
  base_url: ${GATEWAY_URL}/v1
  default: openrouter/auto
  api_mode: chat_completions
  api_key: sk-or-…your OpenRouter key…
  default_headers:
    X-Gate-Api-Key: sk-gw-…your Gate key…
    X-Gate-Upstream-Url: https://openrouter.ai/api`;

const heroHermesPayg = (model = DEFAULT_PAYG_MODEL) => `model:
  provider: custom
  base_url: ${GATEWAY_URL}/v1
  default: ${model}
  api_mode: chat_completions
  api_key: sk-gw-…your Gate key…`;

const HERO_OPENAI_SDK_BYOK = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${GATEWAY_URL}/v1",
  apiKey: process.env.OPENAI_API_KEY, // your OpenAI key
  defaultHeaders: {
    "X-Gate-Api-Key": process.env.GATE_API_KEY, // your Gate key: sk-gw-…
    "X-Gate-Upstream-Url": "https://api.openai.com",
  },
});

const res = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello" }],
});

console.log(res.choices[0].message.content);`;

const openaiSdkProviderHeaders = (providerHint: string | null) =>
  providerHint === null
    ? ""
    : `
  defaultHeaders: {
    "X-Gate-Provider": "${providerHint}",
  },`;

const heroOpenaiSdkPayg = (
  model = DEFAULT_PAYG_MODEL,
  providerHint: string | null = DEFAULT_PROVIDER_HINT
) => `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${GATEWAY_URL}/v1",
  apiKey: process.env.GATE_API_KEY, // your Gate key: sk-gw-…${openaiSdkProviderHeaders(providerHint)}
});

const res = await client.chat.completions.create({
  model: "${model}",
  messages: [{ role: "user", content: "Hello" }],
});

console.log(res.choices[0].message.content);`;

/** Caption shown to the right of the BYOK/PAYG selector strip. */
const HERO_MODE_CAPTIONS: Record<"byok" | "payg", string> = {
  byok: "Bring your own provider key. Gateway adds security + audit.",
  payg: "Pay-as-you-go on the gateway. Single key, no provider account needed.",
};

/**
 * Hero code tab: optional BYOK/PAYG selector strip + scrolling snippet panel.
 * Pass `byok` + `payg` for dual billing-mode tabs, or a single `snippet`.
 */
function HeroCodeTab({
  snippet,
  byok,
  payg,
  paygOnly = false,
  byokOnly = false,
  hideStrip = false,
  caption,
  description,
  maxHeightClass = "max-h-[192px]",
  mode = "byok",
  onModeChange,
  control,
}: {
  snippet?: string;
  byok?: string;
  payg?: string;
  /** Force the PAYG snippet and drop the BYOK/PAYG selector (caption stays). */
  paygOnly?: boolean;
  /** Force the BYOK snippet and drop the selector (mirrors `paygOnly`). */
  byokOnly?: boolean;
  /** Suppress the whole mode/caption strip entirely. */
  hideStrip?: boolean;
  /** Overrides the mode caption with a fixed per-tab string. */
  caption?: string;
  /** Full-width caption row under the tab strip naming the client + config file. */
  description?: string;
  /** Tailwind max-h class for the scrolling snippet panel. */
  maxHeightClass?: string;
  /** Billing mode, parent-controlled so the card-level Copy button can read
   *  the active code and the toggle stays in sync across tabs. */
  mode?: "byok" | "payg";
  onModeChange?: (next: "byok" | "payg") => void;
  /** AG-958 name prefix of the owning ConnectTabs; the mode radios are
   *  `<control>.mode.byok` / `.payg`. */
  control?: string;
}) {
  const hasModes = Boolean(byok && payg);
  const lockMode = paygOnly || byokOnly;
  const effectiveMode = paygOnly ? "payg" : byokOnly ? "byok" : mode;
  const code = hasModes ? (effectiveMode === "byok" ? byok! : payg!) : snippet!;
  return (
    <div className="flex h-full flex-col">
      {description && (
        <div className="flex items-center border-border border-b px-4 py-3">
          <p className="type-copy-12 m-0 text-foreground">{description}</p>
        </div>
      )}
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
                  key={m}
                  onClick={() => onModeChange?.(m)}
                  role="radio"
                  type="button"
                  {...childControl(control)(`mode.${m}`)}
                  className={`type-label-12 flex h-6 items-center rounded-xs px-2 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    mode === m
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
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
      {/* design-allow-clip: a code payload well (verbatim from the official
          repo); no focusable child inside, Copy sits outside it. */}
      <div className={`${maxHeightClass} overflow-y-auto`}>
        <CodePanel snippet={code} />
      </div>
    </div>
  );
}

/** Per-provider caption shown as a full-width row directly under the tab strip.
 *  Names the client's API shape and where its config lives, so the user knows
 *  what they're pasting and where before they read the snippet. */
const TAB_DESCRIPTIONS: Record<SetupSnippetClient, string> = {
  "claude-code": "Anthropic-shape CLI. Settings at ~/.claude/settings.json",
  codex: "OpenAI Responses CLI. Config at ~/.codex/config.toml",
  opencode: "OpenAI-compatible CLI. Config at ~/.config/opencode/opencode.json",
  hermes: "OpenAI-compatible CLI. Config at ~/.hermes/config.yaml",
  openclaw: "Gate-native config. Add the gateway as a provider",
  "openai-sdk": "OpenAI SDK (JS/TS). Point baseURL at the gateway",
};

/* ─── Gate Connect hero geometry ─────────────────────────────────────────────
 * Both ladders below were hand-tuned against VIEWPORT widths with the nav rail
 * expanded and no Gatekeeper panel, i.e. content ≈ viewport − 264 (rail) − 48
 * (gutters) = viewport − 312. Each stop is that arithmetic applied to the
 * original value, so the hero lands where it was tuned to land at every width
 * it was tuned at, and the BREAKPOINT ladders now also collapse when the
 * docked panel takes its 368px — which the viewport form could not do.
 *
 *   1080 → 768    1280 → 968    1535 → 1223    1919 → 1607
 *   xl  (1280) → 968      2xl (1536) → 1224     3xl (1920) → 1608
 *
 * KNOWN RESIDUAL: the image ladder's `clamp(… vw …)` translate/width terms
 * still key on the viewport (a `vw` term cannot name a container), so those
 * two continuous values do NOT shrink when the dock opens — bounded impact
 * (see CONNECT_IMAGE_CLASS: out of flow, non-interactive, clipped; worst case
 * a crop), but it is exactly what the visual check below must look at.
 *
 * VISUAL CHECK REQUIRED on Overview at 1280 / 1440 / 1920 with the panel open
 * and closed: this is pixel-tuned illustration placement, and arithmetic is not
 * the same thing as looking at it.
 * ────────────────────────────────────────────────────────────────────────── */

/** Default per-breakpoint max-widths for the Gate Connect blurb. */
const CONNECT_TEXT_MAXW =
  "max-w-[368px] @min-[768px]/content:@max-[968px]/content:max-w-[440px] @min-[968px]/content:@max-[1223px]/content:max-w-[416px] @min-[1224px]/content:@max-[1607px]/content:max-w-[320px] @min-[1608px]/content:max-w-[416px]";

/** Default app-preview image placement (tuned for the Overview hero);
 *  override per instance via `imageClassName`.
 *
 *  Out of flow, `pointer-events-none` and clipped by the card, so the worst a
 *  mis-tuned stop can do here is crop the preview — it can never displace or
 *  intercept anything in the card's actual content. */
const CONNECT_IMAGE_CLASS =
  "pointer-events-none select-none absolute top-[calc(50%_+_4px)] right-0 -translate-y-1/2 translate-x-[clamp(0px,calc(400px_-_20.8333vw),80px)] @min-[713px]/content:@max-[968px]/content:translate-x-0 @min-[456px]/content:@max-[712px]/content:translate-x-[clamp(0px,calc(256px_-_25vw),64px)] @max-[455px]/content:translate-x-0 @min-[1608px]/content:translate-x-[8px] w-[clamp(479.75px,calc(429.25px_+_3.28776vw),492.375px)] scale-[0.658125] @max-[968px]/content:scale-[0.62522] origin-right @min-[968px]/content:@max-[1223px]/content:hidden";

/**
 * The connect card's tab strip + panels: the Gate Connect hero plus one tab per
 * key of `TAB_DESCRIPTIONS`. Shared between the Overview hero and the API Keys
 * "Using your key" section so they never drift.
 */
export function ConnectTabs({
  textMaxWidth = CONNECT_TEXT_MAXW,
  imageClassName = CONNECT_IMAGE_CLASS,
  titleClassName = "type-heading-24 tracking-tight text-foreground m-0",
  showGateConnect = true,
  paygOnly = false,
  byokOnly = false,
  hideStrip = false,
  gateConnectOnly = false,
  fillHeight = false,
  codeMaxHeight,
  floatingCopy = false,
  defaultTab,
  paygModel,
  providerHint = DEFAULT_PROVIDER_HINT,
  backgroundModel,
  onTabChange,
  hideTabs = false,
  control,
}: {
  textMaxWidth?: string;
  imageClassName?: string;
  titleClassName?: string;
  showGateConnect?: boolean;
  paygOnly?: boolean;
  /** Force the BYOK snippet and drop the BYOK/PAYG selector (mirrors `paygOnly`). */
  byokOnly?: boolean;
  /** Suppress the whole mode/caption strip — used when the billing mode is
   *  already chosen upstream (e.g. the Manual setup subpage). */
  hideStrip?: boolean;
  gateConnectOnly?: boolean;
  fillHeight?: boolean;
  codeMaxHeight?: string;
  floatingCopy?: boolean;
  defaultTab?: string;
  /** Gateway model id to interpolate into the PAYG snippets (onboarding model
   *  picker). Falls back to each tool's default when unset. */
  paygModel?: string;
  providerHint?: string | null;
  backgroundModel?: string;
  /** Called after the card-level Copy button (`floatingCopy`) successfully
   *  copied the active tab's snippet, with WHICH client's snippet it was. The
   *  snippet text is deliberately not passed: callers use this for telemetry. */
  /** Onboarding: told the tab id on each switch (the Manual setup uses the
   *  tab as its app choice). Replaces the official analytics callback. */
  onTabChange?: (tab: string) => void;
  /** Onboarding: no tab strip, only `defaultTab`'s snippet (owner
   *  2026-10-14: Manual picks its app in a "Select an app" dropdown above;
   *  the caller keys this on the app so a new pick remounts it). */
  hideTabs?: boolean;
  /** AG-958 analytics name PREFIX, chosen by the caller (`api_keys.snippets`):
   *  tabs are `<control>.tab.<client>`, the copy button `<control>.copy`, the
   *  mode radios `<control>.mode.<mode>`, and the Gate Connect tab's download
   *  dialog `<control>.download.*`. */
  control?: string;
} = {}) {
  const named = childControl(control);
  const tab = (id: string) => named(`tab.${controlSegment(id)}`);
  const [activeTab, setActiveTab] = useState(
    defaultTab ?? (showGateConnect ? "gate-connect" : "claude-code")
  );
  const [mode, setMode] = useState<"byok" | "payg">("byok");
  const effectiveMode = paygOnly ? "payg" : byokOnly ? "byok" : mode;
  // PAYG snippets carry the chosen model (or each tool's default when unset).
  const claudeCodePayg = heroClaudeCodePayg(paygModel, backgroundModel);
  const codexPayg = heroCodexPayg(paygModel);
  const opencodePayg = heroOpencodePayg(paygModel);
  const hermesPayg = heroHermesPayg(paygModel);
  const openclawPayg = heroOpenclawPayg(paygModel);
  const openaiSdkPayg = heroOpenaiSdkPayg(paygModel, providerHint);
  // Per-tab code so the single card-level Copy button reflects the active tab + mode.
  const TAB_CODE: Record<SetupSnippetClient, { byok: string; payg: string }> = {
    "claude-code": { byok: HERO_CLAUDE_CODE_BYOK, payg: claudeCodePayg },
    codex: { byok: HERO_CODEX_BYOK, payg: codexPayg },
    opencode: { byok: HERO_OPENCODE_BYOK, payg: opencodePayg },
    hermes: { byok: HERO_HERMES_BYOK, payg: hermesPayg },
    openclaw: { byok: HERO_OPENCLAW_BYOK, payg: openclawPayg },
    "openai-sdk": { byok: HERO_OPENAI_SDK_BYOK, payg: openaiSdkPayg },
  };
  // `activeTab` is also "gate-connect", which has no snippet.
  const activeClient = Object.hasOwn(TAB_CODE, activeTab)
    ? (activeTab as SetupSnippetClient)
    : null;
  const activeCode = activeClient
    ? TAB_CODE[activeClient][effectiveMode]
    : undefined;
  return (
    <Tabs
      className="flex flex-1 flex-col gap-0"
      onValueChange={(next) => {
        setActiveTab(String(next));
        onTabChange?.(String(next));
      }}
      value={activeTab}
    >
      {!(gateConnectOnly || hideTabs) && (
        <div className="flex items-center overflow-x-auto border-border border-b px-4 [scrollbar-width:none]">
          {/* Onboarding: six tabs overflow the setup column, so the strip
              scrolls sideways (px-4 keeps the focus ring inside). */}
          <TabsList className="h-12 border-b-0 px-0" variant="line">
            {showGateConnect && (
              <TabsTrigger value="gate-connect" {...tab("gate-connect")}>
                <img
                  alt=""
                  aria-hidden
                  className="h-4 w-auto"
                  src="/gate-ai-logo-mark.png"
                />
                Gate Connect
              </TabsTrigger>
            )}
            <TabsTrigger value="claude-code" {...tab("claude-code")}>
              <img
                alt=""
                aria-hidden
                className="size-5"
                src="/icons/providers/claude-code.svg"
              />
              Claude Code
            </TabsTrigger>
            <TabsTrigger value="codex" {...tab("codex")}>
              <img
                alt=""
                aria-hidden
                className="size-5"
                src="/icons/providers/codex.svg"
              />
              Codex
            </TabsTrigger>
            <TabsTrigger value="opencode" {...tab("opencode")}>
              <img
                alt=""
                aria-hidden
                className="size-5 dark:invert"
                src="/icons/providers/opencode.svg"
              />
              OpenCode
            </TabsTrigger>
            <TabsTrigger value="hermes" {...tab("hermes")}>
              <img
                alt=""
                aria-hidden
                className="size-5 dark:invert"
                src="/icons/providers/hermes.svg"
              />
              Hermes
            </TabsTrigger>
            <TabsTrigger value="openclaw" {...tab("openclaw")}>
              <img
                alt=""
                aria-hidden
                className="size-5"
                src="/icons/providers/openclaw-color.svg"
              />
              OpenClaw
            </TabsTrigger>
            <TabsTrigger value="openai-sdk" {...tab("openai-sdk")}>
              <img
                alt=""
                aria-hidden
                className="size-5 dark:invert"
                src="/models/openai.svg"
              />
              OpenAI SDK
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
            <img
              alt=""
              aria-hidden
              className={imageClassName}
              src="/gateconnect-app-fade.png"
            />
            <div
              className={`relative z-10 flex flex-col gap-6 @max-[968px]/content:p-6 p-8 ${fillHeight ? "h-full" : ""}`}
            >
              <div className="flex flex-col gap-2">
                <h3 className={titleClassName}>
                  1-Click setup with Gate Connect
                </h3>
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
          control={control}
          description={TAB_DESCRIPTIONS["claude-code"]}
          hideStrip={hideStrip}
          maxHeightClass={codeMaxHeight}
          mode={mode}
          onModeChange={setMode}
          payg={claudeCodePayg}
          paygOnly={paygOnly}
        />
      </TabsContent>
      <TabsContent className="mt-0" value="codex">
        <HeroCodeTab
          byok={HERO_CODEX_BYOK}
          byokOnly={byokOnly}
          control={control}
          description={TAB_DESCRIPTIONS.codex}
          hideStrip={hideStrip}
          maxHeightClass={codeMaxHeight}
          mode={mode}
          onModeChange={setMode}
          payg={codexPayg}
          paygOnly={paygOnly}
        />
      </TabsContent>
      <TabsContent className="mt-0" value="opencode">
        <HeroCodeTab
          byok={HERO_OPENCODE_BYOK}
          byokOnly={byokOnly}
          control={control}
          description={TAB_DESCRIPTIONS.opencode}
          hideStrip={hideStrip}
          maxHeightClass={codeMaxHeight}
          mode={mode}
          onModeChange={setMode}
          payg={opencodePayg}
          paygOnly={paygOnly}
        />
      </TabsContent>
      <TabsContent className="mt-0" value="hermes">
        <HeroCodeTab
          byok={HERO_HERMES_BYOK}
          byokOnly={byokOnly}
          control={control}
          description={TAB_DESCRIPTIONS.hermes}
          hideStrip={hideStrip}
          maxHeightClass={codeMaxHeight}
          mode={mode}
          onModeChange={setMode}
          payg={hermesPayg}
          paygOnly={paygOnly}
        />
      </TabsContent>
      <TabsContent className="mt-0" value="openclaw">
        <HeroCodeTab
          byok={HERO_OPENCLAW_BYOK}
          byokOnly={byokOnly}
          control={control}
          description={TAB_DESCRIPTIONS.openclaw}
          hideStrip={hideStrip}
          maxHeightClass={codeMaxHeight}
          mode={mode}
          onModeChange={setMode}
          payg={openclawPayg}
          paygOnly={paygOnly}
        />
      </TabsContent>
      <TabsContent className="mt-0" value="openai-sdk">
        <HeroCodeTab
          byok={HERO_OPENAI_SDK_BYOK}
          byokOnly={byokOnly}
          control={control}
          description={TAB_DESCRIPTIONS["openai-sdk"]}
          hideStrip={hideStrip}
          maxHeightClass={codeMaxHeight}
          mode={mode}
          onModeChange={setMode}
          payg={openaiSdkPayg}
          paygOnly={paygOnly}
        />
      </TabsContent>
      {/* Card-level Copy footer, rendered once below the active tab's code
          well (not re-mounted per tab), separated by the same hairline the
          detail-modal code wells use. */}
      {floatingCopy && activeCode && (
        <div className="flex shrink-0 items-center justify-end border-border border-t px-4 py-2">
          <CopyButton
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
