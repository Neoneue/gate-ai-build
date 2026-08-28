import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactKpi } from "@/components/ui/compact-kpi";
import { EmptyState } from "@/components/ui/empty-state";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { KpiRail } from "@/components/ui/kpi-rail";
import { Monogram } from "@/components/ui/monogram";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsCount } from "@/components/ui/tabs-count";
import { MEMBER_ROWS } from "@/data/team-members";
import {
  ASSIGNABLE_KEYS,
  keyById,
  memberById,
  moveMembersToTeam,
  TEAM_SEED_ROWS,
  type TeamBudget,
  type TeamRole,
  type TeamRow,
  type TeamUsage,
  teamOfMember,
  teamRole,
  type UsageSlice,
  usageForTeam,
  withManager,
} from "@/data/teams";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import {
  formatCompactCount,
  formatCurrency,
  formatNumber,
} from "@/lib/formatters";
import { BudgetSummary } from "@/pages/teams/budget";
import {
  AddKeysDialog,
  AddMembersDialog,
  BudgetDialog,
} from "@/pages/teams/dialogs";
import {
  TeamSecurityPane,
  type TeamsVariant,
} from "@/pages/teams/SecurityPane";

/* ─────────────────────────────────────────────────────────────────────────
 * Team detail (route: /teams/:teamId)
 *
 * A PAGE, not a modal — the team is URL-addressable and shareable, same as
 * the Messages findings and Conversations trace surfaces.
 *
 * Owns its own `useState(TEAM_SEED_ROWS)` so the "which keys are still
 * unassigned" question can be answered across every team, not just this one.
 * Mutations are local to the visit; the seed is the shared starting point.
 * ───────────────────────────────────────────────────────────────────────── */

const WHITESPACE_RE = /\s+/;

function initialsOf(name: string): string {
  const parts = name.trim().split(WHITESPACE_RE);
  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase() ?? "";
  }
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

export function TeamDetail({
  variant = "pro",
}: {
  variant?: TeamsVariant;
} = {}) {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // Back goes to the list twin the user came from, so a Default-workspace
  // drill-in never lands them in the Pro list. Teams are Pro + Enterprise
  // only — there is no Free twin to route to.
  const listPath = variant === "default" ? "/teams-default" : "/teams";
  const securityPath =
    variant === "default" ? "/security-default" : "/security";

  const [teams, setTeams] = useState<TeamRow[]>(TEAM_SEED_ROWS);
  const team = teams.find((t) => t.id === teamId);

  const patch = (next: Partial<TeamRow>) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, ...next } : t))
    );
  };

  // Adding a member is a MOVE (PRD 3 / 8.1), so it writes across the whole
  // array, not just this team — which is why the page holds every team rather
  // than the one it is showing. Same state that lets "Add keys" know which
  // keys another team already holds.
  const moveMembers = (ids: string[]) => {
    if (!teamId) {
      return;
    }
    setTeams((prev) => moveMembersToTeam(prev, teamId, ids));
  };

  const setRole = (memberId: string, role: TeamRole) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? withManager(t, memberId, role) : t))
    );
  };

  return (
    <DashboardChrome
      activeNavId="teams"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <BackLink label="Teams" onClick={() => navigate(listPath)} />

        {team ? (
          <TeamDetailBody
            assignedKeyIds={new Set(teams.flatMap((t) => t.keyIds))}
            onMoveMembers={moveMembers}
            onOpenSecurity={() => navigate(securityPath)}
            onPatch={patch}
            onSetRole={setRole}
            team={team}
            teams={teams}
            variant={variant}
          />
        ) : (
          <div
            className="rounded-md border border-border bg-card p-8 text-center"
            role="alert"
          >
            <h2 className="type-label-14 m-0 text-balance text-foreground">
              Team not found
            </h2>
            <p className="type-copy-14 mt-1 text-muted-foreground">
              No team matches <span className="type-mono-14">{teamId}</span>.
            </p>
          </div>
        )}
      </div>
    </DashboardChrome>
  );
}

/* ─── Body ─────────────────────────────────────────────────────────────── */

type TabId = "usage" | "members" | "keys" | "budget" | "security";

function TeamDetailBody({
  team,
  teams,
  assignedKeyIds,
  onPatch,
  onMoveMembers,
  onSetRole,
  variant,
  onOpenSecurity,
}: {
  team: TeamRow;
  /** Every team — the Members picker names the team a candidate would leave. */
  teams: TeamRow[];
  /** Keys held by ANY team — the "Add keys" picker only offers what is left. */
  assignedKeyIds: Set<string>;
  onPatch: (next: Partial<TeamRow>) => void;
  onMoveMembers: (ids: string[]) => void;
  onSetRole: (memberId: string, role: TeamRole) => void;
  variant: TeamsVariant;
  onOpenSecurity: () => void;
}) {
  const [tab, setTab] = useState<TabId>("usage");
  const usage = useMemo(() => usageForTeam(team), [team]);

  return (
    <>
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        <PageTitle>{team.name}</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          {team.isDefault
            ? "The default team. Can’t be renamed or deleted."
            : "Members, keys, and budget for this team."}
        </p>
      </div>

      <Tabs
        className="gap-4"
        onValueChange={(v) => setTab(v as TabId)}
        value={tab}
      >
        <TabsList className="-mt-2 px-0" variant="line">
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="members">
            <span>Members</span>
            <TabsCount>{team.memberIds.length}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="keys">
            <span>Keys</span>
            <TabsCount>{team.keyIds.length}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="usage">
          <UsagePane usage={usage} />
        </TabsContent>
        <TabsContent value="members">
          <MembersPane
            onMoveMembers={onMoveMembers}
            onPatch={onPatch}
            onSetRole={onSetRole}
            team={team}
            teams={teams}
          />
        </TabsContent>
        <TabsContent value="keys">
          <KeysPane
            assignedKeyIds={assignedKeyIds}
            onPatch={onPatch}
            team={team}
          />
        </TabsContent>
        <TabsContent value="budget">
          <BudgetPane onPatch={onPatch} spend={usage.spend} team={team} />
        </TabsContent>
        <TabsContent value="security">
          <TeamSecurityPane
            onOpenSecurity={onOpenSecurity}
            team={team}
            variant={variant}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* ─── Usage tab ────────────────────────────────────────────────────────── */

function UsagePane({ usage }: { usage: TeamUsage }) {
  return (
    <div className="flex flex-col gap-6">
      <KpiRail columns={2}>
        <CompactKpi
          flat
          title="Total spend"
          value={formatCurrency(usage.spend)}
        />
        <CompactKpi
          flat
          title="Requests"
          value={formatCompactCount(usage.requests)}
        />
      </KpiRail>

      <UsageBreakdown
        emptyBody="Once this team’s keys start serving traffic, spend per member appears here."
        emptyTitle="No per-member data yet."
        firstColumn="Member"
        rows={usage.byUser}
        title="Spend by member"
      />
      <UsageBreakdown
        emptyBody="Once this team’s keys route through the gateway, spend per model appears here."
        emptyTitle="No per-model data yet."
        firstColumn="Model"
        rows={usage.byModel}
        title="Spend by model"
      />
    </div>
  );
}

function UsageBreakdown({
  title,
  firstColumn,
  rows,
  emptyTitle,
  emptyBody,
}: {
  title: string;
  firstColumn: string;
  rows: UsageSlice[];
  emptyTitle: string;
  emptyBody: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{title}</SectionTitle>
      <Card density="flush">
        {rows.length === 0 ? (
          <TableEmptyState body={emptyBody} title={emptyTitle} />
        ) : (
          <Table className="min-w-[560px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[52%] whitespace-nowrap">
                  {firstColumn}
                </TableHead>
                <TableHead className="w-[24%] whitespace-nowrap text-right">
                  Requests
                </TableHead>
                <TableHead className="w-[24%] whitespace-nowrap text-right">
                  Spend
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                    <span className="block truncate" title={row.label}>
                      {row.label}
                    </span>
                  </TableCell>
                  <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                    {formatNumber(row.requests)}
                  </TableCell>
                  <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                    {formatCurrency(row.spend)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

/* ─── Members tab ──────────────────────────────────────────────────────── */

function MembersPane({
  team,
  teams,
  onPatch,
  onMoveMembers,
  onSetRole,
}: {
  team: TeamRow;
  teams: TeamRow[];
  onPatch: (next: Partial<TeamRow>) => void;
  onMoveMembers: (ids: string[]) => void;
  onSetRole: (memberId: string, role: TeamRole) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);

  const rows = team.memberIds
    .map((id) => memberById(id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  // Candidates stay "every org member not already here" — the PRD does not
  // hide someone because they are placed, it moves them. What changes is that
  // a candidate on another team says so on the row, so the consequence is
  // visible while choosing rather than discovered after Add.
  const options = useMemo(
    () =>
      MEMBER_ROWS.filter((m) => !team.memberIds.includes(m.id)).map((m) => {
        const current = teamOfMember(teams, m.id);
        return {
          value: m.id,
          label: m.name,
          description: current ? `Currently on ${current.name}` : undefined,
        };
      }),
    [team.memberIds, teams]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={() => setAddOpen(true)} size="sm" variant="outline">
          <Plus aria-hidden data-icon="inline-start" />
          Add members
        </Button>
      </div>

      <Card density="flush">
        {rows.length === 0 ? (
          <TableEmptyState
            body="This team has no members yet."
            title="No members"
          />
        ) : (
          // Wider than the other two tables, and re-proportioned when the role
          // cell became a control: Team role has to clear the 128px trigger
          // plus the cell's 24px of padding, which 26% of 620px does and 22%
          // of 560px did not.
          <Table className="min-w-[620px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[42%] whitespace-nowrap">
                  Member
                </TableHead>
                <TableHead className="w-[26%] whitespace-nowrap">
                  Team role
                </TableHead>
                <TableHead className="w-[16%] whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead aria-label="Actions" className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex min-w-0 items-center gap-3">
                      <Monogram
                        initials={initialsOf(member.name)}
                        size="md"
                        tone={member.avatarTone}
                      />
                      <span
                        className="type-copy-14 truncate text-foreground"
                        title={member.name}
                      >
                        {member.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {/* Derived from `managerId`, never a stored per-row role:
                        one field means one manager, so promoting here demotes
                        whoever held it without a second write. Enabled because
                        the sandbox user is the owner (PRD 3 / 8.4 — owner and
                        admins assign it). */}
                    <Select
                      onValueChange={(v) => onSetRole(member.id, v as TeamRole)}
                      value={teamRole(team, member.id)}
                    >
                      <SelectTrigger
                        aria-label={`Team role for ${member.name}`}
                        className="w-32 border-border bg-card text-foreground"
                        size="sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">member</SelectItem>
                        <SelectItem value="manager">manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                    active
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <IconActionButton
                      aria-label={`Remove ${member.name} from ${team.name}`}
                      onClick={() =>
                        onPatch({
                          memberIds: team.memberIds.filter(
                            (id) => id !== member.id
                          ),
                          managerId:
                            team.managerId === member.id
                              ? null
                              : team.managerId,
                        })
                      }
                    >
                      <Trash2
                        aria-hidden
                        className="size-4"
                        strokeWidth={1.75}
                      />
                    </IconActionButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddMembersDialog
        onAdd={(ids) => {
          onMoveMembers(ids);
          setAddOpen(false);
        }}
        onOpenChange={setAddOpen}
        open={addOpen}
        options={options}
      />
    </div>
  );
}

/* ─── Keys tab ─────────────────────────────────────────────────────────── */

function KeysPane({
  team,
  assignedKeyIds,
  onPatch,
}: {
  team: TeamRow;
  assignedKeyIds: Set<string>;
  onPatch: (next: Partial<TeamRow>) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);

  const rows = team.keyIds
    .map((id) => keyById(id))
    .filter((k): k is NonNullable<typeof k> => k !== undefined);

  // ASSIGNABLE_KEYS already excludes the revoked test-key, so a revoked key
  // can never reach this picker.
  const options = useMemo(
    () =>
      ASSIGNABLE_KEYS.filter((k) => !assignedKeyIds.has(k.id)).map((k) => ({
        value: k.id,
        label: `${k.name} (${k.masked})`,
      })),
    [assignedKeyIds]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={() => setAddOpen(true)} size="sm" variant="outline">
          <Plus aria-hidden data-icon="inline-start" />
          Add keys
        </Button>
      </div>

      <Card density="flush">
        {rows.length === 0 ? (
          <TableEmptyState
            body="This team has no API keys assigned yet."
            title="No keys"
          />
        ) : (
          <Table className="min-w-[560px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[64%] whitespace-nowrap">Key</TableHead>
                <TableHead className="w-[24%] whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead aria-label="Actions" className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="type-mono-14 whitespace-nowrap">
                    <span className="text-foreground">{row.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      ({row.masked})
                    </span>
                  </TableCell>
                  <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                    active
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <IconActionButton
                      aria-label={`Remove ${row.name} from ${team.name}`}
                      onClick={() =>
                        onPatch({
                          keyIds: team.keyIds.filter((id) => id !== row.id),
                        })
                      }
                    >
                      <Trash2
                        aria-hidden
                        className="size-4"
                        strokeWidth={1.75}
                      />
                    </IconActionButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddKeysDialog
        onAdd={(ids) => {
          onPatch({ keyIds: [...team.keyIds, ...ids] });
          setAddOpen(false);
        }}
        onOpenChange={setAddOpen}
        open={addOpen}
        options={options}
      />
    </div>
  );
}

/* ─── Budget tab ───────────────────────────────────────────────────────── */

function BudgetPane({
  team,
  spend,
  onPatch,
}: {
  team: TeamRow;
  spend: number;
  onPatch: (next: Partial<TeamRow>) => void;
}) {
  const [open, setOpen] = useState(false);
  const save = (budget: TeamBudget) => {
    onPatch({ budget });
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {team.budget ? (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button onClick={() => setOpen(true)} size="sm" variant="outline">
              Edit budget
            </Button>
          </div>
          <Card>
            <CardContent>
              <BudgetSummary
                budget={team.budget}
                meterLabel={`${team.name} budget used`}
                spend={spend}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          action={
            <Button onClick={() => setOpen(true)} size="default">
              Set budget
            </Button>
          }
          body="Set a budget to cap this team’s spend over a rolling 5-hour, weekly, or calendar-month window. A soft budget alerts you; a hard budget blocks requests once it is used up."
          title="No budget set"
        />
      )}

      <BudgetDialog
        budget={team.budget}
        defaultName="Team budget"
        onOpenChange={setOpen}
        onSave={save}
        open={open}
        scope={`team-${team.id}`}
        title={team.budget ? "Edit team budget" : "Set team budget"}
      />
    </div>
  );
}

/* Security tab lives in `teams/SecurityPane.tsx` — it owns the variant split
   (Default keeps the empty state, Pro gets the five count cards). */
