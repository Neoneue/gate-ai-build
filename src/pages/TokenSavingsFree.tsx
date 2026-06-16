import { TokenSavings } from "@/pages/TokenSavings";

/** Free-tier Token Savings — identical to Pro (this surface is not gated in
 *  Free). Renders the Pro page verbatim; kept as its own `-free` route so the
 *  Free workspace stays self-consistent (badge + sidebar). */
export function TokenSavingsFree() {
  return <TokenSavings />;
}
