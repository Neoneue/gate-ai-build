import { XIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { BrandLockup } from "@/components/ui/sidebar";
import { FREE_MODELS } from "@/data/free-models";
import { WORKSPACE_NAME } from "@/data/team-members";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { cn } from "@/lib/utils";
import {
  buildChatCatalog,
  chatConversationTotals,
  chatCredits,
  droppedLastModelMessage,
  exportConversation,
  formatExactUsd,
  groupConversationsByRecency,
  resolveChatModel,
  toChatConversation,
} from "@/pages/chat/chat-data";
import { ChatLanding, ChatStarterChips } from "@/pages/chat/chat-landing";
import { CHAT_MEASURE, CHAT_TOUCH_TARGET } from "@/pages/chat/chat-layout";
import {
  chatBillingUrl,
  chatConversationPath,
  chatHomePath,
} from "@/pages/chat/chat-links";
import { ChatThread } from "@/pages/chat/chat-thread";
import type { ChatExportFormat } from "@/pages/chat/contract";
import { CHAT_COPY } from "@/pages/chat/copy";
import type { ChatConversation, ChatNotice } from "@/pages/chat/types";
import { OnboardingChatComposer } from "@/pages/onboarding/onboarding-chat-composer";
import { OnboardingChatHeader } from "@/pages/onboarding/onboarding-chat-header";
import { OnboardingChatSidebar } from "@/pages/onboarding/onboarding-chat-sidebar";
import {
  onboardingChatStore,
  onboardingConversations,
  useOnboardingChatStore,
} from "@/pages/onboarding/onboarding-chat-store";

/** The free default for a new onboarding chat (owner 2026-10-11). */
const ONBOARDING_FREE_DEFAULT_ID = "constellation/qwen3-8-flash-free";

const NEW_CONVERSATION: ChatConversation = {
  id: null,
  title: "New chat",
  updatedLabel: "",
  modelLabel: null,
  turns: [],
};

/**
 * The Onboarding workspace's Gate Chat (`/chat-onboarding`, phone and
 * desktop): a copy of `pages/Chat.tsx` that we change for onboarding
 * without touching the current Gate Chat on Free, Default, Pro and
 * Enterprise. Change it here, never in the shared page.
 *
 * It differs in one way so far: it starts as a brand-new user. History,
 * memories and favourites come from the empty `onboarding-chat-store.ts`,
 * and the catalog carries no last-used model. The parts that read the shared
 * store directly (the header and its memory panel) and the rail (Sign out in place of
 * Back to dashboard) are copied next to it;
 * every other part is imported from `pages/chat/` unchanged.
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

export function OnboardingChat() {
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

  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftModelIds, setDraftModelIds] = useState<string[] | null>(null);
  const [lowBalanceDismissed, setLowBalanceDismissed] = useState(false);

  // UI only, no model behind it: a send or a starter from a new chat opens
  // the seeded demo conversation, so the mockup goes from the clean landing
  // to a full thread. It joins the empty history then, as the user's first
  // conversation. A push, so Back returns to the clean state. Inside a
  // conversation a send stays inert (the composer keeps its draft).
  const openDemoConversation = () => {
    onboardingChatStore.openConversation(DEMO_CONVERSATION_ID);
    navigate(chatConversationPath(pathname, DEMO_CONVERSATION_ID), {
      state: DEMO_STATE,
    });
  };

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

  const store = useOnboardingChatStore();
  // A brand-new user has used no model yet: no Recent entries. The free
  // twins (free-models.ts) join the catalog under their Constellation ID,
  // priced Free, so a new chat can open on one.
  const catalog = useMemo(() => {
    const base = new Map(
      [...buildChatCatalog(store.favorites)].map(([id, model]) => [
        id,
        { ...model, lastUsedAt: null },
      ])
    );
    for (const free of FREE_MODELS) {
      const paid = base.get(free.id);
      if (paid) {
        base.set(free.constellationId, {
          ...paid,
          id: free.constellationId,
          favorite: store.favorites.has(free.constellationId),
          isFree: true,
          price: "Free",
        });
      }
    }
    return base;
  }, [store.favorites]);
  const conversations = useMemo(() => onboardingConversations(store), [store]);
  const history = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = query
      ? conversations.filter((input) =>
          input.title.toLowerCase().includes(query)
        )
      : conversations;
    return groupConversationsByRecency(matches, catalog);
  }, [conversations, catalog, searchQuery]);

  // A brand-new workspace that is not set up yet: no balance, and nothing to
  // buy or switch to until it is (owner 2026-10-11). Upgrade and the
  // workspace switcher are left out of this copy.
  const credits = { ...chatCredits(pathname), balance: formatExactUsd(0) };
  const showUpgrade = false;

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

  // PRD phone step 2: a new chat opens with a free featured model already
  // selected, Qwen3.8 Flash (owner 2026-10-11), the first free twin.
  const newConversationModel = conversationId
    ? null
    : {
        model: resolveChatModel(catalog, ONBOARDING_FREE_DEFAULT_ID),
        droppedLastUsed: null,
      };
  const models = newConversationModel
    ? (draftModelIds?.map((id) => resolveChatModel(catalog, id)) ?? [
        newConversationModel.model,
      ])
    : (activeInput?.modelIds ?? []).map((id) => resolveChatModel(catalog, id));

  // The model is fixed in this copy (owner 2026-10-11): no lane changes, no
  // comparison, so the lane setters of the shared page are left out.

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
    onboardingChatStore.deleteConversation(id);
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
      onboardingChatStore.renameConversation(id, title),
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
          <OnboardingChatSidebar
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
              // The menu's own top row (owner 2026-10-11): the full logo,
              // unlinked (no dashboard yet), and Close flush right, mirroring
              // the conversation bar's menu button (-ml-2). Its own row, so it
              // never lands on New chat.
              <div className="flex shrink-0 items-center justify-between gap-3 border-border border-b p-4">
                <BrandLockup />
                <SheetClose
                  render={
                    <Button
                      aria-label="Close"
                      className={cn(CHAT_TOUCH_TARGET, "-mr-2")}
                      size="icon"
                      type="button"
                      variant="ghost"
                    />
                  }
                >
                  <XIcon aria-hidden className="size-4" strokeWidth={1.75} />
                </SheetClose>
              </div>
            }
            touchFriendly
          />
        </SheetContent>
      </Sheet>
      <OnboardingChatSidebar
        {...sidebarProps}
        className="hidden lg:flex"
        collapsed={false}
        onNewChat={() => navigate(chatHomePath(pathname))}
        onSelectConversation={(id) =>
          navigate(chatConversationPath(pathname, id))
        }
      />
      <div className="flex min-w-0 flex-1 flex-col bg-card-muted">
        <OnboardingChatHeader
          className="max-lg:sticky max-lg:top-0 max-lg:z-20"
          conversation={conversation}
          credits={credits}
          onMemoryToolsOverride={(value) => {
            if (activeInput) {
              onboardingChatStore.setMemoryOverride(activeInput.seed.id, value);
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
            <div className={cn(CHAT_MEASURE, "flex flex-col gap-3")}>
              {conversationMissing || conversation.turns.length > 0 ? null : (
                <ChatStarterChips
                  className="sm:hidden"
                  onPromptSelect={openDemoConversation}
                />
              )}
              <OnboardingChatComposer
                disabled={conversationMissing}
                key={conversationId ?? "new"}
                models={models}
                notice={composerNotice}
                onSend={handleSend}
              />
              {/* PRD phone step 2: a short line under the composer says the
                  model is free and that Gate scans every message. */}
              <p className="type-copy-12 text-center text-muted-foreground">
                This model is free. Gate scans every message.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
