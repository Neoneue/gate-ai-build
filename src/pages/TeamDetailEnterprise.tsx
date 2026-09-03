import { KeyRound, Plus, UserMinus, Wallet } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { VENDOR_META } from "@/components/icons/vendor-meta";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
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
import { MEMBER_ROWS, type MemberRow } from "@/data/team-members";
import {
  BUDGET_WINDOW_LABEL,
  BUDGET_WINDOW_RESET_COPY,
  budgetAlertRecipients,
  budgetReadings,
  DEFAULT_TEAM_ID,
  deleteTeam,
  keyById,
  memberById,
  memberJoinedAt,
  moveMembersToTeam,
  scaleUsage,
  type TeamBudget,
  type TeamRow,
  type TeamUsage,
  teamOfMember,
  teamSavedPercent,
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
import { cn } from "@/lib/utils";
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
  AddMembersDialog,
  BudgetDialog,
  DeleteTeamDialog,
  RemoveTeamMemberDialog,
  RenameTeamDialog,
} from "@/pages/teams/dialogs";
import { TeamPoliciesPane } from "@/pages/teams/PoliciesPane";
import { TeamSecurityOverviewPane } from "@/pages/teams/SecurityOverviewPane";
import type { TeamsVariant } from "@/pages/teams/SecurityPane";
import { LockSettingsCard, SettingsStack } from "@/pages/teams/SettingsStack";
import { teamSparkSeries } from "@/pages/teams/spark-series";
import {
  TeamTokenSavingsPane,
  TeamTokenSavingsRail,
} from "@/pages/teams/TokenSavingsPane";
import {
  logSettingsChange,
  teamsStore,
  useCurrentUserTeam,
  useDeletedTeams,
  useOrgSettings,
  useTeams,
  useViewRole,
} from "@/pages/teams/teams-store";
import {
  skeletonRowIds,
  useTheatreLoading,
} from "@/pages/teams/use-theatre-loading";

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
  // An archived team resolves from its frozen snapshot: the row as it stood
  // when it was deleted. Every tab renders from it; nothing on it can change.
  const deletedTeams = useDeletedTeams();
  const liveTeam = teams.find((t) => t.id === teamId);
  const archivedTeam = deletedTeams.find((t) => t.id === teamId)?.team;
  const team = liveTeam ?? archivedTeam;
  const archived = !liveTeam && Boolean(archivedTeam);
  // Team-manager view (AG-695 AC 3): scoped to ONE team. Another team's URL
  // redirects to their own; the back link to the list is hidden (the list
  // is owners and admins only); budgets and settings are read-only; the
  // Members tab keeps add / remove of existing org members (PRD §8.3, §8.4)
  // but not the role select (assigning managers is owner / admin, §3).
  const viewRole = useViewRole();
  const ownTeam = useCurrentUserTeam();
  const manager = viewRole === "manager";
  // Member view (user 2026-09-03): own team, read-only, Overview + Members
  // only; the roster is a pure list (no add, remove or role select).
  const member = viewRole === "member";
  const teamRole = manager || member;

  // ONE call, in the PAGE body — not in a pane. Every tab reads this same
  // boolean, so switching tabs cannot restart the skeletons; a per-pane hook
  // would re-run the wait on every tab click. Demo theatre today; in the real
  // app this is the team query's `isLoading`.
  const loading = useTheatreLoading();

  const patch = (next: Partial<TeamRow>) => {
    if (archived) {
      return;
    }
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, ...next } : t))
    );
  };

  // Adding a member is a MOVE (PRD 3 / 8.1), so it writes across the whole
  // array, not just this team — which is why the page holds every team rather
  // than the one it is showing. Same state that lets "Add keys" name the team
  // a candidate key is currently on.
  const moveMembers = (ids: string[]) => {
    if (!teamId || archived) {
      return;
    }
    setTeams((prev) => moveMembersToTeam(prev, teamId, ids));
  };

  // Members follow the same rule (PRD 3 / 8.1: every user is on exactly one
  // team). Removing one moves them to Default; `moveMembersToTeam` drops
  // their manager role and joined stamp on the way out.
  const removeMember = (memberId: string) => {
    if (archived) {
      return;
    }
    setTeams((prev) => moveMembersToTeam(prev, DEFAULT_TEAM_ID, [memberId]));
  };

  // Same fold-in contract as the list page's delete: members and keys land on
  // Default, then the page has nothing left to show, so it returns to the list.
  const handleDeleteTeam = () => {
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
      deletedAt: new Date(),
      team: doomed,
    });
    setTeams((prev) => deleteTeam(prev, doomed.id));
    navigate(listPath);
  };

  if (teamRole && ownTeam && teamId !== ownTeam.id) {
    return <Navigate replace to={`${listPath}/${ownTeam.id}`} />;
  }

  return (
    <DashboardChrome
      activeNavId="teams"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div
        aria-busy={loading}
        className="flex w-full @5xl:max-w-5xl flex-col gap-6"
      >
        {teamRole ? null : (
          <BackLink label="Teams" onClick={() => navigate(listPath)} />
        )}

        {/* The page's ONE announcement of the wait — the skeletons in every
            pane are `aria-hidden`. No visible spinner, no visible text. */}
        {loading ? (
          <span className="sr-only" role="status">
            Loading…
          </span>
        ) : null}

        {team ? (
          <TeamDetailBody
            archived={archived}
            loading={loading}
            manager={manager}
            member={member}
            onDeleteTeam={handleDeleteTeam}
            onMoveMembers={moveMembers}
            onPatch={patch}
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

type TabId =
  | "overview"
  | "members"
  | "keys"
  | "budget"
  | "usage"
  | "security"
  | "policies"
  | "savings"
  | "settings";

function TeamDetailBody({
  team,
  teams,
  onPatch,
  onMoveMembers,
  onRemoveMember,
  onDeleteTeam,
  archived,
  manager,
  member,
  variant,
  loading,
}: {
  team: TeamRow;
  /** Every team — the pickers name the team a candidate would leave. */
  teams: TeamRow[];
  onPatch: (next: Partial<TeamRow>) => void;
  onMoveMembers: (ids: string[]) => void;
  onRemoveMember: (memberId: string) => void;
  onDeleteTeam: () => void;
  /** Frozen snapshot of a deleted team: no Settings tab, no mutations. */
  archived: boolean;
  /** Team-manager view: budgets and settings read-only, no role select. */
  manager: boolean;
  /** Member view: Overview + Members only, roster is a pure list. */
  member: boolean;
  variant: TeamsVariant;
  /** Threaded down to every pane from the ONE page-level hook call, so the
   *  skeletons do not restart when a tab changes. */
  loading: boolean;
}) {
  const teamRole = manager || member;
  // Management tabs lead (user 2026-09-01): a fresh team is populated before
  // it is read, and a manager lands on their roster the way the Teams list
  // lands on teams. Data tabs (Usage, Budget, Security) follow.
  const [tab, setTab] = useState<TabId>("overview");
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const usage = useMemo(() => usageForTeam(team), [team]);
  // Overview tab: ONE range drives the Usage, Security and Token savings
  // blocks; their own pickers are hidden while controlled.
  const [overviewRange, setOverviewRange] = useState<Range>("all");
  const [overviewCustomRange, setOverviewCustomRange] =
    useState<CustomRange | null>(null);
  const overviewControlled = {
    range: overviewRange,
    customRange: overviewCustomRange,
  };
  // Member scope (user 2026-09-03): "All members" reads the team roll-up; one
  // member narrows every Overview block to their keys. Done by handing the
  // panes a VIRTUAL team row that holds only that member and their keys, so
  // usageForTeam / teamSavingsKpis derive exactly as they do for a team. The
  // Security bento keeps the team share (its canon is allocated per team id);
  // only its member tables narrow.
  const [memberScope, setMemberScope] = useState("all");
  const scopedTeam = useMemo<TeamRow>(() => {
    if (memberScope === "all") {
      return team;
    }
    const owned = (id: string) => keyById(id)?.ownerId === memberScope;
    return {
      ...team,
      memberIds: team.memberIds.filter((id) => id === memberScope),
      keyIds: team.keyIds.filter(owned),
      // History keys too, so a PAST member's keys still attribute here and
      // their read lands in the "past members" tables (PRD 3: history stays).
      historyKeyIds: team.historyKeyIds?.filter(owned),
    };
  }, [team, memberScope]);
  const pastMembers = useMemo(
    () => usage.byUser.filter((r) => r.former),
    [usage]
  );
  const scopedUsage = useMemo(() => usageForTeam(scopedTeam), [scopedTeam]);

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
              ? "Can’t be renamed or deleted."
              : "Members, keys, and budget for this team."}
          </p>
        </div>
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">
            <span>Members</span>
            <TabsCount>{team.memberIds.length}</TabsCount>
          </TabsTrigger>
          {member ? null : (
            <TabsTrigger value="keys">
              <span>Keys</span>
              <TabsCount>{team.keyIds.length}</TabsCount>
            </TabsTrigger>
          )}
          {member ? null : <TabsTrigger value="budget">Budget</TabsTrigger>}
          {archived || member ? null : (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          {/* Catch-all read of the team: the Usage tab body, then the
              Security tab body, then the Token savings KPI rail, each
              retitled after its tab. One range picker in the header drives
              all three. */}
          <div className="flex flex-col gap-8 [&>*+*]:border-border [&>*+*]:border-t [&>*+*]:pt-8 [&_[data-slot=section-title]:not(.type-heading-24)]:text-lg/7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
                <PageTitle as="h2" className="type-heading-28">
                  Team overview
                </PageTitle>
                <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
                  Monitor request volume, token usage, spend, and security
                  signals across your team.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SegmentedPill
                  aria-label="Time range"
                  onValueChange={(v) => {
                    setOverviewRange(v as PresetRange);
                    setOverviewCustomRange(null);
                  }}
                  options={RANGE_OPTIONS}
                  size="sm"
                  value={overviewRange === "custom" ? "" : overviewRange}
                />
                <DateRangePicker
                  onChange={(r) => {
                    if (r) {
                      setOverviewCustomRange(r);
                      setOverviewRange("custom");
                    } else {
                      setOverviewCustomRange(null);
                      setOverviewRange("all");
                    }
                  }}
                  size="sm"
                  value={overviewCustomRange}
                />
                <Select onValueChange={setMemberScope} value={memberScope}>
                  <SelectTrigger
                    aria-label="Filter by member"
                    className="border-border bg-card text-foreground"
                    size="sm"
                  >
                    <SelectValue placeholder="All members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All members</SelectItem>
                    {team.memberIds.map((id) => {
                      const m = memberById(id);
                      return m ? (
                        <SelectItem key={id} value={id}>
                          {m.name}
                        </SelectItem>
                      ) : null;
                    })}
                    {pastMembers.length > 0 ? (
                      <SelectGroup>
                        <SelectLabel>Past members</SelectLabel>
                        {pastMembers.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <UsagePane
              controlledRange={overviewControlled}
              loading={loading}
              singleMember={memberScope !== "all"}
              teamId={team.id}
              title="Usage"
              titleClassName="type-heading-24"
              usage={scopedUsage}
            />
            <TeamSecurityOverviewPane
              controlledRange={overviewControlled}
              loading={loading}
              memberId={memberScope === "all" ? undefined : memberScope}
              team={team}
              teams={teams}
              title="Security"
              titleClassName="type-heading-24"
              variant={variant}
            />
            <TeamTokenSavingsRail
              controlledRange={overviewControlled}
              loading={loading}
              team={scopedTeam}
              teams={teams}
              title="Token savings"
              titleClassName="type-heading-24"
            />
          </div>
        </TabsContent>
        <TabsContent value="members">
          <MembersPane
            archived={archived}
            canAssignRoles={!teamRole}
            loading={loading}
            onMoveMembers={onMoveMembers}
            onPatch={onPatch}
            onRemoveMember={onRemoveMember}
            readOnly={member}
            team={team}
            teams={teams}
          />
        </TabsContent>
        <TabsContent value="keys">
          <KeysPane loading={loading} team={team} />
        </TabsContent>
        <TabsContent value="budget">
          <BudgetPane
            archived={archived}
            loading={loading}
            onPatch={onPatch}
            readOnly={manager}
            team={team}
            usage={usage}
          />
        </TabsContent>
        <TabsContent value="usage">
          <UsagePane loading={loading} teamId={team.id} usage={usage} />
        </TabsContent>
        <TabsContent value="security">
          <TeamSecurityOverviewPane
            loading={loading}
            team={team}
            teams={teams}
            variant={variant}
          />
        </TabsContent>
        <TabsContent value="policies">
          {/* Same write path as the Budget tab's `save`: the pane is a
              controlled surface and hands the whole array back, which
              `onPatch` merges into the team row in the shared store.
              No skeleton: every row on it is a control, not a reading. */}
          <TeamPoliciesPane
            onChange={(policies) => onPatch({ policies })}
            policies={team.policies}
          />
        </TabsContent>
        <TabsContent value="savings">
          <TeamTokenSavingsPane
            loading={loading}
            onChange={(savings) => onPatch({ savings })}
            team={team}
            teams={teams}
          />
        </TabsContent>
        <TabsContent value="settings">
          {variant === "default" ? (
            // Not entitled (AG-624): no forced settings, no lock. Default is
            // the Free-plan workspace, so Settings is the General block only.
            <GeneralSettings
              onDelete={() => setDeleteOpen(true)}
              onRename={() => setRenameOpen(true)}
              team={team}
            />
          ) : manager ? (
            // Team-manager view: read-only. No rename / delete, no lock card
            // (PRD §5: manager write beyond membership is a non-goal).
            <SettingsStack
              locked
              lockedBy="Read-only. Team settings are managed by an org admin."
              onPoliciesChange={() => undefined}
              onSavingsChange={() => undefined}
              policies={team.policies}
              savings={team.savings}
            />
          ) : (
            <SettingsTab
              onDelete={() => setDeleteOpen(true)}
              onPatch={onPatch}
              onRename={() => setRenameOpen(true)}
              team={team}
            />
          )}
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

/* ─── Settings tab ─────────────────────────────────────────────────────── */

/** The team-level actions (AG-695 scope: "create, rename and delete a
 *  team"). One card per action so the destructive one stands apart from the
 *  rename, in the Budget tab's card shape. The Default team gets neither
 *  (PRD 3 / 8.1: it is the fold-in target for every other team), so it
 *  states that instead of showing disabled controls. */
function SettingsTab({
  team,
  onRename,
  onDelete,
  onPatch,
}: {
  team: TeamRow;
  onRename: () => void;
  onDelete: () => void;
  onPatch: (patch: Partial<TeamRow>) => void;
}) {
  // Org lock cascades down (AG-624 / PRD 8.5): while it is on, this team's
  // Policies and Token savings controls render disabled with a "who set it"
  // banner and the team's own lock card disables. The team lock is a row
  // field (`TeamRow.locked`), so the sidebar "My settings" pages read it.
  const org = useOrgSettings();
  const teamLocked = team.locked ?? false;
  const locked = org.locked || teamLocked;
  return (
    <SettingsStack
      general={
        <GeneralSettings onDelete={onDelete} onRename={onRename} team={team} />
      }
      lockCard={
        <LockSettingsCard
          checked={locked}
          description={
            org.locked
              ? "Locked by your organization. An org admin controls these settings for every team."
              : "This will lock all settings for this team's policies and token savings controls."
          }
          disabled={org.locked}
          id="team-lock-label"
          onCheckedChange={(next) => {
            logSettingsChange(`Team "${team.name}"`, team, { locked: next });
            onPatch({ locked: next });
          }}
          title="Lock settings for this team"
        />
      }
      locked={locked}
      lockedBy={
        org.locked
          ? "Locked by your organization. These settings are set by an org admin and can't be changed here."
          : undefined
      }
      onPoliciesChange={(policies) => {
        logSettingsChange(`Team "${team.name}"`, team, { policies });
        onPatch({ policies });
      }}
      onSavingsChange={(savings) => {
        logSettingsChange(`Team "${team.name}"`, team, { savings });
        onPatch({ savings });
      }}
      // Forced settings are the ORG's values applied to the team (PRD 8.5):
      // while the org lock is on, the team page shows the org defaults, not
      // the team's own last-saved values.
      policies={org.locked ? org.policies : team.policies}
      savings={org.locked ? org.savings : team.savings}
    />
  );
}

function GeneralSettings({
  team,
  onRename,
  onDelete,
}: {
  team: TeamRow;
  onRename: () => void;
  onDelete: () => void;
}) {
  if (team.isDefault) {
    return (
      <Callout>
        The default team can’t be renamed or deleted. Members and keys removed
        from other teams land here.
      </Callout>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Team name</CardTitle>
          <CardDescription>
            {team.name}. Shown on the Teams list, in budget alerts, and in every
            dialog that names this team.
          </CardDescription>
          <CardAction>
            <Button onClick={onRename} size="sm" variant="outline">
              Rename
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Delete team</CardTitle>
          <CardDescription>
            Members and keys on this team move to the default team. The team and
            its history are removed. This can’t be undone.
          </CardDescription>
          <CardAction>
            <Button onClick={onDelete} size="sm" variant="destructive">
              Delete team
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
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

/** Search haystack for a by-model row: the model name plus its provider's
 *  display name ("Anthropic", "OpenAI"), so either finds the row. */
function modelSearchText(row: UsageSlice): string {
  const vendor = MODEL_VENDOR.get(row.id);
  const provider = vendor ? VENDOR_META[vendor].label : "";
  return `${row.label} ${provider}`.toLowerCase();
}

function UsagePane({
  teamId,
  usage,
  loading,
  title = "Overview",
  titleClassName,
  controlledRange,
  singleMember = false,
}: {
  teamId: string;
  usage: TeamUsage;
  loading: boolean;
  /** Overview member scope is on: the member tables hold one row, so their
   *  search inputs hide. The model table keeps its search. */
  singleMember?: boolean;
  /** Section title. The Usage tab keeps "Overview"; the Overview tab names
   *  this block "Usage". */
  title?: string;
  titleClassName?: string;
  /** Controlled range (Overview tab). When set, the section's own range
   *  chrome is hidden and the tab-level picker drives every number. */
  controlledRange?: { range: Range; customRange: CustomRange | null };
}) {
  // Range chrome matches Activity's Overview row: preset pill + custom
  // picker, landing on All. Every number on the tab is the team's REAL 7d
  // workload projected onto the selected window via effectiveScale — the
  // same derivation Activity's KPI rail and Top cards use, so the KPIs and
  // the breakdown tables below always describe the same selection.
  const [ownRange, setRange] = useState<Range>("all");
  const [ownCustomRange, setCustomRange] = useState<CustomRange | null>(null);
  const range = controlledRange ? controlledRange.range : ownRange;
  const customRange = controlledRange
    ? controlledRange.customRange
    : ownCustomRange;
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
          <SectionTitle className={titleClassName}>{title}</SectionTitle>
          {controlledRange ? null : (
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
          )}
        </div>
        <KpiRail columns={3}>
          <CompactKpi
            flat
            loading={loading}
            spark={
              <CompactSpark
                colorVar="var(--color-chart-1)"
                data={spendSpark}
                labels={sparkLabels}
                tooltip
                valueFormatter={(v) => fmtUsd(v)}
              />
            }
            title="Total spend"
            value={formatCurrency(scaled.spend)}
          />
          <CompactKpi
            flat
            loading={loading}
            spark={
              <CompactSpark
                colorVar="var(--color-neutral-500)"
                data={requestsSpark}
                labels={sparkLabels}
                tooltip
                valueFormatter={(v) => fmtInt(Math.round(v))}
              />
            }
            title="Total messages"
            value={formatCompactCount(scaled.requests)}
          />
          <CompactKpi
            flat
            loading={loading}
            spark={
              <CompactSpark
                colorVar="var(--color-chart-3)"
                data={tokensSpark}
                labels={sparkLabels}
                tooltip
                valueFormatter={(v) => fmtTokens(Math.round(v))}
              />
            }
            title="Tokens used"
            value={formatCompactCount(scaled.tokens)}
          />
        </KpiRail>
      </div>

      {/* One member selected: only the table they sit in renders. A past
          member has no current row, so the current table hides. */}
      {singleMember && !scaled.byUser.some((r) => !r.former) ? null : (
        <UsageBreakdown
          avatarFor={userAvatar}
          customRange={customRange}
          emptyBody="Once this team’s keys start serving traffic, spend per user appears here."
          emptyTitle="No per-user data yet."
          firstColumn="Member"
          loading={loading}
          range={range}
          rows={scaled.byUser.filter((r) => !r.former)}
          searchLabel="Search current members"
          searchPlaceholder="Search by member…"
          showSearch={!singleMember}
          title="Usage by current members"
          tokens
        />
      )}
      {/* PRD §3: "past requests keep their original team". */}
      {scaled.byUser.some((r) => r.former) ? (
        <UsageBreakdown
          avatarFor={userAvatar}
          customRange={customRange}
          emptyBody=""
          emptyTitle="No past members."
          firstColumn="Member"
          loading={loading}
          range={range}
          rows={scaled.byUser.filter((r) => r.former)}
          searchLabel="Search past members"
          searchPlaceholder="Search by member…"
          showSearch={!singleMember}
          title="Usage by past members"
          tokens
        />
      ) : null}
      <UsageBreakdown
        avatarFor={modelAvatar}
        customRange={customRange}
        emptyBody="Once this team’s keys route through the gateway, spend per model appears here."
        emptyTitle="No per-model data yet."
        firstColumn="Model"
        loading={loading}
        range={range}
        rows={scaled.byModel}
        searchLabel="Search models"
        searchPlaceholder="Search by model or provider…"
        searchText={modelSearchText}
        title="Usage by model"
      />
    </div>
  );
}

/** Comparable value per sortable column. `label` sorts on the string shown,
 *  which is a person's name in the by-user table and a model name in the
 *  by-model one, so one accessor serves both instances. */
function usageSortValue(
  row: UsageSlice,
  key: string,
  range: Range,
  customRange: CustomRange | null
): string | number | null {
  switch (key) {
    case "label":
      return row.label;
    case "requests":
      return row.requests;
    case "tokensIn":
      return row.tokensIn ?? 0;
    case "tokensOut":
      return row.tokensOut ?? 0;
    // A row with no savings rate renders an EMPTY cell, so it sorts below
    // every row that has one — -1 rather than null, which `sortRows` would
    // read as "no comparable value".
    case "saved":
      return teamSavedPercent(row.saved, range, customRange) ?? -1;
    case "spend":
      return row.spend;
    default:
      return null;
  }
}

/** The Saved column's cell. Percent to ONE decimal, always (standing rule),
 *  in the Spend cell's own mono voice. A member with no savings rate renders
 *  an EMPTY cell — no dash, no zero: "0.0%" would claim a measured rate of
 *  nothing saved, which is a different fact from having no rate at all. */
function SavedCell({
  saved,
  range,
  customRange,
}: {
  saved: number | undefined;
  range: Range;
  customRange: CustomRange | null;
}) {
  const pct = teamSavedPercent(saved, range, customRange);
  return (
    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
      {pct === null ? null : `${pct.toFixed(1)}%`}
    </TableCell>
  );
}

function UsageBreakdown({
  title,
  firstColumn,
  rows,
  emptyTitle,
  emptyBody,
  avatarFor,
  tokens = false,
  loading,
  range,
  customRange,
  searchLabel,
  searchPlaceholder,
  searchText = (row) => row.label.toLowerCase(),
  showSearch = true,
}: {
  showSearch?: boolean;
  title: string;
  firstColumn: string;
  rows: UsageSlice[];
  emptyTitle: string;
  /** Search input above the table, same control the Members tab uses. */
  searchLabel: string;
  searchPlaceholder: string;
  /** Lower-cased haystack per row; defaults to the label (member name). */
  searchText?: (row: UsageSlice) => string;
  /** Member tables carry Tokens in / Tokens out between Messages and Spend
   *  (user direction 2026-09-02); the model table does not. */
  tokens?: boolean;
  emptyBody: string;
  /** Row icon — a member Monogram in the by-user table, the vendor mark in
   *  the by-model one. */
  avatarFor: (row: UsageSlice) => ReactNode;
  loading: boolean;
  /** The tab's selected window — the Saved column is a RATE, so it is moved
   *  onto the range the same way Activity's Saved column is. */
  range: Range;
  customRange: CustomRange | null;
}) {
  // One hook per instance: the by-user table and the by-model table sort
  // independently, and both start in the incoming (spend-ranked) order.
  const { sort, toggle: toggleSort } = useTableSort();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => (q ? rows.filter((row) => searchText(row).includes(q)) : rows),
    [rows, q, searchText]
  );
  const sortedRows = useMemo(
    () =>
      sortRows(visible, sort, (row, key) =>
        usageSortValue(row, key, range, customRange)
      ),
    [visible, sort, range, customRange]
  );
  const isEmpty = rows.length === 0;
  const noMatches = !isEmpty && visible.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{title}</SectionTitle>
      {showSearch ? (
        <SearchInput
          ariaLabel={searchLabel}
          className="w-full min-w-0"
          onChange={setQuery}
          placeholder={searchPlaceholder}
          value={query}
        />
      ) : null}
      <Card density="flush">
        {isEmpty && !loading ? (
          <TableEmptyState body={emptyBody} title={emptyTitle} />
        ) : noMatches && !loading ? (
          <TableEmptyState
            body="No rows match your search. Try a different name."
            title="No matches"
          />
        ) : (
          <Table className="min-w-[560px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead
                  className={cn(
                    "whitespace-nowrap",
                    tokens ? "w-[20%]" : "w-[52%]"
                  )}
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="label"
                >
                  {firstColumn}
                </SortableTableHead>
                <SortableTableHead
                  className={cn(
                    "whitespace-nowrap",
                    tokens ? "w-[16%]" : "w-[24%]"
                  )}
                  numeric
                  onSort={toggleSort}
                  sort={sort}
                  sortKey="requests"
                >
                  Messages
                </SortableTableHead>
                {tokens ? (
                  <>
                    <SortableTableHead
                      className="w-[16%] whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="tokensIn"
                    >
                      Tokens in
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[16%] whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="tokensOut"
                    >
                      Tokens out
                    </SortableTableHead>
                    {/* Mirrors Activity's Saved column — the member's own
                        savings RATE for the selected window, one decimal. */}
                    <SortableTableHead
                      className="w-[16%] whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="saved"
                    >
                      Saved
                    </SortableTableHead>
                  </>
                ) : null}
                <SortableTableHead
                  className={cn(
                    "whitespace-nowrap",
                    tokens ? "w-[16%]" : "w-[24%]"
                  )}
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
              {loading
                ? skeletonRowIds(rows.length).map((id) => (
                    <UsageSkeletonRow key={id} tokens={tokens} />
                  ))
                : sortedRows.map((row) => (
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
                      {tokens ? (
                        <>
                          <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                            {formatNumber(row.tokensIn ?? 0)}
                          </TableCell>
                          <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                            {formatNumber(row.tokensOut ?? 0)}
                          </TableCell>
                          <SavedCell
                            customRange={customRange}
                            range={range}
                            saved={row.saved}
                          />
                        </>
                      ) : null}
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

/** Loading twin of a `UsageBreakdown` row. The avatar slot is a 16px disc —
 *  a Monogram in the by-user table, a vendor mark in the by-model one, both
 *  shorter than the 20px name line that actually sets the row height. */
function UsageSkeletonRow({ tokens }: { tokens: boolean }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <SkeletonText className="w-32" />
        </div>
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap text-right">
        <SkeletonText className="w-12" />
      </TableCell>
      {tokens ? (
        <>
          <TableCell className="type-mono-14 whitespace-nowrap text-right">
            <SkeletonText className="w-16" />
          </TableCell>
          <TableCell className="type-mono-14 whitespace-nowrap text-right">
            <SkeletonText className="w-16" />
          </TableCell>
          <TableCell className="type-mono-14 whitespace-nowrap text-right">
            <SkeletonText className="w-12" />
          </TableCell>
        </>
      ) : null}
      <TableCell className="type-mono-14 whitespace-nowrap text-right">
        <SkeletonText className="w-16" />
      </TableCell>
    </TableRow>
  );
}

/* ─── Members tab ──────────────────────────────────────────────────────── */

function MembersPane({
  team,
  teams,
  onPatch,
  onMoveMembers,
  onRemoveMember,
  loading,
  archived = false,
  canAssignRoles = true,
  readOnly = false,
}: {
  team: TeamRow;
  teams: TeamRow[];
  onPatch: (next: Partial<TeamRow>) => void;
  onMoveMembers: (ids: string[]) => void;
  onRemoveMember: (memberId: string) => void;
  loading: boolean;
  /** False for the team-manager view: the role reads as text (assigning
   *  managers is owner / admin, PRD §3); add / remove stay live. */
  canAssignRoles?: boolean;
  /** Frozen snapshot of a deleted team: no Add member, no role select, no
   *  remove. The roster is a record, not a roster to manage. */
  archived?: boolean;
  /** Member view (user 2026-09-03): same pure list as `archived`, on a live
   *  team. Managing the roster is manager / admin (PRD §8.4). */
  readOnly?: boolean;
}) {
  const frozen = archived || readOnly;
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
        {frozen ? null : (
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
        )}
      </div>

      <Card density="flush">
        {isEmpty && !loading && (
          <TableEmptyState
            action={
              frozen ? undefined : (
                <Button onClick={() => setAddOpen(true)} size="default">
                  Add member
                </Button>
              )
            }
            body="This team has no members yet."
            title="No members"
          />
        )}
        {noMatches && !loading && (
          <TableEmptyState
            body="No members match your search or filter. Try a different name or email."
            title="No members match"
          />
        )}
        {(visible.length > 0 || loading) && (
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
              {loading
                ? skeletonRowIds(visible.length).map((id) => (
                    <MemberSkeletonRow key={id} showActions={!team.isDefault} />
                  ))
                : visible.map((member) => (
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
                        ) : archived || !canAssignRoles ? (
                          team.managerIds.includes(member.id) ? (
                            "Manager"
                          ) : (
                            "Member"
                          )
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
                        {team.isDefault || frozen ? null : (
                          <IconActionButton
                            aria-label={`Remove ${member.name} from ${team.name}`}
                            onClick={() =>
                              setRemoving({ id: member.id, name: member.name })
                            }
                          >
                            <UserMinus
                              aria-hidden
                              className="size-5"
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

/** Loading twin of a Members row. Cell for cell: a 16px avatar disc, the
 *  32px box of the role `Select` (the tallest thing in the row, so it is
 *  what holds the height), the Joined stamp, and — on every team but Default,
 *  which has no remove affordance — the 24px `IconActionButton` square. */
function MemberSkeletonRow({ showActions }: { showActions: boolean }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="whitespace-nowrap py-0">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <SkeletonText className="w-32" />
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap py-0">
        <Skeleton className="h-8 w-28" />
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap">
        <SkeletonText className="w-20" />
      </TableCell>
      <TableCell className="whitespace-nowrap pr-4 pl-0 text-right">
        {showActions ? (
          <span className="inline-flex size-6 items-center justify-center">
            <Skeleton className="size-5 rounded-xs" />
          </span>
        ) : null}
      </TableCell>
    </TableRow>
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

function KeysPane({ team, loading }: { team: TeamRow; loading: boolean }) {
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
      </div>

      <Card density="flush">
        {isEmpty && !loading && (
          <TableEmptyState
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
        {noMatches && !loading && (
          <TableEmptyState
            body="No keys match your search. Try a different key or member name."
            title="No keys match"
          />
        )}
        {(visible.length > 0 || loading) && (
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? skeletonRowIds(visible.length).map((id) => (
                    <KeySkeletonRow key={id} />
                  ))
                : visible.map((row) => {
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
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

/** Loading twin of a Keys row. The Status cell carries a badge-shaped box
 *  (20px, `rounded-xs`) rather than a text bar, because a `<Badge>` is what
 *  lands there — and the actions square is again what sets the row height. */
function KeySkeletonRow() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="type-mono-14 whitespace-nowrap">
        <SkeletonText className="w-32" />
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap">
        <SkeletonText className="w-24" />
      </TableCell>
      <TableCell className="whitespace-nowrap py-0">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <SkeletonText className="w-32" />
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Skeleton className="h-5 w-16 rounded-xs" />
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap">
        <SkeletonText className="w-20" />
      </TableCell>
    </TableRow>
  );
}

/* ─── Budget tab ───────────────────────────────────────────────────────── */

function BudgetPane({
  team,
  usage,
  onPatch,
  loading,
  archived = false,
  readOnly = false,
}: {
  /** Frozen snapshot: the budget reads as history, no Set / Edit. */
  archived?: boolean;
  /** Team-manager view: "read-only for budgets" (AG-695), no Set / Edit. */
  readOnly?: boolean;
  team: TeamRow;
  /** Same roll-up the Usage tab renders; each configured window reads its
   *  own scaled projection of it (budgetReadings). */
  usage: TeamUsage;
  onPatch: (next: Partial<TeamRow>) => void;
  loading: boolean;
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
            <SectionTitle className="type-heading-24">
              {budget.name || "Team budget"}
            </SectionTitle>
            {archived || readOnly ? null : (
              <Button onClick={() => setOpen(true)} size="sm" variant="outline">
                Edit budget
              </Button>
            )}
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
              budget.enforcement,
              budget.blockThreshold
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
                        blockThreshold={budget.blockThreshold}
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
                    hasManager={team.managerIds.length > 0}
                    loading={loading}
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
            team.memberIds.length > 0 && !(archived || readOnly) ? (
              <Button onClick={() => setOpen(true)} size="default">
                Set budget
              </Button>
            ) : undefined
          }
          body={`Set a budget to cap this team’s spend over a rolling 5-hour, weekly, or calendar-month window. A soft budget alerts; a hard budget blocks messages once it is used up. ${budgetAlertRecipients(team.managerIds.length > 0)}`}
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
        hasManager={team.managerIds.length > 0}
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
