import {
  Activity,
  ArrowLeftRight,
  Box,
  Coins,
  CreditCard,
  Fingerprint,
  Home,
  KeyRound,
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
      {
        id: "requests",
        icon: ArrowLeftRight,
        label: "Requests",
        pageId: "/requests",
      },
      {
        id: "conversations",
        icon: MessageSquare,
        label: "Conversations",
        pageId: "/conversations",
      },
    ],
  },
  {
    label: "Gateway",
    items: [
      { id: "models", icon: Box, label: "Models", pageId: "/models" },
      {
        id: "token-savings",
        icon: Coins,
        label: "Token Savings",
        pageId: "/token-savings",
        locked: true,
      },
      {
        id: "limits",
        icon: ShieldCheck,
        label: "Limits",
        pageId: "/limits",
        locked: true,
      },
    ],
  },
  {
    label: "Security",
    items: [
      {
        id: "security-events",
        icon: TriangleAlert,
        label: "Events",
        pageId: "/security",
        locked: true,
      },
      { id: "policies", icon: Shield, label: "Policies", pageId: "/policies" },
    ],
  },
  {
    label: "Audit",
    items: [
      {
        id: "audit-trail",
        icon: Fingerprint,
        label: "Audit Trail",
        pageId: "/audit-trail",
      },
    ],
  },
  {
    label: "Workspace Admin",
    items: [
      {
        id: "activity",
        icon: Activity,
        label: "Activity",
        pageId: "/activity",
      },
      { id: "team", icon: Users, label: "Team", pageId: "/team" },
      { id: "billing", icon: CreditCard, label: "Billing", pageId: "/billing" },
      {
        id: "api-keys",
        icon: KeyRound,
        label: "API Keys",
        pageId: "/api-keys",
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

function buildVariantSections(
  suffix: string,
  lockedIds: Set<string>
): SidebarSection[] {
  return SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      lockedIds.has(item.id)
        ? { ...item, locked: true, pageId: undefined }
        : {
            ...item,
            locked: false,
            pageId: item.pageId ? `${item.pageId}${suffix}` : item.pageId,
          }
    ),
  }));
}

/** Sidebar for the Free workspace — unlocked items point at their `-free` twin. */
export const FREE_SIDEBAR_SECTIONS: SidebarSection[] = buildVariantSections(
  "-free",
  LOCKED_IN_FREE
);

/** Sidebar for the Default workspace — unlocked items point at their `-default` twin. */
export const DEFAULT_SIDEBAR_SECTIONS: SidebarSection[] = buildVariantSections(
  "-default",
  new Set<string>()
);
