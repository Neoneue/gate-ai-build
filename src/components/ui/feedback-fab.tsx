import * as React from "react"
import { MessageSquare, Upload, Camera } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/* ─────────────────────────────────────────────────────────────────────────
 * FeedbackFab — floating action button + Send Feedback dialog.
 *
 * Fixed bottom-right of viewport (z-40, sits below modal overlays at z-50).
 * Rendered once in DashboardChrome so every page inherits it for free.
 * Self-contained: owns open state, form state, and reset logic.
 * ───────────────────────────────────────────────────────────────────────── */

const MAX_MESSAGE_LENGTH = 8000
const DEFAULT_EMAIL = "chad@constellationnetwork.io"

type FeedbackCategory = "bug" | "feature" | "question" | "other"

function FeedbackFab() {
  const [open, setOpen] = React.useState(false)
  const [category, setCategory] = React.useState<FeedbackCategory>("bug")
  const [message, setMessage] = React.useState("")
  const [email, setEmail] = React.useState(DEFAULT_EMAIL)

  function resetForm() {
    setCategory("bug")
    setMessage("")
    setEmail(DEFAULT_EMAIL)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) resetForm()
  }

  function handleSubmit() {
    // No real backend — close, toast, reset.
    setOpen(false)
    resetForm()
    toast.success("Thanks for the feedback.")
  }

  const messageIsEmpty = message.trim().length === 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* FAB trigger — fixed viewport anchor */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className={cn(
          // Pill shape, dark surface, shadow elevation, fixed viewport anchor
          "fixed bottom-6 right-6 z-40",
          "inline-flex items-center gap-2 rounded-full px-4 h-10",
          "bg-neutral-900 text-white text-sm font-medium whitespace-nowrap",
          "shadow-(--shadow-popup)",
          "transition-colors duration-150 ease-out motion-reduce:transition-none",
          "hover:bg-neutral-800",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
          "select-none",
        )}
      >
        <MessageSquare className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <span>Feedback</span>
      </button>

      {/* Dialog — sm:max-w-lg, p-6 */}
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Anything broken, confusing, or missing. We want to hear it. Screenshots optional.
          </DialogDescription>
        </DialogHeader>

        {/* Form body */}
        <div className="flex flex-col gap-4">
          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback-category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as FeedbackCategory)}
            >
              <SelectTrigger id="feedback-category" className="w-32">
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
              <span className="text-xs text-neutral-500" aria-live="polite">
                {message.length} / {MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <Textarea
              id="feedback-message"
              placeholder="Describe what you saw, what you expected, and any steps to reproduce."
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                  setMessage(e.target.value)
                }
              }}
              className="min-h-24 resize-none"
              maxLength={MAX_MESSAGE_LENGTH}
            />
          </div>

          {/* Screenshot */}
          <div className="flex flex-col gap-2">
            <Label>Screenshot</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                // Inert — mock UI, no handler
                aria-label="Upload file"
              >
                <Upload className="size-3.5" strokeWidth={1.75} aria-hidden />
                Upload file
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                // Inert — mock UI, no handler
                aria-label="Capture screen"
              >
                <Camera className="size-3.5" strokeWidth={1.75} aria-hidden />
                Capture screen
              </Button>
            </div>
            <p className="text-xs text-neutral-500">
              PNG, JPEG, or WEBP, up to 10 MB.
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            disabled={messageIsEmpty}
            onClick={handleSubmit}
          >
            Send feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { FeedbackFab }
