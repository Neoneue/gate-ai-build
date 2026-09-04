/** Message-column preview text for the Messages table.
 *
 *  Split into its own module because it is the ONLY thing on this page that
 *  needs the message bodies. It used to import `@/data/request-bodies`
 *  (~425 KB of verbatim transcripts) directly, which put that chunk on the
 *  Messages and Conversations list pages. The previews are now PRECOMPUTED by
 *  `scripts/build-request-previews.mjs` into `@/data/request-previews` (one
 *  masked line per row, ~20 KB); `messagePreview` reads that map and this
 *  module no longer touches the blob. `buildMessagePreview` below is the
 *  source of truth the generator and the drift test both call.
 *
 *  Coverage across the 153 rows, measured rather than assumed:
 *    userMessage  13   real user turns
 *    toolArgs     89   every tool-call row — Bash 40, Read 29, Edit 3, MCP 17
 *    summary     101   authored trace label (mostly "tool: <Name>")
 *    neither      51   the legacy cnv_* sessions carry no body at all
 *
 *  `summary` is the LAST resort, not the first: for a Bash row it reads
 *  "tool: Bash", which names the tool and tells you nothing about the call.
 *  `toolArgs` carries the actual command and already begins with its own
 *  "Bash: " / "Read: " prefix, so the preview reads
 *  `Bash: grep -n "isVerySlow" src/pages/...` with no prefixing of our own. */

import { redactFindings } from "@/data/redact";
import type { RequestBodyDetail } from "@/data/request-bodies";
import { REQUEST_PREVIEWS } from "@/data/request-previews";
import { requestRowId } from "@/data/requests";
import type { RequestRow } from "./types";

/** First non-blank line, with interior whitespace runs collapsed so tabs and
 *  aligned padding inside a captured command don't render as a ragged gap.
 *  Display-only normalization — no content is altered or invented. */
function firstLine(text: string | undefined): string {
  const line = (text ?? "").split("\n").find((l) => l.trim().length > 0);
  return (line ?? "").replace(/\s+/g, " ").trim();
}

/** What this request actually said, for the Message column's first line.
 *
 *  Resolution order is deliberate — most specific to least:
 *    1. the user's own message (strip the captured "User: " prefix)
 *    2. the tool call itself, args included
 *    3. the authored trace label
 *    4. undefined → the cell renders an em dash rather than a fabricated
 *       preview, matching how Cost handles BYOK
 *
 *  102 of 153 rows resolve to real text.
 *
 *  MASKING IS NOT OPTIONAL. Whatever text wins above is run through
 *  `redactFindings` before it leaves this function, so a value the gateway
 *  caught on ingress can never surface on a table row. Four rows leaked real
 *  email addresses (`chad@constellationnetwork.io`, `noreply@anthropic.com`)
 *  before this was added — truncation hid them at the current column width,
 *  but the DOM and the tooltip carried them in full. A PII-redaction product
 *  cannot display the PII it claims to have redacted.
 *
 *  Unlike the transcript, this masks findings of EVERY role, not just `user`.
 *  The transcript can scope by role because it knows which bubble it is
 *  rendering; this single line can be a user turn OR a tool call, so a
 *  role-scoped mask would leave a hole the detail view does not have.
 *  Over-masking shows a placeholder; under-masking leaks a secret. */
export function buildMessagePreview(
  row: RequestRow,
  body: RequestBodyDetail
): string | undefined {
  const text =
    firstLine(body.userMessage).replace(/^User:\s*/, "") ||
    firstLine(body.toolArgs) ||
    firstLine(row.summary);

  if (!text) {
    return;
  }
  return redactFindings(row.findings, text);
}

/** Table-facing lookup. Reads the generated map so the list pages never load
 *  the transcript blob; the value is exactly `buildMessagePreview(row,
 *  getRequestBody(row))`, pinned by the drift test. */
export function messagePreview(row: RequestRow): string | undefined {
  return REQUEST_PREVIEWS[requestRowId(row)];
}
