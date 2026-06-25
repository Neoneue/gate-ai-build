import { TokenSavings } from "@/pages/TokenSavings";

/** Free-tier Token Savings — shows the full Compression comparison: the Basic
 *  (Free) card alongside the Advanced (Pro) upsell CTA. The Pro view drops the
 *  Basic card and the upsell treatment (see `TokenSavings` `plan` prop). */
export function TokenSavingsFree() {
  return <TokenSavings plan="free" />;
}
