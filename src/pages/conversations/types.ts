/**
 * Shared Conversations types. Extracted from Conversations.tsx so the data
 * layer (conversations.ts, conversationDetail.ts), the page, and the split
 * component files all import types from one leaf module — this also breaks the
 * former page<->data-module type cycle. Types only; imports nothing from pages.
 */

import type * as React from "react";
import type { Vendor } from "@/components/icons/vendor-meta";
import type { MessageRole } from "@/components/ui/message-block";

export type ConversationStatus = "active" | "completed" | "failed";

export type ModelId =
  | "claude-opus-4-8"
  | "claude-opus-4-7"
  | "claude-sonnet-4-5"
  | "claude-haiku-4-5"
  | "gpt-5"
  | "gpt-5.3-codex"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gemini-3-pro"
  | "gemini-3-flash"
  | "gemini-3-flash-lite"
  | "llama-3-3-70b";

export type ConversationRow = {
  title: string;
  conversationId: string;
  initiator: string;
  turns: number;
  reqs: number;
  vendors: Vendor[];
  models: ModelId[];
  inTokens: string;
  outTokens: string;
  cost: string;
  status: ConversationStatus;
  updated: Date;
  /** Conversation duration ("3m 53s") — surfaced in the detail sheet KPI rail. */
  duration: string;
};

export type ConversationMessage = {
  role: MessageRole;
  tool?: string;
  body: React.ReactNode;
  time: string;
  requestId?: string;
};

export type TraceStatus = "success" | "warn" | "danger";

export type TraceEvent = {
  id: string;
  vendor: Vendor;
  model: string;
  label: string;
  /** "tool" = wrench glyph in the timeline node; everything else gets the
   *  reasoning glyph (Activity wave). Drives icon choice only — status is
   *  separate. */
  kind: "tool" | "reason";
  status: TraceStatus;
  warnNote?: string;
  /** Finding chip: category label (e.g. "PII") plus the action verb. Set when
   * a detector fired on this request, regardless of HTTP status. */
  finding?: string;
  findingAction?: "Flag" | "Redact" | "Block";
  /** Tokens in (e.g. "1.2k"). Mono tabular when rendered. */
  inTokens: string;
  /** Tokens out (e.g. "184"). */
  outTokens: string;
  /** Wall-clock latency for this single request (e.g. "1240ms"). Slow rows
   *  (>1000ms) paint warning-tinted in the data line per the codified
   *  slow-row indicator policy. */
  latency: string;
  /** Per-request cost (e.g. "$0.0012"). Sums across the trace ≈ row.cost. */
  cost: string;
  time: string;
  requestId: string;
};

export type TraceRenderItem =
  | { kind: "event"; event: TraceEvent }
  | { kind: "separator"; id: string; count: number };
