import type { ComponentType } from 'react';
import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import {
  MoreHorizontal,
  Send,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Monogram, type AvatarTone } from '@/components/ui/monogram';
import { TableEmptyState } from '@/components/ui/table-empty-state';
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
import { FilterToolbar } from '@/components/ui/filter-toolbar';
import { SearchInput } from '@/components/ui/search-input';
import { Label } from '@/components/ui/label';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { TabsCount } from '@/components/ui/tabs-count';
import { TablePaginationFooter } from '@/components/ui/table-pagination-footer';
import { cn } from '@/lib/utils';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { formatDate, formatRelative } from '@/lib/formatters';

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
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  return (
    <DashboardChrome
            activeNavId="team"
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={toggleSidebar}
            onNavigate={(path: string) => navigate(path)}
          >
            <TeamSurface />
          </DashboardChrome>
  );
}

/* ─── Page surface — header + tabs container ───────────────────────────── */

function TeamSurface() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tab, setTab] = useState<'members' | 'invitations'>('members');

  return (
    <>
      <PageHeader onInvite={() => setInviteOpen(true)} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="gap-4">
        <TabsList variant="line" className="px-0 -mt-2">
          <TeamTabsTrigger value="members" label="Members" count={MEMBER_ROWS.length} />
          <TeamTabsTrigger value="invitations" label="Invitations" count={INVITATION_ROWS.length} />
        </TabsList>

        <TabsContent value="members">
          <MembersPane />
        </TabsContent>
        <TabsContent value="invitations">
          <InvitationsPane onInvite={() => setInviteOpen(true)} />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}

/* ─── Page header ─────────────────────────────────────────────────────── */

function PageHeader({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Team</PageTitle>
        <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
          Manage roles, invite teammates, and remove access from Chad Ponticas&rsquo;s workspace.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" size="default" onClick={onInvite}>
          <UserPlus data-icon="inline-start" aria-hidden />
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

type MemberRole = 'owner' | 'admin' | 'member';

const ROLE_LABEL: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
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
  { id: 'usr_chad',   name: 'Chad Ponticas', email: 'chad@constellationnetwork.io', avatarTone: 'blue',    role: 'owner',  joined: new Date(2026, 3, 20) },
  { id: 'usr_kira',   name: 'Kira Tan',      email: 'kira.tan@acme.io',             avatarTone: 'rose',    role: 'admin',  joined: new Date(2026, 3, 22) },
  { id: 'usr_mate',   name: 'Mateus Silva',  email: 'mateus.silva@ebux.com',        avatarTone: 'emerald', role: 'member', joined: new Date(2026, 4,  1) },
  { id: 'usr_jordan', name: 'Jordan Lee',    email: 'jordan.lee@acme.io',           avatarTone: 'amber',   role: 'member', joined: new Date(2026, 4,  8) },
];

function MembersPane() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | MemberRole>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');

  const visible = MEMBER_ROWS.filter((r) => {
    if (roleFilter !== 'all' && r.role !== roleFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    );
  });

  const isEmpty = visible.length === 0;

  return (
    <Card density="flush">
      {/* Toolbar — search + role filter. Sits as direct child of Card
          (density="flush"); paddings cascade from the toolbar's own
          px-4/py-3 plus Card's edge-flush contract. Filter pills follow
          the codified no-leading-icon rule for dense table toolbars. */}
      {isEmpty ? null : (
      <FilterToolbar>
        <SearchInput
          placeholder="Search by name or email…"
          ariaLabel="Search members"
          value={query}
          onChange={setQuery}
        />
        <Select
          value={roleFilter}
          onValueChange={(v: string) => setRoleFilter(v as 'all' | MemberRole)}
        >
          <SelectTrigger
            size="sm"
            aria-label="Filter by role"
            className="border-border bg-card text-foreground font-normal"
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
          title="No members match"
          body="No members match your search or filter. Try a different name or email."
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
            <TableHead className="w-[40%] whitespace-nowrap">Member</TableHead>
            <TableHead className="w-[22%] whitespace-nowrap">Joined</TableHead>
            <TableHead className="w-[28%] whitespace-nowrap">Role</TableHead>
            <TableHead className="w-[10%] text-right pl-0 pr-4 whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((row) => (
            <MemberRowView key={row.id} row={row} />
          ))}
        </TableBody>
      </Table>

      <TablePaginationFooter
        total={MEMBER_ROWS.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
        </>
      )}
    </Card>
  );
}

function MemberRowView({ row }: { row: MemberRow }) {
  const [role, setRole] = useState<MemberRole>(row.role);
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center gap-3 min-w-0">
          <Monogram size="md" tone={row.avatarTone} initials={initialsOf(row.name)} />
          <div className="flex flex-col min-w-0 flex-1">
            <span
              title={row.name}
              className="font-sans text-sm font-medium text-ink-900 truncate"
            >
              {row.name}
            </span>
            <span className="font-sans text-xs text-ink-500 tracking-snug truncate" title={row.email}>
              {row.email}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap font-sans text-sm text-ink-800 tabular-nums">
        {formatDate(row.joined)}
      </TableCell>
      <TableCell className="whitespace-nowrap font-sans text-sm text-ink-800">
        {row.role === 'owner' ? (
          'Owner'
        ) : (
          <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
            <SelectTrigger size="sm" className="w-28 border-border bg-card text-ink-900 font-normal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap pl-0 pr-4">
        {row.role !== 'owner' ? (
          <RowActionsMenu
            label={`Open actions for ${row.name}`}
            items={[{ id: 'remove', label: 'Remove member', destructive: true }]}
          />
        ) : null}
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
  { id: 'inv_01', email: 'marcus.cho@acme.io',  invitedBy: 'Chad Ponticas', sent: new Date(2026, 4, 7), role: 'member', expires: new Date(NOW.getTime() + 6 * 24 * 60 * 60 * 1000) },
  { id: 'inv_02', email: 'priya.iyer@ebux.com', invitedBy: 'Kira Tan',      sent: new Date(2026, 4, 6), role: 'admin',  expires: new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000) },
];

function InvitationsPane({ onInvite }: { onInvite: () => void }) {
  if (INVITATION_ROWS.length === 0) {
    return (
      <Card density="flush">
        <TableEmptyState
          title="No pending invitations"
          body="Invitations you’ve sent that haven’t been accepted yet show up here. They expire after 7 days."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={onInvite}
              className="border-border bg-card text-ink-900"
            >
              <UserPlus data-icon="inline-start" aria-hidden />
              Invite member
            </Button>
          }
        />
      </Card>
    );
  }
  return (
    <Card density="flush">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[27%] whitespace-nowrap">Email</TableHead>
            <TableHead className="w-[25%] whitespace-nowrap">Invited by</TableHead>
            <TableHead className="w-[15%] whitespace-nowrap">Sent</TableHead>
            <TableHead className="w-[15%] whitespace-nowrap">Role</TableHead>
            <TableHead className="w-[15%] whitespace-nowrap">Expires</TableHead>
            <TableHead className="w-[3%] text-right pl-0 pr-4 whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {INVITATION_ROWS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap font-sans text-sm text-ink-900">
                <span className="block truncate" title={row.email}>{row.email}</span>
              </TableCell>
              <TableCell className="whitespace-nowrap font-sans text-sm text-ink-800">
                <span className="block truncate" title={row.invitedBy}>{row.invitedBy}</span>
              </TableCell>
              <TableCell className="whitespace-nowrap font-sans text-sm text-ink-800 tabular-nums">
                {formatDate(row.sent)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-sans text-sm text-ink-800">
                {ROLE_LABEL[row.role]}
              </TableCell>
              <TableCell className="whitespace-nowrap font-sans text-sm text-ink-800 tabular-nums">
                {formatRelative(row.expires, NOW)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap pl-0 pr-4">
                <RowActionsMenu
                  label={`Open actions for ${row.email}`}
                  items={[
                    { id: 'resend', label: 'Resend invite' },
                    { id: 'copy',   label: 'Copy invite link' },
                    { id: 'revoke', label: 'Revoke invite', destructive: true },
                  ]}
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
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('member');

  // Single-email validation: pragmatic regex (not RFC-strict; server
  // owns the canonical check). Empty ⇒ disabled; malformed ⇒ disabled.
  const trimmed = email.trim();
  const isValid = EMAIL_REGEX.test(trimmed);
  const showInvalid = trimmed.length > 0 && !isValid;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setEmail('');
          setRole('member');
        }
      }}
    >
      <DialogContent className="sm:max-w-lg gap-4">
        {/* Form wrapper enables Enter-to-submit. Submit handler closes
            the dialog; the demo doesn't actually send, but the contract
            mirrors a real implementation. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isValid) onOpenChange(false);
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle className="font-sans text-lg/6 font-medium text-ink-900">
              Invite member
            </DialogTitle>
            <DialogDescription>
              Enter the teammate's email. They'll see the invitation in their notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email" className="text-ink-600 font-medium text-sm">
              Email
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={showInvalid || undefined}
              aria-describedby={showInvalid ? 'invite-email-error' : undefined}
              className="font-sans text-sm"
            />
            {showInvalid ? (
              <p id="invite-email-error" className="font-sans text-xs text-destructive">
                That doesn't look like an email address.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-role" className="text-ink-600 font-medium text-sm">
              Role
            </Label>
            <Select value={role} onValueChange={(v: string) => setRole(v as MemberRole)}>
              <SelectTrigger
                id="invite-role"
                size="default"
                className="border-border bg-card text-ink-900 w-full"
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
                <SelectItem value="admin" className="h-auto py-2 items-start">
                  <RoleItemBody label="Admin" description="Manage settings, billing, and members. Full project access." />
                </SelectItem>
                <SelectItem value="member" className="h-auto py-2 items-start">
                  <RoleItemBody label="Member" description="Create, update, share, and delete projects and resources." />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              variant="default"
              disabled={!isValid}
            >
              <Send data-icon="inline-start" aria-hidden />
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoleItemBody({ label, description }: { label: string; description: string }) {
  return (
    <span className="flex flex-col gap-1 text-left">
      <span className="font-sans text-sm font-medium text-ink-900">{label}</span>
      <span className="font-sans text-xs text-ink-500 text-pretty">{description}</span>
    </span>
  );
}

/* ─── Row actions menu (kebab + popup) ───────────────────────────────────
 * Hidden-affordance pattern for row-level actions. The trigger is a ghost
 * MoreHorizontal button at icon-sm; click pops a menu of items. Built on
 * Base UI's `Menu` primitive directly because this codebase doesn't ship
 * a `dropdown-menu.tsx` wrapper yet — when a second consumer appears,
 * lift this into `components/ui/`. Visual treatment mirrors SelectContent
 * (white popup, ink-200 border, --shadow-popup, ink-100 highlight) so
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
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className="text-ink-500 hover:text-ink-900"
          />
        }
      >
        <MoreHorizontal />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner side="bottom" align="end" sideOffset={4} className="isolate z-50">
          <MenuPrimitive.Popup
            className={cn(
              'min-w-32 overflow-hidden rounded-sm bg-popover text-ink-900 border border-border shadow-(--shadow-popup) py-1 outline-none origin-[var(--transform-origin)]',
              'duration-150 ease-out data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:fill-mode-forwards motion-reduce:animate-none motion-reduce:duration-0',
            )}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <MenuPrimitive.Item
                  key={item.id}
                  onClick={item.onSelect}
                  className={cn(
                    'relative flex w-full cursor-pointer items-center gap-2 rounded-xs h-8 px-3 text-sm outline-none select-none',
                    'data-[highlighted]:bg-muted focus-visible:bg-muted',
                    item.destructive
                      ? 'text-destructive data-[highlighted]:text-destructive'
                      : 'text-ink-900',
                    '[&_svg]:size-4 [&_svg]:shrink-0',
                  )}
                >
                  {Icon ? <Icon strokeWidth={1.75} aria-hidden /> : null}
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
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
