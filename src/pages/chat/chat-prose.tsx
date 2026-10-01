import { memo, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";
import { CHAT_COPY } from "./copy";

/**
 * The only place a model's reply becomes DOM, ported from the site's
 * `components/chat/chat-prose.tsx`. No `rehype-raw`, so raw HTML in a reply
 * renders as text; images are reduced to their alt text; links open in a new
 * tab.
 *
 * Code is MONO here, unlike the Ask AI reply prose exception (design.md §3):
 * chat replies are read for their commands and snippets, and every block
 * carries a copy control. The Data voice governs, as it does everywhere the
 * exception does not reach.
 *
 * The `type-*` voices live in `@layer components`, which Tailwind v4 does not
 * register as utilities, so they cannot take an arbitrary-variant prefix.
 * Each scoped line below reproduces one voice exactly and names it, the same
 * way `ReplyProse` (ask-ai-message.tsx) does.
 */

const PROSE = cn(
  // Base: type-copy-14.
  "type-copy-14 wrap-anywhere flex flex-col gap-4 text-pretty",
  "[&>*]:m-0",
  "[&_li>p]:m-0 [&_li]:m-0 [&_ol]:my-0 [&_ul]:my-0",
  "[&>*+h1]:mt-2 [&>*+h2]:mt-2 [&>*+h3]:mt-2 [&>*+h4]:mt-2 [&>*+h5]:mt-2 [&>*+h6]:mt-2",
  // h1: the site's type-heading-18 (text-lg/7 medium snug), the same rung
  // ReplyProse already carries for its markdown h2.
  "[&_h1]:font-medium [&_h1]:font-sans [&_h1]:text-lg/7 [&_h1]:tracking-snug",
  // h2: type-heading-16.
  "[&_h2]:font-medium [&_h2]:font-sans [&_h2]:text-base/6 [&_h2]:tracking-snug",
  // h3-h6: type-heading-14.
  "[&_h3]:font-medium [&_h3]:font-sans [&_h3]:text-sm [&_h4]:font-medium [&_h4]:font-sans [&_h4]:text-sm [&_h5]:font-medium [&_h5]:font-sans [&_h5]:text-sm [&_h6]:font-medium [&_h6]:font-sans [&_h6]:text-sm",
  "[&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-1 [&_ol]:pl-4",
  "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:pl-4",
  "[&_li>ol]:mt-1 [&_li>ul]:mt-1",
  "[&_.task-list-item]:list-none",
  "[&_.task-list-item_input]:mr-1 [&_.task-list-item_input]:accent-primary",
  "[&_strong]:font-medium",
  "[&_a:hover]:no-underline [&_a]:underline [&_a]:underline-offset-2",
  "[&_a:focus-visible]:rounded-xs [&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-ring [&_a:focus-visible]:ring-offset-2 [&_a:focus-visible]:ring-offset-background",
  // Inline code: type-mono-12 on a --muted chip.
  "[&_:not(pre)>code]:rounded-xs [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:font-normal [&_:not(pre)>code]:text-xs [&_:not(pre)>code]:tabular-nums",
  "[&_blockquote]:border-border [&_blockquote]:border-l [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
  "[&_blockquote>*+*]:mt-3",
  "[&_hr]:h-px [&_hr]:border-0 [&_hr]:bg-border",
  "[&_table]:w-full [&_table]:border-collapse",
  // th: type-label-12. td: type-copy-14.
  "[&_th:last-child]:pr-0 [&_th]:border-border [&_th]:border-b [&_th]:pr-4 [&_th]:pb-1 [&_th]:text-left [&_th]:font-medium [&_th]:font-sans [&_th]:text-xs",
  "[&_td:last-child]:pr-0 [&_td]:border-border [&_td]:border-b [&_td]:py-1 [&_td]:pr-4 [&_td]:align-top [&_td]:font-normal [&_td]:font-sans [&_td]:text-sm"
);

interface CodeProps {
  children?: ReactNode;
  className?: string;
}

function flatten(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flatten).join("");
  }
  if (typeof node === "object" && "props" in node) {
    return flatten(
      (node as { props: { children?: ReactNode } }).props.children
    );
  }
  return "";
}

const LANGUAGE_CLASS = /language-([\w+-]+)/;

function languageOf(className: string | undefined): string | null {
  const match = LANGUAGE_CLASS.exec(className ?? "");
  return match ? match[1] : null;
}

/** A fenced block: language label and copy control on a header row, code
    below. Long lines wrap so an unbroken token can never widen the lane. */
function ChatCodeBlock({ className, children }: CodeProps) {
  const source = flatten(children).replace(/\n$/, "");
  const language = languageOf(className);
  return (
    <div className="flex flex-col overflow-hidden rounded-sm border border-border bg-muted">
      <div className="flex items-center justify-between gap-2 border-border border-b py-1 pr-1 pl-3">
        <span className="type-mono-12 text-muted-foreground">
          {language ?? CHAT_COPY.code}
        </span>
        <CopyButton label={CHAT_COPY.codeBlock} size="icon-sm" value={source} />
      </div>
      <pre className="type-mono-12 wrap-anywhere overflow-x-auto whitespace-pre-wrap p-3 text-foreground">
        <code>{source}</code>
      </pre>
    </div>
  );
}

const COMPONENTS = {
  img: ({ alt }: { alt?: string }) =>
    alt ? <span className="text-muted-foreground">{alt}</span> : null,
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    const isFragment = href?.startsWith("#") ?? false;
    return (
      <a
        href={href}
        rel={isFragment ? undefined : "noopener noreferrer"}
        target={isFragment ? undefined : "_blank"}
      >
        {children}
      </a>
    );
  },
  table: ({ children }: { children?: ReactNode }) => (
    // -mx-1 px-1 reserves the 4px focus ring a link in a cell paints, which a
    // scrollport would otherwise clip (design.md, Focus ring / Clipping).
    <div className="-mx-1 overflow-x-auto px-1">
      <table>{children}</table>
    </div>
  ),
  // react-markdown renders a fenced block as <pre><code>; taking over <pre>
  // means the block owns its own chrome and the inline <code> rule stays intact.
  pre: ({ children }: { children?: ReactNode }) => {
    const child = Array.isArray(children) ? children[0] : children;
    const props =
      child && typeof child === "object" && "props" in child
        ? (child as { props: CodeProps }).props
        : { children };
    return (
      <ChatCodeBlock className={props.className}>
        {props.children}
      </ChatCodeBlock>
    );
  },
} as const;

const PLUGINS = [remarkGfm];

export const ChatProse = memo(function ChatProse({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn(PROSE, className)}>
      <Markdown components={COMPONENTS} remarkPlugins={PLUGINS}>
        {children}
      </Markdown>
    </div>
  );
});
