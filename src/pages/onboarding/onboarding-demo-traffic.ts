import { useMemo } from "react";
import type { VendorSlug } from "@/components/icons/vendor-meta";
import { FREE_MODELS } from "@/data/free-models";
import { costOf, modelById, modelName } from "@/data/models";
import { formatExactUsd } from "@/pages/chat/chat-data";
import {
  type OnboardingChatState,
  useOnboardingChatStore,
} from "@/pages/onboarding/onboarding-chat-store";

/* ─── The phone demo's Gate Chat traffic, as the dashboard logs it ──────────
 * Owner direction 2026-10-12: every message sent in the demo chat counts on
 * Overview, Messages, Activity and Conversations ("press the first button,
 * press the 2nd button, and then press the 3rd"). Gate Chat traffic is real
 * Gate traffic (PRD principle), so each settled scripted turn in
 * `onboarding-chat-store.ts` is one logged message, and each scripted
 * conversation is one logged conversation: the 2nd and 3rd chips in one chat
 * add turns to it, a new chat adds a row.
 *
 * ONE source: every tile, chart and table on the four phone pages reads this
 * list, so the counts, sums and rows reconcile. Each message carries the
 * prompt, time, tokens and $0.00 the chat reply shows. Null until the first
 * reply settles, and the pages keep their empty Default layouts. A reply
 * still being written is not counted yet. Deleting a chat does not delete
 * its log, as on a real gateway. MOCK: no Gate record exists, so there is no
 * request id and no detail page.
 * ───────────────────────────────────────────────────────────────────────── */

export type OnboardingDemoMessage = {
  /** The reply lane's id: unique per message. */
  id: string;
  conversationId: string;
  prompt: string;
  sentAt: Date;
  /** "Oct 12 11:47:05", the Overview preview's day + time cell. */
  timeLabel: string;
  /** The catalog id behind `modelLabel` (a free model's pay as you go
   *  version, `free-models.ts`), for the label, vendor mark and series key. */
  modelId: string;
  modelLabel: string;
  vendor: VendorSlug;
  inTokens: number;
  outTokens: number;
  costUsd: number;
  /** "$0.00": the free models cost nothing. */
  cost: string;
};

export type OnboardingDemoConversation = {
  id: string;
  /** The chat's title, with a rename applied. */
  title: string;
  /** The latest counted turn's send time. */
  updated: Date;
  /** Counted turns; one request per turn, so Reqs equals Turns. */
  turns: number;
  inTokens: number;
  outTokens: number;
  costUsd: number;
  cost: string;
  /** Catalog ids of the models it used, in first-use order. */
  modelIds: readonly string[];
  /** Its prompts, oldest first: what the Conversations search reads. */
  prompts: readonly string[];
};

export type OnboardingDemoModel = {
  id: string;
  label: string;
  vendor: VendorSlug;
  /** 1-based chart palette slot, by first use: a model keeps its colour on
   *  every page. */
  slot: number;
};

export type OnboardingDemoTraffic = {
  /** Newest first. */
  messages: readonly OnboardingDemoMessage[];
  /** Most recently updated first. */
  conversations: readonly OnboardingDemoConversation[];
  /** Every model the demo sent with, in first-use order. */
  models: readonly OnboardingDemoModel[];
};

const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** The catalog row a chat model id resolves to: a free model's Constellation
 *  id maps to its pay as you go twin, so the label matches the chat's
 *  ("Qwen3.8 Flash"). */
function catalogIdOf(chatModelId: string): string {
  return (
    FREE_MODELS.find((free) => free.constellationId === chatModelId)?.id ??
    chatModelId
  );
}

/** The demo's traffic from a store snapshot. Pure, so tests can call it.
 *  `liveLaneId` is the reply still being written, left out until it
 *  settles. */
export function onboardingDemoTraffic(
  state: Pick<OnboardingChatState, "scripted" | "titles">,
  liveLaneId: string | null = null
): OnboardingDemoTraffic | null {
  const messages: OnboardingDemoMessage[] = [];
  const conversations: OnboardingDemoConversation[] = [];

  for (const conversation of Object.values(state.scripted)) {
    const counted: OnboardingDemoMessage[] = [];
    for (const turn of conversation.turns) {
      const lane = turn.lanes[0];
      if (!lane || lane.id === liveLaneId) {
        continue;
      }
      const modelId = catalogIdOf(lane.modelId);
      const inTokens = lane.promptTokens ?? 0;
      const outTokens = lane.completionTokens ?? 0;
      const costUsd = costOf(lane.modelId, inTokens, outTokens);
      counted.push({
        id: lane.id,
        conversationId: conversation.id,
        prompt: turn.prompt,
        sentAt: turn.sentAt,
        timeLabel: `${DAY_FORMAT.format(turn.sentAt)} ${TIME_FORMAT.format(turn.sentAt)}`,
        modelId,
        modelLabel: modelName(modelId),
        vendor: modelById(modelId)?.vendor ?? modelId.split("/")[0] ?? "",
        inTokens,
        outTokens,
        costUsd,
        cost: formatExactUsd(costUsd),
      });
    }
    const last = counted.at(-1);
    if (!last) {
      continue;
    }
    messages.push(...counted);
    const costUsd = counted.reduce((sum, m) => sum + m.costUsd, 0);
    conversations.push({
      id: conversation.id,
      title: state.titles[conversation.id] ?? conversation.title,
      updated: last.sentAt,
      turns: counted.length,
      inTokens: counted.reduce((sum, m) => sum + m.inTokens, 0),
      outTokens: counted.reduce((sum, m) => sum + m.outTokens, 0),
      costUsd,
      cost: formatExactUsd(costUsd),
      modelIds: [...new Set(counted.map((m) => m.modelId))],
      prompts: counted.map((m) => m.prompt),
    });
  }

  if (messages.length === 0) {
    return null;
  }

  const oldestFirst = messages.toSorted(
    (a, b) => a.sentAt.getTime() - b.sentAt.getTime()
  );
  const models: OnboardingDemoModel[] = [];
  for (const message of oldestFirst) {
    if (!models.some((m) => m.id === message.modelId)) {
      models.push({
        id: message.modelId,
        label: message.modelLabel,
        vendor: message.vendor,
        slot: models.length + 1,
      });
    }
  }

  return {
    messages: oldestFirst.toReversed(),
    conversations: conversations.toSorted(
      (a, b) => b.updated.getTime() - a.updated.getTime()
    ),
    models,
  };
}

/** The demo's traffic, live from the onboarding chat store. */
export function useOnboardingDemoTraffic(): OnboardingDemoTraffic | null {
  const { live, scripted, titles } = useOnboardingChatStore();
  const liveLaneId = live?.laneId ?? null;
  // Re-derive only when a turn, a title or the writing reply changes, not on
  // every streamed chunk.
  return useMemo(
    () => onboardingDemoTraffic({ scripted, titles }, liveLaneId),
    [liveLaneId, scripted, titles]
  );
}

/* ─── Shared arithmetic ─────────────────────────────────────────────────── */

export const totalTokens = (messages: readonly OnboardingDemoMessage[]) =>
  messages.reduce((sum, m) => sum + m.inTokens + m.outTokens, 0);

export const totalCostUsd = (messages: readonly OnboardingDemoMessage[]) =>
  messages.reduce((sum, m) => sum + m.costUsd, 0);

/** Seven days ending on the newest message's day: the Overview's "Activity
 *  this week". `messages` are the ones that fall in it; `rows` are the
 *  "Tokens used" bars, one key per model holding that day's tokens. */
export function demoWeek(traffic: OnboardingDemoTraffic): {
  messages: readonly OnboardingDemoMessage[];
  rows: Array<Record<string, number | string>>;
} {
  const end = new Date(traffic.messages[0]?.sentAt ?? Date.now());
  end.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(end);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });
  const start = days[0]?.getTime() ?? end.getTime();
  const inWeek = traffic.messages.filter((m) => m.sentAt.getTime() >= start);
  const rows = days.map((day, index) => {
    const from = day.getTime();
    const to = days[index + 1]?.getTime() ?? Number.POSITIVE_INFINITY;
    const row: Record<string, number | string> = {
      date: DAY_FORMAT.format(day),
    };
    for (const model of traffic.models) {
      row[model.id] = totalTokens(
        inWeek.filter(
          (m) =>
            m.modelId === model.id &&
            m.sentAt.getTime() >= from &&
            m.sentAt.getTime() < to
        )
      );
    }
    return row;
  });
  return { messages: inWeek, rows };
}
