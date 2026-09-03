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
    label: "Manage",
    items: [
      {
        id: "policies",
        icon: ShieldCheck,
        label: "Policies",
        pageId: "/policies",
      },
      {
        id: "limits",
        icon: Gauge,
        label: "Limits",
        pageId: "/limits",
        locked: true,
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

const ENTERPRISE_MANAGE_ORDER = ["limits", "policies", "token-savings"];

/** Sidebar for the Enterprise workspace — unlocked items point at their
 *  `-enterprise` twin. Nothing is locked or hidden: Enterprise is the top
 *  tier, so every surface Pro has, it has. Policies and Token savings are
 *  USER-level on Enterprise (org and team settings live on Teams; call
 *  2026-09-03), so the labels say whose they are. */
export const ENTERPRISE_SIDEBAR_SECTIONS: SidebarSection[] =
  buildVariantSections("-enterprise", new Set<string>(), new Set<string>(), {
    policies: "My policies",
    "token-savings": "My token savings",
  }).map((section) =>
    // Manage reads org-level first, then the personal pair together:
    // Limits, My Policies, My Token Savings (user 2026-09-03).
    section.label === "Manage"
      ? {
          ...section,
          items: [...section.items].sort(
            (a, b) =>
              ENTERPRISE_MANAGE_ORDER.indexOf(a.id) -
              ENTERPRISE_MANAGE_ORDER.indexOf(b.id)
          ),
        }
      : section
  );

/** Enterprise sidebar for the team-manager view (AG-695 AC 3; PRD §6, §8.4):
 *  a manager sees what a member sees, plus Teams (landing on their team).
 *  Org-admin surfaces are hidden: Audit trail, Limits, Members (org roster,
 *  invites are owner/admin), Billing. Keys and Security events stay: a user
 *  still has to see their own keys and events (user 2026-09-03). */
const HIDDEN_FOR_MANAGER = new Set<string>([
  "audit-trail",
  "limits",
  "team",
  "billing",
]);

export const ENTERPRISE_MANAGER_SIDEBAR_SECTIONS: SidebarSection[] =
  ENTERPRISE_SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !HIDDEN_FOR_MANAGER.has(item.id)),
  })).filter((section) => section.items.length > 0);
