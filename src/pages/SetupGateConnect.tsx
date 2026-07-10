import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLinkIcon } from "@/components/ui/external-link";
import { cn, randomHex } from "@/lib/utils";
import {
  CreateKeyButton,
  CreateKeyDialog,
  KeyCreatedDialog,
} from "@/pages/ApiKeys";
import { DownloadGateConnectDialog } from "@/pages/DashboardDefault";
import {
  AnimatedEllipsis,
  SetupScaffold,
  WaitingStrip,
} from "@/pages/onboarding-shared";

/* ─── /setup-gate-connect-default ───────────────────────────────────────────
 * BYOK → Gate Connect: download the menu-bar app, create an API key inline
 * (CreateKeyDialog + KeyCreatedDialog — no redirect to API Keys), then wait
 * for the first request. Back breadcrumb → Pick how to connect.
 * ────────────────────────────────────────────────────────────────────────── */

export function SetupGateConnect() {
  const [downloaded, setDownloaded] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [keySaved, setKeySaved] = useState(false);
  const [listeningForRequest, setListeningForRequest] = useState(false);

  const handleCreate = () => {
    setCreateOpen(false);
    setCreatedKey(`sk-gw-${randomHex(64)}`);
  };

  return (
    <SetupScaffold
      backLabel="Connect options"
      backTo="/setup-connect-default"
      subtitle="Download the app, create a key, and send your first request."
      title="Gate Connect"
    >
      <Card density="flush">
        <div className="flex flex-col gap-3 p-6">
          <SetupStep
            active
            description="Menu-bar app for Mac and Windows."
            n={1}
            title="Download the app"
          >
            <DownloadGateConnectDialog onDownload={() => setDownloaded(true)} />
          </SetupStep>
          <SetupStep
            active={downloaded || keySaved}
            description="Generated instantly. Shown once."
            dimmed={!downloaded}
            dimmedBlocking={false}
            n={2}
            title="Create an API key"
          >
            {keySaved ? null : (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    window.open(
                      "https://docs.constellationgate.ai",
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  variant="outline"
                >
                  API docs
                  <ExternalLinkIcon
                    aria-hidden
                    data-icon="inline-end"
                    size={16}
                  />
                </Button>
                <CreateKeyButton onClick={() => setCreateOpen(true)} />
              </div>
            )}
          </SetupStep>
          <SetupStep
            active={listeningForRequest}
            description="Open Gate Connect and run your tool once."
            dimmed={!listeningForRequest}
            footer={
              <WaitingStrip active={listeningForRequest}>
                Listening for your first request
                {listeningForRequest ? <AnimatedEllipsis /> : null}
              </WaitingStrip>
            }
            n={3}
            title="Send your first request"
          />
        </div>
      </Card>

      <CreateKeyDialog
        onCancel={() => setListeningForRequest(true)}
        onCreate={handleCreate}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />
      <KeyCreatedDialog
        fullKey={createdKey}
        onClose={() => {
          setCreatedKey(null);
          setKeySaved(true);
          setListeningForRequest(true);
        }}
      />
    </SetupScaffold>
  );
}

function SetupStep({
  n,
  title,
  description,
  active = false,
  dimmed = false,
  dimmedBlocking = true,
  children,
  footer,
}: {
  n: number;
  title: string;
  description: string;
  active?: boolean;
  dimmed?: boolean;
  /** When dimmed, block interaction. Step 2 stays clickable while visually dimmed. */
  dimmedBlocking?: boolean;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-sm border border-border bg-card p-4 transition-opacity duration-150 ease-out",
        dimmed && "opacity-50",
        dimmed && dimmedBlocking && "pointer-events-none"
      )}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={cn(
            "type-label-14 mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-full border tabular-nums",
            active
              ? "border-success-600 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300"
              : "border-border text-muted-foreground"
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
      {footer}
    </div>
  );
}
