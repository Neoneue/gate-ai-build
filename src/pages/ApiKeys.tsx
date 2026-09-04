import { BookOpen, CircleCheck, KeyRound, Plus, Trash2 } from "lucide-react";
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
import { CopyButton } from "@/components/ui/copy-button";
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
import { API_KEY_SEED_ROWS, type ApiKeyRow } from "@/data/api-keys";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { randomHex } from "@/lib/utils";
import { ConnectTabs } from "@/pages/DashboardDefault";
import { currentUserId, useViewRole } from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * API Keys page (route: /api-keys, sidebar: "API Keys")
 *
 * Manages the workspace's API keys. Seeded with the mock rows in
 * src/data/api-keys.ts; replace with `[]` to exercise the empty state. Create flow lives in <CreateKeyDialog>; revoke is a row-
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

/** Comparable value per sortable column for the keys table. Numeric columns
 *  return a number; Date columns return the epoch ms; never-used (`lastUsed`
 *  null) → null so it sorts last. */
function apiKeySortValue(row: ApiKeyRow, key: string): string | number | null {
  switch (key) {
    case "name":
      return row.name;
    case "status":
      return row.revoked ? "Revoked" : "Active";
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
  // TEMP PREVIEW SEED — lives in src/data/api-keys.ts (shared with the
  // notifications feed). Replace with `[]` to exercise the empty state.
  const [keys, setKeys] = useState<ApiKeyRow[]>(API_KEY_SEED_ROWS);
  // Managers and members see and mint their OWN keys (PRD 3: regular users;
  // attribution is by key owner). Admin sees the org's.
  const viewRole = useViewRole();
  const ownKeys =
    viewRole === "admin"
      ? keys
      : keys.filter((k) => k.ownerId === currentUserId());
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
      // The signed-in user mints the key, so they own it.
      ownerId: currentUserId(),
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

  const activeKeys = ownKeys.filter((k) => !k.revoked);
  const revokedKeys = ownKeys.filter((k) => k.revoked);
  const visibleKeys = keyStatus === "active" ? activeKeys : revokedKeys;

  return (
    <DashboardChrome
      activeNavId="api-keys"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          onCreate={
            ownKeys.length === 0 ? undefined : () => setCreateOpen(true)
          }
        />
        {ownKeys.length === 0 ? (
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
                    : "You have no active keys. Create one to start routing messages through the gateway."
                }
                icon={
                  <div
                    aria-hidden
                    className="flex size-12 items-center justify-center rounded-full bg-muted"
                  >
                    <KeyRound
                      className="size-5 text-muted-foreground"
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
      </div>
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

// Shared "Create key" trigger — same chrome as the API Keys page header CTA.
export function CreateKeyButton({
  onClick,
  children = "Create key",
  size = "default",
  disabled,
}: {
  onClick: () => void;
  children?: React.ReactNode;
  size?: React.ComponentProps<typeof Button>["size"];
  disabled?: boolean;
}) {
  return (
    <Button disabled={disabled} onClick={onClick} size={size}>
      <Plus
        aria-hidden
        className="transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none"
        data-icon="inline-start"
      />
      {children}
    </Button>
  );
}

// `onCreate` is optional: when omitted (the no-keys empty card is showing),
// the header drops its "Create key" button so the only CTA is the card's
// "Create your first key". The header button returns once keys exist.
export function PageHeader({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        <PageTitle>API keys</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Create new keys and manage the ones already in use. Keys authenticate
          every request through the gateway.
        </p>
      </div>
      {onCreate ? (
        <div className="flex flex-wrap items-center gap-2">
          <CreateKeyButton onClick={onCreate} />
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
          <CreateKeyButton onClick={onCreate}>
            Create your first key
          </CreateKeyButton>
          <Button onClick={openDocs} size="default" variant="outline">
            <BookOpen aria-hidden data-icon="inline-start" />
            Read the quickstart
          </Button>
        </div>
      }
      body="Create a key to start routing messages through the gateway. The full key is shown only once."
      icon={
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full bg-muted"
        >
          <KeyRound
            className="size-5 text-muted-foreground"
            strokeWidth={1.75}
          />
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
    <section className="@container/connect mt-2 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="type-heading-24 m-0 text-balance text-foreground">
          How to make messages
        </h2>
        <p className="type-copy-14 m-0 text-muted-foreground">
          There are two ways to start making messages using your API key. With{" "}
          <span className="font-medium">Gate Connect</span>, setup is automatic,
          so you can skip the code entirely. Want to configure it yourself? Use
          the code snippets to do it by hand.
        </p>
        <p className="type-copy-14 m-0 text-muted-foreground">
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

      {/* Automatic + Manual setup cards, always stacked full-width (one card
          per row, 24px gap) at every width. */}
      <div className="flex flex-col gap-6">
        {/* Each card gets an Eyebrow label above it (outside the card, so no
            height impact) so the two setup paths — Automatic vs Manual — read
            as a matched pair even though the right card is a code card with no
            internal title slot. */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Eyebrow as="div">Automatic</Eyebrow>
          <Card className="flex flex-1 flex-col" density="flush">
            <div className="flex flex-1 flex-col">
              {/* The app-preview image and the blurb's width cap both key off
                  the `@container/connect` section above, NOT the viewport.
                  `lg:` showed the 323px-wide image inside a 372px card when
                  the Ask AI panel was open. 672px is the section's width at
                  the old `lg` viewport, so panel-closed desktop is unchanged
                  while the narrowed column now hides it. Written as
                  `@min-[672px]` rather than `@2xl` on purpose: Tailwind orders
                  arbitrary container mins ahead of the named steps, so a named
                  `@2xl` here LOST to the 993px rule below it and capped the
                  blurb at 350px where it should read 400px. Same scale = right
                  cascade. The `lg:` that used to be stacked on the 993px rule
                  is gone: the section can only reach 993px when the viewport is
                  already well past `lg`, so it never contributed. Named
                  container throughout — this surface already spoke `/connect`. */}
              <ConnectTabs
                fillHeight
                gateConnectOnly
                imageClassName="hidden @min-[672px]/connect:block pointer-events-none select-none absolute top-1/2 right-0 -translate-y-1/2 w-[467.756px] scale-[0.6914426] origin-right"
                textMaxWidth="max-w-full @min-[672px]/connect:max-w-[350px] @min-[993px]/connect:max-w-[400px]"
                titleClassName="text-xl @min-[993px]/connect:text-[clamp(20px,calc(7.52px_+_1cqw),24px)] @min-[993px]/connect:leading-[clamp(28px,calc(15.52px_+_1cqw),32px)] font-medium tracking-tight text-foreground text-balance m-0"
              />
            </div>
          </Card>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Eyebrow as="div">Manual</Eyebrow>
          <Card className="flex flex-1 flex-col" density="flush">
            <div className="flex-1">
              <ConnectTabs
                codeMaxHeight="h-[216px]"
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
        <Table className="min-w-[1000px] table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Five data columns at w-1/5 + a fixed-width Actions column.
               *  Created and Last used sit at the right of the row — the date
               *  pair is the row's "freshness" data, so they cluster. */}
              <SortableTableHead
                className="w-[32%] whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="name"
              >
                Key
              </SortableTableHead>
              <SortableTableHead
                className="w-[16%] whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="status"
              >
                Status
              </SortableTableHead>
              <SortableTableHead
                className="w-[26%] whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="createdAt"
              >
                Created
              </SortableTableHead>
              <SortableTableHead
                className="w-[26%] whitespace-nowrap"
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
                <TableCell className="type-mono-14 whitespace-nowrap">
                  <span className="text-foreground">{row.name}</span>
                  <span className="text-muted-foreground"> ({row.masked})</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {row.revoked ? (
                    <Badge variant="neutral">Revoked</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                  <Timestamp date={row.createdAt} />
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
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
              This key will stop authenticating messages immediately. Revocation
              can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button size="default" type="button" variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={() => {
                if (pendingRevoke) {
                  onRevoke(pendingRevoke.id);
                }
                setPendingRevoke(null);
              }}
              size="default"
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
  onCancel,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreate: (input: { name: string }) => void;
  /** Optional — e.g. Gate Connect onboarding skips key creation on Cancel. */
  onCancel?: () => void;
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
            <DialogTitle className="type-heading-20 text-foreground">
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
                className="type-label-14 text-muted-foreground"
                htmlFor="apikey-name"
              >
                Name
              </Label>
              <span className="type-copy-12 text-muted-foreground">
                Shown in logs and audit events.
              </span>
            </div>
            <Input
              autoComplete="off"
              className="type-mono-14"
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
            className="rounded-md border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-500/30 dark:bg-warning-500/15"
            role="note"
          >
            <p className="type-copy-14 m-0 text-warning-700 dark:text-warning-300">
              The full key will only be shown once. Store it securely.
            </p>
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button
                  onClick={() => onCancel?.()}
                  size="default"
                  type="button"
                  variant="outline"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              disabled={!isValid}
              size="default"
              type="submit"
              variant="default"
            >
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
            <DialogTitle className="type-heading-20 text-foreground">
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
        <div className="flex items-stretch overflow-hidden rounded-md border border-border bg-muted">
          <div className="type-mono-14 flex-1 break-all px-3 py-2 text-foreground">
            {fullKey}
          </div>
          <CopyButton
            label="API key"
            mode="label"
            size="segment"
            value={fullKey ?? ""}
          />
        </div>

        {/* Warning callout — same tinted-card recipe as <CreateKeyDialog>. */}
        <div
          className="rounded-md border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-500/30 dark:bg-warning-500/15"
          role="note"
        >
          <p className="type-label-14 m-0 text-warning-700 dark:text-warning-300">
            Store this somewhere safe
          </p>
          <p className="type-copy-14 m-0 text-warning-700 dark:text-warning-300">
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
            className="type-label-14 text-muted-foreground"
            htmlFor="apikey-saved-confirm"
          >
            I&rsquo;ve saved this key to a secret manager.
          </Label>
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button
                disabled={!saved}
                size="default"
                type="button"
                variant="default"
              />
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
