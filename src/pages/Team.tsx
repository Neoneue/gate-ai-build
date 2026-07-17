import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { MoreHorizontal, Send, Trash2, UserPlus } from "lucide-react";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Monogram } from "@/components/ui/monogram";
import type { AvatarTone } from "@/components/ui/monogram-types";
import { PageTitle } from "@/components/ui/page-title";
import { SearchInput } from "@/components/ui/search-input";
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
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsCount } from "@/components/ui/tabs-count";
import { Timestamp } from "@/components/ui/timestamp";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { cn } from "@/lib/utils";

const NOW = new Date(2026, 4, 16, 16, 0, 0); // 2026-05-16 16:00:00 local

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHITESPACE_RE = /\s+/;

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-017 — Team (Workspace Admin)
 *
 * Members management surface. Production-frame chrome shared with
 * CMP-012 / CMP-013 / CMP-014. Tabbed structure (Members / Invitations /
 * Requests) lifted from the OpenRouter + Sentry inspirations — the
 * original target only showed the Members list, but invites and access
 * requests are real workflow states that deserve dedicated panes rather
 * than rolling them into a single ambiguous status column.
 *
 * Inline role editing via <Select> in the row (instead of a static badge)
 * mirrors how the inspirations let admins reassign without a row drill-in.
 * The "Invite member" Dialog
 * folds the role-card detail from one inspiration into our existing
 * SelectItem (description line under the role name) — one less primitive
 * to invent, same semantic payload.
 * ───────────────────────────────────────────────────────────────────────── */

export function Team() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="team"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Content stays fluid up to xl, then caps tighter so the cards don't
          stretch across ultrawide displays. */}
      <div className="flex w-full flex-col gap-6 xl:max-w-5xl">
        <TeamSurface />
      </div>
    </DashboardChrome>
  );
}

/* ─── Page surface — header + tabs container ───────────────────────────── */

function TeamSurface() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tab, setTab] = useState<"members" | "invitations">("members");

  return (
    <>
      <PageHeader onInvite={() => setInviteOpen(true)} />
      <Tabs
        className="gap-4"
        onValueChange={(v) => setTab(v as typeof tab)}
        value={tab}
      >
        <TabsList className="-mt-2 px-0" variant="line">
          <TeamTabsTrigger
            count={MEMBER_ROWS.length}
            label="Members"
            value="members"
          />
          <TeamTabsTrigger
            count={INVITATION_ROWS.length}
            label="Invitations"
            value="invitations"
          />
        </TabsList>

        <TabsContent value="members">
          <MembersPane />
        </TabsContent>
        <TabsContent value="invitations">
          <InvitationsPane onInvite={() => setInviteOpen(true)} />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog onOpenChange={setInviteOpen} open={inviteOpen} />
    </>
  );
}

/* ─── Page header ─────────────────────────────────────────────────────── */

function PageHeader({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex max-w-full flex-col gap-2 xl:max-w-1/2">
        <PageTitle>Team</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Manage roles, invite teammates, and remove access from Chad
          Ponticas&rsquo;s workspace.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onInvite} size="lg" variant="default">
          <UserPlus aria-hidden data-icon="inline-start" />
          Invite member
        </Button>
      </div>
    </div>
  );
}

/* ─── Tab trigger with count chip ─────────────────────────────────────── */

function TeamTabsTrigger({
  value,
  label,
  count,
}: {
  value: string;
  label: string;
  count: number;
}) {
  return (
    <TabsTrigger value={value}>
      <span>{label}</span>
      <TabsCount>{count}</TabsCount>
    </TabsTrigger>
  );
}

/* ─── Members pane ────────────────────────────────────────────────────── */

type MemberRole = "owner" | "admin" | "member";

const ROLE_LABEL: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

type MemberRow = {
  id: string;
  name: string;
  email: string;
  avatarTone: AvatarTone;
  role: MemberRole;
  joined: Date;
};

const MEMBER_ROWS: MemberRow[] = [
  {
    id: "usr_chad",
    name: "Chad Ponticas",
    email: "chad@constellationnetwork.io",
    avatarTone: "blue",
    role: "owner",
    joined: new Date(2026, 3, 20),
  },
  {
    id: "usr_kira",
    name: "Kira Tan",
    email: "kira.tan@acme.io",
    avatarTone: "rose",
    role: "admin",
    joined: new Date(2026, 3, 22),
  },
  {
    id: "usr_mate",
    name: "Mateus Silva",
    email: "mateus.silva@ebux.com",
    avatarTone: "emerald",
    role: "member",
    joined: new Date(2026, 4, 1),
  },
  {
    id: "usr_jordan",
    name: "Jordan Lee",
    email: "jordan.lee@acme.io",
    avatarTone: "amber",
    role: "member",
    joined: new Date(2026, 4, 8),
  },
];

/** Comparable value per sortable column for the Members table. Joined is a
 *  Date → epoch millis (numeric). Role sorts by its display label. */
function memberSortValue(row: MemberRow, key: string): string | number | null {
  switch (key) {
    case "member":
      return row.name;
    case "joined":
      return row.joined.getTime();
    case "role":
      return ROLE_LABEL[row.role];
    default:
      return null;
  }
}

function MembersPane() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | MemberRole>("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [pendingRemove, setPendingRemove] = useState<MemberRow | null>(null);
  const { sort, toggle: toggleSort } = useTableSort();

  const visible = MEMBER_ROWS.filter((r) => {
    if (roleFilter !== "all" && r.role !== roleFilter) {
      return false;
    }
    if (!query) {
      return true;
    }
    const q = query.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  });

  // Sort after filter (default key=null preserves authored order). No
  // pagination slice here — the sample fits one page — but sorting still
  // governs render order.
  const sortedRows = useMemo(
    () => sortRows(visible, sort, memberSortValue),
    [visible, sort]
  );

  const isEmpty = visible.length === 0;

  return (
    <>
      <Card density="flush">
        {/* Toolbar — search + role filter. Sits as direct child of Card
          (density="flush"); paddings cascade from the toolbar's own
          px-4/py-3 plus Card's edge-flush contract. Filter pills follow
          the codified no-leading-icon rule for dense table toolbars. */}
        {isEmpty ? null : (
          <FilterToolbar>
            <SearchInput
              ariaLabel="Search members"
              onChange={setQuery}
              placeholder="Search by name or email…"
              value={query}
            />
            <Select
              onValueChange={(v: string) =>
                setRoleFilter(v as "all" | MemberRole)
              }
              value={roleFilter}
            >
              <SelectTrigger
                aria-label="Filter by role"
                className="border-border bg-card font-normal text-foreground"
                size="lg"
              >
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="owner">Owners</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="member">Members</SelectItem>
              </SelectContent>
            </Select>
          </FilterToolbar>
        )}

        {isEmpty ? (
          <TableEmptyState
            body="No members match your search or filter. Try a different name or email."
            title="No members match"
          />
        ) : (
          <>
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {/* `table-fixed` + percentage widths on the header row is the
                load-bearing pattern: with auto layout the browser hands
                slack to whichever cell can grow most (Member, since the
                stacked email is the widest content), producing one
                bloated column and a tightly-packed remainder. Fixed
                layout reads widths off the header alone and gives every
                column a deliberate share. Member gets the largest share
                to fit avatar + name + email. */}
                  <SortableTableHead
                    className="w-[40%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="member"
                  >
                    Member
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[22%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="joined"
                  >
                    Joined
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[28%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="role"
                  >
                    Role
                  </SortableTableHead>
                  <TableHead className="w-[10%] whitespace-nowrap pr-4 pl-0 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row) => (
                  <MemberRowView
                    key={row.id}
                    onRemove={setPendingRemove}
                    row={row}
                  />
                ))}
              </TableBody>
            </Table>

            <TablePaginationFooter
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              page={page}
              rowsPerPage={rowsPerPage}
              total={MEMBER_ROWS.length}
            />
          </>
        )}
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemove(null);
          }
        }}
        open={pendingRemove !== null}
      >
        <DialogContent className="p-4 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove {pendingRemove?.name}?</DialogTitle>
            <DialogDescription>
              {pendingRemove?.name} will lose access to this workspace
              immediately. You can re-invite them later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button size="lg" type="button" variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={() => {
                // Mock-only: the seeded MEMBER_ROWS constant isn't mutated.
                // Wire to a real mutation handler when the backend lands.
                setPendingRemove(null);
              }}
              size="lg"
              type="button"
              variant="destructive"
            >
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MemberRowView({
  row,
  onRemove,
}: {
  row: MemberRow;
  onRemove: (row: MemberRow) => void;
}) {
  const [role, setRole] = useState<MemberRole>(row.role);
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        <div className="flex min-w-0 items-center gap-3">
          <Monogram
            initials={initialsOf(row.name)}
            size="md"
            tone={row.avatarTone}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span
              className="type-label-14 truncate text-foreground"
              title={row.name}
            >
              {row.name}
            </span>
            <span
              className="type-copy-12 truncate text-muted-foreground tracking-snug"
              title={row.email}
            >
              {row.email}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
        <Timestamp date={row.joined} format="dateNumeric" />
      </TableCell>
      <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
        {row.role === "owner" ? (
          "Owner"
        ) : (
          <Select onValueChange={(v) => setRole(v as MemberRole)} value={role}>
            <SelectTrigger
              aria-label={`Role for ${row.name}`}
              className="w-28 border-border bg-card font-normal text-foreground"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap pr-4 pl-0 text-right">
        {row.role === "owner" ? null : (
          <IconActionButton
            aria-label={`Remove ${row.name}`}
            onClick={() => onRemove(row)}
          >
            <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />
          </IconActionButton>
        )}
      </TableCell>
    </TableRow>
  );
}

/* ─── Invitations pane ────────────────────────────────────────────────── */

type InvitationRow = {
  id: string;
  email: string;
  invitedBy: string;
  sent: Date;
  role: MemberRole;
  expires: Date;
};

const INVITATION_ROWS: InvitationRow[] = [
  {
    id: "inv_01",
    email: "marcus.cho@acme.io",
    invitedBy: "Chad Ponticas",
    sent: new Date(2026, 4, 7),
    role: "member",
    expires: new Date(NOW.getTime() + 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: "inv_02",
    email: "priya.iyer@ebux.com",
    invitedBy: "Kira Tan",
    sent: new Date(2026, 4, 6),
    role: "admin",
    expires: new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000),
  },
];

/** Comparable value per sortable column for the Invitations table. Sent and
 *  Expires are Dates → epoch millis (numeric); Role sorts by display label. */
function invitationSortValue(
  row: InvitationRow,
  key: string
): string | number | null {
  switch (key) {
    case "email":
      return row.email;
    case "invitedBy":
      return row.invitedBy;
    case "sent":
      return row.sent.getTime();
    case "role":
      return ROLE_LABEL[row.role];
    case "expires":
      return row.expires.getTime();
    default:
      return null;
  }
}

function InvitationsPane({ onInvite }: { onInvite: () => void }) {
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = useMemo(
    () => sortRows(INVITATION_ROWS, sort, invitationSortValue),
    [sort]
  );

  if (INVITATION_ROWS.length === 0) {
    return (
      <Card density="flush">
        <TableEmptyState
          action={
            <Button
              className="border-border bg-card text-foreground"
              onClick={onInvite}
              size="sm"
              variant="outline"
            >
              <UserPlus aria-hidden data-icon="inline-start" />
              Invite member
            </Button>
          }
          body="Invitations you’ve sent that haven’t been accepted yet show up here. They expire after 7 days."
          title="No pending invitations"
        />
      </Card>
    );
  }
  return (
    <Card density="flush">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableTableHead
              className="w-[27%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="email"
            >
              Email
            </SortableTableHead>
            <SortableTableHead
              className="w-[25%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="invitedBy"
            >
              Invited by
            </SortableTableHead>
            <SortableTableHead
              className="w-[15%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="sent"
            >
              Sent
            </SortableTableHead>
            <SortableTableHead
              className="w-[15%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="role"
            >
              Role
            </SortableTableHead>
            <SortableTableHead
              className="w-[15%] whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="expires"
            >
              Expires
            </SortableTableHead>
            <TableHead className="w-[3%] whitespace-nowrap pr-4 pl-0 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                <span className="block truncate" title={row.email}>
                  {row.email}
                </span>
              </TableCell>
              <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                <span className="block truncate" title={row.invitedBy}>
                  {row.invitedBy}
                </span>
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                <Timestamp date={row.sent} format="dateNumeric" />
              </TableCell>
              <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                {ROLE_LABEL[row.role]}
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                <Timestamp anchor={NOW} date={row.expires} format="relative" />
              </TableCell>
              <TableCell className="whitespace-nowrap pr-4 pl-0 text-right">
                <RowActionsMenu
                  items={[
                    { id: "resend", label: "Resend invite" },
                    { id: "copy", label: "Copy invite link" },
                    { id: "revoke", label: "Revoke invite", destructive: true },
                  ]}
                  label={`Open actions for ${row.email}`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/* ─── Invite member dialog ────────────────────────────────────────────── */

function InviteMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");

  // Single-email validation: pragmatic regex (not RFC-strict; server
  // owns the canonical check). Empty ⇒ disabled; malformed ⇒ disabled.
  const trimmed = email.trim();
  const isValid = EMAIL_REGEX.test(trimmed);
  const showInvalid = trimmed.length > 0 && !isValid;

  return (
    <Dialog
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setEmail("");
          setRole("member");
        }
      }}
      open={open}
    >
      <DialogContent className="gap-4 sm:max-w-lg">
        {/* Form wrapper enables Enter-to-submit. Submit handler closes
            the dialog; the demo doesn't actually send, but the contract
            mirrors a real implementation. */}
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (isValid) {
              onOpenChange(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="type-heading-18 text-foreground">
              Invite member
            </DialogTitle>
            <DialogDescription>
              Enter the teammate&rsquo;s email. They&rsquo;ll see the invitation
              in their notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label
              className="type-label-14 text-muted-foreground"
              htmlFor="invite-email"
            >
              Email
            </Label>
            <Input
              aria-describedby={showInvalid ? "invite-email-error" : undefined}
              aria-invalid={showInvalid || undefined}
              autoComplete="off"
              className="type-copy-14"
              id="invite-email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              spellCheck={false}
              type="email"
              value={email}
            />
            {showInvalid ? (
              <p
                className="type-copy-12 text-destructive"
                id="invite-email-error"
              >
                That doesn&rsquo;t look like an email address.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              className="type-label-14 text-muted-foreground"
              htmlFor="invite-role"
            >
              Role
            </Label>
            <Select
              onValueChange={(v: string) => setRole(v as MemberRole)}
              value={role}
            >
              <SelectTrigger
                className="w-full border-border bg-card text-foreground"
                id="invite-role"
                size="default"
              >
                {/* Function-child so the trigger renders only the short
                    label — the rich two-line item body is for the popup,
                    not the trigger. The select primitive's default
                    label-collector walks JSX for `node.type === SelectItem`
                    which doesn't see through wrapper components, so the
                    items are inlined here. */}
                <SelectValue>
                  {(value) => ROLE_LABEL[value as MemberRole] ?? String(value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="min-w-[var(--anchor-width)]">
                <SelectItem className="h-auto items-start py-2" value="admin">
                  <RoleItemBody
                    description="Manage settings, billing, and members. Full project access."
                    label="Admin"
                  />
                </SelectItem>
                <SelectItem className="h-auto items-start py-2" value="member">
                  <RoleItemBody
                    description="Create, update, share, and delete projects and resources."
                    label="Member"
                  />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button size="lg" type="button" variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              disabled={!isValid}
              size="lg"
              type="submit"
              variant="default"
            >
              <Send aria-hidden data-icon="inline-start" />
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoleItemBody({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <span className="flex flex-col gap-1 text-left">
      <span className="type-label-14 text-foreground">{label}</span>
      <span className="type-copy-12 text-pretty text-muted-foreground">
        {description}
      </span>
    </span>
  );
}

/* ─── Row actions menu (kebab + popup) ───────────────────────────────────
 * Hidden-affordance pattern for row-level actions. The trigger is a ghost
 * MoreHorizontal button at icon-sm; click pops a menu of items. Built on
 * Base UI's `Menu` primitive directly because this codebase doesn't ship
 * a `dropdown-menu.tsx` wrapper yet — when a second consumer appears,
 * lift this into `components/ui/`. Visual treatment mirrors SelectContent
 * (white popup, neutral-200 border, --shadow-popup, neutral-100 highlight) so
 * the menu reads as part of the same chrome family. */

type RowActionItem = {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  destructive?: boolean;
  onSelect?: () => void;
};

function RowActionsMenu({
  label,
  items,
}: {
  label: string;
  items: RowActionItem[];
}) {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        render={
          <Button
            aria-label={label}
            className="text-muted-foreground hover:text-foreground"
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner
          align="end"
          className="isolate z-50"
          side="bottom"
          sideOffset={8}
        >
          <MenuPrimitive.Popup
            className={cn(
              "min-w-32 origin-[var(--transform-origin)] overflow-hidden rounded-sm border border-border bg-popover py-1 text-foreground shadow-(--shadow-popup) outline-none",
              "data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 duration-150 ease-out data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards motion-reduce:animate-none motion-reduce:duration-0"
            )}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <MenuPrimitive.Item
                  className={cn(
                    "relative flex h-8 w-full cursor-pointer select-none items-center gap-2 rounded-xs px-3 text-sm outline-none",
                    "focus-visible:bg-muted data-[highlighted]:bg-muted",
                    item.destructive
                      ? "text-destructive data-[highlighted]:text-destructive"
                      : "text-foreground",
                    "[&_svg]:size-4 [&_svg]:shrink-0"
                  )}
                  key={item.id}
                  onClick={item.onSelect}
                >
                  {Icon ? <Icon aria-hidden strokeWidth={1.75} /> : null}
                  <span className="flex-1 text-left">{item.label}</span>
                </MenuPrimitive.Item>
              );
            })}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(WHITESPACE_RE);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
