import { Plus, Trash2 } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompactKpi, CompactSpark } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { KpiRail } from "@/components/ui/kpi-rail";
import { Monogram } from "@/components/ui/monogram";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SortableTableHead,
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
import { Timestamp } from "@/components/ui/timestamp";
import type { ApiKeyRow } from "@/data/api-keys";
import {
  MEMBER_ROWS,
  type MemberRole,
  type MemberRow,
} from "@/data/team-members";
import {
  ASSIGNABLE_KEYS,
  BUDGET_WINDOW_SCOPE_COPY,
  BUDGET_WINDOW_TITLE_COPY,
  DEFAULT_TEAM_ID,
  keyById,
  memberById,
  moveKeysToTeam,
  moveMembersToTeam,
  scaleUsage,
  TEAM_SEED_ROWS,
  type TeamBudget,
  type TeamRow,
  type TeamUsage,
  teamOfMember,
  type UsageSlice,
  usageForTeam,
} from "@/data/teams";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import {
  formatCompactCount,
  formatCurrency,
  formatNumber,
  formatSparkLabel,
} from "@/lib/formatters";
import {
  type CustomRange,
  effectiveScale,
  type PresetRange,
  RANGE_OPTIONS,
  type Range,
} from "@/lib/range";
import {
  fmtInt,
  fmtTokens,
  fmtUsd,
  getBucketCount,
  getRangeDates,
} from "@/pages/activity/chart-helpers";
import { distributeSeries, MODEL_ROWS } from "@/pages/activity-data";
import { BudgetSummary } from "@/pages/teams/budget";
import {
  AddKeysDialog,
  AddMembersDialog,
  BudgetDialog,
  DeleteTeamDialog,
  RemoveTeamKeyDialog,
  RenameTeamDialog,
} from "@/pages/teams/dialogs";
import {
  TeamSecurityPane,
  type TeamsVariant,
} from "@/pages/teams/SecurityPane";

/* ─────────────────────────────────────────────────────────────────────────
 * Team detail, Enterprise twin (route: /teams-enterprise/:teamId)
 *
 * Cloned from TeamDetail.tsx as a separate file so the Enterprise Teams UI
 * can diverge from Pro for side-by-side comparison.
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

export function TeamDetailEnterprise({
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
  const listPath =
    variant === "default" ? "/teams-default" : "/teams-enterprise";
  const securityPath =
    variant === "default" ? "/security-default" : "/security-enterprise";

  const [teams, setTeams] = useState<TeamRow[]>(TEAM_SEED_ROWS);
  const team = teams.find((t) => t.id === teamId);

  const patch = (next: Partial<TeamRow>) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, ...next } : t))
    );
  };

  // Adding a member is a MOVE (PRD 3 / 8.1), so it writes across the whole
  // array, not just this team — which is why the page holds every team rather
  // than the one it is showing. Same state that lets "Add keys" name the team
  // a candidate key is currently on.
  const moveMembers = (ids: string[]) => {
    if (!teamId) {
      return;
    }
    setTeams((prev) => moveMembersToTeam(prev, teamId, ids));
  };

  // Assigning a key is the same one-operation move: `gateway_api_keys.team_id`
  // holds one team, so adding it here takes it off whichever team had it.
  const moveKeys = (ids: string[]) => {
    if (!teamId) {
      return;
    }
    setTeams((prev) => moveKeysToTeam(prev, teamId, ids));
  };

  // Removing a key REASSIGNS it to Default rather than detaching it — the
  // real build never leaves a key without a team, so its spend keeps rolling
  // up somewhere.
  const removeKey = (keyId: string) => {
    setTeams((prev) => moveKeysToTeam(prev, DEFAULT_TEAM_ID, [keyId]));
  };

  // Same fold-in contract as the list page's delete: members and keys land on
  // Default, then the page has nothing left to show, so it returns to the list.
  const deleteTeam = () => {
    setTeams((prev) => {
      const doomed = prev.find((t) => t.id === teamId);
      if (!doomed || doomed.isDefault) {
        return prev;
      }
      return prev
        .filter((t) => t.id !== teamId)
        .map((t) =>
          t.id === DEFAULT_TEAM_ID
            ? {
                ...t,
                memberIds: [...new Set([...t.memberIds, ...doomed.memberIds])],
                keyIds: [...new Set([...t.keyIds, ...doomed.keyIds])],
              }
            : t
        );
    });
    navigate(listPath);
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
            onDeleteTeam={deleteTeam}
            onMoveKeys={moveKeys}
            onMoveMembers={moveMembers}
            onOpenSecurity={() => navigate(securityPath)}
            onPatch={patch}
            onRemoveKey={removeKey}
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
  onPatch,
  onMoveMembers,
  onMoveKeys,
  onRemoveKey,
  onDeleteTeam,
  variant,
  onOpenSecurity,
}: {
  team: TeamRow;
  /** Every team — the pickers name the team a candidate would leave. */
  teams: TeamRow[];
  onPatch: (next: Partial<TeamRow>) => void;
  onMoveMembers: (ids: string[]) => void;
  onMoveKeys: (ids: string[]) => void;
  onRemoveKey: (keyId: string) => void;
  onDeleteTeam: () => void;
  variant: TeamsVariant;
  onOpenSecurity: () => void;
}) {
  const [tab, setTab] = useState<TabId>("usage");
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const usage = useMemo(() => usageForTeam(team), [team]);

  return (
    <>
      {/* Title left, the two team-level actions right — the same header shape
          the list page uses, so Rename / Delete sit where the eye already
          expects page actions. Default gets neither: it is the fold-in target
          for every other team. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
          <PageTitle>{team.name}</PageTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
            {team.isDefault
              ? "The default team. Can’t be renamed or deleted."
              : "Members, keys, and budget for this team."}
          </p>
        </div>
        {/* Rename / Delete are parked until a Settings tab exists; their
            dialogs below stay wired so that tab can reuse them. */}
      </div>

      <Tabs
        className="gap-6"
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
          <UsagePane teamId={team.id} usage={usage} />
        </TabsContent>
        <TabsContent value="members">
          <MembersPane
            onMoveMembers={onMoveMembers}
            onPatch={onPatch}
            team={team}
            teams={teams}
          />
        </TabsContent>
        <TabsContent value="keys">
          <KeysPane
            onMoveKeys={onMoveKeys}
            onRemoveKey={onRemoveKey}
            team={team}
            teams={teams}
          />
        </TabsContent>
        <TabsContent value="budget">
          <BudgetPane onPatch={onPatch} team={team} usage={usage} />
        </TabsContent>
        <TabsContent value="security">
          <TeamSecurityPane
            onOpenSecurity={onOpenSecurity}
            team={team}
            variant={variant}
          />
        </TabsContent>
      </Tabs>

      <RenameTeamDialog
        currentName={team.name}
        onOpenChange={setRenameOpen}
        onRename={(name) => {
          onPatch({ name });
          setRenameOpen(false);
        }}
        open={renameOpen}
      />
      <DeleteTeamDialog
        onDelete={onDeleteTeam}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        teamName={team.name}
      />
    </>
  );
}

/* ─── Usage tab ────────────────────────────────────────────────────────── */

/** Activity catalog model key → vendor, for the by-model rows' brand icons —
 *  the same VendorAvatar treatment the Models page locks in. */
const MODEL_VENDOR = new Map(MODEL_ROWS.map((m) => [m.key, m.vendor]));

/** Single first initial + the member's own tone — the same treatment
 *  Activity's Top users card uses for its rows. */
function userAvatar(row: UsageSlice): ReactNode {
  return (
    <Monogram
      initials={(
        row.label.trim().split(WHITESPACE_RE)[0]?.[0] ?? "?"
      ).toUpperCase()}
      size="sm"
      tone={memberById(row.id)?.avatarTone ?? "ink"}
    />
  );
}

function modelAvatar(row: UsageSlice): ReactNode {
  const vendor = MODEL_VENDOR.get(row.id);
  return vendor ? <VendorAvatar decorative vendor={vendor} /> : null;
}

function UsagePane({ teamId, usage }: { teamId: string; usage: TeamUsage }) {
  // Range chrome matches Activity's Overview row: preset pill + custom
  // picker, landing on All. Every number on the tab is the team's REAL 7d
  // workload projected onto the selected window via effectiveScale — the
  // same derivation Activity's KPI rail and Top cards use, so the KPIs and
  // the breakdown tables below always describe the same selection.
  const [range, setRange] = useState<Range>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const scale = effectiveScale(range, customRange);

  // One projection feeds everything on the tab: KPIs, sparklines, and both
  // tables read the SAME settled scaling (scaleUsage), so the numbers cannot
  // drift apart on any range.
  const scaled = useMemo(() => scaleUsage(usage, scale), [usage, scale]);

  // Sparklines distribute each scaled total across the range's buckets —
  // same generator as the org rail, seeded per team, metric, and range so
  // shapes differ while sum(bars) stays the number on the card. No delta
  // chips: there is no prior-period team roll-up to compare against.
  const teamSeed = [...teamId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rangeSeed =
    range === "all"
      ? 11
      : range === "24h"
        ? 47
        : range === "7d"
          ? 77
          : range === "30d"
            ? 303
            : 99;
  const seed = teamSeed * rangeSeed;
  const count = getBucketCount(range, customRange);
  const spendSpark = distributeSeries(scaled.spend, count, seed * 31 + 1);
  const requestsSpark = distributeSeries(scaled.requests, count, seed * 31 + 2);
  const tokensSpark = distributeSeries(scaled.tokens, count, seed * 31 + 3);
  const sparkLabels = getRangeDates(range, customRange).map((d) =>
    formatSparkLabel(d, range === "24h")
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header row + rail share a gap-4 group, same as Activity's Overview
          block, so the title sits 16px above the cards. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Overview</SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedPill
              aria-label="Time range"
              onValueChange={(v) => {
                setRange(v as PresetRange);
                setCustomRange(null);
              }}
              options={RANGE_OPTIONS}
              size="sm"
              value={range === "custom" ? "" : range}
            />
            <DateRangePicker
              onChange={(r) => {
                if (r) {
                  setCustomRange(r);
                  setRange("custom");
                } else {
                  setCustomRange(null);
                  setRange("all");
                }
              }}
              size="sm"
              value={customRange}
            />
          </div>
        </div>
        <KpiRail columns={3}>
          <CompactKpi
            flat
            spark={
              <CompactSpark
                colorVar="var(--color-chart-1)"
                data={spendSpark}
                labels={sparkLabels}
                tooltip
                valueFormatter={(v) => fmtUsd(v)}
              />
            }
            title="Total Spend"
            value={formatCurrency(scaled.spend)}
          />
          <CompactKpi
            flat
            spark={
              <CompactSpark
                colorVar="var(--color-neutral-500)"
                data={requestsSpark}
                labels={sparkLabels}
                tooltip
                valueFormatter={(v) => fmtInt(Math.round(v))}
              />
            }
            title="Total Messages"
            value={formatCompactCount(scaled.requests)}
          />
          <CompactKpi
            flat
            spark={
              <CompactSpark
                colorVar="var(--color-chart-3)"
                data={tokensSpark}
                labels={sparkLabels}
                tooltip
                valueFormatter={(v) => fmtTokens(Math.round(v))}
              />
            }
            title="Tokens Used"
            value={formatCompactCount(scaled.tokens)}
          />
        </KpiRail>
      </div>

      <UsageBreakdown
        avatarFor={userAvatar}
        emptyBody="Once this team’s keys start serving traffic, spend per user appears here."
        emptyTitle="No per-user data yet."
        firstColumn="User"
        rows={scaled.byUser}
        title="Spend by user"
      />
      <UsageBreakdown
        avatarFor={modelAvatar}
        emptyBody="Once this team’s keys route through the gateway, spend per model appears here."
        emptyTitle="No per-model data yet."
        firstColumn="Model"
        rows={scaled.byModel}
        title="Spend by model"
      />
    </div>
  );
}

/** Comparable value per sortable column. `label` sorts on the string shown,
 *  which is a person's name in the by-user table and a model name in the
 *  by-model one, so one accessor serves both instances. */
function usageSortValue(row: UsageSlice, key: string): string | number | null {
  switch (key) {
    case "label":
      return row.label;
    case "requests":
      return row.requests;
    case "spend":
      return row.spend;
    default:
      return null;
  }
}

function UsageBreakdown({
  title,
  firstColumn,
  rows,
  emptyTitle,
  emptyBody,
  avatarFor,
}: {
  title: string;
  firstColumn: string;
  rows: UsageSlice[];
  emptyTitle: string;
  emptyBody: string;
  /** Row icon — a member Monogram in the by-user table, the vendor mark in
   *  the by-model one. */
  avatarFor: (row: UsageSlice) => ReactNode;
}) {
  // One hook per instance: the by-user table and the by-model table sort
  // independently, and both start in the incoming (spend-ranked) order.
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = useMemo(
    () => sortRows(rows, sort, usageSortValue),
    [rows, sort]
  );

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
                <SortableTableHead
                  className="w-[52%] whitespace-nowrap"
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="label"
                >
                  {firstColumn}
                </SortableTableHead>
                <SortableTableHead
                  className="w-[24%] whitespace-nowrap"
                  numeric
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="requests"
                >
                  Requests
                </SortableTableHead>
                <SortableTableHead
                  className="w-[24%] whitespace-nowrap"
                  numeric
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="spend"
                >
                  Spend
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                    <div className="flex min-w-0 items-center gap-2">
                      {avatarFor(row)}
                      <span
                        className="min-w-0 flex-1 truncate"
                        title={row.label}
                      >
                        {row.label}
                      </span>
                    </div>
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
}: {
  team: TeamRow;
  teams: TeamRow[];
  onPatch: (next: Partial<TeamRow>) => void;
  onMoveMembers: (ids: string[]) => void;
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
      <Card density="flush">
        {rows.length === 0 ? (
          <TableEmptyState
            body="This team has no members yet."
            title="No members"
          />
        ) : (
          // Wider than the other two tables, and re-proportioned when the role
          // cell became a control: the cell has to clear the 112px trigger
          // plus its 24px of padding, which 26% of 620px does and 22% of
          // 560px did not.
          <Table className="min-w-[620px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[42%] whitespace-nowrap">
                  Member
                </TableHead>
                <TableHead className="w-[26%] whitespace-nowrap">
                  Role
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
                  {/* py-0 on the two control-bearing cells (Monogram row,
                      role Select): the 28-32px controls would otherwise add
                      their height on top of py-3 and run this table's rows
                      8px taller than the Keys tab's. The actions cell's icon
                      button now governs both tables at the same height. */}
                  <TableCell className="whitespace-nowrap py-0">
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
                  <TableCell className="type-copy-14 whitespace-nowrap py-0 text-foreground">
                    {/* Org role, mirrored from the Team page's row control:
                        Owner renders static; the owner using the site can make
                        everyone else Admin or Member. */}
                    {member.role === "owner" ? (
                      "Owner"
                    ) : (
                      <MemberRoleSelect member={member} />
                    )}
                  </TableCell>
                  <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                    Active
                  </TableCell>
                  <TableCell className="whitespace-nowrap pr-4 pl-0 text-right">
                    <IconActionButton
                      aria-label={`Remove ${member.name} from ${team.name}`}
                      onClick={() =>
                        onPatch({
                          memberIds: team.memberIds.filter(
                            (id) => id !== member.id
                          ),
                          // Leaving the team drops the role with it — it was a
                          // fact about this membership, and the membership is
                          // gone. Any co-manager keeps theirs.
                          managerIds: team.managerIds.filter(
                            (id) => id !== member.id
                          ),
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

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={() => setAddOpen(true)} variant="outline">
          <Plus aria-hidden data-icon="inline-start" />
          Add members
        </Button>
      </div>

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

/** Org role control, mirrored from the Team page's row control: Admin or
 *  Member, capitalized. Local state only, same as the Team page — the mock
 *  has no org-mutation layer for roles. */
function MemberRoleSelect({ member }: { member: MemberRow }) {
  const [role, setRole] = useState<MemberRole>(member.role);
  return (
    <Select onValueChange={(v) => setRole(v as MemberRole)} value={role}>
      <SelectTrigger
        aria-label={`Role for ${member.name}`}
        className="w-28 border-border bg-card text-foreground"
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="member">Member</SelectItem>
      </SelectContent>
    </Select>
  );
}

/* ─── Keys tab ─────────────────────────────────────────────────────────── */

function KeysPane({
  team,
  teams,
  onMoveKeys,
  onRemoveKey,
}: {
  team: TeamRow;
  /** Every team — the picker names the team a candidate key sits on today. */
  teams: TeamRow[];
  onMoveKeys: (ids: string[]) => void;
  onRemoveKey: (keyId: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<ApiKeyRow | null>(null);

  const rows = team.keyIds
    .map((id) => keyById(id))
    .filter((k): k is NonNullable<typeof k> => k !== undefined);

  // Every assignable key that is not already HERE, the way the Members picker
  // offers every member not already here: a key on another team is not hidden,
  // it is moved, and the row says which team it is leaving before the user
  // commits. ASSIGNABLE_KEYS already excludes the revoked test-key, so a
  // revoked key can never reach this picker.
  const options = useMemo(
    () =>
      ASSIGNABLE_KEYS.filter((k) => !team.keyIds.includes(k.id)).map((k) => {
        const current = teams.find((t) => t.keyIds.includes(k.id));
        return {
          value: k.id,
          label: `${k.name} (${k.masked})`,
          description: current ? `Currently on ${current.name}` : undefined,
        };
      }),
    [team.keyIds, teams]
  );

  return (
    <div className="flex flex-col gap-4">
      <Card density="flush">
        {rows.length === 0 ? (
          <TableEmptyState
            body="This team has no API keys assigned yet."
            title="No keys"
          />
        ) : (
          // Four columns now carry content (name, prefix, status, last used),
          // so the min-width steps up from 560 to 640 — at 560 the prefix and
          // the date clipped against each other.
          <Table className="min-w-[640px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[28%] whitespace-nowrap">Key</TableHead>
                <TableHead className="w-[27%] whitespace-nowrap">
                  Prefix
                </TableHead>
                <TableHead className="w-[14%] whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead className="w-[31%] whitespace-nowrap">
                  Last used
                </TableHead>
                <TableHead aria-label="Actions" className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                    <span className="block truncate" title={row.name}>
                      {row.name}
                    </span>
                  </TableCell>
                  <TableCell className="type-mono-14 whitespace-nowrap text-muted-foreground">
                    {row.masked}
                  </TableCell>
                  <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                    Active
                  </TableCell>
                  <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                    <Timestamp
                      className={
                        row.lastUsed === null
                          ? "text-muted-foreground"
                          : undefined
                      }
                      date={row.lastUsed}
                      format="dateNumeric"
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap pr-4 pl-0 text-right">
                    {/* The Default team is where removed keys LAND, so there is
                        nowhere to remove them to from here. */}
                    {team.isDefault ? null : (
                      <IconActionButton
                        aria-label={`Remove ${row.name} from ${team.name}`}
                        onClick={() => setRemoving(row)}
                      >
                        <Trash2
                          aria-hidden
                          className="size-4"
                          strokeWidth={1.75}
                        />
                      </IconActionButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={() => setAddOpen(true)} variant="outline">
          <Plus aria-hidden data-icon="inline-start" />
          Add keys
        </Button>
      </div>

      <AddKeysDialog
        onAdd={(ids) => {
          onMoveKeys(ids);
          setAddOpen(false);
        }}
        onOpenChange={setAddOpen}
        open={addOpen}
        options={options}
      />
      <RemoveTeamKeyDialog
        keyLabel={
          removing === null ? "" : `${removing.name} (${removing.masked})`
        }
        onConfirm={() => {
          if (removing) {
            onRemoveKey(removing.id);
          }
          setRemoving(null);
        }}
        onOpenChange={(next) => {
          if (!next) {
            setRemoving(null);
          }
        }}
        open={removing !== null}
      />
    </div>
  );
}

/* ─── Budget tab ───────────────────────────────────────────────────────── */

function BudgetPane({
  team,
  usage,
  onPatch,
}: {
  team: TeamRow;
  /** Same roll-up the Usage tab renders — the meter's spend plus the two
   *  breakdowns, restated here scoped to the budget window, so "who is
   *  spending this" is answered where the cap lives. */
  usage: TeamUsage;
  onPatch: (next: Partial<TeamRow>) => void;
}) {
  const [open, setOpen] = useState(false);
  const save = (budget: TeamBudget) => {
    onPatch({ budget });
    setOpen(false);
  };
  const scope = team.budget
    ? BUDGET_WINDOW_SCOPE_COPY[team.budget.window]
    : null;
  // Window-aware table titles: "Monthly spend per user" on a monthly
  // budget, "7-day spend per user" on a weekly one.
  const titleStem = team.budget
    ? BUDGET_WINDOW_TITLE_COPY[team.budget.window]
    : "Spend";

  return (
    <div className="flex flex-col gap-4">
      {team.budget ? (
        <>
          {/* One card, same shape as the list page's Org budget card: title +
              nested action in the header, meter + the four facts below. */}
          <Card>
            <CardHeader>
              <CardTitle>Team budget</CardTitle>
              <CardAction>
                <Button
                  onClick={() => setOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  Edit budget
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <BudgetSummary
                budget={team.budget}
                meterLabel={`${team.name} budget used`}
                spend={usage.spend}
              />
            </CardContent>
          </Card>
          {/* The window is the budget's, not the page's — the table titles
              carry it ("Monthly spend per user"), so the reader doesn't
              reconcile these numbers against the Usage tab's range. A Callout
              said this explicitly until 2026-08-31; the titles made it
              redundant. mt-2 tops up the column's gap-4 to 24px: the card
              closes the budget block, so the tables need the full section
              break above them. */}
          <div className="mt-2 flex flex-col gap-6">
            <UsageBreakdown
              avatarFor={userAvatar}
              emptyBody={`No spend by any user over ${scope}.`}
              emptyTitle="No per-user data yet."
              firstColumn="User"
              rows={usage.byUser}
              title={`${titleStem} per user`}
            />
            <UsageBreakdown
              avatarFor={modelAvatar}
              emptyBody={`No spend on any model over ${scope}.`}
              emptyTitle="No per-model data yet."
              firstColumn="Model"
              rows={usage.byModel}
              title={`${titleStem} per model`}
            />
          </div>
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
