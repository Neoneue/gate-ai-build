import { describe, expect, it } from "vitest";
import {
  isCommit,
  isUiPath,
  shellWritesUi,
  skillState,
  subagentCovers,
  transcriptPathOf,
  verdict,
} from "./require-skill.mjs";

// Transcript lines in Claude Code's JSONL shape: an assistant message with a
// tool_use, and a user message with its tool_result.
let seq = 0;
function use(name, input) {
  const id = `toolu_${++seq}`;
  return {
    id,
    line: JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "tool_use", id, name, input }] },
    }),
  };
}
function result(id, isError = false) {
  return JSON.stringify({
    type: "user",
    message: {
      content: [{ type: "tool_result", tool_use_id: id, is_error: isError }],
    },
  });
}
/** A call and its result, landed unless `isError`. */
function call(name, input, isError = false) {
  const u = use(name, input);
  return [u.line, result(u.id, isError)];
}
const INDEX = () =>
  call("Read", {
    file_path: "/r/agents/front-end-developer/skills/INDEX.md",
  });
const UX = () =>
  call("Read", {
    file_path: "/r/agents/front-end-developer/skills/ux-laws/SKILL.md",
  });
const SHADCN = () =>
  call("Read", {
    file_path: "/r/agents/front-end-developer/skills/shadcn/SKILL.md",
  });
const COMMIT = (isError = false) =>
  call("Bash", { command: "git commit -m x" }, isError);
const transcript = (...groups) => groups.flat().join("\n");

const VH = () =>
  call("Read", {
    file_path: "/r/agents/front-end-developer/skills/visual-hierarchy/SKILL.md",
  });
const FULL = () => transcript(INDEX(), UX(), VH(), SHADCN());

describe("isUiPath", () => {
  it("covers components, pages, layouts, src tsx and css, and the root design.md", () => {
    for (const p of [
      "src/components/ui/button.tsx",
      "/r/src/pages/Models.tsx",
      "src/layouts/AuthLayout.tsx",
      "src/index.css",
      "src/components/dotmatrix-loader.css",
      "src/components/ui/button-variants.ts",
      "/r/design.md",
      "design.md",
      "DESIGN.md",
    ]) {
      expect(isUiPath(p), p).toBe(true);
    }
  });

  it("leaves tests, logic, data, e2e and kit docs out", () => {
    for (const p of [
      "src/components/ui/button.test.tsx",
      "src/layouts/DashboardChrome.test.tsx",
      "src/lib/format.ts",
      "src/data/requests.ts",
      "e2e/smoke.spec.ts",
      "agents/front-end-developer/skills/brand/design.md",
      "node_modules/x/src/components/a.tsx",
      "",
    ]) {
      expect(isUiPath(p), p).toBe(false);
    }
  });
});

describe("shellWritesUi", () => {
  it("catches the shell bypasses", () => {
    for (const c of [
      "sed -i '' 's/600/400/' src/index.css",
      "sed -E -i '' 's/a/b/' src/components/ui/button-variants.ts",
      "perl -pi -e 's/a/b/' src/pages/Models.tsx",
      "cat > src/components/new.tsx <<'EOF'\nx\nEOF",
      "echo x >> design.md",
      "printf x | tee src/index.css",
      "cp /tmp/a.tsx src/components/a.tsx",
      "mv src/components/a.tsx src/components/b.tsx",
      "rm src/components/a.tsx",
      `python3 -c "p='src/index.css'; s=open(p).read(); open(p,'w').write(s)"`,
      `node -e "fs.writeFileSync('src/components/a.tsx', '')"`,
      "python3 - <<'EOF'\nfrom pathlib import Path\nPath('src/index.css').write_text('x')\nEOF",
    ]) {
      expect(shellWritesUi(c), c).toBe(true);
    }
  });

  it("lets reads, tests and logic edits through", () => {
    for (const c of [
      "grep -rn foo src/components",
      "sed -n 1,40p src/pages/Models.tsx",
      "cat src/index.css | head",
      "npx vitest run src/pages/models 2>&1 | tail -8",
      "git diff src/pages/Models.tsx",
      `node -e "console.log(require('fs').readFileSync('src/index.css','utf8').length)"`,
      "sed -i '' 's/a/b/' src/lib/format.ts",
      "npx tsc -b > /tmp/out.txt",
      "cp .claude/settings.json /tmp/x && grep -n a src/pages/Models.tsx",
      // A script writing a non-UI file whose text mentions design.md.
      "python3 - <<'EOF'\nfrom pathlib import Path\np = Path('agents/front-end-developer/skills/INDEX.md')\np.write_text(p.read_text().replace('a', 'Follow design.md and src/index.css'))\nEOF",
    ]) {
      expect(shellWritesUi(c), c).toBe(false);
    }
  });
});

describe("isCommit", () => {
  it("matches git commit, with -C, and not other git commands", () => {
    expect(isCommit("git commit -m x")).toBe(true);
    expect(isCommit("git -C /r commit -am x")).toBe(true);
    expect(isCommit("npx tsc -b && git commit -m x")).toBe(true);
    expect(isCommit("git log --oneline")).toBe(false);
    expect(isCommit("git merge --no-ff dev")).toBe(false);
  });
});

describe("skillState", () => {
  it("passes once the index, ux-laws, visual-hierarchy and one picked skill are in", () => {
    expect(skillState(FULL()).missing).toEqual([]);
  });

  it("an empty session misses all four", () => {
    expect(skillState("").missing).toEqual([
      "index",
      "ux-laws",
      "visual-hierarchy",
      "pick",
    ]);
  });

  it("any other skill alone is not ux-laws", () => {
    const t = transcript(call("Skill", { skill: "rams" }));
    expect(skillState(t).missing).toEqual([
      "index",
      "ux-laws",
      "visual-hierarchy",
      "pick",
    ]);
    expect(skillState(t).anySkill).toBe(true);
  });

  it("ux-laws alone still needs the index, visual-hierarchy and a pick", () => {
    expect(skillState(transcript(UX())).missing).toEqual([
      "index",
      "visual-hierarchy",
      "pick",
    ]);
  });

  it("a skill loaded before reading the index is not a pick", () => {
    const t = transcript(SHADCN(), INDEX(), UX(), VH());
    expect(skillState(t).missing).toEqual(["pick"]);
  });

  it("a landed commit resets the per-change steps, not the index read", () => {
    expect(skillState(transcript(FULL(), COMMIT())).missing).toEqual([
      "ux-laws",
      "visual-hierarchy",
      "pick",
    ]);
  });

  it("after a commit, ux-laws, visual-hierarchy and a pick pass without re-reading the index", () => {
    expect(
      skillState(transcript(FULL(), COMMIT(), UX(), VH(), SHADCN())).missing
    ).toEqual([]);
  });

  it("a blocked or failed commit resets nothing", () => {
    expect(skillState(transcript(FULL(), COMMIT(true))).missing).toEqual([]);
  });

  it("the commit being checked now (no result yet) resets nothing", () => {
    const t = transcript(
      FULL(),
      use("Bash", { command: "git commit -m x" }).line
    );
    expect(skillState(t).missing).toEqual([]);
  });

  it("the steps after a commit pass again", () => {
    expect(skillState(transcript(FULL(), COMMIT(), FULL())).missing).toEqual(
      []
    );
  });

  it("reads the index through the shell, and ux-laws by the Skill tool or slash command", () => {
    const t = transcript(
      call("Bash", {
        command: "cat agents/front-end-developer/skills/INDEX.md",
      }),
      [
        JSON.stringify({
          type: "user",
          message: { content: "<command-name>/ux-laws</command-name>" },
        }),
      ],
      VH(),
      call("Skill", { skill: "ask-sonner" })
    );
    expect(skillState(t).missing).toEqual([]);
    expect(
      skillState(
        transcript(INDEX(), call("Skill", { skill: "ux-laws" }), VH(), SHADCN())
      ).missing
    ).toEqual([]);
  });

  it("reads the kit's ux-laws through the shell", () => {
    const t = transcript(
      INDEX(),
      call("Bash", {
        command:
          "sed -n 1,90p agents/front-end-developer/skills/ux-laws/SKILL.md",
      }),
      VH(),
      SHADCN()
    );
    expect(skillState(t).missing).toEqual([]);
  });
});

describe("skillState: the UX skills are not the pick", () => {
  it("ux-laws and visual-hierarchy after the index still need one build skill", () => {
    expect(skillState(transcript(INDEX(), UX(), VH())).missing).toEqual([
      "pick",
    ]);
  });

  it("a shell pipe that only names the index is not reading it", () => {
    const t = transcript(
      call("Bash", {
        command:
          "ls agents/x/skills/ | head; grep -n a agents/x/skills/INDEX.md",
      }),
      UX(),
      VH(),
      SHADCN()
    );
    expect(skillState(t).missing).toEqual(["index", "pick"]);
  });
});

describe("transcriptPathOf", () => {
  const main = "/p/proj/sess-1.jsonl";
  const own = "/p/proj/sess-1/subagents/agent-a7.jsonl";

  it("inside a subagent, reads the subagent's own transcript when it exists", () => {
    expect(
      transcriptPathOf(
        { transcript_path: main, session_id: "sess-1", agent_id: "a7" },
        (p) => p === own
      )
    ).toBe(own);
  });

  it("inside a subagent, falls back to transcript_path when that file is missing", () => {
    expect(
      transcriptPathOf(
        { transcript_path: main, session_id: "sess-1", agent_id: "a7" },
        () => false
      )
    ).toBe(main);
  });

  it("in the main session (no agent_id), reads transcript_path", () => {
    expect(
      transcriptPathOf(
        { transcript_path: main, session_id: "sess-1" },
        () => true
      )
    ).toBe(main);
  });

  it("with no transcript_path, has nothing to read", () => {
    expect(transcriptPathOf({ agent_id: "a7" })).toBeNull();
  });
});

describe("verdict", () => {
  const run = (input, text, files = []) =>
    verdict(
      { transcript_path: "/dev/null", cwd: "/r", ...input },
      { readTranscript: () => text, filesOf: () => files }
    );
  const edit = (file_path) => ({
    tool_name: "Edit",
    tool_input: { file_path },
  });
  const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });

  it("blocks a UI edit with only another skill loaded, naming what is missing", () => {
    const why = run(
      edit("src/components/a.tsx"),
      transcript(call("Skill", { skill: "rams" }))
    );
    expect(why).toMatch(/UI gate/);
    expect(why).toMatch(/INDEX\.md/);
    expect(why).toMatch(/ux-laws\/SKILL\.md/);
    expect(why).toMatch(/visual-hierarchy/);
    expect(why).toMatch(/ONE build skill/);
  });

  it("passes a UI edit after the four steps", () => {
    expect(run(edit("src/components/a.tsx"), FULL())).toBeNull();
  });

  it("blocks the second change after a commit", () => {
    expect(run(edit("src/index.css"), transcript(FULL(), COMMIT()))).toMatch(
      /UI gate/
    );
  });

  it("blocks a shell write to a UI file", () => {
    expect(run(bash("sed -i '' 's/a/b/' src/index.css"), "")).toMatch(
      /src\/index\.css/
    );
    expect(run(bash("sed -i '' 's/a/b/' src/index.css"), FULL())).toBeNull();
  });

  it("blocks a commit holding UI files, and passes one without", () => {
    expect(run(bash("git commit -m x"), "", ["src/components/a.tsx"])).toMatch(
      /UI gate/
    );
    expect(
      run(bash("git commit -m x"), "", ["change-logs/2026-10/x.md"])
    ).toBeNull();
    expect(
      run(bash("git commit -m x"), FULL(), ["src/components/a.tsx"])
    ).toBeNull();
  });

  it("other product code (src logic, e2e) needs the index, then a skill", () => {
    const rbp = () =>
      call("Read", {
        file_path:
          "/r/agents/front-end-developer/skills/react-best-practices/SKILL.md",
      });
    for (const file of ["src/lib/format.ts", "e2e/smoke.spec.ts"]) {
      expect(run(edit(file), ""), file).toMatch(/skill gate.*INDEX\.md/s);
      // A skill alone, or one loaded before the index, is not enough.
      expect(run(edit(file), transcript(rbp())), file).toMatch(/INDEX\.md/);
      expect(run(edit(file), transcript(rbp(), INDEX())), file).toMatch(
        /skill gate/
      );
      expect(run(edit(file), transcript(INDEX())), file).toMatch(/skill gate/);
      expect(run(edit(file), transcript(INDEX(), rbp())), file).toBeNull();
    }
    expect(run(edit("README.md"), "")).toBeNull();
    expect(run(edit("scripts/lint-copy.mjs"), "")).toBeNull();
  });

  it("counts shell reads of the index and of a SKILL.md", () => {
    const t = transcript(
      call("Bash", {
        command: "cat agents/front-end-developer/skills/INDEX.md",
      }),
      call("Bash", {
        command:
          "sed -n 1,80p agents/front-end-developer/skills/react-best-practices/SKILL.md",
      })
    );
    expect(run(edit("src/lib/format.ts"), t)).toBeNull();
    // A pipe that only names the SKILL.md is not reading it.
    const named = transcript(
      INDEX(),
      call("Bash", { command: "ls agents/x/skills | grep SKILL.md" })
    );
    expect(run(edit("src/lib/format.ts"), named)).toMatch(/skill gate/);
  });

  it("inside a subagent, judges by the subagent's own transcript", () => {
    const parent = "/p/proj/sess-1.jsonl";
    const own = "/p/proj/sess-1/subagents/agent-a7.jsonl";
    const texts = { [parent]: FULL(), [own]: "" };
    const input = {
      ...edit("src/components/a.tsx"),
      transcript_path: parent,
      session_id: "sess-1",
      agent_id: "a7",
      cwd: "/r",
    };
    const deps = (ownText) => ({
      readTranscript: (p) => (p === own ? ownText : texts[p]),
      exists: (p) => p in texts,
    });
    // The parent loaded everything; the subagent loaded nothing: blocked.
    expect(verdict(input, deps(""))).toMatch(/UI gate/);
    // The subagent loads the four steps itself: passes.
    expect(verdict(input, deps(FULL()))).toBeNull();
  });

  it("passes what it cannot read", () => {
    expect(
      verdict({ tool_name: "Edit", tool_input: { file_path: "src/index.css" } })
    ).toBeNull();
  });
});

// Option 3 (G2, the owner, 2026-10-05): a UI commit passes when one of this
// session's subagents loaded the full set since the last landed commit. The
// subagent built the UI; the main session only commits it.
describe("verdict: a commit of UI a subagent built", () => {
  const MAIN = "/p/proj/sess-1.jsonl";
  const DIR = "/p/proj/sess-1/subagents";
  const SUB = `${DIR}/agent-a7.jsonl`;
  const T0 = "2026-10-05T10:00:00.000Z"; // before the commit
  const T1 = "2026-10-05T11:00:00.000Z"; // the commit lands
  const T2 = "2026-10-05T12:00:00.000Z"; // after it
  /** Stamp every line of the groups with one ISO time. */
  const at = (iso, ...groups) =>
    groups
      .flat()
      .map((l) => JSON.stringify({ ...JSON.parse(l), timestamp: iso }));
  const commitInput = {
    tool_name: "Bash",
    tool_input: { command: "git commit -m x" },
    transcript_path: MAIN,
    session_id: "sess-1",
    cwd: "/r",
  };
  /** A fake disk: `texts` maps a path to its transcript text. */
  const judge = (input, texts, files = ["src/components/a.tsx"]) =>
    verdict(input, {
      readTranscript: (p) => {
        if (!(p in texts)) {
          throw new Error(`no ${p}`);
        }
        return texts[p];
      },
      exists: (p) => p in texts,
      filesOf: () => files,
      listDir: (d) => {
        const names = Object.keys(texts)
          .filter((p) => p.startsWith(`${d}/`))
          .map((p) => p.slice(d.length + 1));
        if (names.length === 0) {
          throw new Error(`no ${d}`);
        }
        return names;
      },
    });
  const mainWithCommit = () => transcript(at(T1, COMMIT()));

  it("passes when a subagent loaded the full set after the last commit", () => {
    const texts = {
      [MAIN]: mainWithCommit(),
      [SUB]: transcript(at(T2, INDEX(), UX(), VH(), SHADCN())),
    };
    expect(judge(commitInput, texts)).toBeNull();
  });

  it("does not count a subagent's reads from before the last commit", () => {
    const straddling = {
      [MAIN]: mainWithCommit(),
      [SUB]: transcript(at(T0, INDEX(), UX(), VH()), at(T2, SHADCN())),
    };
    const why = judge(commitInput, straddling);
    expect(why).toMatch(/UI gate/);
    expect(why).toMatch(/subagents loaded all four/);
    // The index is once per session, so an index read before the commit
    // still counts when the per-change reads come after it.
    const indexBefore = {
      [MAIN]: mainWithCommit(),
      [SUB]: transcript(at(T0, INDEX()), at(T2, UX(), VH(), SHADCN())),
    };
    expect(judge(commitInput, indexBefore)).toBeNull();
  });

  it("with no subagents folder, judges the main transcript alone and blocks without reads", () => {
    expect(judge(commitInput, { [MAIN]: mainWithCommit() })).toMatch(/UI gate/);
  });

  it("passes on the main session's own full set, as before", () => {
    const own = transcript(
      at(T1, COMMIT()),
      at(T2, INDEX(), UX(), VH(), SHADCN())
    );
    expect(judge(commitInput, { [MAIN]: own })).toBeNull();
  });

  it("before any commit in the session, any subagent's full set counts", () => {
    const texts = { [MAIN]: "", [SUB]: FULL() };
    expect(judge(commitInput, texts)).toBeNull();
  });

  it("after a commit, a subagent read with no timestamp does not count", () => {
    const texts = { [MAIN]: mainWithCommit(), [SUB]: FULL() };
    expect(judge(commitInput, texts)).toMatch(/UI gate/);
  });

  it("credits commits only: a UI edit in the main session still needs its own reads", () => {
    const texts = {
      [MAIN]: mainWithCommit(),
      [SUB]: transcript(at(T2, INDEX(), UX(), VH(), SHADCN())),
    };
    const edit = {
      ...commitInput,
      tool_name: "Edit",
      tool_input: { file_path: "src/components/a.tsx" },
    };
    expect(judge(edit, texts)).toMatch(/UI gate/);
  });

  it("subagentCovers has nothing to read without a session id", () => {
    expect(
      subagentCovers({ transcript_path: MAIN }, null, {
        readTranscript: () => FULL(),
        listDir: () => ["agent-a7.jsonl"],
      })
    ).toBe(false);
  });
});
