/* ─── SCRIPTED Ask AI responder — NO BACKEND, NO NETWORK ────────────────────
 * Everything in this file is a canned demo script. It exists so the Ask AI
 * interaction can be demoed end-to-end before the real agent exists.
 *
 * SWAP POINT: `streamReply()` is the ONLY thing the rest of the app touches.
 * It is an async generator yielding text chunks, i.e. the same shape a real
 * streamed `/api/ask` response has. Replace its body with a fetch + reader
 * loop and nothing else in the codebase changes.
 *
 * Reply copy authority is the live doc:
 *   https://docs.constellationgate.ai/getting-started/quickstart-gate-connect
 * reconciled 2026-07-27. It is a verbatim transcription — no invented product
 * facts, metrics, IDs, or findings. See the git history of
 * `ask-ai-placeholder-thread.tsx` (removed in this change) for the earlier
 * JSX form and the full list of Figma-vs-doc corrections.
 * ────────────────────────────────────────────────────────────────────────── */

/** SCRIPTED. The session name this intent takes in the chat picker. Approved
 *  copy — verbatim, not derived from the question. */
const GATE_CONNECT_TITLE = "Setup Gate Connect app";

/** SCRIPTED. Doc-sourced answer to the Gate Connect setup question. */
const GATE_CONNECT_REPLY = `Gate Connect routes the AI apps you already run through Gate, with no code changes. You sign in once, turn on the apps you want covered, and they keep working exactly as before, with Gate's security scanning, audit trail, and cost tracking running underneath. The same flow covers Claude Code, Claude Desktop, Codex, and the other apps Gate Connect supports.

### Step 1. Install Gate Connect

Download the installer for your platform from the [latest release](https://github.com/Constellation-Labs/gate-connect-app/releases/latest):

- macOS: the universal \`.dmg\`
- Windows: the \`x64\` setup \`.exe\`
- Linux: the \`.AppImage\` or \`.deb\`

Open the installer, then launch Gate Connect. It runs from the menu bar (top right on macOS, the system tray on Windows), not as a normal window. Click the icon to open its panel.

### Step 2. Sign in

In the panel, paste your Gate API key and click **Connect**. The gateway address is filled in for you, so the key is all you need. Once it connects, the icon shows **Connected**.

Your key is stored in your operating system's keychain, not in a file on disk.

### Step 3. Turn on your apps

Open **Routing** and make sure **Route through Gate** is on. Then turn on each app you want Gate to cover. A single toggle can cover more than one, for example Claude Code and Claude Desktop together.

Turn on each app you want Gate to cover. The rest keep talking to their providers directly.

### Step 4. Restart your apps

Quit and reopen each app you turned on, so it picks up the new routing. On macOS, quit completely with Cmd+Q rather than just closing the window. If an app prompts you to sign in the first time it reopens, follow its normal sign-in.

### Step 5. Confirm it is working

Send a message from one of the apps you turned on, then open the [dashboard](https://app.constellationgate.ai). New requests appear on the Messages page within a few seconds, each with its model, cost, and security result.

If nothing shows up, check that the app is turned on in **Routing** and that you restarted it.

### Next steps

- See what your apps did in the [audit trail](https://docs.constellationgate.ai/concepts/audit-trail/).
- Need notes for a specific app? See [Connect your apps](https://docs.constellationgate.ai/gate-connect/connect-your-apps/).
- Prefer to wire things up yourself? Follow the [manual setup quickstart](https://docs.constellationgate.ai/getting-started/quickstart-manual-setup/).`;

/** SCRIPTED. Shown for anything the script does not cover. Deliberately says
 *  nothing about the product — no invented facts. EASY TO CHANGE: this exact
 *  string is the whole fallback. */
const UNMATCHED_REPLY = `I'm not connected to the live docs yet, so I can only answer from a short scripted demo. Try asking me how to set up the Gate Connect app.`;

/* ─── Trigger matching ────────────────────────────────────────────────────── */

/** Words that, taken together, mean "how do I set up Gate Connect". */
const SETUP_WORDS = [
  "set",
  "setup",
  "install",
  "connect",
  "configure",
  "start",
  "add",
];
const SUBJECT_WORDS = ["gate", "connect", "gateconnect", "app", "gatekeeper"];

const normalise = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^\da-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Loose intent match, not a string compare. Normalises case + punctuation and
 * asks for one setup word AND one subject word, so "how do i set up the gate
 * connect app?", "install gate connect", "setup gateconnect" and
 * "how to configure the Gate app" all hit.
 */
export function matchesGateConnectSetup(input: string): boolean {
  const words = new Set(normalise(input).split(" "));
  const hasSetup = SETUP_WORDS.some((w) => words.has(w));
  const hasSubject = SUBJECT_WORDS.some((w) => words.has(w));
  return hasSetup && hasSubject;
}

/** Pick the scripted reply for a question. */
function selectReply(input: string): string {
  return matchesGateConnectSetup(input) ? GATE_CONNECT_REPLY : UNMATCHED_REPLY;
}

/**
 * Pick the scripted CHAT TITLE for a question, or `null` when the script does
 * not cover it (the caller falls back to the heuristic in
 * `src/lib/ask-ai-title.ts`). It lives next to the reply on purpose: a scripted
 * intent owns both its answer and the name the session takes in the picker, so
 * the two cannot drift apart.
 */
export function selectTitle(input: string): string | null {
  return matchesGateConnectSetup(input) ? GATE_CONNECT_TITLE : null;
}

/* ─── Timing (SCRIPTED — tuned by eye, safe to adjust) ────────────────────── */

export const TIMING = {
  /** Beat between the user's bubble landing and the thinking row appearing. */
  beforeThinking: 400,
  /** How long "Thinking" holds before the first token. */
  thinking: 2500,
  /** Target reading cadence. ~20 words/sec. */
  wordsPerSecond: 20,
  /** Words emitted per chunk — a few at a time reads better than one-by-one. */
  wordsPerChunk: 3,
  /** ±% jitter on each chunk delay so it does not tick like a metronome. */
  jitter: 0.45,
} as const;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const id = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(id);
      reject(signal?.reason);
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });

/**
 * Split into chunks that always END ON A WORD BOUNDARY, so a partially
 * revealed reply never cuts mid-word (and markdown stays as parseable as it
 * can be mid-stream). Whitespace is kept attached to the preceding word, so
 * concatenating every chunk reproduces the source string exactly.
 */
function chunkOnWordBoundaries(text: string, wordsPerChunk: number): string[] {
  const tokens = text.match(/\S+\s*/g) ?? [];
  const chunks: string[] = [];
  for (let i = 0; i < tokens.length; i += wordsPerChunk) {
    chunks.push(tokens.slice(i, i + wordsPerChunk).join(""));
  }
  return chunks;
}

/**
 * SWAP POINT — replace this body with the real `/api/ask` stream.
 *
 * Yields the reply in word-boundary chunks at a readable cadence. Aborting
 * `signal` stops it where it is; the caller keeps whatever it already has.
 * When `immediate` is true (reduced motion) the whole reply arrives at once.
 *
 * REAL IMPLEMENTATION MUST FORWARD THE SIGNAL: `fetch(url, { signal })`, so an
 * interrupt cancels the in-flight request rather than merely stopping the
 * render. The caller already aborts on both stop and interrupt-and-send.
 */
export async function* streamReply(
  question: string,
  options: { signal?: AbortSignal; immediate?: boolean } = {}
): AsyncGenerator<string> {
  const { signal, immediate = false } = options;
  const reply = selectReply(question);

  if (immediate) {
    yield reply;
    return;
  }

  const chunks = chunkOnWordBoundaries(reply, TIMING.wordsPerChunk);
  const baseDelay = (TIMING.wordsPerChunk / TIMING.wordsPerSecond) * 1000;

  for (const chunk of chunks) {
    const jitter = 1 + (Math.random() * 2 - 1) * TIMING.jitter;
    await sleep(Math.round(baseDelay * jitter), signal);
    yield chunk;
  }
}
