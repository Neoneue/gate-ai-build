import {
  CodeBlock,
  CodeCard,
  CodeCardCopyButton,
  CodeCardHeader,
  CodeCardTabs,
  TerminalCard,
} from "@/components/ui/code-card";
import { CodePanel } from "@/components/ui/code-panel";
import { MessageBlock, type MessageRole } from "@/components/ui/message-block";
import { ToolCallCard } from "@/components/ui/tool-call-card";
import { ToolResultCode } from "@/components/ui/tool-result-code";
import { linesToString } from "@/lib/formatters";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import { Stateful } from "@/pages/component-canvas/demos";
import {
  SAMPLE_CODE_LINES,
  SAMPLE_KEY,
  SAMPLE_SNIPPET,
} from "@/pages/component-canvas/sample-data";

/* Code and conversation parts (design.md "Conversation parts", CodeCard).
 * One request body and one tool call are reused across every example. */

const SAMPLE_CODE_TEXT = linesToString(SAMPLE_CODE_LINES);
const CODE_TABS = ["cURL", "Python", "Node"];

function codeCardParts() {
  return (
    <>
      <CodeCardHeader>
        <Stateful initial="cURL">
          {(active, setActive) => (
            <CodeCardTabs
              active={active}
              items={CODE_TABS}
              onChange={setActive}
            />
          )}
        </Stateful>
        <CodeCardCopyButton label="request" value={SAMPLE_CODE_TEXT} />
      </CodeCardHeader>
      <CodeBlock lines={SAMPLE_CODE_LINES} />
    </>
  );
}

const codeCard: CanvasGroup = {
  id: "code-card",
  title: "CodeCard",
  files: ["code-card.tsx"],
  columns: 2,
  examples: [
    {
      label: 'elevation="flat" (default)',
      render: () => (
        <CodeCard className="w-full" elevation="flat">
          {codeCardParts()}
        </CodeCard>
      ),
    },
    {
      label: 'elevation="raised"',
      render: () => (
        <CodeCard className="w-full" elevation="raised">
          {codeCardParts()}
        </CodeCard>
      ),
    },
    {
      label: "CodeCardTabs read-only (no onChange)",
      render: () => (
        <CodeCard className="w-full">
          <CodeCardHeader>
            <CodeCardTabs active="cURL" items={CODE_TABS} />
          </CodeCardHeader>
          <CodeBlock lines={SAMPLE_CODE_LINES} />
        </CodeCard>
      ),
    },
  ],
};

const codeBlock: CanvasGroup = {
  id: "code-block",
  title: "CodeBlock",
  files: ["code-card.tsx"],
  columns: 2,
  examples: [
    {
      label: 'density="default" tone="light"',
      render: () => (
        <CodeCard className="w-full">
          <CodeBlock density="default" lines={SAMPLE_CODE_LINES} />
        </CodeCard>
      ),
    },
    {
      label: 'density="compact"',
      render: () => (
        <CodeCard className="w-full">
          <CodeBlock density="compact" lines={SAMPLE_CODE_LINES} />
        </CodeCard>
      ),
    },
    {
      label: 'density="inline"',
      render: () => (
        <CodeCard className="w-full">
          <CodeBlock density="inline" lines={SAMPLE_CODE_LINES} />
        </CodeCard>
      ),
    },
    {
      label: "wrap",
      render: () => (
        <CodeCard className="w-full">
          <CodeBlock lines={SAMPLE_CODE_LINES} wrap />
        </CodeCard>
      ),
    },
    {
      label: "highlightTooltip (hover the highlighted token)",
      render: () => (
        <CodeCard className="w-full">
          <CodeBlock
            highlightTooltip="This model is routed through your gateway."
            lines={SAMPLE_CODE_LINES}
          />
        </CodeCard>
      ),
    },
    {
      label: 'tone="dark" (inside TerminalCard)',
      render: () => (
        <TerminalCard className="w-full" title="request.sh">
          <CodeBlock lines={SAMPLE_CODE_LINES} tone="dark" />
        </TerminalCard>
      ),
    },
  ],
};

const terminalCard: CanvasGroup = {
  id: "terminal-card",
  title: "TerminalCard",
  files: ["code-card.tsx"],
  columns: 2,
  examples: [
    {
      label: 'title="request.sh"',
      render: () => (
        <TerminalCard className="w-full" title="request.sh">
          <CodeBlock lines={SAMPLE_CODE_LINES} tone="dark" />
        </TerminalCard>
      ),
    },
    {
      label: "with CodePanel",
      render: () => (
        <TerminalCard className="w-full" title="client.ts">
          <CodePanel snippet={SAMPLE_SNIPPET} />
        </TerminalCard>
      ),
    },
  ],
};

const codePanel: CanvasGroup = {
  id: "code-panel",
  title: "CodePanel",
  files: ["code-panel.tsx"],
  columns: 2,
  examples: [
    {
      label: "snippet (on bg-card)",
      render: () => (
        <div className="w-full rounded-md border border-border bg-card">
          <CodePanel snippet={SAMPLE_SNIPPET} />
        </div>
      ),
    },
  ],
};

const SAMPLE_TOOL_ARGS = `{"key_id": "${SAMPLE_KEY.id}", "window": "7d"}`;

const toolCallCard: CanvasGroup = {
  id: "tool-call-card",
  title: "ToolCallCard",
  files: ["tool-call-card.tsx"],
  columns: 2,
  examples: [
    {
      label: "name + args",
      render: () => (
        <ToolCallCard
          args={SAMPLE_TOOL_ARGS}
          className="w-full"
          name="get_key_usage"
        />
      ),
    },
    {
      label: 'args="" (name only)',
      render: () => (
        <ToolCallCard args="" className="w-full" name="get_key_usage" />
      ),
    },
    {
      label: "long args (three-line clamp)",
      render: () => (
        <ToolCallCard
          args={Array.from({ length: 8 }, () => SAMPLE_TOOL_ARGS).join(" ")}
          className="w-full"
          name="get_key_usage"
        />
      ),
    },
  ],
};

const toolResultCode: CanvasGroup = {
  id: "tool-result-code",
  title: "ToolResultCode",
  files: ["tool-result-code.tsx"],
  columns: 2,
  examples: [
    {
      label: "default",
      render: () => (
        <ToolResultCode>{`{"requests": 2860, "blocked": 124, "key": "${SAMPLE_KEY.name}"}`}</ToolResultCode>
      ),
    },
  ],
};

/* MessageBlock's `role` is the message author, not an ARIA role; typed
 * constants keep the a11y role lint from reading it as one. */
const TOOL: MessageRole = "tool";
const ASSISTANT: MessageRole = "assistant";
const USER: MessageRole = "user";

const MESSAGE_ROLES = ["system", "user", "tool", "assistant"] as const;
const MESSAGE_BODY = "Summarize the blocked requests on prod-web this week.";

const messageBlock: CanvasGroup = {
  id: "message-block",
  title: "MessageBlock",
  files: ["message-block.tsx"],
  columns: 2,
  examples: [
    ...MESSAGE_ROLES.map((role) => ({
      label: `role="${role}"`,
      render: () => (
        <MessageBlock body={MESSAGE_BODY} className="w-full" role={role} />
      ),
    })),
    {
      label: 'tool="get_key_usage"',
      render: () => (
        <MessageBlock
          body={
            <ToolResultCode>{`{"requests": 2860, "blocked": 124}`}</ToolResultCode>
          }
          className="w-full"
          role={TOOL}
          tool="get_key_usage"
        />
      ),
    },
    {
      label: "assistant body with ToolCallCard",
      render: () => (
        <MessageBlock
          body={
            <span className="flex min-w-0 flex-col gap-2">
              Checking usage for prod-web.
              <ToolCallCard args={SAMPLE_TOOL_ARGS} name="get_key_usage" />
            </span>
          }
          className="w-full"
          role={ASSISTANT}
        />
      ),
    },
    {
      label: 'tone="warn"',
      render: () => (
        <MessageBlock
          body={MESSAGE_BODY}
          className="w-full"
          role={USER}
          tone="warn"
        />
      ),
    },
    {
      label: 'tone="danger"',
      render: () => (
        <MessageBlock
          body={MESSAGE_BODY}
          className="w-full"
          role={USER}
          tone="danger"
        />
      ),
    },
    {
      label: "onClick (selectable)",
      render: () => (
        <Stateful initial={false}>
          {(selected, setSelected) => (
            <MessageBlock
              body={MESSAGE_BODY}
              className="w-full"
              onClick={() => setSelected(!selected)}
              role={ASSISTANT}
              selected={selected}
            />
          )}
        </Stateful>
      ),
    },
    {
      label: "selected",
      render: () => (
        <MessageBlock
          body={MESSAGE_BODY}
          className="w-full"
          onClick={() => undefined}
          role={ASSISTANT}
          selected
        />
      ),
    },
    {
      label: "time + requestId + copyValue (copy, expand)",
      render: () => (
        <MessageBlock
          body={MESSAGE_BODY}
          className="w-full"
          copyValue={MESSAGE_BODY}
          requestId="req_7a3f9e2b"
          role={ASSISTANT}
          time="09:41:06"
        />
      ),
    },
  ],
};

export const CODE_GROUPS: CanvasGroup[] = [
  codeCard,
  codeBlock,
  terminalCard,
  codePanel,
  toolCallCard,
  toolResultCode,
  messageBlock,
];
