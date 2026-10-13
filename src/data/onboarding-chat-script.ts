/* ─── SCRIPTED onboarding Gate Chat responder — NO BACKEND, NO NETWORK ──────
 * The Mobile A demo (signup -> Gate Chat) answers from this script so the
 * first message can be shown end to end. Mirrors `ask-ai-script.ts`: the
 * reply is picked from what was asked and streamed in word chunks.
 *
 * Owner direction 2026-10-11: the first quick action is also the phrase a
 * demoer types, so either path gets the same reply. Copy drafted by the
 * copywriter from the PRD "Onboarding by device" and the doc-sourced
 * Ask AI script; owner-approved 2026-10-11.
 * ────────────────────────────────────────────────────────────────────────── */

/** SCRIPTED. The Mobile A landing's quick actions (the desktop onboarding
 *  chat shows the shared CHAT_STARTER_PROMPTS); the first is the typed
 *  phrase. The third, owner wording 2026-10-12, is answered with the
 *  computer offer and its email button (`isSetupLinkRequest`). */
export const ONBOARDING_STARTER_PROMPTS = [
  "What is Gate AI?",
  "What will Gate protect for me?",
  // Copywriter pick, owner-approved 2026-10-12 (was "Email setup link").
  "How do I use Gate on my computer?",
] as const;

/** Mobile A refused-send state (owner 2026-10-12): a paid model is picked on
 *  the free plan. Typing stays on; send and the quick actions are disabled
 *  until a free model is picked. Copywriter, owner-approved. */
/** The composer placeholder in that state (no period, like "Message Gate Chat"). */
export const PAID_MODEL_REFUSAL = "Pick a free model to send a message";
/** The helper line under the composer in that state, in place of the free line. */
export const PAID_MODEL_HELPER = "Paid models need credits to use.";

const WHAT_IS_GATE_REPLY =
  "Gate runs your AI messages through security scanning, keeps an audit trail, and tracks what they cost. You can also route the AI apps you already use, like Claude Code, through Gate.";

const PROTECT_REPLY =
  "Gate scans every message for security issues, keeps a record of it, and tracks what it costs.";

const CLAUDE_CODE_REPLY =
  "On a computer, you sign in through the Gate Connect app, and coding tools like Claude Code, Codex and OpenCode run through Gate with no code changes. You don't paste an API key.";

/** SCRIPTED. Anything the script does not cover; no product claims. */
const FALLBACK_REPLY =
  "This is a short demo with scripted answers. Tap one of the suggestions to see how Gate works.";

/** SCRIPTED. The bubble right after the first reply: where the message is
 *  logged (PRD phone step 3). Owner direction 2026-10-12. */
export const LOGGED_NOTE =
  "Check your Activity and Messages pages to see your message logged.";

/** SCRIPTED. The bubble after the logged note (PRD phone step 4). */
export const COMPUTER_PROMPT = {
  // PRD phone step 4, verbatim (owner 2026-10-12).
  line: "Use Gate with your coding tools on a computer",
  button: "Email me the setup link",
  // Owner wording 2026-10-12: the button while the mock send waits, and
  // after the first send.
  sending: "Sending email",
  resend: "Re-send email setup link",
  toast: "Setup link sent. Check your email on your computer.",
} as const;

/** Lower case, punctuation to spaces, and the split spellings a demoer types
 *  folded together ("set up" -> "setup", "e-mail" -> "email"), so the
 *  matchers below compare words, not strings (Postel). */
const normalise = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^\da-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bset up\b/g, "setup")
    .replace(/\be mail\b/g, "email");

const wordsOf = (input: string): ReadonlySet<string> =>
  new Set(normalise(input).split(" "));

const hasAny = (words: ReadonlySet<string>, list: readonly string[]) =>
  list.some((word) => words.has(word));

/** A computer, however it is named ("on my desktop", "on my laptop"). */
const COMPUTER_WORDS = [
  "computer",
  "computers",
  "desktop",
  "desktops",
  "laptop",
  "laptops",
] as const;

/** Loose intent match for quick action 3, "How do I use Gate on my
 *  computer?" (owner 2026-10-12): "use" with a computer word ("how do I use
 *  Gate on my desktop"), but never a Claude question, which keeps the Claude
 *  Code reply; or the setup link itself: "email" with "setup" or "link",
 *  "setup" with "link", or a send of the link ("send setup link", "send me
 *  the link", the sent chip's "Re-send email setup link"), typed or tapped.
 *  Its reply is the computer offer with the email button. */
export function isSetupLinkRequest(input: string): boolean {
  const words = wordsOf(input);
  return (
    (words.has("use") &&
      hasAny(words, COMPUTER_WORDS) &&
      !words.has("claude")) ||
    (words.has("email") && hasAny(words, ["setup", "link"])) ||
    (words.has("link") && hasAny(words, ["setup", "send"]))
  );
}

/** "What will Gate protect for me?": protecting, safety and security,
 *  however it is asked ("is Gate safe", "keep me safe", "what does Gate
 *  protect"). */
const PROTECT_WORDS = [
  "protect",
  "protects",
  "protected",
  "protecting",
  "protection",
  "safe",
  "safer",
  "safety",
  "secure",
  "security",
] as const;

/** "What is Gate AI?": Gate with a what, about or explain question ("what's
 *  Gate", "tell me about Gate", "how does Gate work"). */
const WHAT_IS_WORDS = ["what", "whats", "about", "explain"] as const;

/** Loose intent match, not a string compare: what the chip says, or anything
 *  close to it, gets the chip's reply (owner 2026-10-12). Checked most
 *  specific first, since every prompt names Gate: setup link, Claude Code,
 *  protect, then what Gate is; anything else gets the fallback. */
export function selectOnboardingReply(input: string): string {
  if (isSetupLinkRequest(input)) {
    return COMPUTER_PROMPT.line;
  }
  const words = wordsOf(input);
  if (words.has("claude")) {
    return CLAUDE_CODE_REPLY;
  }
  if (hasAny(words, PROTECT_WORDS)) {
    return PROTECT_REPLY;
  }
  if (
    words.has("gate") &&
    (hasAny(words, WHAT_IS_WORDS) ||
      (words.has("how") && words.has("work")) ||
      words.size <= 2)
  ) {
    return WHAT_IS_GATE_REPLY;
  }
  return FALLBACK_REPLY;
}

/** MOCK token count for the reply's usage row: about four characters per
 *  token, the common rule of thumb. The scripted model is free, so the cost
 *  it feeds (`costOf`) is $0.00. Owner direction 2026-10-12. */
export const estimateTokens = (text: string): number =>
  Math.max(1, Math.ceil(text.length / 4));

/* ─── Timing (SCRIPTED, Ask AI's values) ───────────────────────────────── */

export const ONBOARDING_TIMING = {
  /** The mock setup-link email's send, before the toast (owner 2026-10-12). */
  emailSend: 2000,
  /** A phone quick action whose question was answered keeps its check this
   *  long before it leaves the row (owner 2026-10-12). */
  quickActionAnsweredHold: 2000,
  /** The quick action's exit after the hold, then it is removed: its fade
   *  and settle run this long (onboarding-chat-landing.tsx, animator
   *  2026-10-12; 150ms, design.md Motion's default control transition). */
  quickActionExit: 150,
  /** How long the reply card shows "preparing a reply" before text. */
  thinking: 1500,
  wordsPerSecond: 20,
  wordsPerChunk: 3,
  jitter: 0.45,
} as const;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

function chunkOnWordBoundaries(text: string, wordsPerChunk: number): string[] {
  const tokens = text.match(/\S+\s*/g) ?? [];
  const chunks: string[] = [];
  for (let i = 0; i < tokens.length; i += wordsPerChunk) {
    chunks.push(tokens.slice(i, i + wordsPerChunk).join(""));
  }
  return chunks;
}

/** Waits the thinking beat, then yields the reply in word chunks. Reduced
 *  motion (`immediate`) yields it whole after the beat. */
export async function* streamOnboardingReply(
  reply: string,
  { immediate = false }: { immediate?: boolean } = {}
): AsyncGenerator<string> {
  await sleep(ONBOARDING_TIMING.thinking);
  if (immediate) {
    yield reply;
    return;
  }
  const baseDelay =
    (ONBOARDING_TIMING.wordsPerChunk / ONBOARDING_TIMING.wordsPerSecond) * 1000;
  for (const chunk of chunkOnWordBoundaries(
    reply,
    ONBOARDING_TIMING.wordsPerChunk
  )) {
    const jitter = 1 + (Math.random() * 2 - 1) * ONBOARDING_TIMING.jitter;
    await sleep(Math.round(baseDelay * jitter));
    yield chunk;
  }
}
