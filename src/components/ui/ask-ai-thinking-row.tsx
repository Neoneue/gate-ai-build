import { Brain } from "lucide-react";

/* ─── AskAiThinkingRow — "Thinking …" placeholder before the reply lands ─────
 * NOTE: I could not find a thinking-state node in Figma. The five frames
 * supplied (`1114:6477`, `1107:2962`, `1096:5471`, `1114:7141`, `1108:4193`)
 * all show the composer mid-reply ("The Gatekeeper is replying…") and none
 * contains a thinking row, and the Dev Mode MCP `get_metadata` will not recurse
 * into a canvas, so the page cannot be enumerated to hunt for it. Built to the
 * agreed fallback: lucide `Brain` at the muted caption voice. Send the node id
 * and this is a quick reconcile.
 *
 * Left-aligned and bubble-less so it occupies the same column the reply will,
 * and sized so the swap to the real bubble does not jump the scroll.
 * The ellipsis is the repo's pure-CSS `animate-ellipsis` (reduced-motion safe,
 * decorative — "Thinking" carries the meaning). ─────────────────────────── */

export function AskAiThinkingRow() {
  return (
    <div className="flex items-center gap-2 px-1 py-3 text-muted-foreground">
      <Brain aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
      <span className="type-copy-14-tight">
        Thinking
        <span aria-hidden className="animate-ellipsis" />
      </span>
    </div>
  );
}
