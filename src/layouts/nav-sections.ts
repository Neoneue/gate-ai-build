import {
  Activity,
  BellRing,
  Box,
  Building2,
  Coins,
  CreditCard,
  Fingerprint,
  Home,
  KeyRound,
  Mail,
  MessageSquare,
  Settings2,
  Shield,
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
        label: "Security Events",
        pageId: "/security",
        locked: true,
      },
      {
        id: "audit-trail",
        icon: Fingerprint,
        label: "Audit Trail",
        pageId: "/audit-trail",
      },
    ],
  },
  {
    label: "Manage",
    items: [
      { id: "policies", icon: Shield, label: "Policies", pageId: "/policies" },
      {
        id: "limits",
        icon: ShieldCheck,
        label: "Limits",
        pageId: "/limits",
        locked: true,
      },
      {
        id: "token-savings",
        icon: Coins,
        label: "Token Savings",
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
      { id: "team", icon: Users, label: "Team", pageId: "/team" },
      { id: "teams", icon: Building2, label: "Teams", pageId: "/teams" },
      { id: "billing", icon: CreditCard, label: "Billing", pageId: "/billing" },
      {
        id: "api-keys",
        icon: KeyRound,
        label: "API Keys",
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
