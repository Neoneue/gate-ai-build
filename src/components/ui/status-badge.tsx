import { CircleCheck, CircleSlash } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/**
 * ON/OFF state pill. The leading glyph (check vs. slash) distinguishes a status
 * badge from same-shaped tier/label badges (Free/Pro) at a glance — the icon is
 * an affordance for "this is a state indicator", not a restatement of the tone
 * (Badge contract #2). Color follows the variant via currentColor: success =
 * green, neutral = grey. The icon is aria-hidden since the ON/OFF text label
 * already carries the meaning.
 */
export function StatusBadge({ on }: { on: boolean }) {
  const Icon = on ? CircleCheck : CircleSlash;
  return (
    <Badge className="h-6" variant={on ? "success" : "neutral"}>
      <Icon aria-hidden className="size-3.5" />
      {on ? "ON" : "OFF"}
    </Badge>
  );
}
