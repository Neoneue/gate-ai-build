import { Card } from "@/components/ui/card";
import { CodePanel } from "@/components/ui/code-panel";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

/* ─── Client configs (Improved flow, Manual setup) ──────────────────────────
 * The six client configurations Manual setup shows, one per app. Manual
 * setup runs on Existing subscriptions only (owner 2026-10-13, PRD "Tool
 * before billing"), so these are the provider-billing (BYOK) forms; the
 * Gate-credits forms went with the billing choice. Copied verbatim from the
 * mockup bundle (docs/onboarding-mockup, `sw` and its snippet constants),
 * which matches the production dashboard's connect-tabs.tsx (gate repo,
 * checked 2026-10-13: every snippet and caption identical). Only the base
 * URL differs: the mockup points at staging; this uses the gateway URL the
 * app's own ConnectTabs snippets use.
 * ───────────────────────────────────────────────────────────────────────── */

const GATE_BASE_URL = "https://gateway.constellationgate.ai";

const BYOK_CLAUDE_CODE = `{
  "env": {
    "ANTHROPIC_BASE_URL": "${GATE_BASE_URL}",
    "ANTHROPIC_CUSTOM_HEADERS": "X-Gate-Api-Key: sk-gw-…your Gate key…\\nX-Gate-Upstream-Url: https://api.anthropic.com"
  }
}`;

const BYOK_CODEX = `model_provider = "gate"

[model_providers.gate]
name = "Constellation Gate"
base_url = "${GATE_BASE_URL}/codex"
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

const BYOK_OPENCODE = `{
  "provider": {
    "openrouter-gate": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OpenRouter through Gate",
      "options": {
        "baseURL": "${GATE_BASE_URL}/v1",
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

const BYOK_OPENCLAW = `{
  "models": {
    "providers": {
      "openrouter": {
        "baseUrl": "${GATE_BASE_URL}/v1",
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

const BYOK_HERMES = `model:
  provider: custom
  base_url: ${GATE_BASE_URL}/v1
  default: openrouter/auto
  api_mode: chat_completions
  api_key: sk-or-…your OpenRouter key…
  default_headers:
    X-Gate-Api-Key: sk-gw-…your Gate key…
    X-Gate-Upstream-Url: https://openrouter.ai/api`;

const BYOK_OPENAI_SDK = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${GATE_BASE_URL}/v1",
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

/** The caption line above each config (mockup `la`). */
const CLIENT_CAPTIONS: Record<string, string> = {
  "claude-code": "Anthropic-shape CLI. Settings at ~/.claude/settings.json",
  codex: "OpenAI Responses CLI. Config at ~/.codex/config.toml",
  opencode: "OpenAI-compatible CLI. Config at ~/.config/opencode/opencode.json",
  hermes: "OpenAI-compatible CLI. Config at ~/.hermes/config.yaml",
  openclaw: "Gate-native config. Add the gateway as a provider",
  "openai-sdk": "OpenAI SDK (JS/TS). Point baseURL at the gateway",
};

function configFor(client: string): string {
  switch (client) {
    case "codex":
      return BYOK_CODEX;
    case "opencode":
      return BYOK_OPENCODE;
    case "hermes":
      return BYOK_HERMES;
    case "openclaw":
      return BYOK_OPENCLAW;
    case "openai-sdk":
      return BYOK_OPENAI_SDK;
    default:
      return BYOK_CLAUDE_CODE;
  }
}

/** One app's config, built as the original Manual setup's code block
 *  (owner 2026-10-13, "use the old component here"): the production
 *  dashboard's ConnectTabs + HeroCodeTab (gate repo,
 *  apps/dashboard-web/src/components/connect-tabs.tsx, as rendered by
 *  pages/setup/SetupManual.tsx, also the docs/onboarding-mockup bundle's
 *  `sw` / `aa`). That component lives in the gate repo, not in this one, so
 *  its markup is copied here: the caption row (`description`), the code well
 *  at the original's 216px cap (`max-h-[216px]`, here `max-h-54`), and the
 *  card-level Copy footer below the well, behind a hairline. Its tab strip
 *  is left out: the App select above already names the client (one home
 *  per value). */
export function ClientConfig({
  client,
  disabled = false,
}: {
  client: string;
  /** No key chosen yet (owner 2026-10-13): the block stays in view at the
   *  system's disabled opacity (`opacity-50`, Button's `disabled:`
   *  recipe) and is inert, so Copy code cannot be reached or pressed. */
  disabled?: boolean;
}) {
  const code = configFor(client);
  return (
    <div
      aria-disabled={disabled || undefined}
      className={cn(disabled && "opacity-50")}
      data-client-config={client}
      inert={disabled}
    >
      <Card className="flex flex-col" density="flush">
        <div className="flex items-center border-border border-b px-4 py-3">
          <p className="type-copy-12 m-0 text-foreground">
            {CLIENT_CAPTIONS[client] ?? CLIENT_CAPTIONS["claude-code"]}
          </p>
        </div>
        {/* design-allow-clip: a code payload well. No focusable and no
            raised child inside; the Copy footer sits below it, outside the
            clip. */}
        <div className="max-h-54 overflow-y-auto">
          <CodePanel snippet={code} />
        </div>
        <div className="flex shrink-0 items-center justify-end border-border border-t px-4 py-2">
          <CopyButton
            label="code snippet"
            mode="label"
            size="sm"
            text="Copy code"
            value={code}
          />
        </div>
      </Card>
    </div>
  );
}
