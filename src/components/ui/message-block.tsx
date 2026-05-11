import { cn } from '@/lib/utils';

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
 * Bubble border-only (no fill). Earlier tone-tinted fills (bg-ink-100 /
 * bg-blue-50) were too heavy and read as a chat-app aesthetic. Outline
 * keeps per-message container shape without the visual weight. Assistant
 * gets a blue-100 border to separate model output from user/tool input.
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
 * ───────────────────────────────────────────────────────────────────────── */

export type MessageRole = 'system' | 'user' | 'tool' | 'assistant';

export const ROLE_LABEL: Record<MessageRole, string> = {
  system: 'System',
  user: 'User',
  tool: 'Tool',
  assistant: 'Assistant',
};

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
  /** Tone — escape from outline-only default for warn-state messages.
   *  When `warn`, the bubble picks up a `bg-warning-50` fill +
   *  `border-warning-200` so the data state (e.g. a tool result that
   *  flagged something) reads at the message level instead of only on
   *  the matching trace event. Default `default` keeps the outline-only
   *  treatment per the project's primitive policy. */
  tone?: 'default' | 'warn';
  /** Selection state — paints a ring around the bubble. Drives the
   *  cross-link highlight when paired with a trace event of the same
   *  requestId. Ring color tracks tone: default selection = blue,
   *  warn selection = warning-500 so the data state stays semantically
   *  intact through the selection action layer. */
  selected?: boolean;
  /** Click handler. When present the bubble becomes interactive (cursor
   *  pointer + hover state). */
  onClick?: () => void;
  className?: string;
};

export function MessageBlock({
  role,
  tool,
  body,
  time,
  requestId,
  tone = 'default',
  selected = false,
  onClick,
  className,
}: MessageBlockProps) {
  const baseBubbleBorder =
    tone === 'warn'
      ? 'border-warning-200 bg-warning-50'
      : role === 'assistant'
        ? 'border-blue-100'
        : 'border-ink-200';
  const bubbleClasses = cn(
    'rounded-sm border px-3 py-2 text-sm text-ink-900 text-pretty transition-[box-shadow,border-color] duration-150 ease-out motion-reduce:transition-none',
    selected
      ? // Selected — ring color tracks tone so the warn semantic stays
        // intact through the selection action layer. Warn-state selection
        // rings in warning-500 (not blue) to avoid two competing signals
        // on the same bubble; default-tone selection rings in blue.
        tone === 'warn'
        ? 'border-warning-500 bg-warning-50 ring-2 ring-warning-500'
        : 'border-blue-500 ring-2 ring-blue-500'
      : baseBubbleBorder,
    onClick && !selected && 'hover:border-ink-400 cursor-pointer',
    onClick && 'text-left w-full',
  );

  // The bubble is rendered as either a <button> (when interactive) or a
  // <div> (when static). Button gets the selection ring + click handler;
  // the link affordance is intentionally absent — selection is driven by
  // the colored ring, not underline.
  const Bubble = onClick ? 'button' : 'div';

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      data-request-id={requestId}
    >
      <div className="flex items-center justify-between font-sans text-xs font-medium text-ink-600">
        <span className="min-w-0 truncate">
          {ROLE_LABEL[role]}
          {tool ? (
            <>
              <span className="text-ink-400"> · </span>
              <span className="font-mono font-normal text-ink-700">{tool}</span>
            </>
          ) : null}
        </span>
        {time ? (
          <span className="font-mono font-normal text-ink-500 tabular-nums -tracking-[0.01em] shrink-0 ml-2">
            {time}
          </span>
        ) : null}
      </div>
      <Bubble
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        aria-pressed={onClick ? selected : undefined}
        className={bubbleClasses}
      >
        {body}
      </Bubble>
      {requestId ? (
        <span className="font-mono text-xs text-ink-500 -tracking-[0.01em]">
          <span className="text-ink-400" aria-hidden>↳ </span>
          {requestId}
        </span>
      ) : null}
    </div>
  );
}
