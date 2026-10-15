import { Circle, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/App";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SidebarSection } from "@/components/ui/sidebar";
import { TabsCount } from "@/components/ui/tabs-count";
import { cn } from "@/lib/utils";
import { OnboardingDashboardChrome } from "@/pages/onboarding/OnboardingDashboardChrome";
import {
  NEW_TAB_CUE,
  ONBOARDING_EXITS,
  ONBOARDING_ROUTES,
  openInNewTab,
  SETUP_NAV_ID,
  setupSidebarSections,
  setupTasksDone,
} from "@/pages/onboarding/onboarding-routes";
import type {
  ExploreTask,
  ImprovedConnection,
} from "@/pages/onboarding/onboarding-state";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";

/* ─── OnboardingChrome ──────────────────────────────────────────────────────
 * Every Onboarding step renders inside the normal dashboard chrome (sidebar,
 * top bar, workspace switcher) plus the mockup's top-bar "Get started"
 * progress control, passed through the chrome's `topBarAction` slot. The
 * chrome is the onboarding copy (OnboardingDashboardChrome), never the
 * shared DashboardChrome.
 * (The demo controls strip was removed, owner direction 2026-10-08: each
 * step now drives its own simulated states.)
 * ───────────────────────────────────────────────────────────────────────── */

export function OnboardingChrome({
  children,
  mobileSections,
  onMobileNavigate,
  showAskAi = false,
}: {
  children: ReactNode;
  /** The Overview after setup only: Ask AI's trigger and panel. */
  showAskAi?: boolean;
  /** The phone menu's nav, below `lg` only (OnboardingDashboardChrome). */
  mobileSections?: SidebarSection[];
  /** A phone menu link's href as it is tapped, below `lg` only. */
  onMobileNavigate?: (href: string) => void;
}) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<LayoutContext>();
  const { pathname } = useLocation();
  const { flow, improved } = useOnboarding();
  // The Improved flow's desktop rail (owner 2026-10-13): "Get started" is
  // the active row on every step, Overview is always there (the workspace
  // pages carry the same rail, DashboardChrome). A page that passes a phone
  // menu keeps the plain list (phone unchanged).
  const setupNav =
    flow === "improved" && !mobileSections
      ? {
          sections: setupSidebarSections(improved),
          activeNavId:
            pathname === ONBOARDING_ROUTES.setupOverview ||
            setupTasksDone(improved)
              ? "overview"
              : SETUP_NAV_ID,
        }
      : null;
  return (
    <OnboardingDashboardChrome
      // B's phone start is its "Get started" row (owner 2026-10-15).
      activeNavId={
        setupNav?.activeNavId ?? (mobileSections ? SETUP_NAV_ID : "overview")
      }
      mobileSections={mobileSections}
      onMobileNavigate={onMobileNavigate}
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sections={setupNav?.sections}
      showAskAi={showAskAi}
      sidebarExpanded={sidebarExpanded}
      topBarAction={<GetStartedButton />}
    >
      {children}
    </OnboardingDashboardChrome>
  );
}

/* ─── Top-bar progress ─────────────────────────────────────────────────── */

const EXPLORE_TASKS: { task: ExploreTask; label: string; to: string }[] = [
  {
    task: "policies",
    label: "Tune your policies",
    to: ONBOARDING_EXITS.policies,
  },
  { task: "limits", label: "Set spend limits", to: ONBOARDING_EXITS.limits },
  { task: "savings", label: "See token savings", to: ONBOARDING_EXITS.savings },
  { task: "models", label: "Browse Gate models", to: ONBOARDING_EXITS.models },
];

function GetStartedButton() {
  const { flow } = useOnboarding();
  return flow === "current" ? <CurrentProgress /> : <ImprovedProgress />;
}

/** Done / not-done glyph for one checklist row. */
function TaskGlyph({ done }: { done: boolean }) {
  return done ? (
    <CircleCheck
      aria-hidden
      className="size-4 shrink-0 text-success-600 dark:text-success-400"
      strokeWidth={1.75}
    />
  ) : (
    <Circle
      aria-hidden
      className="size-4 shrink-0 text-muted-foreground"
      strokeWidth={1.75}
    />
  );
}

/** A checklist row that opens nothing: glyph, then label (the Current
 *  menu's original setup row). Done rows go quiet. */
function PlainRow({ done, label }: { done: boolean; label: string }) {
  return (
    <span className="type-copy-14 flex h-8 items-center gap-2 px-3 text-foreground">
      <TaskGlyph done={done} />
      <span className={cn("flex-1 truncate", done && "text-muted-foreground")}>
        {label}
      </span>
    </span>
  );
}

/** One clickable checklist row in the progress menu: glyph, then label. */
function MenuRow({
  done,
  label,
  onClick,
  newTab = false,
}: {
  done: boolean;
  label: string;
  onClick: () => void;
  /** Opens a new tab: the screen-reader cue follows the label. */
  newTab?: boolean;
}) {
  // A checked-off row is never a link back (owner 2026-10-13).
  if (done) {
    return <PlainRow done label={label} />;
  }
  return (
    <button
      className="type-label-14 flex h-8 w-full cursor-pointer items-center gap-2 rounded-xs px-3 text-left text-foreground outline-none transition-[background-color] duration-100 ease-out hover:bg-accent-muted focus-visible:bg-accent-muted motion-reduce:transition-none"
      onClick={onClick}
      type="button"
    >
      <TaskGlyph done={done} />
      <span className="flex-1 truncate">
        {label}
        {newTab ? <span className="sr-only"> {NEW_TAB_CUE}</span> : null}
      </span>
    </button>
  );
}

/** 16px progress ring: the track is `--border`, the arc is `--info` (blue is
 *  reserved for info / completed, design.md §2). */
function ProgressRing({ fraction }: { fraction: number }) {
  const circumference = 2 * Math.PI * 6;
  return (
    <svg
      aria-hidden
      className="size-4 -rotate-90"
      data-onboarding-progress-ring=""
      viewBox="0 0 16 16"
    >
      <circle
        className="stroke-border"
        cx="8"
        cy="8"
        fill="none"
        r="6"
        strokeWidth="2"
      />
      <circle
        className="stroke-info"
        cx="8"
        cy="8"
        fill="none"
        r="6"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - fraction)}
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

/** The Current flow's menu. The trigger only opens it (owner 2026-10-13);
 *  setup rows open the steps already reached, task rows their pages. */
function CurrentProgress() {
  const navigate = useNavigate();
  const { current, updateCurrent } = useOnboarding();
  const steps = [
    {
      label: "Choose your path",
      done: current.path,
      to: ONBOARDING_ROUTES.start,
    },
    {
      label: "Connect a tool",
      done: current.connected,
      to: ONBOARDING_ROUTES.connect,
    },
    {
      label: "Send your first message",
      done: current.received,
      to: ONBOARDING_ROUTES.listening,
    },
    {
      label: "Simulate an attack",
      done: current.caught,
      to: ONBOARDING_ROUTES.attack,
    },
  ];
  const firstOpen = steps.findIndex((step) => !step.done);
  const setupDone = steps.filter((step) => step.done).length;
  const tasksDone = EXPLORE_TASKS.filter(
    ({ task }) => current.tasks[task]
  ).length;
  const allSetup = setupDone === steps.length;
  if (allSetup && tasksDone === EXPLORE_TASKS.length) {
    return null;
  }
  const done = allSetup ? tasksDone : setupDone;
  const total = allSetup ? EXPLORE_TASKS.length : steps.length;
  return (
    <Popover>
      <PopoverTrigger
        closeDelay={100}
        delay={150}
        openOnHover
        render={<Button size="default" variant="outline" />}
      >
        <ProgressRing fraction={done / total} />
        {allSetup ? "Tasks" : "Get started"}
        <TabsCount>
          {done}/{total}
        </TabsCount>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-1">
        <p className="type-copy-12 m-0 px-3 pt-2 pb-1 text-muted-foreground">
          Setup
        </p>
        <ul className="m-0 list-none p-0">
          {steps.map((step, index) => (
            <li key={step.label}>
              {/* Forward only (owner 2026-10-13): the step due next is the
                  one link; done and later steps are plain rows. */}
              {index === firstOpen ? (
                <MenuRow
                  done={step.done}
                  label={step.label}
                  onClick={() => navigate(step.to)}
                />
              ) : (
                <PlainRow done={step.done} label={step.label} />
              )}
            </li>
          ))}
        </ul>
        <p className="type-copy-12 m-0 px-3 pt-2 pb-1 text-muted-foreground">
          Optional
        </p>
        <ul className="m-0 list-none p-0">
          {EXPLORE_TASKS.map(({ task, label, to }) => (
            <li key={task}>
              <MenuRow
                done={current.tasks[task]}
                label={label}
                newTab
                onClick={() => {
                  updateCurrent({ tasks: { ...current.tasks, [task]: true } });
                  openInNewTab(to);
                }}
              />
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** Each Improved path's setup steps, the menu's rows in order (owner
 *  2026-10-13): the label, the state flag that marks it done and the page
 *  it opens. Row 2 is the path's own step 2 title; the count's total is the
 *  list's length. The Gate Chat path has no menu. */
const IMPROVED_PATH_STEPS: Record<
  Exclude<ImprovedConnection, "gate-chat">,
  readonly {
    label: string;
    flag: "pathChosen" | "connected" | "received" | "caught";
    to: string;
  }[]
> = {
  "gate-connect": [
    {
      label: "Choose how to use Gate",
      flag: "pathChosen",
      to: ONBOARDING_ROUTES.start,
    },
    {
      label: "Set up Gate Connect",
      flag: "connected",
      to: ONBOARDING_ROUTES.improvedConnect,
    },
    {
      label: "Send a test message",
      flag: "received",
      to: ONBOARDING_ROUTES.verify,
    },
    {
      label: "Run the protection demo",
      flag: "caught",
      to: ONBOARDING_ROUTES.verify,
    },
  ],
  manual: [
    {
      label: "Choose how to use Gate",
      flag: "pathChosen",
      to: ONBOARDING_ROUTES.start,
    },
    {
      label: "Manual setup",
      flag: "connected",
      to: ONBOARDING_ROUTES.improvedConnect,
    },
    {
      label: "Send a test message",
      flag: "received",
      to: ONBOARDING_ROUTES.verify,
    },
    {
      label: "Run the protection demo",
      flag: "caught",
      to: ONBOARDING_ROUTES.verify,
    },
  ],
};

/** The pages that show the Improved flow's menu: step 2, step 3 and the
 *  final page. */
const IMPROVED_MENU_ROUTES: readonly string[] = [
  ONBOARDING_ROUTES.improvedConnect,
  ONBOARDING_ROUTES.verify,
  ONBOARDING_ROUTES.improvedComplete,
];

/** The Improved flow's menu: the Current flow's popover (owner 2026-10-13)
 *  with the Improved setup steps, read live from the chosen path. Setup
 *  rows open the steps already reached; a later step is a plain row. From
 *  the final page on the trigger reads "Tasks" and counts its explore
 *  tasks. The trigger only opens the menu: it never navigates, so nothing
 *  skips Finish setup. */
function ImprovedProgress() {
  const navigate = useNavigate();
  const { improved, updateImproved } = useOnboarding();
  const { pathname } = useLocation();
  // Only Gate Connect and Manual setup carry the menu, from step 2 on
  // (owner 2026-10-13): none on the picker or the Gate Chat path.
  if (
    improved.connection === "gate-chat" ||
    !IMPROVED_MENU_ROUTES.includes(pathname)
  ) {
    return null;
  }
  const steps = IMPROVED_PATH_STEPS[improved.connection].map((step) => ({
    label: step.label,
    done: improved[step.flag],
    to: step.to,
  }));
  // A step counts once every step before it is done too, so a flag left
  // from an earlier pass (a demo run before the app changed) never checks
  // a row out of order.
  for (const [index, step] of steps.entries()) {
    step.done = step.done && (index === 0 || steps[index - 1].done);
  }
  const firstOpen = steps.findIndex((step) => !step.done);
  const allSetup = firstOpen === -1;
  // "Tasks" only from the final page on (owner 2026-10-13): step 3 with
  // every setup step done still reads "Get started 4/4".
  const finished = allSetup && improved.finished;
  const setupDone = steps.filter((step) => step.done).length;
  const tasksDone = EXPLORE_TASKS.filter(
    ({ task }) => improved.tasks[task]
  ).length;
  if (finished && tasksDone === EXPLORE_TASKS.length) {
    return null;
  }
  const done = finished ? tasksDone : setupDone;
  const total = finished ? EXPLORE_TASKS.length : steps.length;
  return (
    <Popover>
      <PopoverTrigger
        closeDelay={100}
        delay={150}
        openOnHover
        render={<Button size="default" variant="outline" />}
      >
        <ProgressRing fraction={done / total} />
        {finished ? "Tasks" : "Get started"}
        <TabsCount>
          {done}/{total}
        </TabsCount>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-1">
        <p className="type-copy-12 m-0 px-3 pt-2 pb-1 text-muted-foreground">
          Setup
        </p>
        <ul className="m-0 list-none p-0">
          {steps.map((step, index) => (
            <li key={step.label}>
              {/* Forward only (owner 2026-10-13): the step due next is the
                  one link; done and later steps are plain rows, and no row
                  reaches the final page (Finish setup does). */}
              {index === firstOpen ? (
                <MenuRow
                  done={step.done}
                  label={step.label}
                  onClick={() => navigate(step.to)}
                />
              ) : (
                <PlainRow done={step.done} label={step.label} />
              )}
            </li>
          ))}
        </ul>
        {/* The explore tasks join on the final page: a task page is
            outside the setup flow. */}
        {finished ? (
          <>
            <p className="type-copy-12 m-0 px-3 pt-2 pb-1 text-muted-foreground">
              Optional
            </p>
            <ul className="m-0 list-none p-0">
              {EXPLORE_TASKS.map(({ task, label, to }) => (
                <li key={task}>
                  <MenuRow
                    done={improved.tasks[task]}
                    label={label}
                    newTab
                    onClick={() => {
                      updateImproved((state) => ({
                        tasks: { ...state.tasks, [task]: true },
                      }));
                      openInNewTab(to);
                    }}
                  />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
