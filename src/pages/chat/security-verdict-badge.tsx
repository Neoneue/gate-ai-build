import { Badge } from "@/components/ui/badge";
import type { ChatSecurityCategory, ChatSecurityVerdict } from "./contract";

/**
 * One security verdict, as a badge, ported from the site's
 * `components/security-verdict-badge.tsx`.
 *
 *  1. **Nothing renders for an allow.** A null verdict returns null: a badge
 *     on traffic the pipeline never touched is noise.
 *  2. **The verdict names its reason.** "Flagged" alone leaves the reader to
 *     guess what happened; the category says what for.
 */

/** flag and redact share `warning`, block gets `destructive`: the same
    weighting the Messages guardrail column draws. */
const VERDICT_VARIANT: Record<ChatSecurityVerdict, "warning" | "destructive"> =
  {
    flag: "warning",
    redact: "warning",
    block: "destructive",
  };

const VERDICT_LABEL: Record<ChatSecurityVerdict, string> = {
  flag: "Flagged",
  redact: "Redacted",
  block: "Blocked",
};

/** Detector families in a reader's words, not the gateway's. */
const CATEGORY_LABEL: Record<ChatSecurityCategory, string> = {
  injection: "prompt injection",
  pii: "personal data",
  phi: "health data",
  credential: "credentials",
  other: "policy",
};

export interface SecurityVerdictBadgeProps {
  category?: ChatSecurityCategory | null;
  className?: string;
  /** Prepended to the badge's own words, never substituted for them. */
  contextLabel?: string;
  verdict: ChatSecurityVerdict | null;
}

export function SecurityVerdictBadge({
  verdict,
  category = null,
  className,
  contextLabel,
}: SecurityVerdictBadgeProps) {
  if (!verdict) {
    return null;
  }
  const label = category
    ? `${VERDICT_LABEL[verdict]}: ${CATEGORY_LABEL[category]}`
    : VERDICT_LABEL[verdict];
  return (
    <Badge
      aria-label={contextLabel ? `${contextLabel}, ${label}` : undefined}
      className={className}
      variant={VERDICT_VARIANT[verdict]}
    >
      {label}
    </Badge>
  );
}
