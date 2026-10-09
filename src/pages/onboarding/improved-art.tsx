import { Check, Mail, Send } from "lucide-react";
import { type ReactNode, type Ref, useId } from "react";
import { cn } from "@/lib/utils";
import { IMPROVED_CLIENTS } from "@/pages/onboarding/improved-data";

/* ─── Improved flow: illustrations ──────────────────────────────────────────
 * Static END STATES of the mockup's animated art (preview-CEK5nK-p.css).
 * Motion is owned by the animator session, so every art root takes a `ref`
 * slot and carries `data-motion-root="<name>"`, and every element the mockup
 * animates carries a stable `data-motion="<part>"` attribute for it to
 * target (armed / play / paused is set on the root by the animator's hook).
 * No keyframes are defined here. Ink maps to design.md tokens; the mockup's
 * blue "selected stage" is not carried over (see the report).
 * ───────────────────────────────────────────────────────────────────────── */

/** Monochrome marks drawn in black ink; flipped to read on dark surfaces. */
const INK_ICONS = new Set<string>([
  "/icons/providers/opencode.svg",
  "/icons/providers/hermes.svg",
  "/icons/providers/openai.svg",
]);

export function AppIcon({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <img
      alt=""
      aria-hidden
      className={cn(
        "size-4 shrink-0",
        INK_ICONS.has(src) && "dark:invert",
        className
      )}
      height={16}
      src={src}
      width={16}
    />
  );
}

export function GateMark({ className }: { className?: string }) {
  return (
    <img
      alt=""
      aria-hidden
      className={cn("size-5 object-contain", className)}
      height={226}
      src="/gate-ai-logo-mark.png"
      width={195}
    />
  );
}

/* ─── Choice-card art (desktop picker) ─────────────────────────────────── */

/** Gate Chat, drawn as the chat itself draws it (chat-message.tsx): the
 *  prompt bubble, a reply card with its header row and two lines (and the
 *  "preparing reply" dots the animator plays before them), then the
 *  composer as it is when the next message is typed: focused border, a
 *  line of text, the send key enabled. The phone start card passes a
 *  `scale-*` to fit it in its shorter stage, and `loop` so its sequence
 *  replays after a hold (use-onboarding-motion.ts). */
export function ChatArt({
  ref,
  className,
  loop = false,
}: {
  ref?: Ref<HTMLSpanElement>;
  className?: string;
  loop?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn("flex w-4/5 max-w-80 flex-col gap-3", className)}
      data-motion-loop={loop ? "" : undefined}
      data-motion-root="chat-art"
      ref={ref}
    >
      <span
        className="flex h-10 w-1/2 items-center self-end rounded-md border border-border bg-chat-bubble-user px-4 shadow-xs"
        data-motion="bubble-user"
      >
        <span
          className="h-2 w-3/4 rounded-full bg-input [--art-bar-light:var(--border)] [--art-bar:var(--input)]"
          data-art-bar=""
        />
      </span>
      <span
        className="flex flex-col gap-3 rounded-md border border-border bg-chat-bubble-agent p-4 shadow-xs"
        data-motion="bubble-reply"
      >
        <span className="flex items-center gap-2">
          <GateMark />
          <span className="h-2 w-1/4 rounded-full bg-border" data-art-bar="" />
        </span>
        <span className="relative flex flex-col gap-2">
          <span
            className="h-2 w-full rounded-full bg-border"
            data-art-bar=""
            data-motion="reply-line"
          />
          <span
            className="h-2 w-2/3 rounded-full bg-border"
            data-art-bar=""
            data-motion="reply-line"
          />
          <span
            className="absolute inset-y-0 left-0 flex items-center gap-1 text-muted-foreground opacity-0"
            data-motion="reply-dots"
          >
            {[0, 1, 2].map((dot) => (
              <span
                className="size-1 rounded-full bg-current"
                data-motion="reply-dot"
                data-motion-index={dot}
                key={dot}
              />
            ))}
          </span>
        </span>
      </span>
      <span
        className="mt-3 flex h-12 items-center justify-between rounded-sm border border-primary bg-card pr-2 pl-4 text-foreground"
        data-motion="composer"
      >
        <span
          className="h-2 w-2/5 rounded-full bg-border"
          data-art-bar=""
          data-motion="composer-text"
        />
        <span
          className="inline-flex size-7 items-center justify-center rounded-full bg-info text-primary-foreground dark:text-foreground"
          data-motion="send"
        >
          <Send className="size-3" strokeWidth={1.75} />
        </span>
      </span>
    </span>
  );
}

/** Orbit geometry: a 200px field, a 64px hub at the centre, five 40px
 *  satellites on an 80px radius starting at 12 o'clock (72deg apart). */
const ORBIT_RADIUS = 80;
const ORBIT_CENTER = 100;
const orbitPoint = (index: number) => {
  const angle = ((index * 72 - 90) * Math.PI) / 180;
  return {
    left: ORBIT_CENTER + ORBIT_RADIUS * Math.cos(angle) - 20,
    top: ORBIT_CENTER + ORBIT_RADIUS * Math.sin(angle) - 20,
  };
};

/** Gate Connect: five app satellites around the Gate hub, with the signal
 *  dots that travel satellite -> hub (hidden at rest). The dashed orbit is
 *  an SVG so a light-blue run of the same dashes can travel along it,
 *  masked to a short arc the animator moves app to app. */
export function ConnectArt({ ref }: { ref?: Ref<HTMLSpanElement> }) {
  const apps = IMPROVED_CLIENTS.slice(0, 5);
  const orbitMask = useId();
  return (
    <span
      aria-hidden
      className="relative block size-50"
      data-motion-root="connect-art"
      ref={ref}
    >
      <svg
        className="absolute inset-0 size-full -rotate-90 fill-none"
        viewBox="0 0 200 200"
      >
        <mask id={orbitMask} maskUnits="userSpaceOnUse">
          <circle
            className="stroke-white opacity-0"
            cx={ORBIT_CENTER}
            cy={ORBIT_CENTER}
            data-motion="orbit-arc"
            r={ORBIT_RADIUS}
            strokeWidth={6}
          />
        </mask>
        <circle
          className="stroke-input"
          cx={ORBIT_CENTER}
          cy={ORBIT_CENTER}
          r={ORBIT_RADIUS}
          strokeDasharray="3 3"
        />
        <circle
          className="stroke-info"
          cx={ORBIT_CENTER}
          cy={ORBIT_CENTER}
          mask={`url(#${orbitMask})`}
          r={ORBIT_RADIUS}
          strokeDasharray="3 3"
          strokeWidth={1.5}
        />
      </svg>
      {apps.map((app, index) => (
        <span
          className="absolute top-24 left-24 size-2 rounded-full bg-info opacity-0"
          data-motion="signal"
          data-motion-index={index}
          key={`signal-${app.id}`}
        />
      ))}
      <span
        className="absolute top-17 left-17 grid size-16 place-items-center rounded-md border border-info bg-card shadow-xs"
        data-motion="hub"
      >
        <GateMark className="size-8" />
      </span>
      {apps.map((app, index) => (
        <span
          className="absolute grid size-10 place-items-center rounded-sm border border-border bg-card shadow-xs"
          data-motion="satellite"
          data-motion-index={index}
          key={app.id}
          style={orbitPoint(index)}
        >
          <AppIcon className="size-5" src={app.icon} />
        </span>
      ))}
    </span>
  );
}

/** Manual setup, told like ChatArt: the OpenAI SDK client file (as the
 *  Manual step's own snippet, client-configs.tsx) whose `baseURL` value is
 *  swapped for Gate's `/v1`, then Gate's reply card lands with a 200. The
 *  old value bar and the reply carry the animator's hooks. */
export function CodeArt({ ref }: { ref?: Ref<HTMLSpanElement> }) {
  return (
    <span
      aria-hidden
      className="flex w-4/5 max-w-72 flex-col gap-3"
      data-motion-root="code-art"
      ref={ref}
    >
      <span
        className="flex flex-col overflow-hidden rounded-md border border-border bg-chat-bubble-agent shadow-xs"
        data-motion="editor"
      >
        <span className="flex items-center gap-1 border-border border-b px-3 py-2">
          {/* Window controls in their close / minimize / zoom colors. */}
          {["bg-danger-500", "bg-warning-500", "bg-success-500"].map((tone) => (
            <span className={cn("size-2 rounded-full", tone)} key={tone} />
          ))}
          <span className="type-mono-12 ml-2 text-muted-foreground">
            client.ts
          </span>
        </span>
        <span className="flex flex-col gap-3 p-4">
          <span className="flex gap-2">
            <span
              className="h-2 w-1/5 rounded-full bg-border"
              data-art-bar=""
            />
            <span
              className="h-2 w-2/5 rounded-full bg-border"
              data-art-bar=""
            />
          </span>
          <span className="type-mono-12 flex items-center gap-2 text-foreground">
            <span>
              baseURL<span className="text-muted-foreground">:</span>
            </span>
            <span className="relative inline-flex">
              <span
                className="absolute inset-y-0 left-0 my-auto h-2 w-16 rounded-full bg-border opacity-0"
                data-motion="old-url"
              />
              <span
                className="rounded-xs border border-primary bg-card px-2 py-1"
                data-motion="new-url"
              >
                <span className="inline-block" data-motion="new-url-text">
                  /v1
                </span>
              </span>
            </span>
          </span>
          <span className="flex gap-2">
            <span
              className="h-2 w-1/3 rounded-full bg-border"
              data-art-bar=""
            />
            <span
              className="h-2 w-1/6 rounded-full bg-border"
              data-art-bar=""
            />
          </span>
        </span>
      </span>
      <span
        className="flex items-center gap-3 rounded-md border border-border bg-chat-bubble-agent p-3 shadow-xs"
        data-motion="response"
      >
        <GateMark />
        <span
          className="type-mono-12 rounded-xs bg-success-100 px-2 text-success-800 dark:bg-success-500/15 dark:text-success-300"
          data-motion="status"
        >
          200
        </span>
        <span className="flex flex-1 flex-col gap-2">
          <span
            className="h-2 w-full rounded-full bg-border"
            data-art-bar=""
            data-motion="response-line"
          />
          <span
            className="h-2 w-2/3 rounded-full bg-border"
            data-art-bar=""
            data-motion="response-line"
          />
        </span>
      </span>
    </span>
  );
}

/* ─── Mobile art ───────────────────────────────────────────────────────── */

/** Mobile Gate Chat stage: a question and a three-line itinerary reply. */
export function MiniChat({ ref }: { ref?: Ref<HTMLSpanElement> }) {
  const rows = [
    ["Day 1", "Alfama and the castle"],
    ["Day 2", "Belém by the river"],
    ["Day 3", "A day trip to Sintra"],
  ];
  return (
    <span
      aria-hidden
      className="flex w-full max-w-72 flex-col gap-2"
      data-motion-root="mini-chat"
      ref={ref}
    >
      <span
        className="type-copy-12 max-w-[85%] self-end rounded-md border border-border bg-chat-bubble-user px-3 py-2 text-chat-bubble-user-foreground shadow-xs"
        data-motion="mini-bubble-user"
      >
        Plan a 3-day trip to Lisbon
      </span>
      <span className="flex items-end gap-2" data-motion="mini-reply">
        <span className="grid size-6 shrink-0 place-items-center rounded-xs border border-border bg-card">
          <GateMark className="size-4" />
        </span>
        <span className="type-copy-12 flex flex-col items-start gap-1 rounded-md border border-border bg-chat-bubble-agent px-3 py-2 text-chat-bubble-agent-foreground shadow-xs">
          {rows.map(([day, plan]) => (
            <span data-motion="mini-row" key={day}>
              <span className="type-label-12">{day}</span> {plan}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

/** "Continue on desktop" thumbnail: a letter dropping onto a laptop. */
export function DesktopMini({ ref }: { ref?: Ref<HTMLSpanElement> }) {
  return (
    <span
      aria-hidden
      className="relative flex shrink-0 flex-col items-center rounded-sm bg-muted p-2"
      data-motion-root="desktop-mini"
      ref={ref}
    >
      <span
        className="absolute top-1 left-1/2 grid size-4 -translate-x-1/2 place-items-center rounded-xs bg-primary text-primary-foreground opacity-0"
        data-motion="letter"
      >
        <Mail className="size-3" strokeWidth={1.75} />
      </span>
      <span className="flex h-12 w-20 items-center justify-center gap-1 rounded-t-xs border-2 border-foreground bg-card">
        {IMPROVED_CLIENTS.slice(0, 2).map((app) => (
          <span
            className="grid size-6 place-items-center rounded-xs bg-card"
            data-motion="app-row"
            key={app.id}
          >
            <AppIcon src={app.icon} />
          </span>
        ))}
      </span>
      <span className="-mx-1 h-1 self-stretch rounded-b-xs bg-foreground" />
    </span>
  );
}

/** Handoff stage: phone, a dotted trail with the letter, laptop with the
 *  app dock. `state` drives `data-state` (idle / sending / sent); "sent"
 *  shows the check on the laptop screen and parks the letter there. */
export function HandoffArt({
  state,
  ref,
}: {
  state: "idle" | "sending" | "sent";
  ref?: Ref<HTMLSpanElement>;
}) {
  return (
    <span
      aria-hidden
      className="grid w-full max-w-75 grid-cols-[auto_minmax(--spacing(6),1fr)_auto] items-center gap-2"
      data-motion-root="handoff-art"
      data-state={state}
      ref={ref}
    >
      <span className="grid h-15 w-9 place-items-center rounded-sm border-2 border-foreground bg-card text-foreground">
        <Mail className="size-3.5" strokeWidth={1.75} />
      </span>
      <span className="relative h-6">
        <span className="absolute inset-x-0 top-3 border-input border-t-2 border-dotted" />
        <span
          className={cn(
            "absolute top-0 grid size-6 place-items-center rounded-xs bg-primary text-primary-foreground",
            state === "sent" ? "right-0 opacity-0" : "left-1/2 -translate-x-1/2"
          )}
          data-motion="letter"
        >
          <Mail className="size-3" strokeWidth={1.75} />
        </span>
      </span>
      <span className="flex flex-col items-center">
        <span className="relative grid h-25 w-41 place-items-center rounded-t-sm border-2 border-foreground bg-card">
          {state === "sent" ? (
            <span
              className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"
              data-motion="check"
            >
              <Check className="size-3" strokeWidth={1.75} />
            </span>
          ) : null}
          <span className="grid grid-cols-5 gap-1 rounded-xs bg-muted p-1">
            {IMPROVED_CLIENTS.slice(0, 5).map((app) => (
              <span
                className="grid size-6 place-items-center rounded-xs bg-card"
                data-motion="app-row"
                key={app.id}
              >
                <AppIcon src={app.icon} />
              </span>
            ))}
          </span>
        </span>
        <span className="h-2 w-48 rounded-b-sm bg-foreground" />
      </span>
    </span>
  );
}

/* ─── Route figure ─────────────────────────────────────────────────────── */

/** App -> Gate -> target. `state`: idle (dashed wires), live (checking: the
 *  pulse rides the wires, `data-state="live"`), done (solid success wires
 *  and the check on the Gate tile). The tile columns are exactly tile-wide,
 *  so each wire runs edge to edge between tiles (owner 2026-10-09); labels
 *  sit in their own row and may overhang their column up to 128px, which
 *  the figure's side padding absorbs. The Gate tile is the Connect art's
 *  hub (card fill, full-colour mark) with the neutral tile border. */
export function RouteFigure({
  app,
  appIcon,
  target,
  targetIcon,
  state = "idle",
  caption,
  centered = false,
  ref,
}: {
  app: string;
  appIcon: ReactNode;
  target: string;
  targetIcon: ReactNode;
  state?: "idle" | "live" | "done";
  caption?: ReactNode;
  /** For a stage that centers the figure (owner 2026-10-09): the tile
   *  row sits 16px above the stage's centre line (an empty `1fr` row
   *  above mirrors the labels below; `mb-8` lifts the pair), labels
   *  reserve two lines so a wrapping target name never moves anything, and
   *  the caption pins to the stage's top-left corner, 16px in. The stage
   *  must be a positioned element. */
  centered?: boolean;
  ref?: Ref<HTMLElement>;
}) {
  // The tiles sit above the wires (z-10), so a packet slides out from under
  // its sender. Each wire carries the setup stage's packet (an 8px dot, as ConnectArt's
  // signal) outside the line's clip, so the dot can overhang the 2px line,
  // and a blue copy of the dashes (same box, so the dashes line up) that
  // the animator shows through a short travelling window. The verify step's
  // pulse has its own 2px clip: inside the dashed line, whose 2px is all
  // border, its 0px padding box clipped the pulse away.
  const wire = (hop: number) => (
    <span aria-hidden className="relative h-0.5">
      <span
        className={cn(
          "absolute inset-0",
          state === "done"
            ? "bg-success-600 dark:bg-success-400"
            : "border-input border-t-2 border-dashed"
        )}
      />
      <span className="absolute inset-0 overflow-hidden">
        <span
          className="absolute top-0 left-0 h-0.5 w-6 bg-info opacity-0"
          data-motion="route-pulse"
        />
      </span>
      <span
        className="absolute inset-0 border-info border-t-2 border-dashed opacity-0"
        data-motion="route-run"
        data-motion-index={hop}
      />
      <span
        className="absolute inset-0 opacity-0"
        data-motion="route-packet"
        data-motion-index={hop}
      >
        <span className="absolute top-1/2 left-0 size-2 -translate-y-1/2 rounded-full bg-info" />
      </span>
    </span>
  );
  const label = (text: string, column: string) => (
    <span
      className={cn(
        "type-label-14 wrap-anywhere w-max max-w-32 justify-self-center text-center text-foreground",
        column,
        centered && "min-h-10"
      )}
    >
      {text}
    </span>
  );
  return (
    <figure
      aria-label={`${app} through Gate to ${target}`}
      className={cn(
        "m-0 grid w-full grid-cols-[--spacing(14)_minmax(--spacing(4),1fr)_--spacing(18)_minmax(--spacing(4),1fr)_--spacing(14)] items-center gap-y-2 px-9",
        centered && "mb-8 grid-rows-[1fr_auto_1fr]"
      )}
      data-motion-root="route"
      data-state={state}
      ref={ref}
    >
      {centered ? <span aria-hidden className="col-span-full" /> : null}
      <span
        className="relative z-10 grid size-14 place-items-center rounded-md border border-border bg-card shadow-xs"
        data-motion="route-app"
      >
        {appIcon}
      </span>
      {wire(0)}
      <span
        className="relative z-10 grid size-18 place-items-center rounded-md border border-border bg-card shadow-xs"
        data-motion="route-gate"
      >
        <GateMark className="size-9" />
        {state === "done" ? (
          <span
            className="absolute -right-2 -bottom-2 grid size-6 place-items-center rounded-full border-2 border-background bg-success-600 text-primary-foreground dark:bg-success-400"
            data-motion="route-check"
          >
            <Check className="size-3" strokeWidth={1.75} />
          </span>
        ) : null}
      </span>
      {wire(1)}
      <span
        className="relative z-10 grid size-14 place-items-center rounded-md border border-border bg-card shadow-xs"
        data-motion="route-target"
      >
        {targetIcon}
      </span>
      <span className="col-span-full grid grid-cols-subgrid items-start gap-y-6 self-start">
        {label(app, "col-start-1")}
        {label("Gate", "col-start-3")}
        {label(target, "col-start-5")}
        {caption ? (
          <figcaption
            className={cn(
              "type-copy-12 col-span-full justify-self-center rounded-full border border-border bg-card px-3 py-1 text-muted-foreground",
              // `col-auto`: a grid column on an absolutely positioned box
              // makes the stage's grid lines its frame (inside the
              // stage padding); auto keeps the frame at the padding edge.
              centered && "absolute top-4 left-4 col-auto w-max"
            )}
          >
            {caption}
          </figcaption>
        ) : null}
      </span>
    </figure>
  );
}
