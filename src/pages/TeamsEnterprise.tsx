import { MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import {
  NavTableRow,
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import {
  BUDGET_WINDOW_LABEL,
  budgetPercentLabel,
  budgetProgress,
  DEFAULT_TEAM_ID,
  type TeamRow,
  teamManagerName,
  tightestReading,
  usageForTeam,
} from "@/data/teams";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { teamsListPath } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { BudgetStatusBadge, BudgetWarnTick } from "@/pages/teams/budget";
import { budgetFillClass } from "@/pages/teams/budget-band";
import {
  CreateTeamDialog,
  DeleteTeamDialog,
  RenameTeamDialog,
} from "@/pages/teams/dialogs";
import {
  teamsStore,
  useDeletedTeams,
  useTeams,
} from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * TeamsEnterprise (route: /teams-enterprise, sidebar: "Teams")
 *
 * Enterprise-workspace twin of Teams.tsx, cloned as a separate file so the
 * Enterprise Teams UI can diverge from Pro for side-by-side comparison.
 *
 * Groups members and keys into teams and rolls their spend up against a team
 * budget. Seeded from src/data/teams.ts; the page owns
 * mutation via useState, same contract the API Keys page uses.
 *
 * Every figure in the table is derived — `usageForTeam` groups the team's
 * keys out of the Activity workload, so the Spend column, the org bar, and
 * the detail page's KPIs are three readings of one fact.
 * ───────────────────────────────────────────────────────────────────────── */

/** A team that was deleted this session. Its members and keys folded into
 *  Default, but the spend its keys had already run stays on record — the
 *  roll-up lists it so org totals still reconcile against a team that no
 *  longer has a row in the table. */
type DeletedTeam = { id: string; name: string; spend: number };

let nextTeamSeq = 1;

function newTeamId(): string {
  nextTeamSeq += 1;
  return `team_local_${nextTeamSeq}`;
}

/** Comparable value per sortable column. Numeric columns return numbers so
 *  `sortRows` compares them numerically rather than as strings. */
function teamSortValue(
  row: TeamRow,
  usage: Map<string, number>,
  key: string
): string | number | null {
  switch (key) {
    case "team":
      return row.name;
    case "members":
      return row.memberIds.length;
    case "keys":
      return row.keyIds.length;
    case "spend":
      return usage.get(row.id) ?? 0;
    case "budget": {
      // Ranked by the TIGHTEST window's utilisation — the same reading the
      // row's meter paints, so sorting can never reorder against the bars.
      if (!row.budget) {
        return null;
      }
      const { cap, spend } = tightestReading(usageForTeam(row), row.budget);
      return cap > 0 ? spend / cap : 0;
    }
    default:
      return null;
  }
}

export function TeamsEnterprise() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // The tier the user is in owns the whole subtree: a row opened from
  // /teams-enterprise drills into /teams-enterprise/:teamId, /teams-default
  // into /teams-default/:teamId, and Pro /teams into /teams/:teamId. One
  // build serves all three; the pathname decides. Teams do not exist on Free.
  const basePath = teamsListPath(useLocation().pathname);

  // Teams and deleted-team snapshots live in the module store
  // (teams/teams-store.ts), shared with the detail page, so a team created
  // here still exists when its row navigates there (a fresh page-local
  // useState answered "Team not found" for every new team, 2026-09-01).
  const teams = useTeams();
  const setTeams = (next: TeamRow[] | ((prev: TeamRow[]) => TeamRow[])) =>
    teamsStore.setTeams(next);
  const deletedTeams = useDeletedTeams();
  const [createOpen, setCreateOpen] = useState(false);
  const [renaming, setRenaming] = useState<TeamRow | null>(null);
  const [deleting, setDeleting] = useState<TeamRow | null>(null);

  const spendByTeam = useMemo(
    () => new Map(teams.map((t) => [t.id, usageForTeam(t).spend])),
    [teams]
  );

  const handleCreate = (name: string) => {
    setTeams((prev) => [
      ...prev,
      {
        id: newTeamId(),
        name,
        isDefault: false,
        memberIds: [],
        keyIds: [],
        managerIds: [],
        budget: null,
      },
    ]);
    setCreateOpen(false);
  };

  const handleRename = (id: string, name: string) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
    setRenaming(null);
  };

  // Deleting folds the team's members and keys into Default — the same
  // contract the confirm copy states, so the roster and the key assignments
  // stay complete rather than losing rows with the team. The team's spend is
  // recorded first: the keys keep serving under Default, but what they ran
  // under this team is historical usage the org still has to account for.
  const handleDelete = (id: string) => {
    const doomed = teams.find((t) => t.id === id);
    if (!doomed || doomed.isDefault) {
      setDeleting(null);
      return;
    }
    // Captured OUTSIDE the state updater: an updater runs twice under Strict
    // Mode, which would file the same deleted team twice.
    teamsStore.appendDeleted({
      id: doomed.id,
      name: doomed.name,
      spend: usageForTeam(doomed).spend,
    });
    setTeams((prev) =>
      prev
        .filter((t) => t.id !== id)
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
    setDeleting(null);
  };

  return (
    <DashboardChrome
      activeNavId="teams"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Caps on a CONTAINER query, matching Team / API Keys: the Ask AI panel
          narrows this column without narrowing the window. */}
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
            <PageTitle>Teams</PageTitle>
            <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
              Organize members and keys into teams, and roll up spend against
              team and org budgets.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus
                aria-hidden
                className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none"
                data-icon="inline-start"
              />
              Create team
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle>Your teams</SectionTitle>
          <TeamsTable
            onDelete={setDeleting}
            onOpen={(id) => navigate(`${basePath}/${id}`)}
            onRename={setRenaming}
            spendByTeam={spendByTeam}
            teams={teams}
          />
        </div>

        {deletedTeams.length === 0 ? null : (
          <DeletedTeamsCard rows={deletedTeams} />
        )}
      </div>

      <CreateTeamDialog
        onCreate={handleCreate}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />
      <RenameTeamDialog
        currentName={renaming?.name ?? ""}
        onOpenChange={(next) => {
          if (!next) {
            setRenaming(null);
          }
        }}
        onRename={(name) => {
          if (renaming) {
            handleRename(renaming.id, name);
          }
        }}
        open={renaming !== null}
      />
      <DeleteTeamDialog
        onDelete={() => {
          if (deleting) {
            handleDelete(deleting.id);
          }
        }}
        onOpenChange={(next) => {
          if (!next) {
            setDeleting(null);
          }
        }}
        open={deleting !== null}
        teamName={deleting?.name ?? ""}
      />
    </DashboardChrome>
  );
}

/* ─── Teams table ──────────────────────────────────────────────────────── */

function TeamsTable({
  teams,
  spendByTeam,
  onOpen,
  onRename,
  onDelete,
}: {
  teams: TeamRow[];
  spendByTeam: Map<string, number>;
  onOpen: (id: string) => void;
  onRename: (team: TeamRow) => void;
  onDelete: (team: TeamRow) => void;
}) {
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = useMemo(
    () =>
      sortRows(teams, sort, (row, key) => teamSortValue(row, spendByTeam, key)),
    [teams, sort, spendByTeam]
  );

  if (teams.length === 0) {
    return (
      <Card density="flush">
        <TableEmptyState
          body="Create a team to start organizing members, keys, and budgets."
          title="No teams yet"
        />
      </Card>
    );
  }

  return (
    <Card density="flush">
      {/* `table-fixed` + percentage header widths: with auto layout the
          browser hands its slack to whichever cell can grow most (Manager,
          the widest content), leaving the numeric columns cramped. Widths
          22/11/9/15/12/31 (2026-09-01): Members and Keys sit at the floor
          their right-aligned header + sort glyph + px-3 needs at 960px,
          Manager is trimmed so the table fits the column without a
          horizontal scroll, and Budget (meter + "92.3% weekly") takes the
          balance. */}
      <Table className="min-w-[960px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableTableHead
              className="w-[22%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="team"
            >
              Team
            </SortableTableHead>
            <SortableTableHead
              className="w-[11%] whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="members"
            >
              Members
            </SortableTableHead>
            <SortableTableHead
              className="w-[9%] whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="keys"
            >
              Keys
            </SortableTableHead>
            <TableHead className="w-[15%] whitespace-nowrap">Manager</TableHead>
            <SortableTableHead
              className="w-[12%] whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="spend"
            >
              Spend
            </SortableTableHead>
            <TableHead className="w-[31%] whitespace-nowrap">Budget</TableHead>
            <TableHead aria-label="Actions" className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => {
            const spend = spendByTeam.get(row.id) ?? 0;
            return (
              <TeamTableRow
                key={row.id}
                onDelete={onDelete}
                onOpen={onOpen}
                onRename={onRename}
                row={row}
                spend={spend}
              />
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function TeamTableRow({
  row,
  spend,
  onOpen,
  onRename,
  onDelete,
}: {
  row: TeamRow;
  spend: number;
  onOpen: (id: string) => void;
  onRename: (team: TeamRow) => void;
  onDelete: (team: TeamRow) => void;
}) {
  return (
    <NavTableRow
      aria-label={`Open ${row.name}`}
      onActivate={() => onOpen(row.id)}
    >
      <TableCell className="whitespace-nowrap">
        <div className="flex min-w-0 items-center gap-2">
          {/* Row-IDENTIFIER cell: it names the row the way Members / Keys /
              Manager name their own values, so it stays at 400 rather than
              making Team the one column that shouts.
              design-allow-copy-voice — see design.md §3. */}
          <span
            className="type-copy-14 truncate text-foreground"
            title={row.name}
          >
            {row.name}
          </span>
          {row.isDefault ? <Badge variant="neutral">Default</Badge> : null}
        </div>
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
        {formatNumber(row.memberIds.length)}
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
        {formatNumber(row.keyIds.length)}
      </TableCell>
      <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
        <span className="block truncate" title={teamManagerName(row)}>
          {teamManagerName(row)}
        </span>
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
        {formatCurrency(spend)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <RowBudgetMeter row={row} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        <TeamRowActions onDelete={onDelete} onRename={onRename} row={row} />
      </TableCell>
    </NavTableRow>
  );
}

/** The Budget column: how much of the cap this team has burned, not what the
 *  cap is. A budget can run several windows at once, so the row shows the
 *  TIGHTEST one — the window that blocks first — and names it, since "92.3%"
 *  means nothing without knowing which cap it is 92.3% of. Same three-band
 *  colour ladder as the detail page's full meter (`budgetFillClass`), so a
 *  row that reads amber opens onto an amber bar. */
function RowBudgetMeter({ row }: { row: TeamRow }) {
  const budget = row.budget;
  if (!budget) {
    return (
      <span className="type-copy-14 text-muted-foreground">No budget</span>
    );
  }
  const { window, cap, spend } = tightestReading(usageForTeam(row), budget);
  const fraction = budgetProgress(spend, cap) ?? 0;
  const windowWord = BUDGET_WINDOW_LABEL[window].toLowerCase();
  return (
    <div className="flex items-center gap-2">
      <div
        aria-label={`${row.name} ${windowWord} budget used`}
        aria-valuemax={cap}
        aria-valuemin={0}
        aria-valuenow={spend}
        aria-valuetext={`${formatCurrency(spend)} of ${formatCurrency(cap)}`}
        className="relative h-2 w-24 shrink-0 overflow-hidden rounded-full bg-muted"
        role="meter"
      >
        <div
          className={cn(
            "h-full rounded-full",
            budgetFillClass(spend, cap, budget.warnThreshold)
          )}
          style={{ width: `${fraction * 100}%` }}
        />
        <BudgetWarnTick
          fraction={fraction}
          warnThreshold={budget.warnThreshold}
        />
      </div>
      <span className="type-copy-12 text-muted-foreground tabular-nums">
        {budgetPercentLabel(spend, cap, budget.enforcement)} {windowWord}
      </span>
      {/* The status word: a red bar at 100% and an amber one at 85% are two
          different situations, and the column is 24px tall: the label is
          what makes the difference readable at a glance. Absent when the
          budget is fine. */}
      <BudgetStatusBadge
        cap={cap}
        enforcement={budget.enforcement}
        spend={spend}
        warnThreshold={budget.warnThreshold}
      />
    </div>
  );
}

/** Rename / Delete, both inert on the Default team — it is the fold-in
 *  target for every other team, so it can be neither renamed nor removed. */
function TeamRowActions({
  row,
  onRename,
  onDelete,
}: {
  row: TeamRow;
  onRename: (team: TeamRow) => void;
  onDelete: (team: TeamRow) => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            aria-label={`Open actions for ${row.name}`}
            onClick={(e) => e.stopPropagation()}
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal />
      </MenuTrigger>
      {/* The popup is a REACT portal, so its events still bubble up the React
          tree into the row's `onActivate` — clicking "Delete" navigated to the
          team instead of opening the confirm. Stop both click and key here
          (Enter/Space are the row's other activation path). */}
      <MenuContent
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <MenuItem disabled={row.isDefault} onClick={() => onRename(row)}>
          Rename
        </MenuItem>
        <MenuItem
          disabled={row.isDefault}
          onClick={() => onDelete(row)}
          variant="destructive"
        >
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/* ─── Deleted teams ────────────────────────────────────────────────────── */

/** Historical usage for teams deleted this session. Their keys moved to
 *  Default and keep serving there, so this list is not a second place to
 *  manage them — it is the record that keeps org spend adding up after a team
 *  stops having a row. No sort, no actions: nothing here is actionable. */
function DeletedTeamsCard({ rows }: { rows: DeletedTeam[] }) {
  return (
    <Card density="flush">
      <div className="px-4 pt-4">
        <h2 className="type-label-14 m-0 text-muted-foreground">
          Deleted teams (historical usage)
        </h2>
      </div>
      <Table className="min-w-[360px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[70%] whitespace-nowrap">Team</TableHead>
            <TableHead className="w-[30%] whitespace-nowrap text-right">
              Spend
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="type-copy-14 whitespace-nowrap text-muted-foreground">
                {row.name}
                <span className="type-copy-12"> (deleted)</span>
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-right text-muted-foreground">
                {formatCurrency(row.spend)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
