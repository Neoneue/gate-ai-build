import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bell, BookOpen, Plus, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DeltaTag } from '@/components/ui/compact-kpi';
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
import { Eyebrow } from '@/components/ui/eyebrow';
import { HeroNumeric } from '@/components/ui/hero-numeric';
import { Input } from '@/components/ui/input';
import { KpiRail } from '@/components/ui/kpi-rail';
import { PageTitle } from '@/components/ui/page-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const openCreate = () => setCreateOpen(true);

  return (
    <DashboardChrome
      breadcrumbCurrent="Guardrails"
      activeNavId="guardrails"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader onCreate={openCreate} />
      <KpiRailSection />
      <TabsRow />
      <EmptyStateSection onCreate={openCreate} />
      <FooterCallouts />
      <CreateLimitDialog open={createOpen} onOpenChange={setCreateOpen} />
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

/* ─── KPI rail ──────────────────────────────────────────────────────── */

function KpiRailSection() {
  return (
    <KpiRail columns={4}>
      <KpiTile title="MTD spend" value="$0" />
      <KpiTile title="MTD spend / cap" value="0" valueSuffix="%" />
      <KpiTile title="Active limits" value="0" valueSuffix="/ 0" />
      <KpiTile title="Limit hits (24h)" value="0" />
    </KpiRail>
  );
}

function KpiTile({
  title,
  liveDot,
  value,
  valueSuffix,
  delta,
  spark,
}: {
  title: string;
  liveDot?: boolean;
  value: string;
  valueSuffix?: string;
  delta?: string;
  spark?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 bg-white p-4">
      <div className="flex items-center gap-2">
        {liveDot ? (
          <span aria-hidden className="size-2 rounded-full bg-success-600 shrink-0" />
        ) : null}
        <Eyebrow as="div">{title}</Eyebrow>
      </div>
      <div className="flex items-baseline gap-2">
        <HeroNumeric>{value}</HeroNumeric>
        {valueSuffix ? (
          <span className="font-sans text-sm font-medium text-ink-500 tracking-tight">
            {valueSuffix}
          </span>
        ) : null}
        {delta ? <DeltaTag delta={delta} /> : null}
      </div>
      {spark ? <div className="mt-1">{spark}</div> : null}
    </div>
  );
}

/* ─── Tabs row + reset cadence ──────────────────────────────────────── */

function TabsRow() {
  const [tab, setTab] = useState('all');
  return (
    <div className="flex items-end justify-between gap-4 border-b border-ink-100">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" className="px-0 border-b-0">
          <TabsTrigger value="all">
            All limits
            <TabsCount>0</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <TabsCount>0</TabsCount>
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

/* ─── Empty state ───────────────────────────────────────────────────── */

function EmptyStateSection({ onCreate }: { onCreate: () => void }) {
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
      <CardContent className="flex items-start gap-3 py-4">
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

const LIMIT_SCOPES = [
  { value: 'org', label: 'Org-wide (all keys)' },
  { value: 'sk-gw-c4aeb3', label: 'sk-gw-c4aeb3 — test1' },
  { value: 'sk-gw-255e1d', label: 'sk-gw-255e1d — test-key' },
] as const;

function CreateLimitDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
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
          <label
            htmlFor="create-limit-name"
            className="font-mono text-xs uppercase tracking-[0.1em] font-medium text-ink-500"
          >
            Name
          </label>
          <Input
            id="create-limit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. eu-payments daily spend"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="create-limit-type"
              className="font-mono text-xs uppercase tracking-[0.1em] font-medium text-ink-500"
            >
              Type
            </label>
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
            <label
              htmlFor="create-limit-threshold"
              className="font-mono text-xs uppercase tracking-[0.1em] font-medium text-ink-500"
            >
              Threshold
            </label>
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
            <label
              htmlFor="create-limit-period"
              className="font-mono text-xs uppercase tracking-[0.1em] font-medium text-ink-500"
            >
              Period
            </label>
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
            <label
              htmlFor="create-limit-scope"
              className="font-mono text-xs uppercase tracking-[0.1em] font-medium text-ink-500"
            >
              Scope
            </label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger id="create-limit-scope" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_SCOPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
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
