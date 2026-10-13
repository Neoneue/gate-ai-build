// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import {
  DEMO_TOKENS_IN,
  DEMO_TOKENS_OUT,
  TEST_TOKENS_IN,
  TEST_TOKENS_OUT,
} from "@/pages/onboarding/improved-data";
import {
  saveSetupTraffic,
  setupCompression,
  setupTraffic,
  setupWeek,
  storedSetupTraffic,
  tokensOf,
} from "@/pages/onboarding/onboarding-setup-traffic";
import { initialImprovedState } from "@/pages/onboarding/onboarding-state";

const RECEIVED = new Date(2026, 9, 13, 11, 40, 0).getTime();
const CAUGHT = new Date(2026, 9, 13, 11, 41, 30).getTime();

const finished = () => ({
  ...initialImprovedState(),
  connection: "gate-connect" as const,
  billing: "existing" as const,
  client: "codex",
  pathChosen: true,
  connected: true,
  received: true,
  caught: true,
  finished: true,
  receivedAt: RECEIVED,
  caughtAt: CAUGHT,
});

describe("setupTraffic", () => {
  test("is null until both step 3 messages passed", () => {
    expect(setupTraffic(initialImprovedState())).toBeNull();
    expect(setupTraffic({ ...finished(), caught: false })).toBeNull();
    expect(setupTraffic({ ...finished(), caughtAt: null })).toBeNull();
  });

  test("lists the demo message then the test message, with step 3's tokens", () => {
    const traffic = setupTraffic(finished());
    expect(traffic?.messages.map((m) => [m.id, m.guardrail])).toEqual([
      ["demo", "block"],
      ["test", "allow"],
    ]);
    const [demo, testMessage] = traffic?.messages ?? [];
    expect(demo?.inTokens).toBe(DEMO_TOKENS_IN);
    expect(demo?.outTokens).toBe(DEMO_TOKENS_OUT);
    expect(testMessage?.inTokens).toBe(TEST_TOKENS_IN);
    expect(testMessage?.outTokens).toBe(TEST_TOKENS_OUT);
    expect(demo?.sentAt.getTime()).toBe(CAUGHT);
  });

  test("uses the app's model on provider billing, at no cost", () => {
    const traffic = setupTraffic(finished());
    expect(traffic?.messages.every((m) => m.model.label === "GPT-4.1")).toBe(
      true
    );
    expect(traffic?.messages.every((m) => m.costUsd === 0)).toBe(true);
  });

  test("prices the picked model over the tokens on Gate credits", () => {
    const traffic = setupTraffic({
      ...finished(),
      billing: "payg",
      model: "anthropic/claude-sonnet-4",
    });
    expect(traffic?.messages.every((m) => m.costUsd > 0)).toBe(true);
  });

  test("names the caller: Gate Connect's substitute or the Manual key", () => {
    expect(setupTraffic(finished())?.keyLabel).toBe(
      "gate-connect (user@example...)"
    );
    expect(
      setupTraffic({
        ...finished(),
        connection: "manual",
        keys: [{ id: "k1", name: "Laptop key" }],
        selectedKeyId: "k1",
      })?.keyLabel
    ).toBe("Laptop key");
  });
});

describe("setupWeek", () => {
  test("puts both messages on the last of seven days and sums to the total", () => {
    const traffic = setupTraffic(finished());
    if (!traffic) {
      throw new Error("expected traffic");
    }
    const week = setupWeek(traffic);
    expect(week.labels).toHaveLength(7);
    expect(week.days.map((d) => d.length)).toEqual([0, 0, 0, 0, 0, 0, 2]);
    const total = week.days.flat().reduce((sum, m) => sum + tokensOf(m), 0);
    expect(total).toBe(
      TEST_TOKENS_IN + TEST_TOKENS_OUT + DEMO_TOKENS_IN + DEMO_TOKENS_OUT
    );
  });
});

describe("setup traffic after step 3 (owner 2026-10-13)", () => {
  test("compresses 2 of 2,366 input tokens: 0.1%", () => {
    const traffic = setupTraffic(finished());
    expect(traffic && setupCompression(traffic)).toEqual({
      savedTokens: 2,
      inTokens: 2366,
      percent: "0.1%",
    });
  });

  test("logs one conversation with 2 turns", () => {
    const conversation = setupTraffic(finished())?.conversation;
    expect(conversation?.turns).toBe(2);
    expect(conversation?.inTokens).toBe(TEST_TOKENS_IN + DEMO_TOKENS_IN);
    expect(conversation?.startedAt.getTime()).toBe(RECEIVED);
    expect(conversation?.updatedAt.getTime()).toBe(CAUGHT);
  });

  test("round-trips through the new-tab mirror, dates revived", () => {
    const traffic = setupTraffic(finished());
    saveSetupTraffic(traffic);
    const stored = storedSetupTraffic();
    expect(stored?.messages[0]?.sentAt.getTime()).toBe(CAUGHT);
    expect(stored?.conversation.updatedAt.getTime()).toBe(CAUGHT);
    saveSetupTraffic(null);
    expect(storedSetupTraffic()).toBeNull();
  });
});
