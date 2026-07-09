/**
 * Request Trace tab for a conversation: a vertical timeline of the model calls
 * (one row per gateway request). Extracted from Conversations.tsx; consumed by
 * ConversationDetailBody. TraceItem / TracePassingSeparator are private helpers.
 */
import { Activity, ArrowRight, TriangleAlert, Wrench } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { REDUCE_MOTION } from "@/lib/reduce-motion";
import type {
  ConversationMessage,
  TraceEvent,
  TraceRenderItem,
  TraceStatus,
} from "./types";

/* ─── Request Trace tab ──────────────────────────────────────────────────
 * Vertical timeline of model calls for the conversation. Each event = one
 * row in the gateway log (one call to /v1/messages). Status dot signals
 * pass/warn/fail; vendor avatar + model name identify the route; the
 * label below describes the agent step ("plan", "tool: lookup_transfer",
 * "reason"). Click a step (eventually) to drill into CMP-013's request
 * sheet for that specific call. */

// Status → border color for the timeline node ring. Mirrors StatusDot's
// fill convention (-600 saturated mid).
const TRACE_NODE_BORDER: Record<TraceStatus, string> = {
  success: "border-success-600",
  warn: "border-warning-600",
  danger: "border-destructive",
};
const TRACE_NODE_ICON_TONE: Record<TraceStatus, string> = {
  success: "text-success-700 dark:text-success-300",
  warn: "text-warning-700 dark:text-warning-300",
  danger: "text-destructive",
};
// Selected-row OUTLINE color, keyed off status (mirrors the messages panel's
// tone-aware selection ring): blue = no issues, amber = flag/redact, red =
// block/error. Selection is an outline, never a fill, so the row tint never
// competes with the status signal.
// Drawn as an ::after overlay (not a box-shadow ring) so the selection
// outline paints ABOVE the timeline track — an inset box-shadow would sit
// under the positioned track span and the gray line would cross it.
const TRACE_SELECT_RING: Record<TraceStatus, string> = {
  success: "after:ring-success-600",
  warn: "after:ring-warning-500",
  danger: "after:ring-destructive",
};
// Hover preview of the selection outline — a light SOLID tint of the same
// status color (the -200 step, not an alpha of the bold ring) so it composites
// cleanly over the timeline track. -50 is near-white and reads as no color, so
// -200 is the lightest step that still registers as the status hue.
const TRACE_HOVER_RING: Record<TraceStatus, string> = {
  success: "hover:after:ring-success-200",
  warn: "hover:after:ring-warning-200",
  danger: "hover:after:ring-danger-200",
};

/** Interleaved timeline entry for the Findings-only view: either a finding
 *  TraceEvent or a collapsed run of consecutive passing (non-finding) steps
 *  rendered as a single muted separator row. Order is preserved from the
 *  original trace. */

export function RequestTracePanel({
  trace,
  items,
  countLabel,
  activeRequestId,
  selectionSource,
  onSelect,
  footer,
}: {
  activeRequestId: string | null;
  selectionSource: "messages" | "trace" | null;
  onSelect: (requestId: string | null) => void;
  messages?: ConversationMessage[];
  trace?: TraceEvent[];
  /** When provided, the panel renders this interleaved list (finding events +
   *  passing-run separators) instead of the flat `trace`. Used by the
   *  Findings-only tab. */
  items?: TraceRenderItem[];
  /** Right-aligned header count copy. Defaults to "N requests" from `trace`. */
  countLabel?: ReactNode;
  footer?: ReactNode;
}) {
  // Auto-scroll the matching trace event into view ONLY when the selection
  // came from the counterpart (messages) panel. Selections that originated
  // here are already in view. Pairing the two effects gives one-way
  // counterpart scrolling: clicking a message reveals its trace event;
  // clicking a trace event reveals its message bubble — but neither
  // scrolls its own panel.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!(activeRequestId && scrollRef.current)) {
      return;
    }
    if (selectionSource === "trace") {
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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border">
      {/* Header strip — bordered tinted band carrying the eyebrow + count.
          Matches the framing pattern in the messages panel. `flex-none`
          so it doesn't shrink when the body scrolls. */}
      <div className="flex flex-none items-center justify-between border-border border-b bg-card px-4 py-3">
        <span className="type-label-14 text-foreground" id="conv-trace-eyebrow">
          Request Trace
        </span>
        <span className="font-mono text-muted-foreground text-xs tabular-nums">
          {countLabel ?? `${(trace ?? []).length} requests`}
        </span>
      </div>

      {/* Timeline track — vertical hairline running down the column at
          x=28px (16px panel padding + 12px = node centerline). The track
          sits BEHIND the nodes; each node's white interior visually masks
          the line where it crosses, giving the "beads on a string" effect.
          `inset-y-6` shortens the line so it terminates inside the first
          and last node centers, accounting for the row's vertical padding.
          The wrapper carries the scroll so long traces flow without
          forcing the modal itself to scroll. */}
      <div
        aria-labelledby="conv-trace-eyebrow"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2"
        ref={scrollRef}
        role="region"
      >
        {/* Per-row track segments are rendered inside TraceItem (see
            below) so geometry stays correct regardless of row content
            height. First/last items truncate the segment at the node
            center; the node's bg-white masks the line where it crosses. */}
        <div className="flex flex-col">
          {items
            ? items.map((item, i) =>
                item.kind === "separator" ? (
                  <TracePassingSeparator
                    count={item.count}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                    key={item.id}
                  />
                ) : (
                  <TraceItem
                    event={item.event}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                    key={item.event.id}
                    onSelect={() =>
                      onSelect(
                        item.event.requestId === activeRequestId
                          ? null
                          : item.event.requestId
                      )
                    }
                    selected={item.event.requestId === activeRequestId}
                  />
                )
              )
            : (trace ?? []).map((event, i) => (
                <TraceItem
                  event={event}
                  isFirst={i === 0}
                  isLast={i === (trace ?? []).length - 1}
                  key={event.id}
                  onSelect={() =>
                    onSelect(
                      event.requestId === activeRequestId
                        ? null
                        : event.requestId
                    )
                  }
                  selected={event.requestId === activeRequestId}
                />
              ))}
        </div>
      </div>
      {footer}
    </div>
  );
}

function TraceItem({
  event,
  selected,
  isFirst,
  isLast,
  onSelect,
}: {
  event: TraceEvent;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
}) {
  // Selection is shown as a status-colored OUTLINE (ring), not a fill —
  // green/amber/red track the row's status. Hover previews the same outline in
  // a faint -50 tint. See TRACE_SELECT_RING / TRACE_HOVER_RING.
  const selectRing = TRACE_SELECT_RING[event.status];
  const hoverRing = TRACE_HOVER_RING[event.status];

  // Slow-latency tint: >1000ms paints the latency text warning-700 in the
  // data line only. Latency is not a security signal, so it never colors the
  // timeline node.
  const latencyMs = Number.parseInt(event.latency, 10);
  const isSlowLatency = latencyMs > 1000;
  const latencyTone = isSlowLatency
    ? "text-warning-700 dark:text-warning-300"
    : "text-muted-foreground";

  // Node ring + icon tone key off guardrail status ONLY: green = clean (no
  // detector fired), amber = flag/redact, red = block/error. A slow-but-clean
  // step stays green; only a fired guardrail colors the node.
  const nodeBorder = TRACE_NODE_BORDER[event.status];
  const nodeIconTone = TRACE_NODE_ICON_TONE[event.status];

  // Step-type icon inside the node. Tool calls get Wrench (literal); every
  // other step gets Activity (the EKG wave — implies reasoning/processing).
  // Wrench's mass sits low; nudge -0.5px to optically center it inside
  // the node circle. Activity is balanced and stays at 0.
  const StepIcon = event.kind === "tool" ? Wrench : Activity;
  const stepIconTransform = event.kind === "tool" ? "-translate-y-[0.5px]" : "";

  // Per-row track segment — rendered behind the node circle (DOM order
  // puts node after, so its bg-white masks the line where it crosses).
  // Node center sits at y = py-3 (12px) + node-half (12px) = 24px = top-6.
  // First row: line starts at node center (top-6) and runs to row
  // bottom. Last row: line starts at row top and runs h-6 (24px) to
  // node center. Middle rows: line spans the full row height. Within
  // TraceItem padding box, node center is at x=24 (pl-3 + node-half);
  // for a 2px line to center on x=24, left = 23px.
  const trackSegment = isFirst
    ? "top-6 bottom-0"
    : isLast
      ? "top-0 h-6"
      : "inset-y-0";

  return (
    <button
      aria-pressed={selected}
      className={`relative -mx-2 flex cursor-pointer gap-3 rounded-md px-3 py-3 text-left outline-none transition-[box-shadow,background-color] duration-150 ease-out after:pointer-events-none after:absolute after:inset-0 after:rounded-md after:ring-1 after:ring-inset after:transition-colors after:duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 motion-reduce:transition-none ${
        selected ? selectRing : `after:ring-transparent ${hoverRing}`
      }`}
      data-request-id={event.requestId}
      onClick={onSelect}
      type="button"
    >
      {/* Per-row track segment — sits at x=23 inside TraceItem coords so
          the 2px line centers on the node centerline at x=24. Comes
          first in DOM so the node renders above and its bg-white masks
          the line where it crosses. */}
      <span
        aria-hidden
        className={`absolute left-[23px] w-[2px] bg-border ${trackSegment}`}
      />
      {/* Selected fill — an opaque card overlay that paints ABOVE the track
          (so the gray line doesn't show through the selected row) but below
          the node + content. Rendered as an overlay rather than the button's
          background because the background paints under the positioned track. */}
      {selected ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md bg-card"
        />
      ) : null}
      {/* Timeline node — circular, status-bordered, white-filled so the
          track behind it reads as broken at the bead. Icon inside marks
          the step type. */}
      <div
        className={`relative flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-card ${nodeBorder}`}
      >
        <StepIcon
          aria-hidden
          className={`size-3 ${nodeIconTone} ${stepIconTransform}`}
          strokeWidth={2}
        />
      </div>

      {/* Content column — two stacked rows by default; warn events get a
          third row below for the warn badge (left-aligned). Model
          deprioritized — repeated across every step's row added scan
          noise without information.
          (1) step label + time as the primary identifier,
          (2) tokens · latency · cost + requestId on the right,
          (3) warn badge (only when status === 'warn'). */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-1">
        {/* Row 1 — primary. Agent step label takes the slot the model
            previously occupied; timestamp right-aligned. */}
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex-1 truncate font-mono text-foreground text-sm">
            {event.label}
          </span>
          <span className="shrink-0 font-mono text-muted-foreground text-xs tabular-nums">
            {event.time}
          </span>
        </div>

        {/* Row 2 — per-step economics + requestId. `tokens-in → tokens-out ·
            latency · cost` on the left; requestId right-aligned. Latency
            turns warning-700 on slow rows. Cost renders at neutral-800 per the
            three-tier table ink policy. Separators drop to neutral-300 so they
            read as hairline scaffolding, not data. */}
        <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums">
            {event.inTokens}
            <ArrowRight aria-hidden className="size-3" strokeWidth={1.75} />
            {event.outTokens}
          </span>
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <span className={`font-mono text-xs tabular-nums ${latencyTone}`}>
            {event.latency}
          </span>
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <span className="flex-1 font-mono text-foreground text-xs tabular-nums">
            {event.cost}
          </span>
          <span className="shrink-0 font-mono text-muted-foreground text-xs">
            {event.requestId}
          </span>
        </div>

        {/* Row 3 — warn badge, only when this step carries a policy warn.
            Left-aligned on its own row so the signal is unmissable without
            crowding the primary identifier line. */}
        {event.finding ? (
          <div className="flex items-center">
            <Badge
              aria-label={`${event.finding} ${event.findingAction}`}
              variant={
                event.findingAction === "Block" ? "destructive" : "warning"
              }
            >
              <TriangleAlert
                aria-hidden
                className="size-3"
                strokeWidth={1.75}
              />
              {event.finding} · {event.findingAction}
            </Badge>
          </div>
        ) : null}
      </div>
    </button>
  );
}

/* Passing-run separator — quiet, non-interactive timeline row used in the
 * Findings-only view to collapse a run of consecutive passing (non-finding)
 * steps. Reads as muted scaffolding: no status node ring, no clickable
 * button, no finding color. It stays aligned to the same left rail as a
 * TraceItem (node centerline x=24) so the timeline track runs continuously
 * through it. The track segment is full-height for middle/edge rows so the
 * line is unbroken between the finding events on either side. */
function TracePassingSeparator({
  count,
  isFirst,
  isLast,
}: {
  count: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  // Mirror TraceItem's per-row track geometry. A separator almost always
  // sits between two finding events, so the line should run the full row
  // height; only truncate when it is the very first/last item in the list.
  const trackSegment = isFirst
    ? "top-6 bottom-0"
    : isLast
      ? "top-0 h-6"
      : "inset-y-0";
  return (
    <div aria-hidden className="relative -mx-2 flex gap-3 px-3 py-3">
      {/* Continuous track segment at x=23 — same centerline as TraceItem. */}
      <span
        className={`absolute left-[23px] w-[2px] bg-border ${trackSegment}`}
      />
      {/* Node column placeholder — a small hollow dot centered on the rail
          (x=24) so the eye still tracks the timeline, but visibly lighter
          than a status node (no 2px ring, no icon). */}
      <div className="relative flex size-6 shrink-0 items-center justify-center">
        <span className="size-1.5 rounded-full bg-muted-foreground" />
      </div>
      {/* Muted count copy. Mono so it sits in the data voice but quiet. */}
      <div className="flex min-w-0 flex-1 items-center">
        <span className="font-mono text-muted-foreground text-xs tabular-nums">
          {count} passing request{count === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
