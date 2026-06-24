import { Fingerprint, List } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { TextLink } from "@/components/ui/text-link";
import { DashboardChrome } from "@/layouts/DashboardChrome";

const DIGITAL_EVIDENCE_DOCS_URL =
  "https://constellation-main.gitbook.io/digital-evidence";

export function AuditTrailDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="audit-trail"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-1/2 flex-col gap-2">
          <PageTitle>Audit trail</PageTitle>
          <p className="type-copy-16 m-0 text-pretty text-neutral-500 tracking-snug">
            A tamper-evident record of every request, response, and policy
            decision the gateway handled. Investigate exactly what happened, and
            let anyone verify it independently.
          </p>
          <p className="type-copy-16 m-0 text-pretty text-neutral-500 tracking-snug">
            To learn more, check out our{" "}
            <TextLink
              as="a"
              href={DIGITAL_EVIDENCE_DOCS_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Digital Evidence docs
            </TextLink>
            .
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionTitle>Overview</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-md border border-border bg-card shadow-xs">
            <div className="flex flex-col items-center justify-center gap-3 p-6">
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <List className="size-5 text-neutral-700" strokeWidth={1.75} />
              </div>
              <span className="type-copy-14 text-neutral-500">
                No events logged
              </span>
            </div>
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-card shadow-xs">
            <div className="flex flex-col items-center justify-center gap-3 p-6">
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <Fingerprint
                  className="size-5 text-neutral-700"
                  strokeWidth={1.75}
                />
              </div>
              <span className="type-copy-14 text-neutral-500">
                No fingerprints logged
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        <SectionTitle>Event log</SectionTitle>
        <Card density="flush">
          <TableEmptyState
            body="Audit events will appear here as your workspace routes traffic through the gateway."
            icon={
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <List className="size-5 text-neutral-700" strokeWidth={1.75} />
              </div>
            }
            title="No audit events"
          />
        </Card>
      </div>
    </DashboardChrome>
  );
}
