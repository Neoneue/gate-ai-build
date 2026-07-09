/**
 * Conversation detail surface: the centered detail dialog and the shared
 * ConversationDetailBody (KPI rail + messages panel + request trace) it renders.
 * Extracted from Conversations.tsx. ConversationDetailBody is also rendered by
 * the ConversationsTrace page. KPI/messages subcomponents are private helpers.
 */
import { ExternalLink, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollHeader,
  DialogScrollSummary,
  DialogTitleBlock,
} from "@/components/ui/dialog";
import { Eyebrow } from "@/components/ui/eyebrow";
import { KpiRail as KpiRailShell } from "@/components/ui/kpi-rail";
import { MessageBlock } from "@/components/ui/message-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timestamp } from "@/components/ui/timestamp";
import { ToolResultCode } from "@/components/ui/tool-result-code";
import {
  getConversationDetail,
  getConversationView,
} from "@/data/conversationDetail";
import { REQUEST_ROWS_ALL } from "@/data/requests";
import { REDUCE_MOTION } from "@/lib/reduce-motion";
import { RequestTracePanel } from "./RequestTracePanel";
import type {
  ConversationMessage,
  ConversationRow,
  TraceEvent,
  TraceRenderItem,
} from "./types";

/* ─── Conversation detail modal ────────────────────────────────────────────
 * Centered modal (Dialog primitive) opened from a row title click. Started
 * as a right-docked Sheet mirroring CMP-013's pattern, but the conversation
 * scope adds a cross-link selection between Messages and Request Trace
 * that needs both panels visible simultaneously — sheets can't go wide
 * enough without crowding the page chrome behind them. Modal solves the
 * width problem and matches the original CTO mockup.
 *
 * Layout (top → bottom, fixed except where noted):
 *   header        eyebrow + title + meta + close
 *   identity row  status + cnv_id + initiator + Copy/Audit actions
 *   prompt quote  the user's opening message
 *   KPI rail      5 tiles (Requests / Turns / Tokens / Cost / Duration)
 *   body grid     Messages | Request Trace, side-by-side at lg, stacked
 *                 below — each panel scrolls internally
 *   footer        cross-link affordance copy + initiator/key/started meta
 *
 * Cross-link state (`activeRequestId`) is shared by both panels: clicking a
 * message bubble highlights the paired trace event and vice versa. State
 * persists if the user happens to be on a narrow viewport where the
 * panels stack — they can scroll between them without losing selection.
 * ────────────────────────────────────────────────────────────────────── */

export function ConversationDetailDialog({
  row,
  onOpenChange,
  onOpenChangeComplete,
}: {
  row: ConversationRow | null;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
}) {
  // Hold the last non-null row so the body stays rendered during the
  // close animation. Without this, the modal briefly renders empty chrome
  // between selectedRow → null and the unmount, which reads as a flicker.
  const [stickyRow, setStickyRow] = useState<ConversationRow | null>(row);
  const [prevRow, setPrevRow] = useState<ConversationRow | null>(row);
  if (row !== prevRow) {
    setPrevRow(row);
    if (row) {
      setStickyRow(row);
    }
  }
  return (
    <Dialog
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
      open={!!row}
    >
      <DialogScrollContent
        // 900px — wide enough for the two-column body to breathe at
        // typical desktop viewports, narrow enough that the dimmed page
        // behind reads as context. The shared scroll-shell primitive
        // provides max-h-[90vh] / flex-col / overflow-hidden; the inner
        // panels scroll independently inside the body.
        className="max-h-[calc(90vh-96px)] sm:max-w-[860px] [@media(max-height:800px)]:max-h-[90vh]"
      >
        {stickyRow ? <ConversationDetailBody row={stickyRow} /> : null}
      </DialogScrollContent>
    </Dialog>
  );
}

export function ConversationDetailBody({
  row,
  variant = "modal",
}: {
  row: ConversationRow;
  variant?: "page" | "modal";
}) {
  const navigate = useNavigate();
  // Cross-link selection state — clicking a message bubble or trace step
  // sets the active requestId; both panels paint the matching item with
  // the selection treatment (blue ring on the bubble, blue left-bar +
  // blue wash on the trace row). Click again to clear.
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  // Track which panel originated the selection so we only scroll the
  // counterpart panel into view (clicking a message in the Messages panel
  // shouldn't scroll the Messages panel itself — it was already where the
  // user clicked). `null` after a deselect or external mount.
  const [selectionSource, setSelectionSource] = useState<
    "messages" | "trace" | null
  >(null);
  const selectFromMessages = (id: string | null) => {
    setActiveRequestId(id);
    setSelectionSource(id ? "messages" : null);
  };
  const selectFromTrace = (id: string | null) => {
    setActiveRequestId(id);
    setSelectionSource(id ? "trace" : null);
  };

  // Finding / error tallies for the banner + step tabs, derived from the
  // trace. `warn` rows are policy findings (flagged / redacted); `danger`
  // rows are errors. Disjoint buckets — passing steps are neither.
  const detail = getConversationDetail(row, REQUEST_ROWS_ALL);
  const findingCount = detail.trace.filter((e) => e.finding).length;
  const errorCount = detail.trace.filter((e) => e.status === "danger").length;
  const actionRank = { Flag: 1, Redact: 2, Block: 3 } as const;
  const highestAction = detail.trace.reduce<"Flag" | "Redact" | "Block">(
    (hi, e) =>
      e.findingAction && actionRank[e.findingAction] > actionRank[hi]
        ? e.findingAction
        : hi,
    "Flag"
  );
  const bannerTone: "destructive" | "warning" =
    highestAction === "Block" ? "destructive" : "warning";

  // ── Findings-only view derivations ──────────────────────────────────────
  // A "finding step" = a trace event with a truthy `finding` label. The
  // Findings-only tab collapses every run of consecutive passing (non-finding)
  // steps into one muted "N passing request(s)" separator, preserving order.
  const findingIds = useMemo(
    () =>
      new Set(detail.trace.filter((e) => e.finding).map((e) => e.requestId)),
    [detail.trace]
  );
  // Interleave separators + finding events. Walk the full trace; accumulate
  // passing steps into a counter, and whenever a finding is reached (or the
  // trace ends) flush the accumulated run as a single separator before the
  // finding event.
  const findingTraceItems = useMemo<TraceRenderItem[]>(() => {
    const out: TraceRenderItem[] = [];
    let passing = 0;
    let sepSeq = 0;
    const flush = () => {
      if (passing > 0) {
        out.push({ kind: "separator", id: `sep-${sepSeq++}`, count: passing });
        passing = 0;
      }
    };
    for (const e of detail.trace) {
      if (e.finding) {
        flush();
        out.push({ kind: "event", event: e });
      } else {
        passing += 1;
      }
    }
    flush();
    return out;
  }, [detail.trace]);
  // Messages belonging to a finding request — no separator rows on this side,
  // just the filtered subset.
  const findingMessages = useMemo(
    () =>
      detail.messages.filter((m) => m.requestId && findingIds.has(m.requestId)),
    [detail.messages, findingIds]
  );
  // Errors tab — identical shape to Findings only, filtered to errored steps
  // (status === 'danger') instead of findings. Passing/non-error runs collapse
  // into the same muted separators.
  const errorIds = useMemo(
    () =>
      new Set(
        detail.trace
          .filter((e) => e.status === "danger")
          .map((e) => e.requestId)
      ),
    [detail.trace]
  );
  const errorTraceItems = useMemo<TraceRenderItem[]>(() => {
    const out: TraceRenderItem[] = [];
    let passing = 0;
    let sepSeq = 0;
    const flush = () => {
      if (passing > 0) {
        out.push({
          kind: "separator",
          id: `err-sep-${sepSeq++}`,
          count: passing,
        });
        passing = 0;
      }
    };
    for (const e of detail.trace) {
      if (e.status === "danger") {
        flush();
        out.push({ kind: "event", event: e });
      } else {
        passing += 1;
      }
    }
    flush();
    return out;
  }, [detail.trace]);
  const errorMessages = useMemo(
    () =>
      detail.messages.filter((m) => m.requestId && errorIds.has(m.requestId)),
    [detail.messages, errorIds]
  );

  return (
    <>
      {/* Top section — header + identity row + prompt quote. Fixed (does
          not scroll); the body grid below carries the scrollable panels.
          `pr-12` lives on the title block only so it clears the absolute
          DialogClose X; the identity row + quote run flush to the modal's
          right padding so action buttons align with the KPI rail edge. */}
      <DialogScrollHeader className={variant === "page" ? "pt-0" : undefined}>
        <DialogTitleBlock
          mode={variant === "page" ? "static" : "dialog"}
          titleAriaLabel={`Conversation ${row.title}`}
        >
          Messages + request trace
        </DialogTitleBlock>

        {/* Identity row — cnv_id + initiator. Copy ID lives in the
            footer-right; the header carries identity only. */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium font-mono text-foreground text-sm">
            {row.conversationId}
          </span>
          <span className="font-mono text-muted-foreground text-xs">
            {row.initiator}
          </span>
        </div>
      </DialogScrollHeader>

      {/* Persistent KPI rail — 5 tiles at the conversation scope. Same
          pattern as CMP-013's request rail but with one extra tile
          (Duration) and a `grid-cols-5` track. */}
      <DialogScrollSummary>
        <ConversationKpiRail row={row} />
      </DialogScrollSummary>

      {/* Body — two-panel grid where each panel scrolls independently.
          Override the body's default `overflow-y-auto` to `overflow-hidden`
          and add `flex flex-col` so the inner grid manages overflow per
          panel rather than scrolling the whole body. */}
      <DialogScrollBody
        className={
          variant === "page"
            ? "flex min-h-fit flex-initial flex-col gap-4 overflow-y-visible overscroll-auto pt-4"
            : "flex flex-col gap-4 overflow-hidden pt-4"
        }
      >
        {/* Finding banner — same pattern as the Requests modal. Hidden
              when the conversation surfaced no findings or errors. */}
        {findingCount + errorCount > 0 && (
          <div
            className={[
              "flex items-center gap-4 rounded-md border p-4",
              bannerTone === "destructive"
                ? "border-destructive/50 bg-danger-50 dark:bg-danger-500/15"
                : "border-warning-500/50 bg-warning-50 dark:bg-warning-500/15",
            ].join(" ")}
            role="status"
          >
            <TriangleAlert
              aria-hidden
              className={[
                "size-6 shrink-0",
                bannerTone === "destructive"
                  ? "text-destructive"
                  : "text-warning-600 dark:text-warning-300",
              ].join(" ")}
              strokeWidth={1.75}
            />
            <p className="type-label-14 min-w-0 text-pretty text-foreground">
              {findingCount} finding{findingCount === 1 ? "" : "s"} across this
              conversation · Highest action:{" "}
              <span className="capitalize">{highestAction}</span>
            </p>
          </div>
        )}

        {/* Step tabs — filter the trace by outcome. "All steps" (default)
              renders the existing two-panel layout unchanged; the "Findings
              only" / "Errors" subsections are built in a follow-up pass. */}
        <Tabs
          className={
            variant === "page"
              ? "flex flex-col"
              : "flex min-h-0 flex-1 flex-col"
          }
          defaultValue="all"
        >
          <TabsList className="px-0" variant="line">
            <TabsTrigger value="all">
              All steps
              <Badge className="ml-1" variant="neutral">
                {detail.trace.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="findings">
              Findings only
              {findingCount > 0 && (
                <Badge className="ml-1" variant="neutral">
                  {findingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="errors">
              Errors
              <Badge className="ml-1" variant="neutral">
                {errorCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            className={
              variant === "page"
                ? "mt-4"
                : "mt-4 flex min-h-0 flex-1 flex-col overflow-hidden"
            }
            value="all"
          >
            <div
              className={
                variant === "page"
                  ? "grid h-[600px] grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
                  : "grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
              }
            >
              <ConversationMessagesPanel
                activeRequestId={activeRequestId}
                messages={detail.messages}
                onSelect={selectFromMessages}
                selectionSource={selectionSource}
                trace={detail.trace}
              />
              <RequestTracePanel
                activeRequestId={activeRequestId}
                footer={
                  <div className="flex flex-none items-center justify-between gap-4 border-border border-t bg-card px-4 py-3">
                    <span className="font-mono text-muted-foreground text-xs">
                      Key{" "}
                      <span className="text-foreground">{row.initiator}</span> ·
                      started{" "}
                      <Timestamp
                        className="text-foreground"
                        date={row.updated}
                      />
                    </span>
                    <div className="flex items-center gap-2">
                      <CopyButton
                        label="conversation ID"
                        mode="label"
                        size="sm"
                        text="Copy ID"
                        value={row.conversationId}
                      />
                      <Button
                        disabled={!activeRequestId}
                        onClick={() => {
                          if (activeRequestId) {
                            navigate(`/messages-findings/${activeRequestId}`);
                          }
                        }}
                        size="sm"
                        type="button"
                      >
                        View Request
                        <ExternalLink aria-hidden data-icon="inline-end" />
                      </Button>
                    </div>
                  </div>
                }
                onSelect={selectFromTrace}
                selectionSource={selectionSource}
                trace={detail.trace}
              />
            </div>
          </TabsContent>

          {/* Findings-only — same two-panel layout as "All steps", filtered
                to finding requests. Trace collapses passing runs into muted
                separators; messages are filtered to finding requests' turns.
                Cross-highlight + auto-scroll wiring is identical to the All
                tab (shared activeRequestId / selectionSource / onSelect). */}
          <TabsContent
            className={
              variant === "page"
                ? "mt-4"
                : "mt-4 flex min-h-0 flex-1 flex-col overflow-hidden"
            }
            value="findings"
          >
            <div
              className={
                variant === "page"
                  ? "grid h-[600px] grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
                  : "grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
              }
            >
              <ConversationMessagesPanel
                activeRequestId={activeRequestId}
                messages={findingMessages}
                onSelect={selectFromMessages}
                selectionSource={selectionSource}
                trace={detail.trace}
              />
              <RequestTracePanel
                activeRequestId={activeRequestId}
                countLabel={`${findingCount} findings`}
                footer={
                  <div className="flex flex-none items-center justify-between gap-4 border-border border-t bg-card px-4 py-3">
                    <span className="font-mono text-muted-foreground text-xs">
                      Key{" "}
                      <span className="text-foreground">{row.initiator}</span> ·
                      started{" "}
                      <Timestamp
                        className="text-foreground"
                        date={row.updated}
                      />
                    </span>
                    <div className="flex items-center gap-2">
                      <CopyButton
                        label="conversation ID"
                        mode="label"
                        size="sm"
                        text="Copy ID"
                        value={row.conversationId}
                      />
                      <Button
                        disabled={!activeRequestId}
                        onClick={() => {
                          if (activeRequestId) {
                            navigate(`/messages-findings/${activeRequestId}`);
                          }
                        }}
                        size="sm"
                        type="button"
                      >
                        View Request
                        <ExternalLink aria-hidden data-icon="inline-end" />
                      </Button>
                    </div>
                  </div>
                }
                items={findingTraceItems}
                onSelect={selectFromTrace}
                selectionSource={selectionSource}
              />
            </div>
          </TabsContent>
          {/* Errors — same two-panel layout as Findings only, filtered to
                errored steps (status danger). Passing runs collapse into muted
                separators; messages are filtered to errored requests' turns. */}
          <TabsContent
            className={
              variant === "page"
                ? "mt-4"
                : "mt-4 flex min-h-0 flex-1 flex-col overflow-hidden"
            }
            value="errors"
          >
            {errorCount === 0 ? (
              <p className="type-copy-14 text-muted-foreground">
                No errors in this conversation.
              </p>
            ) : (
              <div
                className={
                  variant === "page"
                    ? "grid h-[600px] grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
                    : "grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2"
                }
              >
                <ConversationMessagesPanel
                  activeRequestId={activeRequestId}
                  messages={errorMessages}
                  onSelect={selectFromMessages}
                  selectionSource={selectionSource}
                  trace={detail.trace}
                />
                <RequestTracePanel
                  activeRequestId={activeRequestId}
                  countLabel={`${errorCount} error${errorCount === 1 ? "" : "s"}`}
                  footer={
                    <div className="flex flex-none items-center justify-between gap-4 border-border border-t bg-card px-4 py-3">
                      <span className="font-mono text-muted-foreground text-xs">
                        Key{" "}
                        <span className="text-foreground">{row.initiator}</span>{" "}
                        · started{" "}
                        <Timestamp
                          className="text-foreground"
                          date={row.updated}
                        />
                      </span>
                      <div className="flex items-center gap-2">
                        <CopyButton
                          label="conversation ID"
                          mode="label"
                          size="sm"
                          text="Copy ID"
                          value={row.conversationId}
                        />
                        <Button
                          disabled={!activeRequestId}
                          onClick={() => {
                            if (activeRequestId) {
                              navigate(`/messages-findings/${activeRequestId}`);
                            }
                          }}
                          size="sm"
                          type="button"
                        >
                          View Request
                          <ExternalLink aria-hidden data-icon="inline-end" />
                        </Button>
                      </div>
                    </div>
                  }
                  items={errorTraceItems}
                  onSelect={selectFromTrace}
                  selectionSource={selectionSource}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogScrollBody>

      {/* Footer — conversation provenance LEFT, Copy ID action RIGHT.
          Override the footer's default `justify-end` since this footer
          carries informational copy on the leading edge as well. */}
    </>
  );
}

function ConversationKpiRail({ row }: { row: ConversationRow }) {
  const view = getConversationView(row, REQUEST_ROWS_ALL);
  return (
    <KpiRailShell columns={6}>
      <ConversationKpiTile label="Requests" value={String(view.reqs)} />
      <ConversationKpiTile label="Turns" value={String(view.turns)} />
      <ConversationKpiTile label="Tokens In" value={view.inTokens} />
      <ConversationKpiTile label="Tokens Out" value={view.outTokens} />
      <ConversationKpiTile label="Cost" value={view.cost} />
      <ConversationKpiTile label="Duration" value={view.duration} />
    </KpiRailShell>
  );
}

function ConversationKpiTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  // Mono at text-lg (18px) — below the sans-hero threshold (≥24px), so
  // these stay in the data-tier mono register per the five-voice taxonomy.
  // Label uses plain sans (Title Case, not Eyebrow caps): KPI tiles inside
  // a modal sit closer to body metadata than to page eyebrows, so the
  // uppercase-tracked register from <Eyebrow> overweighted the label.
  // Padding `p-4` matches the 16px card-padding rule (CompactKpi / ModelKpiTile).
  return (
    <div className="flex flex-col gap-1 p-4">
      <Eyebrow>{label}</Eyebrow>
      <span className="font-medium font-mono text-foreground text-lg tabular-nums tracking-snug">
        {value}
      </span>
    </div>
  );
}

/* ─── Messages tab ───────────────────────────────────────────────────────
 * Conversation-scope dialogue (richer than CMP-013's per-request thread
 * since a conversation spans multiple turns + tool calls). Renders via the
 * shared <MessageBlock> primitive so the bubble treatment stays one source
 * of truth across the request and conversation sheets. */

/**
 * Conversation thread — eight turns mirroring the agent flow. RequestIds
 * on assistant + tool messages match SAMPLE_TRACE entries, enabling the
 * cross-link selection (click message → highlights paired trace event).
 * USER turn is human input — no gateway request, no requestId.
 */

// Static derivation — computed once at module load from the fixed message list.

function ConversationMessagesPanel({
  messages,
  trace,
  activeRequestId,
  selectionSource,
  onSelect,
}: {
  activeRequestId: string | null;
  selectionSource: "messages" | "trace" | null;
  onSelect: (requestId: string | null) => void;
  messages?: ConversationMessage[];
  trace?: TraceEvent[];
}) {
  // Count = assistant turns. Tool/user/system don't count as "turns" — a
  // turn is a model response. Mirrors the convention used in the table
  // (row.turns is assistant-only). Computed at module level (static data).

  // Auto-scroll the matching message into view ONLY when the selection
  // came from the counterpart (trace) panel. Selections that originated
  // here are already in view — scrolling would jump away from where the
  // user just clicked. `block: 'nearest'` is a no-op if the message is
  // already visible, so this is safe to fire on every cross-panel change.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!(activeRequestId && scrollRef.current)) {
      return;
    }
    if (selectionSource === "messages") {
      return;
    }
    const el = scrollRef.current.querySelector(
      `[data-request-id="${activeRequestId}"]`
    );
    el?.scrollIntoView({
      block: "nearest",
      behavior: REDUCE_MOTION ? "auto" : "smooth",
    });
  }, [activeRequestId, selectionSource]);

  // requestId → status, so each message bubble can adopt its trace step's tone.
  const statusByRequestId = useMemo(
    () => new Map((trace ?? []).map((e) => [e.requestId, e.status])),
    [trace]
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card">
      {/* Header strip — bordered tinted band carrying the eyebrow + count.
          Matches the framing pattern in the trace panel. `flex-none` so
          it doesn't shrink when the body scrolls. */}
      <div className="flex flex-none items-center justify-between border-border border-b bg-card px-4 py-3">
        <span
          className="type-label-14 text-foreground"
          id="conv-messages-eyebrow"
        >
          Messages
        </span>
        <span className="font-mono text-muted-foreground text-xs tabular-nums">
          {(messages ?? []).filter((m) => m.role === "assistant").length}{" "}
          {(messages ?? []).filter((m) => m.role === "assistant").length === 1
            ? "turn"
            : "turns"}
        </span>
      </div>
      <div
        aria-labelledby="conv-messages-eyebrow"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4"
        ref={scrollRef}
        role="region"
      >
        {(messages ?? []).map((m, i) => {
          const selected = !!m.requestId && m.requestId === activeRequestId;
          // Bubble tone tracks the matching trace step's status so the message
          // and its trace row carry the same color: blue = normal, amber =
          // flag/redact, red = block/error.
          const status = m.requestId
            ? statusByRequestId.get(m.requestId)
            : undefined;
          const tone =
            status === "danger"
              ? "danger"
              : status === "warn"
                ? "warn"
                : "default";
          return (
            <MessageBlock
              body={
                m.role === "tool" && typeof m.body === "string" ? (
                  <ToolResultCode>{m.body}</ToolResultCode>
                ) : (
                  m.body
                )
              }
              key={i}
              // Only assistant + tool turns participate in cross-link
              // selection — user input has no gateway request to pair with.
              onClick={
                m.requestId
                  ? () => onSelect(selected ? null : (m.requestId ?? null))
                  : undefined
              }
              requestId={m.requestId}
              role={m.role}
              selected={selected}
              time={m.time}
              tone={tone}
              tool={m.tool}
            />
          );
        })}
      </div>
    </div>
  );
}
