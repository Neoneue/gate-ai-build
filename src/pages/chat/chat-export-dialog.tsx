import { Download, FileJson, FileText } from "lucide-react";
import { useEffect, useState } from "react";
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
import type { ChatExportFormat } from "./contract";
import { CHAT_COPY } from "./copy";
import type { ChatConversation } from "./types";

// Local rather than in CHAT_COPY: only this dialog says either of them.
const TRY_AGAIN_LABEL = "Try again";
const CLOSE_LABEL = "Close";

type ExportState =
  | { kind: "idle" }
  | { kind: "ready"; url: string; filename: string }
  | { kind: "failed" };

const FORMATS: {
  value: ChatExportFormat;
  label: string;
  Icon: typeof FileText;
}[] = [
  { value: "markdown", label: CHAT_COPY.exportFormatMarkdown, Icon: FileText },
  { value: "json", label: CHAT_COPY.exportFormatJson, Icon: FileJson },
];

const NON_ALNUM = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-|-$/g;

function filenameFor(title: string, format: ChatExportFormat): string {
  const stem = title
    .trim()
    .toLowerCase()
    .replace(NON_ALNUM, "-")
    .replace(EDGE_DASHES, "");
  return `${stem || "conversation"}.${format === "json" ? "json" : "md"}`;
}

/**
 * Transcript export for one conversation, ported from the site's
 * `components/chat/chat-export-dialog.tsx`. The site queues a job and polls a
 * worker for a signed URL; this build has no worker, so the file is written
 * in the browser from the conversation already on screen, and the Download
 * link is an object URL that is revoked the moment the dialog lets go of it.
 * Nothing leaves the page.
 */
export function ChatExportDialog({
  target,
  onClose,
  build,
}: {
  /** Produces the file body for a conversation id in a format. */
  build: (conversationId: string, format: ChatExportFormat) => string | null;
  onClose: () => void;
  target: ChatConversation | null;
}) {
  const [format, setFormat] = useState<ChatExportFormat>("markdown");
  const [state, setState] = useState<ExportState>({ kind: "idle" });
  const conversationId = target?.id ?? null;

  // A new target starts from the format choice again (adjusted during
  // render, React's "store the previous prop" pattern).
  const [previousId, setPreviousId] = useState(conversationId);
  if (previousId !== conversationId) {
    setPreviousId(conversationId);
    setState({ kind: "idle" });
  }

  // The object URL lives exactly as long as the ready state that shows it.
  useEffect(() => {
    if (state.kind !== "ready") {
      return;
    }
    const url = state.url;
    return () => URL.revokeObjectURL(url);
  }, [state]);

  function start(chosen: ChatExportFormat) {
    if (!(conversationId && target)) {
      return;
    }
    setFormat(chosen);
    const body = build(conversationId, chosen);
    if (body === null) {
      setState({ kind: "failed" });
      return;
    }
    const blob = new Blob([body], {
      type: chosen === "json" ? "application/json" : "text/markdown",
    });
    setState({
      kind: "ready",
      url: URL.createObjectURL(blob),
      filename: filenameFor(target.title, chosen),
    });
  }

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={target !== null}>
      <DialogContent density="compact">
        <DialogHeader>
          <DialogTitle>{CHAT_COPY.exportConversation}</DialogTitle>
          <DialogDescription>{CHAT_COPY.exportDescription}</DialogDescription>
        </DialogHeader>

        {state.kind === "idle" ? (
          <div className="flex flex-col gap-2">
            {FORMATS.map(({ value, label, Icon }) => (
              <Button
                className="w-full justify-start"
                disabled={!conversationId}
                key={value}
                onClick={() => start(value)}
                size="default"
                type="button"
                variant="outline"
              >
                <Icon aria-hidden data-icon="inline-start" strokeWidth={1.75} />
                <span className="truncate">{label}</span>
              </Button>
            ))}
          </div>
        ) : null}

        {state.kind === "ready" ? (
          <Button
            className="w-full justify-center"
            nativeButton={false}
            render={
              // biome-ignore lint/a11y/useAnchorContent: Base UI renders the Button's children into this anchor
              <a
                download={state.filename}
                href={state.url}
                rel="noreferrer"
                target="_blank"
              />
            }
            size="default"
          >
            <Download aria-hidden data-icon="inline-start" strokeWidth={1.75} />
            {CHAT_COPY.exportReady}
          </Button>
        ) : null}

        {state.kind === "failed" ? (
          <div className="flex flex-col items-start gap-3">
            <p className="type-copy-12 text-destructive" role="alert">
              {CHAT_COPY.exportFailed}
            </p>
            <Button
              onClick={() => start(format)}
              size="sm"
              type="button"
              variant="outline"
            >
              {TRY_AGAIN_LABEL}
            </Button>
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose
            render={<Button size="default" type="button" variant="outline" />}
          >
            {CLOSE_LABEL}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
