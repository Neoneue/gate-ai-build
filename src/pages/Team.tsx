import type { ComponentType } from 'react';
import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import {
  MoreHorizontal,
  Search,
  Send,
  UserPlus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { DashboardChrome } from '@/layouts/DashboardChrome';

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
 * Status pills carry the canonical StatusDot. The "Invite member" Dialog
 * folds the role-card detail from one inspiration into our existing
 * SelectItem (description line under the role name) — one less primitive
 * to invent, same semantic payload.
 * ───────────────────────────────────────────────────────────────────────── */

export function Team() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  return (
    <DashboardChrome
            breadcrumbCurrent="Team"
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
  const [tab, setTab] = useState<'members' | 'invitations' | 'requests'>(
    'members',
  );

  return (
    <>
      <PageHeader onInvite={() => setInviteOpen(true)} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="gap-4">
        <TabsList variant="line" className="px-0 -mt-2">
          <TeamTabsTrigger value="members" label="Members" count={MEMBER_ROWS.length} />
          <TeamTabsTrigger value="invitations" label="Invitations" count={INVITATION_ROWS.length} />
          <TeamTabsTrigger value="requests" label="Requests" count={REQUEST_ROWS.length} />
        </TabsList>

        <TabsContent value="members">
          <MembersPane />
        </TabsContent>
        <TabsContent value="invitations">
          <InvitationsPane onInvite={() => setInviteOpen(true)} />
        </TabsContent>
        <TabsContent value="requests">
          <RequestsPane />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}

/* ─── Page header ─────────────────────────────────────────────────────── */

function PageHeader({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Team</PageTitle>
        <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
          Manage roles, invite teammates, and remove access from Chad Ponticas&rsquo;s workspace.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
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

type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';
type MemberStatus = 'active' | 'invited' | 'suspended';

const ROLE_LABEL: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const STATUS_BADGE: Record<
  MemberStatus,
  { variant: 'success' | 'info' | 'neutral'; dot: 'success' | 'info' | 'neutral'; label: string }
> = {
  active:    { variant: 'success', dot: 'success', label: 'active' },
  invited:   { variant: 'info',    dot: 'info',    label: 'invited' },
  // "Suspended" reads as a grayed-out steady state — the user account
  // exists but is paused. Warning was the wrong register (transient
  // alert, action-required); neutral matches the dimmed-but-present
  // semantic without competing with active/invited for visual weight.
  suspended: { variant: 'neutral', dot: 'neutral', label: 'suspended' },
};

type MemberRow = {
  id: string;
  name: string;
  email: string;
  avatarTone: AvatarTone;
  role: MemberRole;
  status: MemberStatus;
  joined: string;
  isYou?: boolean;
};

const MEMBER_ROWS: MemberRow[] = [
  { id: 'usr_chad',  name: 'Chad Ponticas', email: 'chad@constellationnetwork.io', avatarTone: 'blue',    role: 'owner',  status: 'active',    joined: 'Apr 20, 2026', isYou: true },
  { id: 'usr_kira',  name: 'Kira Tan',      email: 'kira.tan@acme.io',             avatarTone: 'rose',    role: 'admin',  status: 'active',    joined: 'Apr 22, 2026' },
  { id: 'usr_mate',  name: 'Mateus Silva',  email: 'mateus.silva@ebux.com',        avatarTone: 'emerald', role: 'member', status: 'active',    joined: 'May 01, 2026' },
  { id: 'usr_pulja', name: 'Pulja Shah',    email: 'pulja.shah@acme.io',           avatarTone: 'amber',   role: 'member', status: 'invited',   joined: '—' },
  { id: 'usr_dani',  name: 'Daniela Reyes', email: 'd.reyes@constellationnetwork.io', avatarTone: 'ink',    role: 'viewer', status: 'suspended', joined: 'Mar 14, 2026' },
];

function MembersPane() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | MemberRole>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('25');

  const visible = MEMBER_ROWS.filter((r) => {
    if (roleFilter !== 'all' && r.role !== roleFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    );
  });

  return (
    <Card density="flush">
      {/* Toolbar — search + role filter. Sits as direct child of Card
          (density="flush"); paddings cascade from the toolbar's own
          px-4/py-3 plus Card's edge-flush contract. Filter pills follow
          the codified no-leading-icon rule for dense table toolbars. */}
      <div className="flex items-center gap-2 p-4">
        <div className="relative w-72 min-w-0 shrink-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-500"
            strokeWidth={1.75}
            aria-hidden
          />
          <Input
            size="sm"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search members"
            autoComplete="off"
            spellCheck={false}
            // `pl-8` consumes the leading-icon convention — the absolutely
            // positioned Search glyph above sits at left-3 (12px) at
            // size-4, so the text needs 32px (8 * 4px) of left padding
            // to clear it. Not a primitive override worth lifting at
            // current scale; this composition is repeated in CMP-013,
            // CMP-014, CMP-016 with the same recipe.
            className="pl-8 placeholder:text-ink-500"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v: string) => setRoleFilter(v as 'all' | MemberRole)}
        >
          <SelectTrigger
            size="sm"
            aria-label="Filter by role"
            className="border-ink-200 bg-white text-ink-900 font-normal"
          >
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="owner">Owners</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="member">Members</SelectItem>
            <SelectItem value="viewer">Viewers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* `table-fixed` + percentage widths on the header row is the
                load-bearing pattern: with auto layout the browser hands
                slack to whichever cell can grow most (Member, since the
                stacked email is the widest content), producing one
                bloated column and a tightly-packed remainder. Fixed
                layout reads widths off the header alone and gives every
                column a deliberate share, so all five gaps look the
                same. Member gets the largest share to fit avatar +
                name + email; Actions gets the smallest because it's a
                single icon button. */}
            <TableHead className="w-[38%]">Member</TableHead>
            <TableHead className="w-[19%]">Joined</TableHead>
            <TableHead className="w-[19%]">Role</TableHead>
            <TableHead className="w-[19%]">Status</TableHead>
            <TableHead className="w-[5%] text-right pl-0 pr-4">Actions</TableHead>
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
    </Card>
  );
}

function MemberRowView({ row }: { row: MemberRow }) {
  const badge = STATUS_BADGE[row.status];
  // Owner role is fixed — only one owner per workspace and demoting it
  // requires a transfer flow we don't represent here. The Select renders
  // disabled in that case so the affordance is still legible (mirrors the
  // visual weight of editable rows) but won't open.
  const isOwner = row.role === 'owner';
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar tone={row.avatarTone} initials={initialsOf(row.name)} />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span
                title={row.name}
                className="font-sans text-sm font-medium text-ink-900 tracking-snug truncate"
              >
                {row.name}
              </span>
              {row.isYou ? <Badge variant="neutral">You</Badge> : null}
            </div>
            <span className="font-mono text-xs text-ink-500 tracking-snug truncate" title={row.email}>
              {row.email}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap font-mono text-sm text-ink-500 tabular-nums tracking-snug">
        {row.joined}
      </TableCell>
      <TableCell>
        {isOwner ? (
          // Owner renders as a disabled Select rather than a static Badge —
          // the SelectTrigger surface visually matches the editable rows
          // (so the column reads uniformly) AND `aria-disabled` carries
          // the "this can't be changed without a transfer" semantics to
          // assistive tech. Demoting the owner requires the Transfer
          // ownership flow in the row's kebab menu.
          <Select value={row.role} disabled>
            <SelectTrigger
              size="sm"
              aria-label={`Role for ${row.name} — locked, transfer ownership to change`}
              className="border-ink-200 bg-white text-ink-900"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select defaultValue={row.role}>
            <SelectTrigger
              size="sm"
              aria-label={`Role for ${row.name}`}
              className="border-ink-200 bg-white text-ink-900"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant={badge.variant}>
          {badge.label}
        </Badge>
      </TableCell>
      <TableCell className="text-right whitespace-nowrap pl-0 pr-4">
        <RowActionsMenu
          label={`Open actions for ${row.name}`}
          items={
            isOwner
              ? [
                  // Transfer is irreversible — destructive tone gives it
                  // visual weight so it doesn't look like a casual default.
                  { id: 'transfer', label: 'Transfer ownership', destructive: true },
                ]
              : [
                  { id: 'reset',  label: 'Reset access' },
                  { id: 'remove', label: 'Remove from workspace', destructive: true },
                ]
          }
        />
      </TableCell>
    </TableRow>
  );
}

/* ─── Invitations pane ────────────────────────────────────────────────── */

type InvitationRow = {
  id: string;
  email: string;
  invitedBy: string;
  sent: string;
  role: MemberRole;
  expires: string;
};

const INVITATION_ROWS: InvitationRow[] = [
  { id: 'inv_01', email: 'jordan.lee@acme.io',  invitedBy: 'Chad Ponticas', sent: 'May 07, 2026', role: 'member', expires: 'in 6 days' },
  { id: 'inv_02', email: 'priya.iyer@ebux.com', invitedBy: 'Kira Tan',      sent: 'May 06, 2026', role: 'admin',  expires: 'in 5 days' },
];

function InvitationsPane({ onInvite }: { onInvite: () => void }) {
  if (INVITATION_ROWS.length === 0) {
    return (
      <EmptyState
        className="py-16"
        title="No pending invitations"
        body="Invitations you’ve sent that haven’t been accepted yet show up here. They expire after 7 days."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={onInvite}
            className="border-ink-200 bg-white text-ink-900"
          >
            <UserPlus data-icon="inline-start" aria-hidden />
            Invite member
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
            <TableHead className="w-[26%]">Email</TableHead>
            <TableHead className="w-[26%]">Invited by</TableHead>
            <TableHead className="w-[15%]">Sent</TableHead>
            <TableHead className="w-[13%]">Role</TableHead>
            <TableHead className="w-[15%]">Expires</TableHead>
            <TableHead className="w-[5%] text-right pl-0 pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {INVITATION_ROWS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-sm text-ink-900 tracking-snug">
                <span className="block truncate" title={row.email}>{row.email}</span>
              </TableCell>
              <TableCell className="font-sans text-sm text-ink-800 tracking-snug">
                <span className="block truncate" title={row.invitedBy}>{row.invitedBy}</span>
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-sm text-ink-500 tabular-nums tracking-snug">
                {row.sent}
              </TableCell>
              <TableCell>
                <Badge variant="neutral">{ROLE_LABEL[row.role]}</Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-sm text-ink-500 tabular-nums tracking-snug">
                {row.expires}
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

/* ─── Requests pane ───────────────────────────────────────────────────── */

type RequestRow = {
  id: string;
  email: string;
  requested: string;
  role: MemberRole;
  reason: string;
};

const REQUEST_ROWS: RequestRow[] = [
  { id: 'req_01', email: 'noah.gauthier@constellationnetwork.io', requested: 'May 09, 2026', role: 'member', reason: 'Joining the platform team — needs prod-web key access.' },
];

function RequestsPane() {
  if (REQUEST_ROWS.length === 0) {
    return (
      <EmptyState
        className="py-16"
        title="No access requests"
        body="People who’ve asked to join this workspace show up here. You’ll see their email, the role they want, and a short note."
      />
    );
  }
  return (
    <Card density="flush">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[28%]">Email</TableHead>
            <TableHead className="w-[15%]">Requested</TableHead>
            <TableHead className="w-[13%]">Role</TableHead>
            <TableHead className="w-[39%]">Reason</TableHead>
            <TableHead className="w-[5%] text-right pl-0 pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {REQUEST_ROWS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-sm text-ink-900 tracking-snug">
                <span className="block truncate" title={row.email}>{row.email}</span>
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-sm text-ink-500 tabular-nums tracking-snug">
                {row.requested}
              </TableCell>
              <TableCell>
                <Badge variant="neutral">{ROLE_LABEL[row.role]}</Badge>
              </TableCell>
              <TableCell className="font-sans text-sm text-ink-800 tracking-snug">
                <span className="block truncate" title={row.reason}>
                  {row.reason}
                </span>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap pl-0 pr-4">
                <RowActionsMenu
                  label={`Open actions for ${row.email}`}
                  items={[
                    { id: 'approve', label: 'Approve request' },
                    { id: 'decline', label: 'Decline request', destructive: true },
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
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<MemberRole>('member');

  // Validation: at least one well-formed email token. Splitting on
  // commas / spaces / newlines mirrors the textarea instructions; each
  // token is checked against a pragmatic email regex (not RFC-strict;
  // that path is for the server). Empty input ⇒ disabled; any-token-
  // -invalid ⇒ disabled. Send is enabled only when every non-empty
  // token validates.
  const tokens = emails.split(/[\s,]+/).filter(Boolean);
  const allValid = tokens.length > 0 && tokens.every((t) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t));
  const showInvalid = tokens.length > 0 && !allValid;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setEmails('');
          setRole('member');
        }
      }}
    >
      <DialogContent className="sm:max-w-lg gap-4">
        {/* Form wrapper enables Enter-to-submit from the textarea (and
            from anywhere inside the dialog). Submit handler closes the
            dialog; the demo doesn't actually send, but the contract
            mirrors a real implementation. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (allValid) onOpenChange(false);
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle className="font-sans text-lg/6 font-medium text-ink-900">
              Invite member
            </DialogTitle>
            <DialogDescription>
              Enter one or more emails separated by commas, spaces, or new lines. They’ll see the invitation in their notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-emails" className="text-ink-600 font-medium text-sm">
              Emails
            </Label>
            <Textarea
              id="invite-emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="teammate@example.com, other@example.com"
              spellCheck={false}
              aria-invalid={showInvalid || undefined}
              aria-describedby={showInvalid ? 'invite-emails-error' : undefined}
              className="font-mono text-sm min-h-20"
            />
            {showInvalid ? (
              <p id="invite-emails-error" className="font-sans text-xs text-destructive">
                One or more entries don’t look like an email address.
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
                className="border-ink-200 bg-white text-ink-900 w-full"
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
                <SelectItem value="viewer" className="h-auto py-2 items-start">
                  <RoleItemBody label="Viewer" description="Read-only access. Cannot create, update, or delete." />
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
              disabled={!allValid}
            >
              <Send data-icon="inline-start" aria-hidden />
              Send invitations
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
              'min-w-32 overflow-hidden rounded-sm bg-white text-ink-900 border border-ink-200 shadow-(--shadow-popup) py-1 outline-none',
              'duration-150 ease-out data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none motion-reduce:duration-0',
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
                    'data-[highlighted]:bg-ink-100 focus-visible:bg-ink-100',
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

/* ─── Avatar (monogram circle) ────────────────────────────────────────── */

type AvatarTone = 'blue' | 'rose' | 'emerald' | 'amber' | 'ink';

const AVATAR_TONE_CLS: Record<AvatarTone, string> = {
  // Each tone uses a saturated 700-step bg + white fg — same recipe as
  // DashTopBar's `CP` monogram. Tones cycle through the existing 700-step
  // ramps (no chart-palette borrowing — those are reserved for series
  // color; no raw OKLCH — palette atoms only) so adjacent rows in the
  // Members table read as distinct people without leaning on photos.
  blue:    'bg-blue-700 text-white',
  rose:    'bg-danger-700 text-white',
  emerald: 'bg-success-700 text-white',
  amber:   'bg-warning-700 text-white',
  ink:     'bg-ink-700 text-white',
};

function Avatar({ tone, initials }: { tone: AvatarTone; initials: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center size-7 shrink-0 rounded-full font-sans text-xs font-medium',
        AVATAR_TONE_CLS[tone],
      )}
    >
      {initials}
    </span>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
