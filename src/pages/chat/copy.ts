import type { ChatModelUnavailableReason } from "./contract";

/**
 * Every string the Gate Chat surface renders, copied verbatim from the
 * production site (`apps/dashboard-web/src/components/chat/copy.ts`). Do not
 * rewrite: these are the shipped labels. Original note follows.
 *
 * Every string the Gate Chat surface renders. Real implementation, not a mock:
 * these are the shipped labels, carried over from the reference demo's
 * `GATE_COPY` so the wording does not drift between the two builds.
 *
 * A catalogue rather than the repo's usual co-located constants (see
 * `components/gatekeeper/`) because seven components share these labels, and
 * co-locating would define the same string in two places.
 */
export const CHAT_COPY = {
  appName: "Gate Chat",
  availableModel: "Available",
  backToDashboard: "Back to dashboard",
  browseAllModels: "Browse all models",
  browseModels: "Browse models",
  chatActions: "Chat actions",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",

  addComparisonModel: "Compare",
  allProviders: "All providers",
  chooseModel: "Choose a model",
  chooseModelDescription:
    "The answer is routed, screened and billed to your org like any other Gate request",
  clearSearch: "Clear search",
  compare: "Compare models",
  code: "code",
  codeBlock: "code block",
  compressed: "compressed",
  cost: "cost",
  costPending: "Calculating…",
  costPendingHint:
    "Gate is still recording this request. The figure appears once settled.",
  copyResponse: "Copy response",
  conversationStats: "Conversation stats",
  conversationStatsDescription: "Usage recorded by Gate for this conversation.",
  conversationStatsLoading: "Loading conversation stats",
  conversationStatsUnavailable: "Stats are unavailable right now.",
  conversationStatsTimedOut: "Conversation stats timed out.",
  openConversationDetails: "Open conversation details",
  statMessages: "Messages",
  statTurns: "Turns",
  statTokensIn: "Tokens in",
  statTokensOut: "Tokens out",
  statCost: "Cost",
  statCompression: "Compression",
  statByokHint: "BYOK: billed by your upstream provider.",
  credits: "Credits",
  docs: "How Gate protects requests",
  docsLink: "Docs",
  estimateDisclosure: "Estimated. Gate's own record is authoritative",
  exportConversation: "Export",
  exportDescription:
    "Download this chat. Exports carry the messages and model names only, never credentials or Gate internals.",
  exportFailed: "The export could not be prepared. Try again.",
  exportFormatJson: "JSON",
  exportFormatMarkdown: "Markdown",
  exportPreparing: "Preparing your export…",
  exportReady: "Download",
  deleteChat: "Delete",
  deleteChatConfirm: "Delete chat",
  deleteChatDescription:
    "This removes the chat from your history. This can’t be undone.",
  history: "Chats",
  loadingChats: "Loading chats",
  incomplete: "Stopped: this answer is incomplete",
  landingDescription:
    "Ask any question, choose a model with your prompt, or compare two answers side by side.",
  landingTitle: "How can Gate help?",
  live: "Live",
  memories: "Memories",
  memoryToolsUser: "Let models save memories",
  memoryToolsUserDescription:
    "Models with tool support can save and forget durable facts while you chat.",
  memoryToolsConversation: "In this chat",
  memoryToolsInherit: "Inherit",
  memoryToolsOn: "On",
  memoryToolsOff: "Off",
  memoryRemembered: "Remembered",
  memoryForgotten: "Forgot",
  model: "Model",
  newChat: "New chat",
  openNavigation: "Open chat navigation",
  noModelsMatch: "No models match",
  noChatsYet: "Your conversations will appear here after you start a chat.",
  notCompressed: "Not compressed",
  otherProviders: "Other providers",
  projects: "Projects",
  prompt: "Prompt",
  protectedByGate: "Protected by Constellation Gate",
  requested: "Requested",
  recommendedModels: "Recommended in Gate",
  recommendedModelsDescription:
    "Available to this workspace, with your current model, favourites and recent use first.",
  currentModel: "Current",
  favouriteModel: "Favourite",
  recentModel: "Recent",
  renameChat: "Rename",
  renameChatDescription:
    "Choose a name that will make this conversation easy to find later.",
  preparingReply: "Preparing reply",
  replyFrom: "Reply from",
  responded: "Answered by",
  regenerateResponse: "Regenerate response",
  retryLane: "Retry this model",
  removeComparisonModel: "Remove comparison",
  searchChats: "Search chats",
  securityVerdict: "Gate security verdict",
  chatName: "Chat name",
  save: "Save",
  cancel: "Cancel",
  searchModels: "Search models",
  sendPrompt: "Send",
  scrollToLatest: "Scroll to latest",
  streaming: "Answering…",
  promptTokens: "in",
  tokens: "tokens",
  unavailable: "Unavailable",
  unavailableNotOffered: "Not offered by this workspace's providers",
  unavailableDisabled: "Turned off for this workspace",
  unavailableSuppressed: "Temporarily unavailable at the provider",

  attachFile: "Add an attachment",
  attachImage: "Image",
  attachImageHint: "PNG, JPG, GIF, WebP",
  attachImageDisabled: "Not for this model",
  attachText: "Text or data",
  attachTextHint: "TXT, MD, CSV, JSON",
  attachPdf: "PDF",
  attachPdfDisabled: "Not supported yet",
  composerLimitHint: "Shorten the prompt to keep typing.",
  attachmentNotRead: "Not sent to the model",
  attachmentNotReadHint:
    "Gate cannot extract text from this file type, so the model does not receive its contents.",
  attachmentSentAsImage: "Sent as an image",
  attachmentNoVision: "Not sent: this model cannot read images",
  attachmentNoVisionHint:
    "The selected model does not accept image attachments. Pick a model that does, or remove the image.",
  manageBilling: "Manage billing",
  lowBalanceTitle: "Credits are running low",
  lowBalanceBody: "Top up to keep sending requests.",
  lowBalanceDismiss: "Dismiss",
  upgrade: "Upgrade to Pro",
  viewMessage: "View message",
  you: "You",
} as const;

export function composerCountLabel(current: number, limit: number): string {
  return `${current.toLocaleString()}/${limit.toLocaleString()}`;
}

/**
 * Why a new chat did not open on the model the user last used. The reason is
 * load-bearing: "not available in this workspace" reads as a decision someone
 * made, which is only true of `disabled`. A provider the workspace never
 * carried, or one the gateway is backing off from, are different facts and a
 * user who reads the wrong one goes looking in the wrong place.
 */
export function lastModelDroppedLabel(
  dropped: string,
  opened: string,
  reason: ChatModelUnavailableReason
): string {
  const because =
    reason === "disabled"
      ? "is turned off for this workspace"
      : reason === "suppressed"
        ? "is temporarily unavailable at the provider"
        : "is not offered by this workspace's providers";
  return `${dropped} ${because}. This chat starts on ${opened}.`;
}

/** The reason-less path: a server too old to send one, so claim nothing about why. */
export function lastModelUnavailableLabel(
  dropped: string,
  opened: string
): string {
  return `${dropped} is not available in this workspace. This chat starts on ${opened}.`;
}

export function preparingReplyForLabel(modelLabel: string): string {
  return `${modelLabel} is preparing a reply`;
}

export function chatResultCountLabel(count: number): string {
  return `${count} ${count === 1 ? "chat" : "chats"}`;
}

export function noChatsMatchLabel(query: string): string {
  return `No chats match “${query}”.`;
}

/** "Showing 8 of 14 models": the count under the picker's search. */
export function modelCountLabel(shown: number, total: number): string {
  return `Showing ${shown} of ${total} ${total === 1 ? "model" : "models"}`;
}

/** Slot label for lane `index` (0-based). Comparison is N models, not just two. */
export function modelSlotLabel(index: number): string {
  return `Model ${index + 1}`;
}

export const CHAT_STARTER_PROMPTS = [
  "Compare two models on a technical decision",
  "Summarize a document and list the key risks",
  "Explain a security finding in plain language",
] as const;

export const CHAT_COMPOSER_PLACEHOLDER = "Message Gate Chat";
