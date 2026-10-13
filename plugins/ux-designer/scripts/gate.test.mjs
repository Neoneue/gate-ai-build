// Unit tests for the ux-designer gate. Run: node --test plugins/ux-designer/scripts/
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptyState,
  isApproval,
  lineDiff,
  postToolUse,
  preToolUse,
  stopCheck,
  validateSpec,
} from "./gate.mjs";

const URL = "https://design-system.service.gov.uk/components/summary-list/";
const GOOD = `# Spec: Settings > Limits card

## Requirements
| # | Requirement | Moment | Home | Reason |
| --- | --- | --- | --- | --- |
| 1 | Admin sees the current limit | always | Details row | confirms it works |
| 2 | Admin learns how to raise it | error | field error | rarely needed |
| 3 | Brief: a banner about limits | cut | none | row 2 covers it |

## Surface
| Element | Says (only here) | Tier | Column | Copy | States |
| --- | --- | --- | --- | --- | --- |
| Title | what the card controls | 1 | left | "Limits" | all |
| Field | the limit to set | 2 | right | "Limit" | rest, error |
| Details | the saved limit | 3 | left | "Current limit" | all |

## Values
| Value | Home |
| --- | --- |
| typed limit | input |
| saved limit | Details row |

## Candidates
### A: field row + details list
### B: details list with inline edit

## Decision
Chosen: A, because the field leads.
Rejected: B, because inline edit hides the action.
Precedent: ${URL} -> DetailList, per key-value-details.md
`;

const designer = (tool_name, tool_input, extra = {}) => ({
  agent_type: "ux-designer:designer",
  tool_name,
  tool_input,
  ...extra,
});
// A path that does not exist, so the write is a new UI file: feature-size.
const ui = (f = "src/pages/ZzNewSurface.tsx") =>
  designer("Edit", { file_path: f });

test("a complete spec with a fetched precedent is valid", () => {
  assert.deepEqual(validateSpec(GOOD, [URL]).errors, []);
});

test("precedent URL matches across www, trailing slash and fragment", () => {
  const v = validateSpec(GOOD, [
    "https://www.design-system.service.gov.uk/components/summary-list#x",
  ]);
  assert.equal(v.valid, true);
});

test("a precedent from memory is rejected", () => {
  const v = validateSpec(GOOD, []);
  assert.equal(v.valid, false);
  assert.match(v.errors.join(" "), /not fetched/);
});

test("missing section, bad moment, cut without reason, duplicate value, one candidate", () => {
  const bad = GOOD.replace("## Surface", "## Layout")
    .replace("| error | field error", "| sometimes | field error")
    .replace("| row 2 covers it |", "| |")
    .replace(
      "| saved limit | Details row |",
      "| saved limit | Details row |\n| Typed limit | helper |"
    )
    .replace("### B: details list with inline edit", "");
  const errs = validateSpec(bad, [URL]).errors.join("\n");
  assert.match(errs, /Missing section "## Surface"/);
  assert.match(errs, /Moment "sometimes"/);
  assert.match(errs, /cut row needs a Reason/);
  assert.match(errs, /listed twice/);
  assert.match(errs, /at least two structures/);
});

test("Tiny one-liner is valid", () => {
  const v = validateSpec(
    "Tiny: gap-2 to gap-3 on the banner, callout.tsx, one value only",
    []
  );
  assert.equal(v.tiny, true);
  assert.equal(v.valid, true);
});

test("approval words: go / approved at the start or end; questions do not count", () => {
  for (const yes of [
    "go",
    "Go.",
    "go names, then go on the baseline",
    "approved",
    "looks right, go",
    "lgtm",
  ]) {
    assert.equal(isApproval(yes), true, yes);
  }
  for (const no of [
    "why did you cut the banner?",
    "can you go back and add the note?",
    "change the title",
    "",
  ]) {
    assert.equal(isApproval(no), false, no);
  }
});

function withSpec(text = GOOD, at = 1000) {
  const s = emptyState();
  s.fetched.push(URL);
  postToolUse(
    designer("Write", { file_path: "/tmp/sp/design-spec.md", content: text }),
    s,
    at
  );
  return s;
}

test("other agents are never gated", () => {
  assert.equal(
    preToolUse(
      { ...ui(), agent_type: "front-end-developer" },
      emptyState(),
      {}
    ),
    null
  );
  assert.equal(
    preToolUse({ ...ui(), agent_type: undefined }, emptyState(), {}),
    null
  );
});

test("no spec: UI write blocked; non-UI and spec writes allowed", () => {
  const s = emptyState();
  assert.match(preToolUse(ui(), s, {}), /write a valid spec/);
  assert.equal(preToolUse(ui("src/lib/math.ts"), s, {}), null);
  assert.equal(preToolUse(ui("src/pages/Limits.test.tsx"), s, {}), null);
  assert.equal(
    preToolUse(
      designer("Write", { file_path: "/tmp/sp/design-spec.md" }),
      s,
      {}
    ),
    null
  );
});

test("valid spec but no reply: blocked", () => {
  assert.match(preToolUse(ui(), withSpec(), {}), /has not replied/);
});

test("a question after the spec does not unlock; go does", () => {
  const s = withSpec();
  s.prompts.push({
    t: 2000,
    approve: isApproval("why did you cut the banner?"),
  });
  assert.match(preToolUse(ui(), s, {}), /did not approve/);
  s.prompts.push({ t: 3000, approve: isApproval("go") });
  assert.equal(preToolUse(ui(), s, {}), null);
});

test("a go BEFORE the spec does not count", () => {
  const s = emptyState();
  s.prompts.push({ t: 500, approve: true });
  s.fetched.push(URL);
  postToolUse(
    designer("Write", { file_path: "/tmp/sp/design-spec.md", content: GOOD }),
    s,
    1000
  );
  assert.match(preToolUse(ui(), s, {}), /has not replied/);
});

test("editing the spec after approval needs a new go", () => {
  const s = withSpec(GOOD, 1000);
  s.prompts.push({ t: 2000, approve: true });
  postToolUse(
    designer("Edit", { file_path: "/tmp/sp/design-spec.md", new_string: GOOD }),
    s,
    3000
  );
  assert.match(preToolUse(ui(), s, {}), /has not replied/);
});

test("modes: spec-only always blocks, auto-approve skips the reply", () => {
  const s = withSpec();
  assert.match(
    preToolUse(ui(), s, { UX_DESIGNER_MODE: "spec-only" }),
    /Spec-only/
  );
  assert.equal(preToolUse(ui(), s, { UX_DESIGNER_MODE: "auto-approve" }), null);
});

test("Tiny unlocks exactly one UI file, with no second approval round", () => {
  const s = withSpec(
    "Tiny: gap-2 to gap-3 on the banner, callout.tsx, one value only"
  );
  assert.equal(preToolUse(ui("src/components/ui/callout.tsx"), s, {}), null);
  postToolUse(ui("src/components/ui/callout.tsx"), s, 2500);
  assert.match(
    preToolUse(ui("src/pages/Other.tsx"), s, {}),
    /unlocks one file/
  );
});

test("shell writes to UI files are gated too", () => {
  const cmd = designer("Bash", {
    command: "sed -i '' 's/gap-2/gap-3/' src/components/ui/callout.tsx",
  });
  // A one-line sed on an existing file is a small edit: no spec.
  assert.equal(preToolUse(cmd, emptyState(), {}), null);
  // Once the work is feature-size, shell writes are gated like any other.
  assert.match(
    preToolUse(cmd, { ...emptyState(), feature: true }, {}),
    /write a valid spec/
  );
  assert.equal(
    preToolUse(
      designer("Bash", { command: "cat src/components/ui/callout.tsx" }),
      emptyState(),
      {}
    ),
    null
  );
});

test("an invalid spec write is reported back as a block with the errors", () => {
  const s = emptyState();
  const res = postToolUse(
    designer("Write", {
      file_path: "/tmp/sp/design-spec.md",
      content: "# Spec\n",
    }),
    s,
    1000
  );
  assert.match(res.block, /Missing section/);
});

test("lookups are recorded from WebFetch and from WebSearch results", () => {
  const s = emptyState();
  postToolUse(designer("WebFetch", { url: "https://a.example/x" }), s);
  postToolUse(
    {
      ...designer("WebSearch", { query: "q" }),
      tool_response: { results: [{ url: "https://b.example/y" }] },
    },
    s
  );
  assert.deepEqual(s.fetched, ["https://a.example/x", "https://b.example/y"]);
});

test("shell: read-only commands with > in a quoted pattern or 2>&1 are not writes", () => {
  const reads = [
    `grep -rhoE '>\\s*(Upgrade to Pro|Save changes)\\s*<' src/pages/Settings.tsx | sort | uniq -c`,
    "npx tsc -b 2>&1 | tail -5",
    "cat src/components/ui/callout.tsx > /tmp/copy.txt",
    "cp src/components/ui/callout.tsx /tmp/callout.bak",
    'grep -n "a > b" src/App.tsx',
  ];
  for (const c of reads) {
    assert.equal(
      preToolUse(designer("Bash", { command: c }), emptyState(), {}),
      null,
      c
    );
  }
});

test("shell: real writes to UI files are caught", () => {
  const writes = [
    "echo x > src/pages/Limits.tsx",
    "printf x >> src/index.css",
    "cat a | tee src/pages/Limits.tsx",
    "sed -i '' 's/a/b/' src/pages/Limits.tsx",
    "perl -pi -e 's/a/b/' src/pages/Limits.tsx",
    "cp /tmp/x.tsx src/pages/Limits.tsx",
    "mv src/pages/Old.tsx src/pages/New.tsx",
    `node -e "require('fs').writeFileSync('src/pages/Limits.tsx','')"`,
  ];
  for (const c of writes) {
    assert.match(
      preToolUse(
        designer("Bash", { command: c }),
        { ...emptyState(), feature: true },
        {}
      ) ?? "",
      /valid spec/,
      c
    );
  }
});

test("stop is held until the duplicate check and the reviewer ran", () => {
  const s = withSpec();
  s.feature = true;
  s.prompts.push({ t: 2000, approve: true });
  postToolUse(ui(), s, 2500);
  assert.match(
    stopCheck({ agent_type: "ux-designer:designer" }, s, {}),
    /duplicate checker.*reviewer/s
  );
  postToolUse(
    designer("Bash", {
      command: "node /p/scripts/dup-check.mjs --url x --selector y",
    }),
    s
  );
  postToolUse(designer("Agent", { subagent_type: "ux-designer:reviewer" }), s);
  assert.equal(stopCheck({ agent_type: "ux-designer:designer" }, s, {}), null);
  assert.equal(
    stopCheck(
      { agent_type: "ux-designer:designer", stop_hook_active: true },
      withSpec(),
      {}
    ),
    null
  );
});

test("the main session is gated only when the project opts in", () => {
  const main = { ...ui(), agent_type: undefined };
  const on = { UX_DESIGNER_GATE_MAIN: "1" };
  assert.equal(preToolUse(main, emptyState(), {}), null);
  assert.match(preToolUse(main, emptyState(), on), /write a valid spec/);
  assert.equal(
    preToolUse(
      { ...main, agent_id: "a1", agent_type: "animator" },
      emptyState(),
      on
    ),
    null
  );
  assert.equal(preToolUse({ ...main, agent_id: "a1" }, emptyState(), on), null);
});

test("an MCP fetch or scrape counts as a looked-up precedent", () => {
  const s = emptyState();
  postToolUse(
    {
      tool_name: "mcp__plugin_context-mode_context-mode__ctx_fetch_and_index",
      tool_input: { requests: [{ url: URL }] },
    },
    s
  );
  postToolUse(
    {
      tool_name: "mcp__firecrawl__firecrawl_scrape",
      tool_input: { url: "https://vercel.com/docs" },
    },
    s
  );
  assert.deepEqual(s.fetched, [URL, "https://vercel.com/docs"]);
  assert.equal(validateSpec(GOOD, s.fetched).valid, true);
});

// An existing UI file in this repo, so its edits are sized, not "new file".
const EXISTING = "src/components/ui/callout.tsx";
const edit = (lines) =>
  designer("Edit", {
    file_path: EXISTING,
    old_string: "a",
    new_string: Array.from({ length: lines }, (_, i) => `l${i}`).join("\n"),
  });

test("small edits pass with no spec, and a run of them never adds up", () => {
  const s = emptyState();
  for (let i = 0; i < 10; i += 1) {
    assert.equal(preToolUse(edit(20), s, {}), null);
  }
  assert.equal(s.feature, false);
});

test("one edit over 40 changed lines is feature-size and needs a spec", () => {
  const s = emptyState();
  assert.match(preToolUse(edit(45), s, {}), /feature-size/);
  assert.equal(s.feature, true);
  // From then on, small edits to the same work need the spec too.
  assert.match(preToolUse(edit(1), s, {}), /valid spec/);
});

test("auto-approve: a valid spec unlocks the build with no reply", () => {
  const s = withSpec();
  s.feature = true;
  assert.equal(preToolUse(ui(), s, { UX_DESIGNER_MODE: "auto-approve" }), null);
});

test("a commit closes the work: the next feature needs its own spec", () => {
  const s = withSpec();
  s.feature = true;
  postToolUse(designer("Bash", { command: "git commit -m x" }), s);
  assert.equal(s.spec, null);
  assert.equal(s.feature, false);
  assert.equal(preToolUse(edit(2), s, {}), null);
});

test("agent types listed in UX_DESIGNER_GATE_AGENTS are gated", () => {
  const fe = { ...ui(), agent_type: "front-end-developer", agent_id: "a1" };
  const env = { UX_DESIGNER_GATE_AGENTS: "front-end-developer, designer" };
  assert.match(preToolUse(fe, emptyState(), env), /valid spec/);
  assert.equal(preToolUse(fe, emptyState(), {}), null);
});

test("lineDiff counts added plus removed lines", () => {
  assert.equal(lineDiff("a\nb\nc", "a\nB\nc"), 2);
  assert.equal(lineDiff("a", "a"), 0);
});

test("the Precedent line must cite a patterns entry, or say none fits", () => {
  const entries = ["key-value-details.md", "locked-setting.md"];
  const bare = GOOD.replace(", per key-value-details.md", "");
  assert.match(
    validateSpec(bare, [URL], entries).errors.join(" "),
    /must name the patterns entry/
  );
  assert.deepEqual(validateSpec(GOOD, [URL], entries).errors, []);
  const none = bare.replace(
    "-> DetailList",
    "-> DetailList; none fits: a new kind of chart"
  );
  assert.deepEqual(validateSpec(none, [URL], entries).errors, []);
});

test("a subagent owes the dup-check only; the main session owes the reviewer", () => {
  const gateVars = { UX_DESIGNER_GATE_AGENTS: "front-end-developer" };
  const fe = { agent_type: "front-end-developer", agent_id: "a1" };
  const s = withSpec();
  s.feature = true;
  postToolUse(
    { ...fe, tool_name: "Edit", tool_input: { file_path: EXISTING } },
    s,
    3000,
    gateVars
  );
  // The subagent cannot start a reviewer, so it is held for the dup-check only.
  assert.match(
    stopCheck(fe, s, gateVars),
    /duplicate checker.*reviewer is still owed/s
  );
  postToolUse(
    {
      ...fe,
      tool_name: "Bash",
      tool_input: { command: "node /p/scripts/dup-check.mjs" },
    },
    s,
    3100,
    gateVars
  );
  assert.equal(stopCheck(fe, s, gateVars), null);
  // The main session then owes the reviewer, gated or not.
  assert.match(stopCheck({}, s, {}), /spawn ux-designer:reviewer/);
  postToolUse(
    {
      tool_name: "Agent",
      tool_input: { subagent_type: "ux-designer:reviewer" },
    },
    s
  );
  assert.equal(stopCheck({}, s, {}), null);
});

test("each stopper has its own two-block budget", () => {
  const s = withSpec();
  s.feature = true;
  postToolUse(ui(), s, 2500);
  s.stopBlocksBy = { a1: 2 };
  assert.equal(
    stopCheck({ agent_type: "designer", agent_id: "a1" }, s, {}),
    null
  );
  assert.match(stopCheck({}, s, {}), /reviewer/);
});
