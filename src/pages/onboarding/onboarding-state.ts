/* ─── Onboarding workspace state ────────────────────────────────────────────
 * The first-run Onboarding workspace walks a brand-new user through setup,
 * in one of two flows (Current or Improved, rebuilt from the onboarding
 * mockup in docs/onboarding-mockup/). Everything the flows remember lives
 * HERE, in React state owned by `OnboardingLayout`: never localStorage or
 * sessionStorage. A browser refresh therefore starts over at step 1, and so
 * does leaving the workspace (the layout unmounts). That is the demo
 * contract: the workspace is always presented end to end, from the start.
 * ───────────────────────────────────────────────────────────────────────── */

/** Owner direction 2026-10-08: only the Improved flow is presented. The
 *  Current flow's screens stay in the codebase (current-*.tsx) but the flow
 *  picker is hidden and the state starts, and stays, on "improved", so every
 *  Current route redirects to the first step (OnboardingLayout's guard). */
export type OnboardingFlow = "current" | "improved";

/** The four optional "Explore your Gateway" tasks on the Current complete
 *  page. */
export type ExploreTask = "policies" | "limits" | "savings" | "models";

export type CurrentState = {
  /** Step 1 "Choose your path" is done (a setup page was reached). */
  path: boolean;
  /** Step 2 "Connect" is done ("Listen for my message" was pressed). */
  connected: boolean;
  /** Step 3: the first message landed. */
  received: boolean;
  /** Attack demo: "Listen for my message" was pressed. */
  attackListening: boolean;
  /** Attack demo: Gate flagged the attack message. */
  caught: boolean;
  /** PAYG credit balance, whole USD. */
  balanceUsd: number;
  /** PAYG model handle (catalog id). */
  model: string;
  /** The PAYG model picker was used (unlocks the key step). */
  modelChosen: boolean;
  /** A key was created on the Manual or PAYG page. */
  keyCreated: boolean;
  tasks: Record<ExploreTask, boolean>;
};

export type ImprovedConnection = "gate-chat" | "gate-connect" | "manual";
export type ImprovedBilling = "existing" | "payg";
export type LinkScenario = "valid" | "expired" | "account" | "workspace";

/** What the desktop picks up from an emailed setup link. */
export type DesktopSetup = {
  connection: Exclude<ImprovedConnection, "gate-chat">;
  billing: ImprovedBilling;
  client: string;
  model: string;
  balanceUsd: number;
  keys: { id: string; name: string }[];
  selectedKeyId: string | null;
  downloaded: boolean;
  connected: boolean;
  /** The improved route the setup resumes on. */
  step: string;
};

export type ImprovedState = {
  connection: ImprovedConnection;
  billing: ImprovedBilling;
  /** App (client) id, see IMPROVED_CLIENTS. */
  client: string;
  /** Catalog id of the paid model used with Gate credits. */
  model: string;
  balanceUsd: number;
  keys: { id: string; name: string }[];
  selectedKeyId: string | null;
  downloaded: boolean;
  connected: boolean;
  received: boolean;
  caught: boolean;
  /** Step 1 "Choose how to use Gate" is done. */
  pathChosen: boolean;
  handoffSent: boolean;
  handoffSends: number;
  handoffAttempt: "sent" | "failed" | null;
  /** The setup the emailed link carries (null until a link was sent). */
  handoffSetup: DesktopSetup | null;
  /** The setup link the desktop opened, and how it resolved. */
  linkRedemption: {
    scenario: LinkScenario;
    resent: boolean;
    setup: DesktopSetup | null;
  } | null;
};

export const DEFAULT_PAYG_MODEL = "deepseek/deepseek-v4-flash";

export const initialCurrentState = (): CurrentState => ({
  path: false,
  connected: false,
  received: false,
  attackListening: false,
  caught: false,
  balanceUsd: 0,
  model: DEFAULT_PAYG_MODEL,
  modelChosen: false,
  keyCreated: false,
  tasks: { policies: false, limits: false, savings: false, models: false },
});

export const initialImprovedState = (): ImprovedState => ({
  connection: "gate-chat",
  billing: "payg",
  client: "codex",
  model: DEFAULT_PAYG_MODEL,
  balanceUsd: 0,
  keys: [],
  selectedKeyId: null,
  downloaded: false,
  connected: false,
  received: false,
  caught: false,
  pathChosen: false,
  handoffSent: false,
  handoffSends: 0,
  handoffAttempt: null,
  handoffSetup: null,
  linkRedemption: null,
});

/** The setup an emailed link carries (the mockup's `vm`): the current
 *  desktop-method choices, or, when the phone chose Gate Chat (or nothing),
 *  a Gate Connect setup that resumes on "Prepare your setup". */
export function snapshotDesktopSetup(state: ImprovedState): DesktopSetup {
  if (state.connection === "gate-chat") {
    return {
      connection: "gate-connect",
      billing: "existing",
      client: "codex",
      model: DEFAULT_PAYG_MODEL,
      balanceUsd: state.balanceUsd,
      keys: state.keys,
      selectedKeyId: null,
      downloaded: false,
      connected: false,
      // Owner direction 2026-10-08: the emailed link opens straight into
      // the desktop setup screen, Gate Connect preselected.
      step: "connect",
    };
  }
  return {
    connection: state.connection,
    billing: state.billing,
    client: state.client,
    model: state.model,
    balanceUsd: state.balanceUsd,
    keys: state.keys,
    selectedKeyId: state.selectedKeyId,
    downloaded: state.downloaded,
    connected: state.connected,
    step: state.connected
      ? "verify"
      : state.pathChosen
        ? "connect"
        : "overview",
  };
}
