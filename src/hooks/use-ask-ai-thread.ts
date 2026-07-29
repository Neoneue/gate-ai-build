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
import { deriveSessionTitle } from "@/lib/ask-ai-title";

/* ─── useAskAiThread — conversation state for the Ask AI panel ───────────────
 * Owns the whole interaction: a list of chat SESSIONS + a phase machine the
 * composer and the thinking row both read from.
 *
 *   idle → sending → thinking → replying → complete → (idle on next send)
 *
 * Sessions are ordered NEWEST FIRST and one of them is always active; the
 * hook's `messages` is that active session's turns, so every existing consumer
 * reads exactly what it read when there was a single flat thread.
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

/** One chat. `title` is null until its first user message names it. */
export interface AskAiSession {
  id: string;
  messages: AskAiMessage[];
  title: string | null;
}

export interface AskAiThread {
  /** Id of the session `messages` belongs to. */
  activeSessionId: string;
  /** True while the agent is working — thinking or replying. */
  isBusy: boolean;
  /** The ACTIVE session's turns. */
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
   * Start a new chat: abort anything in flight, open a fresh empty session at
   * the FRONT of the list and make it active — which is what the panel's empty
   * state renders from. A no-op when the active session is already empty and
   * untitled, so two blank chats can never stack up.
   */
  reset: () => void;
  /** Switch chats, interrupting anything in flight. Restores that session's
   *  turns and returns the phase to `idle`. */
  selectSession: (id: string) => void;
  /** Send a question. No-ops on empty/whitespace input or while busy. */
  send: (input: string) => void;
  /** Every chat, newest first. The active one is always in here. */
  sessions: AskAiSession[];
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

let sessionSeq = 0;
const createSession = (): AskAiSession => {
  sessionSeq += 1;
  return { id: `chat-${sessionSeq}`, messages: [], title: null };
};

const EMPTY_MESSAGES: AskAiMessage[] = [];

export function useAskAiThreadState(): AskAiThread {
  /* One session exists from the first render, so the list is never empty and
     the picker always has a row to show. */
  const [sessions, setSessions] = useState<AskAiSession[]>(() => [
    createSession(),
  ]);
  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0].id);
  const [phase, setPhase] = useState<AskAiPhase>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const messages =
    sessions.find((s) => s.id === activeSessionId)?.messages ?? EMPTY_MESSAGES;

  /* Every write targets a session BY ID, never "the active one" — an agent
     turn that is still resolving when the user switches chats can then only
     ever write back to the chat it was started in. */
  const updateMessages = useCallback(
    (sessionId: string, update: (prev: AskAiMessage[]) => AskAiMessage[]) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, messages: update(s.messages) } : s
        )
      );
    },
    []
  );

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
    // Only one turn can be in flight, so this sweeps every session rather than
    // needing to know which one owned it.
    setSessions((prev) =>
      prev.map((s) =>
        s.messages.some((m) => m.status === "streaming")
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.status === "streaming" ? { ...m, status: "stopped" } : m
              ),
            }
          : s
      )
    );
  }, []);

  const stop = useCallback(() => {
    interrupt();
    setPhase("idle");
  }, [interrupt]);

  /* New chat. Goes through the same `interrupt()` as `stop()` so there stays
     exactly one abort path.

     A blank, untitled active session IS a new chat — opening a second one
     would put two identical "New message" rows in the picker and lose nothing
     in return, so that case is a no-op here (the panel still re-arms the
     field, which is the whole visible effect). */
  const reset = useCallback(() => {
    interrupt();
    setPhase("idle");
    const active = sessions.find((s) => s.id === activeSessionId);
    if (active && active.messages.length === 0 && active.title === null) {
      return;
    }
    const fresh = createSession();
    setSessions((prev) => [fresh, ...prev]);
    setActiveSessionId(fresh.id);
  }, [interrupt, sessions, activeSessionId]);

  /* Switch chats. The turns come back because they were never thrown away —
     each session keeps its own list. Phase returns to `idle` rather than
     `complete`: both are non-busy and the composer's placeholder map only
     names `thinking`/`replying`, so they render identically, and `idle` is the
     one state that is correct for a restored chat whether its last reply
     finished, was stopped, or never happened. */
  const selectSession = useCallback(
    (id: string) => {
      interrupt();
      setActiveSessionId(id);
      setPhase("idle");
    },
    [interrupt]
  );

  /* One agent turn: beat, think, stream. It assumes the prompting user bubble
     is ALREADY in the thread — `send()` appends a new one first, `regenerate()`
     reuses the one that is already there. Extracted so the two entry points
     share a single state machine and cannot drift apart. */
  const runAgentTurn = useCallback(
    (question: string, sessionId: string) => {
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
          updateMessages(sessionId, (prev) => [
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
            updateMessages(sessionId, (prev) =>
              prev.map((m) =>
                m.id === agentId ? { ...m, content: m.content + chunk } : m
              )
            );
          }

          if (signal.aborted) {
            return;
          }
          updateMessages(sessionId, (prev) =>
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
    [updateMessages]
  );

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

      /* The user bubble lands immediately; the agent turn follows it. The chat
         is NAMED in the same update — a title set here is on the picker while
         the thinking row is still showing, not after the reply lands. Only the
         FIRST user message names a chat (`title === null`); later turns never
         re-title, so a session's name is stable for its whole life. */
      const sessionId = activeSessionId;
      const userId = nextId("user");
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                title: s.title ?? deriveSessionTitle(question),
                messages: [
                  ...s.messages,
                  {
                    id: userId,
                    role: "user",
                    content: question,
                    status: "complete",
                  },
                ],
              }
            : s
        )
      );
      runAgentTurn(question, sessionId);
    },
    [interrupt, runAgentTurn, activeSessionId]
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
      const sessionId = activeSessionId;
      // Re-find inside the updater: `idx` was read from a possibly stale render.
      updateMessages(sessionId, (prev) => {
        const at = prev.findIndex((m) => m.id === agentMessageId);
        return at === -1 ? prev : prev.slice(0, at);
      });
      runAgentTurn(question, sessionId);
    },
    [messages, interrupt, runAgentTurn, updateMessages, activeSessionId]
  );

  return useMemo(
    () => ({
      activeSessionId,
      messages,
      phase,
      isBusy:
        phase === "sending" || phase === "thinking" || phase === "replying",
      regenerate,
      reset,
      selectSession,
      send,
      sessions,
      stop,
    }),
    [
      activeSessionId,
      messages,
      phase,
      regenerate,
      reset,
      selectSession,
      send,
      sessions,
      stop,
    ]
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
