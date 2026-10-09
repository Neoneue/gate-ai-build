import type { ImprovedState } from "@/pages/onboarding/onboarding-state";

/* ─── Improved flow: data and pure helpers ──────────────────────────────── */

/** Client apps a Gate route can carry (the mockup's `_i`). */
export const IMPROVED_CLIENTS = [
  {
    id: "codex",
    label: "Codex",
    restart: true,
    icon: "/icons/providers/codex.svg",
  },
  {
    id: "claude-code",
    label: "Claude Code",
    restart: true,
    icon: "/icons/providers/claude-code.svg",
  },
  {
    id: "opencode",
    label: "OpenCode",
    restart: true,
    icon: "/icons/providers/opencode.svg",
  },
  {
    id: "hermes",
    label: "Hermes",
    restart: false,
    icon: "/icons/providers/hermes.svg",
  },
  {
    id: "openclaw",
    label: "OpenClaw",
    restart: false,
    icon: "/icons/providers/openclaw-color.svg",
  },
  {
    id: "openai-sdk",
    label: "OpenAI SDK",
    restart: false,
    icon: "/icons/providers/openai.svg",
  },
] as const;

/** The signed-in owner's email: where the setup link is sent. A placeholder
 *  identity (the mockup's own fixture), never a real person's address. */
export const OWNER_EMAIL = "alex@example.com";

/** The other account / workspace a mismatched link was opened in (mockup
 *  fixtures, verbatim). */
export const OTHER_SESSION = {
  email: "sam@example.com",
  workspace: "Sam’s team",
} as const;
export const LINK_WORKSPACE = "Alex’s workspace";
export const LINK_VALIDITY = "Links stay valid for 24 hours.";

/** Simulated network latency for sends and checks (mockup). */
export const SIMULATED_MS = 900;
export const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

/** The paid models offered with Gate credits (the mockup's list, verbatim). */
export const IMPROVED_MODELS = [
  {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    vendor: "deepseek",
  },
  { id: "openai/gpt-4.1", label: "GPT-4.1", vendor: "openai" },
  {
    id: "anthropic/claude-sonnet-4",
    label: "Claude Sonnet 4",
    vendor: "anthropic",
  },
] as const;

export const modelOf = (state: ImprovedState) =>
  IMPROVED_MODELS.find((model) => model.id === state.model) ??
  IMPROVED_MODELS[0];

export const clientOf = (state: ImprovedState) =>
  IMPROVED_CLIENTS.find((client) => client.id === state.client) ??
  IMPROVED_CLIENTS[0];

/** Display name of the app the route starts at. */
export const appNameOf = (state: ImprovedState) =>
  state.connection === "gate-chat" ? "Gate Chat" : clientOf(state).label;
