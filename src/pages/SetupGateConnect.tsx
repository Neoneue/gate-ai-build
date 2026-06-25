import { Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DownloadGateConnectDialog } from "@/pages/DashboardDefault";
import { SetupScaffold, WaitingStrip } from "@/pages/onboarding-shared";

/* ─── /setup-gate-connect-default ───────────────────────────────────────────
 * BYOK → Gate Connect: the automatic, no-config path. Three steps + a live
 * "listening" strip. Back breadcrumb → Pick how to connect.
 * ────────────────────────────────────────────────────────────────────────── */

export function SetupGateConnect() {
  return (
    <SetupScaffold
      backLabel="Connect options"
      backTo="/setup-connect-default"
      subtitle="Three steps. Gate Connect handles your key for you."
      title="Gate Connect"
    >
      <Card density="flush">
        <div className="flex items-center gap-3 border-border border-b px-6 py-4">
          <span
            aria-hidden
            className="inline-flex size-10 items-center justify-center rounded-md bg-blue-50 text-blue-700"
          >
            <Zap className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="type-heading-16 m-0 text-foreground">
              Gate Connect
            </h2>
            <p className="type-copy-14 m-0 text-muted-foreground">
              No config required.
            </p>
          </div>
        </div>

        <div className="flex flex-col px-6">
          <SetupStep
            active
            description="Menu-bar app for Mac and Windows."
            n={1}
            title="Download the app"
          >
            <DownloadGateConnectDialog />
          </SetupStep>
          <SetupStep
            description="Your key syncs automatically."
            n={2}
            title="Sign in"
          />
          <SetupStep
            description="Your apps now route through Gate."
            n={3}
            title="Flip the switch on"
          />
        </div>

        <div className="px-6 pt-2 pb-6">
          <WaitingStrip>Listening for your first request&hellip;</WaitingStrip>
        </div>
      </Card>
    </SetupScaffold>
  );
}

function SetupStep({
  n,
  title,
  description,
  active = false,
  children,
}: {
  n: number;
  title: string;
  description: string;
  active?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 border-border border-b py-4 last:border-b-0">
      <span
        aria-hidden
        className={cn(
          "type-label-14 mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-full tabular-nums",
          active
            ? "bg-blue-50 text-blue-700"
            : "bg-neutral-100 text-muted-foreground"
        )}
      >
        {n}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <span className="type-label-14 text-foreground">{title}</span>
        <span className="type-copy-14 text-muted-foreground">
          {description}
        </span>
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}
