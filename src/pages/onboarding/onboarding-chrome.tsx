import { Circle, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/App";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TabsCount } from "@/components/ui/tabs-count";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_EXITS,
  ONBOARDING_ROUTES,
} from "@/pages/onboarding/onboarding-routes";
import type { ExploreTask } from "@/pages/onboarding/onboarding-state";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";

/* ─── OnboardingChrome ──────────────────────────────────────────────────────
 * Every Onboarding step renders inside the normal dashboard chrome (sidebar,
 * top bar, workspace switcher) plus the mockup's top-bar "Get started"
 * progress control, passed through DashboardChrome's `topBarAction` slot.
 * (The demo controls strip was removed, owner direction 2026-10-08: each
 * step now drives its own simulated states.)
 * ───────────────────────────────────────────────────────────────────────── */

export function OnboardingChrome({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<LayoutContext>();
  return (
    <DashboardChrome
      activeNavId="overview"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
      topBarAction={<GetStartedButton />}
    >
      {children}
    </DashboardChrome>
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

function CurrentProgress() {
  const navigate = useNavigate();
  const { current, updateCurrent } = useOnboarding();
  const steps = [
    { label: "Choose your path", done: current.path },
    { label: "Connect a tool", done: current.connected },
    { label: "Send your first message", done: current.received },
    { label: "Simulate an attack", done: current.caught },
  ];
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
  const next = (() => {
    if (allSetup) {
      return ONBOARDING_ROUTES.complete;
    }
    if (!current.path) {
      return ONBOARDING_ROUTES.start;
    }
    if (!current.connected) {
      return ONBOARDING_ROUTES.connect;
    }
    return current.received
      ? ONBOARDING_ROUTES.attack
      : ONBOARDING_ROUTES.listening;
  })();

  return (
    <Popover>
      <PopoverTrigger
        closeDelay={100}
        delay={150}
        onClick={() => navigate(next)}
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
          {steps.map((step) => (
            <li
              className="type-copy-14 flex h-8 items-center gap-2 px-3 text-foreground"
              key={step.label}
            >
              <TaskGlyph done={step.done} />
              <span
                className={cn(
                  "flex-1 truncate",
                  step.done && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="type-copy-12 m-0 px-3 pt-2 pb-1 text-muted-foreground">
          Optional
        </p>
        <ul className="m-0 list-none p-0">
          {EXPLORE_TASKS.map(({ task, label, to }) => (
            <li key={task}>
              <button
                className="type-label-14 flex h-8 w-full cursor-pointer items-center gap-2 rounded-xs px-3 text-left text-foreground outline-none transition-[background-color] duration-100 ease-out hover:bg-accent-muted focus-visible:bg-accent-muted motion-reduce:transition-none"
                onClick={() => {
                  updateCurrent({ tasks: { ...current.tasks, [task]: true } });
                  navigate(to);
                }}
                type="button"
              >
                <TaskGlyph done={current.tasks[task]} />
                <span className="flex-1 truncate">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function ImprovedProgress() {
  const navigate = useNavigate();
  const { improved } = useOnboarding();
  const chat = improved.connection === "gate-chat";
  const done = chat
    ? Number(improved.pathChosen) + Number(improved.received)
    : Number(improved.pathChosen) +
      Number(improved.connected) +
      Number(improved.received);
  const total = chat ? 2 : 3;
  const verify = chat ? ONBOARDING_ROUTES.chat : ONBOARDING_ROUTES.verify;
  const next = (() => {
    if (!improved.pathChosen) {
      return ONBOARDING_ROUTES.start;
    }
    if (improved.received) {
      return ONBOARDING_ROUTES.improvedComplete;
    }
    if (improved.connected || chat) {
      return verify;
    }
    return ONBOARDING_ROUTES.improvedConnect;
  })();
  return (
    <Button onClick={() => navigate(next)} size="default" variant="outline">
      {improved.received ? (
        <CircleCheck
          aria-hidden
          className="text-success-600 dark:text-success-400"
          data-icon="inline-start"
          strokeWidth={1.75}
        />
      ) : (
        <Circle
          aria-hidden
          className="text-muted-foreground"
          data-icon="inline-start"
          strokeWidth={1.75}
        />
      )}
      {improved.received ? "Setup complete" : "Get started"}
      {improved.received ? null : (
        <TabsCount>
          {done}/{total}
        </TabsCount>
      )}
    </Button>
  );
}
