import { Camera, MessageCircle, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * FeedbackFab — floating action button + Send Feedback dialog.
 *
 * Fixed bottom-right of viewport (z-40, sits below modal overlays at z-50).
 * Rendered once in DashboardChrome so every page inherits it for free.
 * Self-contained: owns open state, form state, and reset logic.
 * ───────────────────────────────────────────────────────────────────────── */

const MAX_MESSAGE_LENGTH = 8000;
const DEFAULT_EMAIL = "chad@constellationnetwork.io";

type FeedbackCategory = "bug" | "feature" | "question" | "other";

function FeedbackFab({ askAiOpen = false }: { askAiOpen?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<FeedbackCategory>("bug");
  const [message, setMessage] = React.useState("");
  const [email, setEmail] = React.useState(DEFAULT_EMAIL);

  function resetForm() {
    setCategory("bug");
    setMessage("");
    setEmail(DEFAULT_EMAIL);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      resetForm();
    }
  }

  function handleSubmit() {
    // No real backend — close, toast, reset.
    setOpen(false);
    resetForm();
    toast.success("Thanks for the feedback.");
  }

  const messageIsEmpty = message.trim().length === 0;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {/* FAB trigger — fixed viewport anchor. Round messenger-style
          launcher (mirrors staging's Intercom bubble): filled chat icon on
          the brand-blue CTA recipe (same classes as the Policies /
          TokenSavings / plan CTAs). */}
      <button
        aria-label="Send feedback"
        className={cn(
          "fixed right-6 bottom-6 z-40",
          "inline-flex size-12 items-center justify-center rounded-full",
          "bg-blue-700 text-white shadow-blue-700/30 shadow-sm hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700",
          // colors/transform keep their 150ms feel; `right` glides at 300ms
          // on the panel's exact curve so the FAB pushes left in lockstep with
          // the docked Ask AI panel. The panel animates `width` with the
          // `ease-out` utility, which Tailwind v4 resolves to the `--ease-out`
          // token (cubic-bezier(0.23,1,0.32,1)) in src/index.css; referencing
          // `var(--ease-out)` here shares that single source instead of a bare
          // `ease-out` keyword (cubic-bezier(0,0,0.58,1)), which lagged.
          // `motion-reduce:transition-none` drops all animation (shift lands
          // instantly). Composed as one arbitrary `transition` because the two
          // durations can't share a single Tailwind utility.
          "[transition:background-color_150ms_ease-out,transform_150ms_ease-out,right_300ms_var(--ease-out)] motion-reduce:transition-none",
          "cursor-pointer will-change-transform hover-fine:-translate-y-px active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          "select-none",
          // lg+ only: when the docked panel is open, shift left by its width
          // (24px + 368px) so the FAB stays over the main content, clear of the
          // panel. Below lg the panel is a z-50 Sheet overlay that covers the
          // FAB, so it stays at right-6 there.
          askAiOpen && "lg:right-[392px]"
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <MessageCircle
          aria-hidden
          className="size-5 shrink-0 fill-current"
          strokeWidth={1.75}
        />
      </button>

      {/* Dialog — sm:max-w-lg, p-6 */}
      <DialogContent className="p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Anything broken, confusing, or missing. We want to hear it.
            Screenshots optional.
          </DialogDescription>
        </DialogHeader>

        {/* Form body */}
        <div className="flex flex-col gap-4">
          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback-category">Category</Label>
            <Select
              onValueChange={(v) => setCategory(v as FeedbackCategory)}
              value={category}
            >
              <SelectTrigger className="w-32" id="feedback-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="feature">Feature request</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="feedback-message">Message</Label>
              <span
                aria-live="polite"
                className="type-copy-12 text-muted-foreground"
              >
                {message.length} / {MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <Textarea
              className="min-h-24 resize-none"
              id="feedback-message"
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(e) => {
                if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                  setMessage(e.target.value);
                }
              }}
              placeholder="Describe what you saw, what you expected, and any steps to reproduce."
              value={message}
            />
          </div>

          {/* Screenshot */}
          <div
            aria-labelledby="ff-screenshot-label"
            className="flex flex-col gap-2"
            role="group"
          >
            <Label id="ff-screenshot-label">Screenshot</Label>
            <div className="flex items-center gap-2">
              <Button
                // Inert — mock UI, no handler
                aria-label="Upload file"
                size="sm"
                type="button"
                variant="outline"
              >
                <Upload
                  aria-hidden
                  className="size-3.5"
                  data-icon="inline-start"
                  strokeWidth={1.75}
                />
                Upload file
              </Button>
              <Button
                // Inert — mock UI, no handler
                aria-label="Capture screen"
                size="sm"
                type="button"
                variant="outline"
              >
                <Camera
                  aria-hidden
                  className="size-3.5"
                  data-icon="inline-start"
                  strokeWidth={1.75}
                />
                Capture screen
              </Button>
            </div>
            <p className="type-copy-12 text-muted-foreground">
              PNG, JPEG, or WEBP, up to 10&nbsp;MB.
            </p>
          </div>

          {/* Contact email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback-email">
              Contact email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="feedback-email"
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              value={email}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter>
          <DialogClose
            render={<Button size="default" type="button" variant="outline" />}
          >
            Cancel
          </DialogClose>
          <Button
            disabled={messageIsEmpty}
            onClick={handleSubmit}
            size="default"
            type="button"
          >
            Send feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { FeedbackFab };
