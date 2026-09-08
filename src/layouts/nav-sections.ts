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
 * passes it straight to react-router's navigate(). Every item routes:
 * there is no inert nav row and no lock state — a page a role cannot see
 * is dropped from the section set entirely (see the hidden sets below). */

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
    // forced settings are managed on Teams; a forced setting shows a banner
    // and disabled inputs here. Limits moved to Workspace the same day: an
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

/** Nav ids the Free workspace does not have at all.
 *
 *  Hiding is the only mechanism the nav has: an item is either in the set and
 *  routes, or it is not there at all. There is no third "visible but inert"
 *  state — a row advertising a page that cannot exist is not a product
 *  decision the PRD makes.
 *
 *  `teams` is the first member: the PRD scopes Teams to Pro + Enterprise. */
const HIDDEN_IN_FREE = new Set<string>(["teams"]);

function buildVariantSections(
  suffix: string,
  hiddenIds: Set<string> = new Set<string>(),
  labelOverrides: Record<string, string> = {}
): SidebarSection[] {
  return SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => !hiddenIds.has(item.id))
      .map((item) => ({
        ...item,
        label: labelOverrides[item.id] ?? item.label,
        pageId: `${item.pageId}${suffix}`,
      })),
    // A group whose every item is hidden would otherwise render as a bare
    // eyebrow with nothing under it.
  })).filter((section) => section.items.length > 0);
}

/** Sidebar for the Free workspace — every item points at its `-free` twin. */
export const FREE_SIDEBAR_SECTIONS: SidebarSection[] = buildVariantSections(
  "-free",
  HIDDEN_IN_FREE
);

/** Sidebar for the Default workspace — every item points at its `-default`
 *  twin. The nav label stays "Messages" across all tiers (only the Default
 *  page body keeps the "Requests" copy). */
export const DEFAULT_SIDEBAR_SECTIONS: SidebarSection[] =
  buildVariantSections("-default");

/** Sidebar for the Enterprise workspace — every item points at its
 *  `-enterprise` twin. Nothing is hidden: Enterprise is the top tier, so
 *  every surface Pro has, it has. Policies and Token savings sit
 *  under "My settings" like every tier; the org and team lock layer lives
 *  on Teams (PM meeting 2026-09-03). */
export const ENTERPRISE_SIDEBAR_SECTIONS: SidebarSection[] =
  buildVariantSections("-enterprise");

/** Drop `hidden` nav ids from a section set, then drop any section left with
 *  no items (a group whose every item is hidden would otherwise render as a
 *  bare eyebrow with nothing under it). Applied to the PRO and the ENTERPRISE
 *  sets alike: the role variants differ only in which base set they filter. */
const withoutItems = (
  sections: SidebarSection[],
  hidden: Set<string>
): SidebarSection[] =>
  sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !hidden.has(item.id)),
    }))
    .filter((section) => section.items.length > 0);

/** Sidebar for the team-manager view (AG-695 AC 3; PRD §6, §8.4): a manager
 *  lands on their own team under Teams. Org-admin surfaces are hidden:
 *  Members (org roster, invites are owner/admin), Billing. Audit trail
 *  stays: anyone in the org sees it (user 2026-09-03). Limits stays: caps run
 *  "at the org, project, or key level", so a manager or member sets limits on
 *  THEIR OWN keys; the org-wide scope is admin-only there (user 2026-09-03).
 *  Keys and Security events stay: a user still has to see their own keys and
 *  events. Applies on Pro and Enterprise alike — PRD §3 scopes teams,
 *  budgets, roll-up and the manager role to BOTH plans. */
const HIDDEN_FOR_TEAM_ROLES = new Set<string>(["team", "billing"]);

export const ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS: SidebarSection[] =
  withoutItems(ENTERPRISE_SIDEBAR_SECTIONS, HIDDEN_FOR_TEAM_ROLES);

/** Sidebar for the member view: a member has no Teams surface at all
 *  (confirmed 2026-09-03; PRD §8.4 gives team read access to the manager role
 *  only). Everything else is the manager's set. */
const HIDDEN_FOR_MEMBER = new Set<string>([...HIDDEN_FOR_TEAM_ROLES, "teams"]);

export const ENTERPRISE_MEMBER_SIDEBAR_SECTIONS: SidebarSection[] =
  withoutItems(ENTERPRISE_SIDEBAR_SECTIONS, HIDDEN_FOR_MEMBER);

/** The same two role variants on PRO — filtered from SIDEBAR_SECTIONS, so
 *  every remaining item keeps its unsuffixed Pro path. */
export const PRO_TEAM_ROLE_SIDEBAR_SECTIONS: SidebarSection[] = withoutItems(
  SIDEBAR_SECTIONS,
  HIDDEN_FOR_TEAM_ROLES
);

export const PRO_MEMBER_SIDEBAR_SECTIONS: SidebarSection[] = withoutItems(
  SIDEBAR_SECTIONS,
  HIDDEN_FOR_MEMBER
);

/** True when `navId` is an item in any section of `sections`.
 *
 *  The counterpart to the hiding above, and the only test anything asks:
 *  a page hidden from a role's sidebar is also blocked by URL. The chrome
 *  runs this against the very section set it renders the rail from
 *  (`layouts/DashboardChrome.tsx`), so "hidden" and "blocked" are the same
 *  fact rather than two lists that have to agree. `/site-map` derives its
 *  per-role hidden ids from the same call. */
export function sectionsIncludePage(
  sections: SidebarSection[],
  navId: string
): boolean {
  return sections.some((section) =>
    section.items.some((item) => item.id === navId)
  );
}
