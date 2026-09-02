import { KeyRound, Plus, Trash2, Wallet } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import { SearchInput } from "@/components/ui/search-input";
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
import { MEMBER_ROWS, type MemberRow } from "@/data/team-members";
import {
  ASSIGNABLE_KEYS,
  BUDGET_WINDOW_LABEL,
  BUDGET_WINDOW_RESET_COPY,
  budgetReadings,
  DEFAULT_TEAM_ID,
  keyById,
  memberById,
  memberJoinedAt,
  moveKeysToTeam,
  moveMembersToTeam,
  scaleUsage,
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
import { teamsListPath } from "@/lib/plan";
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
import { MODEL_ROWS } from "@/pages/activity-data";
import {
  BudgetBreachBanner,
  BudgetStatusBadge,
  BudgetSummary,
} from "@/pages/teams/budget";
import { budgetStatus } from "@/pages/teams/budget-band";
import {
  AddKeysDialog,
  AddMembersDialog,
  BudgetDialog,
  DeleteTeamDialog,
  RemoveTeamKeyDialog,
  RemoveTeamMemberDialog,
  RenameTeamDialog,
} from "@/pages/teams/dialogs";
import { TeamSecurityOverviewPane } from "@/pages/teams/SecurityOverviewPane";
import type { TeamsVariant } from "@/pages/teams/SecurityPane";
import { teamSparkSeries } from "@/pages/teams/spark-series";
import { teamsStore, useTeams } from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * Team detail, Enterprise twin (route: /teams-enterprise/:teamId)
 *
 * Cloned from TeamDetail.tsx as a separate file so the Enterprise Teams UI
 * can diverge from Pro for side-by-side comparison.
 *
 * A PAGE, not a modal — the team is URL-addressable and shareable, same as
 * the Messages findings and Conversations trace surfaces.
 *
 * Teams state lives in the shared module store (`teams/teams-store.ts`),
 * same array the LIST page renders, so created teams resolve here and the
 * "which keys are still unassigned" question spans every team. Mutations
 * survive navigation within the session; the seed returns on full reload.
 * ───────────────────────────────────────────────────────────────────────── */

const WHITESPACE_RE = /\s+/;

/** First initial only: the 16px table Monogram fits one glyph. */
function firstInitial(name: string): string {
  return (name.trim().split(WHITESPACE_RE)[0]?.[0] ?? "?").toUpperCase();
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
  const listPath = teamsListPath(useLocation().pathname);

  // Teams live in the module store shared with the LIST page, so a team
  // created there exists here (page-local useState re-seeded on mount and
  // answered "Team not found" for every new team, 2026-09-01), and moves
  // made here show on the list without a reload.
  const teams = useTeams();
  const setTeams = (next: TeamRow[] | ((prev: TeamRow[]) => TeamRow[])) =>
    teamsStore.setTeams(next);
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

  // Members follow the same rule (PRD 3 / 8.1: every user is on exactly one
  // team). Removing one moves them to Default; `moveMembersToTeam` drops
  // their manager role and joined stamp on the way out.
  const removeMember = (memberId: string) => {
    setTeams((prev) => moveMembersToTeam(prev, DEFAULT_TEAM_ID, [memberId]));
  };

  // Same fold-in contract as the list page's delete: members and keys land on
  // Default, then the page has nothing left to show, so it returns to the list.
  const deleteTeam = () => {
    const doomed = teams.find((t) => t.id === teamId);
    if (!doomed || doomed.isDefault) {
      return;
    }
    // Snapshot OUTSIDE the updater (Strict Mode runs updaters twice), so the
    // list's "Deleted teams" card records the delete no matter which page
    // performed it.
    teamsStore.appendDeleted({
      id: doomed.id,
      name: doomed.name,
      spend: usageForTeam(doomed).spend,
    });
    setTeams((prev) =>
      prev
        .filter((t) => t.id !== teamId)
        .map((t) =>
          t.id === DEFAULT_TEAM_ID
            ? {
                ...t,
                memberIds: [...new Set([...t.memberIds, ...doomed.memberIds])],
                memberJoined: {
                  ...t.memberJoined,
                  ...Object.fromEntries(
                    doomed.memberIds.map((id) => [id, new Date()])
                  ),
                },
                keyIds: [...new Set([...t.keyIds, ...doomed.keyIds])],
              }
            : t
        )
    );
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
            onPatch={patch}
            onRemoveKey={removeKey}
            onRemoveMember={removeMember}
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

type TabId = "members" | "keys" | "budget" | "usage" | "security";

function TeamDetailBody({
  team,
  teams,
  onPatch,
  onMoveMembers,
  onMoveKeys,
  onRemoveKey,
  onRemoveMember,
  onDeleteTeam,
  variant,
}: {
  team: TeamRow;
  /** Every team — the pickers name the team a candidate would leave. */
  teams: TeamRow[];
  onPatch: (next: Partial<TeamRow>) => void;
  onMoveMembers: (ids: string[]) => void;
  onMoveKeys: (ids: string[]) => void;
  onRemoveKey: (keyId: string) => void;
  onRemoveMember: (memberId: string) => void;
  onDeleteTeam: () => void;
  variant: TeamsVariant;
}) {
  // Management tabs lead (user 2026-09-01): a fresh team is populated before
  // it is read, and a manager lands on their roster the way the Teams list
  // lands on teams. Data tabs (Usage, Budget, Security) follow.
  const [tab, setTab] = useState<TabId>("members");
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

      {/* Blocked / exceeded caps sit ABOVE the tabs, full width of the content
          column: an admin who opened this team to read the roster still needs
          to know the gateway is refusing its traffic. Renders nothing while
          every window is inside its cap. */}
      {team.budget ? (
        <BudgetBreachBanner
          budget={team.budget}
          teamName={team.name}
          usage={usage}
        />
      ) : null}

      <Tabs
        className="gap-6"
        onValueChange={(v) => setTab(v as TabId)}
        value={tab}
      >
        <TabsList className="-mt-2 px-0" variant="line">
          <TabsTrigger value="members">
            <span>Members</span>
            <TabsCount>{team.memberIds.length}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="keys">
            <span>Keys</span>
            <TabsCount>{team.keyIds.length}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersPane
            onMoveMembers={onMoveMembers}
            onPatch={onPatch}
            onRemoveMember={onRemoveMember}
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
        <TabsContent value="usage">
          <UsagePane teamId={team.id} usage={usage} />
        </TabsContent>
        <TabsContent value="security">
          <TeamSecurityOverviewPane
            team={team}
            teams={teams}
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

  // Sparklines render windows of ONE daily backbone per team + metric
  // (teams/spark-series.ts), so the All chart's tail and the 7D chart
  // describe the same days — each window is re-settled onto its own KPI, so
  // sum(bars) stays the number on the card. No delta chips: there is no
  // prior-period team roll-up to compare against.
  const teamSeed = [...teamId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = getBucketCount(range, customRange);
  const spendSpark = teamSparkSeries(
    usage.spend,
    scaled.spend,
    range,
    customRange,
    count,
    teamSeed * 31 + 1
  );
  const requestsSpark = teamSparkSeries(
    usage.requests,
    scaled.requests,
    range,
    customRange,
    count,
    teamSeed * 31 + 2
  );
  const tokensSpark = teamSparkSeries(
    usage.tokens,
    scaled.tokens,
    range,
    customRange,
    count,
    teamSeed * 31 + 3
  );
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
        title="Spend by member"
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
  onRemoveMember,
}: {
  team: TeamRow;
  teams: TeamRow[];
  onPatch: (next: Partial<TeamRow>) => void;
  onMoveMembers: (ids: string[]) => void;
  onRemoveMember: (memberId: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(
    null
  );
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | RoleOption>("all");

  const rows = team.memberIds
    .map((id) => memberById(id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  // Role reads `team.managerIds`, the same source the Role column and the row
  // select read, so promoting someone to Manager immediately makes them
  // findable under the Managers filter. Search matches name or email.
  const visible = rows.filter((m) => {
    if (
      roleFilter !== "all" &&
      team.managerIds.includes(m.id) !== (roleFilter === "manager")
    ) {
      return false;
    }
    if (!query) {
      return true;
    }
    const q = query.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  });

  const isEmpty = rows.length === 0;
  const noMatches = !isEmpty && visible.length === 0;

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
      {/* Toolbar: search + role filter. Sits on the page background above
          the table Card, the same wrapper the Members page uses, so the two
          member surfaces read as one pattern. Always rendered: a query that
          returns zero rows never hides the controls that clear it. Widths are
          CONTAINER-relative (`@2xl:`, 672px inline-size), not viewport-
          relative: the Ask AI panel narrows this column without moving the
          window. Below @2xl the search takes row 1 full-width, the role
          Select row 2, and Add members row 3. */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          ariaLabel="Search members"
          className="@2xl:w-auto w-full min-w-0 @2xl:flex-1"
          onChange={setQuery}
          placeholder="Search by name or email…"
          value={query}
        />
        <Select
          onValueChange={(v: string) => setRoleFilter(v as "all" | RoleOption)}
          value={roleFilter}
        >
          <SelectTrigger
            aria-label="Filter by role"
            className="min-w-0 @2xl:flex-none flex-1 border-border bg-card text-foreground"
          >
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {/* Team role, not org role: no Owner or Admin here. */}
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="manager">Managers</SelectItem>
            <SelectItem value="member">Members</SelectItem>
          </SelectContent>
        </Select>

        {/* Add members closes the row on the right. `variant="default"` is
            the primary button, matching the Members page's "Invite member",
            since adding people is this tab's one forward action.
            `size="default"` is the h-9 Button, the same 36px as the h-9
            default SelectTrigger beside it, so the two boxes share a
            baseline. The wrapper is `contents` at @2xl, which makes the
            Button a direct flex child there and lets its own `ml-auto` push
            it to the right edge. Below @2xl the wrapper is a full-width
            right-aligned row of its own, so a wrap drops the button under
            the Select instead of squeezing it. */}
        <div className="flex @2xl:contents w-full justify-end">
          <Button
            className="ml-auto"
            onClick={() => setAddOpen(true)}
            size="default"
            variant="default"
          >
            <Plus aria-hidden data-icon="inline-start" />
            Add member
          </Button>
        </div>
      </div>

      <Card density="flush">
        {isEmpty && (
          <TableEmptyState
            action={
              <Button onClick={() => setAddOpen(true)} size="default">
                Add member
              </Button>
            }
            body="This team has no members yet."
            title="No members"
          />
        )}
        {noMatches && (
          <TableEmptyState
            body="No members match your search or filter. Try a different name or email."
            title="No members match"
          />
        )}
        {visible.length > 0 && (
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
                  Joined
                </TableHead>
                <TableHead aria-label="Actions" className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((member) => (
                <TableRow key={member.id}>
                  {/* py-0 on the two control-bearing cells (Monogram row,
                      role Select): the 28-32px controls would otherwise add
                      their height on top of py-3 and run this table's rows
                      8px taller than the Keys tab's. The actions cell's icon
                      button now governs both tables at the same height. */}
                  <TableCell className="whitespace-nowrap py-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <Monogram
                        initials={firstInitial(member.name)}
                        size="sm"
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
                    {/* Owner renders static; everyone else gets the role
                        select. Manager returned to the options 2026-09-01
                        (reversing the 8-31 org-roles-only ruling): the value
                        both reads and writes the team's managerIds, the same
                        source the list's Manager column and this tab's role
                        filter read, so the three can never disagree. */}
                    {member.role === "owner" ? (
                      "Owner"
                    ) : (
                      <MemberRoleSelect
                        isManager={team.managerIds.includes(member.id)}
                        member={member}
                        onChange={(role) => {
                          const without = team.managerIds.filter(
                            (id) => id !== member.id
                          );
                          onPatch({
                            managerIds:
                              role === "manager"
                                ? [...without, member.id]
                                : without,
                          });
                        }}
                      />
                    )}
                  </TableCell>
                  {/* When they joined THIS team (not the org): the Members
                      page's Joined cell recipe, same Timestamp format. */}
                  <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                    <Timestamp
                      date={memberJoinedAt(team, member.id)}
                      format="dateNumeric"
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap pr-4 pl-0 text-right">
                    {/* The Default team is where removed members LAND, so there
                        is nowhere to remove them to from here. */}
                    {team.isDefault ? null : (
                      <IconActionButton
                        aria-label={`Remove ${member.name} from ${team.name}`}
                        onClick={() =>
                          setRemoving({ id: member.id, name: member.name })
                        }
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

      <AddMembersDialog
        onAdd={(ids) => {
          onMoveMembers(ids);
          setAddOpen(false);
        }}
        onOpenChange={setAddOpen}
        open={addOpen}
        options={options}
      />
      <RemoveTeamMemberDialog
        keyCount={
          removing === null
            ? 0
            : team.keyIds.filter((id) => keyById(id)?.ownerId === removing.id)
                .length
        }
        memberName={removing?.name ?? ""}
        onConfirm={() => {
          if (removing) {
            onRemoveMember(removing.id);
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

/** Org role control, mirrored from the Team page's row control. Unlike that
 *  one it holds no state: the value is derived from the team's `managerIds`
 *  and a change writes straight back through `onPatch`, so the Role column,
 *  this control and the toolbar's role filter all read one source. */
/** The row control is the TEAM role only (AG-514's member|manager enum).
 *  Org roles (Owner/Admin/Member) live on the Members page — blending the
 *  two axes in one select hid Kira's org-Admin behind her Manager reading
 *  (removed 2026-09-01). Owner never appears: that row renders static text. */
type RoleOption = "manager" | "member";

function MemberRoleSelect({
  member,
  isManager,
  onChange,
}: {
  member: MemberRow;
  /** Read from the team's `managerIds`, the list column's source. */
  isManager: boolean;
  onChange: (role: RoleOption) => void;
}) {
  return (
    <Select
      onValueChange={(v) => onChange(v as RoleOption)}
      value={isManager ? "manager" : "member"}
    >
      <SelectTrigger
        aria-label={`Role for ${member.name}`}
        className="w-28 border-border bg-card text-foreground"
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="manager">Manager</SelectItem>
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
  const [query, setQuery] = useState("");

  const rows = team.keyIds
    .map((id) => keyById(id))
    .filter((k): k is NonNullable<typeof k> => k !== undefined);

  // Search only. Status is the one other axis on this table and the seed
  // carries no revoked team keys, so a role-style Select would have nothing
  // to filter. Matches the key name or the owning member's name, the two
  // things a reader scans this table for.
  const visible = rows.filter((k) => {
    if (!query) {
      return true;
    }
    const q = query.toLowerCase();
    const owner = memberById(k.ownerId);
    return (
      k.name.toLowerCase().includes(q) ||
      (owner?.name.toLowerCase().includes(q) ?? false)
    );
  });

  const isEmpty = rows.length === 0;
  const noMatches = !isEmpty && visible.length === 0;

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
      {/* Same toolbar the Members tab uses, minus the Select: search on the
          left, the tab's one forward action on the right. Always rendered, so
          a query that returns zero rows never hides the control that clears
          it. Widths are CONTAINER-relative (`@2xl:`, 672px inline-size), not
          viewport-relative, so the Ask AI panel narrows this column without
          moving the window. Below @2xl the search takes row 1 full-width and
          Add keys row 2. */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          ariaLabel="Search keys"
          className="@2xl:w-auto w-full min-w-0 @2xl:flex-1"
          onChange={setQuery}
          placeholder="Search by key or member…"
          value={query}
        />
        {/* Sequential build gate (user direction 2026-09-01) still applies:
            the team is built Members-first, so the CTA stays withheld until
            the roster has someone. It is the same gate the empty card's
            action carries, just read here too. */}
        {team.memberIds.length > 0 ? (
          <div className="flex @2xl:contents w-full justify-end">
            <Button
              className="ml-auto"
              onClick={() => setAddOpen(true)}
              size="default"
              variant="default"
            >
              <Plus aria-hidden data-icon="inline-start" />
              Add key
            </Button>
          </div>
        ) : null}
      </div>

      <Card density="flush">
        {isEmpty && (
          <TableEmptyState
            action={
              // Sequential build gate (user direction 2026-09-01): the team
              // is built Members-first, so this CTA appears only once the
              // roster has someone. Same gate on the Budget tab's CTA.
              team.memberIds.length > 0 ? (
                <Button onClick={() => setAddOpen(true)} size="default">
                  Add key
                </Button>
              ) : undefined
            }
            body="This team has no API keys assigned yet."
            icon={
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <KeyRound
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
            }
            title="No keys"
          />
        )}
        {noMatches && (
          <TableEmptyState
            body="No keys match your search. Try a different key or member name."
            title="No keys match"
          />
        )}
        {visible.length > 0 && (
          // Five columns now carry content (name, member, prefix, status,
          // last used), so the min-width steps up from 640 to 760 — the
          // Member cell carries a Monogram plus a full name and cannot take
          // its share out of the prefix or the date without clipping them.
          <Table className="min-w-[760px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[22%] whitespace-nowrap">Key</TableHead>
                <TableHead className="w-[22%] whitespace-nowrap">
                  Prefix
                </TableHead>
                <TableHead className="w-[22%] whitespace-nowrap">
                  Member
                </TableHead>
                <TableHead className="w-[14%] whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead className="w-[20%] whitespace-nowrap">
                  Last used
                </TableHead>
                <TableHead aria-label="Actions" className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => {
                // Who the key belongs to. `ownerId` is a MEMBER_ROWS id, the
                // same source the Members tab reads, so the two tabs can
                // never name the same person differently.
                const owner = memberById(row.ownerId);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                      <span className="block truncate" title={row.name}>
                        {row.name}
                      </span>
                    </TableCell>
                    {/* py-0 for the same reason the Members tab uses it: the
                      Monogram's 32px height would otherwise stack on py-3 and
                      run these rows taller than every other table here. */}
                    <TableCell className="type-mono-14 whitespace-nowrap text-muted-foreground">
                      {row.masked}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-0">
                      {owner ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <Monogram
                            initials={firstInitial(owner.name)}
                            size="sm"
                            tone={owner.avatarTone}
                          />
                          <span
                            className="type-copy-14 truncate text-foreground"
                            title={owner.name}
                          >
                            {owner.name}
                          </span>
                        </div>
                      ) : (
                        <span className="type-copy-14 text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                    {/* Same Badge + variant pair the org API Keys table
                      uses for key status, so the two surfaces read
                      identically. The 20px badge sits inside the default
                      py-3 rhythm, so no py-0 is needed here. */}
                    <TableCell className="whitespace-nowrap">
                      {row.revoked ? (
                        <Badge variant="neutral">Revoked</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

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
  /** Same roll-up the Usage tab renders; each configured window reads its
   *  own scaled projection of it (budgetReadings). */
  usage: TeamUsage;
  onPatch: (next: Partial<TeamRow>) => void;
}) {
  const [open, setOpen] = useState(false);
  const save = (budget: TeamBudget) => {
    onPatch({ budget });
    setOpen(false);
  };
  // A budget can run several windows at once (5-hour + weekly + monthly), each
  // with its own cap. One reading per configured window, canonical order.
  const readings = useMemo(
    () => (team.budget ? budgetReadings(usage, team.budget) : []),
    [team.budget, usage]
  );
  const budget = team.budget;

  return (
    <div className="flex flex-col gap-4">
      {budget && readings.length > 0 ? (
        <>
          {/* Header row in the Usage / Security tab pattern: the saved
              budget's NAME titles the block (the dialog's Name field edits
              it; "Team budget" is only the seed default), Edit on the right. */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionTitle>{budget.name || "Team budget"}</SectionTitle>
            <Button onClick={() => setOpen(true)} size="sm" variant="outline">
              Edit budget
            </Button>
          </div>
          {/* One card per window, STACKED, the Claude / Codex limits shape
              (2026-09-01, option B): every cap is visible at once, so no pill
              to switch between them. The card title names the window and the
              description says how it resets, so the Window fact is omitted
              from the grid. The per-user / per-model tables live on the
              Usage tab only (PRD 8.3 describes one roll-up view; the tables
              were duplicated across both tabs until today). */}
          {readings.map((reading) => {
            // One call to the single source of truth, reused for both the
            // wrapper and the badge: an `ok` window must render NO
            // `CardAction` at all, because the slot's presence flips
            // CardHeader into a two-column grid and would shave 8px off
            // every healthy card's title.
            const status = budgetStatus(
              reading.spend,
              reading.cap,
              budget.warnThreshold,
              budget.enforcement
            );
            return (
              <Card key={reading.window}>
                <CardHeader>
                  <CardTitle>{BUDGET_WINDOW_LABEL[reading.window]}</CardTitle>
                  <CardDescription>
                    {BUDGET_WINDOW_RESET_COPY[reading.window]}
                  </CardDescription>
                  {/* The status word, right-aligned to the window title in
                      the header's action slot: the one place the eye already
                      goes for a card's state. */}
                  {status === "ok" ? null : (
                    <CardAction>
                      <BudgetStatusBadge
                        cap={reading.cap}
                        enforcement={budget.enforcement}
                        spend={reading.spend}
                        warnThreshold={budget.warnThreshold}
                      />
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent>
                  <BudgetSummary
                    budget={budget}
                    meterLabel={`${team.name} ${BUDGET_WINDOW_LABEL[reading.window].toLowerCase()} budget used`}
                    omitWindowFact
                    reading={reading}
                  />
                </CardContent>
              </Card>
            );
          })}
        </>
      ) : (
        <EmptyState
          action={
            // Members-first gate, same as the Keys tab: a budget caps a
            // roster's spend, so the CTA waits for the roster.
            team.memberIds.length > 0 ? (
              <Button onClick={() => setOpen(true)} size="default">
                Set budget
              </Button>
            ) : undefined
          }
          body="Set a budget to cap this team’s spend over a rolling 5-hour, weekly, or calendar-month window. A soft budget alerts you; a hard budget blocks requests once it is used up."
          icon={
            <div
              aria-hidden
              className="flex size-12 items-center justify-center rounded-md bg-muted"
            >
              <Wallet
                className="size-5 text-muted-foreground"
                strokeWidth={1.75}
              />
            </div>
          }
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

/* Security tab lives in `teams/SecurityOverviewPane.tsx` — the Enterprise-only
   chart pane (range chrome + Total-events hero + bar breakdowns). Pro's
   five-count-card `TeamSecurityPane` is untouched in `teams/SecurityPane.tsx`. */
