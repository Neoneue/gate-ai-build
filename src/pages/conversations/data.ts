/** Pure data + helpers for the Conversations page. No JSX, no React — the page
 *  module stays component-only (react-refresh), mirroring `requests/data.ts`.
 *
 *  New file 2026-08-03 with the model-catalog reconciliation: the model filter
 *  used to be a hand-typed array inside `Conversations.tsx` listing ten models,
 *  six of which the gateway does not serve. It is derived now, and living out
 *  here means the catalog-coverage test can read it without importing a page. */
import type { Vendor } from "@/components/icons/vendor-meta";
import { getConversationView } from "@/data/conversationDetail";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { MODEL_OPTIONS } from "@/data/models";
import { REQUEST_ROWS_ALL } from "@/data/requests";

/** Model options for the toolbar Select. Derived from the catalog and narrowed
 *  to the models the conversations' own request rows actually ran, so the
 *  dropdown cannot offer a model the gateway does not serve, or one that can
 *  only ever return an empty table. Each carries its vendor so the item renders
 *  the brand icon (VendorAvatar) on the left. */
export const MODEL_FILTER_OPTIONS: {
  value: string;
  label: string;
  vendor: Vendor;
}[] = (() => {
  const used = new Set(
    CONVERSATION_ROWS.flatMap(
      (seed) => getConversationView(seed, REQUEST_ROWS_ALL).models
    )
  );
  return MODEL_OPTIONS.filter((m) => used.has(m.handle)).map((m) => ({
    value: m.handle,
    label: m.label,
    vendor: m.vendor,
  }));
})();
