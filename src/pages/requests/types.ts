/** Shared type declarations for the Requests (Messages) page and its
 *  extracted sub-modules. Pure types — no runtime. */
import type { Vendor } from "@/components/icons/vendor-meta";
import type { RequestFinding } from "@/data/requests";

export type RangeKey = "all" | "24h" | "7d" | "30d" | "custom";

/** Concrete custom range payload — populated by RequestsTableSection's
 *  DateRangePicker and read by HeroMetricCard via useRange() / the store.
 *  Kept on the store (not in React context) so siblings (Hero + Table)
 *  share state without lifting through Requests(). */
export type CustomRange = { from: Date; to: Date };

export type HeroView = {
  eyebrow: string;
  total: number;
  success: number;
  errors: number;
  delta: string;
  deltaNote: string;
  data: Array<{ time: string; label: string; requests: number }>;
  ticks: string[];
  bucketLabel: string;
  domainTop: number;
};

/** Two orthogonal axes per CTO direction (Marcus, 2026-05-12):
 *    `status`    — HTTP response outcome (did the provider respond OK?)
 *    `guardrail` — gateway action (did our guardrails intervene?)
 *  The previous five-value RequestStatus conflated these. The five valid
 *  combinations in current mock data are:
 *    success | allow   — common case, 200 with no gateway action
 *    error   | allow   — upstream provider failed, gateway passive
 *    error   | block   — gateway rejected before the provider was hit
 *    success | flag    — gateway flagged but allowed through (200)
 *    success | redact  — gateway stripped PII, provider returned 200
 *  `slow` is orthogonal to both and renders on the Latency column. */
export type ResponseStatus = "success" | "error";
export type GuardrailAction = "allow" | "flagged" | "redacted" | "block";

/** Which guardrail check fired for non-`allow` rows. Maps 1:1 to the
 *  five runtime checks rendered in the modal's Audit tab so the row's
 *  guardrail action and the failing/flagging check stay in lock-step. */
export type GuardrailReason = "injection" | "pii" | "credential";

export type RequestRow = {
  /** Compact month/day for the cell ("May 12"); modal pairs it with 2026
   *  for the full header. Per-row so 24H/7D/30D ranges that span multiple
   *  days render the correct date next to each timestamp. */
  day: string;
  time: string;
  /** Human-friendly relative time ("just now", "2m ago"). The cell renders
   *  this as the primary scan target above the absolute date+time. */
  relative: string;
  /** HTTP response outcome: did the provider return OK or fail? */
  status: ResponseStatus;
  /** Gateway action: what did our guardrails do with this request? */
  guardrail: GuardrailAction;
  code: string;
  vendor: Vendor;
  model: string;
  conversation: string;
  keyId: string;
  inTokens: string;
  outTokens: string;
  /** Latency in seconds. Stored as string with the `s` suffix already
   *  attached so we can render typographic emphasis on slow values. */
  latency: string;
  /** True when this request crossed the 1s "slow" threshold. */
  slow?: boolean;
  cost: string;
  /** Optional per-row compression override. When set, it wins over the
   *  derived `compressionValue` (e.g. an error response that produced no
   *  output reads as 100.0%). */
  compression?: string;
  /** Which guardrail check fired. Set for `block`, `flag`, and `redact`
   *  rows; absent for plain `allow`. Drives the matching check state on
   *  the modal's Audit tab so the row and the modal stay in lock-step. */
  guardrailReason?: GuardrailReason;
  /** Canonical `req_*` id. Optional so legacy rows compile without
   *  changes — when absent the modal computes a fallback from the
   *  conversation + code so display still works. Set on rows that need
   *  to be deep-linkable from Security events. */
  requestId?: string;
  /** Rich finding detail for the v2 Findings modal. When present this is the
   *  source of truth (overrides the single derived finding). */
  findings?: RequestFinding[];
  /** Conversation-script content. `summary` is the trace step label. The
   * message bodies themselves (userMessage / assistantResponse / toolArgs /
   * toolResult / requestBodyRaw / errorBody) live in
   * `@/data/request-bodies` keyed by requestRowId — heavy strings split out
   * so the eager requests module stays light. */
  summary?: string;
  traceKind?: "tool" | "reason";
  /** Provider/upstream failure attribution (mirrors the gateway's
   * error_source / error_code columns). Present only on rows the gateway
   * recorded as a non-policy error; drives the Details-tab Error response card
   * (origin badge + explanation + body). Absent on success and block rows. */
  errorSource?: string;
  errorCode?: string;
  /** Human-readable detail line for the failure (the gateway's `error_detail`).
   * Shown as a text field under the User message on the detail card for
   * provider errors. */
  errorDetail?: string;
  /** Tool-call rows (traceKind === 'tool'): the tool name (e.g. 'Bash').
   * Args/result text live in `@/data/request-bodies`. */
  toolName?: string;
};

export type CheckStatus = "pass" | "flag" | "redact" | "block";
export type CheckKey = "injection" | "pii" | "credential";
