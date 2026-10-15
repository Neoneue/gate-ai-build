import { type VendorSlug, vendorLabel } from "@/components/icons/vendor-meta";
import { formatChartTooltipDate } from "@/lib/formatters";
import {
  ATTACK_MESSAGE,
  type ImprovedModel,
  TEST_MESSAGE,
} from "@/pages/onboarding/improved-data";
import type { OnboardingDemoTraffic } from "@/pages/onboarding/onboarding-demo-traffic";
import {
  GATE_CONNECT_KEY_LABEL,
  type SetupTraffic,
} from "@/pages/onboarding/onboarding-setup-traffic";
import type { ImprovedBilling } from "@/pages/onboarding/onboarding-state";

/* ─── The desktop workspace's traffic: setup plus Gate Chat ─────────────────
 * Owner direction 2026-10-14: "any Gate Chat usage while on an onboarding
 * session adds to it". The workspace's data pages (Overview, Messages,
 * Activity, Conversations, Security, Token savings) show step 3's messages
 * (`onboarding-setup-traffic.ts`) AND every Gate Chat reply this onboarding
 * run sent, in any tab (`onboarding-demo-traffic.ts` over the shared chat
 * history, `onboarding-chat-storage.ts`).
 *
 * ONE source: every tile, chart, count and table on those pages reads this
 * list, so the numbers reconcile. A chat message logs as the live product
 * logs Gate Chat traffic: under Gate Connect's caller
 * (`GATE_CONNECT_KEY_LABEL`), Success and Allow, billed by Gate at the cost
 * the chat reply showed ($0.00 on a free model), and 0 tokens saved (Gate
 * Chat does not compress). Each chat conversation is its own row, beside
 * setup's. Null when neither source has a message, and the pages keep their
 * Default layouts. MOCK: no Gate record exists, so no request id.
 * ───────────────────────────────────────────────────────────────────────── */

export type WorkspaceMessage = {
  /** "test" or "demo" for setup's two; the reply lane's id for chat. */
  id: string;
  source: "setup" | "chat";
  prompt: string;
  sentAt: Date;
  model: ImprovedModel;
  inTokens: number;
  outTokens: number;
  /** Input tokens Gate's compression removed: 0 on a chat message. */
  savedTokens: number;
  costUsd: number;
  guardrail: "allow" | "block";
  /** The key column's caller. */
  keyLabel: string;
  /** Who bills it: Gate ("payg") or the user's provider ("existing"). Gate
   *  Chat is always Gate-metered. */
  billing: ImprovedBilling;
  conversationId: string;
  conversationTitle: string;
};

export type WorkspaceConversation = {
  id: string;
  /** The first prompt, with a chat rename applied. */
  title: string;
  keyLabel: string;
  /** Models it used, in first-use order. */
  models: ImprovedModel[];
  turns: number;
  /** One per message: a desktop compare turn sends two. */
  reqs: number;
  inTokens: number;
  outTokens: number;
  costUsd: number;
  startedAt: Date;
  updated: Date;
};

export type WorkspaceTraffic = {
  /** Newest first. */
  messages: readonly WorkspaceMessage[];
  /** Most recently updated first. */
  conversations: readonly WorkspaceConversation[];
};

/** What each step 3 message said (improved-data.ts). */
const SETUP_PROMPT = { test: TEST_MESSAGE, demo: ATTACK_MESSAGE } as const;

const uniqueModels = (messages: readonly WorkspaceMessage[]) => [
  ...new Map(messages.map((m) => [m.model.id, m.model])).values(),
];

const sum = (
  messages: readonly WorkspaceMessage[],
  pick: (m: WorkspaceMessage) => number
) => messages.reduce((total, m) => total + pick(m), 0);

export function workspaceTraffic(
  setup: SetupTraffic | null,
  chat: OnboardingDemoTraffic | null
): WorkspaceTraffic | null {
  const messages: WorkspaceMessage[] = [];
  const conversations: WorkspaceConversation[] = [];

  if (setup) {
    const { conversation } = setup;
    const setupMessages = setup.messages.map(
      (m): WorkspaceMessage => ({
        ...m,
        source: "setup",
        prompt: SETUP_PROMPT[m.id],
        keyLabel: setup.keyLabel,
        billing: setup.billing,
        conversationId: conversation.id,
        conversationTitle: conversation.title,
      })
    );
    messages.push(...setupMessages);
    conversations.push({
      id: conversation.id,
      title: conversation.title,
      keyLabel: setup.keyLabel,
      models: uniqueModels(setupMessages),
      turns: conversation.turns,
      reqs: setupMessages.length,
      inTokens: conversation.inTokens,
      outTokens: conversation.outTokens,
      costUsd: conversation.costUsd,
      startedAt: conversation.startedAt,
      updated: conversation.updatedAt,
    });
  }

  if (chat) {
    const titles = new Map(chat.conversations.map((c) => [c.id, c.title]));
    const chatMessages = chat.messages.map(
      (m): WorkspaceMessage => ({
        id: m.id,
        source: "chat",
        prompt: m.prompt,
        sentAt: m.sentAt,
        model: { id: m.modelId, label: m.modelLabel, vendor: m.vendor },
        inTokens: m.inTokens,
        outTokens: m.outTokens,
        savedTokens: 0,
        costUsd: m.costUsd,
        guardrail: "allow",
        keyLabel: GATE_CONNECT_KEY_LABEL,
        billing: "payg",
        conversationId: m.conversationId,
        conversationTitle: titles.get(m.conversationId) ?? m.prompt,
      })
    );
    messages.push(...chatMessages);
    for (const c of chat.conversations) {
      const own = chatMessages.filter((m) => m.conversationId === c.id);
      conversations.push({
        id: c.id,
        title: c.title,
        keyLabel: GATE_CONNECT_KEY_LABEL,
        models: uniqueModels(own.toReversed()),
        turns: c.turns,
        reqs: c.requests,
        inTokens: c.inTokens,
        outTokens: c.outTokens,
        costUsd: c.costUsd,
        startedAt: own.at(-1)?.sentAt ?? c.updated,
        updated: c.updated,
      });
    }
  }

  if (messages.length === 0) {
    return null;
  }
  return {
    messages: messages.toSorted(
      (a, b) => b.sentAt.getTime() - a.sentAt.getTime()
    ),
    conversations: conversations.toSorted(
      (a, b) => b.updated.getTime() - a.updated.getTime()
    ),
  };
}

/* ─── Shared arithmetic ─────────────────────────────────────────────────── */

export const tokensOf = (m: WorkspaceMessage) => m.inTokens + m.outTokens;

/** Gate's compression over the messages: tokens saved and the share of
 *  input tokens, one decimal ("0.1%"). Chat messages add input tokens and
 *  no savings. */
export function workspaceCompression(messages: readonly WorkspaceMessage[]): {
  savedTokens: number;
  inTokens: number;
  percent: string;
} {
  const savedTokens = sum(messages, (m) => m.savedTokens);
  const inTokens = sum(messages, (m) => m.inTokens);
  const pct = inTokens === 0 ? 0 : (savedTokens / inTokens) * 100;
  return { savedTokens, inTokens, percent: `${pct.toFixed(1)}%` };
}

/** Seven days ending on the newest message's day, the Overview's "Activity
 *  this week": each day's chart label (`formatChartTooltipDate`, the
 *  Dashboard's axis and tooltip shape) and the messages that fall in it. */
export function workspaceWeek(traffic: WorkspaceTraffic): {
  labels: string[];
  days: WorkspaceMessage[][];
} {
  const end = new Date(traffic.messages[0]?.sentAt ?? Date.now());
  end.setHours(0, 0, 0, 0);
  const dates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(end);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });
  const range = { start: dates[0] ?? end, end: dates[6] ?? end };
  return {
    labels: dates.map((d) => formatChartTooltipDate(d, "day", range)),
    days: dates.map((day, index) => {
      const from = day.getTime();
      const to = dates[index + 1]?.getTime() ?? Number.POSITIVE_INFINITY;
      return traffic.messages.filter(
        (m) => m.sentAt.getTime() >= from && m.sentAt.getTime() < to
      );
    }),
  };
}

/* ─── Grouping: one chart series or Top row per model, provider or key ──── */

export type WorkspaceDimension = "model" | "provider" | "apiKey";

export type WorkspaceGroup = {
  /** The model id, vendor slug or key label. */
  id: string;
  /** Chart data key and config key: `s<slot>`, safe where an id's "/" or
   *  "." is not. */
  key: string;
  label: string;
  /** The vendor mark: the model's or provider's; none for a key. */
  vendor: VendorSlug | null;
  /** 1-based chart palette slot, by first use, so a series keeps its colour
   *  as messages land. */
  slot: number;
  messages: WorkspaceMessage[];
};

/** The messages grouped on a dimension, in first-use order. */
export function workspaceGroups(
  messages: readonly WorkspaceMessage[],
  dimension: WorkspaceDimension
): WorkspaceGroup[] {
  const groups = new Map<string, WorkspaceGroup>();
  for (const m of messages.toReversed()) {
    const id =
      dimension === "model"
        ? m.model.id
        : dimension === "provider"
          ? m.model.vendor
          : m.keyLabel;
    const group = groups.get(id);
    if (group) {
      group.messages.unshift(m);
      continue;
    }
    const slot = groups.size + 1;
    groups.set(id, {
      id,
      key: `s${slot}`,
      label:
        dimension === "model"
          ? m.model.label
          : dimension === "provider"
            ? vendorLabel(m.model.vendor)
            : m.keyLabel,
      vendor: dimension === "apiKey" ? null : m.model.vendor,
      slot,
      messages: [m],
    });
  }
  return [...groups.values()];
}
