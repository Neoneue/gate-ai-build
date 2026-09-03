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
 * ViewRoleSwitch — "Viewing as" Admin / Manager, Enterprise routes only.
 * Sits right of the workspace switcher in the top bar (user 2026-09-03).
 * Drives the AG-695 team-manager variant: the manager sidebar, the manager
 * landing on their own team, and every read-only pane. Admin is the seeded
 * owner; Manager is Kira Tan, Platform's manager. Members have no Teams
 * surface (PRD §6), so there is no Member option.
 * ───────────────────────────────────────────────────────────────────────── */

const LABEL: Record<ViewRole, string> = {
  admin: "Admin view",
  manager: "Manager view",
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
      </SelectContent>
    </Select>
  );
}
