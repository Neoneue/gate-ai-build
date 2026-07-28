import {
  AppWindow,
  ArrowRight,
  BookOpenText,
  BotMessageSquare,
  Headset,
  type LucideIcon,
  Users,
} from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── AskAiEmptyState — the panel's zero-message surface ─────────────────────
 * Shown while `messages.length === 0`; the thread replaces it the moment the
 * first turn exists. Layout is Figma (node 1114:6477): 32px agent mark, 24px
 * gap, the 18px title, 24px gap, then four 44px pills at 8px pitch.
 *
 * The pills are `<Button shape="pill" size="xl" variant="outline">` — the
 * outline recipe already IS the mock's resting chrome (`border-border bg-card
 * shadow-xs`), so nothing about how they look is set here. `className` carries
 * layout only (`w-full justify-between`).
 *
 * Each label is sent VERBATIM as the first user message through the panel's
 * `handleSend`, so it lands in the user bubble exactly as written and then
 * routes through the existing scripted responder. No suggestion is
 * special-cased: "How to set up Gate Connect app" satisfies
 * `matchesGateConnectSetup()` on its own words ("set" + "gate"), the other
 * three deliberately fall through to the unmatched reply. Reword one of these
 * strings and you change which reply it gets — that coupling is the point.
 * ────────────────────────────────────────────────────────────────────────── */

interface Suggestion {
  icon: LucideIcon;
  label: string;
}

const SUGGESTIONS: Suggestion[] = [
  { icon: BookOpenText, label: "Learn the basics of Gate AI" },
  { icon: AppWindow, label: "How to set up Gate Connect app" },
  { icon: Users, label: "Adding new members to a team" },
  { icon: Headset, label: "Help contact customer support" },
];

export interface AskAiEmptyStateProps {
  className?: string;
  /** Sends the clicked label as the first user message. */
  onSelect: (label: string) => void;
}

export function AskAiEmptyState({ className, onSelect }: AskAiEmptyStateProps) {
  const titleId = useId();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6",
        className
      )}
    >
      <div className="flex w-full flex-col items-center gap-6">
        <BotMessageSquare
          aria-hidden
          className="size-8 text-foreground"
          strokeWidth={1.75}
        />
        <h2
          className="type-heading-18 text-center text-foreground"
          id={titleId}
        >
          How can I assist you today?
        </h2>
      </div>
      <ul aria-labelledby={titleId} className="flex w-full flex-col gap-2">
        {SUGGESTIONS.map(({ icon: Icon, label }) => (
          <li key={label}>
            <Button
              className="w-full justify-between"
              onClick={() => onSelect(label)}
              shape="pill"
              size="xl"
              type="button"
              variant="outline"
            >
              <span className="flex items-center gap-3">
                <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                <span className="type-label-14">{label}</span>
              </span>
              <ArrowRight
                aria-hidden
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.75}
              />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
