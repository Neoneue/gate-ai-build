import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SparklesIcon } from "@/components/ui/sparkles";

// Shared Pro-upsell card for the `-free` feature pages. The icon and body copy
// vary per feature; everything else (Pro tier chrome, button) is baked in so
// a stylistic change here lands on every page that uses it.
export function ProUpgradeCard({
  icon: Icon,
  body,
  title = "Upgrade to use this feature",
}: {
  icon: LucideIcon;
  body: string;
  title?: string;
}) {
  return (
    <EmptyState
      action={
        <div className="pt-4">
          <Button
            render={<Link to="/billing" />}
            size="default"
            variant="promo"
          >
            <SparklesIcon aria-hidden data-icon="inline-start" size={16} />
            Upgrade to Pro
          </Button>
        </div>
      }
      body={body}
      /* Pro plan-tier surface (design.md §2). Accepted shifts 2026-09-18:
         the light fill moves blue-25 -> blue-50 and the dark edge
         blue-400/30 -> blue-500/30, both onto the documented tier rungs. */
      className="border-tier-pro-border bg-tier-pro-surface shadow-sm [&_h3]:text-balance"
      icon={
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full bg-tier-pro-wash"
        >
          <Icon className="size-5 text-tier-pro" />
        </div>
      }
      title={title}
    />
  );
}
