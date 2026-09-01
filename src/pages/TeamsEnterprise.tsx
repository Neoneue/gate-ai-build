import { MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
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
  ORG_BUDGET_SEED,
  orgSpend,
  TEAM_SEED_ROWS,
  type TeamBudget,
  type TeamRow,
  teamManagerName,
  usageForTeam,
} from "@/data/teams";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { BudgetMeter } from "@/pages/teams/budget";
import { budgetFillClass } from "@/pages/teams/budget-band";
import {
  BudgetDialog,
  CreateTeamDialog,
  DeleteTeamDialog,
  RenameTeamDialog,
} from "@/pages/teams/dialogs";
import type { TeamsVariant } from "@/pages/teams/SecurityPane";

/* ─────────────────────────────────────────────────────────────────────────
 * TeamsEnterprise (route: /teams-enterprise, sidebar: "Teams")
 *
 * Enterprise-workspace twin of Teams.tsx, cloned as a separate file so the
 * Enterprise Teams UI can diverge from Pro for side-by-side comparison.
 *
 * Groups members and keys into teams and rolls their spend up against a team
 * budget and an org budget. Seeded from src/data/teams.ts; the page owns
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
    default:
      return null;
  }
}

export function TeamsEnterprise({
  variant = "pro",
}: {
  variant?: TeamsVariant;
} = {}) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // The twin the user is in owns the whole subtree: a row opened from
  // /teams-default drills into /teams-default/:teamId so the detail page
  // keeps its variant across the navigation. Teams do not exist on Free.
  const basePath =
    variant === "default" ? "/teams-default" : "/teams-enterprise";

  const [teams, setTeams] = useState<TeamRow[]>(TEAM_SEED_ROWS);
  const [orgBudget, setOrgBudget] = useState<TeamBudget | null>(
    ORG_BUDGET_SEED
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [orgBudgetOpen, setOrgBudgetOpen] = useState(false);
  const [renaming, setRenaming] = useState<TeamRow | null>(null);
  const [deleting, setDeleting] = useState<TeamRow | null>(null);
  const [deletedTeams, setDeletedTeams] = useState<DeletedTeam[]>([]);

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
    setDeletedTeams((prev) => [
      ...prev,
      { id: doomed.id, name: doomed.name, spend: usageForTeam(doomed).spend },
    ]);
    setTeams((prev) =>
      prev
        .filter((t) => t.id !== id)
        .map((t) =>
          t.id === DEFAULT_TEAM_ID
            ? {
                ...t,
                memberIds: [...new Set([...t.memberIds, ...doomed.memberIds])],
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

        <OrgBudgetCard
          budget={orgBudget}
          onEdit={() => setOrgBudgetOpen(true)}
          spend={orgSpend(teams)}
        />

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
      <BudgetDialog
        budget={orgBudget}
        defaultName="Org budget"
        onOpenChange={setOrgBudgetOpen}
        onSave={(b) => {
          setOrgBudget(b);
          setOrgBudgetOpen(false);
        }}
        open={orgBudgetOpen}
        scope="org"
        title={orgBudget ? "Edit org budget" : "Set org budget"}
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

/* ─── Org budget card ──────────────────────────────────────────────────── */

function OrgBudgetCard({
  budget,
  spend,
  onEdit,
}: {
  budget: TeamBudget | null;
  spend: number;
  onEdit: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Org budget</CardTitle>
        <CardDescription>
          {/* Window only — the budget's name is the card title, so the
              "Org budget · Monthly" line read as the title twice. */}
          {budget ? BUDGET_WINDOW_LABEL[budget.window] : "No budget"}
        </CardDescription>
        <CardAction>
          <Button onClick={onEdit} size="sm" variant="outline">
            {budget ? "Edit budget" : "Set budget"}
          </Button>
        </CardAction>
      </CardHeader>
      {budget ? (
        <CardContent>
          <BudgetMeter budget={budget} label="Org budget used" spend={spend} />
        </CardContent>
      ) : null}
    </Card>
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
          the widest content), leaving the numeric columns cramped. Budget
          carries a meter + percent since 2026-08-31, so the min-width steps
          up to 960px and that column takes the extra share. */}
      <Table className="min-w-[960px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableTableHead
              className="w-[24%] whitespace-nowrap"
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
            <TableHead className="w-[17%] whitespace-nowrap">Manager</TableHead>
            <SortableTableHead
              className="w-[14%] whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="spend"
            >
              Spend
            </SortableTableHead>
            <TableHead className="w-[25%] whitespace-nowrap">Budget</TableHead>
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
        <RowBudgetMeter row={row} spend={spend} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        <TeamRowActions onDelete={onDelete} onRename={onRename} row={row} />
      </TableCell>
    </NavTableRow>
  );
}

/** The Budget column: how much of the cap this team has burned, not what the
 *  cap is. Same three-band colour ladder as the detail page's full meter
 *  (`budgetFillClass`), so a row that reads amber opens onto an amber bar. */
function RowBudgetMeter({ row, spend }: { row: TeamRow; spend: number }) {
  const budget = row.budget;
  if (!budget) {
    return (
      <span className="type-copy-14 text-muted-foreground">No budget</span>
    );
  }
  const fraction = budgetProgress(spend, budget) ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div
        aria-label={`${row.name} budget used`}
        aria-valuemax={budget.amount}
        aria-valuemin={0}
        aria-valuenow={spend}
        aria-valuetext={`${formatCurrency(spend)} of ${formatCurrency(budget.amount)}`}
        className="h-2 w-24 overflow-hidden rounded-full bg-muted"
        role="meter"
      >
        <div
          className={cn("h-full rounded-full", budgetFillClass(spend, budget))}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span className="type-copy-12 text-muted-foreground tabular-nums">
        {budgetPercentLabel(spend, budget)}
      </span>
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
