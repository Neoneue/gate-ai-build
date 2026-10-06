import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { ChatLanding, ChatStarterChips } from "@/pages/chat/chat-landing";
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
/** The seeded conversation a new chat's send or starter opens. */
const DEMO_CONVERSATION_ID = "chat_8f2c41d7";

/** Router state on that navigation, so a refresh can tell it apart. */
const DEMO_STATE = { chatDemo: true } as const;

/** The refresh check runs once per page load, on the first Chat mount. */
let reloadChecked = false;

const isDemoState = (state: unknown): boolean =>
  typeof state === "object" &&
  state !== null &&
  (state as { chatDemo?: unknown }).chatDemo === true;

export function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { pathname, state: locationState } = useLocation();
  const isDesktop = useIsDesktop();
  const mainRef = useRef<HTMLElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  // Below lg the composer is fixed, out of flow: mirror its live height
  // (chips, a growing field, notices) onto main as `--chat-composer-h`,
  // which main pads by and the thread's jump-to-latest button sits above.
  // A layout effect, set once before paint, so the thread's first
  // scroll-to-latest (a frame later) already sees the padding.
  useLayoutEffect(() => {
    const main = mainRef.current;
    const composer = composerRef.current;
    if (!(main && composer)) {
      return;
    }
    const sync = () =>
      main.style.setProperty(
        "--chat-composer-h",
        `${composer.getBoundingClientRect().height}px`
      );
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(composer);
    return () => observer.disconnect();
  }, []);

  // Owned by `ChatLayout`: the top bar's brand column, its toggle and this
  // rail draw two halves of one line, so in the app they read one value.
  const outlet = useOutletContext<ChatLayoutContext | null>();
  const railCollapsed = outlet?.railCollapsed ?? false;

  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftModelIds, setDraftModelIds] = useState<string[] | null>(null);
  const [lowBalanceDismissed, setLowBalanceDismissed] = useState(false);

  // UI only, no model behind it: a send or a starter from a new chat opens
  // the seeded demo conversation, so the mockup goes from the clean landing
  // to a full thread. A push, so Back returns to the clean state. Inside a
  // conversation a send stays inert (the composer keeps its draft).
  const openDemoConversation = () =>
    navigate(chatConversationPath(pathname, DEMO_CONVERSATION_ID), {
      state: DEMO_STATE,
    });

  // A browser refresh on that demo thread goes back a step to the clean
  // landing, so the mockup can be replayed. The router keeps its state in
  // history.state, which survives a reload; a conversation opened any other
  // way (rail, link, typed URL) carries none and stays put on refresh.
  useEffect(() => {
    if (reloadChecked) {
      return;
    }
    reloadChecked = true;
    const [entry] = performance.getEntriesByType?.("navigation") ?? [];
    const reloaded =
      (entry as { type?: string } | undefined)?.type === "reload";
    if (reloaded && isDemoState(locationState)) {
      navigate(chatHomePath(pathname), { replace: true });
    }
  }, [locationState, navigate, pathname]);

  // The lane selection and the seeded draft are per conversation: navigating
  // away must not carry one conversation's onto the next. Adjusted during
  // render (React's "store the previous prop" pattern), not in an effect.
  const [previousConversationId, setPreviousConversationId] =
    useState(conversationId);
  if (previousConversationId !== conversationId) {
    setPreviousConversationId(conversationId);
    setDraftModelIds(null);
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

  // Returning true clears the draft (the composer's contract for a send that
  // went out); false keeps it on screen.
  const handleSend = () => {
    if (conversationId) {
      return false;
    }
    openDemoConversation();
    return true;
  };

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
    <div
      className={cn(
        "flex bg-card max-lg:flex-1 lg:h-full lg:min-h-0 lg:overflow-hidden"
      )}
    >
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
          className="max-lg:sticky max-lg:top-16 max-lg:z-20"
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
        {/* Below lg the composer floats over the document, so main reserves its measured
            height (`--chat-composer-h`) at the bottom: the last bubble always
            clears it. `isolate` below lg: everything that scrolls under the
            sticky bars (the masked canvas texture, scrolling code blocks,
            pulse dots, the floating composer) is grouped in one stacking
            context at z 0, beneath the bars' z-20 / z-30. iOS was painting
            those composited parts over the bars during scroll. */}
        <main
          className={cn(
            "ask-ai-canvas relative flex flex-1 flex-col max-lg:isolate max-lg:pb-(--chat-composer-h) lg:min-h-0"
          )}
          ref={mainRef}
        >
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
            <div
              className={cn(
                "relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:min-h-0 lg:overflow-y-auto"
              )}
            >
              <ChatLanding
                onPromptSelect={openDemoConversation}
                organizationName={WORKSPACE_NAME}
              />
            </div>
          )}
          {/* Below lg it floats: fixed to the bottom of the screen and lifted
              by `--kb-inset`, the keyboard's height over the layout
              (useVisualViewportVars), so only the composer and its chips
              move and the header bars stay put. 0 with no keyboard. The
              opaque fill hides the thread scrolling behind it. */}
          <div
            className={cn(
              "relative z-10 shrink-0 translate-y-[calc(var(--kb-inset,0px)*-1)] pt-2 pb-3 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-20 max-lg:bg-card-muted sm:pb-4"
            )}
            ref={composerRef}
          >
            <div className={cn(CHAT_MEASURE, "flex flex-col gap-2")}>
              {conversationMissing || conversation.turns.length > 0 ? null : (
                <ChatStarterChips
                  className="sm:hidden"
                  onPromptSelect={openDemoConversation}
                />
              )}
              <ChatComposer
                catalog={catalogList}
                disabled={conversationMissing}
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
