import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SparklesIcon } from "@/components/ui/sparkles";

// Shared Pro-upsell card for the `-free` feature pages. The icon and body copy
// vary per feature; everything else (blue card chrome, button) is baked in so
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
  const navigate = useNavigate();
  return (
    <EmptyState
      action={
        <div className="pt-4">
          <Button
            className="bg-blue-700 text-white shadow-blue-700/30 shadow-sm hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
            onClick={() => navigate("/billing")}
          >
            <SparklesIcon aria-hidden data-icon="inline-start" size={16} />
            Upgrade to Pro
          </Button>
        </div>
      }
      body={body}
      className="border-blue-200 bg-blue-25 shadow-sm dark:border-blue-400/30 dark:bg-blue-500/10 [&_h3]:text-balance"
      icon={
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/15"
        >
          <Icon className="size-5 text-blue-700 dark:text-blue-400" />
        </div>
      }
      title={title}
    />
  );
}
