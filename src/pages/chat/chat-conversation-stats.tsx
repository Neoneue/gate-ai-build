import { Activity, ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCompactCount } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { formatExactUsd } from "./chat-data";
import { CHAT_TOUCH_TARGET } from "./chat-layout";
import { chatConversationUrl } from "./chat-links";
import { CHAT_COPY } from "./copy";
import type { ChatConversationTotals } from "./types";

const DASH = "—";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-border border-b py-3 odd:pr-3 even:pl-3 sm:[&:nth-last-child(-n+2)]:border-b-0">
      <p className="type-label-12 text-muted-foreground">{label}</p>
      <p className="type-mono-16 truncate text-foreground" title={hint}>
        {value}
      </p>
    </div>
  );
}

/**
 * Compact session totals for the open conversation, ported from the site's
 * `components/chat/chat-conversation-stats.tsx`. The site fetches them from
 * the session record; here they are summed from the conversation's own lanes
 * (`conversationTotals` in `@/data/gate-chat`), so the popover and the usage
 * rows under each answer can never disagree.
 */
export function ChatConversationStats({
  conversationId,
  totals,
}: {
  conversationId: string;
  totals: ChatConversationTotals | null;
}) {
  const { pathname } = useLocation();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label={CHAT_COPY.conversationStats}
            className={cn(CHAT_TOUCH_TARGET, "shrink-0")}
            size="icon"
            type="button"
            variant="ghost"
          />
        }
      >
        <Activity aria-hidden className="size-4" strokeWidth={1.75} />
      </PopoverTrigger>
      {/* design-allow-clip: the only focusable inside is the footer link,
          which sits in its own p-2 band, 8px clear of the scrollport edge. */}
      <PopoverContent
        align="end"
        className="max-h-[calc(100dvh-2rem)] w-[min(calc(100vw-2rem),25rem)] overflow-y-auto overscroll-contain p-0"
        sideOffset={8}
      >
        <div className="flex flex-col gap-1 border-border border-b px-4 py-3">
          <h2 className="type-heading-14 text-foreground">
            {CHAT_COPY.conversationStats}
          </h2>
          <p className="type-copy-12 text-muted-foreground">
            {CHAT_COPY.conversationStatsDescription}
          </p>
        </div>

        {totals ? (
          <div className="grid grid-cols-2 px-4">
            <Stat
              label={CHAT_COPY.statMessages}
              value={formatCompactCount(totals.totalRequests)}
            />
            <Stat
              label={CHAT_COPY.statTurns}
              value={formatCompactCount(totals.totalTurns)}
            />
            <Stat
              label={CHAT_COPY.statTokensIn}
              value={formatCompactCount(totals.promptTokens)}
            />
            <Stat
              label={CHAT_COPY.statTokensOut}
              value={formatCompactCount(totals.completionTokens)}
            />
            <Stat
              hint={totals.isByok ? CHAT_COPY.statByokHint : undefined}
              label={CHAT_COPY.statCost}
              value={totals.isByok ? DASH : formatExactUsd(totals.totalCostUsd)}
            />
            <Stat
              label={CHAT_COPY.statCompression}
              value={
                totals.compressionPct === null
                  ? DASH
                  : `${totals.compressionPct.toFixed(1)}%`
              }
            />
          </div>
        ) : (
          <p className="type-copy-14 px-4 py-6 text-muted-foreground">
            {CHAT_COPY.conversationStatsUnavailable}
          </p>
        )}

        {totals ? (
          <div className="border-border border-t p-2">
            <Button
              className="w-full justify-between"
              nativeButton={false}
              render={
                <Link to={chatConversationUrl(pathname, conversationId)} />
              }
              size="sm"
              variant="ghost"
            >
              {CHAT_COPY.openConversationDetails}
              <ArrowUpRight
                aria-hidden
                className="size-4"
                data-icon="inline-end"
                strokeWidth={1.75}
              />
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
