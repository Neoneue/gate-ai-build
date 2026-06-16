import { Camera, MessageSquare, Upload } from "lucide-react";
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

function FeedbackFab() {
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
      {/* FAB trigger — fixed viewport anchor */}
      <button
        aria-label="Send feedback"
        className={cn(
          // Pill shape, outlined surface, shadow elevation, fixed viewport anchor
          "fixed right-6 bottom-6 z-40",
          "inline-flex h-8 items-center gap-2 rounded-full px-4",
          "whitespace-nowrap border border-border bg-card font-medium text-neutral-900 text-sm",
          "shadow-md",
          "transition-[colors,transform] duration-150 ease-out motion-reduce:transition-none",
          "cursor-pointer will-change-transform hover-fine:-translate-y-px hover:bg-muted active:scale-[0.99] motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0",
          "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          "select-none"
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <MessageSquare
          aria-hidden
          className="size-4 shrink-0"
          strokeWidth={1.75}
        />
        <span>Feedback</span>
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
              <span aria-live="polite" className="text-neutral-500 text-xs">
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
                <Upload aria-hidden className="size-3.5" strokeWidth={1.75} />
                Upload file
              </Button>
              <Button
                // Inert — mock UI, no handler
                aria-label="Capture screen"
                size="sm"
                type="button"
                variant="outline"
              >
                <Camera aria-hidden className="size-3.5" strokeWidth={1.75} />
                Capture screen
              </Button>
            </div>
            <p className="text-neutral-500 text-xs">
              PNG, JPEG, or WEBP, up to 10&nbsp;MB.
            </p>
          </div>

          {/* Contact email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback-email">
              Contact email{" "}
              <span className="font-normal text-neutral-500">(optional)</span>
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
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            disabled={messageIsEmpty}
            onClick={handleSubmit}
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
