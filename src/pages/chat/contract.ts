/* ─────────────────────────────────────────────────────────────────────────
 * Gate Chat contract — the slice of `@gate/shared/chat-contract` the chat UI
 * reads, ported verbatim from the production monorepo
 * (`packages/shared/src/chat-contract.ts`). This build has no backend and no
 * shared package, so the constants and unions the components branch on live
 * here instead. Values are the site's own; do not retune them locally.
 * ───────────────────────────────────────────────────────────────────────── */

/** Rejected with `input_too_long` before any upstream call, so nothing is billed. */
export const CHAT_MAX_INPUT_CHARS = 32_000;

/** The attachment types whose contents are quoted into the prompt. Everything
 *  else the uploader accepts (PDFs, images) is stored and shown, but the model
 *  is never given its bytes, so the chip has to say so. */
export const CHAT_ATTACHMENT_TEXT_CONTENT_TYPES: readonly string[] = [
  "application/json",
  "text/plain",
  "text/markdown",
  "text/csv",
];

/** True when this type's contents reach the model. Parameters (`; charset=`) are ignored. */
export function isExtractableChatAttachment(contentType: string): boolean {
  return CHAT_ATTACHMENT_TEXT_CONTENT_TYPES.includes(
    contentType.split(";")[0].trim().toLowerCase()
  );
}

/** The attachment types delivered to a vision-capable model as image content
 *  rather than quoted as text. */
export const CHAT_ATTACHMENT_IMAGE_CONTENT_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

/** True when this type is delivered as image content to a model that reports vision support. */
export function isImageChatAttachment(contentType: string): boolean {
  return CHAT_ATTACHMENT_IMAGE_CONTENT_TYPES.includes(
    contentType.split(";")[0].trim().toLowerCase()
  );
}

export type ChatExportFormat = "markdown" | "json";

export type ChatModelUnavailableReason =
  | "not_offered"
  | "disabled"
  | "suppressed";

export type ChatUsageSettlement = "pending" | "settled" | "unavailable";

export type ChatSecurityVerdict = "flag" | "redact" | "block";

export type ChatSecurityCategory =
  | "injection"
  | "pii"
  | "phi"
  | "credential"
  | "other";

export type ChatErrorCode =
  | "invalid_request"
  | "not_found"
  | "input_too_long"
  | "context_too_long"
  | "generation_in_progress"
  | "rate_limited"
  | "insufficient_credits"
  | "model_lacks_vision"
  | "model_unavailable"
  | "security_blocked"
  | "provider_error"
  | "upstream_timeout"
  | "configuration_error"
  | "attachment_rejected"
  | "export_failed"
  | "aborted";

/** A saved memory row, the shape the memory panel lists. */
export interface ChatMemory {
  content: string;
  /** A disabled memory is kept but not recalled into prompts. */
  enabled: boolean;
  id: string;
  key: string;
  /** Null is a user-wide memory; set scopes it to one project. */
  projectId: string | null;
}
