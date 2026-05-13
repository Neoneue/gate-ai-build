import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BookOpen, Download, KeyRound, MoreHorizontal, Plus, Search, ShieldOff, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { CodeBlock, CodeCard, linesToString, type CodeLine } from '@/components/ui/code-card';
import { CopyButton } from '@/components/ui/copy-button';
import { CompactSpark, DeltaTag } from '@/components/ui/compact-kpi';
import { EmptyState } from '@/components/ui/empty-state';
import { Eyebrow } from '@/components/ui/eyebrow';
import { HeroNumeric } from '@/components/ui/hero-numeric';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { Input } from '@/components/ui/input';
import { KpiRail } from '@/components/ui/kpi-rail';
import { Label } from '@/components/ui/label';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu';
import { cn } from '@/lib/utils';
import { PageTitle } from '@/components/ui/page-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkline } from '@/components/ui/sparkline';
import { TextLink } from '@/components/ui/text-link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardChrome } from '@/layouts/DashboardChrome';

/* ─────────────────────────────────────────────────────────────────────────
 * API Keys page
 *
 * Empty state until the user creates a key via <CreateKeyDialog>; after
 * submission, the new key gets pushed into local state and the table
 * replaces the empty state. ENV column / Environment filter / hashing
 * footnote all removed per CTO direction — the page is intentionally
 * narrower than the prior reference design (one key, one routing mode,
 * no environment scoping).
 * ───────────────────────────────────────────────────────────────────────── */

type ApiKeyRow = {
  id: string;            // full id used for matching / dedup
  name: string;          // user-supplied label
  masked: string;        // `sk-gw-…3a8f` display form
  spendCap: string;      // "$500 per month" or "Unlimited"
  requests7d: number[];  // sparkline series; 7 daily buckets
  lastUsed: string;      // "1 day ago" / "Never"
  revoked?: boolean;     // greys out the row + disables actions when true
};

export function ApiKeys() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [createOpen, setCreateOpen] = useState(false);
  // TEMP PREVIEW SEED — two mock rows so the populated-table state is
  // visible without needing to submit the create flow. Delete the array
  // literal (replace with `[]`) before testing the real add-key flow.
  const [keys, setKeys] = useState<ApiKeyRow[]>([
    {
      id: 'sk-gw-c4aeb3a8',
      name: 'server · new-service',
      masked: 'sk-gw-…c4ae',
      spendCap: '$500 per month',
      requests7d: [0, 0, 1, 0, 1, 2, 3],
      lastUsed: '1 day ago',
    },
    {
      id: 'sk-gw-255e1d3a',
      name: 'test-key',
      masked: 'sk-gw-…255e',
      spendCap: 'Unlimited',
      requests7d: [0, 0, 0, 0, 0, 0, 0],
      lastUsed: 'Never',
      revoked: true,
    },
  ]);
  const [query, setQuery] = useState('');

  const handleCreate = (input: { name: string; spendCap: string; period: SpendCapPeriod }) => {
    const suffix = randomHex(4);
    const idCore = randomHex(8);
    const next: ApiKeyRow = {
      id: `sk-gw-${idCore}`,
      name: input.name.trim(),
      masked: `sk-gw-…${suffix}`,
      spendCap: input.spendCap.trim()
        ? `$${input.spendCap.trim()} ${SPEND_PERIOD_LABEL[input.period]}`
        : 'Unlimited',
      // Zero-volume sparkline for a freshly-created key — no traffic yet.
      requests7d: [0, 0, 0, 0, 0, 0, 0],
      lastUsed: 'Never',
    };
    setKeys((prev) => [...prev, next]);
    setCreateOpen(false);
  };

  const handleRevoke = (id: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked: true } : k)));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return keys;
    return keys.filter((k) => k.name.toLowerCase().includes(q) || k.masked.toLowerCase().includes(q));
  }, [keys, query]);

  return (
    <DashboardChrome
      breadcrumbCurrent="API Access"
      activeNavId="api-keys"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
      hideDocsButton
    >
      <PageHeader onCreate={() => setCreateOpen(true)} />
      <KpiSummaryRail
        activeKeys={keys.filter((k) => !k.revoked).length}
        totalKeys={keys.length}
      />
      <UsageInfo />
      {keys.length === 0 ? (
        <KeysEmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <KeysTable rows={filtered} query={query} onQueryChange={setQuery} onRevoke={handleRevoke} />
      )}
      <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
    </DashboardChrome>
  );
}

function PageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>API Access</PageTitle>
        <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
          Keys authenticate every request through the gateway. Rotate on a schedule; scope after creation.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline">
          <BookOpen data-icon="inline-start" aria-hidden />
          Key docs
        </Button>
        <Button onClick={onCreate}>
          <Plus data-icon="inline-start" aria-hidden />
          Create key
        </Button>
      </div>
    </div>
  );
}

function KpiSummaryRail({ activeKeys, totalKeys }: { activeKeys: number; totalKeys: number }) {
  return (
    <KpiRail columns={4}>
      <KpiTile
        title="Active keys"
        liveDot
        value={String(activeKeys)}
        valueSuffix={`/ ${totalKeys}`}
        spark={
          <CompactSpark
            colorVar="var(--color-success-600)"
            data={[0, 0, 0, 0, 0, 0, 1, 1]}
          />
        }
      />
      <KpiTile
        title="Requests / 24H"
        value="4"
        delta="+33.3%"
        spark={
          <CompactSpark
            colorVar="var(--color-ink-500)"
            data={[0, 0, 0, 0, 0, 0, 1, 4]}
          />
        }
      />
      <KpiTile
        title="Combined spend"
        value="$0.0076"
        delta="-49%"
        spark={
          <CompactSpark
            colorVar="var(--color-ink-500)"
            data={[0, 0, 0, 0, 0, 0, 4, 1]}
          />
        }
      />
      <KpiTile
        title="Oldest key age"
        liveDot
        value="1 day"
      />
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

function KeysEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={
        <div
          aria-hidden
          className="inline-flex items-center justify-center size-10 rounded-full bg-blue-100 text-blue-700"
        >
          <KeyRound className="size-5" strokeWidth={1.75} />
        </div>
      }
      title="No API keys yet"
      body="Create a key to start routing requests through the gateway. The full key is shown only once."
      action={
        <div className="flex items-center gap-2">
          <Button onClick={onCreate}>
            <Plus data-icon="inline-start" aria-hidden />
            Create your first key
          </Button>
          <Button variant="ghost">
            <BookOpen data-icon="inline-start" aria-hidden />
            Read the quickstart
          </Button>
        </div>
      }
    />
  );
}

/* ─── Usage info ───────────────────────────────────────────────────────── */

// Real-key placeholder — the `sk-gw-…YOUR_KEY` token is a stand-in. Never
// hard-code an actual key into the snippet; users paste their own value
// after copying. Two env-var pattern matches how Claude Code reads the
// gateway URL + auth header from the shell environment.
const USAGE_SNIPPET_LINES: CodeLine[] = [
  [{ text: '# Point Claude Code at the gateway instead of Anthropic directly', tone: 'muted' }],
  [
    { text: 'export', tone: 'keyword' },
    { text: ' ANTHROPIC_BASE_URL=' },
    { text: '"https://gateway-staging.constellationgate.ai"', tone: 'string' },
  ],
  [{ text: '' }],
  [{ text: '# Add your gateway key so the gateway can authenticate your requests', tone: 'muted' }],
  [
    { text: 'export', tone: 'keyword' },
    { text: ' ANTHROPIC_CUSTOM_HEADERS=' },
    { text: '"X-Gateway-Api-Key: ', tone: 'string' },
    { text: 'sk-gw-…YOUR_KEY', tone: 'variable' },
    { text: '"', tone: 'string' },
  ],
];

function UsageInfo() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-lg font-medium text-ink-900 m-0">
          Using your key
        </h3>
        <p className="font-sans text-sm text-ink-500 m-0">
          Point your client at the gateway with two env vars: a base URL and an{' '}
          <code className="font-mono text-ink-800 bg-ink-100 rounded-xs px-1.5 py-0.5">X-Gateway-Api-Key</code>{' '}
          header carrying your key. Works for Claude Code and any client that respects{' '}
          <code className="font-mono text-ink-800 bg-ink-100 rounded-xs px-1.5 py-0.5">ANTHROPIC_BASE_URL</code>.
        </p>
        <p className="font-sans text-sm text-ink-500 m-0">
          To learn more about how to use your key, check out our{' '}
          <TextLink>API key docs</TextLink>.
        </p>
      </div>
      {/* Labeled-card pattern lifted from the Requests modal Messages tab
          (`MessageBlock`): white header strip + bg-ink-50 body. Replaces
          the prior CodeCard+CodeCardHeader's mono "SHELL" eyebrow with
          plain-English "Environment setup" so the snippet's purpose is
          obvious to a reader scanning the page. */}
      <CodeCard className="border border-ink-100">
        <div className="flex items-center gap-2 pl-3 pr-2 py-2 bg-white">
          <Terminal aria-hidden className="size-4 text-ink-500" strokeWidth={1.75} />
          <span className="font-sans text-sm font-medium text-ink-500">
            Environment setup
          </span>
          <CopyButton
            mode="label"
            text="Copy code"
            value={linesToString(USAGE_SNIPPET_LINES)}
            label="environment setup snippet"
            className="ml-auto"
          />
        </div>
        <div className="border-t border-ink-200 bg-ink-50">
          <CodeBlock lines={USAGE_SNIPPET_LINES} density="compact" />
        </div>
      </CodeCard>
    </section>
  );
}

/* ─── Keys table ───────────────────────────────────────────────────────── */

function KeysTable({
  rows,
  query,
  onQueryChange,
  onRevoke,
}: {
  rows: ApiKeyRow[];
  query: string;
  onQueryChange: (next: string) => void;
  onRevoke: (id: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-sans text-lg font-medium text-ink-900 m-0">
        API keys
      </h3>
      <Card density="flush">
      {/* Toolbar — shape lifted from CMP-013 Requests. Single-row,
          search left, Export right via ml-auto. */}
      <div className="flex items-center gap-2 p-4">
        <div className="relative w-72 min-w-0 shrink-0">
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-500"
            strokeWidth={1.75}
          />
          <Input
            size="sm"
            placeholder="Search by name or prefix…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" className="ml-auto">
          <Download data-icon="inline-start" aria-hidden />
          Export CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="whitespace-nowrap">Key</TableHead>
            <TableHead className="whitespace-nowrap">Status</TableHead>
            <TableHead className="whitespace-nowrap">Spend cap</TableHead>
            <TableHead className="whitespace-nowrap">7-day requests</TableHead>
            <TableHead className="whitespace-nowrap">Last used</TableHead>
            <TableHead aria-label="Actions" className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(row.revoked && 'hover:bg-transparent')}
            >
              {/* Dim cells live on each non-Status cell so the Status
                  badge keeps full saturation. CSS opacity creates a
                  stacking context that descendants can't escape — putting
                  it on the row would dim the badge too. */}
              <TableCell className={cn('whitespace-nowrap align-middle', row.revoked && 'opacity-50')}>
                <div className="flex items-center gap-3 min-w-0">
                  <KeyRound aria-hidden className="size-4 shrink-0 text-ink-500" strokeWidth={1.75} />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-sans text-sm font-medium text-ink-900">
                      {row.name}
                    </span>
                    <span className="font-mono text-xs text-ink-500">
                      {row.masked}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.revoked ? (
                  <Badge variant="neutral">Revoked</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </TableCell>
              <TableCell className={cn('whitespace-nowrap font-mono text-sm tabular-nums text-ink-800', row.revoked && 'opacity-50')}>
                {row.spendCap}
              </TableCell>
              <TableCell className={cn('whitespace-nowrap', row.revoked && 'opacity-50')}>
                <Sparkline points={row.requests7d.every((v) => v === 0) ? [0, 0, 0, 0, 0, 0, 0] : row.requests7d} />
              </TableCell>
              <TableCell className={cn('whitespace-nowrap text-sm text-ink-500', row.revoked && 'opacity-50')}>
                {row.lastUsed}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {row.revoked ? null : (
                  <Menu>
                    <MenuTrigger
                      render={
                        <IconActionButton aria-label={`Actions for ${row.name}`}>
                          <MoreHorizontal aria-hidden strokeWidth={1.75} />
                        </IconActionButton>
                      }
                    />
                    <MenuContent align="end" sideOffset={4}>
                      <MenuItem
                        variant="destructive"
                        onClick={() => onRevoke(row.id)}
                      >
                        <ShieldOff aria-hidden strokeWidth={1.75} />
                        Revoke key
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>
    </section>
  );
}

/* ─── Create API key dialog ────────────────────────────────────────────── */

type SpendCapPeriod = 'day' | 'week' | 'month' | 'year';

const SPEND_PERIOD_LABEL: Record<SpendCapPeriod, string> = {
  day: 'per day',
  week: 'per week',
  month: 'per month',
  year: 'per year',
};

function CreateKeyDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreate: (input: { name: string; spendCap: string; period: SpendCapPeriod }) => void;
}) {
  const [name, setName] = useState('');
  const [spendCap, setSpendCap] = useState('');
  const [period, setPeriod] = useState<SpendCapPeriod>('month');

  const isValid = name.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName('');
          setSpendCap('');
          setPeriod('month');
        }
      }}
    >
      <DialogContent className="sm:max-w-lg gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValid) return;
            onCreate({ name, spendCap, period });
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-ink-500" aria-hidden strokeWidth={1.75} />
              <DialogTitle className="font-sans text-lg/6 font-medium text-ink-900">
                Create API key
              </DialogTitle>
            </div>
            <DialogDescription>
              Keys inherit all model access by default. Scope can be restricted after creation.
            </DialogDescription>
          </DialogHeader>

          {/* Name — required */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="apikey-name" className="text-ink-600 font-medium text-sm">
                Name
              </Label>
              <span className="font-sans text-xs text-ink-500">
                Shown in logs and audit events.
              </span>
            </div>
            <Input
              id="apikey-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="server · new-service"
              spellCheck={false}
              autoComplete="off"
              required
              className="font-mono text-sm"
            />
          </div>

          {/* Spend cap — amount + time range */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="apikey-spend-cap" className="text-ink-600 font-medium text-sm">
                Spend cap
              </Label>
              <span className="font-sans text-xs text-ink-500">
                Key stops accepting requests at the cap. Leave blank for unlimited.
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <div className="relative">
                <span
                  aria-hidden
                  className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-500 pointer-events-none"
                >
                  $
                </span>
                <Input
                  id="apikey-spend-cap"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  value={spendCap}
                  onChange={(e) => setSpendCap(e.target.value)}
                  placeholder="500"
                  className="pl-7 font-mono text-sm tabular-nums"
                />
              </div>
              <Select value={period} onValueChange={(v: string) => setPeriod(v as SpendCapPeriod)}>
                <SelectTrigger
                  size="default"
                  aria-label="Spend cap period"
                  className="border-ink-200 bg-white text-ink-900 font-normal"
                >
                  <SelectValue>{(v) => SPEND_PERIOD_LABEL[v as SpendCapPeriod] ?? 'per month'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">per day</SelectItem>
                  <SelectItem value="week">per week</SelectItem>
                  <SelectItem value="month">per month</SelectItem>
                  <SelectItem value="year">per year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Warning callout — tinted card, not inline-icon text. Modal-
              interior radius is rounded-md (8px) per design system. */}
          <div
            role="note"
            className="rounded-md bg-warning-50 border border-warning-200 px-4 py-3"
          >
            <p className="font-sans text-sm text-warning-700 m-0">
              The full key will only be shown once. Store it securely.
            </p>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" variant="default" disabled={!isValid}>
              Create key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Small random hex generator for masked key suffixes. Uses Math.random
 *  for demo-only key IDs — real key minting happens server-side. */
function randomHex(chars: number): string {
  let out = '';
  for (let i = 0; i < chars; i++) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}
