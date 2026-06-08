import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { MoreHorizontal, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from '@/components/ui/menu';
import { PageTitle } from '@/components/ui/page-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  SortableTableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { formatNumber, formatDateTime } from '@/lib/formatters';
import { useTableSort, sortRows, parseNumeric } from '@/hooks/use-table-sort';
import { ProUpgradeCard } from '@/pages/pro-upgrade-card';

/** Comparable value per sortable column for the Limits table.
 *  Numeric columns (threshold/used) parse out $/commas; period maps to a
 *  chronological ordinal so "1 hour" sorts before "1 month". */
function limitSortValue(row: Limit, key: string): string | number | null {
  switch (key) {
    case 'name': return row.name;
    case 'scope': return scopeName(row.scope);
    case 'type': return typeLabel(row.type);
    case 'threshold': return parseNumeric(row.threshold);
    case 'used': return parseNumeric(row.used);
    case 'period': return PERIOD_ORDER[row.period] ?? Number.MAX_SAFE_INTEGER;
    default: return null;
  }
}

// Chronological ordinal for the period column so the sort follows real
// duration order (1h < 1d < 1w < 1mo) rather than the label's alphabetical
// order. Keys mirror LIMIT_PERIODS values.
const PERIOD_ORDER: Record<string, number> = { '1h': 0, '1d': 1, '1w': 2, '1mo': 3 };

export function LimitsFree() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(() => searchParams.get('create') === '1');
  const [limits, setLimits] = useState<Limit[]>([]);
  const addLimit = (limit: Limit) => setLimits((prev) => [limit, ...prev]);
  const removeLimit = (id: string) =>
    setLimits((prev) => prev.filter((l) => l.id !== id));

  // Deep-link support: `?create=1` opens the Create Limit dialog on mount.
  // Used by Overview's "Set a spend limit" quick action so a single click
  // lands the user in the form. Param is stripped when the dialog closes
  // so the URL reflects state and re-mounts don't re-open the dialog.
  const handleCreateOpenChange = (next: boolean) => {
    setCreateOpen(next);
    if (!next && searchParams.has('create')) {
      const params = new URLSearchParams(searchParams);
      params.delete('create');
      setSearchParams(params, { replace: true });
    }
  };

  return (
    <DashboardChrome
      activeNavId="limits"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader />
      <LimitsSection
        limits={limits}
        onRemove={removeLimit}
			/>
      <CreateLimitDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        onCreate={addLimit}
      />
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Limits & quotas</PageTitle>
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          Enforce spend, token, and request rate caps at the org, project, or key level. Limits run inline with no separate billing system to wire up.
        </p>
      </div>
    </div>
  );
}

/* ─── Limits table / empty state ────────────────────────────────────── */

function LimitsSection({
  limits,
  onRemove,
}: {
  limits: Limit[];
  onRemove: (id: string) => void;
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
    [limits, sort],
  );

  if (limits.length === 0) {
    return (
      <ProUpgradeCard icon={ShieldCheck} body="Limits & quotas are a Pro feature. Upgrade in Billing to catch a runaway agent in the act, not at month-end." />
    );
  }

  return (
    <Card density="flush">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* `table-fixed` + explicit widths keeps the column gaps
                uniform regardless of cell content — same load-bearing
                pattern as the Team and Activity tables. Five equal data
                columns + a narrow actions column. */}
            <SortableTableHead sortKey="name" sort={sort} onSort={toggleSort} className="w-[16%] whitespace-nowrap">Name</SortableTableHead>
            <SortableTableHead sortKey="scope" sort={sort} onSort={toggleSort} className="w-[16%] whitespace-nowrap">Scope</SortableTableHead>
            <SortableTableHead sortKey="type" sort={sort} onSort={toggleSort} className="w-[12%] whitespace-nowrap">Type</SortableTableHead>
            <SortableTableHead sortKey="threshold" sort={sort} onSort={toggleSort} numeric className="whitespace-nowrap">Threshold</SortableTableHead>
            <SortableTableHead sortKey="used" sort={sort} onSort={toggleSort} numeric className="w-[16%] whitespace-nowrap">Used</SortableTableHead>
            <SortableTableHead sortKey="period" sort={sort} onSort={toggleSort} className="w-[10%] whitespace-nowrap">Period</SortableTableHead>
            <TableHead className="w-[16%] whitespace-nowrap">Resets on</TableHead>
            <TableHead className="w-[5%] text-right pl-0 pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLimits.map((limit) => {
            const scope = findScope(limit.scope);
            const scopeNameText = scope?.name ?? limit.scope;
            return (
            <TableRow key={limit.id}>
              <TableCell className="font-sans text-sm font-medium text-neutral-900">
                <span className="block truncate" title={limit.name}>
                  {limit.name}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col min-w-0">
                  <span
                    className="font-sans text-sm text-neutral-900 truncate"
                    title={scopeNameText}
                  >
                    {scopeNameText}
                  </span>
                  {scope?.masked ? (
                    <span className="font-mono text-xs text-neutral-500 truncate">
                      {scope.masked}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap font-sans text-sm text-neutral-800">
                {typeLabel(limit.type)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                {thresholdLabel(limit.type, limit.threshold)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                {usedLabel(limit.type, limit.used, limit.threshold)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-sans text-sm text-neutral-800">
                {periodLabel(limit.period)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-sans text-sm text-neutral-500">
                {resetsAtMap.get(limit.id) ?? '—'}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap pl-0 pr-4">
                <LimitActionsMenu limitName={limit.name} onRemove={() => onRemove(limit.id)} />
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function LimitActionsMenu({ limitName, onRemove }: { limitName: string; onRemove: () => void }) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${limitName}`}
            className="text-neutral-500 hover:text-neutral-900"
          />
        }
      >
        <MoreHorizontal aria-hidden />
      </MenuTrigger>
      <MenuContent>
        <MenuItem variant="destructive" onClick={onRemove}>
          Remove limit
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/* ─── Create limit dialog ───────────────────────────────────────────── */

const LIMIT_TYPES = [
  { value: 'spend', label: 'Spend ($)' },
  { value: 'tokens', label: 'Tokens' },
  { value: 'requests', label: 'Requests' },
] as const;

const LIMIT_PERIODS = [
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
  { value: '1mo', label: '1 month' },
] as const;

// Scope options — "Org-wide" plus the workspace's *active* API keys.
// Key identities mirror the seed list in ApiKeys.tsx (the canonical key
// source); keep in sync if that seed changes. Revoked keys (e.g.
// test-key) are intentionally excluded — a limit on a revoked key is
// meaningless.
const LIMIT_SCOPES = [
  { value: 'org', name: 'Org-wide (all keys)', masked: null },
  { value: 'sk-gw-c4aeb3a8', name: 'prod-web', masked: 'sk-gw-…c4ae' },
  { value: 'sk-gw-9f3064ce', name: 'prod-agent', masked: 'sk-gw-…9f30' },
] as const;

type Limit = {
  id: string;
  name: string;
  type: string;
  threshold: string;
  period: string;
  scope: string;
  used: string;
};

const LIMIT_TYPE_BY_VALUE = new Map<string, (typeof LIMIT_TYPES)[number]>(LIMIT_TYPES.map((t) => [t.value, t]));
const LIMIT_PERIOD_BY_VALUE = new Map<string, (typeof LIMIT_PERIODS)[number]>(LIMIT_PERIODS.map((p) => [p.value, p]));
const LIMIT_SCOPE_BY_VALUE = new Map<string, (typeof LIMIT_SCOPES)[number]>(LIMIT_SCOPES.map((s) => [s.value, s]));

const typeLabel = (v: string) =>
  LIMIT_TYPE_BY_VALUE.get(v)?.label ?? v;
const periodLabel = (v: string) =>
  LIMIT_PERIOD_BY_VALUE.get(v)?.label ?? v;
const findScope = (v: string) => LIMIT_SCOPE_BY_VALUE.get(v);
const scopeName = (v: string) => findScope(v)?.name ?? v;
const thresholdLabel = (type: string, threshold: string) => {
  const n = Number(threshold);
  const formatted = Number.isFinite(n) ? formatNumber(n) : threshold;
  return type === 'spend' ? `$${formatted}` : formatted;
};
const usedLabel = (type: string, used: string, threshold: string) => {
  const uNum = Number(used);
  const tNum = Number(threshold);
  const u = Number.isFinite(uNum) ? formatNumber(uNum) : '0';
  const t = Number.isFinite(tNum) ? formatNumber(tNum) : '0';
  const prefix = type === 'spend' ? '$' : '';
  return `${prefix}${u} / ${prefix}${t}`;
};
const fmtResetDate = (d: Date) =>
  `${formatDateTime(d, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })} UTC`;
/** Computes the next reset boundary for a limit period. Takes `now` as a
 *  parameter so callers can share a single timestamp across rows — calling
 *  `new Date()` at render time per row caused the column to flicker on
 *  every re-render. See `resetsAtMap` in LimitsSection for the memoized
 *  call pattern. */
const resetsAt = (now: Date, period: string) => {
  switch (period) {
    case '1h': {
      const next = new Date(now);
      next.setUTCMinutes(0, 0, 0);
      next.setUTCHours(next.getUTCHours() + 1);
      return fmtResetDate(next);
    }
    case '1d': {
      const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      return fmtResetDate(next);
    }
    case '1w': {
      const daysUntilMon = (8 - now.getUTCDay()) % 7 || 7;
      const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMon));
      return fmtResetDate(next);
    }
    case '1mo': {
      const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      return fmtResetDate(next);
    }
    default: return '—';
  }
};

// Strip everything except digits and at most one decimal point. Lets users
// paste "$5,000,000" or "1.5M" and recover a clean numeric string.
const normalizeThresholdInput = (raw: string): string => {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
};

// Show the integer part with locale-aware thousands separators while the
// user types. Preserves a trailing "." or "5." mid-entry so the field
// doesn't fight the keyboard. Decimal digits pass through unformatted —
// only the integer part gets the grouping treatment.
const formatThresholdDisplay = (raw: string): string => {
  if (raw === '') return '';
  const [intPart, decPart] = raw.split('.');
  const intNum = Number(intPart);
  const intFormatted = Number.isFinite(intNum) && intPart !== '' ? formatNumber(intNum) : intPart ?? '';
  if (raw.includes('.')) return `${intFormatted}.${decPart ?? ''}`;
  return intFormatted;
};

function CreateLimitDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreate: (limit: Limit) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('spend');
  const [threshold, setThreshold] = useState('');
  const [period, setPeriod] = useState('1d');
  const [scope, setScope] = useState('org');

  const thresholdNum = Number(threshold);
  const canSubmit =
    name.trim().length > 0 &&
    threshold.length > 0 &&
    Number.isFinite(thresholdNum) &&
    thresholdNum > 0;

  const handleSubmit = () => {
    onCreate({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      threshold,
      period,
      scope,
      used: '0',
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName('');
          setType('spend');
          setThreshold('');
          setPeriod('1d');
          setScope('org');
        }
      }}
    >
      <DialogContent className="gap-4 w-full sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-lg/6 font-medium text-neutral-900">
            Create limit
          </DialogTitle>
          <DialogDescription>
            Block requests that exceed the threshold (returns 429).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-limit-name" className="text-neutral-600 font-medium text-sm">
            Name
          </Label>
          <Input
            id="create-limit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. eu-payments daily spend"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="create-limit-type" className="text-neutral-600 font-medium text-sm">
              Type
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="create-limit-type" className="w-full">
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
            <Label htmlFor="create-limit-threshold" className="text-neutral-600 font-medium text-sm">
              Threshold
            </Label>
            <Input
              id="create-limit-threshold"
              type="text"
              inputMode="decimal"
              value={formatThresholdDisplay(threshold)}
              onChange={(e) => setThreshold(normalizeThresholdInput(e.target.value))}
              placeholder="e.g. 250"
              className="font-mono text-sm tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="create-limit-period" className="text-neutral-600 font-medium text-sm">
              Period
            </Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="create-limit-period" className="w-full">
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
            <Label htmlFor="create-limit-scope" className="text-neutral-600 font-medium text-sm">
              Scope
            </Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger id="create-limit-scope" className="w-full">
                {/* Function-child keeps the trigger single-line — the
                    two-line key body is for the popup only. */}
                <SelectValue>{(value) => scopeName(value as string)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LIMIT_SCOPES.map((s) => (
                  <SelectItem
                    key={s.value}
                    value={s.value}
                    className={s.masked ? 'h-auto py-2 items-start' : undefined}
                  >
                    {s.masked ? (
                      <span className="flex flex-col">
                        <span className="font-sans text-sm text-neutral-900">{s.name}</span>
                        <span className="font-mono text-xs text-neutral-500">{s.masked}</span>
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

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
