import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SettingsRow } from "@/components/ui/settings-row";
import { TextLink } from "@/components/ui/text-link";
import type { TeamRow } from "@/data/teams";
import { formatNumber } from "@/lib/formatters";
import { GUARDRAIL_BADGE } from "@/pages/requests/data";
import {
  securityForTeam,
  type TeamSecurity,
  type TeamSecuritySlice,
} from "@/pages/teams/security-data";

/* ─────────────────────────────────────────────────────────────────────────
 * Team detail → Security tab.
 *
 * Counts and labels only. This surface never renders prompt or response
 * content, which is what lets it read without a prompt-visibility grant —
 * the second paragraph of the summary card states that contract, and the
 * data layer keeps it: `securityForTeam` returns numbers, never text.
 *
 * Two shapes:
 *   · `variant="default"` — the Default workspace keeps the empty state.
 *   · `variant="pro"`     — the five stacked count cards below.
 * Teams do not exist on the Free plan, so there is no Free shape.
 * A team with nothing on record falls back to the empty state in every
 * variant: there is no honest way to populate "out of 0 checks".
 * ───────────────────────────────────────────────────────────────────────── */

export type TeamsVariant = "pro" | "default";

export function TeamSecurityPane({
  team,
  variant,
  onOpenSecurity,
}: {
  team: TeamRow;
  variant: TeamsVariant;
  /** Navigates to the org Security page. */
  onOpenSecurity: () => void;
}) {
  const security = securityForTeam(team);

  if (variant === "default" || security.checks === 0) {
    return <GuardrailEmptyState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <SummaryCard onOpenSecurity={onOpenSecurity} security={security} />
      <OutcomeCard security={security} />
      {/* By-category and by-member count FINDINGS, so a clean team empties
          them while the stage card still counts every scan. The empty copy
          says which of the two it is: nothing fired, versus nothing recorded
          for a team that does have findings. */}
      <StatListCard
        emptyBody={
          security.findings === 0
            ? "Nothing to attribute. No detector fired on this team’s traffic, so there is no category to report."
            : "No categories recorded."
        }
        rows={security.byCategory}
        subtitle="What the detectors identified."
        title="By category"
      />
      <StatListCard
        rows={security.byStage}
        subtitle="Where each check ran."
        title="By pipeline stage"
      />
      <StatListCard
        emptyBody={
          security.findings === 0
            ? "Nothing to attribute. No detector fired on this team’s traffic. Per-member request volume lives on the Usage tab."
            : "No per-member data recorded."
        }
        rows={security.byMember}
        subtitle="Who made the checked requests."
        title="By member"
      />
    </div>
  );
}

/** Optional icon slot so the Enterprise pane can match its sibling tabs'
 *  icon-chip empty states; Pro passes nothing and renders as before. */
export function GuardrailEmptyState({ icon }: { icon?: React.ReactNode }) {
  return (
    <EmptyState
      body="No guardrail check has been recorded for this team yet. This covers everything on record for the team, not a date range. Once requests start flowing, their verdicts appear here."
      icon={icon}
      title="No guardrail activity"
    />
  );
}

/* ─── 1. Summary ───────────────────────────────────────────────────────── */

function SummaryCard({
  security,
  onOpenSecurity,
}: {
  security: TeamSecurity;
  onOpenSecurity: () => void;
}) {
  // A team can run thousands of checks and record nothing. That is the good
  // outcome, so the headline states it as a result rather than as "0".
  const clean = security.findings === 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {clean
            ? "No security findings"
            : `${formatNumber(security.findings)} security findings`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          {clean
            ? `Nothing was detected in ${formatNumber(security.checks)} guardrail checks on this team’s traffic.`
            : `Out of ${formatNumber(security.checks)} guardrail checks on this team’s traffic.`}{" "}
          Every request is scanned on the way to the model and again on the
          reply, so a clean request still records checks. Counts cover
          everything on record for this team, not a date range.
        </p>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          Counts and labels only: this tab never shows prompt or response
          content, so it is readable without any prompt-visibility grant.
        </p>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          The full event log lives on the{" "}
          <TextLink onClick={onOpenSecurity}>org Security page</TextLink>. That
          page lists only requests where something was detected, which is why a
          team with no findings shows nothing there. It also covers the whole
          org and has no team filter, so it is not scoped to this team.
        </p>
      </CardContent>
    </Card>
  );
}

/* ─── 2. By outcome ────────────────────────────────────────────────────── */

function OutcomeCard({ security }: { security: TeamSecurity }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>By outcome</CardTitle>
        <CardDescription>
          All {formatNumber(security.checks)} checks on record, by what each one
          decided.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {security.byOutcome.map((row, i) => (
          <SettingsRow
            alignTop
            control={<StatCount value={row.count} />}
            first={i === 0}
            key={row.id}
            static
            subtitle={row.description}
            title={
              <Badge variant={GUARDRAIL_BADGE[row.action].variant}>
                {row.label}
              </Badge>
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── 3–5. Plain label lists ───────────────────────────────────────────── */

function StatListCard({
  title,
  subtitle,
  rows,
  emptyBody,
}: {
  title: string;
  subtitle: string;
  rows: TeamSecuritySlice[];
  /** Shown in place of the rows when the list is empty. Omitted on cards that
   *  can never empty (the stage card counts every scan). */
  emptyBody?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 && emptyBody ? (
          <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
            {emptyBody}
          </p>
        ) : (
          rows.map((row, i) => (
            <SettingsRow
              alignTop
              control={<StatCount value={row.count} />}
              first={i === 0}
              key={row.id}
              static
              subtitle={row.description}
              title={row.label}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function StatCount({ value }: { value: number }) {
  return (
    <span className="type-mono-14 block whitespace-nowrap text-right text-foreground">
      {formatNumber(value)}
    </span>
  );
}
