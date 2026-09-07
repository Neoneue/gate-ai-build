import type { SidebarSection } from "@/components/ui/sidebar";
import { MEMBER_ROWS } from "@/data/team-members";
import {
  DEFAULT_SIDEBAR_SECTIONS,
  ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
  ENTERPRISE_SIDEBAR_SECTIONS,
  ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
  FREE_SIDEBAR_SECTIONS,
  PRO_MEMBER_SIDEBAR_SECTIONS,
  PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
  SIDEBAR_SECTIONS,
  sectionsIncludePage,
} from "@/layouts/nav-sections";
import { isEnterpriseSurface, isTeamRoleSurface } from "@/lib/plan";
import {
  ADMIN_USER_ID,
  MANAGER_USER_ID,
  MEMBER_USER_ID,
  type ViewRole,
} from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * Site map — the model behind /site-map.
 *
 * Pure data, no JSX, no hooks: the page renders this and the test asserts
 * it. Nothing here is retyped from memory. The workspace facts come from
 * `lib/plan.ts` helpers called on a representative path, the nav comes from
 * the real `layouts/nav-sections.ts` constants the chrome renders, and the
 * persona names come from `data/team-members.ts`. If any of those change,
 * this page changes with them instead of drifting into a stale diagram.
 *
 * Two audiences, both served by the same rows:
 *   - developers read the ROUTE paths per view;
 *   - PM reads the PRD line per view (docs/prds/org-team-hierarchy-prd.md).
 * ───────────────────────────────────────────────────────────────────────── */

/* ─── PRD reference vocabulary ─────────────────────────────────────────── */

/** The sections of `docs/prds/org-team-hierarchy-prd.md` that justify a node.
 *  Every role row cites at least one — asserted in `data.test.ts`. */
export const PRD_REFS = {
  planAvailability: "§3 Team roles and plan availability",
  personas: "§6 Personas",
  teamScope: "§8.4 Team-scoped access",
  forcedSettings: "§8.5 Forced settings",
  acceptance: "§11 Acceptance",
} as const;

/* ─── Workspaces ───────────────────────────────────────────────────────── */

export type WorkspaceId = "free" | "pro" | "enterprise" | "default";

export type WorkspaceNode = {
  id: WorkspaceId;
  /** Display name of the workspace type. */
  name: string;
  /** The path suffix every route on this workspace carries ("" for Pro). */
  suffix: string;
  /** A real route on this workspace — the `lib/plan.ts` helpers are called
   *  on this string rather than the tier being asserted by hand. */
  samplePath: string;
  /** Short traits rendered as badges on the workspace node. */
  badges: string[];
  /** One line: what this workspace type is. */
  note: string;
  /** Drawn as its own column in the chart. Default is a state of the Free
   *  plan rather than an org type, so it is a footnote under Free instead. */
  drawAsColumn: boolean;
  /** Rendered under the column that owns this workspace (Default only). */
  footnote?: string;
  /** `isTeamRoleSurface(samplePath)` — does the "Viewing as" switch exist. */
  hasRoleSwitch: boolean;
  /** `isEnterpriseSurface(samplePath)` — entitled to org/team forced settings. */
  entitledForcedSettings: boolean;
};

type WorkspaceSeed = Omit<
  WorkspaceNode,
  "hasRoleSwitch" | "entitledForcedSettings"
>;

/* Left-to-right order of the chart: Free, Pro, Enterprise. Default trails as
 * the Free column's footnote. */
const WORKSPACE_SEEDS: WorkspaceSeed[] = [
  {
    id: "free",
    name: "Free",
    suffix: "-free",
    samplePath: "/overview-free",
    badges: ["Single owner"],
    note: "One person, their own keys. No teams, no roles, no budgets.",
    drawAsColumn: true,
  },
  {
    id: "pro",
    name: "Pro",
    suffix: "",
    samplePath: "/overview",
    badges: ["Team roles"],
    note: "The unsuffixed routes. Teams, budgets and roll-up, and the three-way role switch.",
    drawAsColumn: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    suffix: "-enterprise",
    samplePath: "/overview-enterprise",
    badges: ["Team roles", "Forced settings"],
    note: "Everything Pro has, plus the org and team lock layer that forces settings downward.",
    drawAsColumn: true,
  },
  {
    id: "default",
    name: "Default",
    suffix: "-default",
    samplePath: "/overview-default",
    badges: ["Single owner"],
    note: "The Free plan's first-day twin: same surfaces, empty states instead of data.",
    drawAsColumn: false,
    footnote:
      "Default = the Free plan on day one, empty states, suffix -default. Not an org type of its own, so it has no column.",
  },
];

export const SITE_MAP_WORKSPACES: WorkspaceNode[] = WORKSPACE_SEEDS.map(
  (seed) => ({
    ...seed,
    hasRoleSwitch: isTeamRoleSurface(seed.samplePath),
    entitledForcedSettings: isEnterpriseSurface(seed.samplePath),
  })
);

/** The workspaces that get a column. Default is drawn as a footnote instead. */
export const SITE_MAP_COLUMNS: WorkspaceNode[] = SITE_MAP_WORKSPACES.filter(
  (w) => w.drawAsColumn
);

/** The workspace a non-column workspace is footnoted under. */
export const FOOTNOTE_WORKSPACES: Record<WorkspaceId, WorkspaceNode[]> = {
  free: SITE_MAP_WORKSPACES.filter((w) => w.id === "default"),
  pro: [],
  enterprise: [],
  default: [],
};

/* ─── Roles ────────────────────────────────────────────────────────────── */

const personaName = (userId: string): string =>
  MEMBER_ROWS.find((m) => m.id === userId)?.name ?? userId;

export type RoleNode = {
  id: ViewRole;
  /** The label the "Viewing as" switch shows. */
  label: string;
  /** Persona name, read from `MEMBER_ROWS` — never hardcoded here. */
  persona: string;
  /** What this person is in the org. */
  standing: string;
};

/* Order matches the switch: Admin, Manager, Member. Pro draws all three even
 * though only Admin and Manager were named as tracks — the switch offers
 * Member on Pro, and the PRD gives every Pro org member a team, so leaving it
 * out would make the Pro fork lie about what a Pro org can look like. */
export const SITE_MAP_ROLES: RoleNode[] = [
  {
    id: "admin",
    label: "Admin",
    persona: personaName(ADMIN_USER_ID),
    standing: "Org owner. Unscoped: reads the whole org.",
  },
  {
    id: "manager",
    label: "Manager",
    persona: personaName(MANAGER_USER_ID),
    standing:
      "Manager of the Development team. A regular user who also has oversight of one team.",
  },
  {
    id: "member",
    label: "Member",
    persona: personaName(MEMBER_USER_ID),
    standing: "A regular user in the Development team. No oversight.",
  },
];

const ROLE_BY_ID = new Map(SITE_MAP_ROLES.map((r) => [r.id, r]));

/* ─── Data scope per role (pages/teams/view-scope.ts) ──────────────────── */

const SCOPED_PAGES =
  "Overview, Messages, Conversations, Security events, Audit trail, Activity and API keys";

const SCOPE_BY_ROLE: Record<ViewRole, string> = {
  admin: `Org-wide. Every key, every member, every team — ${SCOPED_PAGES} all read the whole org.`,
  manager: `Own keys on ${SCOPED_PAGES}. Plus team-level oversight of Development: usage, budget, members, keys and security-event counts.`,
  member: `Own keys on ${SCOPED_PAGES}. Nothing else — a member sees no team-level roll-up at all.`,
};

/* ─── Sidebar constant per workspace × role ────────────────────────────── */

type SidebarBinding = { name: string; sections: SidebarSection[] };

const SIDEBAR_BY_WORKSPACE_ROLE: Record<
  WorkspaceId,
  Partial<Record<ViewRole, SidebarBinding>>
> = {
  free: {
    admin: { name: "FREE_SIDEBAR_SECTIONS", sections: FREE_SIDEBAR_SECTIONS },
  },
  default: {
    admin: {
      name: "DEFAULT_SIDEBAR_SECTIONS",
      sections: DEFAULT_SIDEBAR_SECTIONS,
    },
  },
  pro: {
    admin: { name: "SIDEBAR_SECTIONS", sections: SIDEBAR_SECTIONS },
    manager: {
      name: "PRO_TEAM_ROLE_SIDEBAR_SECTIONS",
      sections: PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
    },
    member: {
      name: "PRO_MEMBER_SIDEBAR_SECTIONS",
      sections: PRO_MEMBER_SIDEBAR_SECTIONS,
    },
  },
  enterprise: {
    admin: {
      name: "ENTERPRISE_SIDEBAR_SECTIONS",
      sections: ENTERPRISE_SIDEBAR_SECTIONS,
    },
    manager: {
      name: "ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS",
      sections: ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
    },
    member: {
      name: "ENTERPRISE_MEMBER_SIDEBAR_SECTIONS",
      sections: ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
    },
  },
};

/* ─── Teams landing (pages/TeamsEnterprise.tsx bounce order) ───────────── */

const navPathsOf = (sections: SidebarSection[]): string[] =>
  sections.flatMap((section) => section.items.map((item) => item.pageId));

type TeamsLanding = { path: string; note: string };

/* Whether the WORKSPACE has Teams at all is an Admin question — read it off
 * that workspace's Admin sidebar. A Member's own sidebar has no Teams item on
 * any workspace, but that is a bounce, not an absent surface: Free is the only
 * workspace where Teams genuinely does not exist (HIDDEN_IN_FREE). */
function teamsLandingFor(
  workspace: WorkspaceNode,
  role: ViewRole
): TeamsLanding {
  const listPath = `/teams${workspace.suffix}`;
  const adminBinding = SIDEBAR_BY_WORKSPACE_ROLE[workspace.id].admin;
  const workspaceHasTeams = adminBinding
    ? navPathsOf(adminBinding.sections).includes(listPath)
    : false;
  if (!workspaceHasTeams) {
    return {
      path: "—",
      note: "No Teams surface on this workspace.",
    };
  }
  if (role === "admin") {
    return { path: listPath, note: "The org's team list." };
  }
  if (role === "manager") {
    return {
      path: `${listPath}/:teamId`,
      note: "Redirected past the list, straight onto their own team.",
    };
  }
  return {
    path: `/overview${workspace.suffix}`,
    note: "No Teams surface: a member is bounced to Overview.",
  };
}

/* ─── PRD citations per node ───────────────────────────────────────────── */

function prdRefsFor(workspace: WorkspaceNode, role: ViewRole): string[] {
  const refs: string[] = [PRD_REFS.planAvailability, PRD_REFS.personas];
  if (role !== "admin") {
    refs.push(PRD_REFS.teamScope);
  }
  if (workspace.entitledForcedSettings) {
    refs.push(PRD_REFS.forcedSettings);
  }
  refs.push(PRD_REFS.acceptance);
  return refs;
}

/* ─── Hidden pages per view ────────────────────────────────────────────── */

/** Every nav id the product has, read off the base Pro admin sidebar — the
 *  only view that carries all of them. */
const ALL_NAV_IDS: string[] = SIDEBAR_SECTIONS.flatMap((section) =>
  section.items.map((item) => item.id)
);

/** The ids this view does not get, derived by asking the same question the
 *  chrome asks before it renders a page: `sectionsIncludePage`. Hidden from
 *  the sidebar and blocked by URL are one fact, computed once in
 *  `layouts/nav-sections.ts`, so this page cannot describe a rule the shell
 *  does not enforce. */
const hiddenNavIdsOf = (sections: SidebarSection[]): string[] =>
  ALL_NAV_IDS.filter((id) => !sectionsIncludePage(sections, id));

/* ─── The matrix ───────────────────────────────────────────────────────── */

export type MatrixRow = {
  workspace: WorkspaceId;
  role: ViewRole;
  /** Persona name for this node, resolved from the role. */
  persona: string;
  /** Is the "Viewing as" switch present on this workspace at all. */
  switchAvailable: boolean;
  /** Name of the exported constant in `layouts/nav-sections.ts`. */
  sidebarConstant: string;
  /** The live sections that constant holds. */
  sidebar: SidebarSection[];
  /** One line: what data this view reads. */
  scope: string;
  /** Where Teams sends this person. */
  teamsLanding: TeamsLanding;
  /** Every route this view can reach: nav paths + detail twins + Teams landing. */
  routes: string[];
  /** The two detail routes for this workspace, kept separate for the chart. */
  detailRoutes: string[];
  /** Nav ids this view cannot reach: absent from its sidebar, and bounced to
   *  Overview if typed. Derived from the nav constants, never listed by hand. */
  hiddenNavIds: string[];
  /** PRD sections that justify this node. Never empty. */
  prdRefs: string[];
  /** Enterprise entitlement for org/team forced settings. */
  entitledForcedSettings: boolean;
};

function buildRow(workspace: WorkspaceNode, role: ViewRole): MatrixRow {
  const binding = SIDEBAR_BY_WORKSPACE_ROLE[workspace.id][role];
  if (!binding) {
    throw new Error(`No sidebar constant for ${workspace.id} / ${role}`);
  }
  const navPaths = navPathsOf(binding.sections);
  const detailRoutes = [
    `/messages-findings${workspace.suffix}/:requestId`,
    `/conversations-trace${workspace.suffix}/:conversationId`,
  ];
  const teamsLanding = teamsLandingFor(workspace, role);
  const routes = [...navPaths, ...detailRoutes];
  if (teamsLanding.path !== "—" && !routes.includes(teamsLanding.path)) {
    routes.push(teamsLanding.path);
  }

  return {
    workspace: workspace.id,
    role,
    persona: ROLE_BY_ID.get(role)?.persona ?? role,
    switchAvailable: workspace.hasRoleSwitch,
    sidebarConstant: binding.name,
    sidebar: binding.sections,
    scope: SCOPE_BY_ROLE[role],
    teamsLanding,
    routes,
    detailRoutes,
    hiddenNavIds: hiddenNavIdsOf(binding.sections),
    prdRefs: prdRefsFor(workspace, role),
    entitledForcedSettings: workspace.entitledForcedSettings,
  };
}

/** Every workspace × every role that workspace offers. A workspace without
 *  the switch has exactly one row, because arriving there snaps the role back
 *  to Admin (`layouts/DashboardChrome.tsx`). */
export const SITE_MAP_MATRIX: MatrixRow[] = SITE_MAP_WORKSPACES.flatMap((w) =>
  (w.hasRoleSwitch
    ? SITE_MAP_ROLES.map((r) => r.id)
    : (["admin"] as ViewRole[])
  ).map((role) => buildRow(w, role))
);

export const rowsForWorkspace = (id: WorkspaceId): MatrixRow[] =>
  SITE_MAP_MATRIX.filter((row) => row.workspace === id);

export const roleById = (id: ViewRole): RoleNode | undefined =>
  ROLE_BY_ID.get(id);

/** The hidden ids for one workspace × role node, for prose that has to name
 *  them. Reads the matrix rather than the constants a second time. */
export const hiddenNavIdsFor = (
  workspace: WorkspaceId,
  role: ViewRole
): string[] =>
  SITE_MAP_MATRIX.find(
    (row) => row.workspace === workspace && row.role === role
  )?.hiddenNavIds ?? [];

/** Copy shown where a workspace has no switch. */
export const NO_SWITCH_NOTE = "No role switch; role snaps to Admin on arrival.";

/* ─── Sections below the chart ─────────────────────────────────────────── */

export type ReferenceEntry = { term: string; detail: string };

/** PRD §3, §8.5, AG-624. Pro and Default hide all three. */
export const ENTERPRISE_ONLY_SURFACES: ReferenceEntry[] = [
  {
    term: "Teams — org Settings tab",
    detail:
      "The org's own policy and token-savings defaults, and the lock that forces them onto every team.",
  },
  {
    term: "Team detail — Settings",
    detail:
      "The team lock card, and the org to team cascade showing which setting a team inherits and which it still owns.",
  },
  {
    term: "Policies and Token savings",
    detail:
      "A locked banner and disabled inputs whenever an org or team lock governs the page.",
  },
  {
    term: "Pro and Default",
    detail:
      "Hide all three. Teams, budgets and the manager role are on Pro; only the forced-settings layer is Enterprise.",
  },
];

/** Nav ids as prose. Ids, not labels: this sheet is read against the code. */
const idList = (ids: string[]): string =>
  ids.length > 0 ? ids.join(", ") : "nothing";

/** How the two detail surfaces behave across workspaces and roles. */
export const DETAIL_PAGE_RULES: ReferenceEntry[] = [
  {
    term: "/messages-findings/:requestId",
    detail:
      "Opened from Messages. Has a -default, -free and -enterprise twin, and keeps the workspace it was opened from.",
  },
  {
    term: "/conversations-trace/:conversationId",
    detail:
      "Opened from Conversations. Same four twins, same rule: the workspace travels with the link.",
  },
  {
    term: "Not found, not forbidden",
    detail:
      "Manager and Member read only their own keys' rows, so a deep link to a row outside that set reads as not found rather than as a permission error.",
  },
  {
    term: "Teams",
    detail:
      "Admin sees the list. Manager is redirected onto their own team. Member has no Teams surface and is sent to Overview.",
  },
  {
    term: "Hidden pages",
    detail: `A page a role cannot see is hidden from that role's sidebar and blocked by URL: typing the path sends the viewer to Overview. Admin sees every page. Manager loses ${idList(hiddenNavIdsFor("pro", "manager"))}; Member loses ${idList(hiddenNavIdsFor("pro", "member"))}; the same on Enterprise. The Free workspace hides ${idList(hiddenNavIdsFor("free", "admin"))} from everyone, admin included: the PRD scopes it to Pro and Enterprise. One guard in layouts/DashboardChrome.tsx enforces both halves, so what the rail hides and what the URL blocks cannot disagree.`,
  },
];

/** PRD §8.4, ticket AG-697. */
export const NOT_BUILT_NOTE =
  "Not built yet: manager prompt visibility (AG-697). Prompt visibility is off by default, nobody but Admin sees another person's prompt content, and the manager read-only screen described in PRD §8.4 does not exist in this build.";
