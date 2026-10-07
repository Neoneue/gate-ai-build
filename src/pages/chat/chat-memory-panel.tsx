import { Trash2 } from "lucide-react";
import { type ReactElement, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { chatStore, useChatStore } from "./chat-store";
import type { ChatMemory } from "./contract";
import { CHAT_COPY } from "./copy";

/**
 * Memory management surface, opened from the chat header. Ported from the
 * site's `components/chat/chat-memory-panel.tsx`; the memory rows and the
 * per-user switch read and write the in-memory chat store instead of the API.
 */
export interface ChatMemoryPanelProps {
  /** The open, saved conversation, so its own memory tool override can be set. Omitted hides that control. */
  conversation?: { id: string; memoryToolsEnabled: boolean | null } | null;
  /** Writes the per-conversation override; `null` clears it back to the user's default. */
  onMemoryToolsOverride?: (memoryToolsEnabled: boolean | null) => void;
  /** Omitted shows only user-wide memories; set also shows that project's scope. */
  projectId?: string;
  trigger?: ReactElement;
}

type MemoryToolsOverride = "inherit" | "on" | "off";

const OVERRIDE_OPTIONS: { value: MemoryToolsOverride; label: string }[] = [
  { value: "inherit", label: CHAT_COPY.memoryToolsInherit },
  { value: "on", label: CHAT_COPY.memoryToolsOn },
  { value: "off", label: CHAT_COPY.memoryToolsOff },
];

const toOverride = (value: boolean | null): MemoryToolsOverride => {
  if (value === null) {
    return "inherit";
  }
  return value ? "on" : "off";
};

const fromOverride = (value: MemoryToolsOverride): boolean | null =>
  value === "inherit" ? null : value === "on";

function MemoryToolsControls({
  conversation,
  onMemoryToolsOverride,
}: Pick<ChatMemoryPanelProps, "conversation" | "onMemoryToolsOverride">) {
  const { memoryToolsEnabled } = useChatStore();
  const userSwitchId = useId();

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-border p-3">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Label htmlFor={userSwitchId}>{CHAT_COPY.memoryToolsUser}</Label>
          <p className="type-copy-12 text-muted-foreground">
            {CHAT_COPY.memoryToolsUserDescription}
          </p>
        </div>
        <Switch
          checked={memoryToolsEnabled}
          id={userSwitchId}
          onCheckedChange={(enabled) =>
            chatStore.setMemoryToolsEnabled(enabled)
          }
        />
      </div>
      {conversation && onMemoryToolsOverride ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="type-label-14 text-foreground">
            {CHAT_COPY.memoryToolsConversation}
          </span>
          <SegmentedPill
            aria-label={CHAT_COPY.memoryToolsConversation}
            onValueChange={(value) =>
              onMemoryToolsOverride(fromOverride(value as MemoryToolsOverride))
            }
            options={OVERRIDE_OPTIONS}
            size="sm"
            value={toOverride(conversation.memoryToolsEnabled)}
          />
        </div>
      ) : null}
    </div>
  );
}

function MemoryRow({ memory }: { memory: ChatMemory }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-border border-b py-3 last:border-b-0">
      {/* Switch and delete centre on the text block, and every switch in the
          dialog is the default size (user, 2026-10-06: they read as
          misaligned top-pinned at two sizes). */}
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="type-label-14 truncate text-foreground">{memory.key}</p>
          <p className="type-copy-12 text-muted-foreground">{memory.content}</p>
        </div>
        <Switch
          aria-label={`Use memory ${memory.key}`}
          checked={memory.enabled}
          onCheckedChange={(enabled) =>
            chatStore.saveMemory({
              key: memory.key,
              content: memory.content,
              projectId: memory.projectId,
              enabled,
            })
          }
        />
        <Button
          aria-label={`Delete memory ${memory.key}`}
          className="text-muted-foreground"
          onClick={() => setConfirmingDelete(true)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
      {confirmingDelete ? (
        <fieldset
          aria-label={`Confirm deletion of ${memory.key}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-danger-50 px-3 py-2 dark:bg-destructive/15"
        >
          <p className="type-copy-12 text-danger-800 dark:text-danger-300">
            Delete this memory? This cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setConfirmingDelete(false)}
              size="sm"
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => chatStore.removeMemory(memory.id)}
              size="sm"
              type="button"
              variant="destructive"
            >
              Delete
            </Button>
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}

export function ChatMemoryPanel({
  projectId,
  conversation,
  onMemoryToolsOverride,
  trigger,
}: ChatMemoryPanelProps) {
  const { memories: allMemories } = useChatStore();
  const memories = allMemories.filter(
    (memory) => memory.projectId === null || memory.projectId === projectId
  );
  const [key, setKey] = useState("");
  const [content, setContent] = useState("");
  const keyId = useId();
  const contentId = useId();

  const canSave = key.trim() !== "" && content.trim() !== "";

  function handleAdd() {
    if (!canSave) {
      return;
    }
    chatStore.saveMemory({
      key: key.trim(),
      content: content.trim(),
      projectId: projectId ?? null,
    });
    setKey("");
    setContent("");
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" type="button" variant="outline">
              {CHAT_COPY.memories}
            </Button>
          )
        }
      />
      {/* 400px (max-w-100, user 2026-10-06) over the primitive's 384px. */}
      <DialogContent className="w-full sm:max-w-100">
        <DialogHeader>
          <DialogTitle>{CHAT_COPY.memories}</DialogTitle>
          <DialogDescription>
            Durable facts recalled into future prompts.{" "}
            {projectId
              ? "Scoped to this project."
              : "Available across all your chats."}
          </DialogDescription>
        </DialogHeader>

        <MemoryToolsControls
          conversation={conversation}
          onMemoryToolsOverride={onMemoryToolsOverride}
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={keyId}>Memory name</Label>
            <Input
              id={keyId}
              onChange={(event) => setKey(event.target.value)}
              placeholder="For example, preferred language"
              value={key}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={contentId}>What Gate should remember</Label>
            <Textarea
              id={contentId}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Add a durable fact for future prompts"
              value={content}
            />
          </div>
        </div>

        {/* -mx-1 px-1 reserves the 4px focus ring of the row controls inside
            the scrollport (design.md, Focus ring / Clipping). */}
        <div className="-mx-1 max-h-64 overflow-y-auto px-1">
          {memories.length === 0 ? (
            <p className="type-copy-12 py-3 text-muted-foreground">
              No memories yet.
            </p>
          ) : (
            memories.map((memory) => (
              <MemoryRow key={memory.id} memory={memory} />
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            disabled={!canSave}
            onClick={handleAdd}
            size="sm"
            type="button"
          >
            Save memory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
