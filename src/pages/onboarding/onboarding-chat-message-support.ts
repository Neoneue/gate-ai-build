import type { ChatTurn } from "@/pages/chat/types";

/**
 * Whether the onboarding message copy (`onboarding-chat-message.tsx`) draws
 * the turn in full: no prompt attachments and no memory chips, the parts it
 * leaves out. A turn that carries either keeps the shared `ChatMessage`.
 * Lives outside the component file so that file exports components only
 * (react-refresh).
 */
export const canUseOnboardingChatMessage = (turn: ChatTurn): boolean =>
  turn.promptAttachments.length === 0 &&
  turn.lanes.every((lane) => !lane.memories?.length);
