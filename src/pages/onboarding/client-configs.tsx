import { CodePanel } from "@/components/ui/code-panel";
import { CopyButton } from "@/components/ui/copy-button";

/* ─── Client configs (Improved flow, Manual setup) ──────────────────────────
 * The six client configurations the onboarding mockup shows, one per app,
 * each in a provider-billing (BYOK) and a Gate-credits (PAYG) form. Copied
 * verbatim from the mockup bundle (docs/onboarding-mockup, `sw` and its
 * snippet constants) into the onboarding folder, so DashboardDefault's
 * ConnectTabs (three clients) is untouched. Only the base URL differs: the
 * mockup points at staging; this uses the gateway URL the app's own
 * ConnectTabs snippets use.
 * ───────────────────────────────────────────────────────────────────────── */

const GATE_BASE_URL = "https://gateway.constellationgate.ai";

const BYOK_CLAUDE_CODE = `{
  "env": {
    "ANTHROPIC_BASE_URL": "${GATE_BASE_URL}",
    "ANTHROPIC_CUSTOM_HEADERS": "X-Gate-Api-Key: sk-gw-…your Gate key…\\nX-Gate-Upstream-Url: https://api.anthropic.com"
  }
}`;

const DEFAULT_PAYG_SNIPPET_MODEL = "anthropic/claude-opus-4-8";

const DEFAULT_HAIKU_MODEL = "anthropic/claude-haiku-4-5";

const DEFAULT_PROVIDER_HINT = "bedrock";

const paygClaudeCode = (
  e: string = DEFAULT_PAYG_SNIPPET_MODEL,
  t: string = DEFAULT_HAIKU_MODEL
) => `{
  "env": {
    "ANTHROPIC_BASE_URL": "${GATE_BASE_URL}",
    "ANTHROPIC_API_KEY": "sk-gw-…your Gate key…",
    "ANTHROPIC_MODEL": "${e}",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "${t}",
    "ANTHROPIC_CUSTOM_HEADERS": "X-Gate-Api-Key: sk-gw-…your Gate key…"
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

const paygCodex = (
  e: string = DEFAULT_PAYG_SNIPPET_MODEL
) => `model_provider = "gate"
model = "${e}"

[model_providers.gate]
name = "Constellation Gate"
base_url = "${GATE_BASE_URL}/v1"
wire_api = "responses"

[model_providers.gate.http_headers]
"X-Gate-Api-Key" = "sk-gw-…your Gate key…"`;

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

const paygOpenCode = (e: string = DEFAULT_PAYG_SNIPPET_MODEL) => `{
  "provider": {
    "gate": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Constellation Gate",
      "options": {
        "baseURL": "${GATE_BASE_URL}/v1",
        "apiKey": "sk-gw-…your Gate key…"
      },
      "models": {
        "${e}": { "name": "${e}" }
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

const paygOpenClaw = (e: string = DEFAULT_PAYG_SNIPPET_MODEL) => `{
  "models": {
    "providers": {
      "gate": {
        "baseUrl": "${GATE_BASE_URL}/v1",
        "apiKey": "\${GATE_API_KEY}",
        "api": "openai-completions",
        "models": [
          { "id": "${e}", "name": "${e}" }
        ]
      }
    }
  }
}

// In ~/.openclaw/.env:  GATE_API_KEY=sk-gw-…your Gate key…
// List any Gate-catalog models you want under "models" above (id = provider/model).
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

const paygHermes = (e: string = DEFAULT_PAYG_SNIPPET_MODEL) => `model:
  provider: custom
  base_url: ${GATE_BASE_URL}/v1
  default: ${e}
  api_mode: chat_completions
  api_key: sk-gw-…your Gate key…`;

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

const providerHeader = (e: string | null) =>
  e === null
    ? ""
    : `
  defaultHeaders: {
    "X-Gate-Provider": "${e}",
  },`;

const paygOpenAiSdk = (
  e: string = DEFAULT_PAYG_SNIPPET_MODEL,
  t: string | null = DEFAULT_PROVIDER_HINT
) => `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${GATE_BASE_URL}/v1",
  apiKey: process.env.GATE_API_KEY, // your Gate key: sk-gw-…${providerHeader(t)}
});

const res = await client.chat.completions.create({
  model: "${e}",
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

function configFor(client: string, payg: boolean, model: string): string {
  switch (client) {
    case "codex":
      return payg ? paygCodex(model) : BYOK_CODEX;
    case "opencode":
      return payg ? paygOpenCode(model) : BYOK_OPENCODE;
    case "hermes":
      return payg ? paygHermes(model) : BYOK_HERMES;
    case "openclaw":
      return payg ? paygOpenClaw(model) : BYOK_OPENCLAW;
    case "openai-sdk":
      return payg ? paygOpenAiSdk(model) : BYOK_OPENAI_SDK;
    default:
      return payg ? paygClaudeCode(model) : BYOK_CLAUDE_CODE;
  }
}

/** One app's config: the caption strip (both billing choices), the code and
 *  a floating copy control. The mockup hides the client tab strip here, the
 *  App select above already names the client. */
export function ClientConfig({
  client,
  payg,
  model,
}: {
  client: string;
  payg: boolean;
  model: string;
}) {
  const code = configFor(client, payg, model);
  return (
    <div className="relative flex flex-col" data-client-config={client}>
      <div className="flex h-10 items-center border-border border-b px-4">
        <span className="type-copy-12 text-muted-foreground">
          {CLIENT_CAPTIONS[client] ?? CLIENT_CAPTIONS["claude-code"]}
        </span>
      </div>
      {/* design-allow-clip: a code payload well. No focusable and no raised
          child inside. */}
      <div className="max-h-65 overflow-y-auto">
        <CodePanel snippet={code} />
      </div>
      <div className="absolute right-4 bottom-4">
        <CopyButton
          className="shadow-sm"
          label="code snippet"
          mode="label"
          size="sm"
          text="Copy code"
          value={code}
        />
      </div>
    </div>
  );
}
