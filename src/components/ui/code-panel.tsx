/**
 * CodePanel: single-pass syntax highlighter for a code string.
 * Relocated verbatim from DashboardDefault.tsx so it lives in the UI layer
 * instead of being cross-imported page-to-page. Distinct from CodeBlock/
 * CodeCard (code-card.tsx), which render a pre-tokenized CodeLine[] model;
 * this one tokenizes a raw string in place.
 */

const KEYWORDS = new Set([
  "import",
  "export",
  "from",
  "const",
  "let",
  "var",
  "await",
  "new",
  "async",
  "function",
  "return",
  "class",
]);

type CodeToken = {
  text: string;
  type: "keyword" | "string" | "comment" | "property" | "plain";
};

function tokenizeLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    // Line comment — consumes to end of line. Strings are handled below, so a
    // `//` inside a URL ("https://…") is tokenized as a string and never
    // reaches here.
    if (ch === "/" && line[i + 1] === "/") {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }
    if (ch === "#") {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === ch) {
          j++;
          break;
        }
        j++;
      }
      tokens.push({ text: line.slice(i, j), type: "string" });
      i = j;
    } else if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) {
        j++;
      }
      const word = line.slice(i, j);
      // Object/JSON key: an identifier immediately followed by `:` renders in
      // the property hue, matching the CodeBlock theme.
      const type = KEYWORDS.has(word)
        ? "keyword"
        : line[j] === ":"
          ? "property"
          : "plain";
      tokens.push({ text: word, type });
      i = j;
    } else {
      if (tokens.length > 0 && tokens[tokens.length - 1].type === "plain") {
        tokens[tokens.length - 1].text += ch;
      } else {
        tokens.push({ text: ch, type: "plain" });
      }
      i++;
    }
  }
  return tokens;
}

export function CodePanel({ snippet }: { snippet: string }) {
  const lines = snippet.split("\n");
  return (
    <div className="overflow-x-auto p-4">
      {lines.map((line, i) => (
        <div className="flex gap-4 leading-relaxed" key={i}>
          <span className="w-4 shrink-0 select-none text-right font-mono text-neutral-400 text-xs tabular-nums">
            {i + 1}
          </span>
          <span className="flex-1 whitespace-pre font-mono text-xs">
            {tokenizeLine(line).map((tok, j) => {
              // Match the CodeBlock (CodeCard) theme tokens so every code
              // surface shares one syntax palette: amber keywords, green
              // strings/values, blue keys, muted comments.
              const cls =
                tok.type === "keyword"
                  ? "text-[var(--color-syntax-keyword)]"
                  : tok.type === "string"
                    ? "text-[var(--color-syntax-terminal-blue)]"
                    : tok.type === "property"
                      ? "text-[var(--color-syntax-property)]"
                      : tok.type === "comment"
                        ? "text-muted-foreground"
                        : "text-foreground";
              return (
                <span className={cls} key={j}>
                  {tok.text}
                </span>
              );
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
