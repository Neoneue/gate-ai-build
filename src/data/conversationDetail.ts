// Per-conversation single source of truth.
//
// A conversation OWNS its request rows; the detail surfaces (trace, messages,
// KPI rail, finding banner, step-tab counts) and the list aggregates all derive
// from that one set. Mirrors the live linking model: request.sessionId ===
// session.id, the Request Trace IS that request list, the Messages panel is its
// turns, and the KPIs are aggregates of the same set. Mock-data only — no
// backend, no fetch, no DB.
//
// Leaf module: it imports TYPES only from the page modules (erased at compile
// time, so no runtime import cycle) plus the pure `requestRowId` helper. It
// never reads CONVERSATION_ROWS or REQUEST_ROWS_* at module scope; callers pass
// the request rows in, and derivation runs at render time.

import { getRequestBody } from "@/data/request-bodies";
import { requestRowId } from "@/data/requests";
import type {
  ConversationMessage,
  ConversationRow,
  ConversationStatus,
  TraceEvent,
  TraceStatus,
} from "@/pages/conversations/types";
import type { RequestRow } from "@/pages/Requests";

// ── number / format helpers ────────────────────────────────────────────────
const toInt = (s: string): number =>
  Number.parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;
const toMoney = (s: string): number =>
  Number.parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
const fmtInt = (n: number): string => n.toLocaleString("en-US");
const fmtCost = (n: number): string => `$${n.toFixed(4)}`;

// Finding chip label (category) + action verb (guardrail), for the trace.
const FINDING_LABEL: Record<string, string> = {
  pii: "PII",
  credential: "Credential",
  injection: "Injection",
};
const FINDING_ACTION: Record<string, "Flag" | "Redact" | "Block"> = {
  flagged: "Flag",
  redacted: "Redact",
  block: "Block",
};

// The Messages panel is a reconstruction from gateway logs, where PII and
// credentials were already redacted on ingress before the prompt reached the
// provider. Mirror that here: mask every user-role finding's verbatim match
// with the placeholder sent upstream, so a caught value is never re-exposed in
// the transcript and the bubble agrees with the request-detail redaction diff.
// Assistant bubbles carry no raw values (they narrate the redaction), so only
// the user body is masked. split/join does a literal global replace without
// regex-escaping the match (which holds '.', '@', '/').
function redactUserBody(row: RequestRow, body: string): string {
  if (!row.findings) {
    return body;
  }
  let out = body;
  for (const f of row.findings) {
    if (f.role === "user") {
      out = out.split(f.match).join(f.redactedAs);
    }
  }
  return out;
}

// Request latency is stored in seconds ("3.80s"); the trace row reads ms via
// parseInt(latency, 10), so normalise to a "<ms>ms" string here.
const toMsLatency = (latency: string): string => {
  const seconds = Number.parseFloat(latency);
  return Number.isNaN(seconds) ? latency : `${Math.round(seconds * 1000)}ms`;
};

// Gateway/guardrail outcome → trace node status. `danger` = errored request,
// `warn` = a policy finding (flagged / redacted), `success` = clean allow.
const traceStatusOf = (r: RequestRow): TraceStatus => {
  if (r.status === "error") {
    return "danger";
  }
  if (r.guardrail === "flagged" || r.guardrail === "redacted") {
    return "warn";
  }
  return "success";
};

// turns = assistant responses; can never exceed the request count.
const turnCount = (seed: ConversationRow, requestCount: number): number =>
  requestCount > 0 ? Math.min(seed.turns, requestCount) || 1 : 0;

// ── the owned set ───────────────────────────────────────────────────────────
// A conversation's requests, oldest-first. REQUEST_ROWS_ALL is reverse-chrono
// (most recent first), so a conversation's slice reversed reads chronologically.
export function getConversationRequests(
  conversationId: string,
  allRows: RequestRow[]
): RequestRow[] {
  return allRows.filter((r) => r.conversation === conversationId).reverse();
}

// ── list / KPI-rail aggregates (derived from the owned set) ──────────────────
export function getConversationView(
  seed: ConversationRow,
  allRows: RequestRow[]
): ConversationRow {
  const rows = getConversationRequests(seed.conversationId, allRows);
  const reqs = rows.length;
  const inTokens = fmtInt(rows.reduce((sum, r) => sum + toInt(r.inTokens), 0));
  const outTokens = fmtInt(
    rows.reduce((sum, r) => sum + toInt(r.outTokens), 0)
  );
  // BYOK sessions can't be metered (cost '—' on every row); show '—' rather
  // than a misleading $0.0000 aggregate.
  const allByok = reqs > 0 && rows.every((r) => r.cost.trim() === "—");
  const cost = allByok
    ? "—"
    : fmtCost(rows.reduce((sum, r) => sum + toMoney(r.cost), 0));
  const status: ConversationStatus =
    reqs > 0 && rows.every((r) => r.status === "error")
      ? "failed"
      : seed.status;
  return {
    ...seed,
    reqs,
    turns: turnCount(seed, reqs),
    inTokens,
    outTokens,
    cost,
    status,
  };
}

// ── detail body (trace + messages) ──────────────────────────────────────────
export type ConversationDetail = {
  trace: TraceEvent[];
  messages: ConversationMessage[];
};

export function getConversationDetail(
  seed: ConversationRow,
  allRows: RequestRow[]
): ConversationDetail {
  const rows = getConversationRequests(seed.conversationId, allRows);

  // Stable, unique cross-highlight id per step. The raw requestId can repeat
  // across rows that lack one, so the index disambiguates. Internal only — the
  // footer "View Request" link still uses the row's own requestId.
  const stepId = (r: RequestRow, i: number): string =>
    `${requestRowId(r)}__${i}`;

  const trace: TraceEvent[] = rows.map((r, i) => {
    const status = traceStatusOf(r);
    return {
      id: stepId(r, i),
      vendor: r.vendor,
      model: r.model,
      label: r.summary ?? "reason",
      kind: r.traceKind ?? "reason",
      status,
      warnNote: status === "warn" ? r.guardrailReason : undefined,
      finding:
        r.guardrail !== "allow" && r.guardrailReason
          ? FINDING_LABEL[r.guardrailReason]
          : undefined,
      findingAction:
        r.guardrail === "allow" ? undefined : FINDING_ACTION[r.guardrail],
      inTokens: r.inTokens,
      outTokens: r.outTokens,
      latency: toMsLatency(r.latency),
      cost: r.cost,
      time: `${r.day}, ${r.time}`,
      requestId: requestRowId(r),
    };
  });

  // Messages: the opening user turn (= the conversation's first message, its
  // title) then one bubble per request carrying that step's id, so each bubble
  // cross-highlights with its trace step. `turns` of them are assistant
  // responses (spread evenly, ending on the final answer); the rest are
  // intermediate tool steps. Lean rows carry no tool names, so tool steps use
  // the generic tool label.
  const turns = turnCount(seed, rows.length);
  const assistantAt = new Set<number>();
  for (let k = 0; k < turns; k++) {
    assistantAt.add(Math.ceil(((k + 1) * rows.length) / turns) - 1);
  }

  // Script-backed conversations carry per-request user/assistant text, so we
  // render the real back-and-forth. Conversations without it fall back to the
  // opening title plus one derived bubble per request.
  const scripted = rows.some(
    (r) => getRequestBody(r).userMessage || r.toolName
  );

  const messages: ConversationMessage[] = scripted
    ? rows.flatMap((r): ConversationMessage[] => {
        const id = requestRowId(r);
        const time = `${r.day}, ${r.time}`;
        const body = getRequestBody(r);
        const out: ConversationMessage[] = [];
        if (body.userMessage) {
          out.push({
            role: "user",
            time,
            requestId: id,
            body: redactUserBody(r, body.userMessage),
          });
        }
        if (body.assistantResponse) {
          out.push({
            role: "assistant",
            time,
            requestId: id,
            body: body.assistantResponse,
          });
        }
        if (r.toolName) {
          out.push({
            role: "tool",
            tool: r.toolName,
            time,
            requestId: id,
            body: body.toolResult ?? "",
          });
        }
        return out;
      })
    : [
        {
          role: "user",
          time: rows[0] ? `${rows[0].day}, ${rows[0].time}` : "",
          body: seed.title,
        },
        ...rows.map((r, i): ConversationMessage => {
          const finding =
            r.guardrail === "allow" ? undefined : r.guardrailReason;
          const body =
            r.status === "error"
              ? `${r.model} request failed (${r.code})`
              : finding
                ? `${r.model} · ${r.guardrail} (${finding})`
                : `${r.model} · ${r.outTokens} tokens out`;
          return {
            role: assistantAt.has(i) ? "assistant" : "tool",
            time: `${r.day}, ${r.time}`,
            requestId: requestRowId(r),
            body,
          };
        }),
      ];

  return { trace, messages };
}
