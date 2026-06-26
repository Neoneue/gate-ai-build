/* ─── PAYG agent-config snippets ────────────────────────────────────────────
 * Shared, component-free home for the pay-as-you-go per-tool config snippets so
 * the Overview hero, Manual setup, and the Models detail PaygToolConfigCard all
 * render the same code. Lives in its own module (not a page file) so importers
 * don't trip `react-refresh/only-export-components`.
 * ────────────────────────────────────────────────────────────────────────── */

const PAYG_GATEWAY_URL = "https://gateway.constellationgate.ai";
const PAYG_DEMO_MODEL = "sakana/fugu-ultra";

export type PaygToolId = "claude-code" | "codex" | "hermes" | "openclaw";

export const PAYG_TOOL_CAPTIONS: Record<PaygToolId, string> = {
  "claude-code": "Anthropic-shape CLI. Settings at ~/.claude/settings.json.",
  codex: "OpenAI Responses CLI. Config at ~/.codex/config.toml.",
  hermes: "OpenAI-compatible CLI. Config at ~/.hermes/config.yaml.",
  openclaw: "Gate-native config — add the gateway as a provider.",
};

/** PAYG per-tool config snippet. `handle` is the gateway model id (OpenClaw,
 *  Claude model env, Hermes default). Shared with PaygToolConfigCard. */
export function paygConfigSnippet(
  tool: PaygToolId,
  handle: string = PAYG_DEMO_MODEL
): string {
  switch (tool) {
    case "claude-code":
      return `// ~/.claude/settings.json
{
  "env": {
    "ANTHROPIC_BASE_URL": "${PAYG_GATEWAY_URL}",
    "ANTHROPIC_API_KEY": "sk-gw-...",
    "ANTHROPIC_MODEL": "${handle}",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "anthropic/claude-opus-4-8",
    "ANTHROPIC_CUSTOM_HEADERS": "X-Gate-Api-Key: sk-gw-..."
  }
}`;
    case "codex":
      return `# ~/.codex/config.toml
model_provider = "gate"

[model_providers.gate]
name = "Constellation Gate"
base_url = "${PAYG_GATEWAY_URL}/v1"
wire_api = "responses"

[model_providers.gate.http_headers]
"X-Gate-Api-Key" = "sk-gw-..."`;
    case "hermes":
      return `# ~/.hermes/config.yaml
model:
  provider: custom
  base_url: ${PAYG_GATEWAY_URL}/v1
  default: ${handle}
  api_mode: chat_completions
  api_key: sk-gw-...`;
    case "openclaw":
      return `// ~/.openclaw/openclaw.json
{
  "models": {
    "providers": {
      "gate": {
        "baseUrl": "${PAYG_GATEWAY_URL}/v1",
        "apiKey": "\${GATE_API_KEY}",
        "api": "openai-completions",
        "models": [{ "id": "${handle}", "name": "${handle}" }]
      }
    }
  }
}`;
  }
}
