import { expect, test } from "vitest";
import { CREDIT_BALANCE_USD } from "@/data/billing-history";
import {
  CHAT_SEED_CONVERSATIONS,
  CHAT_SEED_FAVORITE_MODEL_IDS,
  CHAT_SEED_MEMORIES,
  conversationTotals,
  laneCostUsd,
  lastUsedByModel,
} from "@/data/gate-chat";
import { costOf, modelById } from "@/data/models";
import {
  buildChatCatalog,
  chatConversationTotals,
  chatCredits,
  formatExactUsd,
  selectNewConversationModel,
  toChatConversation,
} from "@/pages/chat/chat-data";

/* The Gate Chat seed is a single-sourced fiction, but every number on the
 * surface still has to be derived, never typed (data-model.md §5.1.1). These
 * pin the derivations so a seed edit cannot quietly introduce a figure. */

const lanes = CHAT_SEED_CONVERSATIONS.flatMap((c) =>
  c.turns.flatMap((t) => t.lanes)
);

test("every model a chat names is a real catalog row", () => {
  for (const conversation of CHAT_SEED_CONVERSATIONS) {
    for (const id of conversation.modelIds) {
      expect(modelById(id), id).toBeDefined();
    }
  }
  for (const lane of lanes) {
    expect(modelById(lane.modelId), lane.modelId).toBeDefined();
  }
  for (const id of CHAT_SEED_FAVORITE_MODEL_IDS) {
    expect(modelById(id), id).toBeDefined();
  }
});

test("a lane's cost is the catalog price x its own tokens, never authored", () => {
  for (const lane of lanes) {
    const cost = laneCostUsd(lane);
    if (lane.promptTokens === null || lane.completionTokens === null) {
      expect(cost).toBeNull();
      continue;
    }
    expect(cost).toBe(
      costOf(lane.modelId, lane.promptTokens, lane.completionTokens)
    );
  }
});

test("the usage row prints exactly the derived cost", () => {
  const catalog = buildChatCatalog(new Set());
  for (const seed of CHAT_SEED_CONVERSATIONS) {
    const view = toChatConversation(
      {
        seed,
        title: seed.title,
        modelIds: seed.modelIds,
        memoryToolsEnabled: seed.memoryToolsEnabled,
      },
      catalog
    );
    seed.turns.forEach((turn, t) => {
      turn.lanes.forEach((lane, l) => {
        const usage = view.turns[t].lanes[l].usage;
        const cost = laneCostUsd(lane);
        if (lane.settlement === "pending" || cost === null) {
          expect(usage.cost).toBeNull();
        } else {
          expect(usage.cost).toBe(formatExactUsd(cost));
        }
        if (usage.compressionPercent) {
          // Compression % always carries one decimal.
          expect(usage.compressionPercent).toMatch(/^\d+\.\d%$/);
        }
      });
    });
  }
});

test("the stats popover reconciles with the lanes it sums", () => {
  for (const seed of CHAT_SEED_CONVERSATIONS) {
    const totals = chatConversationTotals(seed);
    const recorded = seed.turns
      .flatMap((t) => t.lanes)
      .filter((lane) => lane.gateRequestId !== null);
    expect(totals.totalRequests).toBe(recorded.length);
    expect(totals.totalTurns).toBe(seed.turns.length);
    expect(totals.promptTokens).toBe(
      recorded.reduce((sum, lane) => sum + (lane.promptTokens ?? 0), 0)
    );
    expect(totals.completionTokens).toBe(
      recorded.reduce((sum, lane) => sum + (lane.completionTokens ?? 0), 0)
    );
    expect(totals.totalCostUsd).toBeCloseTo(
      recorded.reduce((sum, lane) => sum + (laneCostUsd(lane) ?? 0), 0),
      12
    );
    expect(totals).toEqual({ ...conversationTotals(seed), isByok: false });
  }
});

test("credits are the Billing ledger's balance; only Free and Default are offered Pro", () => {
  expect(chatCredits("/chat").balance).toBe(formatExactUsd(CREDIT_BALANCE_USD));
  expect(chatCredits("/chat").pro).toBe(true);
  expect(chatCredits("/chat-enterprise/chat_8f2c41d7").pro).toBe(true);
  expect(chatCredits("/chat-free").pro).toBe(false);
  expect(chatCredits("/chat-default/chat_3b9e07a2").pro).toBe(false);
});

test("a new chat opens on the model the user last used, derived from the lanes", () => {
  const lastUsed = lastUsedByModel(CHAT_SEED_CONVERSATIONS);
  const newest = [...lastUsed.entries()].sort(
    (a, b) => b[1].getTime() - a[1].getTime()
  )[0][0];
  const { model, droppedLastUsed } = selectNewConversationModel(
    buildChatCatalog(new Set())
  );
  expect(model.id).toBe(newest);
  expect(droppedLastUsed).toBeNull();
});

test("the GPT-5 lane's memory chips name rows the memory panel holds", () => {
  const keys = new Set(CHAT_SEED_MEMORIES.map((memory) => memory.key));
  for (const lane of lanes) {
    for (const memory of lane.memories ?? []) {
      expect(keys.has(memory.key), memory.key).toBe(true);
    }
  }
});

test("the seed covers every usage and verdict state the surface draws", () => {
  const settlements = new Set(lanes.map((lane) => lane.settlement));
  expect(settlements).toEqual(new Set(["settled", "pending", "unavailable"]));
  const states = new Set(lanes.map((lane) => lane.state));
  expect(states).toEqual(new Set(["complete", "stopped", "failed"]));
  const verdicts = new Set(lanes.map((lane) => lane.security?.verdict));
  for (const verdict of ["flag", "redact", "block"]) {
    expect(verdicts.has(verdict as "flag")).toBe(true);
  }
  expect(lanes.some((lane) => lane.estimated)).toBe(true);
  expect(lanes.some((lane) => lane.compressionSavedTokens !== null)).toBe(true);
  expect(CHAT_SEED_CONVERSATIONS.some((c) => c.modelIds.length > 1)).toBe(true);
});
