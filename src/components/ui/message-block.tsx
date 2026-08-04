import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogClose,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollHeader,
  DialogTitleBlock,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * MessageBlock — single conversation/request turn (system / user / tool /
 * assistant). Used by every sheet that displays a message thread —
 * CMP-013's RequestDetailSheet (single request scope), CMP-014's
 * ConversationDetailSheet (full conversation scope).
 *
 * Voice split: role label is sans Title Case (message metadata, not a
 * section eyebrow); tool function name is mono lowercase (API code
 * identifier). The two halves on one metadata line carry different voices
 * for different jobs.
 *
 * Bubble border-only (no fill). Earlier tone-tinted fills (bg-neutral-100 /
 * bg-blue-50) were too heavy and read as a chat-app aesthetic. Outline
 * keeps per-message container shape without the visual weight. Assistant
 * gets a blue-100 border to separate model output from user/tool input.
 *
 * Default-tone fill is `bg-card-muted` (2026-07-30, was `bg-background`).
 * Two reasons, one change:
 *   1. The bubble now nests a <ToolCallCard> on `bg-card`, and that inner
 *      card has to invert against its parent — lighter in light, DARKER in
 *      dark. `--background` is neutral-950 in dark, the floor of the ramp,
 *      so nothing could sit below it. `--card-muted` is neutral-800 there,
 *      which leaves the headroom the pattern needs (card = neutral-900).
 *   2. `bg-background` was already off-contract: design.md §2 reserves it
 *      for the dashboard content canvas and bars it from darkening a
 *      component.
 * No-op in light — `--background` and `--card-muted` both resolve to
 * neutral-50. Only the `default` tone moved; the warn / danger tinted fills
 * and the whole `selectedTone` ladder below are untouched.
 *
 * Optional metadata (codified 2026-05-07):
 *   `time`       — timestamp shown right-aligned next to the role label
 *   `requestId`  — gateway request ID shown below the bubble with a `↳`
 *                  corner glyph; only meaningful for assistant + tool
 *                  messages (user input has no gateway request)
 *   `selected`   — blue ring around the bubble; drives the cross-link
 *                  selection state (clicking a trace event highlights
 *                  the paired message and vice versa)
 *   `onClick`    — bubble becomes a button when present
 *   `copyValue`  — plain-text transcript of the turn; puts the message-tools
 *                  cluster (expand + copy) at the right end of the
 *                  `↳ requestId` footer line, matching the Ask AI reply
 *                  action row. Expand opens a 600-wide viewer (300–600 tall,
 *                  content-driven) holding the same body node without the
 *                  bubble's 200px height clamp (added 2026-08-04)
 * ───────────────────────────────────────────────────────────────────────── */

export type MessageRole = "system" | "user" | "tool" | "assistant";

const ROLE_LABEL: Record<MessageRole, string> = {
  system: "System",
  user: "User",
  tool: "Tool",
  assistant: "Assistant",
};

/* Toast / aria fragment for the copy affordance. The full toast reads
   `Copied ${label} to clipboard` and the resting aria-label `Copy ${label}`,
   so these are lowercase noun phrases, not the Title Case ROLE_LABEL above.
   `tool` says "result" because the tool ROLE carries the result of a call —
   the call itself lives on the assistant turn that requested it. */
const ROLE_COPY_LABEL: Record<MessageRole, string> = {
  system: "system message",
  user: "user message",
  tool: "tool result",
  assistant: "assistant message",
};

/* The READING treatment for a message body — the part that must look identical
   wherever the body is rendered. Deliberately EXCLUDES the bubble's own
   chrome (border, radius, padding, the `max-h-[200px]` clamp and the tone
   fill), which belongs to the bubble rather than to the content.

   Split out 2026-08-04 when the expand viewer landed: the viewer renders the
   same `body` node, so the two must not be able to drift on type. */
const MESSAGE_BODY_VOICE = "text-pretty text-foreground text-sm";

/**
 * Role label plus optional tool name — "Assistant", "Tool · Read".
 *
 * Rendered by BOTH the bubble's header line and the expand viewer's dialog
 * title, so the two can never disagree about what a turn is called. Voice
 * split per the block comment above: the role is sans Title Case (message
 * metadata), the tool name is mono (an API identifier), and the mono span
 * re-states `font-normal` because it also sits inside the dialog title, which
 * is `font-medium`.
 */
function MessageHeading({ role, tool }: { role: MessageRole; tool?: string }) {
  return (
    <>
      {ROLE_LABEL[role]}
      {tool ? (
        <>
          <span className="text-muted-foreground"> · </span>
          <span className="font-mono font-normal text-muted-foreground">
            {tool}
          </span>
        </>
      ) : null}
    </>
  );
}

export type MessageBlockProps = {
  role: MessageRole;
  /** Tool function name — only meaningful when role === 'tool'. */
  tool?: string;
  body: React.ReactNode;
  /** Per-turn timestamp, e.g. "14:24:11". Renders right-aligned next to
   *  the role label above the bubble. */
  time?: string;
  /** Gateway request ID, e.g. "req_92cf2a". Renders below the bubble with
   *  a `↳` corner glyph. Omit for user-input turns (no gateway call). */
  requestId?: string;
  /** Tone — escape from outline-only default for warn/danger-state messages.
   *  When `warn` or `danger`, the bubble picks up a color+opacity tint fill +
   *  matching translucent border (danger/warning-500 at low alpha, tuned per
   *  theme) so the data state (e.g. a tool result that flagged something)
   *  reads at the message level instead of only on the matching trace event.
   *  Default `default` keeps the outline-only treatment per the project's
   *  primitive policy. */
  tone?: "default" | "warn" | "danger";
  /** Selection state — paints a ring around the bubble. Drives the
   *  cross-link highlight when paired with a trace event of the same
   *  requestId. Ring color tracks tone: default selection = blue,
   *  warn selection = warning-500 so the data state stays semantically
   *  intact through the selection action layer. */
  selected?: boolean;
  /** Click handler. When present the bubble becomes interactive (cursor
   *  pointer + hover state). */
  onClick?: () => void;
  /** Plain-text transcript of this turn, for the clipboard only. Its presence
   *  is also what gates the MESSAGE TOOLS cluster at the right end of the
   *  `↳ requestId` footer line — an expand control and a copy control, in
   *  that order. One signal drives both because it answers the same question
   *  for each: a turn with no text has nothing to copy AND nothing worth
   *  opening in a viewer, so neither control should appear. The viewer itself
   *  renders the `body` NODE, never this string. */
  copyValue?: string;
  className?: string;
};

export function MessageBlock({
  role,
  tool,
  body,
  time,
  requestId,
  tone = "default",
  selected = false,
  onClick,
  copyValue,
  className,
}: MessageBlockProps) {
  const baseBubbleBorder =
    tone === "danger"
      ? "border-danger-500/15 bg-danger-500/8 dark:bg-danger-500/10"
      : tone === "warn"
        ? "border-warning-500/15 bg-warning-500/8 dark:bg-warning-500/10"
        : "border-border bg-card-muted";
  // Selected ring color tracks tone so the status semantic stays intact
  // through the selection layer: green = normal/success, amber = warn
  // (flag/redact), red = danger (block/error). Matches the trace panel's
  // status-tone outline + node color.
  const selectedTone =
    tone === "danger"
      ? "border-destructive bg-danger-500/10 dark:bg-danger-500/15"
      : tone === "warn"
        ? "border-warning-500 bg-warning-500/10 dark:bg-warning-500/15"
        : "border-success-600";
  const bubbleClasses = cn(
    "max-h-[200px] overflow-y-auto overscroll-contain rounded-md border p-4 transition-[box-shadow,border-color] duration-150 ease-out motion-reduce:transition-none",
    MESSAGE_BODY_VOICE,
    selected ? selectedTone : baseBubbleBorder,
    onClick && !selected && "cursor-pointer hover:border-ring",
    onClick && "w-full text-left"
  );

  // The bubble is rendered as either a <button> (when interactive) or a
  // <div> (when static). Button gets the selection ring + click handler;
  // the link affordance is intentionally absent — selection is driven by
  // the colored ring, not underline.
  const Bubble = onClick ? "button" : "div";

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      data-request-id={requestId}
    >
      <div className="type-label-14 flex items-center justify-between text-foreground">
        <span className="min-w-0 truncate">
          <MessageHeading role={role} tool={tool} />
        </span>
        {time ? (
          <span className="ml-2 shrink-0 font-mono font-normal text-muted-foreground tabular-nums">
            {time}
          </span>
        ) : null}
      </div>
      <Bubble
        aria-pressed={onClick ? selected : undefined}
        className={bubbleClasses}
        onClick={onClick}
        type={onClick ? "button" : undefined}
      >
        {body}
      </Bubble>
      {/* Footer line. Was a bare `↳ req_xxxxx` span; became a row on
          2026-08-04 so the message tools have a home that is NOT inside the
          bubble. That matters structurally: when `onClick` is present the
          bubble IS a <button>, and a button may not contain another button.
          Sitting here, both controls are already siblings — no nesting, and no
          chance of a copy or expand click toggling the cross-link selection.

          The row renders when there is EITHER a request reference or something
          to act on. `requestId` is absent on user-input turns (no gateway
          call) and `copyValue` on a turn with no text, so each half is
          independently conditional and `ml-auto` pins the tools right whether
          or not the reference exists. `min-h-6` holds the line at the
          controls' own desktop height so a turn missing one half still aligns
          with its neighbours. */}
      {requestId || copyValue ? (
        <div className="flex min-h-6 items-center gap-4">
          {requestId ? (
            <span className="min-w-0 truncate font-mono text-muted-foreground text-xs">
              <span aria-hidden className="text-muted-foreground">
                ↳{" "}
              </span>
              {requestId}
            </span>
          ) : null}
          {copyValue ? (
            /* Message tools. `gap-0 lg:gap-1` is the Ask AI reply row's
               pitch-preserving pairing: below `lg` each box is 32px with no
               gap, from `lg` each is 24px with a 4px gap, so the glyphs sit
               at the same pitch on both and the tap target grows into space
               the row already owned. Both steps are on the 4px grid.

               Order is copy then expand, reading left to right along the
               row — expand is the rightmost control. */
            <div className="ml-auto flex shrink-0 items-center gap-0 lg:gap-1">
              <CopyButton
                label={ROLE_COPY_LABEL[role]}
                mode="icon"
                size="icon-action"
                value={copyValue}
              />
              {/* Expand viewer. The bubble clamps to `max-h-[200px]` inside a
                  panel that itself scrolls — nested scrolling that makes long
                  tool output genuinely hard to read. This is the "read it
                  properly" escape hatch, and its only job is to give the SAME
                  content room: it renders the same `body` node, not a derived
                  string, so nested CALL cards, ToolResultCode and prose all
                  keep their own voices.

                  Driven by `DialogTrigger` rather than a controlled `open`
                  boolean so Base UI owns the trigger association: Escape
                  closes, and focus returns HERE on close by contract instead
                  of by luck.

                  Height is content-driven between bounds — 240px floor, 600px
                  ceiling (both 4px multiples). A one-word "yes" settles at 240
                  instead of being padded out with dead space; a long tool blob
                  grows to 600 and scrolls inside. The ceiling is written
                  `min(600px,90vh)` rather than a bare `600px` because a plain
                  `max-h-[600px]` would REPLACE the `max-h-[90vh]` that
                  `DialogScrollContent` supplies (same tailwind-merge group)
                  and the card would overflow a short viewport. One utility has
                  to carry both limits.

                  The bounds sit on the card as a whole, header included; the
                  text window is `flex-1 min-h-0` so it takes whatever is left
                  and resolves its own scroll at either bound.

                  The body sits in a `bg-card-muted` well rather than directly
                  on the modal surface, and that is REQUIRED for fidelity, not
                  decoration: `<ToolCallCard>` is `bg-card` and is specified to
                  invert against the bubble's `bg-card-muted` fill (design.md
                  §7). On the modal's own `bg-card` it would be white-on-white
                  and vanish. The well reproduces the bubble's surface, border
                  and `p-4` exactly, minus the height clamp — which is the one
                  thing the viewer exists to remove. Radius steps 16px modal →
                  8px well → 4px call card, per the concentric ladder.
                  `overflow-y-hidden` on the scroll body hands the scrolling to
                  the well, so its border frames a fixed reading window instead
                  of scrolling away with the content. */}
              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      aria-label={`Expand ${ROLE_COPY_LABEL[role]}`}
                      className="text-muted-foreground transition-colors duration-150 ease-out motion-reduce:transition-none"
                      size="icon-action"
                      variant="ghost"
                    />
                  }
                >
                  <Maximize2 aria-hidden strokeWidth={1.75} />
                </DialogTrigger>
                <DialogScrollContent
                  className="max-h-[min(600px,90vh)] min-h-[240px] sm:max-w-[600px]"
                  // The primitive's own close slot hard-codes an X. Opting out
                  // and supplying the glyph here keeps `Minimize2` as the
                  // exact inverse of the `Maximize2` that opened the card —
                  // one gesture and its counterpart — WITHOUT forking
                  // DialogContent. `DialogClose` is still Base UI's own
                  // dismiss, so Escape, focus return and the exit animation
                  // are untouched; only the glyph and its name changed.
                  showCloseButton={false}
                >
                  <DialogScrollHeader>
                    <DialogTitleBlock>
                      <MessageHeading role={role} tool={tool} />
                    </DialogTitleBlock>
                  </DialogScrollHeader>
                  <DialogClose
                    render={
                      <Button
                        aria-label="Collapse"
                        className="absolute top-3 right-3"
                        size="icon-sm"
                        variant="ghost"
                      />
                    }
                  >
                    <Minimize2 aria-hidden strokeWidth={1.75} />
                  </DialogClose>
                  <DialogScrollBody className="flex flex-col overflow-y-hidden p-6">
                    <div
                      className={cn(
                        "min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-md border border-border bg-card-muted p-4",
                        MESSAGE_BODY_VOICE
                      )}
                    >
                      {body}
                    </div>
                  </DialogScrollBody>
                </DialogScrollContent>
              </Dialog>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
