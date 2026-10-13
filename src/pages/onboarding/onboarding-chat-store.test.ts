// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  COMPUTER_PROMPT,
  isSetupLinkRequest,
  ONBOARDING_STARTER_PROMPTS,
  selectOnboardingReply,
} from "@/data/onboarding-chat-script";
import {
  onboardingChatStore,
  onboardingModelLastUsed,
  useOnboardingChatStore,
} from "./onboarding-chat-store";

const FREE_QWEN = "constellation/qwen3-8-flash-free";
const FREE_GLM = "constellation/glm-5-3-flash-free";

beforeEach(() => {
  vi.useFakeTimers();
  onboardingChatStore.reset();
});

afterEach(() => {
  vi.useRealTimers();
});

function snapshot() {
  return renderHook(() => useOnboardingChatStore()).result;
}

describe("onboardingModelLastUsed (Mobile A picker's Recent)", () => {
  it("is empty for a brand-new user", () => {
    expect(onboardingModelLastUsed(snapshot().current.scripted).size).toBe(0);
  });

  it("lists the free Qwen after the first message on it", () => {
    vi.setSystemTime(new Date(2026, 9, 12, 13, 10, 5));
    const state = snapshot();
    act(() => {
      onboardingChatStore.sendScripted(null, "What is Gate AI?", FREE_QWEN);
    });
    const lastUsed = onboardingModelLastUsed(state.current.scripted);
    expect([...lastUsed.keys()]).toEqual([FREE_QWEN]);
    expect(lastUsed.get(FREE_QWEN)).toBe(
      new Date(2026, 9, 12, 13, 10, 5).toISOString()
    );
  });

  it("keeps each model's latest send", async () => {
    const state = snapshot();
    vi.setSystemTime(new Date(2026, 9, 12, 13, 0, 0));
    let id: string | null = null;
    act(() => {
      id = onboardingChatStore.sendScripted(
        null,
        "What is Gate AI?",
        FREE_QWEN
      );
    });
    await act(() => vi.runAllTimersAsync());
    vi.setSystemTime(new Date(2026, 9, 12, 13, 5, 0));
    act(() => {
      onboardingChatStore.sendScripted(id, "What will Gate protect?", FREE_GLM);
    });
    await act(() => vi.runAllTimersAsync());
    vi.setSystemTime(new Date(2026, 9, 12, 13, 9, 0));
    act(() => {
      onboardingChatStore.sendScripted(id, "Email setup link", FREE_QWEN);
    });
    const lastUsed = onboardingModelLastUsed(state.current.scripted);
    expect(lastUsed.get(FREE_QWEN)).toBe(
      new Date(2026, 9, 12, 13, 9, 0).toISOString()
    );
    expect(lastUsed.get(FREE_GLM)).toBe(
      new Date(2026, 9, 12, 13, 5, 0).toISOString()
    );
  });
});

describe("Email setup link quick action", () => {
  it("is the third Mobile A quick action, verbatim", () => {
    expect(ONBOARDING_STARTER_PROMPTS[2]).toBe(
      "How do I use Gate on my computer?"
    );
  });

  it("matches the chip and loose typed forms only", () => {
    for (const input of [
      "How do I use Gate on my computer?",
      "Email setup link",
      "email me the setup link",
      "setup link please",
      "Email link",
    ]) {
      expect(isSetupLinkRequest(input)).toBe(true);
    }
    for (const input of [
      "What is Gate AI?",
      "What will Gate protect for me?",
      "How do I use Gate with Claude Code?",
      "email",
    ]) {
      expect(isSetupLinkRequest(input)).toBe(false);
    }
    expect(selectOnboardingReply("Email setup link")).toBe(
      COMPUTER_PROMPT.line
    );
  });

  it("marks only setup-link turns, in any order", async () => {
    const state = snapshot();
    let id: string | null = null;
    act(() => {
      id = onboardingChatStore.sendScripted(
        null,
        "What is Gate AI?",
        FREE_QWEN
      );
    });
    await act(() => vi.runAllTimersAsync());
    act(() => {
      onboardingChatStore.sendScripted(id, "Email setup link", FREE_QWEN);
    });
    await act(() => vi.runAllTimersAsync());
    const turns = state.current.scripted[id as unknown as string].turns;
    expect(
      turns.map((turn) => state.current.setupLinkTurnIds.has(turn.id))
    ).toEqual([false, true]);
    // The follow-ups stay on the first reply's turn.
    expect(state.current.computerPrompt?.afterTurnId).toBe(turns[0].id);
    // The settled offer reply carries the line as its body.
    expect(turns[1].lanes[0].body).toBe(COMPUTER_PROMPT.line);
  });

  it("puts the follow-ups on the offer turn when it comes first", async () => {
    const state = snapshot();
    let id: string | null = null;
    act(() => {
      id = onboardingChatStore.sendScripted(
        null,
        "Email setup link",
        FREE_QWEN
      );
    });
    await act(() => vi.runAllTimersAsync());
    const [turn] = state.current.scripted[id as unknown as string].turns;
    expect(state.current.setupLinkTurnIds.has(turn.id)).toBe(true);
    expect(state.current.computerPrompt?.afterTurnId).toBe(turn.id);
  });
});
