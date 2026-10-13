import { useSyncExternalStore } from "react";
import {
  CHAT_SEED_CONVERSATIONS,
  CHAT_SEED_MEMORY_TOOLS_ENABLED,
  type ChatSeedConversation,
} from "@/data/gate-chat";
import {
  COMPUTER_PROMPT,
  estimateTokens,
  isSetupLinkRequest,
  selectOnboardingReply,
  streamOnboardingReply,
} from "@/data/onboarding-chat-script";
import type { ChatConversationInput } from "@/pages/chat/chat-data";
import type { ChatMemory } from "@/pages/chat/contract";

/* ─────────────────────────────────────────────────────────────────────────
 * The Onboarding workspace's own Gate Chat state: a copy of
 * `pages/chat/chat-store.ts` that starts as a brand-new user, so the
 * onboarding chat can change without touching the current Gate Chat on
 * every other workspace. Module-scoped, IN MEMORY, never persisted.
 *
 * Clean slate: no conversations, no memories, no favourite models. A
 * conversation joins the history only when this session opens it
 * (`openConversation`), which the first send does. A reload starts over.
 *
 * Snapshots are REPLACED, never mutated: useSyncExternalStore compares by
 * identity.
 * ───────────────────────────────────────────────────────────────────────── */

/** The scripted reply being written right now (Mobile A). */
export interface OnboardingLiveReply {
  /** The text streamed so far; empty while the card is preparing. */
  body: string;
  conversationId: string;
  laneId: string;
}

export interface OnboardingChatState {
  /** The bubble after the first scripted reply (PRD phone step 4): which
   *  conversation shows it, under which turn. Set once per session. */
  computerPrompt: { conversationId: string; afterTurnId: string } | null;
  /** Seed conversations this session opened, in the order they opened. */
  conversationIds: readonly string[];
  deletedIds: ReadonlySet<string>;
  favorites: ReadonlySet<string>;
  live: OnboardingLiveReply | null;
  memories: readonly ChatMemory[];
  memoryOverrides: Readonly<Record<string, boolean | null>>;
  memoryToolsEnabled: boolean;
  modelIds: Readonly<Record<string, readonly string[]>>;
  /** Conversations the Mobile A user started, answered from the script
   *  (`onboarding-chat-script.ts`). Same shape as a seed. */
  scripted: Readonly<Record<string, ChatSeedConversation>>;
  /** The computer offer's setup link was emailed at least once, so every
   *  card's button reads "Re-send email setup link" (owner 2026-10-12). */
  setupLinkSent: boolean;
  /** Turns that asked for the setup link (quick action 3, owner
   *  2026-10-12): their reply is drawn as the computer offer card with its
   *  email button, not as prose. */
  setupLinkTurnIds: ReadonlySet<string>;
  titles: Readonly<Record<string, string>>;
}

function emptyState(): OnboardingChatState {
  return {
    computerPrompt: null,
    conversationIds: [],
    live: null,
    scripted: {},
    setupLinkSent: false,
    setupLinkTurnIds: new Set(),
    titles: {},
    deletedIds: new Set(),
    modelIds: {},
    memoryOverrides: {},
    favorites: new Set(),
    memories: [],
    // A setting, not history: a new user starts with the product default.
    memoryToolsEnabled: CHAT_SEED_MEMORY_TOOLS_ENABLED,
  };
}

let state: OnboardingChatState = emptyState();
const listeners = new Set<() => void>();

function set(next: Partial<OnboardingChatState>) {
  state = { ...state, ...next };
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

let memorySeq = 0;
let scriptedSeq = 0;

/** The free default a scripted reply comes from when no model is passed
 *  (owner 2026-10-11). */
const SCRIPTED_MODEL_ID = "constellation/qwen3-8-flash-free";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/** Replace one scripted conversation. */
function setScripted(conversation: ChatSeedConversation) {
  return { ...state.scripted, [conversation.id]: conversation };
}

export const onboardingChatStore = {
  markSetupLinkSent() {
    set({ setupLinkSent: true });
  },
  /** Adds a seed conversation to this session's history (idempotent). */
  openConversation(id: string) {
    if (state.conversationIds.includes(id)) {
      return;
    }
    set({ conversationIds: [...state.conversationIds, id] });
  },
  renameConversation(id: string, title: string) {
    set({ titles: { ...state.titles, [id]: title } });
  },
  deleteConversation(id: string) {
    set({ deletedIds: new Set([...state.deletedIds, id]) });
  },
  setConversationModels(id: string, modelIds: readonly string[]) {
    set({ modelIds: { ...state.modelIds, [id]: modelIds } });
  },
  setMemoryOverride(id: string, value: boolean | null) {
    set({ memoryOverrides: { ...state.memoryOverrides, [id]: value } });
  },
  setFavorite(modelId: string, favorite: boolean) {
    const favorites = new Set(state.favorites);
    if (favorite) {
      favorites.add(modelId);
    } else {
      favorites.delete(modelId);
    }
    set({ favorites });
  },
  setMemoryToolsEnabled(enabled: boolean) {
    set({ memoryToolsEnabled: enabled });
  },
  saveMemory(input: {
    key: string;
    content: string;
    projectId: string | null;
    enabled?: boolean;
  }) {
    const existing = state.memories.find(
      (memory) =>
        memory.key === input.key && memory.projectId === input.projectId
    );
    if (existing) {
      set({
        memories: state.memories.map((memory) =>
          memory.id === existing.id
            ? {
                ...memory,
                content: input.content,
                enabled: input.enabled ?? memory.enabled,
              }
            : memory
        ),
      });
      return;
    }
    memorySeq += 1;
    set({
      memories: [
        {
          id: `mem_session_${memorySeq}`,
          projectId: input.projectId,
          key: input.key,
          content: input.content,
          enabled: input.enabled ?? true,
        },
        ...state.memories,
      ],
    });
  },
  removeMemory(id: string) {
    set({ memories: state.memories.filter((memory) => memory.id !== id) });
  },
  /**
   * Mobile A: send `prompt` and answer it from the script. Appends the turn
   * at once (the user's bubble, then the reply card preparing), streams the
   * reply into `live`, then settles it into the conversation. A new chat
   * (`conversationId` null) starts a conversation titled by the prompt.
   * Returns the conversation id, or null while a reply is still writing.
   * Module-scoped so leaving the page does not cut the reply off.
   * `modelId` is the model picked in the composer (owner 2026-10-12); the
   * reply card is drawn as that model. A new chat opens on it.
   */
  sendScripted(
    conversationId: string | null,
    prompt: string,
    modelId: string = SCRIPTED_MODEL_ID
  ): string | null {
    if (state.live) {
      return null;
    }
    scriptedSeq += 1;
    const id = conversationId ?? `chat_onboarding_${scriptedSeq}`;
    const turnId = `turn_onboarding_${scriptedSeq}`;
    const laneId = `msg_onboarding_${scriptedSeq}`;
    const now = new Date();
    const existing = state.scripted[id];
    const conversation: ChatSeedConversation = existing ?? {
      id,
      title: prompt,
      modelIds: [modelId],
      memoryToolsEnabled: null,
      turns: [],
    };
    const reply = selectOnboardingReply(prompt);
    // The setup-link reply is the offer line plus its button, counted the way
    // the follow-up offer card counts it.
    const setupLink = isSetupLinkRequest(prompt);
    const output = setupLink ? `${reply} ${COMPUTER_PROMPT.button}` : reply;
    set({
      scripted: setScripted({
        ...conversation,
        turns: [
          ...conversation.turns,
          {
            id: turnId,
            prompt,
            sentAt: now,
            attachments: [],
            lanes: [
              {
                id: laneId,
                answeredAt: now,
                body: "",
                // MOCK usage (owner 2026-10-12): estimated tokens, the free
                // model's $0.00 cost, no compression. No Gate record yet, so
                // no "View message" link; that comes with the first-message
                // data (next slice).
                completionTokens: estimateTokens(output),
                compressionSavedTokens: null,
                gateRequestId: null,
                modelId,
                promptTokens: estimateTokens(prompt),
                settlement: "settled",
                state: "complete",
              },
            ],
          },
        ],
      }),
      conversationIds: existing
        ? state.conversationIds
        : [...state.conversationIds, id],
      live: { conversationId: id, laneId, body: "" },
      setupLinkTurnIds: setupLink
        ? new Set([...state.setupLinkTurnIds, turnId])
        : state.setupLinkTurnIds,
    });
    (async () => {
      let body = "";
      for await (const chunk of streamOnboardingReply(reply, {
        immediate: prefersReducedMotion(),
      })) {
        body += chunk;
        set({ live: { conversationId: id, laneId, body } });
      }
      const current = state.scripted[id];
      if (!current) {
        set({ live: null });
        return;
      }
      set({
        live: null,
        scripted: setScripted({
          ...current,
          turns: current.turns.map((turn) =>
            turn.id === turnId
              ? {
                  ...turn,
                  lanes: turn.lanes.map((lane) =>
                    lane.id === laneId
                      ? { ...lane, body: reply, answeredAt: new Date() }
                      : lane
                  ),
                }
              : turn
          ),
        }),
        computerPrompt: state.computerPrompt ?? {
          conversationId: id,
          afterTurnId: turnId,
        },
      });
    })();
    return id;
  },
  /** Test hook: back to the empty state. */
  reset() {
    memorySeq = 0;
    scriptedSeq = 0;
    state = emptyState();
    for (const listener of listeners) {
      listener();
    }
  },
};

export function useOnboardingChatStore(): OnboardingChatState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Mobile A picker's Recent source (owner 2026-10-12): each model this session
 * sent with, keyed by the lane's model id, to its latest turn's `sentAt` as
 * ISO. A brand-new user has sent nothing, so the map starts empty.
 */
export function onboardingModelLastUsed(
  scripted: OnboardingChatState["scripted"]
): ReadonlyMap<string, string> {
  const lastUsed = new Map<string, string>();
  for (const conversation of Object.values(scripted)) {
    for (const turn of conversation.turns) {
      const sentAt = turn.sentAt.toISOString();
      for (const lane of turn.lanes) {
        const previous = lastUsed.get(lane.modelId);
        if (previous === undefined || sentAt > previous) {
          lastUsed.set(lane.modelId, sentAt);
        }
      }
    }
  }
  return lastUsed;
}

/** The conversations this session opened, with its edits applied. */
export function onboardingConversations(
  snapshot: OnboardingChatState
): ChatConversationInput[] {
  return snapshot.conversationIds
    .filter((id) => !snapshot.deletedIds.has(id))
    .flatMap((id) => {
      const seed =
        snapshot.scripted[id] ??
        CHAT_SEED_CONVERSATIONS.find((entry) => entry.id === id);
      return seed ? [seed] : [];
    })
    .map((seed) => ({
      seed,
      title: snapshot.titles[seed.id] ?? seed.title,
      modelIds: snapshot.modelIds[seed.id] ?? seed.modelIds,
      memoryToolsEnabled:
        seed.id in snapshot.memoryOverrides
          ? (snapshot.memoryOverrides[seed.id] ?? null)
          : seed.memoryToolsEnabled,
    }));
}
