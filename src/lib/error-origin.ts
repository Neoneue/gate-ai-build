/**
 * User-facing error attribution for the Requests Details tab.
 *
 * Ported from the production dashboard (gate-main
 * apps/dashboard-web/src/lib/error-origin.ts). The gateway persists two fields
 * on every non-2xx request: `errorSource` (who was responsible) and
 * `errorCode` (the machine-readable failure). This module maps those raw
 * strings onto the customer-facing UI contract so an operator can tell at a
 * glance whether a failure was the gateway's fault, the provider's, or their
 * own configuration.
 *
 * Em dashes from the source copy are intentionally replaced with spaced
 * hyphens to match this project's writing style.
 */

/** Badge-ready attribution. `variant` maps 1:1 onto our Badge variants. */
export type ErrorOrigin = {
  /** Full label for the Error response badge (Badge renders it uppercase). */
  label: string;
  /** Compact label for dense surfaces (table cells, chips). */
  short: string;
  variant: "destructive" | "warning" | "info" | "neutral";
};

/**
 * Bucket a raw `errorSource` string into its UI origin contract.
 *
 * Unknown / null / undefined (success rows, or rows persisted before the
 * column existed) -> `null` so the caller renders no origin UI.
 */
export function errorOrigin(
  source: string | null | undefined
): ErrorOrigin | null {
  switch (source) {
    case "provider":
    case "vendor":
      return {
        label: "Provider error",
        short: "Provider",
        variant: "destructive",
      };
    case "gateway":
    case "pricing":
      return { label: "Gateway error", short: "Gateway", variant: "warning" };
    case "customer_config":
    case "byok_credentials":
      return { label: "Config error", short: "Config", variant: "info" };
    case "validation":
      return { label: "Request error", short: "Request", variant: "neutral" };
    default:
      return null;
  }
}

/**
 * Plain-language explanation keyed off the machine-readable `errorCode`, so the
 * Error response card reads like a sentence a non-engineer can act on.
 */
export function errorExplanation(
  code: string | null | undefined
): string | null {
  switch (code) {
    case "upstream_error":
      return "The model provider's API failed while serving this request. This was a provider-side issue - retrying usually succeeds.";
    case "upstream_timeout":
      return "The model provider didn't respond in time and the gateway stopped waiting. This was a provider-side issue - retrying usually succeeds.";
    case "upstream_bad_response":
      return "The provider returned a 200 OK but the response body was an error (or the stream ended early). The gateway surfaced it as a failure.";
    case "circuit_open":
      return "The gateway paused traffic to this provider after repeated failures and recovers automatically - wait a moment, then retry.";
    case "security_blocked":
      return "A security guardrail blocked this request before it reached the provider. This block was intentional - review the finding to see why.";
    case "rate_limit_exceeded":
      return "This request exceeded a gateway-enforced rate limit - slow down the request rate or raise the limit in your dashboard.";
    case "insufficient_balance":
      return "The request was rejected because the account balance couldn't cover it. Top up the balance, then retry.";
    case "missing_credentials":
      return "No usable provider credential was found for this request. Add or fix the key in your dashboard, then retry.";
    case "invalid_key":
      return "The API key on this request was invalid, expired, or revoked. Check the key in your dashboard and update your client.";
    default:
      return null;
  }
}
