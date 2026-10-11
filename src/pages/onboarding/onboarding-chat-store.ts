import { useSyncExternalStore } from "react";
import {
  CHAT_SEED_CONVERSATIONS,
  CHAT_SEED_MEMORY_TOOLS_ENABLED,
} from "@/data/gate-chat";
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

export interface OnboardingChatState {
  /** Seed conversations this session opened, in the order they opened. */
  conversationIds: readonly string[];
  deletedIds: ReadonlySet<string>;
  favorites: ReadonlySet<string>;
  memories: readonly ChatMemory[];
  memoryOverrides: Readonly<Record<string, boolean | null>>;
  memoryToolsEnabled: boolean;
  modelIds: Readonly<Record<string, readonly string[]>>;
  titles: Readonly<Record<string, string>>;
}

function emptyState(): OnboardingChatState {
  return {
    conversationIds: [],
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

export const onboardingChatStore = {
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
  /** Test hook: back to the empty state. */
  reset() {
    memorySeq = 0;
    state = emptyState();
    for (const listener of listeners) {
      listener();
    }
  },
};

export function useOnboardingChatStore(): OnboardingChatState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** The conversations this session opened, with its edits applied. */
export function onboardingConversations(
  snapshot: OnboardingChatState
): ChatConversationInput[] {
  return snapshot.conversationIds
    .filter((id) => !snapshot.deletedIds.has(id))
    .flatMap((id) => {
      const seed = CHAT_SEED_CONVERSATIONS.find((entry) => entry.id === id);
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
