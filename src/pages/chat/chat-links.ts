import { withTierOf } from "@/lib/plan";
import type { ChatConversation } from "./types";

/**
 * Where the chat surface points at the rest of Gate. Ported from the site's
 * `components/chat/chat-links.ts`, with one adaptation this build needs: the
 * dashboard is split into tier twins (`/billing` vs `/billing-free`), so every
 * target is carried onto the tier the chat is open in through `withTierOf`.
 * The site's `/messages/:id` detail is this build's `/messages-findings/:id`.
 */

/** The chat route for the tier `pathname` sits on: `/chat`, `/chat-free`, … */
export const chatHomePath = (pathname: string) => withTierOf(pathname, "/chat");

/** One conversation, on the same tier. */
export const chatConversationPath = (
  pathname: string,
  conversationId: string
) => withTierOf(pathname, `/chat/${encodeURIComponent(conversationId)}`);

export const chatMessageUrl = (pathname: string, messageId: string) =>
  withTierOf(pathname, `/messages-findings/${encodeURIComponent(messageId)}`);

export const chatConversationUrl = (pathname: string, conversationId: string) =>
  withTierOf(
    pathname,
    `/conversations-trace/${encodeURIComponent(conversationId)}`
  );

export const chatBillingUrl = (pathname: string) =>
  withTierOf(pathname, "/billing");

export const chatOverviewUrl = (pathname: string) =>
  withTierOf(pathname, "/overview");

/**
 * The open conversation's Gate record, or `null` when there is nothing to open.
 * The link is valid exactly when at least one lane actually reached the
 * gateway: a conversation whose turns were all refused before the relay ran
 * owns no session row. A lane's `usage.messageId` is its Gate request id, so it
 * is the same evidence the per-message **View message** link uses.
 */
export function chatConversationRecordUrl(
  pathname: string,
  conversation: ChatConversation
): string | null {
  if (!conversation.id) {
    return null;
  }
  const recorded = conversation.turns.some((turn) =>
    turn.lanes.some((lane) => lane.usage.messageId !== null)
  );
  return recorded ? chatConversationUrl(pathname, conversation.id) : null;
}
