import type { VendorSlug } from "@/components/icons/vendor-meta";
import { MODEL_OPTIONS, modelById } from "@/data/models";
import type { ImprovedState } from "@/pages/onboarding/onboarding-state";

/* ─── Improved flow: data and pure helpers ──────────────────────────────── */

/** The app picker's sections, in display order (owner 2026-10-09): each
 *  app is listed under the provider that makes it. */
export const CLIENT_GROUPS = [
  { id: "anthropic", label: "Anthropic" },
  { id: "openai", label: "OpenAI" },
  { id: "other", label: "Other apps" },
] as const;

/** Client apps a Gate route can carry (the mockup's `_i`). */
export const IMPROVED_CLIENTS = [
  {
    id: "codex",
    group: "openai",
    label: "Codex",
    restart: true,
    icon: "/icons/providers/codex.svg",
  },
  {
    id: "claude-code",
    group: "anthropic",
    label: "Claude Code",
    restart: true,
    icon: "/icons/providers/claude-code.svg",
  },
  {
    id: "opencode",
    group: "other",
    label: "OpenCode",
    restart: true,
    icon: "/icons/providers/opencode.svg",
  },
  {
    id: "hermes",
    group: "other",
    label: "Hermes",
    restart: false,
    icon: "/icons/providers/hermes.svg",
  },
  {
    id: "openclaw",
    group: "other",
    label: "OpenClaw",
    restart: false,
    icon: "/icons/providers/openclaw-color.svg",
  },
  {
    id: "openai-sdk",
    group: "openai",
    label: "OpenAI SDK",
    restart: false,
    icon: "/icons/providers/openai.svg",
  },
] as const;

/** The signed-in owner's email: where the setup link is sent. A placeholder
 *  identity (the mockup's own fixture), never a real person's address. */
export const OWNER_EMAIL = "user@example.com";

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

/** The app whose model picker lists the whole Gate catalog. Claude Code
 *  speaks Anthropic Messages, which Gate translates to every upstream, so
 *  any catalog model routes (owner 2026-10-09, "Start with Claude first").
 *  Every other app keeps IMPROVED_MODELS for now. */
export const CATALOG_CLIENT = "claude-code";

/** The catalog as picker rows, in catalog order (curated rows first). */
export const CATALOG_MODELS: readonly ImprovedModel[] = MODEL_OPTIONS.map(
  (model) => ({ id: model.handle, label: model.label, vendor: model.vendor })
);

export type ImprovedModel = {
  id: string;
  label: string;
  vendor: VendorSlug;
};

/** The model the route uses. A catalog pick resolves only while the app is
 *  Claude Code; switching to another app shows its own list's first model
 *  without clearing the pick, so switching back restores it. */
export const modelOf = (state: ImprovedState): ImprovedModel => {
  const listed = IMPROVED_MODELS.find((model) => model.id === state.model);
  if (listed) {
    return listed;
  }
  const catalog =
    state.client === CATALOG_CLIENT ? modelById(state.model) : undefined;
  return catalog
    ? { id: catalog.id, label: catalog.name, vendor: catalog.vendor }
    : IMPROVED_MODELS[0];
};

export const clientOf = (state: ImprovedState) =>
  IMPROVED_CLIENTS.find((client) => client.id === state.client) ??
  IMPROVED_CLIENTS[0];

/** Display name of the app the route starts at. */
export const appNameOf = (state: ImprovedState) =>
  state.connection === "gate-chat" ? "Gate Chat" : clientOf(state).label;
