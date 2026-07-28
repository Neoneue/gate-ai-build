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

      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;
      const immediate = prefersReducedMotion();

      // 1. User bubble lands immediately.
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("user"),
          role: "user",
          content: question,
          status: "complete",
        },
      ]);
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
            prev.map((m) =>
              m.id === agentId ? { ...m, status: "complete" } : m
            )
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
    },
    [interrupt]
  );

  return useMemo(
    () => ({
      messages,
      phase,
      isBusy:
        phase === "sending" || phase === "thinking" || phase === "replying",
      send,
      stop,
    }),
    [messages, phase, send, stop]
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
