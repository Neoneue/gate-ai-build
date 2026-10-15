import type {
  ChatSeedAttachment,
  ChatSeedConversation,
  ChatSeedLane,
  ChatSeedTurn,
} from "@/data/gate-chat";
import type { ChatMemory } from "@/pages/chat/contract";
import type { OnboardingChatState } from "@/pages/onboarding/onboarding-chat-store";

/* ─── The onboarding chat history, shared across tabs (owner 2026-10-14) ────
 * "Any Gate Chat usage while on an onboarding session adds to it": a
 * message sent in a Gate Chat tab (the desktop chat opens in a new tab,
 * "Try Gate Chat instead" too) reaches the workspace's data pages in the
 * setup tab. So the onboarding chat store (`onboarding-chat-store.ts`) is
 * mirrored to localStorage under one key and read back by the other tabs (a
 * `storage` event), the pattern of the shared setup state
 * (`onboarding-shared-setup.ts`). Its lifetime is the onboarding run's: a
 * fresh run (OnboardingProvider) clears it with the shared setup state.
 *
 * What is stored: everything but the reply being written (`live`) and its
 * turn, which joins once it settles, so no tab counts a half-written reply.
 * Sets are stored as arrays and dates as ISO strings. Parsing is
 * shape-checked: a field of the wrong type falls back to its empty value and
 * an invalid conversation is dropped, so a stale or edited entry never
 * reaches the pages.
 * ───────────────────────────────────────────────────────────────────────── */

export const ONBOARDING_CHAT_KEY = "gate-onboarding-chat-state";

/** Bumped when the stored shape changes: an older entry is ignored. */
const STORED_VERSION = 1;

/** The persisted part of the store: everything but `live`. */
export type StoredOnboardingChat = Omit<OnboardingChatState, "live">;

/** The send still being written, left out of what is stored. */
export type PendingTurn = { conversationId: string; turnId: string };

/** The state as stored, without the pending turn (and without its
 *  conversation when that turn is its only one). */
export function serializeOnboardingChat(
  state: OnboardingChatState,
  pending: PendingTurn | null
): string {
  let { scripted, conversationIds, setupLinkTurnIds } = state;
  const conversation = pending ? scripted[pending.conversationId] : undefined;
  if (pending && conversation) {
    const turns = conversation.turns.filter((t) => t.id !== pending.turnId);
    const { [pending.conversationId]: _omitted, ...rest } = scripted;
    scripted =
      turns.length > 0
        ? { ...rest, [pending.conversationId]: { ...conversation, turns } }
        : rest;
    if (turns.length === 0) {
      conversationIds = conversationIds.filter(
        (id) => id !== pending.conversationId
      );
    }
    setupLinkTurnIds = new Set(
      [...setupLinkTurnIds].filter((id) => id !== pending.turnId)
    );
  }
  return JSON.stringify({
    v: STORED_VERSION,
    computerPrompt: state.computerPrompt,
    conversationIds,
    deletedIds: [...state.deletedIds],
    favorites: [...state.favorites],
    memories: state.memories,
    memoryOverrides: state.memoryOverrides,
    memoryToolsEnabled: state.memoryToolsEnabled,
    modelIds: state.modelIds,
    scripted,
    setupLinkSent: state.setupLinkSent,
    setupLinkTurnIds: [...setupLinkTurnIds],
    titles: state.titles,
  });
}

/* ─── Parsing ───────────────────────────────────────────────────────────── */

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const numberOrNull = (value: unknown): number | null | undefined =>
  value === null || typeof value === "number" ? value : undefined;

const stringOrNull = (value: unknown): string | null | undefined =>
  value === null || typeof value === "string" ? value : undefined;

const dateOf = (value: unknown): Date | null => {
  if (typeof value !== "string") {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** A record whose values all pass `pick`; others are dropped. */
function recordOf<T>(
  value: unknown,
  pick: (item: unknown) => T | undefined
): Record<string, T> {
  if (!isRecord(value)) {
    return {};
  }
  const out: Record<string, T> = {};
  for (const [key, item] of Object.entries(value)) {
    const picked = pick(item);
    if (picked !== undefined) {
      out[key] = picked;
    }
  }
  return out;
}

const SETTLEMENTS = new Set(["pending", "settled", "unavailable"]);
const LANE_STATES = new Set(["complete", "stopped", "failed"]);

function laneOf(value: unknown): ChatSeedLane | null {
  if (!isRecord(value)) {
    return null;
  }
  const answeredAt = dateOf(value.answeredAt);
  const promptTokens = numberOrNull(value.promptTokens);
  const completionTokens = numberOrNull(value.completionTokens);
  const compressionSavedTokens = numberOrNull(value.compressionSavedTokens);
  const gateRequestId = stringOrNull(value.gateRequestId);
  if (
    typeof value.id !== "string" ||
    typeof value.modelId !== "string" ||
    typeof value.body !== "string" ||
    answeredAt === null ||
    promptTokens === undefined ||
    completionTokens === undefined ||
    compressionSavedTokens === undefined ||
    gateRequestId === undefined ||
    !SETTLEMENTS.has(String(value.settlement)) ||
    !LANE_STATES.has(String(value.state))
  ) {
    return null;
  }
  return {
    id: value.id,
    answeredAt,
    body: value.body,
    completionTokens,
    compressionSavedTokens,
    gateRequestId,
    modelId: value.modelId,
    promptTokens,
    settlement: value.settlement as ChatSeedLane["settlement"],
    state: value.state as ChatSeedLane["state"],
  };
}

function turnOf(value: unknown): ChatSeedTurn | null {
  if (!isRecord(value)) {
    return null;
  }
  const sentAt = dateOf(value.sentAt);
  const lanes = Array.isArray(value.lanes) ? value.lanes.map(laneOf) : [];
  if (
    typeof value.id !== "string" ||
    typeof value.prompt !== "string" ||
    sentAt === null ||
    lanes.length === 0 ||
    lanes.some((lane) => lane === null)
  ) {
    return null;
  }
  // The files sent with the prompt (owner 2026-10-15); a malformed entry
  // is dropped, never the turn.
  const attachments = Array.isArray(value.attachments)
    ? value.attachments.map(attachmentOf).filter((a) => a !== null)
    : [];
  return {
    id: value.id,
    prompt: value.prompt,
    sentAt,
    attachments,
    lanes: lanes as ChatSeedLane[],
  };
}

function attachmentOf(value: unknown): ChatSeedAttachment | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.filename !== "string" ||
    typeof value.contentType !== "string" ||
    typeof value.bytes !== "number" ||
    !Number.isFinite(value.bytes) ||
    value.bytes < 0
  ) {
    return null;
  }
  return {
    id: value.id,
    filename: value.filename,
    contentType: value.contentType,
    bytes: value.bytes,
  };
}

function conversationOf(value: unknown): ChatSeedConversation | undefined {
  if (!isRecord(value)) {
    return;
  }
  const turns = Array.isArray(value.turns) ? value.turns.map(turnOf) : [];
  const memoryToolsEnabled =
    value.memoryToolsEnabled === null ||
    typeof value.memoryToolsEnabled === "boolean"
      ? value.memoryToolsEnabled
      : undefined;
  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    memoryToolsEnabled === undefined ||
    turns.length === 0 ||
    turns.some((turn) => turn === null)
  ) {
    return;
  }
  return {
    id: value.id,
    title: value.title,
    modelIds: strings(value.modelIds),
    memoryToolsEnabled,
    turns: turns as ChatSeedTurn[],
  };
}

function memoryOf(value: unknown): ChatMemory | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.key !== "string" ||
    typeof value.content !== "string" ||
    typeof value.enabled !== "boolean" ||
    stringOrNull(value.projectId) === undefined
  ) {
    return null;
  }
  return {
    id: value.id,
    key: value.key,
    content: value.content,
    enabled: value.enabled,
    projectId: value.projectId as string | null,
  };
}

function computerPromptOf(
  value: unknown
): OnboardingChatState["computerPrompt"] {
  return isRecord(value) &&
    typeof value.conversationId === "string" &&
    typeof value.afterTurnId === "string"
    ? { conversationId: value.conversationId, afterTurnId: value.afterTurnId }
    : null;
}

/** The stored chat, shape-checked. Null when nothing usable is stored. */
export function parseOnboardingChat(
  raw: string | null,
  defaults: { memoryToolsEnabled: boolean }
): StoredOnboardingChat | null {
  if (!raw) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || parsed.v !== STORED_VERSION) {
    return null;
  }
  const scripted = recordOf(parsed.scripted, conversationOf);
  return {
    computerPrompt: computerPromptOf(parsed.computerPrompt),
    conversationIds: strings(parsed.conversationIds),
    deletedIds: new Set(strings(parsed.deletedIds)),
    favorites: new Set(strings(parsed.favorites)),
    memories: Array.isArray(parsed.memories)
      ? parsed.memories.flatMap((m) => memoryOf(m) ?? [])
      : [],
    memoryOverrides: recordOf(parsed.memoryOverrides, (value) =>
      value === null || typeof value === "boolean" ? value : undefined
    ),
    memoryToolsEnabled:
      typeof parsed.memoryToolsEnabled === "boolean"
        ? parsed.memoryToolsEnabled
        : defaults.memoryToolsEnabled,
    modelIds: recordOf(parsed.modelIds, (value) =>
      Array.isArray(value) ? strings(value) : undefined
    ),
    scripted,
    setupLinkSent: parsed.setupLinkSent === true,
    setupLinkTurnIds: new Set(strings(parsed.setupLinkTurnIds)),
    titles: recordOf(parsed.titles, (value) =>
      typeof value === "string" ? value : undefined
    ),
  };
}

/** The highest sequence number in the stored ids (`chat_onboarding_3`,
 *  `turn_onboarding_3`, `mem_session_2`), so a tab that adopts another
 *  tab's history never reuses an id. */
export function highestSeq(ids: Iterable<string>, prefix: string): number {
  let max = 0;
  for (const id of ids) {
    if (id.startsWith(prefix)) {
      const n = Number.parseInt(id.slice(prefix.length), 10);
      if (Number.isFinite(n) && n > max) {
        max = n;
      }
    }
  }
  return max;
}
