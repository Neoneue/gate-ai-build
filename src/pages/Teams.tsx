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
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { PageTitle } from "@/components/ui/page-title";
import {
  SegmentedPill,
  type SegmentedPillOption,
} from "@/components/ui/segmented-pill";
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
  budgetWindowLine,
  DEFAULT_TEAM_ID,
  memberName,
  ORG_BUDGET_SEED,
  orgSpend,
  TEAM_SEED_ROWS,
  type TeamBudget,
  type TeamRow,
  usageForTeam,
} from "@/data/teams";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { BudgetMeter } from "@/pages/teams/budget";
import {
  BudgetDialog,
  CreateTeamDialog,
  DeleteTeamDialog,
  RenameTeamDialog,
} from "@/pages/teams/dialogs";
import type { TeamsVariant } from "@/pages/teams/SecurityPane";

/* ─────────────────────────────────────────────────────────────────────────
 * Teams (route: /teams, sidebar: "Teams")
 *
 * Groups members and keys into teams and rolls their spend up against a team
 * budget and an org budget. Seeded from src/data/teams.ts; the page owns
 * mutation via useState, same contract the API Keys page uses.
 *
 * Every figure in the table is derived — `usageForTeam` groups the team's
 * keys out of the Activity workload, so the Spend column, the org bar, and
 * the detail page's KPIs are three readings of one fact.
 * ───────────────────────────────────────────────────────────────────────── */

/* Range chrome is scaffold-only for now: staging exposes 7D / 30D / 90D plus
 * a custom window, but the roll-up behind it is the 7d workload the rest of
 * the app meters. Wire the selection through `usageForTeam` when the gateway
 * serves per-range team totals. */
const TEAMS_RANGE_OPTIONS: SegmentedPillOption[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
];

type CustomRange = { from: Date; to: Date };

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

export function Teams({ variant = "pro" }: { variant?: TeamsVariant } = {}) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // The twin the user is in owns the whole subtree: a row opened from
  // /teams-default drills into /teams-default/:teamId so the detail page
  // keeps its variant across the navigation. Teams do not exist on Free.
  const basePath = variant === "default" ? "/teams-default" : "/teams";

  const [teams, setTeams] = useState<TeamRow[]>(TEAM_SEED_ROWS);
  const [orgBudget, setOrgBudget] = useState<TeamBudget | null>(
    ORG_BUDGET_SEED
  );
  const [range, setRange] = useState("30d");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [orgBudgetOpen, setOrgBudgetOpen] = useState(false);
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
        managerId: null,
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
  // stay complete rather than losing rows with the team.
  const handleDelete = (id: string) => {
    setTeams((prev) => {
      const doomed = prev.find((t) => t.id === id);
      if (!doomed || doomed.isDefault) {
        return prev;
      }
      return prev
        .filter((t) => t.id !== id)
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
            <SegmentedPill
              aria-label="Time range"
              onValueChange={(v) => {
                setRange(v);
                setCustomRange(null);
              }}
              options={TEAMS_RANGE_OPTIONS}
              size="sm"
              value={customRange ? "" : range}
            />
            <DateRangePicker
              onChange={(r) => {
                setCustomRange(r);
                if (!r) {
                  setRange("30d");
                }
              }}
              size="sm"
              value={customRange}
            />
            <Button onClick={() => setCreateOpen(true)} size="sm">
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

        <TeamsTable
          onDelete={setDeleting}
          onOpen={(id) => navigate(`${basePath}/${id}`)}
          onRename={setRenaming}
          spendByTeam={spendByTeam}
          teams={teams}
        />
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
          {budget ? budgetWindowLine(budget) : "No budget"}
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
          the widest content), leaving the numeric columns cramped. */}
      <Table className="min-w-[860px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableTableHead
              className="w-[26%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="team"
            >
              Team
            </SortableTableHead>
            <SortableTableHead
              className="w-[12%] whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="members"
            >
              Members
            </SortableTableHead>
            <SortableTableHead
              className="w-[10%] whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="keys"
            >
              Keys
            </SortableTableHead>
            <TableHead className="w-[20%] whitespace-nowrap">Manager</TableHead>
            <SortableTableHead
              className="w-[15%] whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="spend"
            >
              Spend
            </SortableTableHead>
            <TableHead className="w-[17%] whitespace-nowrap">Budget</TableHead>
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
        <span className="block truncate" title={memberName(row.managerId)}>
          {memberName(row.managerId)}
        </span>
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
        {formatCurrency(spend)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {row.budget ? (
          <span className="type-mono-14 text-foreground">
            {formatCurrency(row.budget.amount)}
          </span>
        ) : (
          <span className="type-copy-14 text-muted-foreground">No budget</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        <TeamRowActions onDelete={onDelete} onRename={onRename} row={row} />
      </TableCell>
    </NavTableRow>
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
