import {
  Activity,
  BellRing,
  Box,
  Building2,
  Coins,
  CreditCard,
  Fingerprint,
  Gauge,
  Home,
  KeyRound,
  Mail,
  MessageSquare,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { SidebarSection } from "@/components/ui/sidebar";

/* Single source of truth for the production-shell sidebar. Active state is
 * derived from the page's `activeNavId` matched against `SidebarItem.id`.
 * The `pageId` field holds the URL path navigated to on click — the page
 * passes it straight to react-router's navigate(). Items without a path
 * are inert affordances (Token Savings, Limits, etc.) pending real
 * surfaces. */

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    items: [
      { id: "overview", icon: Home, label: "Overview", pageId: "/overview" },
    ],
  },
  {
    label: "Monitor",
    items: [
      {
        id: "requests",
        icon: Mail,
        label: "Messages",
        pageId: "/messages",
      },
      {
        id: "conversations",
        icon: MessageSquare,
        label: "Conversations",
        pageId: "/conversations",
      },
      {
        id: "security-events",
        icon: TriangleAlert,
        label: "Security events",
        pageId: "/security",
        locked: true,
      },
      {
        id: "audit-trail",
        icon: Fingerprint,
        label: "Audit trail",
        pageId: "/audit-trail",
      },
    ],
  },
  {
    // "My settings" (PM meeting 2026-09-03, Joao Carvalho): these pages are
    // the signed-in user's own configuration on every tier. Org and team
    // locks are managed on Teams; a locked setting shows a banner and
    // disabled inputs here. Limits moved to Workspace the same day: an
    // admin's org-wide caps are not a personal setting.
    label: "My settings",
    items: [
      {
        id: "policies",
        icon: ShieldCheck,
        label: "Policies",
        pageId: "/policies",
      },
      {
        id: "token-savings",
        icon: Coins,
        label: "Token savings",
        pageId: "/token-savings",
        locked: true,
      },
    ],
  },
  {
    label: "Gateway",
    items: [{ id: "models", icon: Box, label: "Models", pageId: "/models" }],
  },
  {
    label: "Workspace",
    items: [
      {
        id: "activity",
        icon: Activity,
        label: "Activity",
        pageId: "/activity",
      },
      {
        id: "limits",
        icon: Gauge,
        label: "Limits",
        pageId: "/limits",
        locked: true,
      },
      { id: "team", icon: Users, label: "Members", pageId: "/members" },
      { id: "teams", icon: Building2, label: "Teams", pageId: "/teams" },
      { id: "billing", icon: CreditCard, label: "Billing", pageId: "/billing" },
      {
        id: "api-keys",
        icon: KeyRound,
        label: "API keys",
        pageId: "/api-keys",
      },
      {
        id: "notifications",
        icon: BellRing,
        label: "Notifications",
        pageId: "/notifications",
      },
      {
        id: "settings",
        icon: Settings2,
        label: "Settings",
        pageId: "/settings",
      },
    ],
  },
];

/** PRO-only nav ids — locked in the Free workspace (rendered as inert lock
 *  affordances, no navigation). Everything else routes to its `-free` twin. */
const LOCKED_IN_FREE = new Set<string>([]);

/** Nav ids the Free workspace does not have at all.
 *
 *  Distinct from LOCKED_IN_FREE on purpose: a locked item is an upsell — the
 *  row stays, wearing a padlock, because the feature exists on a higher plan
 *  and we want it seen. A hidden item is not part of the Free product's
 *  surface area and has no `-free` twin to route to, so leaving a padlocked
 *  row would advertise a page that cannot exist.
 *
 *  `teams` is the first member: the PRD scopes Teams to Pro + Enterprise. */
const HIDDEN_IN_FREE = new Set<string>(["teams"]);

function buildVariantSections(
  suffix: string,
  lockedIds: Set<string>,
  hiddenIds: Set<string> = new Set<string>(),
  labelOverrides: Record<string, string> = {}
): SidebarSection[] {
  return SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => !hiddenIds.has(item.id))
      .map((item) => {
        const label = labelOverrides[item.id] ?? item.label;
        return lockedIds.has(item.id)
          ? { ...item, label, locked: true, pageId: undefined }
          : {
              ...item,
              label,
              locked: false,
              pageId: item.pageId ? `${item.pageId}${suffix}` : item.pageId,
            };
      }),
    // A group whose every item is hidden would otherwise render as a bare
    // eyebrow with nothing under it.
  })).filter((section) => section.items.length > 0);
}

/** Sidebar for the Free workspace — unlocked items point at their `-free` twin. */
export const FREE_SIDEBAR_SECTIONS: SidebarSection[] = buildVariantSections(
  "-free",
  LOCKED_IN_FREE,
  HIDDEN_IN_FREE
);

/** Sidebar for the Default workspace — unlocked items point at their `-default`
 *  twin. The nav label stays "Messages" across all tiers (only the Default
 *  page body keeps the "Requests" copy). */
export const DEFAULT_SIDEBAR_SECTIONS: SidebarSection[] = buildVariantSections(
  "-default",
  new Set<string>()
);

/** Sidebar for the Enterprise workspace — unlocked items point at their
 *  `-enterprise` twin. Nothing is locked or hidden: Enterprise is the top
 *  tier, so every surface Pro has, it has. Policies and Token savings sit
 *  under "My settings" like every tier; the org and team lock layer lives
 *  on Teams (PM meeting 2026-09-03). */
export const ENTERPRISE_SIDEBAR_SECTIONS: SidebarSection[] =
  buildVariantSections("-enterprise", new Set<string>(), new Set<string>());

/** Enterprise sidebar for the team-manager view (AG-695 AC 3; PRD §6,
 *  §8.4): a manager lands on their own team under Teams. Org-admin
 *  surfaces are hidden: Members (org roster, invites are owner/admin),
 *  Billing. Audit trail stays: anyone in the org sees it (user
 *  2026-09-03). Limits stays: caps run "at the org, project, or key level",
 *  so a manager or member sets limits on THEIR OWN keys; the org-wide scope
 *  is admin-only there (user 2026-09-03). Keys and Security events stay: a
 *  user still has to see their own keys and events. */
const HIDDEN_FOR_TEAM_ROLES = new Set<string>(["team", "billing"]);

export const ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS: SidebarSection[] =
  ENTERPRISE_SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !HIDDEN_FOR_TEAM_ROLES.has(item.id)),
  })).filter((section) => section.items.length > 0);

/** Enterprise sidebar for the member view: a member has no Teams surface
 *  at all (confirmed 2026-09-03; PRD §8.4 gives team read access to the
 *  manager role only). Everything else is the manager's set. */
const HIDDEN_FOR_MEMBER = new Set<string>([...HIDDEN_FOR_TEAM_ROLES, "teams"]);

export const ENTERPRISE_MEMBER_SIDEBAR_SECTIONS: SidebarSection[] =
  ENTERPRISE_SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !HIDDEN_FOR_MEMBER.has(item.id)),
  })).filter((section) => section.items.length > 0);
