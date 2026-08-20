/** Pure data + helpers for the Requests (Messages) page: sort keys,
 *  badge variant maps, filter options, and the per-range row sets.
 *  No JSX, no React — shared by the page, table, and detail modal. */
import type { Vendor } from "@/components/icons/vendor-meta";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { MODEL_OPTIONS, modelName } from "@/data/models";
import {
  REQUEST_ROWS_7D,
  REQUEST_ROWS_24H,
  REQUEST_ROWS_30D,
  REQUEST_ROWS_ALL,
} from "@/data/requests";
import { parseNumeric } from "@/hooks/use-table-sort";
import type { GuardrailAction, RequestRow, ResponseStatus } from "./types";

export const MONTH_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};
/** Chronological sort key from row.day ("May 12") + row.time ("02:04:11").
 *  No real timestamp on the row, so compose a monotonic number. */
export function rowTimeValue(row: RequestRow): number {
  const [mon, day] = row.day.split(" ");
  const [h = 0, m = 0, s = 0] = row.time.split(":").map(Number);
  return (
    ((MONTH_INDEX[mon] ?? 0) * 31 + Number(day ?? 0)) * 86_400 +
    h * 3600 +
    m * 60 +
    s
  );
}

/** Comparable value per sortable column for the Recent requests table.
 *  Numeric columns parse out $/commas/units; em-dash values → null (sort last). */
export function requestSortValue(
  row: RequestRow,
  key: string
): string | number | null {
  switch (key) {
    case "time":
      return rowTimeValue(row);
    case "status":
      return row.status;
    case "guardrail":
      return row.guardrail;
    case "model":
      // Sort on the label the eye reads, not the stored id — same rule the
      // `conversation` case follows one line down. Sorting the raw id would
      // group by vendor prefix, which is not what the column shows first.
      return modelName(row.model);
    case "conversation":
      return conversationTitle(row.conversation) || row.conversation;
    // NOTE: no `message` case. The Message column's value comes from the
    // request BODY (see ./message-preview), and pulling that module in here
    // would drag ~440 KB of transcripts onto every route that imports this
    // file — including Alerts, via `alerts/view.ts`. RequestsTable wraps this
    // accessor to add `message` locally, so the weight stays on /messages.
    case "keyId":
      return row.keyId;
    case "inTokens":
      return parseNumeric(row.inTokens);
    case "outTokens":
      return parseNumeric(row.outTokens);
    case "latency":
      return parseNumeric(row.latency);
    default:
      return null;
  }
}

// Conversation titles, sourced from CONVERSATION_ROWS (single source of truth).
// Looked up lazily at render time only: Conversations.tsx imports
// REQUEST_ROWS_RECENT from this module, so reading CONVERSATION_ROWS during
// module evaluation would race the import cycle. First call lands on render,
// after both modules have initialized.
let _conversationTitles: Record<string, string> | null = null;
export function conversationTitle(id: string): string | undefined {
  if (!_conversationTitles) {
    _conversationTitles = {};
    for (const c of CONVERSATION_ROWS) {
      _conversationTitles[c.conversationId] = c.title;
    }
  }
  return _conversationTitles[id];
}

export const RANGE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

/** Response axis — HTTP outcome from the provider. Pure 2-value mapping;
 *  `slow` short-circuits this in `responseVariant` below. */
export const RESPONSE_BADGE: Record<
  ResponseStatus,
  { variant: "success" | "destructive" }
> = {
  success: { variant: "success" },
  error: { variant: "destructive" },
};

/** Guardrail axis — what the gateway DID with the request. `allow` is
 *  the silent default and the table cell renders it as a faint dash
 *  rather than a green badge so the column doesn't drown in noise. */
export const GUARDRAIL_BADGE: Record<
  GuardrailAction,
  {
    variant: "success" | "warning" | "neutral" | "destructive" | "info";
  }
> = {
  // `allow` is the common case (~75% of rows in mock data). Keeping it on
  // `neutral` (gray) instead of `success` (green) avoids doubling-up with
  // the Status column's success badges and lets `flagged` / `redacted` /
  // `blocked` carry the colored signal in this column.
  allow: { variant: "neutral" },
  flagged: { variant: "warning" },
  redacted: { variant: "warning" },
  block: { variant: "destructive" },
};

// Model options for the Filters modal Select. Derived from the catalog rather
// than authored, so the dropdown can never offer a model the gateway does not
// serve — the failure this list had until 2026-08-03, when it listed four
// models (gpt-5.1, llama-4.2-405b, grok-4.1-fast, mistral-large-3) that
// existed nowhere else in the app. Restricted to the models that actually
// carry traffic in REQUEST_ROWS_ALL: a filter option that can only ever return
// zero rows is worse than no option. Each carries its vendor so the item
// renders the brand icon (VendorAvatar) on the left, matching Conversations.
export const MODEL_FILTER_OPTIONS: {
  value: string;
  label: string;
  vendor: Vendor;
}[] = (() => {
  const used = new Set(REQUEST_ROWS_ALL.map((r) => r.model));
  return MODEL_OPTIONS.filter((m) => used.has(m.handle)).map((m) => ({
    value: m.handle,
    label: m.label,
    vendor: m.vendor,
  }));
})();

/** Status cell label. Returns the raw HTTP outcome (success / error) —
 *  slow rows show Success here per CTO direction (2026-05-20). Slow is
 *  surfaced separately via the latency-cell TriangleAlert + ink tint,
 *  and the underlying `row.slow` boolean still drives that visual + the
 *  Response filter's "Slow > 10s" option. */
export function responseLabel(row: RequestRow): string {
  return row.status;
}

/** Provider wire-format endpoint for a given model vendor. Surfaces in the
 *  modal Details tab so a `deepseek/deepseek-v4-pro` row doesn't read as if it
 *  went through Anthropic's `/v1/messages`. Anchor strings sit here; the
 *  principle of "derive from row" is anchored in CLAUDE.md's no-synthetic-data
 *  rule.
 *
 *  Deliberately still complete after the 2026-08-03 catalog reconciliation.
 *  Only five vendors (anthropic / google / deepseek / qwen / moonshotai) now
 *  carry request rows, but `Vendor` stays a complete union — `openai` is still
 *  live on the BYOK "Works with" surfaces — and a `Record<Vendor, string>`
 *  must therefore stay exhaustive. Pruning the map is one edit with the union,
 *  never before it. */
export const VENDOR_ENDPOINT: Record<Vendor, string> = {
  anthropic: "/v1/messages",
  openai: "/v1/chat/completions",
  google: "/v1beta/models/{model}:generateContent",
  xai: "/v1/chat/completions",
  meta: "/v1/chat/completions",
  mistral: "/v1/chat/completions",
  deepseek: "/v1/chat/completions",
  cohere: "/v2/chat",
  // Added 2026-08-03 with the Models rebuild, which widened `Vendor` by two.
  // Both serve an OpenAI-compatible surface (Alibaba Model Studio, Moonshot
  // open platform), so neither needs a bespoke wire format.
  moonshotai: "/v1/chat/completions",
  qwen: "/v1/chat/completions",
};

/** Upstream API host per vendor — the thing the gateway actually forwards to.
 *  The Provider row on the message detail surface shows this rather than the
 *  brand name from `VENDOR_META` (changed 2026-08-20): the row sits directly
 *  above Endpoint, and host + path together read as the one real destination.
 *  These are each vendor's documented public API host. Exhaustive over
 *  `Vendor` for the same reason VENDOR_ENDPOINT is — the two move together. */
export const VENDOR_HOST: Record<Vendor, string> = {
  anthropic: "api.anthropic.com",
  openai: "api.openai.com",
  google: "generativelanguage.googleapis.com",
  xai: "api.x.ai",
  meta: "api.llama.com",
  mistral: "api.mistral.ai",
  deepseek: "api.deepseek.com",
  cohere: "api.cohere.com",
  moonshotai: "api.moonshot.ai",
  // Alibaba Model Studio's international endpoint, matching the OpenAI-
  // compatible surface the endpoint map above assumes.
  qwen: "dashscope-intl.aliyuncs.com",
};

export function responseVariant(row: RequestRow): "success" | "destructive" {
  return RESPONSE_BADGE[row.status].variant;
}

// Per-range row set + pagination total. Pill drives both — total reflects
// the headline volume for the window — totals are sourced from
// HERO_VIEWS so the hero card and the pagination footer can never drift.
// Rows shown are the head of the range; pagination represents the full
// count.
export const RANGE_ROWS: Record<string, RequestRow[]> = {
  all: REQUEST_ROWS_ALL,
  "24h": REQUEST_ROWS_24H,
  "7d": REQUEST_ROWS_7D,
  "30d": REQUEST_ROWS_30D,
  // Mock-only: reuse the longest cumulative set rather than actually
  // filtering by date. RequestsTableSection swaps to a derived total
  // (from the custom hero view) when the user picks a range, so the
  // pagination footer stays plausible even though the rows themselves
  // aren't filtered.
  custom: REQUEST_ROWS_ALL,
};
