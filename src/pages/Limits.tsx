import { MoreHorizontal, Plus, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { PageTitle } from "@/components/ui/page-title";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { API_KEY_SEED_ROWS } from "@/data/api-keys";
import { parseNumeric, sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { currentUserId, useViewRole } from "@/pages/teams/teams-store";

/** Comparable value per sortable column for the Limits table.
 *  Numeric columns (threshold/used) parse out $/commas; period maps to a
 *  chronological ordinal so "1 hour" sorts before "1 month". */
function limitSortValue(row: Limit, key: string): string | number | null {
  switch (key) {
    case "name":
      return row.name;
    case "scope":
      return scopeName(row.scope);
    case "type":
      return typeLabel(row.type);
    case "enforcement":
      return enforcementLabel(row.enforcement);
    case "threshold":
      return parseNumeric(row.threshold);
    case "used":
      return parseNumeric(row.used);
    case "period":
      return PERIOD_ORDER[row.period] ?? Number.MAX_SAFE_INTEGER;
    default:
      return null;
  }
}

// Chronological ordinal for the period column so the sort follows real
// duration order (1h < 1d < 1w < 1mo) rather than the label's alphabetical
// order. Keys mirror LIMIT_PERIODS values.
const PERIOD_ORDER: Record<string, number> = {
  "1h": 0,
  "1d": 1,
  "1w": 2,
  "1mo": 3,
};

export function Limits() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    () => searchParams.get("create") === "1"
  );
  const [limits, setLimits] = useState<Limit[]>([]);
  // Role scope (AG-695 AC 3, user 2026-09-03): caps run "at the org,
  // project, or key level". Admin: Org-wide plus the seeded keys. Manager /
  // Member: only the keys THEY own; org-wide rows read as locked (no
  // actions), the AG-624 "read-only, with who set it" treatment.
  const isAdmin = useViewRole() === "admin";
  const scopes = useMemo<readonly LimitScope[]>(
    () =>
      isAdmin
        ? LIMIT_SCOPES
        : API_KEY_SEED_ROWS.filter(
            (k) => k.ownerId === currentUserId() && !k.revoked
          ).map((k) => ({ value: k.id, name: k.name, masked: k.masked })),
    [isAdmin]
  );
  const openCreate = () => setCreateOpen(true);
  const addLimit = (limit: Limit) => setLimits((prev) => [limit, ...prev]);
  const removeLimit = (id: string) =>
    setLimits((prev) => prev.filter((l) => l.id !== id));

  // Deep-link support: `?create=1` opens the Create Limit dialog on mount.
  // Used by Overview's "Set a spend limit" quick action so a single click
  // lands the user in the form. Param is stripped when the dialog closes
  // so the URL reflects state and re-mounts don't re-open the dialog.
  const handleCreateOpenChange = (next: boolean) => {
    setCreateOpen(next);
    if (!next && searchParams.has("create")) {
      const params = new URLSearchParams(searchParams);
      params.delete("create");
      setSearchParams(params, { replace: true });
    }
  };

  return (
    <DashboardChrome
      activeNavId="limits"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Content stays fluid, then caps so the cards don't stretch across
          ultrawide displays. CONTAINER query, not viewport: the Ask AI
          panel narrows this column without narrowing the window. `@5xl`
          (1024px inline-size) is the same number as the `max-w-5xl` cap, so
          the class is a no-op until the column is wide enough to bind. */}
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <PageHeader onCreate={openCreate} />
        <LimitsSection
          canEditOrg={isAdmin}
          limits={limits}
          onRemove={removeLimit}
        />
      </div>
      <CreateLimitDialog
        onCreate={addLimit}
        onOpenChange={handleCreateOpenChange}
        open={createOpen}
        scopes={scopes}
      />
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        <PageTitle>Limits & quotas</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Enforce spend, token, and request rate caps at the org, project, or
          key level. Limits run inline with no separate billing system to wire
          up.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onCreate} size="default">
          <Plus
            aria-hidden
            className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none"
            data-icon="inline-start"
          />
          Create limit
        </Button>
      </div>
    </div>
  );
}

/* ─── Limits table / empty state ────────────────────────────────────── */

function LimitsSection({
  limits,
  onRemove,
  canEditOrg,
}: {
  limits: Limit[];
  onRemove: (id: string) => void;
  /** False for Manager / Member: org-wide rows are read-only (no actions). */
  canEditOrg: boolean;
}) {
  // Snapshot `now` once per limits change. Without this, calling
  // `resetsAt(new Date(), ...)` per row in the JSX recomputes on every
  // re-render and the resets-on column flickers as time advances during
  // hover / focus / open-dialog interactions.
  const resetsAtMap = useMemo(() => {
    const now = new Date();
    return new Map(limits.map((l) => [l.id, resetsAt(now, l.period)]));
  }, [limits]);

  // Sort runs after the data is in hand; default (key=null) preserves the
  // authored newest-first insertion order.
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedLimits = useMemo(
    () => sortRows(limits, sort, limitSortValue),
    [limits, sort]
  );

  if (limits.length === 0) {
    return (
      <EmptyState
        body="Create one to cap spend and block overages, or set it to notify only and get warned as usage approaches the threshold."
        icon={
          <div
            aria-hidden
            className="flex size-12 items-center justify-center rounded-full bg-muted"
          >
            <Shield className="size-5 text-muted-foreground" />
          </div>
        }
        title="No limits or alerts yet"
      />
    );
  }

  return (
    <Card density="flush">
      <Table className="min-w-[1400px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* `table-fixed` + an explicit width on EVERY column — same
                  load-bearing pattern as the Team and Activity tables.
                  Widths sum to 100%: Name largest at 15% (the row's identifier),
                  Actions smallest at 5% (a lone icon button), and
                  the data columns tuned per user direction
                  2026-08-27: Scope 12.5 / Enforcement 7.5 (a
                  quarter of Enforcement moved to Scope), Resets on
                  12.5 / Period 7.5 (same move), Used 12 / Type 8 (a
                  $1,000,000 threshold renders "$0 / $1,000,000",
                  ~158px, which overflowed a 140px column and bled
                  into Threshold - table-fixed + nowrap paints
                  oversized content outside its cell), Threshold and
                  Alerts at 10. Against the 1400px floor that is
                  Name 210 / Scope 175 / Type 112 / Enforcement 105
                  / Threshold 140 / Used 168 / Alerts 140 / Period
                  105 / Resets 175 / Actions 70 px. The floor rose
                  1000 -> 1400px when Enforcement and Alerts landed,
                  so the table always scrolls horizontally inside
                  the max-w-5xl column; ten columns cannot avoid
                  that, and squeezing the row identifier to dodge it
                  was the worse trade. */}
            <SortableTableHead
              className="w-[15%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="name"
            >
              Name
            </SortableTableHead>
            <SortableTableHead
              className="w-[12.5%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="scope"
            >
              Scope
            </SortableTableHead>
            <SortableTableHead
              className="w-[8%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="type"
            >
              Type
            </SortableTableHead>
            {/* The consequential axis: does crossing the threshold reject
                  traffic, or only send a notification. Sortable because
                  "show me every rule that actually blocks" is the question
                  an operator asks first. */}
            <SortableTableHead
              className="w-[7.5%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="enforcement"
            >
              Enforcement
            </SortableTableHead>
            <SortableTableHead
              className="w-[10%] whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="threshold"
            >
              Threshold
            </SortableTableHead>
            <SortableTableHead
              className="w-[12%] whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="used"
            >
              Used
            </SortableTableHead>
            {/* Not sortable: a SET of percent marks has no honest
                  ordering, the same reason "Resets on" stays plain. */}
            <TableHead className="w-[10%] whitespace-nowrap">Alerts</TableHead>
            <SortableTableHead
              className="w-[7.5%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="period"
            >
              Period
            </SortableTableHead>
            <TableHead className="w-[12.5%] whitespace-nowrap">
              Resets on
            </TableHead>
            <TableHead className="w-[5%] pr-4 pl-0 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLimits.map((limit) => {
            const scope = findScope(limit.scope);
            const scopeNameText = scope?.name ?? limit.scope;
            return (
              <TableRow key={limit.id}>
                <TableCell className="type-label-14 text-foreground">
                  <span className="block truncate" title={limit.name}>
                    {limit.name}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 flex-col">
                    <span
                      className="type-copy-14 truncate text-foreground"
                      title={scopeNameText}
                    >
                      {scopeNameText}
                    </span>
                    {scope?.masked ? (
                      <span className="type-mono-12 truncate text-muted-foreground">
                        {scope.masked}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                  {typeLabel(limit.type)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {/* Filled chip vs. hollow chip. Enforcement is not a
                        health axis, so it spends no status colour —
                        blocking simply reads heavier than observing at
                        scan distance. */}
                  <Badge
                    variant={
                      limit.enforcement === "block" ? "secondary" : "outline"
                    }
                  >
                    {enforcementLabel(limit.enforcement)}
                  </Badge>
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                  {thresholdLabel(limit.type, limit.threshold)}
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                  {usedLabel(limit.type, limit.used, limit.threshold)}
                </TableCell>
                <TableCell
                  className={cn(
                    "type-mono-14 whitespace-nowrap",
                    limit.alerts.length > 0
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {alertsLabel(limit.alerts)}
                </TableCell>
                <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                  {periodLabel(limit.period)}
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-muted-foreground">
                  {resetsAtMap.get(limit.id) ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap pr-4 pl-0 text-right">
                  {limit.scope === "org" && !canEditOrg ? (
                    <span className="type-copy-14 text-muted-foreground">
                      Set by an org admin
                    </span>
                  ) : (
                    <LimitActionsMenu
                      limitName={limit.name}
                      onRemove={() => onRemove(limit.id)}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function LimitActionsMenu({
  limitName,
  onRemove,
}: {
  limitName: string;
  onRemove: () => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            aria-label={`Actions for ${limitName}`}
            className="-mr-2 text-muted-foreground hover:text-foreground"
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal aria-hidden />
      </MenuTrigger>
      <MenuContent>
        <MenuItem onClick={onRemove} variant="destructive">
          Remove limit
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/* ─── Create limit dialog ───────────────────────────────────────────── */

const LIMIT_TYPES = [
  { value: "spend", label: "Spend ($)" },
  { value: "tokens", label: "Tokens" },
  { value: "requests", label: "Messages" },
] as const;

/* Alerts NOTIFY, limits BLOCK — the one distinction this page has to keep
 * legible. A rule carries both axes: `enforcement` decides whether crossing
 * the threshold rejects traffic (429) or only raises a notification, and
 * `alerts` lists the percent-of-threshold marks that notify on the way up.
 *
 * There is no second "standalone alerts" section, because a notify-only
 * rule IS the PRD's standalone threshold ("cost over $X per hour" = spend /
 * X / 1 hour / notify only). One create flow, one table, one mental model —
 * a second section would have duplicated the whole form and the whole table
 * for a row that differs by a single field. */
const LIMIT_ENFORCEMENTS = [
  { value: "block", label: "Block" },
  { value: "notify", label: "Notify only" },
] as const;

// A small fixed set, not a free-text percent field — exactly the PRD's
// example marks. Coarse marks read as choices, where a typed number would
// read as a value someone tuned. (An extra 50% mark shipped briefly and was
// trimmed to the PRD set on user direction, 2026-08-25.)
const ALERT_PERCENTS = [80, 100] as const;
const DEFAULT_ALERT_PERCENTS: number[] = [80, 100];

const LIMIT_PERIODS = [
  { value: "1h", label: "1 hour" },
  { value: "1d", label: "1 day" },
  { value: "1w", label: "1 week" },
  { value: "1mo", label: "1 month" },
] as const;

// Scope options — "Org-wide" plus the workspace's *active* API keys.
// Key identities mirror the seed list in ApiKeys.tsx (the canonical key
// source); keep in sync if that seed changes. Revoked keys (e.g.
// test-key) are intentionally excluded — a limit on a revoked key is
// meaningless.
type LimitScope = { value: string; name: string; masked: string | null };
const LIMIT_SCOPES: readonly LimitScope[] = [
  { value: "org", name: "Org-wide (all keys)", masked: null },
  { value: "sk-gw-c4aeb3a8", name: "prod-web", masked: "sk-gw-…c4ae" },
  { value: "sk-gw-9f3064ce", name: "prod-agent", masked: "sk-gw-…9f30" },
];

type Limit = {
  id: string;
  name: string;
  type: string;
  threshold: string;
  period: string;
  scope: string;
  used: string;
  /** "block" | "notify" — see LIMIT_ENFORCEMENTS. */
  enforcement: string;
  /** Percent-of-threshold marks that raise a notification, ascending. */
  alerts: number[];
};

const LIMIT_TYPE_BY_VALUE = new Map<string, (typeof LIMIT_TYPES)[number]>(
  LIMIT_TYPES.map((t) => [t.value, t])
);
const LIMIT_PERIOD_BY_VALUE = new Map<string, (typeof LIMIT_PERIODS)[number]>(
  LIMIT_PERIODS.map((p) => [p.value, p])
);
// Lookup covers the admin list AND every seeded key, so a Manager / Member
// row (scoped to their own key) resolves its name and masked id.
const LIMIT_SCOPE_BY_VALUE = new Map<string, LimitScope>([
  ...API_KEY_SEED_ROWS.map((k): [string, LimitScope] => [
    k.id,
    { value: k.id, name: k.name, masked: k.masked },
  ]),
  ...LIMIT_SCOPES.map((s): [string, LimitScope] => [s.value, s]),
]);
const LIMIT_ENFORCEMENT_BY_VALUE = new Map<
  string,
  (typeof LIMIT_ENFORCEMENTS)[number]
>(LIMIT_ENFORCEMENTS.map((e) => [e.value, e]));

const typeLabel = (v: string) => LIMIT_TYPE_BY_VALUE.get(v)?.label ?? v;
const periodLabel = (v: string) => LIMIT_PERIOD_BY_VALUE.get(v)?.label ?? v;
const findScope = (v: string) => LIMIT_SCOPE_BY_VALUE.get(v);
const enforcementLabel = (v: string) =>
  LIMIT_ENFORCEMENT_BY_VALUE.get(v)?.label ?? v;
const alertsLabel = (alerts: readonly number[]) =>
  alerts.length > 0 ? alerts.map((pct) => `${pct}%`).join(" · ") : "—";
const scopeName = (v: string) => findScope(v)?.name ?? v;
const thresholdLabel = (type: string, threshold: string) => {
  const n = Number(threshold);
  const formatted = Number.isFinite(n) ? formatNumber(n) : threshold;
  return type === "spend" ? `$${formatted}` : formatted;
};
const usedLabel = (type: string, used: string, threshold: string) => {
  const uNum = Number(used);
  const tNum = Number(threshold);
  const u = Number.isFinite(uNum) ? formatNumber(uNum) : "0";
  const t = Number.isFinite(tNum) ? formatNumber(tNum) : "0";
  const prefix = type === "spend" ? "$" : "";
  return `${prefix}${u} / ${prefix}${t}`;
};
// Boundaries are computed in UTC (below), but the cell shows no "UTC"
// label and carries seconds, matching the house timestamp voice
// ("Jun 6, 00:10:49") used by every other datetime cell (user direction
// 2026-08-27).
const fmtResetDate = (d: Date) =>
  formatDateTime(d, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
/** Computes the next reset boundary for a limit period. Takes `now` as a
 *  parameter so callers can share a single timestamp across rows — calling
 *  `new Date()` at render time per row caused the column to flicker on
 *  every re-render. See `resetsAtMap` in LimitsSection for the memoized
 *  call pattern. */
const resetsAt = (now: Date, period: string) => {
  switch (period) {
    case "1h": {
      const next = new Date(now);
      next.setUTCMinutes(0, 0, 0);
      next.setUTCHours(next.getUTCHours() + 1);
      return fmtResetDate(next);
    }
    case "1d": {
      const next = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
      );
      return fmtResetDate(next);
    }
    case "1w": {
      const daysUntilMon = (8 - now.getUTCDay()) % 7 || 7;
      const next = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + daysUntilMon
        )
      );
      return fmtResetDate(next);
    }
    case "1mo": {
      const next = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
      );
      return fmtResetDate(next);
    }
    default:
      return "—";
  }
};

// Strip everything except digits and at most one decimal point. Lets users
// paste "$5,000,000" or "1.5M" and recover a clean numeric string.
const normalizeThresholdInput = (raw: string): string => {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) {
    return cleaned;
  }
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, "")
  );
};

// Show the integer part with locale-aware thousands separators while the
// user types. Preserves a trailing "." or "5." mid-entry so the field
// doesn't fight the keyboard. Decimal digits pass through unformatted —
// only the integer part gets the grouping treatment.
const formatThresholdDisplay = (raw: string): string => {
  if (raw === "") {
    return "";
  }
  const [intPart, decPart] = raw.split(".");
  const intNum = Number(intPart);
  const intFormatted =
    Number.isFinite(intNum) && intPart !== ""
      ? formatNumber(intNum)
      : (intPart ?? "");
  if (raw.includes(".")) {
    return `${intFormatted}.${decPart ?? ""}`;
  }
  return intFormatted;
};

function CreateLimitDialog({
  open,
  onOpenChange,
  onCreate,
  scopes,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreate: (limit: Limit) => void;
  /** Scope options for the signed-in role; the first is the default. */
  scopes: readonly LimitScope[];
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("spend");
  const [threshold, setThreshold] = useState("");
  const [period, setPeriod] = useState("1d");
  const [scope, setScope] = useState(scopes[0]?.value ?? "org");
  // The dialog stays mounted across a role switch, so a value picked (or
  // defaulted) under one role can fall outside the next role's options.
  // Snap to the first valid option instead of showing a scope the role
  // cannot set.
  const scopeValue = scopes.some((s) => s.value === scope)
    ? scope
    : (scopes[0]?.value ?? "org");
  const [enforcement, setEnforcement] = useState("block");
  const [pickedAlerts, setPickedAlerts] = useState<number[]>(
    DEFAULT_ALERT_PERCENTS
  );
  /* The PRD's alert triggers are spend, tokens, and security only — a
     notify-only Messages limit would be a request-rate alert, a trigger the
     PRD does not offer. So a Messages limit always blocks and carries no
     percent marks: the Enforcement and Alerts blocks unmount below and the
     submit path forces the same, while the picks stay in state so switching
     Type back restores them. */
  const isRequests = type === "requests";
  const notifyOnly = !isRequests && enforcement === "notify";

  // Derived, not stored. Switching to notify-only forces the 100% mark on
  // without discarding what was picked for a blocking limit, so switching
  // back restores that choice instead of silently rewriting it. Filtering
  // ALERT_PERCENTS (rather than sorting the picks) also keeps the stored
  // list ascending for free, which is what the Alerts column renders.
  const alertPercents = useMemo(() => {
    if (isRequests) {
      return [];
    }
    const chosen = new Set(pickedAlerts);
    if (notifyOnly) {
      chosen.add(100);
    }
    return ALERT_PERCENTS.filter((pct) => chosen.has(pct));
  }, [pickedAlerts, notifyOnly, isRequests]);

  const toggleAlert = (pct: number, on: boolean) =>
    setPickedAlerts((prev) =>
      on ? [...prev, pct] : prev.filter((entry) => entry !== pct)
    );

  const thresholdNum = Number(threshold);
  const canSubmit =
    name.trim().length > 0 &&
    threshold.length > 0 &&
    Number.isFinite(thresholdNum) &&
    thresholdNum > 0;

  /* Extracted so BOTH close paths clear the form. Base UI only fires the
     Dialog's own `onOpenChange` for user-driven dismissals (Escape, overlay,
     Cancel) — submitting closes by flipping the controlled `open` prop, which
     never reaches that handler, so the fields used to survive into the next
     open. Latent since the dialog was written; visible now that a stale
     "Notify only" would reopen with its 100% mark held on. */
  const resetForm = () => {
    setName("");
    setType("spend");
    setThreshold("");
    setPeriod("1d");
    setScope(scopes[0]?.value ?? "org");
    setEnforcement("block");
    setPickedAlerts(DEFAULT_ALERT_PERCENTS);
  };

  const handleSubmit = () => {
    onCreate({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      threshold,
      period,
      scope: scopeValue,
      used: "0",
      enforcement: isRequests ? "block" : enforcement,
      alerts: [...alertPercents],
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          resetForm();
        }
      }}
      open={open}
    >
      <DialogContent className="w-full gap-4 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="type-heading-20 text-foreground">
            Create limit
          </DialogTitle>
          <DialogDescription>
            Set a threshold for a scope and period, then choose whether it
            blocks traffic or only notifies you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label
            className="type-label-14 text-muted-foreground"
            htmlFor="create-limit-name"
          >
            Name
          </Label>
          <Input
            id="create-limit-name"
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. eu-payments daily spend"
            value={name}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label
              className="type-label-14 text-muted-foreground"
              htmlFor="create-limit-type"
            >
              Type
            </Label>
            <Select onValueChange={setType} value={type}>
              <SelectTrigger className="w-full" id="create-limit-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label
              className="type-label-14 text-muted-foreground"
              htmlFor="create-limit-threshold"
            >
              Threshold
            </Label>
            <Input
              className="type-mono-14"
              id="create-limit-threshold"
              inputMode="decimal"
              onChange={(e) =>
                setThreshold(normalizeThresholdInput(e.target.value))
              }
              placeholder="e.g. 250"
              type="text"
              value={formatThresholdDisplay(threshold)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label
              className="type-label-14 text-muted-foreground"
              htmlFor="create-limit-period"
            >
              Period
            </Label>
            <Select onValueChange={setPeriod} value={period}>
              <SelectTrigger className="w-full" id="create-limit-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label
              className="type-label-14 text-muted-foreground"
              htmlFor="create-limit-scope"
            >
              Scope
            </Label>
            <Select onValueChange={setScope} value={scopeValue}>
              <SelectTrigger className="w-full" id="create-limit-scope">
                {/* Function-child keeps the trigger single-line — the
                    two-line key body is for the popup only. */}
                <SelectValue>
                  {(value) => scopeName(value as string)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {scopes.map((s) => (
                  <SelectItem
                    className={s.masked ? "h-auto items-start py-2" : undefined}
                    key={s.value}
                    value={s.value}
                  >
                    {s.masked ? (
                      <span className="flex flex-col">
                        <span className="type-label-14 text-foreground">
                          {s.name}
                        </span>
                        <span className="type-mono-12 text-muted-foreground">
                          {s.masked}
                        </span>
                      </span>
                    ) : (
                      s.name
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* `gap-3` puts 12px under the subtext (4px more than the 8px
            field rhythm, per direction — the subtext and options sat too
            close). Block-to-block spacing stays the DialogContent's own
            gap-4. */}
        {isRequests ? null : (
          <div className="flex flex-col gap-3">
            {/* Title, subtext, then the options. The consequence of the
              choice is stated before the choice is offered, and it sits
              in this block rather than in the dialog subtitle four fields
              away — this IS the alerts-notify / limits-block distinction,
              so it is read where it is made. */}
            <div className="flex flex-col gap-1">
              <span
                className="type-label-14 text-muted-foreground"
                id="create-limit-enforcement-label"
              >
                Enforcement
              </span>
              <p
                className="type-copy-12 m-0 text-pretty text-muted-foreground"
                id="create-limit-enforcement-hint"
              >
                {notifyOnly
                  ? "Nothing is blocked. Crossing the threshold only raises a notification."
                  : "Messages that exceed the threshold are blocked (returns 429)."}
              </p>
            </div>
            <RadioGroup
              aria-describedby="create-limit-enforcement-hint"
              aria-labelledby="create-limit-enforcement-label"
              className="grid-cols-2"
              onValueChange={(next: string) => setEnforcement(next)}
              value={enforcement}
            >
              {LIMIT_ENFORCEMENTS.map((option) => (
                <div className="flex items-center gap-3" key={option.value}>
                  <RadioGroupItem
                    id={`create-limit-enforcement-${option.value}`}
                    value={option.value}
                  />
                  <Label
                    className="type-label-14 text-foreground"
                    htmlFor={`create-limit-enforcement-${option.value}`}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Same rhythm as the Enforcement block above; no extra margin, so
            DialogFooter keeps its standing 24px stand-off. */}
        {isRequests ? null : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span
                className="type-label-14 text-muted-foreground"
                id="create-limit-alerts-label"
              >
                Alerts
              </span>
              <p
                className="type-copy-12 m-0 text-pretty text-muted-foreground"
                id="create-limit-alerts-hint"
              >
                {notifyOnly
                  ? "Notify at these percentages of the threshold. A notify-only rule always alerts at 100%."
                  : "Notify at these percentages of the threshold, ahead of the block."}
              </p>
            </div>
            <div
              aria-describedby="create-limit-alerts-hint"
              aria-labelledby="create-limit-alerts-label"
              className="flex flex-wrap items-center gap-4"
              role="group"
            >
              {ALERT_PERCENTS.map((pct) => (
                <div className="flex items-center gap-2" key={pct}>
                  <Checkbox
                    checked={alertPercents.includes(pct)}
                    /* A notify-only rule that alerts at nothing is not a
                     rule — the 100% crossing IS the rule, so it is held
                     on rather than left as a way to create a no-op. */
                    disabled={notifyOnly && pct === 100}
                    id={`create-limit-alert-${pct}`}
                    onCheckedChange={(next) => toggleAlert(pct, next === true)}
                  />
                  <Label
                    className="type-label-14 text-foreground"
                    htmlFor={`create-limit-alert-${pct}`}
                  >
                    {pct}%
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose
            render={<Button size="default" type="button" variant="outline" />}
          >
            Cancel
          </DialogClose>
          <Button
            disabled={!canSubmit}
            onClick={handleSubmit}
            size="default"
            type="button"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
