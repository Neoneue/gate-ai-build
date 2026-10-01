import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAT_MEASURE } from "./chat-layout";
import { CHAT_COPY, CHAT_STARTER_PROMPTS } from "./copy";

export interface ChatLandingProps {
  className?: string;
  onPromptSelect?: (prompt: string) => void;
  organizationName?: string | null;
}

export function ChatLanding({
  organizationName,
  onPromptSelect,
  className,
}: ChatLandingProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      // gap-6: the site's 28px section gap is an odd 4-multiple, which
      // design.md §4 bars at the surface tier; 24px is the nearest rung.
      className={cn(
        CHAT_MEASURE,
        "flex w-full max-w-2xl flex-col items-center gap-6 text-center",
        className
      )}
    >
      <div className="flex max-w-2xl flex-col items-center gap-3">
        <h2
          className="type-heading-32 text-balance text-foreground"
          id={titleId}
        >
          {CHAT_COPY.landingTitle}
        </h2>
        <p className="type-copy-16 max-w-xl text-pretty text-muted-foreground">
          {CHAT_COPY.landingDescription}
        </p>
      </div>

      {onPromptSelect ? (
        <div
          aria-label="Starter prompts"
          className="flex w-full flex-col gap-2"
        >
          {CHAT_STARTER_PROMPTS.map((prompt) => (
            // The Ask AI suggestion-row recipe (outline + pill + default);
            // `h-auto min-h-9 whitespace-normal` only lets a long prompt wrap
            // on a phone instead of overflowing the row.
            <Button
              className="h-auto min-h-9 w-full justify-between whitespace-normal text-left"
              key={prompt}
              onClick={() => onPromptSelect(prompt)}
              shape="pill"
              size="default"
              type="button"
              variant="outline"
            >
              <span>{prompt}</span>
              <ArrowUpRight
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
                data-icon="inline-end"
                strokeWidth={1.75}
              />
            </Button>
          ))}
        </div>
      ) : null}

      <p className="type-label-12 flex items-center justify-center gap-2 text-muted-foreground">
        <ShieldCheck
          aria-hidden
          className="size-4 shrink-0"
          strokeWidth={1.75}
        />
        <span>
          {organizationName
            ? `${organizationName} · ${CHAT_COPY.protectedByGate}`
            : CHAT_COPY.protectedByGate}
        </span>
      </p>
    </section>
  );
}
