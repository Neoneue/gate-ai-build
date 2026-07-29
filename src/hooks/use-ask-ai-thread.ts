import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { streamReply, TIMING } from "@/data/ask-ai-script";

/* ─── useAskAiThread — conversation state for the Ask AI panel ───────────────
 * Owns the whole interaction: message list + a phase machine the composer and
 * the thinking row both read from.
 *
 *   idle → sending → thinking → replying → complete → (idle on next send)
 *
 * Every timer and the scripted responder live behind `streamReply()` in
 * `src/data/ask-ai-script.ts`; components contain no setTimeout of their own.
 * When the real `/api/ask` route lands it replaces that one function and this
 * hook is unchanged.
 *
 * State is mounted ABOVE the router outlet (App.tsx) via the provider below,
 * so the thread survives navigation the same way `askAiOpen` does.
 * ────────────────────────────────────────────────────────────────────────── */

export type AskAiRole = "user" | "agent";

export type AskAiMessageStatus = "complete" | "streaming" | "stopped";

export interface AskAiMessage {
  content: string;
  id: string;
  role: AskAiRole;
  status: AskAiMessageStatus;
}

export type AskAiPhase =
  | "idle"
  | "sending"
  | "thinking"
  | "replying"
  | "complete";

export interface AskAiThread {
  /** True while the agent is working — thinking or replying. */
  isBusy: boolean;
  messages: AskAiMessage[];
  phase: AskAiPhase;
  /**
   * Re-answer a turn: drop that agent reply and stream a fresh one for the
   * question that prompted it. The primary case is a reply the user STOPPED —
   * the partial turn is frozen in the thread, and this is how they get a whole
   * answer without retyping.
   */
  regenerate: (agentMessageId: string) => void;
  /**
   * Start a new chat: drop every turn, abort anything in flight, return to
   * `idle` — which is what the panel's empty state renders from.
   */
  reset: () => void;
  /** Send a question. No-ops on empty/whitespace input or while busy. */
  send: (input: string) => void;
  /** Halt the reply where it is, keeping the partial text. */
  stop: () => void;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let messageSeq = 0;
const nextId = (role: AskAiRole) => {
  messageSeq += 1;
  return `${role}-${messageSeq}`;
};

export function useAskAiThreadState(): AskAiThread {
  const [messages, setMessages] = useState<AskAiMessage[]>([]);
  const [phase, setPhase] = useState<AskAiPhase>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  /* Abort whatever turn is in flight, freezing any partial reply where it is.
     The partial STAYS in the thread as a `stopped` turn — the user read that
     text, so removing it would rewrite history under them. Shared by `stop()`
     and by an interrupting `send()` so there is exactly one abort path. */
  const interrupt = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages((prev) =>
      prev.map((m) =>
        m.status === "streaming" ? { ...m, status: "stopped" } : m
      )
    );
  }, []);

  const stop = useCallback(() => {
    interrupt();
    setPhase("idle");
  }, [interrupt]);

  /* New chat. Goes through the same `interrupt()` as `stop()` so there stays
     exactly one abort path — the `stopped` marking it does is moot here since
     the very next statement drops the messages anyway. */
  const reset = useCallback(() => {
    interrupt();
    setMessages([]);
    setPhase("idle");
  }, [interrupt]);

  /* One agent turn: beat, think, stream. It assumes the prompting user bubble
     is ALREADY in the thread — `send()` appends a new one first, `regenerate()`
     reuses the one that is already there. Extracted so the two entry points
     share a single state machine and cannot drift apart. */
  const runAgentTurn = useCallback((question: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    const immediate = prefersReducedMotion();
    setPhase("sending");

    const run = async () => {
      const agentId = nextId("agent");
      try {
        // 2. Beat, then the thinking row.
        await wait(TIMING.beforeThinking, signal);
        setPhase("thinking");

        // 3. Thinking holds.
        await wait(TIMING.thinking, signal);

        // 4. Reply streams in.
        setPhase("replying");
        setMessages((prev) => [
          ...prev,
          { id: agentId, role: "agent", content: "", status: "streaming" },
        ]);

        for await (const chunk of streamReply(question, {
          signal,
          immediate,
        })) {
          if (signal.aborted) {
            break;
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentId ? { ...m, content: m.content + chunk } : m
            )
          );
        }

        if (signal.aborted) {
          return;
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === agentId ? { ...m, status: "complete" } : m))
        );
        setPhase("complete");
      } catch {
        // Aborted mid-flight — `interrupt()` already froze the partial turn.
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    };

    void run();
  }, []);

  const send = useCallback(
    (input: string) => {
      const question = input.trim();
      if (question.length === 0) {
        return;
      }

      /* Interrupt-and-send, not a queue: a new question takes over
         immediately. `abort()` runs its listeners synchronously, so the
         generator's pending sleep rejects before this function returns and no
         further chunk can be appended after the new user bubble below. */
      interrupt();

      // The user bubble lands immediately; the agent turn follows it.
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("user"),
          role: "user",
          content: question,
          status: "complete",
        },
      ]);
      runAgentTurn(question);
    },
    [interrupt, runAgentTurn]
  );

  /* Regenerate one agent turn. The question is the nearest USER message above
     it, so nothing is retyped and the scripted responder is re-entered exactly
     as it was the first time.

     Truncate-and-rerun: the target reply AND anything after it are dropped
     before the new turn streams. Replacing it in place would leave later turns
     answering a reply that no longer exists. In practice the target is almost
     always the last turn — that is the STOP case this exists for, where the
     frozen partial is the thing being replaced.

     Unlike `send()`, this appends no user bubble: the prompt is already in the
     thread and duplicating it would rewrite history. */
  const regenerate = useCallback(
    (agentMessageId: string) => {
      const idx = messages.findIndex((m) => m.id === agentMessageId);
      if (idx === -1) {
        return;
      }
      let question: string | null = null;
      for (let i = idx - 1; i >= 0; i -= 1) {
        if (messages[i].role === "user") {
          question = messages[i].content;
          break;
        }
      }
      // An agent turn with no user turn above it cannot be re-answered.
      if (question === null) {
        return;
      }

      interrupt();
      // Re-find inside the updater: `idx` was read from a possibly stale render.
      setMessages((prev) => {
        const at = prev.findIndex((m) => m.id === agentMessageId);
        return at === -1 ? prev : prev.slice(0, at);
      });
      runAgentTurn(question);
    },
    [messages, interrupt, runAgentTurn]
  );

  return useMemo(
    () => ({
      messages,
      phase,
      isBusy:
        phase === "sending" || phase === "thinking" || phase === "replying",
      regenerate,
      reset,
      send,
      stop,
    }),
    [messages, phase, regenerate, reset, send, stop]
  );
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const id = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(id);
      reject(signal.reason);
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/* ─── Context ────────────────────────────────────────────────────────────── */

export const AskAiThreadContext = createContext<AskAiThread | null>(null);

export function useAskAiThread(): AskAiThread {
  const ctx = useContext(AskAiThreadContext);
  if (!ctx) {
    throw new Error("useAskAiThread must be used inside <AskAiThreadProvider>");
  }
  return ctx;
}
