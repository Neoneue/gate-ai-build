import { useSyncExternalStore } from "react";
import {
  CHAT_SEED_CONVERSATIONS,
  CHAT_SEED_FAVORITE_MODEL_IDS,
  CHAT_SEED_MEMORIES,
  CHAT_SEED_MEMORY_TOOLS_ENABLED,
} from "@/data/gate-chat";
import type { ChatConversationInput } from "./chat-data";
import type { ChatMemory } from "./contract";

/* ─────────────────────────────────────────────────────────────────────────
 * Gate Chat session state: module-scoped, IN MEMORY, never persisted. Same
 * useSyncExternalStore shape as `data/notifications-store.ts`. What the site
 * writes to its API (rename, delete, a conversation's lane models, a
 * favourite star, memory rows, the two memory-tool switches) is written here
 * instead, on top of the seeds in `@/data/gate-chat`. A reload returns to the
 * seeded state, which is what a design build needs.
 *
 * Snapshots are REPLACED, never mutated: useSyncExternalStore compares by
 * identity.
 * ───────────────────────────────────────────────────────────────────────── */

export interface ChatStoreState {
  deletedIds: ReadonlySet<string>;
  favorites: ReadonlySet<string>;
  memories: readonly ChatMemory[];
  memoryOverrides: Readonly<Record<string, boolean | null>>;
  memoryToolsEnabled: boolean;
  modelIds: Readonly<Record<string, readonly string[]>>;
  titles: Readonly<Record<string, string>>;
}

function seededState(): ChatStoreState {
  return {
    titles: {},
    deletedIds: new Set(),
    modelIds: {},
    memoryOverrides: {},
    favorites: new Set(CHAT_SEED_FAVORITE_MODEL_IDS),
    memories: CHAT_SEED_MEMORIES,
    memoryToolsEnabled: CHAT_SEED_MEMORY_TOOLS_ENABLED,
  };
}

let state: ChatStoreState = seededState();
const listeners = new Set<() => void>();

function set(next: Partial<ChatStoreState>) {
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

export const chatStore = {
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
  /** Test hook: back to the seeded state. */
  reset() {
    memorySeq = 0;
    state = seededState();
    for (const listener of listeners) {
      listener();
    }
  },
};

export function useChatStore(): ChatStoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** The seeds with this session's edits applied, deleted ones dropped. */
export function liveConversations(
  snapshot: ChatStoreState
): ChatConversationInput[] {
  return CHAT_SEED_CONVERSATIONS.filter(
    (seed) => !snapshot.deletedIds.has(seed.id)
  ).map((seed) => ({
    seed,
    title: snapshot.titles[seed.id] ?? seed.title,
    modelIds: snapshot.modelIds[seed.id] ?? seed.modelIds,
    memoryToolsEnabled:
      seed.id in snapshot.memoryOverrides
        ? (snapshot.memoryOverrides[seed.id] ?? null)
        : seed.memoryToolsEnabled,
  }));
}
