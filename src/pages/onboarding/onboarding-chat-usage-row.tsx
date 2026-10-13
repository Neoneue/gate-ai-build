import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { TextLink } from "@/components/ui/text-link";
import { cn } from "@/lib/utils";
import { chatMessageUrl } from "@/pages/chat/chat-links";
import { ChatEstimateNote } from "@/pages/chat/chat-usage-row";
import { CHAT_COPY } from "@/pages/chat/copy";
import { SecurityVerdictBadge } from "@/pages/chat/security-verdict-badge";
import type { ChatUsage } from "@/pages/chat/types";

/* ─────────────────────────────────────────────────────────────────────────
 * The onboarding copy of `pages/chat/chat-usage-row.tsx` (owner
 * 2026-10-12), for the Mobile A reply cards, so it can change without
 * touching the shared row on Free, Default, Pro and Enterprise. Change it
 * here, never in the shared row.
 *
 * It differs in one way: the metrics block can break between metrics. At
 * 200% text the block ("Not compressed | 4 in | 46 tokens | $0.00 cost")
 * is wider than a phone card, and as one unbreakable run it pushed the
 * page sideways. Capped at the row's width (`max-w-full`), it wraps inside
 * itself, and each separator travels with the metric after it, so a wrapped
 * line opens on its rule and no line ends on a bare one. At 100% the block
 * fits on one line and lays out exactly as the shared row's.
 * ───────────────────────────────────────────────────────────────────────── */

/** A null field is "not recorded", which is never the same claim as zero, so it
    renders the unavailable word instead of a formatted number. A settle-owned
    field of a lane Gate is still recording is neither, so it says so. */
function Metric({
  value,
  suffix,
  fallback,
  pending,
}: {
  value: string | null;
  suffix?: string;
  fallback?: string;
  pending?: boolean;
}) {
  // A number in hand always wins over `pending`.
  if (value !== null) {
    return (
      <span className="flex items-baseline gap-1">
        <span className="type-mono-12 text-foreground">{value}</span>
        {suffix ? <span>{suffix}</span> : null}
      </span>
    );
  }
  if (pending) {
    return (
      <span className="text-muted-foreground" title={CHAT_COPY.costPendingHint}>
        {CHAT_COPY.costPending}
      </span>
    );
  }
  return (
    <span className="text-muted-foreground">
      {fallback ?? CHAT_COPY.unavailable}
    </span>
  );
}

/** A separator and the metric after it, kept on one line together. */
function Separated({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Separator
        className="h-3 data-vertical:self-center"
        orientation="vertical"
      />
      {children}
    </span>
  );
}

export interface OnboardingChatUsageRowProps {
  className?: string;
  usage: ChatUsage;
}

export function OnboardingChatUsageRow({
  usage,
  className,
}: OnboardingChatUsageRowProps) {
  const { pathname } = useLocation();
  const isPrompt = usage.kind === "prompt";
  const pending = usage.settlement === "pending";
  const compressionPercent = usage.compressionPercent ?? null;

  // Gate records no usage of its own against a prompt row, so one with nothing
  // on it has nothing to disclose.
  if (
    isPrompt &&
    !pending &&
    usage.promptTokens === null &&
    usage.tokens === null
  ) {
    return null;
  }

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      {/* `leading-normal!`: the voice's 12/18 line box as a ratio (1.5, 18px
          at 100%), so wrapped metric lines keep their spacing at 200%. */}
      <div className="type-copy-12 flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-muted-foreground leading-normal!">
        {/* The prompt row keeps its word: it sits under the same answer and
            would otherwise be unattributable. */}
        {isPrompt ? (
          <span className="type-label-12 shrink-0 text-foreground">
            {CHAT_COPY.prompt}
          </span>
        ) : null}
        {/* Leads the row because a verdict outranks a number. */}
        {!(isPrompt || pending) && usage.security ? (
          <SecurityVerdictBadge
            category={usage.security.category}
            contextLabel={CHAT_COPY.securityVerdict}
            verdict={usage.security.verdict}
          />
        ) : null}
        {/* The metrics read as one sequence, so they wrap as one block, and
            inside it only between metrics when the block alone is wider
            than the row. */}
        <span className="flex max-w-full shrink-0 flex-wrap items-center gap-x-2 gap-y-1 whitespace-nowrap">
          {isPrompt ? (
            <Metric
              pending={pending}
              suffix={CHAT_COPY.tokens}
              value={usage.promptTokens ?? usage.tokens}
            />
          ) : compressionPercent === null ? (
            <>
              {/* A settled row with no compression figure means the gateway ran
                  no compression on it, which is a fact, not a gap. */}
              <Metric
                fallback={
                  usage.settlement === "settled"
                    ? CHAT_COPY.notCompressed
                    : undefined
                }
                pending={pending}
                suffix={CHAT_COPY.compressed}
                value={usage.compression}
              />
              <Separated>
                <Metric
                  pending={pending}
                  suffix={CHAT_COPY.promptTokens}
                  value={usage.promptTokens}
                />
              </Separated>
              <Separated>
                <Metric
                  pending={pending}
                  suffix={CHAT_COPY.tokens}
                  value={usage.tokens}
                />
              </Separated>
              <Separated>
                <Metric
                  pending={pending}
                  suffix={CHAT_COPY.cost}
                  value={usage.cost}
                />
              </Separated>
            </>
          ) : (
            /* The share compression removed stands in for both token counts. */
            <>
              <Metric
                suffix={CHAT_COPY.compressed}
                value={compressionPercent}
              />
              <Separated>
                <Metric
                  pending={pending}
                  suffix={CHAT_COPY.cost}
                  value={usage.cost}
                />
              </Separated>
            </>
          )}
        </span>
        {usage.messageId ? (
          <TextLink
            as="a"
            className="type-label-12 shrink-0"
            href={chatMessageUrl(pathname, usage.messageId)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {CHAT_COPY.viewMessage}
          </TextLink>
        ) : null}
      </div>
      {/* Derived from the cost, so it cannot be shown before there is one. */}
      {usage.estimated && !pending ? <ChatEstimateNote /> : null}
    </div>
  );
}
