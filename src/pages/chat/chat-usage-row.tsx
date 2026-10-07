import { Info } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { TextLink } from "@/components/ui/text-link";
import { cn } from "@/lib/utils";
import { chatMessageUrl } from "./chat-links";
import { CHAT_COPY } from "./copy";
import { SecurityVerdictBadge } from "./security-verdict-badge";
import type { ChatUsage } from "./types";

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

/** Disclosed in the flow rather than on hover: an estimate the reader cannot see
    labelled is an estimate they will read as authoritative. */
export function ChatEstimateNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "type-copy-12 flex items-center gap-1 text-muted-foreground",
        className
      )}
    >
      <Info aria-hidden className="size-3 shrink-0" strokeWidth={1.75} />
      {CHAT_COPY.estimateDisclosure}
    </p>
  );
}

export interface ChatUsageRowProps {
  className?: string;
  usage: ChatUsage;
}

export function ChatUsageRow({ usage, className }: ChatUsageRowProps) {
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
      <div className="type-copy-12 flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-muted-foreground">
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
        {/* The metrics read as one sequence, so they wrap as one block. */}
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
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
              <Separator
                className="h-3 data-vertical:self-center"
                orientation="vertical"
              />
              <Metric
                pending={pending}
                suffix={CHAT_COPY.promptTokens}
                value={usage.promptTokens}
              />
              <Separator
                className="h-3 data-vertical:self-center"
                orientation="vertical"
              />
              <Metric
                pending={pending}
                suffix={CHAT_COPY.tokens}
                value={usage.tokens}
              />
              <Separator
                className="h-3 data-vertical:self-center"
                orientation="vertical"
              />
              <Metric
                pending={pending}
                suffix={CHAT_COPY.cost}
                value={usage.cost}
              />
            </>
          ) : (
            /* The share compression removed stands in for both token counts. */
            <>
              <Metric
                suffix={CHAT_COPY.compressed}
                value={compressionPercent}
              />
              <Separator
                className="h-3 data-vertical:self-center"
                orientation="vertical"
              />
              <Metric
                pending={pending}
                suffix={CHAT_COPY.cost}
                value={usage.cost}
              />
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
