import { BellRing, MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { OptionTile } from "@/components/ui/option-tile";
import { PageTitle } from "@/components/ui/page-title";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RowActionButton } from "@/components/ui/row-action-button";
import { SearchInput } from "@/components/ui/search-input";
import { SectionTitle } from "@/components/ui/section-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { TextLink } from "@/components/ui/text-link";
import { Timestamp } from "@/components/ui/timestamp";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatTimestamp } from "@/lib/formatters";
import { AlertEventDialog } from "@/pages/alerts/AlertEventDialog";
import { AlertRuleWizard } from "@/pages/alerts/AlertRuleWizard";
import {
  ALERT_TEMPLATES,
  CONDITION_CATALOG,
  formatObservedValue,
  formatWindow,
  SEEDED_ALERT_EVENTS,
  SEEDED_ALERT_RULES,
} from "@/pages/alerts/data";
import { ChannelGlyph } from "@/pages/alerts/glyphs";
import type {
  AlertEvent,
  AlertEventStatus,
  AlertRule,
} from "@/pages/alerts/types";
import {
  CONDITION_ORDER,
  channelSummary,
  channelTypesOf,
  DESCRIBED_TILE,
  type FiringRow,
  firingRows,
  firingSortValue,
  newAlertRuleId,
  nextStatuses,
  ruleSortValue,
  SEVERITY_BADGE,
  SEVERITY_LABEL,
  SEVERITY_VALUES,
  STATUS_ACTION_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
  STATUS_VALUES,
} from "@/pages/alerts/view";

/** Same derivation the wizard uses — `data.ts` publishes the array, not a name
 *  for its element type, so both sides read the type off the one source. */
type AlertTemplate = (typeof ALERT_TEMPLATES)[number];

/** Sentinel for the "no filter" option in the Rules / Events filter Selects.
 *  A Base UI `SelectItem` needs a real value, so the absence of a filter has to
 *  be spelled rather than left empty. */
const ALL = "all";

/** Which tab is showing. A union rather than a string so a typo cannot silently
 *  render neither panel. */
type AlertsTab = "rules" | "events";

/* ─── Page ──────────────────────────────────────────────────────────────── */

/** Pro-tier Alerts. Two tabs over one shared model: Rules is the configuration
 *  surface (create / edit / duplicate / enable), Events is the triage queue of
 *  what those rules actually fired. Both live here rather than in sibling route
 *  files because they read the SAME two state arrays — the Events tab resolves
 *  every firing against live rules state, so a rename in the wizard renames its
 *  history, and deleting a rule takes its firings with it. */
export function Alerts() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // Seeded, then locally mutable — the Limits pattern. Create appends, edit
  // replaces in place, duplicate inserts below its original, delete removes.
  const [rules, setRules] = useState<AlertRule[]>(SEEDED_ALERT_RULES);
  const [events, setEvents] = useState<AlertEvent[]>(SEEDED_ALERT_EVENTS);
  const [tab, setTab] = useState<AlertsTab>("rules");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<AlertRule | null>(null);
  const [template, setTemplate] = useState<AlertTemplate | null>(null);
  // Which firing the detail dialog is showing. The id rather than the row, so
  // an Acknowledge/Resolve re-derives the open dialog from fresh state instead
  // of showing a snapshot of the status it had when it opened.
  const [openFiringId, setOpenFiringId] = useState<string | null>(null);
  const [firingOpen, setFiringOpen] = useState(false);
  // Pre-filter applied when the Rules tab cross-links into Events.
  const [eventsQuery, setEventsQuery] = useState("");

  const openCreate = () => {
    setEditing(null);
    setTemplate(null);
    setWizardOpen(true);
  };

  const openTemplate = (next: AlertTemplate) => {
    setEditing(null);
    setTemplate(next);
    setWizardOpen(true);
  };

  const openEdit = (rule: AlertRule) => {
    setTemplate(null);
    setEditing(rule);
    setWizardOpen(true);
  };

  /** One handler for both modes: an id already in the list is an edit, anything
   *  else is a create. The wizard hands back a complete rule either way, so the
   *  page never has to know which button opened it. A create APPENDS — the
   *  seeded order is authored, and a new rule landing at the end leaves it
   *  intact rather than pushing every existing row down a line. */
  const commitRule = (rule: AlertRule) =>
    setRules((previous) =>
      previous.some((row) => row.id === rule.id)
        ? previous.map((row) => (row.id === rule.id ? rule : row))
        : [...previous, rule]
    );

  const toggleEnabled = (id: string, enabled: boolean) =>
    setRules((previous) =>
      previous.map((row) => (row.id === id ? { ...row, enabled } : row))
    );

  const duplicateRule = (id: string) =>
    setRules((previous) => {
      const index = previous.findIndex((row) => row.id === id);
      if (index === -1) {
        return previous;
      }
      const original = previous[index];
      const copy: AlertRule = {
        ...original,
        id: newAlertRuleId(),
        name: `${original.name} copy`,
        channels: original.channels.map((channel) => ({ ...channel })),
        // A copy is a new rule: it inherits the configuration, never the
        // history. Claiming the duplicate had already fired would be fiction.
        createdAt: new Date(),
        lastFiredAt: null,
      };
      return [
        ...previous.slice(0, index + 1),
        copy,
        ...previous.slice(index + 1),
      ];
    });

  /** Deleting a rule deletes its firings too. `types.ts` states the invariant —
   *  an `AlertEvent.ruleId` "always resolves to an `AlertRule.id`" — and a
   *  firing has no severity, condition or window of its own to fall back on, so
   *  an orphan row could only render as a shrug. */
  const removeRule = (id: string) => {
    setRules((previous) => previous.filter((row) => row.id !== id));
    setEvents((previous) => previous.filter((row) => row.ruleId !== id));
  };

  const setFiringStatus = (eventId: string, status: AlertEventStatus) =>
    setEvents((previous) =>
      previous.map((row) => (row.id === eventId ? { ...row, status } : row))
    );

  // One join, one source of truth: the tab count, the table, and the dialog all
  // read the same resolved rows, so they cannot disagree about how many firings
  // are open or which rule produced one.
  const allFirings = useMemo(() => firingRows(events, rules), [events, rules]);
  const openCount = allFirings.filter(
    (row) => row.event.status === "open"
  ).length;
  const openFiring =
    allFirings.find((row) => row.event.id === openFiringId) ?? null;

  /** Rules → Events cross-link. Filters Events to the one rule and switches
   *  tabs, so "when did this last fire?" lands on the answer rather than on an
   *  unfiltered queue the operator then has to search. */
  const viewFirings = (rule: AlertRule) => {
    setEventsQuery(rule.name);
    setTab("events");
  };

  const openFiringDialog = (row: FiringRow) => {
    setOpenFiringId(row.event.id);
    setFiringOpen(true);
  };

  return (
    <DashboardChrome
      activeNavId="alerts"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Content stays fluid, then caps so the cards don't stretch across
          ultrawide displays. Matches the Limits shell. CONTAINER query, not
          viewport: the Ask AI panel narrows this column without narrowing
          the window. `@5xl`
          (1024px inline-size) is the same number as the `max-w-5xl` cap, so
          the class is a no-op until the column is wide enough to bind. */}
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        {/* Header sits OUTSIDE the tabs: the title names the surface and
            "Create alert" is the surface's primary action, neither of which
            belongs to one tab. Same shape as Team. */}
        <PageHeader onCreate={openCreate} />
        <Tabs
          className="gap-4"
          onValueChange={(value) => setTab(value as AlertsTab)}
          value={tab}
        >
          <TabsList className="-mt-2 px-0" variant="line">
            <TabsTrigger value="rules">
              <span>Rules</span>
              <TabsCount>{rules.length}</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="events">
              <span>Events</span>
              {/* The count is OPEN firings, not all of them — a triage queue's
                  useful number is what still needs someone. It is live, so an
                  Acknowledge anywhere on the page decrements it here. */}
              <TabsCount>{openCount}</TabsCount>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            <AlertRulesSection
              onDuplicate={duplicateRule}
              onEdit={openEdit}
              onRemove={removeRule}
              onToggleEnabled={toggleEnabled}
              onUseTemplate={openTemplate}
              onViewFirings={viewFirings}
              rules={rules}
            />
          </TabsContent>
          <TabsContent value="events">
            <AlertEventsSection
              firings={allFirings}
              onOpenFiring={openFiringDialog}
              onQueryChange={setEventsQuery}
              onStatusChange={setFiringStatus}
              query={eventsQuery}
            />
          </TabsContent>
        </Tabs>
      </div>
      <AlertRuleWizard
        onOpenChange={setWizardOpen}
        onSubmit={commitRule}
        open={wizardOpen}
        rule={editing}
        template={template}
      />
      <AlertEventDialog
        onOpenChange={setFiringOpen}
        onStatusChange={setFiringStatus}
        open={firingOpen}
        row={openFiring}
      />
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        <PageTitle>Alerts</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Alert rules watch spend, tokens, errors, latency, and security events,
          then notify you by email, Slack, or webhook the moment a threshold is
          crossed.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onCreate} size="default">
          <Plus
            aria-hidden
            className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none"
            data-icon="inline-start"
          />
          Create alert
        </Button>
      </div>
    </div>
  );
}

/* ─── Rules section ─────────────────────────────────────────────────── */

function AlertRulesSection({
  rules,
  onEdit,
  onDuplicate,
  onRemove,
  onToggleEnabled,
  onUseTemplate,
  onViewFirings,
}: {
  rules: AlertRule[];
  onEdit: (rule: AlertRule) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onUseTemplate: (template: AlertTemplate) => void;
  onViewFirings: (rule: AlertRule) => void;
}) {
  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState<string>(ALL);
  const { sort, toggle: toggleSort } = useTableSort();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rules.filter((row) => {
      if (condition !== ALL && row.condition !== condition) {
        return false;
      }
      return needle === "" || row.name.toLowerCase().includes(needle);
    });
  }, [rules, query, condition]);

  // Sort runs after filter/search; default (key=null) preserves the authored
  // seed order with anything created since appended after it.
  const sorted = useMemo(
    () => sortRows(filtered, sort, ruleSortValue),
    [filtered, sort]
  );

  // Two different emptinesses. No rules AT ALL is a first-run surface and gets
  // the templates; a filter that matched nothing is a recoverable state and
  // keeps the table card so the controls above it still read as attached to
  // something.
  const hasNoRules = rules.length === 0;

  return (
    <div className="mt-2 flex flex-col gap-4">
      {/* Section header on the page background, mirroring Requests / Security.
          Search + condition filter are page-level section controls, so they
          always render — a query that returns zero rows never hides the
          controls that produced it. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle>Alert rules</SectionTitle>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SearchInput
            ariaLabel="Search alert rules"
            className="@2xl:w-60 w-full min-w-0"
            onChange={setQuery}
            placeholder="Search rules…"
            surface="elevated"
            value={query}
          />
          <Select onValueChange={setCondition} value={condition}>
            <SelectTrigger aria-label="Condition" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All conditions</SelectItem>
              {CONDITION_ORDER.map((value) => (
                <SelectItem key={value} value={value}>
                  {CONDITION_CATALOG[value].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasNoRules ? (
        <TemplateEmptyState onUseTemplate={onUseTemplate} />
      ) : (
        <Card density="flush">
          {sorted.length === 0 ? (
            <TableEmptyState
              body="Alert rules you create appear here. Widen the search or clear the condition filter to see the rules you already have."
              icon={
                <div
                  aria-hidden
                  className="flex size-12 items-center justify-center rounded-md bg-muted"
                >
                  <BellRing className="size-5 text-muted-foreground" />
                </div>
              }
              title="No matching rules"
            />
          ) : (
            <RulesTable
              onDuplicate={onDuplicate}
              onEdit={onEdit}
              onRemove={onRemove}
              onSort={toggleSort}
              onToggleEnabled={onToggleEnabled}
              onViewFirings={onViewFirings}
              rules={sorted}
              sort={sort}
            />
          )}
        </Card>
      )}
    </div>
  );
}

/* ─── Table ─────────────────────────────────────────────────────────── */

function RulesTable({
  rules,
  sort,
  onSort,
  onEdit,
  onDuplicate,
  onRemove,
  onToggleEnabled,
  onViewFirings,
}: {
  rules: AlertRule[];
  sort: ReturnType<typeof useTableSort>["sort"];
  onSort: (key: string) => void;
  onEdit: (rule: AlertRule) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onViewFirings: (rule: AlertRule) => void;
}) {
  return (
    // `min-w` is what forces the horizontal scroll container on a narrow
    // viewport instead of letting nine nowrap columns clip. It must stay AT OR
    // BELOW the card's inner width at the `xl` cap (1022px), or the table
    // overflows its own card at the widest layout — exactly the 58px defect
    // this replaces (it was 1080). 1000 matches the Limits table.
    <Table className="min-w-[1000px] table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {/* `table-fixed` + explicit widths keeps the column gaps uniform
              regardless of cell content — the same load-bearing pattern as the
              Limits and Activity tables. */}
          <SortableTableHead
            className="w-[20%] whitespace-nowrap"
            onSort={onSort}
            sort={sort}
            sortKey="name"
          >
            Name
          </SortableTableHead>
          <SortableTableHead
            className="w-[13%] whitespace-nowrap"
            onSort={onSort}
            sort={sort}
            sortKey="condition"
          >
            Condition
          </SortableTableHead>
          <SortableTableHead
            className="w-[10%] whitespace-nowrap"
            numeric
            onSort={onSort}
            sort={sort}
            sortKey="threshold"
          >
            Threshold
          </SortableTableHead>
          <SortableTableHead
            className="w-[11%] whitespace-nowrap"
            onSort={onSort}
            sort={sort}
            sortKey="window"
          >
            Time window
          </SortableTableHead>
          <SortableTableHead
            className="w-[9%] whitespace-nowrap"
            onSort={onSort}
            sort={sort}
            sortKey="severity"
          >
            Severity
          </SortableTableHead>
          <TableHead className="w-[8%] whitespace-nowrap">Channels</TableHead>
          <SortableTableHead
            className="w-[16%] whitespace-nowrap"
            onSort={onSort}
            sort={sort}
            sortKey="lastFired"
          >
            Last fired
          </SortableTableHead>
          <TableHead className="w-[8%] whitespace-nowrap">Enabled</TableHead>
          <TableHead className="w-[5%] pr-4 pl-0 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell className="type-label-14 text-foreground">
              <span className="block truncate" title={rule.name}>
                {rule.name}
              </span>
            </TableCell>
            <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
              {CONDITION_CATALOG[rule.condition].label}
            </TableCell>
            <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
              {formatObservedValue(rule.condition, rule.threshold)}
            </TableCell>
            <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
              {formatWindow(rule.window)}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <Badge variant={SEVERITY_BADGE[rule.severity]}>
                {rule.severity}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <ChannelsCell rule={rule} />
            </TableCell>
            <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
              {/* A rule that has fired has history to show, so its timestamp is
                  the way into it — the quiet underline affordance, not a button,
                  because the cell is still primarily a VALUE (design.md: a link
                  that is prose/data keeps its own voice, and this one inherits
                  the cell's mono data voice rather than a label weight).
                  "Never" has nothing to link to and stays plain text. */}
              {rule.lastFiredAt ? (
                <TextLink onClick={() => onViewFirings(rule)}>
                  <Timestamp date={rule.lastFiredAt} />
                  <span className="sr-only">
                    {`, view firings for ${rule.name}`}
                  </span>
                </TextLink>
              ) : (
                <Timestamp date={rule.lastFiredAt} />
              )}
            </TableCell>
            {/* Enabled sits second-to-last, beside Actions: the switch and the
                row menu are the row's two CONTROLS, so they cluster at the
                trailing edge instead of interrupting the run of data. */}
            <TableCell className="whitespace-nowrap">
              <Switch
                aria-label={`${rule.name} enabled`}
                checked={rule.enabled}
                onCheckedChange={(checked) => onToggleEnabled(rule.id, checked)}
              />
            </TableCell>
            <TableCell className="whitespace-nowrap pr-4 pl-0 text-right">
              <RuleActionsMenu
                onDuplicate={() => onDuplicate(rule.id)}
                onEdit={() => onEdit(rule)}
                onRemove={() => onRemove(rule.id)}
                ruleName={rule.name}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** One glyph per channel TYPE (deduped — three Slack channels are still one
 *  Slack glyph), with the full destination list a click away. The cell answers
 *  "how does this reach me?" at a glance; the popover answers "where exactly?"
 *  without widening the column to hold a webhook URL. */
function ChannelsCell({ rule }: { rule: AlertRule }) {
  const types = channelTypesOf(rule);
  const summary = channelSummary(rule);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label={`${rule.name} channels: ${summary}`}
            className="-ml-3 gap-1 text-muted-foreground hover:text-foreground"
            size="sm"
            variant="ghost"
          />
        }
      >
        {types.map((type) => (
          <ChannelGlyph key={type} type={type} />
        ))}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="flex flex-col gap-2 p-3">
          <p className="type-label-12 m-0 text-muted-foreground">
            Notifies on fire
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {rule.channels.map((channel) => (
              <li
                className="flex items-start gap-2"
                key={`${channel.type}-${channel.target}`}
              >
                {/* h-4 matches the mono-12 line box, so the glyph centres on
                    the target's FIRST line when a webhook URL wraps. */}
                <span className="flex h-4 shrink-0 items-center text-muted-foreground">
                  <ChannelGlyph type={channel.type} />
                </span>
                <span className="type-mono-12 min-w-0 break-all text-foreground">
                  {channel.target}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RuleActionsMenu({
  ruleName,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  ruleName: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            aria-label={`Actions for ${ruleName}`}
            className="text-muted-foreground hover:text-foreground"
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal aria-hidden />
      </MenuTrigger>
      <MenuContent>
        <MenuItem onClick={onEdit}>Edit rule</MenuItem>
        <MenuItem onClick={onDuplicate}>Duplicate rule</MenuItem>
        {/* No confirm step — same call the Limits row menu makes. The rule is
            local state, deletion is one row, and a modal between the operator
            and a reversible action is friction, not safety. */}
        <MenuItem onClick={onRemove} variant="destructive">
          Delete rule
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/* ─── Events section ────────────────────────────────────────────────── */

/** The triage queue. Same section-layout conventions as the Rules tab: title on
 *  the page background with the controls flush right, and the controls always
 *  render so a filter that matches nothing never hides the filter that did it. */
function AlertEventsSection({
  firings,
  query,
  onQueryChange,
  onStatusChange,
  onOpenFiring,
}: {
  firings: FiringRow[];
  query: string;
  onQueryChange: (value: string) => void;
  onStatusChange: (eventId: string, status: AlertEventStatus) => void;
  onOpenFiring: (row: FiringRow) => void;
}) {
  const [status, setStatus] = useState<string>(ALL);
  const [severity, setSeverity] = useState<string>(ALL);
  // Newest first by default. A firing queue read in authored order would group
  // by rule, which is the one ordering an operator never wants: "what just
  // happened" is the question this table exists to answer. The three-state
  // cycle still returns to authored order on a third click.
  const { sort, toggle: toggleSort } = useTableSort({
    key: "fired",
    dir: "desc",
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return firings.filter((row) => {
      if (status !== ALL && row.event.status !== status) {
        return false;
      }
      if (severity !== ALL && row.rule.severity !== severity) {
        return false;
      }
      return needle === "" || row.rule.name.toLowerCase().includes(needle);
    });
  }, [firings, query, status, severity]);

  const sorted = useMemo(
    () => sortRows(filtered, sort, firingSortValue),
    [filtered, sort]
  );

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle>Recent firings</SectionTitle>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SearchInput
            ariaLabel="Search firings by alert"
            className="@2xl:w-60 w-full min-w-0"
            onChange={onQueryChange}
            placeholder="Search alerts…"
            surface="elevated"
            value={query}
          />
          <Select onValueChange={setStatus} value={status}>
            <SelectTrigger aria-label="Status" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUS_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setSeverity} value={severity}>
            <SelectTrigger aria-label="Severity" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All severities</SelectItem>
              {SEVERITY_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {SEVERITY_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card density="flush">
        {sorted.length === 0 ? (
          // One branch for both emptinesses, per the TableEmptyState contract:
          // copy that reads for a workspace whose rules have never fired AND
          // for a filter that matched nothing.
          <TableEmptyState
            body="Every time a rule crosses its threshold it lands here with the value that tripped it. Widen the search or clear the status and severity filters to see the firings you already have."
            icon={
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <BellRing className="size-5 text-muted-foreground" />
              </div>
            }
            title="No firings"
          />
        ) : (
          <EventsTable
            firings={sorted}
            onOpenFiring={onOpenFiring}
            onSort={toggleSort}
            onStatusChange={onStatusChange}
            sort={sort}
          />
        )}
      </Card>
    </div>
  );
}

function EventsTable({
  firings,
  sort,
  onSort,
  onOpenFiring,
  onStatusChange,
}: {
  firings: FiringRow[];
  sort: ReturnType<typeof useTableSort>["sort"];
  onSort: (key: string) => void;
  onOpenFiring: (row: FiringRow) => void;
  onStatusChange: (eventId: string, status: AlertEventStatus) => void;
}) {
  return (
    // Seven columns rather than the Rules table's nine, so the same 1000px
    // floor leaves real slack — nothing here needs to ellipsize at any width
    // the card reaches.
    <Table className="min-w-[1000px] table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableTableHead
            className="w-[24%] whitespace-nowrap"
            onSort={onSort}
            sort={sort}
            sortKey="alert"
          >
            Alert
          </SortableTableHead>
          <SortableTableHead
            className="w-[12%] whitespace-nowrap"
            onSort={onSort}
            sort={sort}
            sortKey="severity"
          >
            Severity
          </SortableTableHead>
          <SortableTableHead
            className="w-[14%] whitespace-nowrap"
            numeric
            onSort={onSort}
            sort={sort}
            sortKey="observed"
          >
            Observed
          </SortableTableHead>
          <SortableTableHead
            className="w-[14%] whitespace-nowrap"
            numeric
            onSort={onSort}
            sort={sort}
            sortKey="threshold"
          >
            Threshold
          </SortableTableHead>
          <SortableTableHead
            className="w-[15%] whitespace-nowrap"
            onSort={onSort}
            sort={sort}
            sortKey="status"
          >
            Status
          </SortableTableHead>
          <SortableTableHead
            className="w-[16%] whitespace-nowrap"
            onSort={onSort}
            sort={sort}
            sortKey="fired"
          >
            Fired
          </SortableTableHead>
          <TableHead className="w-[5%] pr-4 pl-0 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {firings.map((row) => {
          const { event, rule } = row;
          const firedAt = formatTimestamp(event.firedAt);
          return (
            // The <tr> onClick is a mouse-only convenience; the real keyboard
            // target is the RowActionButton in the identifier cell, because
            // <tr role="button"> is invalid ARIA (design.md §7 RowActionButton).
            <TableRow key={event.id} onClick={() => onOpenFiring(row)}>
              <TableCell className="type-label-14 text-foreground">
                <RowActionButton
                  aria-label={`Open firing details for ${rule.name} at ${firedAt}`}
                  className="block w-full truncate"
                  layout="inline"
                  onClick={() => onOpenFiring(row)}
                >
                  {rule.name}
                </RowActionButton>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {/* Severity is the RULE's, status is the EVENT's — two axes, so
                    a critical firing that nobody has picked up carries the
                    danger tone twice. That is the most urgent row in the table
                    and it should look like it. */}
                <Badge variant={SEVERITY_BADGE[rule.severity]}>
                  {rule.severity}
                </Badge>
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                {formatObservedValue(rule.condition, event.observed)}
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-right text-muted-foreground">
                {formatObservedValue(rule.condition, event.thresholdAtFiring)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant={STATUS_BADGE[event.status]}>
                  {event.status}
                </Badge>
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                <Timestamp date={event.firedAt} />
              </TableCell>
              <TableCell className="whitespace-nowrap pr-4 pl-0 text-right">
                {/* Both handlers stop propagation so opening the menu does not
                    also drill into the row — the Models table's precedent, and
                    mousedown matters because Base UI menus open on pointerdown. */}
                <span
                  className="inline-flex align-middle"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <FiringActionsMenu
                    onStatusChange={onStatusChange}
                    row={row}
                  />
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Lifecycle actions for one firing. A RESOLVED firing renders no menu at all
 *  rather than a menu of disabled items — the house convention for a terminal
 *  row state, set by `ApiKeys` (a revoked key shows no revoke affordance). A
 *  disabled control that can never become enabled is a dead end the operator
 *  has to click to discover. */
function FiringActionsMenu({
  row,
  onStatusChange,
}: {
  row: FiringRow;
  onStatusChange: (eventId: string, status: AlertEventStatus) => void;
}) {
  const options = nextStatuses(row.event.status);
  if (options.length === 0) {
    return null;
  }
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            aria-label={`Actions for ${row.rule.name} firing ${row.event.id}`}
            className="text-muted-foreground hover:text-foreground"
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal aria-hidden />
      </MenuTrigger>
      <MenuContent>
        {options.map((next) => (
          <MenuItem
            key={next}
            onClick={() => onStatusChange(row.event.id, next)}
          >
            {STATUS_ACTION_LABEL[next]}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────── */

/** First-run surface: the heading composition plus the four starter templates.
 *  Every template threshold carries headroom over what the workspace currently
 *  reads (`data.ts`), so a rule created from one does not fire the instant it is
 *  saved — the first thing a new alerting setup does should not be a false
 *  positive. */
function TemplateEmptyState({
  onUseTemplate,
}: {
  onUseTemplate: (template: AlertTemplate) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <EmptyState
      action={
        <div className="flex max-w-2xl flex-col gap-4 text-left">
          <p className="type-label-14 m-0 text-muted-foreground">
            Start from a template
          </p>
          {/* Container query, not viewport: this empty state sits directly in
              the chrome's `<main>` (`@container`), so `@xl` (576px inline-size,
              the column width at the old `sm` viewport) reads the column the
              tiles actually occupy. `sm:` went 2-up whenever the window was
              ≥640px, which paired the tiles at a 372px column width with the
              Ask AI panel open. */}
          <div
            aria-label="Alert rule templates"
            className="grid @xl:grid-cols-2 gap-4"
            role="radiogroup"
          >
            {ALERT_TEMPLATES.map((item) => (
              <OptionTile
                className={DESCRIBED_TILE}
                key={item.id}
                onClick={() => {
                  setPicked(item.id);
                  onUseTemplate(item);
                }}
                selected={picked === item.id}
              >
                <span className="type-label-14 text-foreground">
                  {item.name}
                </span>
                <span className="type-copy-14 text-pretty text-muted-foreground">
                  {item.description}
                </span>
              </OptionTile>
            ))}
          </div>
        </div>
      }
      body="A rule pairs one metric and threshold with a notification channel, so a spend spike or a blocked injection reaches you without anyone watching the dashboard."
      icon={
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full bg-muted"
        >
          <BellRing className="size-5 text-muted-foreground" />
        </div>
      }
      title="No alert rules yet"
    />
  );
}
