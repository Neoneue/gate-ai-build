import { Archive, AtSign, Bell, Pencil } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle } from "@/components/ui/page-title";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionTitle } from "@/components/ui/section-title";
import { Switch } from "@/components/ui/switch";
import {
  NavTableRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsCount } from "@/components/ui/tabs-count";
import { fmtRelative } from "@/data/audit-trail";
import type {
  ChannelSelection,
  EmailFrequency,
  NotificationPrefs,
  NotificationTypeId,
  SecurityScope,
} from "@/data/notification-catalog";
import {
  buildConfiguredPrefs,
  buildDefaultPrefs,
  EMAIL_FREQUENCIES,
  NOTIFICATION_CATALOG,
  NOTIFICATION_GROUPS,
  ORG_NOTIFICATION_CATALOG,
  PREFS_STORAGE_KEY,
} from "@/data/notification-catalog";
import type { NotificationItem } from "@/data/notifications";
import { NOTIFICATION_HISTORY, NOTIFICATIONS_NOW } from "@/data/notifications";
import {
  archiveOne,
  markRead,
  useNotificationsReadState,
} from "@/data/notifications-store";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { cn } from "@/lib/utils";
import { POLICIES } from "@/pages/policies/config";

/* ─────────────────────────────────────────────────────────────────────────
 * My Notifications — phase 2 of the notifications PRD.
 *
 * The workspace's delivery preferences plus the read-only history of what
 * has already fired. Composition follows Settings.tsx exactly: PageTitle,
 * then titled sections stacked in the page column, each section's
 * SectionTitle (+ subtitle where it earns one) ABOVE its card, never inside
 * it. Cards carry data only — no CardHeader anywhere on this page.
 *
 *   1. Delivery channels   master In-app / Email rows, each a round icon +
 *                          name + one-line subtext with the control far
 *                          right. Email reveals its frequency multi-select
 *                          in-row when it is on. Both masters GATE the
 *                          matrix below: a channel that is off renders its
 *                          whole column disabled with the checked state
 *                          preserved, so turning the master back on
 *                          restores exactly what was there. SMS is NOT on
 *                          this card — it ships in a later slice and a
 *                          permanently-dead control is worse than none.
 *   2. Five catalog groups One titled section per NOTIFICATION_GROUPS
 *                          entry. Column headers ("Email", "In-app") sit on
 *                          the section-title line, outside the card, in the
 *                          same fixed-width columns the rows use, so every
 *                          section's checkboxes land on the same two x
 *                          positions down the whole page.
 *   3. Security event      Scope config, revealed inside the Security card
 *      scope               directly under its row once that type has any
 *                          channel checked. Modes COMBINE per the PRD: an
 *                          event must match every filter that is set.
 *   4. Organization        Org-admin-only, org-wide types. Pro twin only.
 *   5. Recent              The FULL in-app history (NOTIFICATION_HISTORY),
 *      notifications       paginated 10 to a page — the bell only peeks at
 *                          the newest NOTIFICATIONS_CAP of the same list.
 *                          Same read state and same row shape as the bell,
 *                          each row deep-linking to the thing that fired.
 *
 * Every value on the page traces to real data: NOTIFICATION_CATALOG /
 * ORG_NOTIFICATION_CATALOG for the types, EMAIL_FREQUENCIES for the digest
 * options, POLICIES for the policy narrowing names, NOTIFICATION_HISTORY for
 * the feed. Nothing is invented here.
 *
 * TIER FORK: four props, no copied sections. `NotificationsFree` renders
 * `<Notifications showOrgSection={false} />`; `NotificationsDefault` renders
 * the fresh-workspace variant. This file stays the single source of truth.
 * ───────────────────────────────────────────────────────────────────────── */

export type NotificationsProps = {
  /** Which prefs the page opens on. `configured` = the Pro demo workspace's
   *  saved state (buildConfiguredPrefs); `default` = the ticket defaults a
   *  brand-new workspace gets with no setup (buildDefaultPrefs). */
  seed?: "configured" | "default";
  /** Hydrate from and write back to localStorage under PREFS_STORAGE_KEY.
   *  False on a fresh workspace: there is nothing saved to read, and the
   *  -default twin is a snapshot of "before any of this was touched", so it
   *  must not pick up a real visit's writes. */
  persist?: boolean;
  /** Render the org-admin "Organization" section. Org-wide types are an
   *  admin surface — a Free workspace has no org to administer. */
  showOrgSection?: boolean;
  /** Render the real feed in "Recent notifications". False renders the
   *  empty band: a new workspace has not fired anything yet. */
  hasFeed?: boolean;
};

export function Notifications({
  seed = "configured",
  persist = true,
  showOrgSection = true,
  hasFeed = true,
}: NotificationsProps = {}) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="notifications"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <NotificationsSurface
        hasFeed={hasFeed}
        persist={persist}
        seed={seed}
        showOrgSection={showOrgSection}
      />
    </DashboardChrome>
  );
}

/* ─── Channel columns ──────────────────────────────────────────────────────
 * One declaration drives the section-line headers AND the per-row cells, so
 * the two can never drift out of alignment. `CHANNEL_COL` is the shared
 * column width; the header strip carries the card's own `px-4` as `pr-4` so
 * a header sits exactly over the checkbox beneath it. */

const CHANNEL_COL = "w-16";

const CHANNEL_COLUMNS: Array<{ key: keyof ChannelSelection; label: string }> = [
  { key: "email", label: "Email" },
  { key: "inApp", label: "In-app" },
];

/** The one mock identity, same address Settings' Profile card renders. */
const ACCOUNT_EMAIL = "chad@constellationnetwork.io";

/** Security-event narrowing by guardrail action (PRD). Ids match the
 *  `action` values the Policies page writes. */
const SCOPE_ACTIONS: Array<{ id: string; label: string }> = [
  { id: "flag", label: "Flag" },
  { id: "redact", label: "Redact" },
  { id: "block", label: "Block" },
];

/* ─── Persisted prefs ────────────────────────────────────────────────────
 * The delivery prefs DO persist (notifications.prefs.v1) — a configuration
 * the user set should still be there next visit. Read state does not; that
 * is the in-memory demo store, see the feed section below. Every field is
 * re-validated against the seed on the way in, because a stored record is
 * user data round-tripped through JSON and a corrupted entry must not be
 * able to render a broken page. */

const FREQUENCY_IDS = new Set<string>(EMAIL_FREQUENCIES.map((f) => f.id));
const POLICY_IDS = new Set<string>(POLICIES.map((p) => p.id));
const ACTION_IDS = new Set<string>(SCOPE_ACTIONS.map((a) => a.id));

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function countOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function idsIn(value: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (id): id is string => typeof id === "string" && allowed.has(id)
  );
}

function frequencyOr(
  value: unknown,
  fallback: EmailFrequency[]
): EmailFrequency[] {
  const kept = idsIn(value, FREQUENCY_IDS) as EmailFrequency[];
  // At least one frequency must always be selected — an email channel that
  // is on with no schedule would silently deliver nothing.
  return kept.length > 0 ? kept : fallback;
}

function typesOr(
  value: unknown,
  fallback: Record<NotificationTypeId, ChannelSelection>
): Record<NotificationTypeId, ChannelSelection> {
  const stored = (value ?? {}) as Record<string, Partial<ChannelSelection>>;
  const out = {} as Record<NotificationTypeId, ChannelSelection>;
  // Walk the CATALOG, never the stored keys: a type added to the catalog
  // after the record was written picks up its default instead of vanishing.
  for (const type of NOTIFICATION_CATALOG) {
    const seed = fallback[type.id];
    out[type.id] = {
      email: boolOr(stored[type.id]?.email, seed.email),
      inApp: boolOr(stored[type.id]?.inApp, seed.inApp),
    };
  }
  return out;
}

function scopeOr(value: unknown, fallback: SecurityScope): SecurityScope {
  const stored = (value ?? {}) as Partial<SecurityScope>;
  return {
    mode: stored.mode === "narrowed" ? "narrowed" : "all",
    policyIds: idsIn(stored.policyIds, POLICY_IDS),
    actions: idsIn(stored.actions, ACTION_IDS),
    rate: {
      enabled: boolOr(stored.rate?.enabled, fallback.rate.enabled),
      count: countOr(stored.rate?.count, fallback.rate.count),
      windowHours: countOr(stored.rate?.windowHours, fallback.rate.windowHours),
    },
  };
}

function hydratePrefs(seed: NotificationPrefs): NotificationPrefs {
  if (typeof window === "undefined") {
    return seed;
  }
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) {
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      channels: {
        email: boolOr(parsed.channels?.email, seed.channels.email),
        inApp: boolOr(parsed.channels?.inApp, seed.channels.inApp),
      },
      emailFrequency: frequencyOr(parsed.emailFrequency, seed.emailFrequency),
      types: typesOr(parsed.types, seed.types),
      securityScope: scopeOr(parsed.securityScope, seed.securityScope),
    };
  } catch {
    return seed;
  }
}

function writePrefs(next: NotificationPrefs) {
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — drop silently */
  }
}

/* ─── Page surface ─────────────────────────────────────────────────────── */

function NotificationsSurface({
  seed,
  persist,
  showOrgSection,
  hasFeed,
}: Required<NotificationsProps>) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => {
    const base =
      seed === "default" ? buildDefaultPrefs() : buildConfiguredPrefs();
    return persist ? hydratePrefs(base) : base;
  });

  // Org selections live outside NotificationPrefs — the persisted model has
  // no org field, and inventing one here would write a shape the data layer
  // does not declare. In-memory, seeded from the catalog's defaultOn.
  const [orgPrefs, setOrgPrefs] = useState<Record<string, ChannelSelection>>(
    () => {
      const out: Record<string, ChannelSelection> = {};
      for (const type of ORG_NOTIFICATION_CATALOG) {
        out[type.id] = { email: type.defaultOn, inApp: false };
      }
      return out;
    }
  );

  const commit = (next: NotificationPrefs) => {
    setPrefs(next);
    if (persist) {
      writePrefs(next);
    }
  };

  const setChannel = (key: keyof ChannelSelection, on: boolean) => {
    commit({ ...prefs, channels: { ...prefs.channels, [key]: on } });
    // Email OFF is the one channel change with a consequence the user
    // cannot see: in-app delivery still shows up in the bell, but email
    // silently stops leaving the product. Confirm it out loud, and only in
    // that direction — turning it back on is self-evident from the feed.
    if (key === "email" && !on) {
      toast("Email notifications turned off", {
        description:
          "Your selections are kept and resume when you turn it back on.",
      });
    }
  };

  const toggleType = (id: NotificationTypeId, key: keyof ChannelSelection) =>
    commit({
      ...prefs,
      types: {
        ...prefs.types,
        [id]: { ...prefs.types[id], [key]: !prefs.types[id][key] },
      },
    });

  const setFrequency = (id: EmailFrequency, on: boolean) => {
    const next = on
      ? [...prefs.emailFrequency, id]
      : prefs.emailFrequency.filter((f) => f !== id);
    // Guard rather than trust the control: the last selected frequency is
    // rendered disabled, so this only fires on a real change.
    if (next.length === 0) {
      return;
    }
    commit({ ...prefs, emailFrequency: next });
  };

  const setScope = (patch: Partial<SecurityScope>) =>
    commit({ ...prefs, securityScope: { ...prefs.securityScope, ...patch } });

  const toggleOrg = (id: string, key: keyof ChannelSelection) =>
    setOrgPrefs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: !prev[id][key] },
    }));

  const security = prefs.types["security-event"];
  const scopeOpen = security.email || security.inApp;

  return (
    /* Content stays fluid, then caps so the cards don't stretch across
       ultrawide displays. CONTAINER query, not viewport: `<main>` declares
       `@container` and the Ask AI panel narrows this column without
       narrowing the window. Same cap and rhythm as Settings. */
    <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
      <PageHeader />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <SectionTitle as="h2">Delivery channels</SectionTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
            Where notifications reach you. Turning a channel off disables its
            column below and keeps your selections.
          </p>
        </div>
        <ChannelsCard
          onSetChannel={setChannel}
          onSetFrequency={setFrequency}
          prefs={prefs}
        />
      </div>

      {NOTIFICATION_GROUPS.map((group) => (
        <CatalogSection
          extras={
            group.id === "security" && scopeOpen
              ? {
                  "security-event": (
                    <SecurityScopePanel
                      onSetScope={setScope}
                      scope={prefs.securityScope}
                    />
                  ),
                }
              : undefined
          }
          key={group.id}
          masters={prefs.channels}
          onToggle={toggleType}
          rows={NOTIFICATION_CATALOG.filter(
            (type) => type.group === group.id
          ).map((type) => ({
            id: type.id,
            name: type.name,
            description: type.description,
            selection: prefs.types[type.id],
          }))}
          title={group.title}
        />
      ))}

      {showOrgSection ? (
        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <SectionTitle as="h2">Organization</SectionTitle>
              <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
                As an org admin you receive these for the whole organization,
                not just your own activity.
              </p>
            </div>
            <ColumnHeaders />
          </div>
          <Card density="flush">
            <div className="divide-y divide-border">
              {ORG_NOTIFICATION_CATALOG.map((type) => (
                <TypeRow
                  description={type.description}
                  key={type.id}
                  masters={prefs.channels}
                  name={type.name}
                  onToggle={(key) => toggleOrg(type.id, key)}
                  rowId={`org-${type.id}`}
                  selection={orgPrefs[type.id]}
                />
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      <FeedSection hasFeed={hasFeed} />
    </div>
  );
}

/* ─── Page header ───────────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        <PageTitle>My Notifications</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Manage how this workspace's notifications reach you.
        </p>
      </div>
    </div>
  );
}

/* ─── Delivery channels card ───────────────────────────────────────────────
 * Three master rows, full-bleed dividers (`density="flush"` + `divide-y`, so
 * the rules run the card's whole width the way the reference does). The
 * round icon chip is the row's identity glyph; the control sits far right,
 * vertically centred on the row's text block. */

function ChannelRow({
  children,
  control,
  icon: Icon,
  id,
  name,
  subtext,
  value,
  valueAction,
}: {
  /** Revealed block below the row — the email frequency multi-select. */
  children?: React.ReactNode;
  control: React.ReactNode;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  id: string;
  name: string;
  subtext: string;
  /** A data line under the subtext (the account's email address). */
  value?: string;
  /** Affordance parked on the value line — the Email row's edit shortcut.
   *  A node, like `control`, so the row stays presentational and only the
   *  call site knows where the value is actually changed. */
  valueAction?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted"
        >
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Label className="type-label-14 text-foreground" htmlFor={id}>
            {name}
          </Label>
          <p className="type-copy-12 m-0 text-pretty text-muted-foreground">
            {subtext}
          </p>
          {value ? (
            /* The address is the answer to "where does this go?", so it
               carries full-strength ink while the subtext above it stays
               muted — the mono voice is what marks it as a data value, not
               the colour. The 24px icon button sets the line box (16px text
               → 24px row), which is still a 4px step, so the column's gap-1
               rhythm holds; no negative margin needed. */
            <div className="flex items-center gap-1">
              <p className="type-mono-12 m-0 text-foreground">{value}</p>
              {valueAction}
            </div>
          ) : null}
        </div>
        <div className="shrink-0">{control}</div>
      </div>
      {/* 44px indent = the 32px chip + the 12px row gap, so the revealed
          block starts on the same x as the row's name. */}
      {children ? <div className="pt-4 pl-11">{children}</div> : null}
    </div>
  );
}

function ChannelsCard({
  prefs,
  onSetChannel,
  onSetFrequency,
}: {
  prefs: NotificationPrefs;
  onSetChannel: (key: keyof ChannelSelection, on: boolean) => void;
  onSetFrequency: (id: EmailFrequency, on: boolean) => void;
}) {
  const navigate = useNavigate();
  const onlyOne = prefs.emailFrequency.length === 1;

  return (
    <Card density="flush">
      <div className="divide-y divide-border">
        <ChannelRow
          control={
            <Switch
              checked={prefs.channels.inApp}
              id="notif-channel-in-app"
              onCheckedChange={(next) => onSetChannel("inApp", next === true)}
            />
          }
          icon={Bell}
          id="notif-channel-in-app"
          name="In-app"
          subtext="Receive notifications in the in-app feed and the top-bar bell."
        />
        <ChannelRow
          control={
            <Switch
              checked={prefs.channels.email}
              id="notif-channel-email"
              onCheckedChange={(next) => onSetChannel("email", next === true)}
            />
          }
          icon={AtSign}
          id="notif-channel-email"
          name="Email"
          subtext="Receive notifications at your selected email address."
          value={ACCOUNT_EMAIL}
          valueAction={
            /* The address is owned by the Settings Profile card, so this is
               a shortcut to the one field that changes it — not a second
               editor for the same value. */
            <Button
              aria-label="Change email in Settings"
              onClick={() => navigate("/settings")}
              size="icon-xs"
              variant="ghost"
            >
              <Pencil aria-hidden strokeWidth={1.75} />
            </Button>
          }
        >
          {prefs.channels.email ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <SectionHeading as="h4">Email frequency</SectionHeading>
                <p className="type-copy-12 m-0 text-pretty text-muted-foreground">
                  Real-time sends each notification as it fires; the others
                  batch into a digest. At least one has to stay selected.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {EMAIL_FREQUENCIES.map((frequency) => {
                  const on = prefs.emailFrequency.includes(frequency.id);
                  return (
                    <div className="flex flex-col gap-1" key={frequency.id}>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={on}
                          disabled={on && onlyOne}
                          id={`notif-frequency-${frequency.id}`}
                          onCheckedChange={(next) =>
                            onSetFrequency(frequency.id, next === true)
                          }
                        />
                        <Label
                          className="type-label-14 text-foreground"
                          htmlFor={`notif-frequency-${frequency.id}`}
                        >
                          {frequency.label}
                        </Label>
                      </div>
                      {/* 28px = the 16px box + the 12px gap. */}
                      <p className="type-copy-12 m-0 pl-7 text-muted-foreground">
                        {frequency.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </ChannelRow>
      </div>
    </Card>
  );
}

/* ─── Catalog sections ────────────────────────────────────────────────────
 * Title left, the two channel column headers right, then the card. Headers
 * live on the section line rather than inside the card so the card stays
 * data-only, exactly as every other section on the page. */

function ColumnHeaders() {
  return (
    <div className="flex shrink-0 items-center gap-4 pr-4">
      {CHANNEL_COLUMNS.map((column) => (
        <span
          className={cn(
            CHANNEL_COL,
            "type-label-12 text-center text-muted-foreground"
          )}
          key={column.key}
        >
          {column.label}
        </span>
      ))}
    </div>
  );
}

function TypeRow({
  description,
  masters,
  name,
  onToggle,
  rowId,
  selection,
}: {
  description: string;
  masters: ChannelSelection;
  name: string;
  onToggle: (key: keyof ChannelSelection) => void;
  rowId: string;
  selection: ChannelSelection;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="type-label-14 text-foreground">{name}</span>
        <p className="type-copy-12 m-0 text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
      {CHANNEL_COLUMNS.map((column) => (
        <div
          className={cn(CHANNEL_COL, "flex shrink-0 justify-center")}
          key={column.key}
        >
          <Checkbox
            /* The row name labels the ROW, not one of its two controls, so
               each box names its own channel instead. */
            aria-label={`${name}, ${column.label}`}
            checked={selection[column.key]}
            /* Master off = column disabled, checked state preserved. */
            disabled={!masters[column.key]}
            id={`${rowId}-${column.key}`}
            onCheckedChange={() => onToggle(column.key)}
          />
        </div>
      ))}
    </div>
  );
}

type CatalogRow = {
  id: NotificationTypeId;
  name: string;
  description: string;
  selection: ChannelSelection;
};

function CatalogSection({
  extras,
  masters,
  onToggle,
  rows,
  title,
}: {
  /** Sub-block rendered inside the card directly under a given row. */
  extras?: Partial<Record<NotificationTypeId, React.ReactNode>>;
  masters: ChannelSelection;
  onToggle: (id: NotificationTypeId, key: keyof ChannelSelection) => void;
  rows: CatalogRow[];
  title: string;
}) {
  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle as="h2">{title}</SectionTitle>
        <ColumnHeaders />
      </div>
      <Card density="flush">
        <div className="divide-y divide-border">
          {rows.map((row) => (
            /* divide-y here too: an `extras` tray is a second child, so the
               seam between a row and the tray it opens draws the same
               hairline as every other row seam. A row with no extras has one
               child and gets no line. */
            <div className="divide-y divide-border" key={row.id}>
              <TypeRow
                description={row.description}
                masters={masters}
                name={row.name}
                onToggle={(key) => onToggle(row.id, key)}
                rowId={`notif-type-${row.id}`}
                selection={row.selection}
              />
              {extras?.[row.id]}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ─── Security-event scope ────────────────────────────────────────────────
 * Revealed under the Security event row once that type has any channel
 * checked — Policies.tsx's expand-when-enabled precedent, as an in-card
 * tray rather than a nested card so it reads as part of the row it
 * configures. It takes NO fill of its own — it sits on the card's `bg-card`
 * and the seam above it (the row wrapper's divide-y hairline) is what says
 * "this belongs to the row above". A wash here was doing the same job twice.
 *
 * The narrowed filters DO get a fill, because they are a layer deeper: the
 * `bg-card-muted` panel inverts against the card in both themes (neutral-50
 * on white in light, neutral-800 on neutral-900 in dark), which is the house
 * pattern for a bordered panel inside a card — Billing and Policies use the
 * same recipe. Border stays explicit and radius steps 8px card → 6px panel.
 *
 * The three narrowing modes COMBINE (PRD): an event has to match every
 * filter that is set, which is why the copy says so out loud — three
 * independent checkbox groups otherwise read as alternatives.
 *
 * The tray carries no border of its own: it is a child of the row wrapper's
 * divide-y, so the hairline at the seam comes from the card's divider token
 * rather than a second, hand-set edge that could drift from it. */

function ScopeCheckbox({
  checked,
  disabled,
  id,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  id: string;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={(next) => onChange(next === true)}
      />
      <Label className="type-label-14 text-foreground" htmlFor={id}>
        {label}
      </Label>
    </div>
  );
}

function toggleId(list: string[], id: string, on: boolean): string[] {
  return on ? [...list, id] : list.filter((entry) => entry !== id);
}

function SecurityScopePanel({
  onSetScope,
  scope,
}: {
  onSetScope: (patch: Partial<SecurityScope>) => void;
  scope: SecurityScope;
}) {
  const narrowed = scope.mode === "narrowed";

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex flex-col gap-1">
        <SectionHeading as="h4">Which security events</SectionHeading>
        <p className="type-copy-12 m-0 text-pretty text-muted-foreground">
          Narrowing filters combine: an event has to match every filter you set
          before it notifies you.
        </p>
      </div>

      <RadioGroup
        onValueChange={(value) =>
          onSetScope({ mode: value === "narrowed" ? "narrowed" : "all" })
        }
        value={scope.mode}
      >
        <div className="flex items-center gap-3">
          <RadioGroupItem id="notif-scope-all" value="all" />
          <Label
            className="type-label-14 text-foreground"
            htmlFor="notif-scope-all"
          >
            Every security event
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id="notif-scope-narrowed" value="narrowed" />
          <Label
            className="type-label-14 text-foreground"
            htmlFor="notif-scope-narrowed"
          >
            Only events that match my filters
          </Label>
        </div>
      </RadioGroup>

      {narrowed ? (
        <div className="flex flex-col gap-4 rounded-sm border border-border bg-card-muted p-4">
          <div className="flex flex-col gap-3">
            <SectionHeading as="h5">By policy</SectionHeading>
            {POLICIES.map((policy) => (
              <ScopeCheckbox
                checked={scope.policyIds.includes(policy.id)}
                id={`notif-scope-policy-${policy.id}`}
                key={policy.id}
                label={policy.name}
                onChange={(next) =>
                  onSetScope({
                    policyIds: toggleId(scope.policyIds, policy.id, next),
                  })
                }
              />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <SectionHeading as="h5">By action taken</SectionHeading>
            {SCOPE_ACTIONS.map((action) => (
              <ScopeCheckbox
                checked={scope.actions.includes(action.id)}
                id={`notif-scope-action-${action.id}`}
                key={action.id}
                label={action.label}
                onChange={(next) =>
                  onSetScope({
                    actions: toggleId(scope.actions, action.id, next),
                  })
                }
              />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <SectionHeading as="h5">By rate</SectionHeading>
            <ScopeCheckbox
              checked={scope.rate.enabled}
              id="notif-scope-rate"
              label="Only notify above a rate"
              onChange={(next) =>
                onSetScope({ rate: { ...scope.rate, enabled: next } })
              }
            />
            <div className="flex flex-wrap items-start gap-4">
              <div>
                <Label
                  className="type-label-14 mb-1 text-muted-foreground"
                  htmlFor="notif-scope-rate-count"
                >
                  Events
                </Label>
                <Input
                  className="type-mono-14 w-24 disabled:opacity-50"
                  disabled={!scope.rate.enabled}
                  id="notif-scope-rate-count"
                  inputMode="numeric"
                  min="1"
                  onChange={(e) =>
                    onSetScope({
                      rate: {
                        ...scope.rate,
                        count: countOr(Number(e.target.value), 1),
                      },
                    })
                  }
                  step="1"
                  type="number"
                  value={scope.rate.count}
                />
              </div>
              <div>
                <Label
                  className="type-label-14 mb-1 text-muted-foreground"
                  htmlFor="notif-scope-rate-window"
                >
                  Within (hours)
                </Label>
                <Input
                  className="type-mono-14 w-24 disabled:opacity-50"
                  disabled={!scope.rate.enabled}
                  id="notif-scope-rate-window"
                  inputMode="numeric"
                  min="1"
                  onChange={(e) =>
                    onSetScope({
                      rate: {
                        ...scope.rate,
                        windowHours: countOr(Number(e.target.value), 1),
                      },
                    })
                  }
                  step="1"
                  type="number"
                  value={scope.rate.windowHours}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Recent notifications ────────────────────────────────────────────────
 * The full history as a two-tab inbox, built on the house table stack
 * (line Tabs + TabsCount chips → Table → TablePaginationFooter), the same
 * shape /models uses. NOT a bespoke row list: a notification row carries a
 * kind, a title, a detail line and a time, which is a table.
 *
 *   Inbox    every NOTIFICATION_HISTORY row that has not been archived.
 *            Chip counts UNREAD, not total — the question the bell answers
 *            is "how many need me", and two surfaces disagreeing on that
 *            number would be worse than no number.
 *   Archive  the rows in `archivedIds`. Chip counts the total, because
 *            "unread" stops being a useful question once a row is filed.
 *
 * Archiving is per-row here (the icon action in the Inbox tab) and in bulk
 * from the bell ("Archive all"). Both write the same store set, so the two
 * surfaces cannot disagree. There is no unarchive: the whole store is
 * in-memory and a refresh restores every row, which is the demo lifecycle
 * (see `@/data/notifications-store`).
 *
 * Read state is SUBSCRIBED, not sampled — a row opened in the bell mutes
 * here while both are on screen, and vice versa. Older history ships read,
 * so page 2 and beyond read quiet by design.
 *
 * The row carries NO delivery chip: this section IS the in-app channel, so a
 * badge reading "In-app" on every row states the obvious. Where a type
 * delivers is the matrix above's job to say. */

/** Column widths live here so the header and both tabs read one source.
 *  `table-fixed` + percentages is the house table shape (Team, Models); the
 *  Actions column only exists in the Inbox, so each tab gets its own set
 *  rather than an empty column under an "Actions" head. */
const FEED_COLUMNS = {
  inbox: { title: "w-[30%]", detail: "w-[49%]", time: "w-[15%]" },
  archive: { title: "w-[32%]", detail: "w-[53%]", time: "w-[15%]" },
} as const;

function FeedRow({
  item,
  onArchive,
  onOpen,
  unread,
}: {
  item: NotificationItem;
  /** Present in the Inbox only — the Archive tab has no per-row action. */
  onArchive?: (item: NotificationItem) => void;
  onOpen: (item: NotificationItem) => void;
  /** Unread is carried by WHOLE-ROW INK, Gmail-style: every text cell in an
   *  unread row sits at full strength and drops to `text-muted-foreground`
   *  once read. No dot, no badge — the contrast IS the indicator, so it
   *  needs no legend and costs no gutter. Weight never moves: the label
   *  voice is already font-medium and Gmail's bold is approximated with ink,
   *  per design.md §3 (colour does the quiet work, weight does the
   *  structural work). User direction 2026-08-25. */
  unread: boolean;
}) {
  return (
    <NavTableRow
      aria-label={`Open ${item.title}: ${item.copy}`}
      onActivate={() => onOpen(item)}
    >
      <TableCell className="whitespace-nowrap">
        <span className="flex min-w-0 items-center gap-2">
          <item.Icon
            aria-hidden
            className={cn(
              "size-4 shrink-0",
              !item.iconColor && "text-muted-foreground"
            )}
            strokeWidth={1.75}
            style={item.iconColor ? { color: item.iconColor } : undefined}
          />
          <span
            className={cn(
              "type-label-14 block min-w-0 truncate",
              unread ? "text-foreground" : "text-muted-foreground"
            )}
            title={item.title}
          >
            {item.title}
          </span>
        </span>
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap",
          unread ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {/* truncate needs a width: the column carries one, and `title` keeps
            the full string reachable on hover (house table rule). */}
        <span className="block truncate" title={item.copy}>
          {item.copy}
        </span>
      </TableCell>
      {/* Mono and right-aligned, and deliberately `fmtRelative` rather than
          <Timestamp>: the bell renders the same row through fmtRelative's
          compact "17h ago", and two linked surfaces printing one timestamp
          two ways is a defect a tooltip would not pay for.

          READ-STATE INK OVERRIDES THE THREE-TIER RULE HERE. design.md pins
          date/time cells to the data tier unconditionally; in an inbox the
          row is the unit, so a full-strength timestamp on a read row would
          break the one signal the surface has. Gmail precedent, user
          direction 2026-08-25 — this carve-out is scoped to the two
          notification row surfaces and changes nothing in the other seven
          tables. */}
      <TableCell
        className={cn(
          "type-mono-14 whitespace-nowrap text-right",
          unread ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {fmtRelative(item.at, NOTIFICATIONS_NOW)}
      </TableCell>
      {onArchive ? (
        <TableCell className="whitespace-nowrap pr-4 pl-0 text-right">
          <IconActionButton
            aria-label={`Archive notification: ${item.title}`}
            /* The row is a role="link" that activates on click AND on
               Enter/Space, so the action has to stop BOTH or archiving would
               also navigate away from the page you archived on. */
            onClick={(event) => {
              event.stopPropagation();
              onArchive(item);
            }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Archive aria-hidden className="size-4" strokeWidth={1.75} />
          </IconActionButton>
        </TableCell>
      ) : null}
    </NavTableRow>
  );
}

type FeedTab = "inbox" | "archive";

/** One chip recipe for all three empty bands — size-12 rounded-md bg-muted
 *  with a size-5 glyph, the house TableEmptyState chip. */
function FeedEmptyIcon({
  icon: Icon,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div
      aria-hidden
      className="flex size-12 items-center justify-center rounded-md bg-muted"
    >
      <Icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
    </div>
  );
}

/** Three states, one band. "No notifications yet" is the fresh-workspace
 *  case; the other two are consequences of something the user did, so they
 *  say where the rows went. The `footnote` slot is what keeps that pointer
 *  from bloating the body sentence. */
function FeedEmptyState({
  hasHistory,
  tab,
}: {
  hasHistory: boolean;
  tab: FeedTab;
}) {
  if (!hasHistory) {
    return (
      <TableEmptyState
        body="Nothing has fired yet. Once a policy, key, or billing event triggers one of the types above, it appears here and in the top-bar bell."
        icon={<FeedEmptyIcon icon={Bell} />}
        title="No notifications yet"
      />
    );
  }
  if (tab === "archive") {
    return (
      <TableEmptyState
        body="Archived notifications appear here."
        icon={<FeedEmptyIcon icon={Archive} />}
        title="Nothing archived yet"
      />
    );
  }
  return (
    <TableEmptyState
      body="Every notification has been archived. Anything new lands straight back in the Inbox."
      footnote="What you filed is on the Archive tab."
      icon={<FeedEmptyIcon icon={Bell} />}
      title="All caught up!"
    />
  );
}

function FeedSection({ hasFeed }: { hasFeed: boolean }) {
  const navigate = useNavigate();
  const { readIds, archivedIds } = useNotificationsReadState();
  /** `?tab=archive` deep link, read-and-strip per the house contract (the
   *  `?open=` shape: applied by a render-phase compare against the last value
   *  seen, stripped in the handler for the user action that supersedes it).
   *
   *  It CANNOT be a useState initializer: the bell lives in the top bar of
   *  this very page, so clicking its explainer link is a search-param change
   *  on a mounted route — React Router keeps the component, the initializer
   *  never re-runs, and the tab would silently stay on Inbox. Verified in the
   *  browser before this was written the other way. */
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTab = searchParams.get("tab") === "archive" ? "archive" : null;
  const [tab, setTab] = useState<FeedTab>(paramTab ?? "inbox");
  const [prevParamTab, setPrevParamTab] = useState<string | null>(paramTab);
  /** Page state is local: nothing else on the page cares which page of
   *  history you are on. The footer resets to page 1 on a rows-per-page
   *  change itself; switching tabs resets it here, because page 3 of the
   *  Inbox is a meaningless place to land in a two-row Archive. */
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");

  const history = hasFeed ? NOTIFICATION_HISTORY : [];
  const isUnread = (item: NotificationItem) =>
    item.unread && !readIds.has(item.id);
  const inbox = history.filter((item) => !archivedIds.has(item.id));
  const archived = history.filter((item) => archivedIds.has(item.id));

  const onInbox = tab === "inbox";
  const items = onInbox ? inbox : archived;
  const columns = FEED_COLUMNS[tab];

  /** Clamp before slicing: archiving the last row of the last page would
   *  otherwise leave `page` past the end and render a blank table. The footer
   *  clamps its own display the same way, so both agree on what is shown. */
  if (paramTab !== prevParamTab) {
    setPrevParamTab(paramTab);
    if (paramTab) {
      setTab(paramTab);
      setPage(1);
    }
  }

  const perPage = Number(rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = items.slice((safePage - 1) * perPage, safePage * perPage);

  const openRow = (item: NotificationItem) => {
    markRead(item.id);
    navigate(item.href);
  };

  /** A manual tab click supersedes the deep link, so it consumes the param —
   *  which also re-arms it: the next `?tab=archive` is a fresh null→archive
   *  transition rather than a no-op against the same value. */
  const selectTab = (value: string) => {
    setTab(value === "archive" ? "archive" : "inbox");
    setPage(1);
    if (searchParams.has("tab")) {
      const stripped = new URLSearchParams(searchParams);
      stripped.delete("tab");
      setSearchParams(stripped, { replace: true });
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <SectionTitle as="h2">Recent notifications</SectionTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Your inbox of everything that has fired, newest first. Archive a row
          to file it out of the way; the top-bar bell shows the most recent of
          whatever is still in the Inbox.
        </p>
      </div>
      <Tabs className="gap-4" onValueChange={selectTab} value={tab}>
        <TabsList className="px-0" variant="line">
          <TabsTrigger value="inbox">
            Inbox
            <TabsCount>{inbox.filter(isUnread).length}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="archive">
            Archive
            <TabsCount>{archived.length}</TabsCount>
          </TabsTrigger>
        </TabsList>
        <Card density="flush">
          {items.length === 0 ? (
            <FeedEmptyState hasHistory={history.length > 0} tab={tab} />
          ) : (
            <>
              <Table className="min-w-[720px] table-fixed">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead
                      className={cn(columns.title, "whitespace-nowrap")}
                    >
                      Notification
                    </TableHead>
                    <TableHead
                      className={cn(columns.detail, "whitespace-nowrap")}
                    >
                      Detail
                    </TableHead>
                    <TableHead
                      className={cn(
                        columns.time,
                        "whitespace-nowrap text-right"
                      )}
                    >
                      Time
                    </TableHead>
                    {onInbox ? (
                      <TableHead className="w-[6%] whitespace-nowrap pr-4 pl-0 text-right">
                        Actions
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((item) => (
                    <FeedRow
                      item={item}
                      key={item.id}
                      onArchive={
                        onInbox ? (row) => archiveOne(row.id) : undefined
                      }
                      onOpen={openRow}
                      unread={isUnread(item)}
                    />
                  ))}
                </TableBody>
              </Table>
              <TablePaginationFooter
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
                page={safePage}
                rowsPerPage={rowsPerPage}
                total={items.length}
              />
            </>
          )}
        </Card>
      </Tabs>
    </div>
  );
}
