import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BookOpen, CircleCheck, Copy, KeyRound, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AnthropicIcon, OpenAIIcon, GeminiIcon } from '@/components/icons/model-providers';
import { CodePanel, HERO_SNIPPETS } from '@/pages/DashboardDefault';
import { CopyButton, useCopyFeedback } from '@/components/ui/copy-button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTitle } from '@/components/ui/page-title';
import { Sparkline } from '@/components/ui/sparkline';
import { TextLink } from '@/components/ui/text-link';
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
import { Timestamp } from '@/components/ui/timestamp';
import { useTableSort, sortRows } from '@/hooks/use-table-sort';

/* ─────────────────────────────────────────────────────────────────────────
 * API Keys page (route: /api-keys, sidebar: "API Keys")
 *
 * Manages the workspace's API keys. Seeded with 3 mock rows for the demo
 * (see TEMP PREVIEW SEED in <ApiKeys>); replace with `[]` to exercise the
 * empty state. Create flow lives in <CreateKeyDialog>; revoke is a row-
 * menu action that flips `revoked: true` rather than deleting the row.
 *
 * Intentionally narrower than the prior reference: no ENV column, no
 * Environment filter, no routing/billing-mode toggle — one key covers
 * any action per CTO direction.
 * ───────────────────────────────────────────────────────────────────────── */

// Three call sites: header "Key docs" button, empty-state "Read the
// quickstart" button, and the inline TextLink in the Using your key
// section. New tab so dashboard state survives the click.
const API_KEYS_DOCS_URL = 'https://docs.constellationgate.ai/api-keys';
const openDocs = () =>
  window.open(API_KEYS_DOCS_URL, '_blank', 'noopener,noreferrer');

type ApiKeyRow = {
  id: string;            // full id used for matching / dedup
  name: string;          // user-supplied label
  masked: string;        // `sk-gw-…3a8f` display form
  requests7d: number[];  // sparkline series; 7 daily buckets
  createdAt: Date;       // when the key was minted
  lastUsed: Date | null; // null = never used (freshly-minted or revoked-untouched)
  revoked?: boolean;     // greys out the row + disables actions when true
};

/** Comparable value per sortable column for the keys table. Numeric columns
 *  return a number; Date columns return the epoch ms; never-used (`lastUsed`
 *  null) → null so it sorts last. */
function apiKeySortValue(row: ApiKeyRow, key: string): string | number | null {
  switch (key) {
    case 'name': return row.name;
    case 'status': return row.revoked ? 'Revoked' : 'Active';
    case 'requests7d': return row.requests7d.at(-1) ?? 0;
    case 'createdAt': return row.createdAt.getTime();
    case 'lastUsed': return row.lastUsed ? row.lastUsed.getTime() : null;
    default: return null;
  }
}

export function ApiKeys() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [createOpen, setCreateOpen] = useState(false);
  // Full key string for the step-2 "Key created" modal. Non-null while that
  // modal is open; reset to null on close (the key is shown exactly once).
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  // TEMP PREVIEW SEED — Chad's two active keys (prod-web, prod-agent) plus
  // a revoked test-key. Delete the array literal (replace with `[]`)
  // before testing the real add-key flow.
  const [keys, setKeys] = useState<ApiKeyRow[]>([
    {
      id: 'sk-gw-c4aeb3a8',
      name: 'prod-web',
      masked: 'sk-gw-…c4ae',
      // Steady climb — prod-web traffic grows day-over-day.
      requests7d: [3, 5, 7, 6, 10, 9, 14],
      createdAt: new Date(2026, 3, 28, 10, 14, 22), // 2026-04-28 10:14:22
      lastUsed: new Date(2026, 4, 17, 9, 41, 6),    // 2026-05-17 09:41:06
    },
    {
      id: 'sk-gw-9f3064ce',
      name: 'prod-agent',
      masked: 'sk-gw-…9f30',
      // Spiky — agent runs burst irregularly across the week.
      requests7d: [1, 8, 2, 11, 3, 9, 4],
      createdAt: new Date(2026, 4, 8, 16, 2, 51),   // 2026-05-08 16:02:51
      lastUsed: new Date(2026, 4, 18, 10, 12, 33),  // 2026-05-18 10:12:33
    },
    {
      id: 'sk-gw-255e1d3a',
      name: 'test-key',
      masked: 'sk-gw-…255e',
      requests7d: [0, 0, 0, 0, 0, 0, 0],
      createdAt: new Date(2026, 3, 18, 9, 0, 0),    // 2026-04-18 09:00:00
      lastUsed: null,
      revoked: true,
    },
    {
      id: 'sk-gw-ef72d1a9',
      name: 'design-agent',
      masked: 'sk-gw-…ef72',
      // Active — the design-dashboard session runs on this key.
      requests7d: [2, 4, 3, 7, 6, 9, 13],
      createdAt: new Date(2026, 5, 6, 18, 24, 22),  // 2026-06-06 18:24:22
      lastUsed: new Date(2026, 5, 6, 18, 30, 12),   // today
    },
  ]);
  const handleCreate = (input: { name: string }) => {
    const suffix = randomHex(4);
    const idCore = randomHex(8);
    // The one-time full key surfaced in the step-2 modal. Demo-only — real
    // minting happens server-side; here the masked/id fields stay independent.
    const fullKey = `sk-gw-${randomHex(64)}`;
    const next: ApiKeyRow = {
      id: `sk-gw-${idCore}`,
      name: input.name.trim(),
      masked: `sk-gw-…${suffix}`,
      // Zero-volume sparkline for a freshly-created key — no traffic yet.
      requests7d: [0, 0, 0, 0, 0, 0, 0],
      createdAt: new Date(),
      lastUsed: null,
    };
    setKeys((prev) => [...prev, next]);
    setCreateOpen(false);
    setCreatedKey(fullKey);
  };

  const handleRevoke = (id: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked: true } : k)));
  };

  return (
    <DashboardChrome
      activeNavId="api-keys"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader onCreate={() => setCreateOpen(true)} />
      {keys.length === 0 ? (
        <KeysEmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <KeysTable rows={keys} onRevoke={handleRevoke} />
      )}
      <UsageInfo />
      <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
      <KeyCreatedDialog
        fullKey={createdKey}
        onClose={() => setCreatedKey(null)}
      />
    </DashboardChrome>
  );
}

function PageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>API Keys</PageTitle>
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          Keys authenticate every request through the gateway. Rotate on a schedule; scope after creation.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onCreate}>
          <Plus data-icon="inline-start" aria-hidden className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none" />
          Create key
        </Button>
      </div>
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
            <Plus data-icon="inline-start" aria-hidden className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none" />
            Create your first key
          </Button>
          <Button variant="ghost" onClick={openDocs}>
            <BookOpen data-icon="inline-start" aria-hidden />
            Read the quickstart
          </Button>
        </div>
      }
    />
  );
}

/* ─── Usage info ───────────────────────────────────────────────────────── */

// Provider SDK quickstarts (Anthropic / OpenAI / Google) reuse the hero
// card's CodePanel + snippets so the API Keys page and Overview stay in sync.

function UsageInfo() {
  const [tab, setTab] = useState<'anthropic' | 'openai' | 'google'>('anthropic');
  return (
    // max-w-3xl (768px) — code snippets don't earn 1200px of width; the
    // curl body line and the OpenAI SDK indentation both fit without
    // wrapping, with breathing room on the right.
    <section className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-lg font-medium text-neutral-900 m-0">
          Using your key
        </h3>
        <p className="font-sans text-sm text-neutral-500 m-0">
          Point your client at the gateway and send your key in the{' '}
          <code className="font-mono text-neutral-800 bg-neutral-100 rounded-xs px-2 py-1">X-Gateway-Api-Key</code>{' '}
          header. The gateway is provider-neutral — call it with curl, the OpenAI SDK, Anthropic SDK, or any other client that lets you override the base URL.
        </p>
        <p className="font-sans text-sm text-neutral-500 m-0">
          To learn more about how to use your key, check out our{' '}
          <TextLink
            as="a"
            href={API_KEYS_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            API key docs
          </TextLink>
          .
        </p>
      </div>

      <Card density="flush">
        <Tabs defaultValue="anthropic" className="gap-0" onValueChange={(v) => setTab(v as 'anthropic' | 'openai' | 'google')}>
          <div className="flex items-center justify-between px-4 pt-1 border-b border-border">
            <TabsList variant="line" className="px-0 border-b-0">
              <TabsTrigger value="anthropic">
                <AnthropicIcon className="size-4" />Anthropic
              </TabsTrigger>
              <TabsTrigger value="openai">
                <OpenAIIcon className="size-4" />OpenAI
              </TabsTrigger>
              <TabsTrigger value="google">
                <GeminiIcon className="size-4" />Google
              </TabsTrigger>
            </TabsList>
            <CopyButton mode="label" text="Copy code" value={HERO_SNIPPETS[tab]} label="code snippet" className="-translate-y-[2px]" />
          </div>
          <TabsContent value="anthropic" className="mt-0">
            <CodePanel snippet={HERO_SNIPPETS.anthropic} />
          </TabsContent>
          <TabsContent value="openai" className="mt-0">
            <CodePanel snippet={HERO_SNIPPETS.openai} />
          </TabsContent>
          <TabsContent value="google" className="mt-0">
            <CodePanel snippet={HERO_SNIPPETS.google} />
          </TabsContent>
        </Tabs>
      </Card>
    </section>
  );
}

/* ─── Keys table ───────────────────────────────────────────────────────── */

function KeysTable({
  rows,
  onRevoke,
}: {
  rows: ApiKeyRow[];
  onRevoke: (id: string) => void;
}) {
  const [pendingRevoke, setPendingRevoke] = useState<ApiKeyRow | null>(null);
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = useMemo(
    () => sortRows(rows, sort, apiKeySortValue),
    [rows, sort],
  );

  return (
    <>
      <Card density="flush">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Five data columns at w-1/5 + a fixed-width Actions column.
               *  Created and Last used sit at the right of the row — the date
               *  pair is the row's "freshness" data, so they cluster. */}
              <SortableTableHead sortKey="name" sort={sort} onSort={toggleSort} className="w-1/5 whitespace-nowrap">Key</SortableTableHead>
              <SortableTableHead sortKey="status" sort={sort} onSort={toggleSort} className="w-1/5 whitespace-nowrap">Status</SortableTableHead>
              <SortableTableHead sortKey="requests7d" sort={sort} onSort={toggleSort} className="w-1/5 whitespace-nowrap">7-day requests</SortableTableHead>
              <SortableTableHead sortKey="createdAt" sort={sort} onSort={toggleSort} className="w-1/5 whitespace-nowrap">Created</SortableTableHead>
              <SortableTableHead sortKey="lastUsed" sort={sort} onSort={toggleSort} className="w-1/5 whitespace-nowrap">Last used</SortableTableHead>
              <TableHead aria-label="Actions" className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow key={row.id} className={row.revoked ? 'opacity-60' : undefined}>
                {/* `name (sk-gw-…NNNN)` — name in dark ink, masked id dimmed
                    to neutral-600. Single-line two-tone form shared with the
                    Events / Requests / Activity Key columns. */}
                <TableCell className="whitespace-nowrap font-mono">
                  <span className="text-neutral-800">{row.name}</span>
                  <span className="text-neutral-600"> ({row.masked})</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {row.revoked ? (
                    <Badge variant="neutral">Revoked</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="sr-only">{`${row.requests7d.at(-1)?.toLocaleString()} requests, 7-day trend`}</span>
                  <Sparkline points={row.requests7d} width={96} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-neutral-800">
                  <Timestamp date={row.createdAt} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-neutral-800">
                  <Timestamp date={row.lastUsed} />
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {row.revoked ? null : (
                    <IconActionButton
                      aria-label={`Revoke ${row.name}`}
                      onClick={() => setPendingRevoke(row)}
                    >
                      <Trash2 aria-hidden strokeWidth={1.75} className="size-4" />
                    </IconActionButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRevoke(null);
        }}
      >
        <DialogContent className="sm:max-w-sm p-4">
          <DialogHeader>
            <DialogTitle>Revoke {pendingRevoke?.name}?</DialogTitle>
            <DialogDescription>
              This key will stop authenticating requests immediately. Revocation can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pendingRevoke) onRevoke(pendingRevoke.id);
                setPendingRevoke(null);
              }}
            >
              Revoke key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Create API key dialog ────────────────────────────────────────────── */

function CreateKeyDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreate: (input: { name: string }) => void;
}) {
  const [name, setName] = useState('');

  const isValid = name.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName('');
        }
      }}
    >
      <DialogContent className="sm:max-w-lg gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValid) return;
            onCreate({ name });
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle className="font-sans text-lg/6 font-medium text-neutral-900">
              Create API key
            </DialogTitle>
            <DialogDescription>
              Keys inherit all model access by default. Scope can be restricted after creation.
            </DialogDescription>
          </DialogHeader>

          {/* Name — required */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="apikey-name" className="text-neutral-600 font-medium text-sm">
                Name
              </Label>
              <span className="font-sans text-xs text-neutral-500">
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

/* ─── Key created dialog (step 2) ──────────────────────────────────────── */

// Step 2 of the create flow: surfaces the full key exactly once. Opens when
// `fullKey` is non-null (driven by `createdKey` in <ApiKeys>). No form — just
// copy + a saved-it confirmation gate before the modal can be dismissed.
function KeyCreatedDialog({
  fullKey,
  onClose,
}: {
  fullKey: string | null;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const { copied, trigger } = useCopyFeedback({ value: fullKey ?? '', label: 'API key' });

  return (
    <Dialog
      open={fullKey !== null}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
          // Reset the confirmation gate so reopening starts unchecked.
          setSaved(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg gap-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CircleCheck
              aria-hidden
              className="size-5 shrink-0 text-success-600"
              strokeWidth={1.75}
            />
            <DialogTitle className="font-sans text-lg/6 font-medium text-neutral-900">
              Key created. Copy it now.
            </DialogTitle>
          </div>
          <DialogDescription>
            This is the only time you will see the full key. We hash it at rest.
          </DialogDescription>
        </DialogHeader>

        {/* Key display — one merged surface: mono value + Copy split by a
            hairline divider. Custom button chrome (via useCopyFeedback) so the
            Copy segment sits flush inside the neutral-100 well, no nested border. */}
        <div className="flex items-stretch overflow-hidden rounded-md border border-border bg-neutral-100">
          <div className="flex-1 px-3 py-2 font-mono text-sm text-neutral-800 break-all">
            {fullKey}
          </div>
          <button
            type="button"
            onClick={trigger}
            aria-label={copied ? 'Copied' : 'Copy API key'}
            className="flex shrink-0 items-center gap-2 border-l border-border px-4 font-sans text-sm font-medium text-neutral-600 transition-[colors,scale] duration-150 ease-out hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {copied ? (
              <CircleCheck aria-hidden className="size-4 text-success-600" strokeWidth={1.75} />
            ) : (
              <Copy aria-hidden className="size-4" strokeWidth={1.75} />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Warning callout — same tinted-card recipe as <CreateKeyDialog>. */}
        <div
          role="note"
          className="rounded-md bg-warning-50 border border-warning-200 px-4 py-3"
        >
          <p className="font-sans text-sm font-medium text-warning-700 m-0">
            Store this somewhere safe
          </p>
          <p className="font-sans text-sm text-warning-700 m-0">
            Paste it into your secret manager or .env before closing. Once you close, we can&rsquo;t show it again. You&rsquo;ll need to rotate the key to get a new one.
          </p>
        </div>

        {/* Confirmation gate — Done stays disabled until this is checked. */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="apikey-saved-confirm"
            checked={saved}
            onCheckedChange={(next) => setSaved(next === true)}
          />
          <Label
            htmlFor="apikey-saved-confirm"
            className="text-neutral-700 text-sm font-normal"
          >
            I&rsquo;ve saved this key to a secret manager.
          </Label>
        </div>

        <DialogFooter>
          <DialogClose
            render={<Button type="button" variant="default" disabled={!saved} />}
          >
            Done
          </DialogClose>
        </DialogFooter>
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
