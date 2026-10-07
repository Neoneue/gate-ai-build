/* ─────────────────────────────────────────────────────────────────────────
 * Gate Chat view-model adapter. Ported from the site's
 * `lib/api/chat-adapter.ts`, with the transport removed: instead of DTOs off
 * the wire, it reads the seed module `@/data/gate-chat` and the model catalog
 * `@/data/models`, and produces the exact presentational shapes the
 * components were written against (`./types`). Copy strings are the site's,
 * verbatim. Nothing here fetches.
 * ───────────────────────────────────────────────────────────────────────── */

import { CREDIT_BALANCE_USD } from "@/data/billing-history";
import {
  CHAT_SEED_CONVERSATIONS,
  type ChatSeedConversation,
  type ChatSeedLane,
  compressionPct,
  conversationTotals,
  laneCostUsd,
  lastActivity,
  lastUsedByModel,
} from "@/data/gate-chat";
import {
  formatTokenCount,
  listPrice,
  MODELS,
  type Model,
  modelName,
} from "@/data/models";
import {
  formatCurrency,
  formatNumber,
  formatRelative,
  formatTime,
} from "@/lib/formatters";
import { isDefaultSurface, isFreeSurface } from "@/lib/plan";
import type { ChatErrorCode, ChatModelUnavailableReason } from "./contract";
import {
  CHAT_COPY,
  lastModelDroppedLabel,
  lastModelUnavailableLabel,
} from "./copy";
import type {
  ChatAttachment,
  ChatConversation,
  ChatConversationGroup,
  ChatConversationTotals,
  ChatCredits,
  ChatLane,
  ChatModel,
  ChatTurn,
  ChatUsage,
} from "./types";

const UNAVAILABLE = "Unavailable";

/** The site's `CHAT_DEFAULT_MODEL_ID`: where a new chat opens when the user
 *  has no last-used model the workspace still offers. */
export const CHAT_DEFAULT_MODEL_ID = "openai/gpt-4o-mini";

/* ─── Money ─────────────────────────────────────────────────────────────── */

/** EXACT money: minimum 2 fraction digits, maximum 6 (the site's
 *  `formatExactUsd`), so a sub-cent lane cost never rounds to $0.00. */
export function formatExactUsd(usd: number): string {
  return formatCurrency(usd, { minFrac: 2, maxFrac: 6 });
}

/* ─── Models ────────────────────────────────────────────────────────────── */

const LAST_USED = lastUsedByModel(CHAT_SEED_CONVERSATIONS);

function toChatModel(model: Model, favorite: boolean): ChatModel {
  const input = listPrice(model, "inputPer1M");
  const output = listPrice(model, "outputPer1M");
  return {
    id: model.id,
    label: model.name,
    provider: model.vendor,
    // Every catalog row is routable through at least one provider, so every
    // model is selectable in this workspace.
    available: model.providers.length > 0,
    unavailableReason: model.providers.length > 0 ? null : "not_offered",
    contextWindow:
      model.contextWindow === null
        ? UNAVAILABLE
        : formatTokenCount(model.contextWindow),
    price: input === null ? UNAVAILABLE : `${formatExactUsd(input)} / 1M in`,
    isFree: input === 0 && output === 0,
    favorite,
    lastUsedAt: LAST_USED.get(model.id)?.toISOString() ?? null,
    supportsTools: model.capabilities.includes("tools"),
    supportsVision: model.capabilities.includes("vision"),
    capabilities: model.capabilities,
  };
}

export type ChatModelCatalog = ReadonlyMap<string, ChatModel>;

/** The picker's catalog: every model the Models page carries. */
export function buildChatCatalog(
  favorites: ReadonlySet<string>
): ChatModelCatalog {
  return new Map(
    MODELS.map((model) => [
      model.id,
      toChatModel(model, favorites.has(model.id)),
    ])
  );
}

/** A model id the catalog does not know about renders rather than drops. */
function fallbackModel(id: string): ChatModel {
  const slash = id.indexOf("/");
  return {
    id,
    label: slash > 0 ? id.slice(slash + 1) : id,
    provider: slash > 0 ? id.slice(0, slash) : UNAVAILABLE,
    available: false,
    unavailableReason: "not_offered",
    contextWindow: UNAVAILABLE,
    price: UNAVAILABLE,
    favorite: false,
    lastUsedAt: null,
    supportsTools: null,
    supportsVision: null,
    capabilities: [],
  };
}

export function resolveChatModel(
  catalog: ChatModelCatalog,
  id: string
): ChatModel {
  return catalog.get(id) ?? fallbackModel(id);
}

export const MODEL_UNAVAILABLE_REASON_COPY: Record<
  ChatModelUnavailableReason,
  string
> = {
  not_offered: CHAT_COPY.unavailableNotOffered,
  disabled: CHAT_COPY.unavailableDisabled,
  suppressed: CHAT_COPY.unavailableSuppressed,
};

/** The reason a model cannot be picked, or the bare status when there is none. */
export function modelUnavailableLabel(
  model: Pick<ChatModel, "unavailableReason">
): string {
  if (model.unavailableReason === null) {
    return CHAT_COPY.unavailable;
  }
  return MODEL_UNAVAILABLE_REASON_COPY[model.unavailableReason];
}

/** Says which model a new chat did NOT open on. */
export function droppedLastModelMessage(
  dropped: ChatModel,
  opened: ChatModel
): string {
  if (dropped.unavailableReason === null) {
    return lastModelUnavailableLabel(dropped.label, opened.label);
  }
  return lastModelDroppedLabel(
    dropped.label,
    opened.label,
    dropped.unavailableReason
  );
}

export interface ChatNewConversationModel {
  droppedLastUsed: ChatModel | null;
  model: ChatModel;
}

/** The model a NEW conversation opens on: the last-used model if the
 *  workspace still offers it, else the default, else the first available. */
export function selectNewConversationModel(
  catalog: ChatModelCatalog
): ChatNewConversationModel {
  const models = [...catalog.values()];
  const lastUsed =
    models
      .filter(
        (model): model is ChatModel & { lastUsedAt: string } =>
          model.lastUsedAt !== null
      )
      .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt))[0] ?? null;
  if (lastUsed?.available) {
    return { model: lastUsed, droppedLastUsed: null };
  }
  const preferred = catalog.get(CHAT_DEFAULT_MODEL_ID);
  if (preferred?.available) {
    return { model: preferred, droppedLastUsed: lastUsed };
  }
  return {
    model:
      models.find((model) => model.available) ??
      resolveChatModel(catalog, CHAT_DEFAULT_MODEL_ID),
    droppedLastUsed: lastUsed,
  };
}

/* ─── Errors ────────────────────────────────────────────────────────────── */

/** The site's error copy, verbatim. */
const ERROR_MESSAGES: Record<ChatErrorCode, string> = {
  invalid_request: "This request was malformed and could not be sent.",
  not_found: "This conversation or message no longer exists.",
  input_too_long: "This message is too long to send.",
  context_too_long:
    "The conversation is too long for this model's context window.",
  generation_in_progress:
    "Another response is already generating for this turn.",
  rate_limited: "The provider rejected the request as rate limited.",
  insufficient_credits:
    "This org is out of credits. Add credits to keep chatting.",
  model_lacks_vision:
    "This model cannot read images. Pick a model that accepts image attachments, or remove the image.",
  model_unavailable: "This model is temporarily unavailable.",
  security_blocked: "Request blocked by security policy.",
  provider_error: "The provider returned an error answering this request.",
  upstream_timeout: "The provider took too long to respond.",
  configuration_error: "This model is misconfigured for this organization.",
  attachment_rejected: "One or more attachments could not be processed.",
  export_failed: "The export could not be generated.",
  aborted: "This response was stopped before it finished.",
};

export function chatErrorMessage(code: ChatErrorCode | undefined): string {
  return (
    (code === undefined ? undefined : ERROR_MESSAGES[code]) ??
    "This response failed for an unknown reason."
  );
}

/* ─── Attachments ───────────────────────────────────────────────────────── */

const BYTE_UNITS = ["B", "KB", "MB", "GB"];

export function formatByteSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${BYTE_UNITS[unit]}`;
}

/* ─── Usage ─────────────────────────────────────────────────────────────── */

/** Always one decimal (`22.4%`, never `22%`). */
function formatPct(pct: number | null): string | null {
  return pct === null ? null : `${pct.toFixed(1)}%`;
}

function toChatUsage(lane: ChatSeedLane): ChatUsage {
  const pending = lane.settlement === "pending";
  const cost = pending ? null : laneCostUsd(lane);
  return {
    kind: "response",
    settlement: lane.settlement,
    compression:
      pending || lane.compressionSavedTokens === null
        ? null
        : `${formatNumber(lane.compressionSavedTokens)} tok saved`,
    compressionPercent: pending
      ? null
      : formatPct(
          compressionPct(lane.compressionSavedTokens, lane.promptTokens)
        ),
    promptTokens:
      lane.promptTokens === null ? null : formatNumber(lane.promptTokens),
    tokens:
      lane.completionTokens === null
        ? null
        : formatNumber(lane.completionTokens),
    cost: cost === null ? null : formatExactUsd(cost),
    estimated: !pending && cost !== null && lane.estimated === true,
    messageId: lane.gateRequestId,
    security: pending ? null : (lane.security ?? null),
  };
}

function toChatLane(
  lane: ChatSeedLane,
  index: number,
  catalog: ChatModelCatalog
): ChatLane {
  const out: ChatLane = {
    lane: index,
    id: lane.id,
    model: resolveChatModel(catalog, lane.modelId),
    requestedModelId: lane.modelId,
    state: lane.state,
    body: lane.body,
    timestamp: formatTime(lane.answeredAt),
    timestampIso: lane.answeredAt.toISOString(),
    usage: toChatUsage(lane),
  };
  if (lane.state === "failed") {
    out.error = chatErrorMessage(lane.errorCode);
  }
  if (lane.memories) {
    out.memories = lane.memories;
  }
  if (lane.attachments) {
    out.attachments = lane.attachments;
  }
  return out;
}

function toChatTurns(
  seed: ChatSeedConversation,
  catalog: ChatModelCatalog
): ChatTurn[] {
  return seed.turns.map((turn) => {
    const attachments: ChatAttachment[] = turn.attachments.map((file) => ({
      id: file.id,
      filename: file.filename,
      size: formatByteSize(file.bytes),
      contentType: file.contentType,
    }));
    const out: ChatTurn = {
      id: turn.id,
      prompt: turn.prompt,
      promptTimestamp: formatTime(turn.sentAt),
      promptTimestampIso: turn.sentAt.toISOString(),
      promptAttachments: attachments,
      lanes: turn.lanes.map((lane, index) => toChatLane(lane, index, catalog)),
    };
    if (turn.promptRecordedTokens !== undefined) {
      out.promptUsage = {
        kind: "prompt",
        settlement: "settled",
        compression: null,
        compressionPercent: null,
        promptTokens: formatNumber(turn.promptRecordedTokens),
        tokens: null,
        cost: null,
        estimated: false,
        messageId: null,
        security: null,
      };
    }
    return out;
  });
}

/* ─── Conversations ─────────────────────────────────────────────────────── */

/** One model name, or "N models" for a comparison. */
function conversationModel(
  modelIds: readonly string[]
): Pick<ChatConversation, "modelLabel" | "model"> {
  if (modelIds.length > 1) {
    return { modelLabel: `${modelIds.length} models`, model: null };
  }
  const modelId = modelIds[0];
  if (!modelId) {
    return { modelLabel: null, model: null };
  }
  const slash = modelId.indexOf("/");
  return {
    modelLabel: modelName(modelId),
    model: {
      id: modelId,
      provider: slash > 0 ? modelId.slice(0, slash) : UNAVAILABLE,
    },
  };
}

/** The live conversation state the page renders: the seed plus this
 *  session's in-memory edits (see `chat-store.ts`). */
export interface ChatConversationInput {
  memoryToolsEnabled: boolean | null;
  modelIds: readonly string[];
  seed: ChatSeedConversation;
  title: string;
}

/** "yesterday" -> "Yesterday"; a label that starts with a digit is unchanged. */
function sentenceCase(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function toChatConversation(
  input: ChatConversationInput,
  catalog: ChatModelCatalog,
  now: Date = new Date()
): ChatConversation {
  return {
    id: input.seed.id,
    title: input.title,
    // Sentence case ("Yesterday", not Intl's "yesterday"): the header and
    // the rail both print it.
    updatedLabel: sentenceCase(formatRelative(lastActivity(input.seed), now)),
    ...conversationModel(input.modelIds),
    memoryToolsEnabled: input.memoryToolsEnabled,
    turns: toChatTurns(input.seed, catalog),
  };
}

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

function startOfPreviousDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - 1
  ).getTime();
}

/** Sidebar grouping, on calendar day, not a rolling 24h window. */
export function groupConversationsByRecency(
  inputs: readonly ChatConversationInput[],
  catalog: ChatModelCatalog,
  now: Date = new Date()
): ChatConversationGroup[] {
  const today: ChatConversation[] = [];
  const yesterday: ChatConversation[] = [];
  const earlier: ChatConversation[] = [];
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfPreviousDay(now);
  const ordered = [...inputs].sort(
    (a, b) => lastActivity(b.seed).getTime() - lastActivity(a.seed).getTime()
  );
  for (const input of ordered) {
    const day = startOfDay(lastActivity(input.seed));
    const summary = { ...toChatConversation(input, catalog, now), turns: [] };
    if (day === todayStart) {
      today.push(summary);
    } else if (day === yesterdayStart) {
      yesterday.push(summary);
    } else {
      earlier.push(summary);
    }
  }
  const groups: ChatConversationGroup[] = [];
  if (today.length > 0) {
    groups.push({ label: "Today", conversations: today });
  }
  if (yesterday.length > 0) {
    groups.push({ label: "Yesterday", conversations: yesterday });
  }
  if (earlier.length > 0) {
    groups.push({ label: "Earlier", conversations: earlier });
  }
  return groups;
}

/** The stats popover's session totals, summed from the conversation's own
 *  lanes. No BYOK key routes Gate Chat, so cost is always Gate-metered. */
export function chatConversationTotals(
  seed: ChatSeedConversation
): ChatConversationTotals {
  const totals = conversationTotals(seed);
  return { ...totals, isByok: false };
}

/* ─── Credits ───────────────────────────────────────────────────────────── */

/** The credit balance is the Billing ledger's newest running balance, the
 *  same number the Credits card shows. Pro is the plan entitlement: Pro and
 *  Enterprise hold it, Free and Default do not. No low-balance threshold is
 *  configured anywhere in this build, so the balance is never low and the
 *  once-per-crossing latch never set. */
export function chatCredits(pathname: string): ChatCredits {
  const pro = !(isFreeSurface(pathname) || isDefaultSurface(pathname));
  return {
    balance: formatExactUsd(CREDIT_BALANCE_USD),
    low: false,
    pro,
    notified: false,
  };
}

/* ─── Export ────────────────────────────────────────────────────────────── */

/** Exports carry the messages and model names only, never credentials or
 *  Gate internals (the dialog's own promise). Built in the browser: this
 *  build has no export worker. */
export function exportConversation(
  conversation: ChatConversation,
  format: "markdown" | "json"
): string {
  if (format === "json") {
    return JSON.stringify(
      {
        title: conversation.title,
        turns: conversation.turns.map((turn) => ({
          prompt: turn.prompt,
          sentAt: turn.promptTimestampIso ?? null,
          answers: turn.lanes.map((lane) => ({
            model: lane.model.label,
            modelId: lane.model.id,
            state: lane.state,
            content: lane.body,
          })),
        })),
      },
      null,
      2
    );
  }
  const lines: string[] = [`# ${conversation.title}`, ""];
  for (const turn of conversation.turns) {
    lines.push(`## ${CHAT_COPY.you}`, "", turn.prompt, "");
    for (const lane of turn.lanes) {
      lines.push(`## ${lane.model.label}`, "", lane.body || "", "");
    }
  }
  return lines.join("\n");
}
