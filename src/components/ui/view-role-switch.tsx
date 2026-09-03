import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  teamsStore,
  useViewRole,
  type ViewRole,
} from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * ViewRoleSwitch — "Viewing as" Admin / Manager / Member, Enterprise only.
 * Sits right of the workspace switcher in the top bar (user 2026-09-03).
 * Drives the AG-695 role variants: the team-role sidebar, landing on the
 * user's own team, and every hidden or read-only pane. Admin is the seeded
 * owner; Manager is Kira Tan, Platform's manager; Member is Mateus Silva,
 * a Platform member (own team, read-only, Overview + Members only).
 * ───────────────────────────────────────────────────────────────────────── */

const LABEL: Record<ViewRole, string> = {
  admin: "Admin view",
  manager: "Manager view",
  member: "Member view",
};

export function ViewRoleSwitch({ className }: { className?: string }) {
  const role = useViewRole();
  return (
    <Select
      onValueChange={(v) => teamsStore.setViewRole(v as ViewRole)}
      value={role}
    >
      <SelectTrigger aria-label="Viewing as" className={className} size="sm">
        <SelectValue>{LABEL[role]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">{LABEL.admin}</SelectItem>
        <SelectItem value="manager">{LABEL.manager}</SelectItem>
        <SelectItem value="member">{LABEL.member}</SelectItem>
      </SelectContent>
    </Select>
  );
}
