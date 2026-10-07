import { BrainCircuit, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TextLink } from "@/components/ui/text-link";
import { cn } from "@/lib/utils";
import { ChatConversationStats } from "./chat-conversation-stats";
import { CHAT_TOUCH_TARGET } from "./chat-layout";
import { chatBillingUrl, chatConversationRecordUrl } from "./chat-links";
import { ChatMemoryPanel } from "./chat-memory-panel";
import { CHAT_COPY } from "./copy";
import type {
  ChatConversation,
  ChatConversationTotals,
  ChatCredits,
} from "./types";

export interface ChatHeaderProps {
  className?: string;
  conversation: ChatConversation;
  credits: ChatCredits;
  /** Writes the open conversation's memory tool override through the memory panel. */
  onMemoryToolsOverride?: (memoryToolsEnabled: boolean | null) => void;
  onOpenNavigation?: () => void;
  /** Session totals for the stats popover; null for an unsaved chat. */
  totals: ChatConversationTotals | null;
}

/**
 * Gate Chat's conversation bar: the row directly under `ChatTopBar`, carrying
 * only what belongs to the open chat. Ported from the site's
 * `components/chat/chat-header.tsx`.
 *
 * The upgrade action is entitlement-gated through `credits.pro`: a Pro or
 * Enterprise workspace is not offered Pro.
 */
export function ChatHeader({
  conversation,
  credits,
  totals,
  onOpenNavigation,
  onMemoryToolsOverride,
  className,
}: ChatHeaderProps) {
  const { pathname } = useLocation();
  // Only a saved conversation carries the override.
  const memoryToolsConversation =
    conversation.id && conversation.memoryToolsEnabled !== undefined
      ? {
          id: conversation.id,
          memoryToolsEnabled: conversation.memoryToolsEnabled,
        }
      : null;
  // Null until at least one turn reached the gateway.
  const recordUrl = chatConversationRecordUrl(pathname, conversation);

  return (
    <header
      className={cn(
        "flex h-14 w-full min-w-0 shrink-0 items-center gap-3 border-border border-b bg-card px-4 sm:px-6 lg:h-16",
        className
      )}
    >
      <Button
        aria-label={CHAT_COPY.openNavigation}
        className={cn(CHAT_TOUCH_TARGET, "-ml-2 lg:hidden")}
        onClick={onOpenNavigation}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Menu aria-hidden className="size-4" strokeWidth={1.75} />
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 items-center gap-1" data-slot="chat-title">
          <h1 className="type-heading-14 min-w-0 truncate text-foreground">
            {recordUrl ? (
              <TextLink
                className="truncate"
                title={conversation.title}
                to={recordUrl}
              >
                {conversation.title}
              </TextLink>
            ) : conversation.id ? (
              <span className="truncate" title={conversation.title}>
                {conversation.title}
              </span>
            ) : (
              CHAT_COPY.newChat
            )}
          </h1>
          {conversation.id ? (
            <ChatConversationStats
              conversationId={conversation.id}
              totals={totals}
            />
          ) : null}
        </div>
        {conversation.updatedLabel ? (
          <p className="type-copy-12 hidden shrink-0 text-muted-foreground sm:block">
            {conversation.updatedLabel}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 xl:flex">
          <span className="type-label-14 text-muted-foreground">
            {CHAT_COPY.credits}
          </span>
          {credits.low ? (
            <Badge variant="warning">{credits.balance}</Badge>
          ) : (
            <span className="type-mono-14 text-foreground">
              {credits.balance}
            </span>
          )}
        </div>
        {credits.pro ? null : (
          <>
            <Separator
              className="hidden h-6 data-vertical:self-center xl:block"
              orientation="vertical"
            />
            <Button
              className="hidden xl:inline-flex"
              nativeButton={false}
              render={<Link to={chatBillingUrl(pathname)} />}
              size="sm"
              variant="outline"
            >
              {CHAT_COPY.upgrade}
            </Button>
          </>
        )}
        <ChatMemoryPanel
          conversation={memoryToolsConversation}
          onMemoryToolsOverride={onMemoryToolsOverride}
          projectId={conversation.projectId}
          trigger={
            <Button
              aria-label={CHAT_COPY.memories}
              className={CHAT_TOUCH_TARGET}
              size="icon"
              type="button"
              variant="ghost"
            >
              <BrainCircuit aria-hidden className="size-4" strokeWidth={1.75} />
            </Button>
          }
        />
      </div>
    </header>
  );
}
