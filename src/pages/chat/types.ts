/**
 * Presentational contract for the Gate Chat surface, ported verbatim from the
 * production site (`apps/dashboard-web/src/components/chat/types.ts`).
 *
 * Every numeric field is a pre-formatted string, so a `number` here would
 * invite a component to compute a value the UI has no authority over. `null`
 * means "unavailable" and must render as such, never as zero: zero is a claim
 * about billing, and an absent value is not that claim. `ChatUsage.settlement`
 * is the exception that proves it: a null the API is still recovering is not
 * unavailable either, and claiming it is would be the same kind of lie.
 *
 * In this build every value is derived from the seed module
 * `src/data/gate-chat.ts`; nothing here is fetched.
 */

import type { Capability } from "@/data/models";
import type {
  ChatModelUnavailableReason,
  ChatSecurityCategory,
  ChatSecurityVerdict,
  ChatUsageSettlement,
} from "./contract";

export interface ChatModel {
  available: boolean;
  /** The catalog's capability set, drawn as the same glyph strip the Models
   *  page draws. Empty is nothing probed. */
  capabilities: readonly Capability[];
  contextWindow: string;
  favorite: boolean;
  /** Gate `provider/model` identifier, e.g. `openai/gpt-4o-mini`. */
  id: string;
  /** True only when both catalog input and output prices are explicitly zero. */
  isFree?: boolean;
  label: string;
  /** ISO timestamp, or null if the caller has never used this model. Sort key only, never rendered. */
  lastUsedAt: string | null;
  price: string;
  provider: string;
  /** Only `true` lets the relay send the memory tools. */
  supportsTools: boolean | null;
  /** Only `true` lets an image reach this model. */
  supportsVision: boolean | null;
  /** WHY the model cannot be picked, so the row can say it instead of only
   *  dimming. Null whenever `available`. */
  unavailableReason: ChatModelUnavailableReason | null;
}

export interface ChatUsage {
  compression: string | null;
  /** Share of the prompt compression removed, already formatted (`"23.4%"`).
   *  `null` when it cannot be derived honestly, and the row falls back to the
   *  token counts rather than to a guess. */
  compressionPercent?: string | null;
  cost: string | null;
  /** Estimates carry a visible disclosure; authoritative values do not. */
  estimated: boolean;
  /** Which row this is. A prompt row carries tokens only: the cost of a turn is the lane's, and
   *  showing it twice would read as two charges. */
  kind: "prompt" | "response";
  /** No id means no Gate record yet, so no **Details** link. */
  messageId: string | null;
  /** Tokens the prompt cost, shown beside the completion so neither reads as the other. */
  promptTokens: string | null;
  /** What the security pipeline did to this turn, and what for. `null` is the
   *  ordinary case (allowed, or never screened) and must render as nothing at
   *  all. */
  security: {
    verdict: ChatSecurityVerdict;
    category: ChatSecurityCategory | null;
  } | null;
  /** Whether the settle-owned figures (cost, compression) are final. `pending` renders as calculating,
   *  never as unavailable: the figure is on its way. */
  settlement: ChatUsageSettlement;
  /** Completion tokens. */
  tokens: string | null;
}

/** A file sent on the prompt. */
export interface ChatAttachment {
  /** Drives the "not sent to the model" chip: only text types reach the prompt. */
  contentType: string;
  filename: string;
  id: string;
  size: string;
}

export type ChatLaneState = "complete" | "streaming" | "stopped" | "failed";

export type ChatLaneMemoryAction = "remembered" | "forgotten";

/** A memory tool call the model made on this lane. */
export interface ChatLaneMemory {
  action: ChatLaneMemoryAction;
  key: string;
}

/** What THIS lane's model was given of the turn's attachments. Lanes of one
 *  comparison can differ: an image rides the lanes whose model reads images
 *  and is withheld from the ones that cannot. Absent means nothing was
 *  reported, which is never the same claim as an empty `deliveredIds`. */
export interface ChatLaneAttachments {
  deliveredIds: string[];
  omittedIds: string[];
}

export interface ChatLane {
  /** Present only on a lane the server sent an `attachments` frame for. */
  attachments?: ChatLaneAttachments;
  body: string;
  /** Present only on `failed`; explains the problem and the next safe action. */
  error?: string;
  /** The persisted row id. `null` means no row exists yet; retry and stop
   *  must not be offered until it does. */
  id: string | null;
  /** Zero-based comparison position. */
  lane?: number;
  /** Present only on a lane whose model called a memory tool. */
  memories?: ChatLaneMemory[];
  /** The model that answered, which may differ from the one requested. */
  model: ChatModel;
  requestedModelId: string;
  state: ChatLaneState;
  timestamp: string;
  /** ISO timestamp for the semantic `<time>` value; display text stays localized. */
  timestampIso?: string;
  usage: ChatUsage;
}

export interface ChatTurn {
  id: string;
  /** One lane is a single-model answer; two lanes are a comparison. */
  lanes: ChatLane[];
  prompt: string;
  /** What was sent with the prompt. One set for the whole turn. */
  promptAttachments: ChatAttachment[];
  promptTimestamp: string;
  /** ISO timestamp for the semantic `<time>` value. */
  promptTimestampIso?: string;
  /** Authoritative usage for the submitted prompt, when Gate recorded it. */
  promptUsage?: ChatUsage;
}

export interface ChatConversation {
  /** `null` for an unsaved conversation: the title renders unlinked. */
  id: string | null;
  /** Per-conversation override of the user's memory tool setting; `null` inherits. Absent for an unsaved conversation. */
  memoryToolsEnabled?: boolean | null;
  /** The single model this conversation is routed to, enough to draw its
   *  provider. `null` for a comparison, which has no one model. */
  model?: Pick<ChatModel, "id" | "provider"> | null;
  /** Compact routing context for history rows: one model name or "N models". */
  modelLabel: string | null;
  projectId?: string;
  title: string;
  turns: ChatTurn[];
  updatedLabel: string;
}

export interface ChatConversationGroup {
  conversations: ChatConversation[];
  label: string;
}

export interface ChatCredits {
  balance: string;
  low: boolean;
  /** The once-per-crossing latch: set on the debit that crosses the
   *  threshold, cleared by a top-up. */
  notified: boolean;
  /** True only for a known-active Pro entitlement. */
  pro: boolean;
}

export type ChatNoticeTone = "info" | "warning" | "danger";

export interface ChatNotice {
  action?: { label: string; href: string };
  text: string;
  tone: ChatNoticeTone;
}

/** Session totals for the conversation stats popover. Every field derives
 *  from the conversation's own lanes. */
export interface ChatConversationTotals {
  completionTokens: number;
  compressionPct: number | null;
  isByok: boolean;
  promptTokens: number;
  totalCostUsd: number;
  totalRequests: number;
  totalTurns: number;
}
