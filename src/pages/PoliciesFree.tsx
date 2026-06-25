import { Policies } from "@/pages/Policies";

/** Free-tier twin of Policies. Renders the Pro page in its `free` variant,
 *  which pins a "Free plan screening" card atop the prompt-injection settings.
 *  Diverge further here as the tiers split. */
export function PoliciesFree() {
  return <Policies variant="free" />;
}
