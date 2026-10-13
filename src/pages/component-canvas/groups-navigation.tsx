import { Monogram } from "@/components/ui/monogram";
import { BrandLockup, Sidebar, SidebarPanel } from "@/components/ui/sidebar";
import { SidebarUpgradeCard } from "@/components/ui/sidebar-upgrade-card";
import {
  LogoMarkLink,
  SidebarToggleButton,
} from "@/components/ui/top-bar-brand";
import { SIDEBAR_SECTIONS } from "@/layouts/nav-sections";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import { Stateful } from "@/pages/component-canvas/demos";
import { SAMPLE_PERSON } from "@/pages/component-canvas/sample-data";

/* Navigation chrome (design.md "Page frame", "Brand marks"). The sidebar
 * reads the app's real section list; links move the canvas MemoryRouter,
 * new-tab items are blocked by the canvas host. The user row is a
 * placeholder passed through the public `userArea` prop. */

function placeholderUserArea() {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Monogram initials={SAMPLE_PERSON.initials} size="md" tone="blue" />
      <span className="type-label-14 truncate text-foreground">
        {SAMPLE_PERSON.name}
      </span>
    </span>
  );
}

const sidebar: CanvasGroup = {
  id: "sidebar",
  title: "Sidebar",
  files: ["sidebar.tsx"],
  columns: 3,
  examples: [
    {
      label: "expanded",
      render: () => (
        <div className="flex h-180 rounded-md border border-border">
          <Sidebar
            activeId="overview"
            expanded
            overviewPath="/overview"
            sections={SIDEBAR_SECTIONS}
            userArea={placeholderUserArea()}
          />
        </div>
      ),
    },
    {
      label: "expanded={false} (64px rail)",
      render: () => (
        <div className="flex h-180 rounded-md border border-border">
          <Sidebar
            activeId="overview"
            expanded={false}
            overviewPath="/overview"
            sections={SIDEBAR_SECTIONS}
            userArea={placeholderUserArea()}
          />
        </div>
      ),
    },
    {
      label: 'upgradePath="/upgrade" (upgrade card)',
      render: () => (
        <div className="flex h-180 rounded-md border border-border">
          <Sidebar
            activeId="overview"
            expanded
            onNavigate={() => undefined}
            overviewPath="/overview"
            sections={SIDEBAR_SECTIONS}
            upgradePath="/upgrade"
            userArea={placeholderUserArea()}
          />
        </div>
      ),
    },
    {
      label: "expand / collapse (SidebarToggleButton)",
      render: () => (
        <Stateful initial={true}>
          {(expanded, setExpanded) => (
            <div className="flex flex-col gap-3">
              <SidebarToggleButton
                expanded={expanded}
                onToggle={() => setExpanded(!expanded)}
              />
              <div className="flex h-180 rounded-md border border-border">
                <Sidebar
                  activeId="overview"
                  expanded={expanded}
                  overviewPath="/overview"
                  sections={SIDEBAR_SECTIONS}
                  userArea={placeholderUserArea()}
                />
              </div>
            </div>
          )}
        </Stateful>
      ),
    },
    {
      label: "SidebarPanel (phone sheet body)",
      render: () => (
        <div className="flex h-180 w-59 rounded-md border border-border bg-card">
          <SidebarPanel
            activeId="overview"
            hideDocsButton
            overviewPath="/overview"
            sections={SIDEBAR_SECTIONS}
            userArea={placeholderUserArea()}
          />
        </div>
      ),
    },
    {
      label: "BrandLockup",
      render: () => <BrandLockup overviewPath="/overview" />,
    },
  ],
};

const sidebarUpgradeCard: CanvasGroup = {
  id: "sidebar-upgrade-card",
  title: "SidebarUpgradeCard",
  files: ["sidebar-upgrade-card.tsx"],
  columns: 3,
  examples: [
    {
      label: "onClick",
      render: () => (
        <div className="w-53">
          <SidebarUpgradeCard onClick={() => undefined} />
        </div>
      ),
    },
    {
      label: "onDismiss (dismiss key)",
      render: () => (
        <div className="w-53">
          <SidebarUpgradeCard
            onClick={() => undefined}
            onDismiss={() => undefined}
          />
        </div>
      ),
    },
  ],
};

const topBarBrand: CanvasGroup = {
  id: "top-bar-brand",
  title: "Top bar brand",
  files: ["top-bar-brand.tsx"],
  columns: 3,
  examples: [
    {
      label: "SidebarToggleButton expanded",
      render: () => <SidebarToggleButton expanded onToggle={() => undefined} />,
    },
    {
      label: "SidebarToggleButton expanded={false}",
      render: () => (
        <SidebarToggleButton expanded={false} onToggle={() => undefined} />
      ),
    },
    {
      label: 'LogoMarkLink to="/overview"',
      render: () => <LogoMarkLink to="/overview" />,
    },
  ],
};

export const NAVIGATION_GROUPS: CanvasGroup[] = [
  sidebar,
  sidebarUpgradeCard,
  topBarBrand,
];
