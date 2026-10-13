import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { FREE_MODELS } from "@/data/free-models";
import {
  FREE_COMPARE_HELPER,
  isSetupLinkRequest,
  ONBOARDING_STARTER_PROMPTS,
  PAID_COMPARE_HELPER,
  PAID_CREDITS_COMPARE_HELPER,
  PAID_CREDITS_HELPER,
  PAID_MODEL_HELPER,
  PAID_MODEL_REFUSAL,
  selectOnboardingReply,
} from "@/data/onboarding-chat-script";
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
import { CHAT_MEASURE } from "@/pages/chat/chat-layout";
import {
  chatBillingUrl,
  chatConversationPath,
  chatHomePath,
} from "@/pages/chat/chat-links";
import { ChatMessage } from "@/pages/chat/chat-message";
import { ChatThread } from "@/pages/chat/chat-thread";
import type { ChatExportFormat } from "@/pages/chat/contract";
import { CHAT_COPY, CHAT_STARTER_PROMPTS } from "@/pages/chat/copy";
import type {
  ChatConversation,
  ChatNotice,
  ChatTurn,
} from "@/pages/chat/types";
import { OnboardingChatComposer } from "@/pages/onboarding/onboarding-chat-composer";
import { OnboardingChatHeader } from "@/pages/onboarding/onboarding-chat-header";
import {
  OnboardingChatLanding,
  OnboardingStarterChips,
} from "@/pages/onboarding/onboarding-chat-landing";
import { OnboardingChatMessage } from "@/pages/onboarding/onboarding-chat-message";
import { canUseOnboardingChatMessage } from "@/pages/onboarding/onboarding-chat-message-support";
import { OnboardingChatSidebar } from "@/pages/onboarding/onboarding-chat-sidebar";
import {
  onboardingChatStore,
  onboardingConversations,
  onboardingModelLastUsed,
  useOnboardingChatStore,
} from "@/pages/onboarding/onboarding-chat-store";
import { OnboardingChatThread } from "@/pages/onboarding/onboarding-chat-thread";
import {
  OnboardingComputerPrompt,
  OnboardingSetupLinkReply,
} from "@/pages/onboarding/onboarding-computer-prompt";
import { useOnboardingBalance } from "@/pages/onboarding/onboarding-credits";
import {
  isPhoneDemoChat,
  rememberChatPath,
} from "@/pages/onboarding/onboarding-routes";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";

/** The phone demo's quick actions under a thread (owner 2026-10-12): chips
 *  1 and 2 whose question this conversation already asked, with the reply
 *  finished. "Asked" is any turn the matcher routes to that chip's reply,
 *  tapped or typed. Chip 3, the setup link, never counts: it always stays. */
function answeredStarterPrompts(
  turns: readonly ChatTurn[]
): ReadonlySet<string> {
  const replies = new Set(
    turns
      .filter((turn) => turn.lanes.every((lane) => lane.state !== "streaming"))
      .map((turn) => selectOnboardingReply(turn.prompt))
  );
  return new Set(
    ONBOARDING_STARTER_PROMPTS.filter(
      (prompt) =>
        !isSetupLinkRequest(prompt) &&
        replies.has(selectOnboardingReply(prompt))
    )
  );
}

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
 * On desktop it is the real Gate Chat (owner 2026-10-13: "It's the real
 * Gate chat, even on onboarding. The only difference is mobile because we
 * need to have that be guided."): the same composer toolbar (attach, model
 * picker, add a model to compare) and thread. It differs in that it starts
 * as a brand-new user: history, memories and favourites come from the empty
 * `onboarding-chat-store.ts`, the catalog carries no last-used model, and a
 * new chat opens on the free default. A send starts the user's own
 * conversation, answered from the script in every lane (owner 2026-10-13,
 * "Do what the PRD suggests"), in place of the shared page's seeded demo
 * thread. Credits are the onboarding balance (`onboarding-credits.ts`):
 * with none, a send on a paid model is refused (PRD "Onboarding by device").
 * The parts that read the shared store directly (the header and its memory
 * panel), the composer (the onboarding picker with its Free tab, and the
 * refused send), the landing (its prompts disabled while refused) and the
 * rail (Sign out in place of Back to dashboard) are copied next to it; every
 * other part is imported from `pages/chat/` unchanged. The phone demo
 * (`isPhoneDemoChat`) is the guided flow: onboarding landing, quick
 * actions, one lane.
 */

export function OnboardingChat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
  // Mobile A (signup -> Gate Chat, owner 2026-10-11): onboarding landing,
  // onboarding quick actions and the turns it draws itself. The desktop
  // chat keeps the shared landing's copy and the shared thread.
  // Option B's phone chat (the phone two-card start) runs the same chat
  // (owner 2026-10-12): one gate, `isPhoneDemoChat`.
  const [mobileA] = useState(isPhoneDemoChat);
  // B's phone start can send the setup link first (chip 3's sent state).
  const { improved } = useOnboarding();

  // The site menu's Gate Chat row comes back to this page. A refresh needs
  // no handling here: the store is in memory, so OnboardingLayout sends a
  // cold conversation URL back to the landing.
  useEffect(() => {
    rememberChatPath(pathname);
  }, [pathname]);

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
  const balanceUsd = useOnboardingBalance();
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
  const catalogList = useMemo(() => [...catalog.values()], [catalog]);
  // The picker's Recent (owner 2026-10-12, desktop 2026-10-13) lists the
  // models this session sent with in the onboarding store. `catalog` itself
  // keeps no last-used model, so model resolution and history are unchanged.
  const pickerCatalog = useMemo(() => {
    const lastUsed = onboardingModelLastUsed(store.scripted);
    return catalogList.map((model) => {
      const lastUsedAt = lastUsed.get(model.id);
      return lastUsedAt === undefined ? model : { ...model, lastUsedAt };
    });
  }, [catalogList, store.scripted]);
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

  // A brand-new workspace that is not set up yet: nothing to buy or switch
  // to until it is (owner 2026-10-11). The balance is what this onboarding
  // run added (owner 2026-10-13), live across tabs; $0.00 until then.
  // Upgrade and the workspace switcher are left out of this copy.
  const credits = {
    ...chatCredits(pathname),
    balance: formatExactUsd(balanceUsd),
  };
  const showUpgrade = false;

  const activeInput = conversationId
    ? (conversations.find((input) => input.seed.id === conversationId) ?? null)
    : null;
  const settledConversation = activeInput
    ? toChatConversation(activeInput, catalog)
    : null;
  // The scripted reply being written: its card shows "preparing a reply",
  // then the text as it streams (the lane's own `streaming` state).
  const live = store.live;
  const loadedConversation =
    settledConversation && live && live.conversationId === conversationId
      ? {
          ...settledConversation,
          turns: settledConversation.turns.map((turn) => ({
            ...turn,
            lanes: turn.lanes.map((lane) =>
              lane.id !== null && live.laneIds.includes(lane.id)
                ? { ...lane, body: live.body, state: "streaming" as const }
                : lane
            ),
          })),
        }
      : settledConversation;
  const conversation: ChatConversation = conversationId
    ? (loadedConversation ?? {
        ...NEW_CONVERSATION,
        id: conversationId,
        title: "Loading conversation",
      })
    : NEW_CONVERSATION;
  const conversationMissing = Boolean(conversationId && !activeInput);
  // PRD phone step 4: the follow-up cards after the first scripted reply, in
  // the conversation and under the turn they followed.
  const followUp = store.computerPrompt;
  const followUpTurnId =
    mobileA && followUp !== null && followUp.conversationId === conversationId
      ? followUp.afterTurnId
      : null;

  // Mobile A draws each turn itself (owner 2026-10-12). An "Email setup
  // link" turn streams like any reply, then settles into the offer card with
  // its email button. The first reply's follow-ups sit right after their
  // turn; when that turn already was the offer, only the logged note follows.
  const renderMobileATurn = (turn: ChatTurn) => {
    const lane = turn.lanes[0];
    // The onboarding copy of the message (its reply header wraps at large
    // text sizes); a turn with attachments or memory chips, which the copy
    // leaves out, keeps the shared one.
    const Message = canUseOnboardingChatMessage(turn)
      ? OnboardingChatMessage
      : ChatMessage;
    const setupLinkTurn = store.setupLinkTurnIds.has(turn.id);
    const offerSettled =
      setupLinkTurn && lane !== undefined && lane.state !== "streaming";
    return (
      <>
        {offerSettled ? (
          // The bubble alone (no lanes), then the offer card as its reply.
          // ChatMessage's own 16px gap above its empty lane row spaces them.
          <div className="flex flex-col">
            <Message turn={{ ...turn, lanes: [] }} />
            <OnboardingSetupLinkReply lane={lane} />
          </div>
        ) : (
          <Message turn={turn} />
        )}
        {turn.id === followUpTurnId && lane ? (
          <OnboardingComputerPrompt
            lane={lane}
            prompt={turn.prompt}
            showOffer={!setupLinkTurn}
          />
        ) : null}
      </>
    );
  };
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

  // The shared page's lane selection (Chat.tsx): an open conversation keeps
  // its lanes in the store, a new chat holds them until the first send.
  // Desktop picks per lane and compares two (owner 2026-10-13, reversing the
  // fixed desktop model of 2026-10-11); the phone demo picks one lane, no
  // comparison (owner 2026-10-12).
  const setLaneModels = (modelIds: string[]) => {
    if (activeInput) {
      onboardingChatStore.setConversationModels(activeInput.seed.id, modelIds);
      return;
    }
    setDraftModelIds(modelIds);
  };
  const selectModel = (modelId: string) => setLaneModels([modelId]);
  const selectLaneModel = (laneIndex: number, modelId: string) => {
    const nextIds = models.map((model, index) =>
      index === laneIndex ? modelId : model.id
    );
    // Lane index N appends, which is what the add-comparison key does.
    if (laneIndex >= models.length) {
      nextIds.push(modelId);
    }
    setLaneModels(nextIds);
  };
  const removeComparisonModel = () => {
    if (models.length < 2) {
      return;
    }
    setLaneModels([models[0].id]);
  };
  const comparing = models.length > 1;
  const anyPaidLane = models.some((model) => !model.isFree);
  // Refused send (PRD "Onboarding by device"; phone owner 2026-10-12,
  // desktop 2026-10-13): with no balance, a send where any lane is a paid
  // model waits for free models. Typing stays on; send, the landing prompts
  // and the phone's quick actions wait. Credits added in this run lift it
  // (owner 2026-10-13: "they can then use paid models").
  const paidModelPicked = anyPaidLane && balanceUsd <= 0;
  // The line under the composer (PRD phone step 2; desktop compare lines
  // and the paid-with-credits lines, owner 2026-10-13).
  const helperLine = paidModelPicked
    ? comparing
      ? PAID_COMPARE_HELPER
      : PAID_MODEL_HELPER
    : anyPaidLane
      ? comparing
        ? PAID_CREDITS_COMPARE_HELPER
        : PAID_CREDITS_HELPER
      : comparing
        ? FREE_COMPARE_HELPER
        : "This model is free. Gate scans every message.";

  // Returning true clears the draft (the composer's contract for a send that
  // went out); false keeps it on screen.
  // Every send, starter and quick action is answered from the script, in the
  // open conversation or a new one titled by the prompt, one reply per lane
  // (desktop compares two). False keeps the draft while a reply is still
  // writing.
  const sendScripted = (prompt: string) => {
    if (paidModelPicked) {
      return false;
    }
    const target =
      conversationId && store.scripted[conversationId] ? conversationId : null;
    const id = onboardingChatStore.sendScripted(
      target,
      prompt,
      models.map((model) => model.id)
    );
    if (id === null) {
      return false;
    }
    if (id !== conversationId) {
      navigate(chatConversationPath(pathname, id));
    }
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
            // Phone drawer: no logo row and no Sign out (owner 2026-10-11).
            showSignOut={false}
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
          className="max-lg:sticky max-lg:top-16 max-lg:z-20"
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
            mobileA ? (
              <OnboardingChatThread
                renderTurn={renderMobileATurn}
                turns={conversation.turns}
              />
            ) : (
              <ChatThread turns={conversation.turns} />
            )
          ) : mobileA ? (
            <div className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:min-h-0 lg:overflow-y-auto">
              <OnboardingChatLanding
                disabled={paidModelPicked}
                onPromptSelect={sendScripted}
                organizationName={WORKSPACE_NAME}
              />
            </div>
          ) : (
            <div
              className={cn(
                "relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:min-h-0 lg:overflow-y-auto"
              )}
            >
              {/* The shared landing's copy and prompts, on the onboarding
                  copy so the prompts can be refused like a send. */}
              <OnboardingChatLanding
                description={CHAT_COPY.landingDescription}
                disabled={paidModelPicked}
                onPromptSelect={sendScripted}
                organizationName={WORKSPACE_NAME}
                prompts={CHAT_STARTER_PROMPTS}
                title={CHAT_COPY.landingTitle}
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
              {/* Phone demo (owner 2026-10-12, "press the first button,
                  press the 2nd button, and then press the 3rd"): the quick
                  actions stay under the thread, in place, so each one adds
                  its turn to this chat; one answered here checks, holds and
                  leaves (chip 3, the setup link, stays, checked once sent).
                  Disabled while a reply is still writing, when a send would
                  be refused. */}
              {conversationMissing ? null : mobileA ? (
                <OnboardingStarterChips
                  answered={answeredStarterPrompts(conversation.turns)}
                  className="sm:hidden"
                  disabled={paidModelPicked || live !== null}
                  // Per conversation: a new chat starts the row over.
                  key={`chips-${conversationId ?? "new"}`}
                  onPromptSelect={sendScripted}
                  setupLinkSent={store.setupLinkSent || improved.handoffSent}
                />
              ) : conversation.turns.length > 0 ? null : (
                <OnboardingStarterChips
                  className="sm:hidden"
                  disabled={paidModelPicked}
                  onPromptSelect={sendScripted}
                  prompts={CHAT_STARTER_PROMPTS}
                />
              )}
              <OnboardingChatComposer
                catalog={pickerCatalog}
                disabled={conversationMissing}
                key={conversationId ?? "new"}
                models={models}
                notice={composerNotice}
                onAddComparisonModel={
                  mobileA
                    ? undefined
                    : (modelId) => selectLaneModel(models.length, modelId)
                }
                onRemoveComparisonModel={
                  mobileA ? undefined : removeComparisonModel
                }
                onSelectLaneModel={mobileA ? undefined : selectLaneModel}
                onSelectModel={mobileA ? selectModel : undefined}
                onSend={sendScripted}
                onToggleFavorite={(modelId, favorite) =>
                  onboardingChatStore.setFavorite(modelId, favorite)
                }
                refusedPlaceholder={
                  paidModelPicked ? PAID_MODEL_REFUSAL : undefined
                }
              />
              {/* PRD phone step 2: a short line under the composer says the
                  model is free and that Gate scans every message (`helperLine`
                  above). It swaps to the paid line while a send is refused;
                  polite and always mounted, so the reason is read out when
                  the model changes.
                  `leading-normal!` holds the voice's 12/18 line box as a
                  ratio (1.5, 18px at 100%), so it grows with the text and
                  wrapped lines never overlap at 200%. */}
              <p
                aria-live="polite"
                className="type-copy-12 text-center text-muted-foreground leading-normal!"
              >
                {helperLine}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
