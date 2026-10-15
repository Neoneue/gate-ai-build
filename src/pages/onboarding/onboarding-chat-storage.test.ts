// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ONBOARDING_CHAT_KEY,
  parseOnboardingChat,
  serializeOnboardingChat,
} from "./onboarding-chat-storage";
import {
  type OnboardingChatState,
  onboardingChatStore,
  useOnboardingChatStore,
} from "./onboarding-chat-store";

const FREE_QWEN = "constellation/qwen3-8-flash-free";
const DEFAULTS = { memoryToolsEnabled: true };

beforeEach(() => {
  vi.useFakeTimers();
  onboardingChatStore.reset();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

function store() {
  return renderHook(() => useOnboardingChatStore()).result;
}

async function send(conversationId: string | null, prompt: string, at: Date) {
  vi.setSystemTime(at);
  let id: string | null = null;
  act(() => {
    id = onboardingChatStore.sendScripted(conversationId, prompt, FREE_QWEN);
  });
  await act(() => vi.runAllTimersAsync());
  return id as unknown as string;
}

const stored = () =>
  parseOnboardingChat(localStorage.getItem(ONBOARDING_CHAT_KEY), DEFAULTS);

/** Another tab writes `raw`: the browser fires `storage` in this one. */
function otherTabWrites(raw: string | null) {
  act(() => {
    if (raw === null) {
      localStorage.removeItem(ONBOARDING_CHAT_KEY);
    } else {
      localStorage.setItem(ONBOARDING_CHAT_KEY, raw);
    }
    window.dispatchEvent(
      new StorageEvent("storage", { key: ONBOARDING_CHAT_KEY, newValue: raw })
    );
  });
}

describe("onboarding chat history persistence (owner 2026-10-14)", () => {
  it("round-trips a settled chat: dates, sets, titles, deletions", async () => {
    const state = store();
    const id = await send(null, "What is Gate AI?", new Date(2026, 9, 14, 9));
    act(() => {
      onboardingChatStore.renameConversation(id, "Renamed");
      onboardingChatStore.setFavorite("openai/gpt-4o-mini", true);
      onboardingChatStore.deleteConversation("chat_gone");
    });
    const parsed = stored();
    const { live: _live, ...expected } = state.current;
    expect(parsed).toEqual(expected);
    expect(parsed?.scripted[id]?.turns[0]?.sentAt).toBeInstanceOf(Date);
    expect(parsed?.favorites.has("openai/gpt-4o-mini")).toBe(true);
    expect(parsed?.deletedIds.has("chat_gone")).toBe(true);
    expect(parsed?.titles[id]).toBe("Renamed");
  });

  it("never stores a reply still being written", async () => {
    store();
    vi.setSystemTime(new Date(2026, 9, 14, 9));
    act(() => {
      onboardingChatStore.sendScripted(null, "What is Gate AI?", FREE_QWEN);
    });
    expect(stored()?.scripted ?? {}).toEqual({});
    expect(stored()?.conversationIds ?? []).toEqual([]);
    await act(() => vi.runAllTimersAsync());
    expect(Object.keys(stored()?.scripted ?? {})).toHaveLength(1);
  });

  it("reads null from bad JSON, another version or a non-object", () => {
    expect(parseOnboardingChat(null, DEFAULTS)).toBeNull();
    expect(parseOnboardingChat("not json", DEFAULTS)).toBeNull();
    expect(parseOnboardingChat("[]", DEFAULTS)).toBeNull();
    expect(parseOnboardingChat('{"v":99}', DEFAULTS)).toBeNull();
  });

  it("drops an invalid conversation and falls back on wrong field types", async () => {
    const state = store();
    const id = await send(null, "What is Gate AI?", new Date(2026, 9, 14, 9));
    const raw = JSON.parse(
      serializeOnboardingChat(state.current, null)
    ) as Record<string, unknown>;
    const parsed = parseOnboardingChat(
      JSON.stringify({
        ...raw,
        scripted: {
          ...(raw.scripted as object),
          chat_bad: { id: "chat_bad", title: 4, turns: [] },
        },
        favorites: "none",
        memoryToolsEnabled: "yes",
      }),
      DEFAULTS
    );
    expect(Object.keys(parsed?.scripted ?? {})).toEqual([id]);
    expect(parsed?.favorites.size).toBe(0);
    expect(parsed?.memoryToolsEnabled).toBe(true);
  });

  it("adopts another tab's history and never reuses its ids", async () => {
    const state = store();
    const id = await send(null, "What is Gate AI?", new Date(2026, 9, 14, 9));
    const otherTab = serializeOnboardingChat(state.current, null);
    // This tab starts over (as a fresh module would), then the other tab
    // writes its history.
    act(() => onboardingChatStore.reset());
    otherTabWrites(otherTab);
    expect(Object.keys(state.current.scripted)).toEqual([id]);
    const next = await send(null, "Second chat", new Date(2026, 9, 14, 10));
    expect(next).not.toBe(id);
    expect(Object.keys(state.current.scripted).sort()).toEqual(
      [id, next].sort()
    );
  });

  it("keeps this tab's reply being written when another tab writes", async () => {
    const state = store();
    const first = await send(null, "First", new Date(2026, 9, 14, 9));
    const otherTab = serializeOnboardingChat(state.current, null);
    vi.setSystemTime(new Date(2026, 9, 14, 10));
    let second: string | null = null;
    act(() => {
      second = onboardingChatStore.sendScripted(null, "Second", FREE_QWEN);
    });
    otherTabWrites(otherTab);
    expect(Object.keys(state.current.scripted).sort()).toEqual(
      [first, second as unknown as string].sort()
    );
    await act(() => vi.runAllTimersAsync());
    expect(Object.keys(stored()?.scripted ?? {})).toHaveLength(2);
  });

  it("empties when a fresh run in another tab clears it, and on reset", async () => {
    const state = store();
    await send(null, "What is Gate AI?", new Date(2026, 9, 14, 9));
    otherTabWrites(null);
    expect(state.current.scripted).toEqual({});
    await send(null, "Again", new Date(2026, 9, 14, 10));
    expect(stored()).not.toBeNull();
    act(() => onboardingChatStore.reset());
    expect(localStorage.getItem(ONBOARDING_CHAT_KEY)).toBeNull();
    expect(state.current.conversationIds).toEqual([]);
  });

  it("hydrates a new tab's store from storage", async () => {
    const state = store();
    const id = await send(null, "What is Gate AI?", new Date(2026, 9, 14, 9));
    const raw = localStorage.getItem(ONBOARDING_CHAT_KEY);
    vi.resetModules();
    localStorage.setItem(ONBOARDING_CHAT_KEY, raw ?? "");
    const fresh = await import("./onboarding-chat-store");
    const snapshot: OnboardingChatState = renderHook(() =>
      fresh.useOnboardingChatStore()
    ).result.current;
    expect(snapshot.conversationIds).toEqual([id]);
    expect(snapshot.live).toBeNull();
    expect(state.current.conversationIds).toEqual([id]);
  });
});
