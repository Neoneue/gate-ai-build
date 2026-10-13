import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AskAiComposer } from "@/components/ui/ask-ai-composer";
import { AskAiEmptyState } from "@/components/ui/ask-ai-empty-state";
import {
  AgentMessage,
  MessageThread,
  ReplyProse,
  UserMessage,
} from "@/components/ui/ask-ai-message";
import { AskAiPanel } from "@/components/ui/ask-ai-panel";
import { ScrollToLatestFab } from "@/components/ui/ask-ai-scroll-to-latest";
import { AskAiThinkingRow } from "@/components/ui/ask-ai-thinking-row";
import { AskAiThreadProvider } from "@/hooks/ask-ai-thread-provider";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import { AskAiSurfaceDemo } from "@/pages/component-canvas/demos";
import { SAMPLE_REPLY_MARKDOWN } from "@/pages/component-canvas/sample-data";

/* Ask AI panel parts. Every example that talks to the thread gets its own
 * AskAiThreadProvider, so the scripted local responder of one example never
 * leaks into another; nothing leaves the page. */

const COMPOSER_PHASES = [
  "idle",
  "sending",
  "thinking",
  "replying",
  "complete",
] as const;

const USER_QUESTION = "How do I rotate an API key?";

function reply() {
  return (
    <Markdown remarkPlugins={[remarkGfm]}>{SAMPLE_REPLY_MARKDOWN}</Markdown>
  );
}

const askAiComposer: CanvasGroup = {
  id: "ask-ai-composer",
  title: "AskAiComposer",
  files: ["ask-ai-composer.tsx"],
  columns: 3,
  examples: COMPOSER_PHASES.map((phase) => ({
    label: `phase="${phase}"`,
    render: () => (
      <AskAiComposer
        className="w-full"
        onSend={() => undefined}
        phase={phase}
      />
    ),
  })),
};

const askAiEmptyState: CanvasGroup = {
  id: "ask-ai-empty-state",
  title: "AskAiEmptyState",
  files: ["ask-ai-empty-state.tsx"],
  columns: 2,
  examples: [
    {
      label: "onSelect (no-op in the canvas)",
      render: () => (
        <AskAiEmptyState className="w-full" onSelect={() => undefined} />
      ),
    },
  ],
};

const askAiMessage: CanvasGroup = {
  id: "ask-ai-message",
  title: "Ask AI messages",
  files: ["ask-ai-message.tsx"],
  columns: 2,
  examples: [
    {
      label: "UserMessage",
      render: () => (
        <div className="w-full">
          <UserMessage>{USER_QUESTION}</UserMessage>
        </div>
      ),
    },
    {
      label: "AgentMessage (actions, onRegenerate)",
      render: () => (
        <AgentMessage
          className="w-full"
          copyText={SAMPLE_REPLY_MARKDOWN}
          onRegenerate={() => undefined}
        >
          {reply()}
        </AgentMessage>
      ),
    },
    {
      label: "AgentMessage showActions={false} (streaming)",
      render: () => (
        <AgentMessage
          className="w-full"
          copyText={SAMPLE_REPLY_MARKDOWN}
          showActions={false}
        >
          {reply()}
        </AgentMessage>
      ),
    },
    {
      label: "AgentMessage without onRegenerate",
      render: () => (
        <AgentMessage className="w-full" copyText={SAMPLE_REPLY_MARKDOWN}>
          {reply()}
        </AgentMessage>
      ),
    },
    {
      label: "ReplyProse",
      render: () => <ReplyProse className="w-full">{reply()}</ReplyProse>,
    },
    {
      label: "MessageThread",
      render: () => (
        <div className="w-full">
          <MessageThread>
            <UserMessage>{USER_QUESTION}</UserMessage>
            <AgentMessage
              copyText={SAMPLE_REPLY_MARKDOWN}
              onRegenerate={() => undefined}
            >
              {reply()}
            </AgentMessage>
          </MessageThread>
        </div>
      ),
    },
  ],
};

const askAiThinkingRow: CanvasGroup = {
  id: "ask-ai-thinking-row",
  title: "AskAiThinkingRow",
  files: ["ask-ai-thinking-row.tsx"],
  columns: 2,
  examples: [{ label: "default", render: () => <AskAiThinkingRow /> }],
};

const scrollToLatest: CanvasGroup = {
  id: "ask-ai-scroll-to-latest",
  title: "ScrollToLatestFab",
  files: ["ask-ai-scroll-to-latest.tsx"],
  columns: 2,
  examples: [
    {
      label: "visible",
      render: () => <ScrollToLatestFab onClick={() => undefined} visible />,
    },
    {
      label: "visible={false} (hidden, keeps its box)",
      render: () => (
        <ScrollToLatestFab onClick={() => undefined} visible={false} />
      ),
    },
  ],
};

const askAiPanel: CanvasGroup = {
  id: "ask-ai-panel",
  title: "AskAiPanel",
  files: ["ask-ai-panel.tsx"],
  columns: 2,
  examples: [
    {
      label: "open={false} (no autofocus; type to run the scripted reply)",
      render: () => (
        <AskAiThreadProvider>
          <div className="flex h-180 w-92 flex-col border border-border bg-card">
            <AskAiPanel onClose={() => undefined} open={false} />
          </div>
        </AskAiThreadProvider>
      ),
    },
  ],
};

const askAiSurface: CanvasGroup = {
  id: "ask-ai-surface",
  title: "AskAiSurface",
  files: ["ask-ai-surface.tsx"],
  columns: 2,
  examples: [
    {
      label: "isDesktop (docked column, lg and up)",
      render: () => <AskAiSurfaceDemo isDesktop />,
    },
    {
      label: "isDesktop={false} (Sheet)",
      render: () => <AskAiSurfaceDemo isDesktop={false} />,
    },
  ],
};

export const ASK_AI_GROUPS: CanvasGroup[] = [
  askAiComposer,
  askAiEmptyState,
  askAiMessage,
  askAiThinkingRow,
  scrollToLatest,
  askAiPanel,
  askAiSurface,
];
