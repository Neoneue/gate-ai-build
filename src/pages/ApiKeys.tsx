import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BookOpen, CircleCheck, Copy, KeyRound, MoreHorizontal, Plus, ShieldOff } from 'lucide-react';
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
import {
  CodeBlock,
  CodeCard,
  CodeCardHeader,
  CodeCardTabs,
  linesToString,
  type CodeLine,
} from '@/components/ui/code-card';
import { CopyButton, useCopyFeedback } from '@/components/ui/copy-button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu';
import { PageTitle } from '@/components/ui/page-title';
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
      lastUsed: '1 day ago',
    },
    {
      id: 'sk-gw-9f3064ce',
      name: 'prod-agent',
      masked: 'sk-gw-…9f30',
      // Spiky — agent runs burst irregularly across the week.
      requests7d: [1, 8, 2, 11, 3, 9, 4],
      lastUsed: '2h ago',
    },
    {
      id: 'sk-gw-255e1d3a',
      name: 'test-key',
      masked: 'sk-gw-…255e',
      requests7d: [0, 0, 0, 0, 0, 0, 0],
      lastUsed: 'Never',
      revoked: true,
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
      lastUsed: 'Never',
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
        <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
          Keys authenticate every request through the gateway. Rotate on a schedule; scope after creation.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onCreate}>
          <Plus data-icon="inline-start" aria-hidden />
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
            <Plus data-icon="inline-start" aria-hidden />
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

// `sk-gw-…YOUR_KEY` is a stand-in. Tones match the request/response modal's
// JSON palette (property = blue, string = greenish-blue, variable = amber
// for fill-in placeholders) so code surfaces across the dashboard share a
// family. Three examples cover the most common ways to call the gateway:
// raw HTTP (curl), the Claude Code env-var pattern, and the OpenAI SDK.
// The gateway is provider-neutral — curl leads on purpose.

const CURL_LINES: CodeLine[] = [
  [
    { text: 'curl', tone: 'property' },
    { text: ' https://gateway-staging.constellationgate.ai/v1/chat/completions \\' },
  ],
  [
    { text: '  -H', tone: 'property' },
    { text: ' "X-Gateway-Api-Key: ', tone: 'string' },
    { text: 'sk-gw-…YOUR_KEY', tone: 'variable' },
    { text: '" \\', tone: 'string' },
  ],
  [
    { text: '  -H', tone: 'property' },
    { text: ' "Content-Type: application/json"', tone: 'string' },
    { text: ' \\' },
  ],
  [
    { text: '  -d', tone: 'property' },
    { text: ' \'{' },
    { text: '"model"', tone: 'property' },
    { text: ': ' },
    { text: '"claude-sonnet-4.8"', tone: 'string' },
    { text: ', ' },
    { text: '"messages"', tone: 'property' },
    { text: ': [{' },
    { text: '"role"', tone: 'property' },
    { text: ': ' },
    { text: '"user"', tone: 'string' },
    { text: ', ' },
    { text: '"content"', tone: 'property' },
    { text: ': ' },
    { text: '"Hello"', tone: 'string' },
    { text: '}]}\'' },
  ],
];

const CLAUDE_CODE_LINES: CodeLine[] = [
  [{ text: '# Point Claude Code at the gateway instead of Anthropic directly', tone: 'muted' }],
  [
    { text: 'export', tone: 'property' },
    { text: ' ANTHROPIC_BASE_URL=' },
    { text: '"https://gateway-staging.constellationgate.ai"', tone: 'string' },
  ],
  [{ text: '' }],
  [{ text: '# Add your gateway key so the gateway can authenticate requests', tone: 'muted' }],
  [
    { text: 'export', tone: 'property' },
    { text: ' ANTHROPIC_CUSTOM_HEADERS=' },
    { text: '"X-Gateway-Api-Key: ', tone: 'string' },
    { text: 'sk-gw-…YOUR_KEY', tone: 'variable' },
    { text: '"', tone: 'string' },
  ],
];

const OPENAI_SDK_LINES: CodeLine[] = [
  [
    { text: 'import', tone: 'property' },
    { text: ' OpenAI ' },
    { text: 'from', tone: 'property' },
    { text: ' ' },
    { text: "'openai'", tone: 'string' },
    { text: ';' },
  ],
  [{ text: '' }],
  [
    { text: 'const', tone: 'property' },
    { text: ' client = ' },
    { text: 'new', tone: 'property' },
    { text: ' OpenAI({' },
  ],
  [
    { text: '  baseURL: ' },
    { text: "'https://gateway-staging.constellationgate.ai/v1'", tone: 'string' },
    { text: ',' },
  ],
  [
    { text: '  apiKey: ' },
    { text: "'", tone: 'string' },
    { text: 'sk-gw-…YOUR_KEY', tone: 'variable' },
    { text: "'", tone: 'string' },
    { text: ',' },
  ],
  [{ text: '  defaultHeaders: {' }],
  [
    { text: '    ' },
    { text: "'X-Gateway-Api-Key'", tone: 'property' },
    { text: ': ' },
    { text: "'", tone: 'string' },
    { text: 'sk-gw-…YOUR_KEY', tone: 'variable' },
    { text: "'", tone: 'string' },
    { text: ',' },
  ],
  [{ text: '  },' }],
  [{ text: '});' }],
];

type ExampleTab = 'cURL' | 'Claude Code' | 'OpenAI SDK';

const EXAMPLE_LINES: Record<ExampleTab, CodeLine[]> = {
  cURL: CURL_LINES,
  'Claude Code': CLAUDE_CODE_LINES,
  'OpenAI SDK': OPENAI_SDK_LINES,
};

const EXAMPLE_TABS: ExampleTab[] = ['cURL', 'Claude Code', 'OpenAI SDK'];

function UsageInfo() {
  const [tab, setTab] = useState<ExampleTab>('cURL');
  const activeLines = EXAMPLE_LINES[tab];
  return (
    // max-w-3xl (768px) — code snippets don't earn 1200px of width; the
    // curl body line and the OpenAI SDK indentation both fit without
    // wrapping, with breathing room on the right.
    <section className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-lg font-medium text-ink-900 m-0">
          Using your key
        </h3>
        <p className="font-sans text-sm text-ink-500 m-0">
          Point your client at the gateway and send your key in the{' '}
          <code className="font-mono text-ink-800 bg-ink-100 rounded-xs px-2 py-1">X-Gateway-Api-Key</code>{' '}
          header. The gateway is provider-neutral — call it with curl, the OpenAI SDK, Anthropic SDK, or any other client that lets you override the base URL.
        </p>
        <p className="font-sans text-sm text-ink-500 m-0">
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

      <CodeCard>
        <CodeCardHeader>
          <CodeCardTabs
            items={EXAMPLE_TABS}
            active={tab}
            onChange={(v) => setTab(v as ExampleTab)}
          />
          <CopyButton
            mode="label"
            text="Copy code"
            value={linesToString(activeLines)}
            label={`${tab} snippet`}
          />
        </CodeCardHeader>
        <CodeBlock lines={activeLines} density="compact" />
      </CodeCard>
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
  return (
    <Card density="flush">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="whitespace-nowrap">Key</TableHead>
            <TableHead className="whitespace-nowrap">Status</TableHead>
            <TableHead className="whitespace-nowrap">7-day requests</TableHead>
            <TableHead className="whitespace-nowrap">Last used</TableHead>
            <TableHead aria-label="Actions" className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className={row.revoked ? 'opacity-60' : undefined}>
              {/* `name (sk-gw-…NNNN)` — name in dark ink, masked id dimmed
                  to ink-600. Single-line two-tone form shared with the
                  Events / Requests / Activity Key columns. */}
              <TableCell className="whitespace-nowrap font-mono">
                <span className="text-ink-800">{row.name}</span>
                <span className="text-ink-600"> ({row.masked})</span>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.revoked ? (
                  <Badge variant="neutral">Revoked</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Sparkline points={row.requests7d} width={96} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-ink-500">
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
            <DialogTitle className="font-sans text-lg/6 font-medium text-ink-900">
              Create API key
            </DialogTitle>
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
            <DialogTitle className="font-sans text-lg/6 font-medium text-ink-900">
              Key created. Copy it now.
            </DialogTitle>
          </div>
          <DialogDescription>
            This is the only time you will see the full key. We hash it at rest.
          </DialogDescription>
        </DialogHeader>

        {/* Key display — one merged surface: mono value + Copy split by a
            hairline divider. Custom button chrome (via useCopyFeedback) so the
            Copy segment sits flush inside the ink-100 well, no nested border. */}
        <div className="flex items-stretch overflow-hidden rounded-md border border-border bg-ink-100">
          <div className="flex-1 px-3 py-2 font-mono text-sm text-ink-800 break-all">
            {fullKey}
          </div>
          <button
            type="button"
            onClick={trigger}
            aria-label={copied ? 'Copied' : 'Copy API key'}
            className="flex shrink-0 items-center gap-2 border-l border-border px-4 font-sans text-sm font-medium text-ink-600 transition-colors duration-150 ease-out hover:bg-ink-200 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
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
            Paste it into your secret manager or .env before closing. Once you close, we can't show it again. You'll need to rotate the key to get a new one.
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
            className="text-ink-700 text-sm font-normal"
          >
            I've saved this key to a secret manager.
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
