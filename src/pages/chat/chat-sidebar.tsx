import {
  ArrowLeft,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChatExportDialog } from "./chat-export-dialog";
import {
  CHAT_COARSE_VISIBLE,
  CHAT_RAIL_COLLAPSED,
  CHAT_RAIL_EXPANDED,
  CHAT_TOUCH_TARGET,
} from "./chat-layout";
import { chatBillingUrl, chatOverviewUrl } from "./chat-links";
import { ChatModelLogo } from "./chat-model-logo";
import type { ChatExportFormat } from "./contract";
import { CHAT_COPY, chatResultCountLabel, noChatsMatchLabel } from "./copy";
import type {
  ChatConversation,
  ChatConversationGroup,
  ChatCredits,
} from "./types";

/* The nav row recipe (sidebar.tsx NAV_ROW's states): quiet by colour,
 * highlight at --accent-muted, the open chat at the full --accent. */
const rowBase =
  "flex min-h-12 w-full min-w-0 cursor-pointer items-center rounded-sm py-2 pr-11 pl-3 text-left transition-[color,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";
const rowIdle =
  "text-muted-foreground hover:bg-accent-muted hover:text-foreground";
const rowActive = "bg-accent text-accent-foreground";

export interface ChatSidebarProps {
  activeConversationId: string | null;
  className?: string;
  collapsed: boolean;
  /** Balance and upgrade for the widths the header hides them at (below `xl`). */
  credits?: ChatCredits;
  /** Produces an export file body for a conversation. */
  exportConversation: (
    conversationId: string,
    format: ChatExportFormat
  ) => string | null;
  history: readonly ChatConversationGroup[];
  historyError?: string | null;
  historyLoading?: boolean;
  onDeleteConversation?: (conversationId: string) => void;
  onNewChat: () => void;
  onRenameConversation?: (conversationId: string, title: string) => void;
  onRetryHistory?: () => void;
  onSearch: (query: string) => void;
  onSelectConversation: (conversationId: string) => void;
  searchQuery: string;
  /** Whether this workspace is still eligible for the upgrade path. */
  showUpgrade?: boolean;
  /** Rendered above New chat in the expanded rail. The mobile Sheet carries
   *  the workspace switcher here, as `DashboardChrome`'s nav Sheet does. */
  topSlot?: ReactNode;
  touchFriendly?: boolean;
}

/**
 * The conversation rail, ported from the site's
 * `components/chat/chat-sidebar.tsx`. One deliberate change: the collapse
 * toggle is NOT here. It lives in the top bar beside the logo mark, exactly
 * where the rest of this build keeps its sidebar toggle (see `ChatTopBar`).
 */
export function ChatSidebar({
  history,
  activeConversationId,
  collapsed,
  searchQuery,
  onNewChat,
  onSelectConversation,
  onSearch,
  onRenameConversation,
  onDeleteConversation,
  onRetryHistory,
  exportConversation,
  historyLoading = false,
  historyError = null,
  credits,
  showUpgrade = true,
  touchFriendly = false,
  topSlot,
  className,
}: ChatSidebarProps) {
  const { pathname } = useLocation();
  const headingId = useId();
  const [renameTarget, setRenameTarget] = useState<ChatConversation | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<ChatConversation | null>(
    null
  );
  const [exportTarget, setExportTarget] = useState<ChatConversation | null>(
    null
  );
  const normalizedQuery = searchQuery.trim();
  const conversationCount = history.reduce(
    (count, group) => count + group.conversations.length,
    0
  );

  return (
    <>
      <aside
        aria-label="Gate Chat navigation"
        className={cn(
          "flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-border border-r bg-card transition-[width] duration-200 ease-out motion-reduce:transition-none",
          collapsed ? CHAT_RAIL_COLLAPSED : CHAT_RAIL_EXPANDED,
          className
        )}
        data-slot="chat-sidebar"
      >
        {collapsed ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col items-center gap-2 py-4">
              <Button
                aria-label={CHAT_COPY.newChat}
                onClick={onNewChat}
                size="icon"
                type="button"
              >
                <Plus aria-hidden strokeWidth={1.75} />
              </Button>
            </div>
            <Separator />
            <div className="flex shrink-0 flex-col items-center gap-2 py-4">
              {showUpgrade ? (
                <Button
                  aria-label={
                    credits
                      ? `${CHAT_COPY.upgrade}. ${CHAT_COPY.credits}: ${credits.balance}`
                      : CHAT_COPY.upgrade
                  }
                  className="xl:hidden"
                  nativeButton={false}
                  render={<Link to={chatBillingUrl(pathname)} />}
                  size="icon"
                  variant="ghost"
                >
                  <Wallet aria-hidden strokeWidth={1.75} />
                </Button>
              ) : null}
              <Button
                aria-label={CHAT_COPY.backToDashboard}
                nativeButton={false}
                render={<Link to={chatOverviewUrl(pathname)} />}
                size="icon"
                variant="ghost"
              >
                <ArrowLeft aria-hidden strokeWidth={1.75} />
              </Button>
            </div>
          </>
        ) : (
          <>
            {topSlot}
            <div className="flex shrink-0 items-center gap-2 p-4">
              <Button
                className={cn(
                  "min-w-0 flex-1 justify-start",
                  touchFriendly && "h-11"
                )}
                onClick={onNewChat}
                size="default"
                type="button"
              >
                <Plus aria-hidden data-icon="inline-start" strokeWidth={1.75} />
                <span className="truncate">{CHAT_COPY.newChat}</span>
              </Button>
            </div>

            <div className="shrink-0 px-4 pb-4">
              <div className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <Input
                  aria-label={CHAT_COPY.searchChats}
                  className={cn(
                    "pl-9",
                    normalizedQuery && "pr-10",
                    touchFriendly && "h-11"
                  )}
                  onChange={(event) => onSearch(event.target.value)}
                  placeholder={CHAT_COPY.searchChats}
                  type="search"
                  value={searchQuery}
                />
                {normalizedQuery ? (
                  <Button
                    aria-label={CHAT_COPY.clearSearch}
                    className={cn(
                      "absolute inset-y-0 right-1 my-auto",
                      touchFriendly && "size-10"
                    )}
                    onClick={() => onSearch("")}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <X aria-hidden className="size-4" strokeWidth={1.75} />
                  </Button>
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <nav aria-labelledby={headingId}>
                {/* "Chats" and the date headings sit on the panel's 16px
                    left padding, flush with New chat (user, 2026-10-06). */}
                <div className="flex items-center justify-between gap-3 pr-3 pb-3">
                  <h2 id={headingId}>
                    <Eyebrow>{CHAT_COPY.history}</Eyebrow>
                  </h2>
                  <span
                    aria-live="polite"
                    className={cn(
                      "type-copy-12 text-muted-foreground",
                      !normalizedQuery && "sr-only"
                    )}
                    role="status"
                  >
                    {historyLoading
                      ? CHAT_COPY.loadingChats
                      : chatResultCountLabel(conversationCount)}
                  </span>
                </div>
                {historyLoading ? (
                  <div
                    aria-label={CHAT_COPY.loadingChats}
                    className="flex flex-col gap-2 px-3"
                    role="status"
                  >
                    {[0, 1, 2].map((item) => (
                      <Skeleton className="h-10" key={item} />
                    ))}
                  </div>
                ) : historyError ? (
                  <div
                    className="flex flex-col items-start gap-3 px-3"
                    role="alert"
                  >
                    <p className="type-copy-12 text-destructive">
                      {historyError}
                    </p>
                    {onRetryHistory ? (
                      <Button
                        onClick={onRetryHistory}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Retry
                      </Button>
                    ) : null}
                  </div>
                ) : history.length === 0 ? (
                  <div
                    className="flex flex-col items-start gap-3 px-3"
                    role="status"
                  >
                    <p className="type-copy-12 text-muted-foreground">
                      {normalizedQuery
                        ? noChatsMatchLabel(normalizedQuery)
                        : CHAT_COPY.noChatsYet}
                    </p>
                    {normalizedQuery ? (
                      <Button
                        onClick={() => onSearch("")}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {CHAT_COPY.clearSearch}
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {history.map((group, groupIndex) => {
                      const groupId = `${headingId}-group-${groupIndex}`;
                      return (
                        <section aria-labelledby={groupId} key={group.label}>
                          <h3
                            className="type-copy-12 pr-3 pb-2 text-muted-foreground"
                            id={groupId}
                          >
                            {group.label}
                          </h3>
                          <ul className="flex flex-col gap-1">
                            {group.conversations.map((conversation) => (
                              <ConversationRow
                                active={
                                  conversation.id !== null &&
                                  conversation.id === activeConversationId
                                }
                                conversation={conversation}
                                key={conversation.id ?? conversation.title}
                                onDelete={
                                  onDeleteConversation
                                    ? () => setDeleteTarget(conversation)
                                    : undefined
                                }
                                onExport={() => setExportTarget(conversation)}
                                onRename={
                                  onRenameConversation
                                    ? () => setRenameTarget(conversation)
                                    : undefined
                                }
                                onSelect={onSelectConversation}
                                touchFriendly={touchFriendly}
                              />
                            ))}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                )}
              </nav>
            </div>

            <Separator />
            {credits || showUpgrade ? (
              <>
                <div
                  className="flex shrink-0 flex-col gap-3 p-4 xl:hidden"
                  data-slot="chat-sidebar-credits"
                >
                  {credits ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="type-label-14 text-muted-foreground">
                        {CHAT_COPY.credits}
                      </span>
                      {credits.low ? (
                        <Badge variant="warning">{credits.balance}</Badge>
                      ) : (
                        <span className="type-mono-14 text-foreground">
                          {credits.balance}
                        </span>
                      )}
                    </div>
                  ) : null}
                  {showUpgrade ? (
                    <Button
                      className={cn("w-full", touchFriendly && "h-11")}
                      nativeButton={false}
                      render={<Link to={chatBillingUrl(pathname)} />}
                      size="sm"
                      variant="outline"
                    >
                      {CHAT_COPY.upgrade}
                    </Button>
                  ) : null}
                </div>
                {/* Separates credits from Back to dashboard (user,
                  2026-10-06); shown wherever the credits block is. */}
                <Separator className="xl:hidden" />
              </>
            ) : null}
            {/* 12px above and below in the phone drawer, 16px in the rail. */}
            <div className={cn("shrink-0 p-4", touchFriendly && "py-3")}>
              <Button
                className={cn("w-full justify-start", touchFriendly && "h-11")}
                nativeButton={false}
                render={<Link to={chatOverviewUrl(pathname)} />}
                size="default"
                variant="ghost"
              >
                <ArrowLeft
                  aria-hidden
                  data-icon="inline-start"
                  strokeWidth={1.75}
                />
                <span className="truncate">{CHAT_COPY.backToDashboard}</span>
              </Button>
            </div>
          </>
        )}
      </aside>
      <ChatExportDialog
        build={exportConversation}
        onClose={() => setExportTarget(null)}
        target={exportTarget}
      />
      <RenameChatDialog
        onClose={() => setRenameTarget(null)}
        onRename={onRenameConversation}
        target={renameTarget}
      />
      <DeleteChatDialog
        onClose={() => setDeleteTarget(null)}
        onDelete={onDeleteConversation}
        target={deleteTarget}
      />
    </>
  );
}

function ConversationRow({
  conversation,
  active,
  touchFriendly,
  onSelect,
  onRename,
  onExport,
  onDelete,
}: {
  active: boolean;
  conversation: ChatConversation;
  onDelete?: () => void;
  onExport: () => void;
  onRename?: () => void;
  onSelect: (conversationId: string) => void;
  touchFriendly: boolean;
}) {
  return (
    <li className="group/chat relative">
      <button
        aria-current={active ? "page" : undefined}
        aria-label={conversation.title}
        // Phone drawer: the name truncates 20px earlier (pr-16, not pr-11),
        // clear of the always-visible 44px more button (user, 2026-10-06).
        className={cn(
          rowBase,
          active ? rowActive : rowIdle,
          touchFriendly && "pr-16"
        )}
        disabled={conversation.id === null}
        onClick={() => conversation.id && onSelect(conversation.id)}
        type="button"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className="type-label-14 truncate text-foreground"
            title={conversation.title}
          >
            {conversation.title}
          </span>
          <span
            aria-label={`${CHAT_COPY.protectedByGate}. ${conversation.modelLabel ? `${conversation.modelLabel}. ` : ""}${conversation.updatedLabel}`}
            className="type-label-12 flex min-w-0 items-center gap-1 text-muted-foreground"
          >
            {/* One model gets its own provider mark; a comparison has no
                single provider to draw, so it keeps the Gate shield. */}
            {conversation.model ? (
              <ChatModelLogo className="size-4" model={conversation.model} />
            ) : (
              <ShieldCheck
                aria-hidden
                className="size-3 shrink-0"
                strokeWidth={1.75}
              />
            )}
            {conversation.modelLabel ? (
              <>
                <span className="truncate">{conversation.modelLabel}</span>
                <span aria-hidden className="shrink-0">
                  ·
                </span>
              </>
            ) : null}
            <span className="shrink-0">{conversation.updatedLabel}</span>
          </span>
        </span>
      </button>
      {conversation.id ? (
        <Menu>
          <MenuTrigger
            render={
              <Button
                aria-label={`${CHAT_COPY.chatActions}: ${conversation.title}`}
                className={cn(
                  CHAT_TOUCH_TARGET,
                  CHAT_COARSE_VISIBLE,
                  "absolute top-2 right-2 z-10 text-muted-foreground transition-opacity motion-reduce:transition-none",
                  touchFriendly
                    ? "size-10 opacity-100"
                    : "opacity-0 group-focus-within/chat:opacity-100 group-hover/chat:opacity-100 aria-expanded:opacity-100"
                )}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <MoreHorizontal
                  aria-hidden
                  className="size-4"
                  strokeWidth={1.75}
                />
              </Button>
            }
          />
          <MenuContent>
            {onRename ? (
              <MenuItem
                className={touchFriendly ? "h-11" : undefined}
                onClick={onRename}
              >
                <Pencil aria-hidden strokeWidth={1.75} />
                {CHAT_COPY.renameChat}
              </MenuItem>
            ) : null}
            <MenuItem
              className={touchFriendly ? "h-11" : undefined}
              onClick={onExport}
            >
              <Download aria-hidden strokeWidth={1.75} />
              {CHAT_COPY.exportConversation}
            </MenuItem>
            {onDelete ? (
              <MenuItem
                className={touchFriendly ? "h-11" : undefined}
                onClick={onDelete}
                variant="destructive"
              >
                <Trash2 aria-hidden strokeWidth={1.75} />
                {CHAT_COPY.deleteChat}
              </MenuItem>
            ) : null}
          </MenuContent>
        </Menu>
      ) : null}
    </li>
  );
}

function RenameChatDialog({
  target,
  onClose,
  onRename,
}: {
  onClose: () => void;
  onRename?: (conversationId: string, title: string) => void;
  target: ChatConversation | null;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState(target?.title ?? "");
  // Each opening starts from the chat's current name (adjusted during
  // render, React's "store the previous prop" pattern).
  const [previousTarget, setPreviousTarget] = useState(target);
  if (previousTarget !== target) {
    setPreviousTarget(target);
    if (target) {
      setDraft(target.title);
    }
  }

  const trimmed = draft.trim();
  const invalid =
    !target?.id || trimmed.length === 0 || trimmed === target.title;

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={target !== null}>
      <DialogContent density="compact">
        <DialogHeader>
          <DialogTitle>Rename chat</DialogTitle>
          <DialogDescription>
            {CHAT_COPY.renameChatDescription}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (invalid || !target?.id || !onRename) {
              return;
            }
            onRename(target.id, trimmed);
            onClose();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>{CHAT_COPY.chatName}</Label>
            <Input
              autoFocus
              id={inputId}
              maxLength={120}
              onChange={(event) => setDraft(event.target.value)}
              value={draft}
            />
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button size="default" type="button" variant="outline" />}
            >
              {CHAT_COPY.cancel}
            </DialogClose>
            <Button disabled={invalid} size="default" type="submit">
              {CHAT_COPY.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteChatDialog({
  target,
  onClose,
  onDelete,
}: {
  onClose: () => void;
  onDelete?: (conversationId: string) => void;
  target: ChatConversation | null;
}) {
  return (
    <AlertDialog
      onOpenChange={(open) => !open && onClose()}
      open={target !== null}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{CHAT_COPY.deleteChatConfirm}?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground">{target?.title}</span>.{" "}
            {CHAT_COPY.deleteChatDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>{CHAT_COPY.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (!(target?.id && onDelete)) {
                return;
              }
              onDelete(target.id);
              onClose();
            }}
            type="button"
            variant="destructive"
          >
            {CHAT_COPY.deleteChatConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
