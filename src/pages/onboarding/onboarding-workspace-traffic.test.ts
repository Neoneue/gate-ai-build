// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { laneCostUsd } from "@/data/gate-chat";
import { formatExactUsd } from "@/pages/chat/chat-data";
import {
  onboardingChatStore,
  useOnboardingChatStore,
} from "./onboarding-chat-store";
import { onboardingDemoTraffic } from "./onboarding-demo-traffic";
import {
  SETUP_CONVERSATION_ID,
  setupTraffic,
} from "./onboarding-setup-traffic";
import { initialImprovedState } from "./onboarding-state";
import {
  tokensOf,
  workspaceCompression,
  workspaceGroups,
  workspaceTraffic,
  workspaceWeek,
} from "./onboarding-workspace-traffic";

const FREE_QWEN = "constellation/qwen3-8-flash-free";
const PAID = "openai/gpt-4o-mini";

const RECEIVED = new Date(2026, 9, 14, 9, 0, 0).getTime();
const CAUGHT = new Date(2026, 9, 14, 9, 1, 0).getTime();

const setup = () =>
  setupTraffic({
    ...initialImprovedState(),
    connection: "manual",
    keys: [{ id: "key_1", name: "my-laptop" }],
    selectedKeyId: "key_1",
    pathChosen: true,
    connected: true,
    received: true,
    caught: true,
    receivedAt: RECEIVED,
    caughtAt: CAUGHT,
  });

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

async function send(
  conversationId: string | null,
  prompt: string,
  at: Date,
  modelIds: string | string[] = FREE_QWEN
) {
  vi.setSystemTime(at);
  let id: string | null = null;
  act(() => {
    id = onboardingChatStore.sendScripted(conversationId, prompt, modelIds);
  });
  await act(() => vi.runAllTimersAsync());
  return id as unknown as string;
}

describe("workspaceTraffic (setup plus Gate Chat, owner 2026-10-14)", () => {
  it("is null when neither source has a message", () => {
    expect(workspaceTraffic(null, null)).toBeNull();
    expect(workspaceTraffic(setupTraffic(initialImprovedState()), null)).toBe(
      null
    );
  });

  it("is setup's alone before any chat", () => {
    const view = workspaceTraffic(setup(), null);
    expect(view?.messages.map((m) => m.id)).toEqual(["demo", "test"]);
    expect(view?.conversations.map((c) => c.id)).toEqual([
      SETUP_CONVERSATION_ID,
    ]);
    expect(view?.messages.every((m) => m.keyLabel === "my-laptop")).toBe(true);
  });

  it("merges chat messages newest first, one row per chat", async () => {
    const state = store();
    const first = await send(
      null,
      "What is Gate AI?",
      new Date(2026, 9, 14, 10)
    );
    await send(first, "And compression?", new Date(2026, 9, 14, 11));
    const second = await send(null, "Hello", new Date(2026, 9, 14, 12));
    act(() => onboardingChatStore.renameConversation(first, "Renamed"));
    const view = workspaceTraffic(
      setup(),
      onboardingDemoTraffic(state.current)
    );
    expect(view?.messages.map((m) => m.prompt)).toEqual([
      "Hello",
      "And compression?",
      "What is Gate AI?",
      expect.any(String),
      expect.any(String),
    ]);
    expect(view?.messages.slice(3).map((m) => m.id)).toEqual(["demo", "test"]);
    expect(view?.conversations.map((c) => [c.id, c.title, c.turns])).toEqual([
      [second, "Hello", 1],
      [first, "Renamed", 2],
      [SETUP_CONVERSATION_ID, expect.any(String), 2],
    ]);
    const chat = view?.messages.filter((m) => m.source === "chat") ?? [];
    expect(
      chat.every(
        (m) =>
          m.keyLabel === null &&
          m.guardrail === "allow" &&
          m.billing === "payg" &&
          m.savedTokens === 0 &&
          m.costUsd === 0
      )
    ).toBe(true);
  });

  it("reconciles: conversation sums, week days and groups equal the messages", async () => {
    const state = store();
    const first = await send(
      null,
      "What is Gate AI?",
      new Date(2026, 9, 14, 10)
    );
    await send(first, "Compare", new Date(2026, 9, 14, 11), [FREE_QWEN, PAID]);
    const view = workspaceTraffic(
      setup(),
      onboardingDemoTraffic(state.current)
    );
    if (!view) {
      throw new Error("expected traffic");
    }
    const total = view.messages.reduce((s, m) => s + tokensOf(m), 0);
    const cost = view.messages.reduce((s, m) => s + m.costUsd, 0);
    expect(
      view.conversations.reduce((s, c) => s + c.inTokens + c.outTokens, 0)
    ).toBe(total);
    expect(view.conversations.reduce((s, c) => s + c.costUsd, 0)).toBeCloseTo(
      cost,
      10
    );
    expect(view.conversations.reduce((s, c) => s + c.reqs, 0)).toBe(
      view.messages.length
    );
    // The compare turn: one turn, two requests.
    expect(view.conversations.find((c) => c.id === first)).toMatchObject({
      turns: 2,
      reqs: 3,
    });
    const week = workspaceWeek(view);
    expect(week.days.flat()).toHaveLength(view.messages.length);
    for (const dimension of ["model", "provider"] as const) {
      const groups = workspaceGroups(view.messages, dimension);
      expect(groups.flatMap((g) => g.messages)).toHaveLength(
        view.messages.length
      );
      expect(groups.map((g) => g.slot)).toEqual(groups.map((_, i) => i + 1));
    }
    // Gate Chat uses no API key (owner 2026-10-15): only setup's key groups.
    const keyGroups = workspaceGroups(view.messages, "apiKey");
    expect(keyGroups.map((g) => g.label)).toEqual(["my-laptop"]);
    expect(keyGroups.flatMap((g) => g.messages)).toHaveLength(
      view.messages.filter((m) => m.source === "setup").length
    );
    // Savings stay setup's: chat adds input tokens and nothing saved.
    const compression = workspaceCompression(view.messages);
    expect(compression.savedTokens).toBe(
      view.messages
        .filter((m) => m.source === "setup")
        .reduce((s, m) => s + m.savedTokens, 0)
    );
    expect(compression.inTokens).toBe(
      view.messages.reduce((s, m) => s + m.inTokens, 0)
    );
  });

  it("logs a paid model at the cost the chat's usage row shows", async () => {
    const state = store();
    const id = await send(
      null,
      "What is Gate AI?",
      new Date(2026, 9, 14, 10),
      PAID
    );
    const lane = state.current.scripted[id]?.turns[0]?.lanes[0];
    if (!lane) {
      throw new Error("expected a lane");
    }
    const message = workspaceTraffic(null, onboardingDemoTraffic(state.current))
      ?.messages[0];
    expect(laneCostUsd(lane)).toBeGreaterThan(0);
    expect(message?.costUsd).toBe(laneCostUsd(lane));
    expect(formatExactUsd(message?.costUsd ?? 0)).toBe(
      formatExactUsd(laneCostUsd(lane) ?? 0)
    );
    expect(message?.model.id).toBe(PAID);
  });
});
