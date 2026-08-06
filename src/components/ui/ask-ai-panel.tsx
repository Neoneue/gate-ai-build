import {
  Check,
  ChevronsUpDown,
  PanelRightClose,
  SquarePen,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AskAiComposer } from "@/components/ui/ask-ai-composer";
import { AskAiEmptyState } from "@/components/ui/ask-ai-empty-state";
import {
  AgentMessage,
  MessageThread,
  UserMessage,
} from "@/components/ui/ask-ai-message";
import {
  ScrollBottomSentinel,
  ScrollToLatestFab,
} from "@/components/ui/ask-ai-scroll-to-latest";
import { AskAiThinkingRow } from "@/components/ui/ask-ai-thinking-row";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { useAskAiThread } from "@/hooks/use-ask-ai-thread";
import { useStickToBottom } from "@/hooks/use-stick-to-bottom";
import { truncateTitle } from "@/lib/ask-ai-title";
import { cn } from "@/lib/utils";

/* ─── AskAiPanel — right-docked "Ask AI" chat shell ─────────────────────────
 * Skeleton only: header (unwired "New session" caret + optional secondary
 * action + wired collapse) and an empty body surface. The inner chat elements
 * live elsewhere. Surface + borders come from the wrapper (the docked column's
 * `border-l bg-card`, or SheetContent below lg), so this component owns layout
 * only and stays single-bordered in both mounts.
 *
 * The header is `h-16` to line up flush with the 64px DashTopBar so the collapse
 * control sits on the same baseline as the top-bar actions. ──────────────── */

/* An unnamed chat reads the same on the picker as on the button that opens
   one — they are the same idea, so they carry the same word. */
const NEW_CHAT_LABEL = "New message";

export interface AskAiPanelProps {
  className?: string;
  /** Collapse the panel (push-out on desktop, close the Sheet below lg). */
  onClose: () => void;
  /** Panel visibility. The docked column stays mounted when collapsed, so
      opening is a prop flip, not a mount — the caret lands off this. */
  open?: boolean;
}

export function AskAiPanel({
  onClose,
  open = false,
  className,
}: AskAiPanelProps) {
  // Conversation state lives above the router outlet (App.tsx) so the thread
  // survives navigation, the same way `askAiOpen` does.
  const {
    activeSessionId,
    messages,
    phase,
    regenerate,
    reset,
    selectSession,
    send,
    sessions,
    stop,
  } = useAskAiThread();

  // Trigger label: the chat's derived name, or the same word an unnamed chat
  // carries in the list.
  const activeTitle =
    sessions.find((s) => s.id === activeSessionId)?.title ?? NEW_CHAT_LABEL;

  // The scrolling message region and the zero-height marker at its very end.
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const stick = useStickToBottom(scrollRef, sentinelRef);

  // The composer field, so the panel can put the caret in it.
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // The composer SHELL and the body it floats over — the two nodes the FAB's
  // offset is measured between.
  const composerBoxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  /* Publish the composer's rendered height as `--ask-ai-composer-h` on the
     body, so the scroll-to-latest FAB can hold a constant 24px of air above the
     field at whatever height the field currently stands (see the FAB below).
     One variable out, CSS does the arithmetic, and no JS ever writes a position.

     Measured, not predicted: the shell's own box already carries its 1px
     borders, 16px padding, 12px gap, and 32px actions row, so nothing here has
     to know those numbers. `borderBoxSize` for sub-pixel exactness under zoom;
     `offsetHeight` only as a fallback.

     `useLayoutEffect`, not `useEffect`: a ResizeObserver delivers its first
     callback before paint, but it is REGISTERED here, and a passive effect runs
     after the opening frame is already on screen. That frame would resolve
     `calc(var(--ask-ai-composer-h) + 40px)` against nothing, the whole
     declaration would be invalid, and the FAB would drop to its static
     position. The synchronous first write below closes that gap.

     Cannot loop: the variable feeds the FAB's `bottom` only, which cannot
     change the composer's size. And the composer is out of flow, so a new value
     moves the circle and nothing else — the thread never reflows. */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const composer = composerBoxRef.current;
    if (!(canvas && composer)) {
      return;
    }
    const publish = (height: number) => {
      canvas.style.setProperty("--ask-ai-composer-h", `${height}px`);
    };
    publish(composer.offsetHeight);
    const observer = new ResizeObserver((entries) => {
      publish(entries[0]?.borderBoxSize[0]?.blockSize ?? composer.offsetHeight);
    });
    observer.observe(composer);
    return () => observer.disconnect();
  }, []);

  /* Opening arms the field — the user types straight away without a click.
     Deferred a frame so the Sheet's own initial-focus pass (below lg) has
     already run and cannot steal the caret back. Collapsed, the docked column
     is `inert`, so a stale focus call there is a no-op. */
  useEffect(() => {
    if (!open) {
      return;
    }
    const frame = requestAnimationFrame(() => composerRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Sending re-arms following and snaps to the end, so the new turn is in view
  // however far up the thread the user had scrolled. It deliberately does NOT
  // take the caret back: the composer only lights up at the two moments the
  // user is being invited to type (open, new chat), and reads quiet otherwise.
  const handleSend = useCallback(
    (text: string) => {
      send(text);
      stick.pinToBottom();
    },
    [send, stick]
  );

  // New chat returns to the empty state, which is the same invitation to type
  // as a fresh open — so the caret goes back to the field.
  const handleReset = useCallback(() => {
    reset();
    composerRef.current?.focus();
  }, [reset]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col text-foreground",
        className
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-border border-b px-4">
        {/* Chat picker. Built on the WorkspaceSwitcher recipe — outline
            trigger, label-14 label, muted ChevronsUpDown caret, and the same
            `active` MenuItem + Check treatment on the current row.

            The trigger is `min-w-0` so a long chat name shrinks the BUTTON
            rather than growing the 64px header, and the label truncates inside
            it; the caret is `shrink-0` so it can never be pushed out of view.
            The untruncated name stays reachable in the `title` attribute. */}
        <Menu>
          <MenuTrigger
            render={
              <Button className="min-w-0" size="default" variant="outline" />
            }
          >
            <span
              className="type-label-14 truncate text-foreground"
              title={activeTitle}
            >
              {truncateTitle(activeTitle)}
            </span>
            <ChevronsUpDown
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
              data-icon="inline-end"
              strokeWidth={1.75}
            />
          </MenuTrigger>
          {/* Four rows, then it scrolls. 152px = the popup's own `p-2` (8 top +
              8 bottom) + 4 × the MenuItem's `h-8` (32px) + a 16px half-row —
              measured off the primitives rather than picked, so it stays right
              if either changes. That half row is deliberate: at a flush 144px
              the 5th row hides under the bottom padding and nothing signals
              there is more below. The peek IS the scroll affordance. */}
          <MenuContent
            align="start"
            className="max-h-38 min-w-[var(--anchor-width)] overflow-y-auto p-2"
            side="bottom"
            sideOffset={8}
          >
            {sessions.map((session) => {
              const title = session.title ?? NEW_CHAT_LABEL;
              return (
                <MenuItem
                  active={session.id === activeSessionId}
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                >
                  <span
                    className="type-label-14 min-w-0 flex-1 truncate"
                    title={title}
                  >
                    {truncateTitle(title)}
                  </span>
                  {session.id === activeSessionId ? (
                    <Check
                      aria-hidden
                      className="text-primary"
                      strokeWidth={1.75}
                    />
                  ) : null}
                </MenuItem>
              );
            })}
          </MenuContent>
        </Menu>
        <div className="flex items-center gap-1">
          {/* New chat — opens a fresh session and returns to the empty state. */}
          <Button
            aria-label={NEW_CHAT_LABEL}
            onClick={handleReset}
            size="icon"
            type="button"
            variant="ghost"
          >
            <SquarePen aria-hidden strokeWidth={1.75} />
          </Button>
          <Button
            aria-label="Collapse Ask AI panel"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <PanelRightClose aria-hidden strokeWidth={1.75} />
          </Button>
        </div>
      </div>
      {/* Body — 16px inset left/right; the scrolling message region carries its
          own 16px top padding so the first message clears the top bar by 16px
          while the scroll track still runs edge-to-edge. There is NO bottom
          padding here: the thread runs the full height of the body, right down
          to the panel's bottom edge, and the composer's own 16px sits on the
          composer instead.

          THE COMPOSER FLOATS OVER THE THREAD. It is out of flow (`absolute`,
          pinned bottom), so growing the field moves only its own top edge —
          nothing in this box resizes and the thread cannot reflow. Content
          passes UNDERNEATH it and fades out into the panel's bottom edge (the
          mask on the scroll region below), which is what keeps the overlap
          reading as depth rather than a collision.

          Three measured facts fall out of the composer's geometry, and every
          offset below is built from them:

            118px  composer AT REST — 2px border + 32px `p-4` + 40px field (the
                   placeholder wraps to two 20px lines and `field-sizing-content`
                   sizes to it) + 12px `gap-3` + 32px actions row
            158px  composer at FULL height (`max-h-20`, 4 lines). It also passes
                   through 98px (1 line, which is what the `replying`
                   placeholder wraps to) and 138px (3 lines).
             16px  its inset from the panel's bottom edge (`bottom-4`)

          158 + 16 = 174px is the band the composer can ever occupy: the
          thread's bottom reserve and the start of the fade. Both are CONSTANT
          by design — a reserve that tracked the field would shove the thread
          every time it grew. 118 + 16 + 24 = 158px is the same band at rest
          plus air, which is where the empty state stops so it keeps centring
          above the field, and it is constant for the same reason.

          The FAB is the one offset that TRACKS. It reads directly against the
          field, so a constant is wrong at every height but one; it takes
          `--ask-ai-composer-h` (published above) + 40px instead. The heights
          are off the 4px grid — the composer's 1px borders put them there, and
          they have to be its real rendered heights or the empty state slides
          off its measured 321px baseline. Every offset ADDED to them is on the
          grid: 16 + 24.

          The reserve was 198px until 2026-07-29, when the user measured the
          resting gap above the field at 64px and asked for 24px off it. That
          air was the reserve's only slack, so removing it means the newest
          turn comes to rest 40px above the field at rest and FLUSH with its
          top edge at full height — content slides behind the field as it
          grows, which is what the fade is there for. The fade start moves with
          the reserve; if it stayed at 198 it would dim the bottom 24px of a
          pinned turn.

          Measured 2026-07-29 at 1512×900: scroll region 836px, empty-state
          title y=321, and every thread y constant at all four field sizes.
          Re-measured 2026-08-06 when the FAB's offset became tracking: the gap
          above the field reads 24px at 98 / 118 / 138 / 158px in both themes,
          and a turn's y is unchanged across all of them.

          `ask-ai-canvas` is the dot-matrix field from the design — a 16px
          gradient texture on a ::before layer, drawn in CSS rather than
          shipped as an image (see index.css). It goes on THIS element for two
          reasons. It does not scroll — the turn list is a child that does — so
          the pattern stays put while messages travel over it, which is what
          the Figma frame shows. And it inherits this wrapper's existing
          `relative` as its containing block, so `inset-0` covers the full box:
          the `px-4` does not inset it and the pattern runs edge to edge. It is
          backmost by tree order alone (no z-index added anywhere, no new
          stacking context) and `pointer-events-none`, so it cannot occlude or
          intercept a bubble, the empty state, the FAB, or the composer. It
          starts directly under the 64px header, which keeps its own
          surface. */}
      <div
        className="ask-ai-canvas relative flex min-h-0 flex-1 flex-col px-4"
        ref={canvasRef}
      >
        {/* Non-scrolling wrapper: owns the flex sizing so the scroll-to-latest
            control can anchor to the region's box without riding the scroll.
            Its right edge is the body's `px-4`, so the FAB sits 16px in from
            the right with no horizontal offset of its own. */}
        <div className="relative min-h-0 flex-1">
          {/* Scrolling turn list.
              Scroll anchoring: the content wrapper opts OUT and the sentinel
              opts IN. The two are separate elements rather than a `[&>*]` rule
              plus an override, so there is no specificity tie to lose. It
              prevents JUMPS when content changes above the viewport, but it
              does NOT follow content appended below (measured 2026-07-28:
              0 → 819px drift over ~10s of streaming). Auto-follow is
              `useStickToBottom`, which owns that. */}
          {/* The scroll VIEWPORT is `h-full` — the whole body, down to the
              panel's bottom edge. The composer floats on top of it; it is not
              a boundary. Turns scroll behind the field and are clipped only by
              the panel's own edge, which is what every chat agent does and
              what the design shows.

              Fade mask — the thread dissolves into that bottom edge so the
              floating composer reads as a separate plane. It is a MASK, not an
              overlaid gradient: a mask removes alpha instead of painting a
              colour, so it needs no surface token, cannot fall out of sync
              with the panel in dark mode, and stays correct on whatever
              surface the panel is mounted over. Static — nothing to gate on
              reduced motion. It masks the scroll region ONLY; the FAB and the
              empty state are siblings on the wrapper and stay at full opacity.

              Stops, in px so the ramp cannot stretch on a taller viewport:
              opaque down to `100% - 174px`, which tracks the thread's reserve
              below — it is exactly where the last turn comes to rest, so
              content pinned to the bottom is never dimmed, only content
              scrolled INTO the band fades. Transparent at `100% + 24px`, one air-step PAST
              the panel edge rather than at it, so the sliver of thread showing
              below the composer is still faintly legible (~0.2 alpha) the way
              the design has it, instead of being erased before it gets
              there.

              Tailwind's `mask-b-*` utilities emit the unprefixed
              `mask-image` only, so the `-webkit-` twin is added alongside
              them. It reuses Tailwind's own `--tw-mask-linear`, so there is
              exactly one gradient here and the prefixed copy cannot drift
              from it. */}
          <div
            className="mask-b-from-[calc(100%-174px)] mask-b-to-[calc(100%+24px)] h-full overflow-y-auto pt-4 [-webkit-mask-image:var(--tw-mask-linear)]"
            ref={scrollRef}
          >
            {/* Bottom reserve on the scroll CONTENT (not the viewport — the
                viewport runs to the panel edge). 174px = the composer's full
                envelope, its maximum height (158) + its 16px inset, and
                nothing more: the newest turn comes to rest 40px above the
                field. It was 198 (a further 24px of air) and read as a hole
                under the last reply — ruled 2026-07-29, "reduce that by 24px".
                What is left is the field's own growth: the 40px at rest IS the
                room the textarea needs to reach `max-h-20`, so at full height
                the last turn's action row comes to the composer's top edge and
                no further. Off the 4px grid only because the composer's 1px
                borders put it there; the CHANGE was a clean 24.

                CONSTANT, never driven by the live composer height: a reserve
                that tracked the field would shove the thread every time it
                grew, which is the defect this layout removes. */}
            <div className="pb-[174px] [overflow-anchor:none]">
              <MessageThread>
                {messages.map((message) =>
                  message.role === "user" ? (
                    <UserMessage key={message.id}>
                      {message.content}
                    </UserMessage>
                  ) : (
                    <AgentMessage
                      /* Children are already-rendered markdown; the copy
                         affordance needs the SOURCE string. */
                      copyText={message.content}
                      key={message.id}
                      onRegenerate={() => regenerate(message.id)}
                      showActions={message.status !== "streaming"}
                    >
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </Markdown>
                    </AgentMessage>
                  )
                )}
                {phase === "thinking" && <AskAiThinkingRow />}
              </MessageThread>
            </div>
            <ScrollBottomSentinel ref={sentinelRef} />
          </div>
          {/* Empty state overlays the (zero-height) thread rather than
              replacing it, so `scrollRef`/`sentinelRef` never unmount and
              `useStickToBottom` keeps one stable set of nodes for the whole
              panel lifetime.

              It centres in the band ABOVE the resting composer, not in the
              whole wrapper — the wrapper now runs under the field, and
              `inset-0` would drop the block by half of that. `bottom-[158px]`
              is the composer at rest (118) + its 16px inset + 24px of air,
              which reproduces the pre-float centring box exactly: 678px tall,
              title at y=321. Constant, so the block cannot move when the field
              grows. */}
          {messages.length === 0 && (
            <AskAiEmptyState
              className="absolute inset-x-0 top-0 bottom-[158px]"
              onSelect={handleSend}
            />
          )}
          {/* 24px of air above the composer's TOP EDGE, at every field height.
              The offset tracks: `--ask-ai-composer-h` is the shell's measured
              height (98 / 118 / 138 / 158px) and 40px is its 16px inset plus
              that 24px of air. Both halves of the sum are real — nothing here
              is a constant standing in for a height.

              A single number cannot do this job. The FAB reads against the
              field the user can see, so the 24 has to be measured off the
              CURRENT top edge: at 158px (rest + air) a field grown to
              `max-h-20` rose 16px PAST the circle and hid it behind an opaque
              surface, and at 198px (the 174px full-height envelope + air) it
              cleared every size but floated 64px up at rest and read as
              unanchored. Tracking is the only value that is right in both
              places, and in `replying` (98px) as well.

              It does NOT animate. `bottom` is a layout property, and the
              primitive's transition list is deliberately narrow
              (`colors,opacity,box-shadow,scale`), so the circle steps with the
              field — which itself jumps in whole 20px lines. Nothing to gate on
              reduced motion.

              It sits on the WRAPPER, outside the masked scroll region, so the
              fade never touches it. Its 16px right offset is still the body's
              `px-4`. */}
          <ScrollToLatestFab
            className="absolute right-0 bottom-[calc(var(--ask-ai-composer-h)+40px)]"
            onClick={stick.jumpToLatest}
            visible={stick.showFab}
          />
        </div>
        {/* The floating composer. Out of flow entirely — it takes no space in
            this column, so the thread behind it is the full height of the body
            and stays that height however tall the field gets. `inset-x-4`
            matches the body's own `px-4` and `bottom-4` is the 16px it sits
            above the panel's bottom edge; growing to `max-h-20` moves only its
            top edge, upward, over the thread. Its surface is opaque
            (`bg-card-muted` + border, from the component), so turns passing
            behind it are covered rather than showing through, and the mask
            handles everything below. `rootRef` hands its shell up so the FAB's
            offset can be measured off this box rather than assumed. */}
        <AskAiComposer
          className="absolute inset-x-4 bottom-4"
          onSend={handleSend}
          onStop={stop}
          phase={phase}
          rootRef={composerBoxRef}
          textareaRef={composerRef}
        />
      </div>
    </div>
  );
}
