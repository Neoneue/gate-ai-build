import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bell, BookOpen, MoreHorizontal, Plus, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
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
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabsCount } from '@/components/ui/tabs-count';
import { DashboardChrome } from '@/layouts/DashboardChrome';

export function Guardrails() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [createOpen, setCreateOpen] = useState(false);
  const [limits, setLimits] = useState<Limit[]>([]);
  const openCreate = () => setCreateOpen(true);
  const addLimit = (limit: Limit) => setLimits((prev) => [limit, ...prev]);
  const removeLimit = (id: string) =>
    setLimits((prev) => prev.filter((l) => l.id !== id));

  return (
    <DashboardChrome
      breadcrumbCurrent="Guardrails"
      activeNavId="guardrails"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader onCreate={openCreate} />
      <TabsRow count={limits.length} />
      <LimitsSection
        limits={limits}
        onCreate={openCreate}
        onRemove={removeLimit}
      />
      <FooterCallouts />
      <CreateLimitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={addLimit}
      />
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Limits & quotas</PageTitle>
        <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
          Enforce spend, token, and request rate caps at the org, project, or key level. Limits run inline — no separate billing system to wire up.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline">
          <BookOpen data-icon="inline-start" aria-hidden />
          Limit cookbook
        </Button>
        <Button onClick={onCreate}>
          <Plus data-icon="inline-start" aria-hidden />
          Create limit
        </Button>
      </div>
    </div>
  );
}

/* ─── Tabs row + reset cadence ──────────────────────────────────────── */

function TabsRow({ count }: { count: number }) {
  const [tab, setTab] = useState('all');
  return (
    <div className="flex items-end justify-between gap-4 border-b border-ink-100">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" className="px-0 border-b-0">
          <TabsTrigger value="all">
            All limits
            <TabsCount>{count}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <TabsCount>{count}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="attention">
            Needs attention
            <TabsCount>0</TabsCount>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <span className="font-sans text-xs text-ink-500 tracking-tight pb-3">
        Resets: monthly @ 00:00 UTC, daily @ 00:00 UTC
      </span>
    </div>
  );
}

/* ─── Limits table / empty state ────────────────────────────────────── */

function LimitsSection({
  limits,
  onCreate,
  onRemove,
}: {
  limits: Limit[];
  onCreate: () => void;
  onRemove: (id: string) => void;
}) {
  if (limits.length === 0) {
    return (
      <EmptyState
        icon={
          <div
            aria-hidden
            className="size-12 rounded-full bg-ink-100 flex items-center justify-center"
          >
            <Shield className="size-5 text-ink-700" />
          </div>
        }
        title="No limits configured"
        body="Create one to cap spend, throttle traffic, or shape usage per project or key."
        action={
          <Button onClick={onCreate}>
            <Plus data-icon="inline-start" aria-hidden />
            Create limit
          </Button>
        }
      />
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
            <TableHead className="w-[19%] whitespace-nowrap">Name</TableHead>
            <TableHead className="w-[19%] whitespace-nowrap">Scope</TableHead>
            <TableHead className="w-[19%] whitespace-nowrap">Type</TableHead>
            <TableHead className="w-[19%] whitespace-nowrap">Threshold</TableHead>
            <TableHead className="w-[19%] whitespace-nowrap">Period</TableHead>
            <TableHead className="w-[5%] text-right pl-0 pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {limits.map((limit) => (
            <TableRow key={limit.id}>
              <TableCell className="font-sans text-sm font-medium text-ink-900">
                <span className="block truncate" title={limit.name}>
                  {limit.name}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col min-w-0">
                  <span
                    className="font-sans text-sm font-medium text-ink-900 truncate"
                    title={scopeName(limit.scope)}
                  >
                    {scopeName(limit.scope)}
                  </span>
                  <span className="font-mono text-xs text-ink-500 truncate">
                    {findScope(limit.scope)?.masked ?? ''}
                  </span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap font-sans text-sm text-ink-800">
                {typeLabel(limit.type)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-sm tabular-nums text-ink-800">
                {thresholdLabel(limit.type, limit.threshold)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-sans text-sm text-ink-800">
                {periodLabel(limit.period)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap pl-0 pr-4">
                <LimitActionsMenu onRemove={() => onRemove(limit.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function LimitActionsMenu({ onRemove }: { onRemove: () => void }) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Limit actions"
            className="text-ink-500 hover:text-ink-900"
          />
        }
      >
        <MoreHorizontal />
      </MenuTrigger>
      <MenuContent>
        <MenuItem variant="destructive" onClick={onRemove}>
          Remove limit
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/* ─── Footer callouts ───────────────────────────────────────────────── */

function FooterCallouts() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <CalloutCard
        icon={<Zap className="size-4 text-ink-700" aria-hidden />}
        heading="On-chain audit"
        body="Every limit decision is anchored to Constellation DE. Tamper-evident audit trail comes free with every limit you set."
      />
      <CalloutCard
        icon={<Bell className="size-4 text-ink-700" aria-hidden />}
        heading="Threshold alerts"
        body="Get notified at 50%, 80%, 95% via Slack, PagerDuty, or webhook before a limit blocks production."
      />
    </div>
  );
}

function CalloutCard({
  icon,
  heading,
  body,
}: {
  icon: React.ReactNode;
  heading: string;
  body: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-2">
        <div
          aria-hidden
          className="size-8 rounded-md bg-ink-100 flex items-center justify-center shrink-0"
        >
          {icon}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-sans text-sm font-medium text-ink-900 m-0">
            {heading}
          </h3>
          <p className="font-sans text-sm text-ink-500 m-0 text-pretty">
            {body}
          </p>
        </div>
      </CardContent>
    </Card>
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

// Scope options — the workspace's *active* API keys. Key identities
// mirror the seed list in ApiKeys.tsx (the canonical key source); keep
// in sync if that seed changes. Revoked keys (e.g. test-key) are
// intentionally excluded — a limit on a revoked key is meaningless.
const LIMIT_SCOPES = [
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
};

const typeLabel = (v: string) =>
  LIMIT_TYPES.find((t) => t.value === v)?.label ?? v;
const periodLabel = (v: string) =>
  LIMIT_PERIODS.find((p) => p.value === v)?.label ?? v;
const findScope = (v: string) => LIMIT_SCOPES.find((s) => s.value === v);
const scopeName = (v: string) => findScope(v)?.name ?? v;
const thresholdLabel = (type: string, threshold: string) => {
  const n = Number(threshold);
  const formatted = Number.isFinite(n) ? n.toLocaleString() : threshold;
  return type === 'spend' ? `$${formatted}` : formatted;
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
  const [scope, setScope] = useState('sk-gw-c4aeb3a8');

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
          setScope('sk-gw-c4aeb3a8');
        }
      }}
    >
      <DialogContent
        className="gap-4"
        style={{ width: 500, minWidth: 500, maxWidth: 500 }}
      >
        <DialogHeader>
          <DialogTitle className="font-sans text-lg/6 font-medium text-ink-900">
            Create limit
          </DialogTitle>
          <DialogDescription>
            Block requests that exceed the threshold (returns 429).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-limit-name" className="text-ink-600 font-medium text-sm">
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
            <Label htmlFor="create-limit-type" className="text-ink-600 font-medium text-sm">
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
            <Label htmlFor="create-limit-threshold" className="text-ink-600 font-medium text-sm">
              Threshold
            </Label>
            <Input
              id="create-limit-threshold"
              type="number"
              inputMode="decimal"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 250"
              className="font-mono text-sm tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="create-limit-period" className="text-ink-600 font-medium text-sm">
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
            <Label htmlFor="create-limit-scope" className="text-ink-600 font-medium text-sm">
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
                    className="h-auto py-2 items-start"
                  >
                    <span className="flex flex-col">
                      <span className="font-sans text-sm text-ink-900">{s.name}</span>
                      <span className="font-mono text-xs text-ink-500">{s.masked}</span>
                    </span>
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
