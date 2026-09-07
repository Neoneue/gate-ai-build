import { Lock } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import type { SidebarSection } from "@/components/ui/sidebar";
import { useViewRole } from "@/pages/teams/teams-store";
import {
  DETAIL_PAGE_RULES,
  ENTERPRISE_ONLY_SURFACES,
  FOOTNOTE_WORKSPACES,
  type MatrixRow,
  NO_SWITCH_NOTE,
  NOT_BUILT_NOTE,
  type ReferenceEntry,
  roleById,
  rowsForWorkspace,
  SITE_MAP_COLUMNS,
  type WorkspaceNode,
} from "./site-map/data";

/* ─────────────────────────────────────────────────────────────────────────
 * Site map (route: /site-map — typed, not linked from anywhere)
 *
 * A reference sheet, not a product surface. It stands OUTSIDE the dashboard
 * shell: no sidebar, no top bar, no workspace switcher — a chart of the
 * shell would be unreadable inside the shell it describes.
 *
 * Admin-only. A Manager or Member landing here is sent to Overview, the same
 * bounce Teams uses for a role that has no business on the surface.
 *
 * Every fact rendered here is read from `site-map/data.ts`, which in turn
 * reads `lib/plan.ts`, `layouts/nav-sections.ts` and `data/team-members.ts`.
 * Nothing on this page is typed twice, so it cannot drift from the app.
 *
 * Connectors are 1px `bg-border` rules: a drop line under each node, a rail
 * across the workspace row, and a spine with elbows into each role card. No
 * SVG, no arbitrary values — the tree survives any column count and any
 * wrap, which a hand-positioned diagram would not.
 * ───────────────────────────────────────────────────────────────────────── */

export function SiteMap() {
  const viewRole = useViewRole();

  // Same bounce as TeamsEnterprise: a role with no business on the surface
  // goes to Overview rather than seeing a permission error.
  if (viewRole !== "admin") {
    return <Navigate replace to="/overview" />;
  }

  return (
    <div className="@container min-h-dvh bg-background px-4 pt-8 pb-16 sm:px-6">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-8">
        <PageHeader />
        <FlowChart />
        <ReferenceSection
          entries={ENTERPRISE_ONLY_SURFACES}
          title="Enterprise-only surfaces"
        />
        <ReferenceSection
          entries={DETAIL_PAGE_RULES}
          title="Detail pages and not-found rule"
        />
        <Callout>{NOT_BUILT_NOTE}</Callout>
      </div>
    </div>
  );
}

/* ─── Page header ──────────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <header className="flex max-w-4xl flex-col gap-2">
      <PageTitle>Site map</PageTitle>
      <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
        How the dashboard is laid out for every workspace type, and what the
        "Viewing as" role switch changes about it. Developers read the route
        paths on each node; product reads the PRD sections that justify it.
      </p>
      <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
        Every value below is read from the app itself — the plan helpers in{" "}
        <code className="type-mono-14">lib/plan.ts</code>, the nav constants in{" "}
        <code className="type-mono-14">layouts/nav-sections.ts</code>, and the
        roster in <code className="type-mono-14">data/team-members.ts</code>. It
        cannot drift from what ships.
      </p>
    </header>
  );
}

/* ─── The chart ────────────────────────────────────────────────────────── */

function FlowChart() {
  return (
    <section aria-label="Workspaces and roles" className="flex flex-col gap-4">
      <div className="flex max-w-4xl flex-col gap-2">
        <PageTitle as="h2">Workspaces and roles</PageTitle>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          A workspace is a path suffix. A role is the "Viewing as" switch, which
          exists only where the workspace carries team roles. Monospace text is
          a literal route; a padlock marks a nav item the sidebar renders as an
          inert lock rather than a link.
        </p>
      </div>

      <div className="flex flex-col">
        <RootNode />
        {/* drop line out of the root node, then the rail the columns hang off */}
        <span aria-hidden="true" className="ml-4 block h-6 w-px bg-border" />
        <span aria-hidden="true" className="block h-px w-full bg-border" />
        <div className="grid @4xl:grid-cols-3 grid-cols-1 gap-4">
          {SITE_MAP_COLUMNS.map((workspace) => (
            <WorkspaceColumn key={workspace.id} workspace={workspace} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RootNode() {
  const admin = roleById("admin");
  return (
    <Card className="w-fit max-w-full">
      <CardContent className="flex flex-col gap-1">
        <p className="type-label-16 m-0 text-foreground">
          Signed in as {admin?.persona}
        </p>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          {admin?.standing} This page is Admin-only: any other role is sent to{" "}
          <span className="type-mono-14">/overview</span>.
        </p>
      </CardContent>
    </Card>
  );
}

function WorkspaceColumn({ workspace }: { workspace: WorkspaceNode }) {
  const rows = rowsForWorkspace(workspace.id);
  const footnotes = FOOTNOTE_WORKSPACES[workspace.id];

  return (
    <div className="flex min-w-0 flex-col">
      {/* stub connecting this column up to the rail */}
      <span aria-hidden="true" className="ml-4 block h-6 w-px bg-border" />
      <Card>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <SectionTitle as="h3">{workspace.name}</SectionTitle>
            <span className="type-mono-14 text-muted-foreground">
              {workspace.suffix === "" ? "no suffix" : workspace.suffix}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {workspace.badges.map((badge) => (
              <Badge key={badge} variant="neutral">
                {badge}
              </Badge>
            ))}
          </div>
          <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
            {workspace.note}
          </p>
        </CardContent>
      </Card>

      {/* Fork. The spine is a stretched flex child, so it runs the exact
          height of the branch group at any card height or column width. */}
      <div className="flex gap-2 pl-4">
        <span aria-hidden="true" className="w-px shrink-0 bg-border" />
        <div className="flex min-w-0 flex-1 flex-col gap-4 pt-4">
          <div className="flex flex-col gap-1">
            <p className="type-label-12 m-0 text-muted-foreground">
              Viewing as
            </p>
            {workspace.hasRoleSwitch ? null : (
              <p className="type-copy-12 m-0 text-pretty text-muted-foreground">
                {NO_SWITCH_NOTE}
              </p>
            )}
          </div>
          {rows.map((row) => (
            <div className="relative" key={`${row.workspace}-${row.role}`}>
              <span
                aria-hidden="true"
                className="absolute top-5 -left-2 h-px w-2 bg-border"
              />
              <RoleCard row={row} />
            </div>
          ))}
        </div>
      </div>

      {footnotes.map((note) => (
        <p
          className="type-copy-12 mt-4 text-pretty text-muted-foreground"
          key={note.id}
        >
          {note.footnote}
        </p>
      ))}
    </div>
  );
}

/* ─── Role node ────────────────────────────────────────────────────────── */

function RoleCard({ row }: { row: MatrixRow }) {
  const role = roleById(row.role);
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle as="h4">{role?.label}</CardTitle>
            <span className="type-copy-12 text-muted-foreground">
              {row.persona}
            </span>
          </div>
          <p className="type-copy-12 m-0 text-pretty text-muted-foreground">
            {role?.standing}
          </p>
        </div>

        <dl className="flex flex-col gap-2">
          <Field label="Data scope">{row.scope}</Field>
          <Field label="Teams landing">
            <span className="type-mono-12 break-all">
              {row.teamsLanding.path}
            </span>{" "}
            {row.teamsLanding.note}
          </Field>
        </dl>

        <div className="flex flex-col gap-2">
          <p className="type-label-12 m-0 text-foreground">
            Sidebar{" "}
            <span className="type-mono-12 break-all text-muted-foreground">
              {row.sidebarConstant}
            </span>
          </p>
          {row.sidebar.map((section, index) => (
            <NavGroup key={section.label ?? `top-${index}`} section={section} />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="type-label-12 m-0 text-foreground">Detail routes</p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {row.detailRoutes.map((path) => (
              <li
                className="type-mono-12 break-all text-muted-foreground"
                key={path}
              >
                {path}
              </li>
            ))}
          </ul>
        </div>

        <p className="type-label-12 m-0 text-foreground">
          PRD{" "}
          <span className="type-copy-12 text-muted-foreground">
            {row.prdRefs.join(" · ")}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="type-label-12 text-foreground">{label}</dt>
      <dd className="type-copy-12 m-0 text-pretty text-muted-foreground">
        {children}
      </dd>
    </div>
  );
}

function NavGroup({ section }: { section: SidebarSection }) {
  return (
    <div className="flex flex-col gap-1">
      {section.label ? (
        <p className="type-label-12 m-0 text-muted-foreground">
          {section.label}
        </p>
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {section.items.map((item) => (
          <li
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
            key={item.id}
          >
            <span className="flex items-center gap-2">
              <item.icon
                className="size-3.5 shrink-0 text-muted-foreground"
                strokeWidth={1.75}
              />
              <span className="type-label-12 text-foreground">
                {item.label}
              </span>
              {item.locked ? (
                <>
                  <Lock
                    aria-hidden="true"
                    className="size-3 shrink-0 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <span className="sr-only">locked</span>
                </>
              ) : null}
            </span>
            <span className="type-mono-12 break-all text-muted-foreground">
              {item.pageId ?? "no route"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Reference sections ───────────────────────────────────────────────── */

function ReferenceSection({
  title,
  entries,
}: {
  title: string;
  entries: ReferenceEntry[];
}) {
  return (
    <section aria-label={title} className="flex max-w-4xl flex-col gap-4">
      <PageTitle as="h2">{title}</PageTitle>
      <Card>
        <CardContent>
          <dl className="flex flex-col gap-4">
            {entries.map((entry) => (
              <div className="flex flex-col gap-1" key={entry.term}>
                <dt
                  className={
                    entry.term.startsWith("/")
                      ? "type-mono-14 break-all text-foreground"
                      : "type-label-14 text-foreground"
                  }
                >
                  {entry.term}
                </dt>
                <dd className="type-copy-14 m-0 text-pretty text-muted-foreground">
                  {entry.detail}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}
