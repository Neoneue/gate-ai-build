import {
  FileText,
  FileType,
  Image as ImageIcon,
  Paperclip,
  X,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import { CHAT_TOUCH_TARGET } from "./chat-layout";
import {
  CHAT_ATTACHMENT_IMAGE_CONTENT_TYPES,
  CHAT_ATTACHMENT_TEXT_CONTENT_TYPES,
} from "./contract";
import { CHAT_COPY } from "./copy";
import type { ChatModel } from "./types";

/**
 * Composer attachment affordance, ported from the site's
 * `components/chat/chat-attachment-picker.tsx`: a paperclip trigger plus a
 * chip row for files picked for the NEXT prompt.
 *
 * The two render apart. The trigger sits in the composer's toolbar row; the
 * chips (`ChatAttachmentChips`) sit above the prompt, with the text they
 * ride with, so a picked file never grows the toolbar row (audit ux-75). The
 * composer owns the picked list and hands it to both.
 *
 * The trigger opens a menu of attachment kinds rather than a bare file
 * dialog: the kind decides the dialog's `accept` filter, and a kind no
 * selected model can read is offered disabled with its reason rather than
 * hidden.
 *
 * This build has no storage, so a picked file is held in the browser as a
 * chip and never uploaded: nothing leaves the page.
 */

/** macOS reports `.md` with an empty type often enough that the extensions have to ride along. */
const TEXT_ACCEPT = [
  ...CHAT_ATTACHMENT_TEXT_CONTENT_TYPES,
  ".txt",
  ".md",
  ".csv",
  ".json",
].join(",");
const IMAGE_ACCEPT = CHAT_ATTACHMENT_IMAGE_CONTENT_TYPES.join(",");

export interface ChatPickedFile {
  filename: string;
  id: string;
}

export interface ChatAttachmentPickerProps {
  className?: string;
  /** The lanes the next prompt goes to; their capabilities decide which kinds are offered. */
  models?: readonly ChatModel[];
  /** Files the user just picked; the composer appends them to its list. */
  onPick: (files: ChatPickedFile[]) => void;
}

let pickSeq = 0;

export function ChatAttachmentPicker({
  models = [],
  onPick,
  className,
}: ChatAttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // A comparison turn is let through when ANY lane can read the image.
  const imageSupported = models.some((model) => model.supportsVision === true);

  // The filter has to be on the element before the dialog opens.
  function openDialog(accept: string) {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    input.accept = accept;
    input.click();
  }

  function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }
    const added = Array.from(files).map((file) => {
      pickSeq += 1;
      return { id: `att_local_${pickSeq}`, filename: file.name };
    });
    onPick(added);
  }

  return (
    <div className={cn("flex", className)}>
      <input
        className="hidden"
        multiple
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <Menu>
        <MenuTrigger
          render={
            <Button
              aria-label={CHAT_COPY.attachFile}
              className={CHAT_TOUCH_TARGET}
              shape="circle"
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Paperclip
                aria-hidden
                className="pointer-coarse:size-5 size-4"
                strokeWidth={1.75}
              />
            </Button>
          }
        />
        <MenuContent align="start" side="top">
          {/* One line per kind. A disabled row states its reason in the
              trailing slot, un-muted: the row is already at half opacity. */}
          <MenuItem
            disabled={!imageSupported}
            onClick={() => openDialog(IMAGE_ACCEPT)}
          >
            <ImageIcon
              aria-hidden
              className="size-4 shrink-0"
              strokeWidth={1.75}
            />
            <span className="truncate">{CHAT_COPY.attachImage}</span>
            <span
              className={cn(
                "type-label-12 ml-auto shrink-0",
                imageSupported && "text-muted-foreground"
              )}
            >
              {imageSupported
                ? CHAT_COPY.attachImageHint
                : CHAT_COPY.attachImageDisabled}
            </span>
          </MenuItem>
          <MenuItem onClick={() => openDialog(TEXT_ACCEPT)}>
            <FileText
              aria-hidden
              className="size-4 shrink-0"
              strokeWidth={1.75}
            />
            <span className="truncate">{CHAT_COPY.attachText}</span>
            <span className="type-label-12 ml-auto shrink-0 text-muted-foreground">
              {CHAT_COPY.attachTextHint}
            </span>
          </MenuItem>
          {/* Gate has no PDF parser, so no model can be given one. */}
          <MenuItem disabled>
            <FileType
              aria-hidden
              className="size-4 shrink-0"
              strokeWidth={1.75}
            />
            <span className="truncate">{CHAT_COPY.attachPdf}</span>
            <span className="type-label-12 ml-auto shrink-0">
              {CHAT_COPY.attachPdfDisabled}
            </span>
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}

export interface ChatAttachmentChipsProps {
  files: readonly ChatPickedFile[];
  onRemove: (id: string) => void;
}

/** The files picked for the next prompt, one removable chip each. The
 *  composer mounts it above the prompt and only while a file is picked. */
export function ChatAttachmentChips({
  files,
  onRemove,
}: ChatAttachmentChipsProps) {
  return (
    <ul className="flex flex-wrap gap-2">
      {files.map((file) => (
        <li
          className="type-copy-12 flex items-center gap-2 rounded-sm border border-border bg-muted py-1 pl-2 text-foreground"
          key={file.id}
        >
          <span className="max-w-40 truncate">{file.filename}</span>
          <Button
            aria-label={`Remove ${file.filename}`}
            className={cn(CHAT_TOUCH_TARGET, "text-muted-foreground")}
            onClick={() => onRemove(file.id)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X aria-hidden className="size-4" strokeWidth={1.75} />
          </Button>
        </li>
      ))}
    </ul>
  );
}
