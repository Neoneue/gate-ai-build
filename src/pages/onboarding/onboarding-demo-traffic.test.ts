// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  COMPUTER_PROMPT,
  estimateTokens,
  ONBOARDING_STARTER_PROMPTS,
} from "@/data/onboarding-chat-script";
import {
  onboardingChatStore,
  useOnboardingChatStore,
} from "./onboarding-chat-store";
import {
  demoWeek,
  onboardingDemoTraffic,
  totalTokens,
} from "./onboarding-demo-traffic";

const FREE_QWEN = "constellation/qwen3-8-flash-free";
const FREE_GLM = "constellation/glm-5-3-flash-free";
const [CHIP_1, CHIP_2, CHIP_3] = ONBOARDING_STARTER_PROMPTS;

beforeEach(() => {
  vi.useFakeTimers();
  onboardingChatStore.reset();
});

afterEach(() => {
  vi.useRealTimers();
});

function store() {
  return renderHook(() => useOnboardingChatStore()).result;
}

function traffic(state: ReturnType<typeof store>) {
  return onboardingDemoTraffic(
    state.current,
    state.current.live?.laneId ?? null
  );
}

/** Sends `prompt` at `at` and lets the reply settle. */
async function send(
  conversationId: string | null,
  prompt: string,
  at: Date,
  modelId = FREE_QWEN
): Promise<string> {
  vi.setSystemTime(at);
  let id: string | null = null;
  act(() => {
    id = onboardingChatStore.sendScripted(conversationId, prompt, modelId);
  });
  await act(() => vi.runAllTimersAsync());
  return id as unknown as string;
}

describe("onboardingDemoTraffic (every demo message counts)", () => {
  it("is null before any message", () => {
    expect(traffic(store())).toBeNull();
  });

  it("counts a reply only once it settles", () => {
    const state = store();
    act(() => {
      onboardingChatStore.sendScripted(null, CHIP_1, FREE_QWEN);
    });
    expect(traffic(state)).toBeNull();
  });

  it("logs chips 1, 2 and 3 in one chat as three messages, one conversation", async () => {
    const state = store();
    const id = await send(null, CHIP_1, new Date(2026, 9, 12, 13, 0, 0));
    await send(id, CHIP_2, new Date(2026, 9, 12, 13, 1, 0));
    await send(id, CHIP_3, new Date(2026, 9, 12, 13, 2, 0));
    const view = traffic(state);
    expect(view?.messages.map((m) => m.prompt)).toEqual([
      CHIP_3,
      CHIP_2,
      CHIP_1,
    ]);
    expect(view?.conversations).toHaveLength(1);
    expect(view?.conversations[0]).toMatchObject({
      id,
      title: CHIP_1,
      turns: 3,
      updated: new Date(2026, 9, 12, 13, 2, 0),
      cost: "$0.00",
    });
    expect(view?.models.map((m) => m.label)).toEqual(["Qwen3.8 Flash"]);
    // Each message: its own tokens, $0.00, the chat's estimate.
    const setup = view?.messages[0];
    expect(setup?.inTokens).toBe(estimateTokens(CHIP_3));
    expect(setup?.outTokens).toBe(
      estimateTokens(`${COMPUTER_PROMPT.line} ${COMPUTER_PROMPT.button}`)
    );
    expect(view?.messages.every((m) => m.cost === "$0.00")).toBe(true);
    // The conversation's token sums equal its messages'.
    const conversation = view?.conversations[0];
    expect((conversation?.inTokens ?? 0) + (conversation?.outTokens ?? 0)).toBe(
      totalTokens(view?.messages ?? [])
    );
  });

  it("adds a row for a second chat and a series for the free GLM", async () => {
    const state = store();
    const first = await send(null, CHIP_1, new Date(2026, 9, 12, 13, 0, 0));
    await send(first, CHIP_2, new Date(2026, 9, 12, 13, 1, 0));
    await send(first, CHIP_3, new Date(2026, 9, 12, 13, 2, 0));
    const second = await send(
      null,
      "what's gate?",
      new Date(2026, 9, 12, 13, 5, 0),
      FREE_GLM
    );
    const view = traffic(state);
    expect(view?.messages).toHaveLength(4);
    expect(view?.conversations.map((c) => [c.id, c.turns])).toEqual([
      [second, 1],
      [first, 3],
    ]);
    expect(view?.models.map((m) => [m.label, m.slot])).toEqual([
      ["Qwen3.8 Flash", 1],
      ["Z.ai: GLM 5.3 Flash", 2],
    ]);
  });

  it("feeds the Overview week with every message, bars summing to the total", async () => {
    const state = store();
    const id = await send(null, CHIP_1, new Date(2026, 9, 12, 13, 0, 0));
    await send(id, CHIP_2, new Date(2026, 9, 12, 13, 1, 0));
    await send(id, CHIP_3, new Date(2026, 9, 12, 13, 2, 0));
    const view = traffic(state);
    if (!view) {
      throw new Error("expected traffic");
    }
    const week = demoWeek(view);
    expect(week.messages).toHaveLength(3);
    expect(week.rows).toHaveLength(7);
    const barSum = week.rows.reduce(
      (sum, row) =>
        sum + view.models.reduce((s, m) => s + Number(row[m.id] ?? 0), 0),
      0
    );
    expect(barSum).toBe(totalTokens(view.messages));
    expect(week.rows.at(-1)?.date).toBe("Oct 12");
  });
});
