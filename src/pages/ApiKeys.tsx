import {
  BookOpen,
  CircleCheck,
  Copy,
  KeyRound,
  Plus,
  Trash2,
} from "lucide-react";
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
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle } from "@/components/ui/page-title";
import { Sparkline } from "@/components/ui/sparkline";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsCount } from "@/components/ui/tabs-count";
import { TextLink } from "@/components/ui/text-link";
import { Timestamp } from "@/components/ui/timestamp";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { randomHex } from "@/lib/utils";
import { ConnectTabs } from "@/pages/DashboardDefault";

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
const API_KEYS_DOCS_URL = "https://docs.constellationgate.ai/api-keys";
const openDocs = () =>
  window.open(API_KEYS_DOCS_URL, "_blank", "noopener,noreferrer");

type ApiKeyRow = {
  id: string; // full id used for matching / dedup
  name: string; // user-supplied label
  masked: string; // `sk-gw-…3a8f` display form
  requests7d: number[]; // sparkline series; 7 daily buckets
  createdAt: Date; // when the key was minted
  lastUsed: Date | null; // null = never used (freshly-minted or revoked-untouched)
  revoked?: boolean; // greys out the row + disables actions when true
};

/** Comparable value per sortable column for the keys table. Numeric columns
 *  return a number; Date columns return the epoch ms; never-used (`lastUsed`
 *  null) → null so it sorts last. */
function apiKeySortValue(row: ApiKeyRow, key: string): string | number | null {
  switch (key) {
    case "name":
      return row.name;
    case "status":
      return row.revoked ? "Revoked" : "Active";
    case "requests7d":
      return row.requests7d.at(-1) ?? 0;
    case "createdAt":
      return row.createdAt.getTime();
    case "lastUsed":
      return row.lastUsed ? row.lastUsed.getTime() : null;
    default:
      return null;
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
  // Status tab — split the table into Active / Revoked scopes (Models-style
  // line tabs with count chips). Defaults to Active.
  const [keyStatus, setKeyStatus] = useState<"active" | "revoked">("active");
  // TEMP PREVIEW SEED — Chad's two active keys (prod-web, prod-agent) plus
  // a revoked test-key. Delete the array literal (replace with `[]`)
  // before testing the real add-key flow.
  const [keys, setKeys] = useState<ApiKeyRow[]>([
    {
      id: "sk-gw-c4aeb3a8",
      name: "prod-web",
      masked: "sk-gw-…c4ae",
      // Steady climb — prod-web traffic grows day-over-day.
      requests7d: [3, 5, 7, 6, 10, 9, 14],
      createdAt: new Date(2026, 3, 28, 10, 14, 22), // 2026-04-28 10:14:22
      lastUsed: new Date(2026, 4, 17, 9, 41, 6), // 2026-05-17 09:41:06
    },
    {
      id: "sk-gw-9f3064ce",
      name: "prod-agent",
      masked: "sk-gw-…9f30",
      // Spiky — agent runs burst irregularly across the week.
      requests7d: [1, 8, 2, 11, 3, 9, 4],
      createdAt: new Date(2026, 4, 8, 16, 2, 51), // 2026-05-08 16:02:51
      lastUsed: new Date(2026, 4, 18, 10, 12, 33), // 2026-05-18 10:12:33
    },
    {
      id: "sk-gw-255e1d3a",
      name: "test-key",
      masked: "sk-gw-…255e",
      requests7d: [0, 0, 0, 0, 0, 0, 0],
      createdAt: new Date(2026, 3, 18, 9, 0, 0), // 2026-04-18 09:00:00
      lastUsed: null,
      revoked: true,
    },
    {
      id: "sk-gw-ef72d1a9",
      name: "design-agent",
      masked: "sk-gw-…ef72",
      // Active — the design-dashboard session runs on this key.
      requests7d: [2, 4, 3, 7, 6, 9, 13],
      createdAt: new Date(2026, 5, 6, 18, 24, 22), // 2026-06-06 18:24:22
      lastUsed: new Date(2026, 5, 6, 18, 30, 12), // today
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
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, revoked: true } : k))
    );
  };

  const activeKeys = keys.filter((k) => !k.revoked);
  const revokedKeys = keys.filter((k) => k.revoked);
  const visibleKeys = keyStatus === "active" ? activeKeys : revokedKeys;

  return (
    <DashboardChrome
      activeNavId="api-keys"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader
        onCreate={keys.length === 0 ? undefined : () => setCreateOpen(true)}
      />
      {keys.length === 0 ? (
        <KeysEmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <Tabs
          className="gap-4"
          onValueChange={(v) => setKeyStatus(v as "active" | "revoked")}
          value={keyStatus}
        >
          <TabsList className="-mt-2 px-0" variant="line">
            <TabsTrigger value="active">
              Active
              <TabsCount>{activeKeys.length}</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="revoked">
              Revoked
              <TabsCount>{revokedKeys.length}</TabsCount>
            </TabsTrigger>
          </TabsList>
          {visibleKeys.length === 0 ? (
            <EmptyState
              body={
                keyStatus === "revoked"
                  ? "Keys you revoke will appear here. Revoking a key stops it authenticating immediately."
                  : "You have no active keys. Create one to start routing requests through the gateway."
              }
              icon={
                <div
                  aria-hidden
                  className="flex size-12 items-center justify-center rounded-full bg-muted"
                >
                  <KeyRound
                    className="size-5 text-neutral-700"
                    strokeWidth={1.75}
                  />
                </div>
              }
              title={`No ${keyStatus} keys`}
            />
          ) : (
            <KeysTable onRevoke={handleRevoke} rows={visibleKeys} />
          )}
        </Tabs>
      )}
      <UsageInfo />
      <CreateKeyDialog
        onCreate={handleCreate}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />
      <KeyCreatedDialog
        fullKey={createdKey}
        onClose={() => setCreatedKey(null)}
      />
    </DashboardChrome>
  );
}

// `onCreate` is optional: when omitted (the no-keys empty card is showing),
// the header drops its "Create key" button so the only CTA is the card's
// "Create your first key". The header button returns once keys exist.
export function PageHeader({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex max-w-1/2 flex-col gap-2">
        <PageTitle>API Keys</PageTitle>
        <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-tight">
          Create new keys and manage the ones already in use. Keys authenticate
          every request through the gateway.
        </p>
      </div>
      {onCreate ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onCreate}>
            <Plus
              aria-hidden
              className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none"
              data-icon="inline-start"
            />
            Create key
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function KeysEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      action={
        <div className="flex items-center gap-2 pt-4">
          <Button onClick={onCreate}>
            <Plus
              aria-hidden
              className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none"
              data-icon="inline-start"
            />
            Create your first key
          </Button>
          <Button onClick={openDocs} variant="outline">
            <BookOpen aria-hidden data-icon="inline-start" />
            Read the quickstart
          </Button>
        </div>
      }
      body="Create a key to start routing requests through the gateway. The full key is shown only once."
      icon={
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full bg-muted"
        >
          <KeyRound className="size-5 text-neutral-700" strokeWidth={1.75} />
        </div>
      }
      title="No API keys yet"
    />
  );
}

/* ─── Usage info ───────────────────────────────────────────────────────── */

// Provider SDK quickstarts (Anthropic / OpenAI / Google) reuse the hero
// card's CodePanel + snippets so the API Keys page and Overview stay in sync.

const CONNECT_TAB_IDS = ["gate-connect", "claude-code", "codex", "openclaw"];

export function UsageInfo() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab =
    tabParam && CONNECT_TAB_IDS.includes(tabParam) ? tabParam : undefined;
  // Right card never shows the Gate Connect tab, so a `?tab=gate-connect`
  // deep-link has no target there — fall back to its first tab.
  const rightDefaultTab =
    defaultTab && defaultTab !== "gate-connect" ? defaultTab : undefined;
  return (
    <section className="@container/connect flex flex-col gap-6">
      <div className="flex max-w-1/2 flex-col gap-2">
        <h3 className="m-0 text-balance font-medium font-sans text-lg text-neutral-900">
          How to make requests
        </h3>
        <p className="m-0 font-sans text-neutral-500 text-sm">
          There are two ways to start making requests using your API key. With{" "}
          <span className="font-medium">Gate Connect</span>, setup is automatic,
          so you can skip the code entirely. Want to configure it yourself? Use
          the code snippets to do it by hand.
        </p>
        <p className="m-0 font-sans text-neutral-500 text-sm">
          To learn more, check out our{" "}
          <TextLink
            as="a"
            href={API_KEYS_DOCS_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            API key docs
          </TextLink>
          .
        </p>
      </div>

      {/* Two cards: Gate Connect (1-click setup, no tab strip) on the left,
          the manual-setup code tabs (no Gate Connect tab) on the right.
          Side-by-side with a 24px gap; stacks full-width below lg. */}
      <div className="flex @min-[993px]/connect:flex-row flex-col gap-6">
        {/* Each card gets an Eyebrow label above it (outside the card, so no
            height impact) so the two setup paths — Automatic vs Manual — read
            as a matched pair even though the right card is a code card with no
            internal title slot. */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Eyebrow as="div">Automatic</Eyebrow>
          <Card className="flex flex-1 flex-col" density="flush">
            <div className="flex flex-1 flex-col">
              <ConnectTabs
                fillHeight
                gateConnectOnly
                imageClassName="pointer-events-none select-none absolute top-1/2 right-0 -translate-y-1/2 @min-[1632px]/connect:translate-y-[calc(-50%_+_8px)] translate-x-[clamp(0px,calc(253px_-_34.375cqw),88px)] w-[491.144px] @min-[993px]/connect:translate-x-[calc(clamp(0px,calc(296.64px_-_18cqw),72px)_+_clamp(0px,calc(534.856px_-_42.857cqw),24px))] @min-[993px]/connect:w-[clamp(467.756px,calc(306.735px_+_12.9023cqw),517.301px)] scale-[0.6914426] origin-right @min-[992px]/connect:@max-[1192px]/connect:hidden"
                textMaxWidth="max-w-[350px] @min-[993px]/connect:max-w-[clamp(302px,calc(42px_+_20.8333cqw),382px)]"
                titleClassName="text-2xl @min-[993px]/connect:text-[clamp(20px,calc(7.52px_+_1cqw),24px)] @min-[993px]/connect:leading-[clamp(28px,calc(15.52px_+_1cqw),32px)] font-medium tracking-tight text-neutral-900 text-balance m-0"
              />
            </div>
          </Card>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Eyebrow as="div">Manual</Eyebrow>
          <Card className="flex flex-1 flex-col" density="flush">
            <div className="flex-1">
              <ConnectTabs
                codeMaxHeight="h-[208px]"
                defaultTab={rightDefaultTab}
                floatingCopy
                showGateConnect={false}
              />
            </div>
          </Card>
        </div>
      </div>
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
    [rows, sort]
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
              <SortableTableHead
                className="w-1/5 whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="name"
              >
                Key
              </SortableTableHead>
              <SortableTableHead
                className="w-1/5 whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="status"
              >
                Status
              </SortableTableHead>
              <SortableTableHead
                className="w-1/5 whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="requests7d"
              >
                7-day requests
              </SortableTableHead>
              <SortableTableHead
                className="w-1/5 whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="createdAt"
              >
                Created
              </SortableTableHead>
              <SortableTableHead
                className="w-1/5 whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="lastUsed"
              >
                Last used
              </SortableTableHead>
              <TableHead aria-label="Actions" className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow
                className={row.revoked ? "opacity-60" : undefined}
                key={row.id}
              >
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
                <TableCell className="whitespace-nowrap text-right">
                  {row.revoked ? null : (
                    <IconActionButton
                      aria-label={`Revoke ${row.name}`}
                      onClick={() => setPendingRevoke(row)}
                    >
                      <Trash2
                        aria-hidden
                        className="size-4"
                        strokeWidth={1.75}
                      />
                    </IconActionButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingRevoke(null);
          }
        }}
        open={pendingRevoke !== null}
      >
        <DialogContent className="p-4 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke {pendingRevoke?.name}?</DialogTitle>
            <DialogDescription>
              This key will stop authenticating requests immediately. Revocation
              can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={() => {
                if (pendingRevoke) {
                  onRevoke(pendingRevoke.id);
                }
                setPendingRevoke(null);
              }}
              type="button"
              variant="destructive"
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

export function CreateKeyDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreate: (input: { name: string }) => void;
}) {
  const [name, setName] = useState("");

  const isValid = name.trim().length > 0;

  return (
    <Dialog
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName("");
        }
      }}
      open={open}
    >
      <DialogContent className="gap-4 sm:max-w-lg">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValid) {
              return;
            }
            onCreate({ name });
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-medium font-sans text-lg/6 text-neutral-900">
              Create API key
            </DialogTitle>
            <DialogDescription>
              Keys inherit all model access by default. Scope can be restricted
              after creation.
            </DialogDescription>
          </DialogHeader>

          {/* Name — required */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label
                className="font-medium text-neutral-600 text-sm"
                htmlFor="apikey-name"
              >
                Name
              </Label>
              <span className="font-sans text-neutral-500 text-xs">
                Shown in logs and audit events.
              </span>
            </div>
            <Input
              autoComplete="off"
              className="font-mono text-sm"
              id="apikey-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="server · new-service"
              required
              spellCheck={false}
              type="text"
              value={name}
            />
          </div>

          {/* Warning callout — tinted card, not inline-icon text. Modal-
              interior radius is rounded-md (8px) per design system. */}
          <div
            className="rounded-md border border-warning-200 bg-warning-50 px-4 py-3"
            role="note"
          >
            <p className="m-0 font-sans text-sm text-warning-700">
              The full key will only be shown once. Store it securely.
            </p>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button disabled={!isValid} type="submit" variant="default">
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
export function KeyCreatedDialog({
  fullKey,
  onClose,
}: {
  fullKey: string | null;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const { copied, trigger } = useCopyFeedback({
    value: fullKey ?? "",
    label: "API key",
  });

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) {
          onClose();
          // Reset the confirmation gate so reopening starts unchecked.
          setSaved(false);
        }
      }}
      open={fullKey !== null}
    >
      <DialogContent className="gap-4 sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CircleCheck
              aria-hidden
              className="size-5 shrink-0 text-success-600"
              strokeWidth={1.75}
            />
            <DialogTitle className="font-medium font-sans text-lg/6 text-neutral-900">
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
          <div className="flex-1 break-all px-3 py-2 font-mono text-neutral-800 text-sm">
            {fullKey}
          </div>
          <button
            aria-label={copied ? "Copied" : "Copy API key"}
            className="flex shrink-0 items-center gap-2 border-border border-l px-4 font-medium font-sans text-neutral-600 text-sm transition-[colors,scale] duration-150 ease-out hover:bg-neutral-200 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
            onClick={trigger}
            type="button"
          >
            {copied ? (
              <CircleCheck
                aria-hidden
                className="size-4 text-success-600"
                strokeWidth={1.75}
              />
            ) : (
              <Copy aria-hidden className="size-4" strokeWidth={1.75} />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Warning callout — same tinted-card recipe as <CreateKeyDialog>. */}
        <div
          className="rounded-md border border-warning-200 bg-warning-50 px-4 py-3"
          role="note"
        >
          <p className="m-0 font-medium font-sans text-sm text-warning-700">
            Store this somewhere safe
          </p>
          <p className="m-0 font-sans text-sm text-warning-700">
            Paste it into your secret manager or .env before closing. Once you
            close, we can&rsquo;t show it again. You&rsquo;ll need to rotate the
            key to get a new one.
          </p>
        </div>

        {/* Confirmation gate — Done stays disabled until this is checked. */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={saved}
            id="apikey-saved-confirm"
            onCheckedChange={(next) => setSaved(next === true)}
          />
          <Label
            className="font-normal text-neutral-700 text-sm"
            htmlFor="apikey-saved-confirm"
          >
            I&rsquo;ve saved this key to a secret manager.
          </Label>
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button disabled={!saved} type="button" variant="default" />
            }
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
