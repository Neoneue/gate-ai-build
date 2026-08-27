/** Canonical masking for captured message text.
 *
 *  The gateway redacts PII and credentials on ingress, before the prompt
 *  reaches the provider, so a caught value must never be re-exposed on any
 *  surface that reconstructs a message from gateway logs. This is the single
 *  implementation of that rule; every surface that renders captured text runs
 *  its string through here so the table, the conversation transcript, and the
 *  request-detail redaction diff cannot disagree about what was masked.
 *
 *  `split`/`join` does a literal global replace — the matches hold `.`, `@`,
 *  and `/`, so a regex path would need escaping for no benefit. */
import type { RequestFinding } from "@/data/requests";

export function redactFindings(
  findings: RequestFinding[] | undefined,
  text: string,
  { userOnly = false }: { userOnly?: boolean } = {}
): string {
  if (!findings?.length) {
    return text;
  }
  let out = text;
  for (const f of findings) {
    if (userOnly && f.role !== "user") {
      continue;
    }
    out = out.split(f.match).join(f.redactedAs);
  }
  return out;
}
