/* ─── PAYG agent-config snippets ────────────────────────────────────────────
 * Shared, component-free home for the pay-as-you-go per-tool config snippets so
 * the Overview hero, Manual setup, and the Models detail PaygToolConfigCard all
 * render the same code. Lives in its own module (not a page file) so importers
 * don't trip `react-refresh/only-export-components`.
 * ────────────────────────────────────────────────────────────────────────── */

const PAYG_GATEWAY_URL = "https://gateway.constellationgate.ai";
/** Fallback handle for the surfaces that render a snippet with NO model
 *  selected — the Overview PAYG hero and Manual setup. The Models detail card
 *  always passes the row's own handle, so this is never what that page shows.
 *
 *  It read `sakana/fugu-ultra` until 2026-08-03, a model that exists nowhere
 *  in the catalog or the traffic data. A copyable config snippet naming a
 *  model the gateway cannot route is a snippet that fails the moment anyone
 *  pastes it. This is the most-used model on the site by a wide margin —
 *  106 of 183 rows in `data/requests.ts` — and a real entry in `MODELS`. */
const PAYG_DEMO_MODEL = "anthropic/claude-opus-4-8";

/** Claude Code routes its cheap background calls (title generation, file
 *  summaries) through `ANTHROPIC_DEFAULT_HAIKU_MODEL`, so it must name a
 *  FAST, cheap model. It read `anthropic/claude-opus-4-8` until 2026-08-03 —
 *  a valid id, but the most expensive model in the catalog sitting in the one
 *  env var whose whole purpose is to avoid that. Unlike `ANTHROPIC_MODEL`
 *  this is deliberately NOT the selected model: pinning the Haiku slot to
 *  whichever row you happen to be viewing is what produced the bug. */
const PAYG_FAST_MODEL = "anthropic/claude-haiku-4-5";

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
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "${PAYG_FAST_MODEL}",
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
