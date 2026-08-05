import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon } from "lucide-react";
import { createContext, useContext } from "react";

import { cn } from "@/lib/utils";

/* ─── Stepper — vertical numbered step rail ─────────────────────────────────
 * Added 2026-08-05 for the Alerts create/edit wizard. Nothing in `ui/` did
 * numbered vertical steps: `Tabs` is peer views of equal stature (any one
 * reachable at any time), `Segmented` is a view filter, and a wizard is
 * neither — its steps are ORDERED, one is open at a time, and the ones behind
 * you are done. That is a different control, so it is a different primitive.
 *
 * Compound, in the house style (Dialog / Field / Menu):
 *
 *   <Stepper>                                  // <ol>
 *     <StepperItem index={1} state="complete"> // <li> — owns the rail
 *       <StepperIndicator />                   // the circle
 *       <StepperBody>
 *         <StepperTitle onClick={…}>Choose condition</StepperTitle>
 *         <StepperPanel>…fields…</StepperPanel>
 *       </StepperBody>
 *     </StepperItem>
 *   </Stepper>
 *
 * `state` is the ONLY visual axis, and it is supplied by the consumer — the
 * primitive holds no step state of its own. A wizard already owns "which step
 * am I on" plus per-step validity; a second copy inside the primitive could
 * disagree with it, and the disagreement would only show up as a wrong-looking
 * circle. `index` is likewise passed rather than derived from DOM order so a
 * consumer can render steps conditionally without the numbering shifting.
 * ───────────────────────────────────────────────────────────────────────── */

export type StepperState = "upcoming" | "active" | "complete";

type StepperItemContextValue = {
  index: number;
  state: StepperState;
};

const StepperItemContext = createContext<StepperItemContextValue | null>(null);

function useStepperItem(part: string): StepperItemContextValue {
  const context = useContext(StepperItemContext);
  if (!context) {
    throw new Error(`<${part}> must be rendered inside a <StepperItem>.`);
  }
  return context;
}

/** Screen-reader state word for the indicator. The visible circle is a numeral
 *  or a check glyph, neither of which announces position or progress. */
const STATE_DESCRIPTION: Record<StepperState, string> = {
  upcoming: "not started",
  active: "current step",
  complete: "completed",
};

function Stepper({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      className={cn("m-0 flex list-none flex-col p-0", className)}
      data-slot="stepper"
      {...props}
    />
  );
}

function StepperItem({
  className,
  index,
  state,
  children,
  ...props
}: React.ComponentProps<"li"> & StepperItemContextValue) {
  return (
    <StepperItemContext.Provider value={{ index, state }}>
      <li
        aria-current={state === "active" ? "step" : undefined}
        className={cn(
          "group/stepper-item relative flex gap-3 pb-6 last:pb-0",
          className
        )}
        data-slot="stepper-item"
        data-state={state}
        {...props}
      >
        {/* Connector rail. `left-3` is the 24px indicator's centre line, so the
            hairline drops out of the circle's bottom edge (`top-6`) and lands
            on the next one. Hidden on the last item — there is nothing below
            it to connect to, and a rail running into open space reads as a
            step that failed to render. */}
        <span
          aria-hidden
          className="absolute top-6 bottom-0 left-3 w-px -translate-x-1/2 bg-border group-last/stepper-item:hidden"
          data-slot="stepper-rail"
        />
        {children}
      </li>
    </StepperItemContext.Provider>
  );
}

const stepperIndicatorVariants = cva(
  // The numeral takes the badge voice (mono 12 tabular): a step index is a
  // counter, same reading as `<TabsCount>`. Tabular figures keep "1" and "3"
  // optically centred in the same box.
  "type-mono-12 relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none",
  {
    variants: {
      state: {
        upcoming: "bg-muted text-muted-foreground",
        // Active and complete share the filled circle on purpose: together
        // they read as one continuous "how far you have got" rail, and the
        // glyph inside (numeral vs check) carries the difference.
        active: "bg-primary text-primary-foreground",
        complete: "bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { state: "upcoming" },
  }
);

function StepperIndicator({
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children">) {
  const { index, state } = useStepperItem("StepperIndicator");
  return (
    <span
      className={cn(stepperIndicatorVariants({ state }), className)}
      data-slot="stepper-indicator"
      {...props}
    >
      <span className="sr-only">{`Step ${index}, ${STATE_DESCRIPTION[state]}`}</span>
      {state === "complete" ? (
        <CheckIcon aria-hidden className="size-3.5" strokeWidth={1.75} />
      ) : (
        <span aria-hidden>{index}</span>
      )}
    </span>
  );
}

function StepperBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex min-w-0 flex-1 flex-col gap-4", className)}
      data-slot="stepper-body"
      {...props}
    />
  );
}

const stepperTitleVariants = cva(
  // `min-h-6` matches the indicator so a 20px title line optically centres
  // against the 24px circle instead of sitting 2px high.
  "type-label-14 m-0 flex min-h-6 items-center",
  {
    variants: {
      state: {
        upcoming: "text-muted-foreground",
        // The active step is the only full-ink title on the rail — that IS the
        // "you are here" signal. A finished step recedes on COLOUR, never on
        // weight (design.md §3, quiet-labels corollary).
        active: "text-foreground",
        complete: "text-muted-foreground",
      },
    },
    defaultVariants: { state: "upcoming" },
  }
);

function StepperTitle({
  className,
  onClick,
  children,
  ...props
}: React.ComponentProps<"h3"> & {
  /** Pass to make the title a real control — the "click a finished step to go
   *  back to it" affordance. Omit and it renders as inert text. */
  onClick?: () => void;
}) {
  const { state } = useStepperItem("StepperTitle");
  return (
    <h3
      className={cn(stepperTitleVariants({ state }), className)}
      data-slot="stepper-title"
      {...props}
    >
      {onClick ? (
        // Not `<Button>` and not `<TextLink>`: a step title is neither a chrome
        // box nor an underlined inline-prose link. Same call `<BackLink>` made,
        // so it carries the same shape — quiet resting ink that lifts on hover,
        // an invisible vertical hit area, and the global press scale.
        <button
          className="relative rounded-xs text-left outline-none transition-[color,scale] duration-150 ease-out will-change-transform after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
          onClick={onClick}
          type="button"
        >
          {children}
        </button>
      ) : (
        children
      )}
    </h3>
  );
}

function StepperPanel({ className, ...props }: React.ComponentProps<"div">) {
  const { state } = useStepperItem("StepperPanel");
  // Unmounted rather than `hidden`. Every field in a stepped form is controlled
  // by the consumer, so nothing is lost by dropping the DOM — and Back keeping
  // its values becomes a property of the consumer's state instead of an
  // accident of which nodes happened to survive.
  if (state !== "active") {
    return null;
  }
  return (
    <div
      className={cn("flex flex-col gap-4", className)}
      data-slot="stepper-panel"
      {...props}
    />
  );
}

export type StepperIndicatorVariants = VariantProps<
  typeof stepperIndicatorVariants
>;

export {
  Stepper,
  StepperBody,
  StepperIndicator,
  StepperItem,
  StepperPanel,
  StepperTitle,
};
