import { useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher";
import { WORKSPACE_NAME } from "@/data/team-members";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import type { ChatLayoutContext } from "@/layouts/ChatLayout";
import { cn } from "@/lib/utils";
import { ChatComposer } from "@/pages/chat/chat-composer";
import {
  buildChatCatalog,
  chatConversationTotals,
  chatCredits,
  droppedLastModelMessage,
  exportConversation,
  groupConversationsByRecency,
  resolveChatModel,
  selectNewConversationModel,
  toChatConversation,
} from "@/pages/chat/chat-data";
import { ChatHeader } from "@/pages/chat/chat-header";
import { ChatLanding } from "@/pages/chat/chat-landing";
import { CHAT_MEASURE } from "@/pages/chat/chat-layout";
import {
  chatBillingUrl,
  chatConversationPath,
  chatHomePath,
} from "@/pages/chat/chat-links";
import { ChatSidebar } from "@/pages/chat/chat-sidebar";
import {
  chatStore,
  liveConversations,
  useChatStore,
} from "@/pages/chat/chat-store";
import { ChatThread } from "@/pages/chat/chat-thread";
import type { ChatExportFormat } from "@/pages/chat/contract";
import { CHAT_COPY } from "@/pages/chat/copy";
import type { ChatConversation, ChatNotice } from "@/pages/chat/types";

const NEW_CONVERSATION: ChatConversation = {
  id: null,
  title: "New chat",
  updatedLabel: "",
  modelLabel: null,
  turns: [],
};

/**
 * Gate Chat, ported from the site's `pages/chat/Chat.tsx`. UI only: history,
 * models, credits, memories and every figure come from the seed module
 * (`@/data/gate-chat`) through `chat-data.ts`, and the session edits the site
 * writes to its API (rename, delete, lane models, favourites, memories) land
 * in the in-memory `chat-store.ts`. Nothing here makes a network call, and
 * sending produces no reply: the composer accepts a draft and keeps it.
 */
export function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();

  // Owned by `ChatLayout`: the top bar's brand column, its toggle and this
  // rail draw two halves of one line, so in the app they read one value.
  const outlet = useOutletContext<ChatLayoutContext | null>();
  const railCollapsed = outlet?.railCollapsed ?? false;

  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftModelIds, setDraftModelIds] = useState<string[] | null>(null);
  const [draftRequest, setDraftRequest] = useState<{
    id: number;
    text: string;
  } | null>(null);
  const [lowBalanceDismissed, setLowBalanceDismissed] = useState(false);

  // The lane selection and the seeded draft are per conversation: navigating
  // away must not carry one conversation's onto the next. Adjusted during
  // render (React's "store the previous prop" pattern), not in an effect.
  const [previousConversationId, setPreviousConversationId] =
    useState(conversationId);
  if (previousConversationId !== conversationId) {
    setPreviousConversationId(conversationId);
    setDraftModelIds(null);
    setDraftRequest(null);
  }

  // A drawer opened on a narrow window must not survive the move to the
  // desktop rail: two navigation landmarks, and a focus trap over the app.
  if (isDesktop && mobileRailOpen) {
    setMobileRailOpen(false);
  }

  const store = useChatStore();
  const catalog = useMemo(
    () => buildChatCatalog(store.favorites),
    [store.favorites]
  );
  const catalogList = useMemo(() => [...catalog.values()], [catalog]);
  const conversations = useMemo(() => liveConversations(store), [store]);
  const history = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = query
      ? conversations.filter((input) =>
          input.title.toLowerCase().includes(query)
        )
      : conversations;
    return groupConversationsByRecency(matches, catalog);
  }, [conversations, catalog, searchQuery]);

  const credits = chatCredits(pathname);
  // Entitlement, not balance: a Pro or Enterprise workspace is never offered
  // Pro again.
  const showUpgrade = !credits.pro;

  const activeInput = conversationId
    ? (conversations.find((input) => input.seed.id === conversationId) ?? null)
    : null;
  const loadedConversation = activeInput
    ? toChatConversation(activeInput, catalog)
    : null;
  const conversation: ChatConversation = conversationId
    ? (loadedConversation ?? {
        ...NEW_CONVERSATION,
        id: conversationId,
        title: "Loading conversation",
      })
    : NEW_CONVERSATION;
  const conversationMissing = Boolean(conversationId && !activeInput);
  const totals = activeInput ? chatConversationTotals(activeInput.seed) : null;

  // A brand-new chat opens on the user's last-used model where the workspace
  // still offers it.
  const newConversationModel = conversationId
    ? null
    : selectNewConversationModel(catalog);
  const models = newConversationModel
    ? (draftModelIds?.map((id) => resolveChatModel(catalog, id)) ?? [
        newConversationModel.model,
      ])
    : (activeInput?.modelIds ?? []).map((id) => resolveChatModel(catalog, id));

  function setLaneModels(modelIds: string[]) {
    if (activeInput) {
      chatStore.setConversationModels(activeInput.seed.id, modelIds);
      return;
    }
    setDraftModelIds(modelIds);
  }

  function selectLaneModel(laneIndex: number, modelId: string) {
    const nextIds = models.map((model, index) =>
      index === laneIndex ? modelId : model.id
    );
    // Lane index N appends, which is what the add-comparison affordance does.
    if (laneIndex >= models.length) {
      nextIds.push(modelId);
    }
    setLaneModels(nextIds);
  }

  function removeComparisonModel() {
    if (models.length < 2) {
      return;
    }
    setLaneModels([models[0].id]);
  }

  // UI only: no reply, no stream. Returning false keeps the draft on screen,
  // the composer's own contract for a send that did not go out.
  const handleSend = () => false;

  const buildExport = (id: string, format: ChatExportFormat) => {
    const input = conversations.find((entry) => entry.seed.id === id);
    return input
      ? exportConversation(toChatConversation(input, catalog), format)
      : null;
  };

  const deleteConversation = (id: string) => {
    chatStore.deleteConversation(id);
    if (conversationId === id) {
      navigate(chatHomePath(pathname));
    }
  };

  const droppedLastUsed =
    draftModelIds === null
      ? (newConversationModel?.droppedLastUsed ?? null)
      : null;
  const composerNotice: ChatNotice | undefined =
    droppedLastUsed && newConversationModel
      ? {
          tone: "warning",
          text: droppedLastModelMessage(
            droppedLastUsed,
            newConversationModel.model
          ),
        }
      : undefined;

  // Raised by the once-per-crossing latch, not by the level.
  const lowBalanceNotice = credits.notified && !lowBalanceDismissed;

  const sidebarProps = {
    activeConversationId: conversation.id,
    credits,
    exportConversation: buildExport,
    history,
    onDeleteConversation: deleteConversation,
    onRenameConversation: (id: string, title: string) =>
      chatStore.renameConversation(id, title),
    onSearch: setSearchQuery,
    searchQuery,
    showUpgrade,
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-card">
      <Sheet onOpenChange={setMobileRailOpen} open={mobileRailOpen}>
        {/* No corner close key: at 288px it landed on top of New chat, ink on
            ink, so it was invisible and stole that button's taps. The drawer
            closes on the scrim, on Escape and on every navigation, the same
            call the Ask AI sheet makes (`AskAiSurface`). */}
        <SheetContent
          className="w-72 max-w-full gap-0 p-0 sm:max-w-72 lg:hidden"
          showCloseButton={false}
          side="left"
        >
          <SheetTitle className="sr-only">Gate Chat navigation</SheetTitle>
          <ChatSidebar
            {...sidebarProps}
            className="w-full border-r-0"
            collapsed={false}
            onNewChat={() => {
              setMobileRailOpen(false);
              navigate(chatHomePath(pathname));
            }}
            onSelectConversation={(id) => {
              setMobileRailOpen(false);
              navigate(chatConversationPath(pathname, id));
            }}
            topSlot={
              // Below `lg` the switcher leaves the top bar for the drawer
              // (DashboardChrome's MobileNav does the same).
              <div className="shrink-0 border-border border-b p-4">
                <WorkspaceSwitcher className="w-full" />
              </div>
            }
            touchFriendly
          />
        </SheetContent>
      </Sheet>
      <ChatSidebar
        {...sidebarProps}
        className="hidden lg:flex"
        collapsed={railCollapsed}
        onNewChat={() => navigate(chatHomePath(pathname))}
        onSelectConversation={(id) =>
          navigate(chatConversationPath(pathname, id))
        }
      />
      <div className="flex min-w-0 flex-1 flex-col bg-card-muted">
        <ChatHeader
          conversation={conversation}
          credits={credits}
          onMemoryToolsOverride={(value) => {
            if (activeInput) {
              chatStore.setMemoryOverride(activeInput.seed.id, value);
            }
          }}
          onOpenNavigation={() => setMobileRailOpen(true)}
          totals={totals}
        />
        <main className="ask-ai-canvas relative flex min-h-0 flex-1 flex-col">
          {lowBalanceNotice ? (
            <div
              className="type-copy-14 relative flex shrink-0 flex-wrap items-center gap-3 border-warning-200 border-b bg-warning-50 px-6 py-3 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
              role="status"
            >
              <span className="type-label-14">{CHAT_COPY.lowBalanceTitle}</span>
              <span className="min-w-0 flex-1">{CHAT_COPY.lowBalanceBody}</span>
              {/* A Pro workspace cannot upgrade, but it can still top up. */}
              <Button
                nativeButton={false}
                render={<Link to={chatBillingUrl(pathname)} />}
                size="sm"
                variant="outline"
              >
                {showUpgrade ? CHAT_COPY.upgrade : CHAT_COPY.manageBilling}
              </Button>
              <Button
                onClick={() => setLowBalanceDismissed(true)}
                size="sm"
                type="button"
                variant="ghost"
              >
                {CHAT_COPY.lowBalanceDismiss}
              </Button>
            </div>
          ) : null}
          {conversationMissing ? (
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-6 text-center">
              <div className="flex max-w-sm flex-col items-center gap-3">
                <p className="type-copy-14 text-foreground">
                  This conversation couldn’t be loaded.
                </p>
                {/* Re-reads the route. A conversation id the history does not
                    hold stays unloadable, which is the honest answer. */}
                <Button
                  onClick={() => navigate(pathname, { replace: true })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : conversation.turns.length > 0 ? (
            <ChatThread turns={conversation.turns} />
          ) : (
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8 sm:px-6">
              <ChatLanding
                onPromptSelect={(text) =>
                  setDraftRequest((current) => ({
                    id: (current?.id ?? 0) + 1,
                    text,
                  }))
                }
                organizationName={WORKSPACE_NAME}
              />
            </div>
          )}
          <div className="relative shrink-0 pt-2 pb-3 sm:pb-4">
            <div className={cn(CHAT_MEASURE, "flex flex-col gap-2")}>
              <ChatComposer
                catalog={catalogList}
                disabled={conversationMissing}
                draftRequest={conversationId ? null : draftRequest}
                key={conversationId ?? "new"}
                models={models}
                notice={composerNotice}
                onAddComparisonModel={(modelId) =>
                  selectLaneModel(models.length, modelId)
                }
                onRemoveComparisonModel={removeComparisonModel}
                onSelectLaneModel={selectLaneModel}
                onSend={handleSend}
                onToggleFavorite={(modelId, favorite) =>
                  chatStore.setFavorite(modelId, favorite)
                }
              />
              <p className="type-copy-12 px-2 text-center text-muted-foreground">
                AI can make mistakes. Review important answers. Gate records
                usage and security details for every response.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
