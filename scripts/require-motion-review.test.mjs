import { describe, expect, it } from "vitest";
import { hasProof, reviewState, verdict } from "./require-motion-review.mjs";

// Transcript lines in Claude Code's JSONL shape, as in require-skill.test.mjs.
let seq = 0;
function call(name, input, isError = false) {
  const id = `toolu_${++seq}`;
  return [
    JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "tool_use", id, name, input }] },
    }),
    JSON.stringify({
      type: "user",
      message: {
        content: [{ type: "tool_result", tool_use_id: id, is_error: isError }],
      },
    }),
  ];
}
function said(text) {
  return [
    JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text }] },
    }),
  ];
}
const transcript = (...groups) => groups.flat().join("\n");
const kit = (name) => `/r/agents/animator/skills/${name}/SKILL.md`;
const READ = (name) => call("Read", { file_path: kit(name) });
const ANIMATOR_INDEX = () =>
  call("Read", { file_path: "/r/agents/animator/skills/INDEX.md" });
const EDIT = (file = "/r/src/pages/onboarding/onboarding-motion.css") =>
  call("Edit", { file_path: file });
const REDUCED = () =>
  call("mcp__playwright__browser_emulate_media", { reducedMotion: "reduce" });
const REVIEWS = () =>
  transcript(
    READ("review-animations"),
    READ("transitions-polish"),
    REDUCED(),
    READ("emil-design-eng")
  );
const PROOF =
  "review-animations verdict: Approve. emil-design-eng Before: x. After: y.";

const stop = (text, extra = {}) =>
  verdict(
    {
      hook_event_name: "Stop",
      transcript_path: "/t.jsonl",
      last_assistant_message: "",
      ...extra,
    },
    { readTranscript: () => text }
  );

describe("hasProof", () => {
  it("needs the verdict and the Before / After", () => {
    expect(hasProof(PROOF)).toBe(true);
    expect(hasProof("review-animations: Approve")).toBe(false);
    expect(hasProof("emil-design-eng Before After")).toBe(false);
  });
});

describe("reviewState", () => {
  it("is not armed without a src write", () => {
    expect(reviewState(transcript(ANIMATOR_INDEX())).armed).toBe(false);
    expect(
      reviewState(transcript(call("Edit", { file_path: "/r/scripts/x.mjs" })))
        .armed
    ).toBe(false);
  });

  it("a blocked write arms nothing", () => {
    expect(reviewState(transcript(EDIT(), [])).armed).toBe(true);
    expect(
      reviewState(transcript(call("Edit", { file_path: "/r/src/a.css" }, true)))
        .armed
    ).toBe(false);
  });

  it("lists every step after a write", () => {
    expect(reviewState(transcript(EDIT())).missing).toEqual([
      "review-animations",
      "transitions-polish",
      "reduced-motion",
      "emil-design-eng",
    ]);
  });

  it("a follow-up edit resets the steps", () => {
    const s = reviewState(transcript(EDIT(), REVIEWS(), EDIT()));
    expect(s.missing).toHaveLength(4);
  });

  it("steps out of order do not count", () => {
    const s = reviewState(
      transcript(
        EDIT(),
        READ("emil-design-eng"),
        READ("transitions-polish"),
        READ("review-animations"),
        REDUCED()
      )
    );
    expect(s.missing).toEqual(["transitions-polish", "emil-design-eng"]);
  });

  it("counts shell reads and a scripted reduced-motion check", () => {
    const s = reviewState(
      transcript(
        EDIT(),
        call("Bash", {
          command:
            "sed -n 1,200p agents/animator/skills/review-animations/SKILL.md; cat agents/animator/skills/transitions-polish/SKILL.md",
        }),
        call("Bash", {
          command: `node probe.mjs # page.emulateMedia({ reducedMotion: "reduce" })`,
        }),
        call("Bash", {
          command: "cat agents/animator/skills/emil-design-eng/SKILL.md",
        })
      )
    );
    expect(s.missing).toEqual([]);
  });

  it("a global copy of a skill does not count, nor a grep for reducedMotion", () => {
    const s = reviewState(
      transcript(
        EDIT(),
        call("Read", {
          file_path: "/u/.claude/skills/review-animations/SKILL.md",
        }),
        call("Grep", { pattern: 'reducedMotion: "reduce"' })
      )
    );
    expect(s.missing).toContain("review-animations");
    expect(s.missing).toContain("reduced-motion");
  });

  it("a shell write arms it only when it changes motion", () => {
    const armed = (command) =>
      reviewState(transcript(call("Bash", { command }))).armed;
    expect(
      armed("sed -i '' 's/duration-150/duration-200/' src/index.css")
    ).toBe(true);
    expect(armed("sed -i '' 's/a/b/' src/index.css")).toBe(false);
  });

  it("an edit near motion, not changing it, arms nothing", () => {
    const near = call("Edit", {
      file_path: "/r/src/pages/x.tsx",
      old_string: '<Label htmlFor="a" className="transition-colors">',
      new_string: '<Label className="transition-colors">',
    });
    const changed = call("Edit", {
      file_path: "/r/src/pages/x.tsx",
      old_string: 'className="transition-colors duration-150"',
      new_string: 'className="transition-colors duration-200"',
    });
    expect(reviewState(transcript(near)).armed).toBe(false);
    expect(reviewState(transcript(changed)).armed).toBe(true);
  });
});

describe("verdict", () => {
  it("holds any session's motion edit, with no animator index read", () => {
    expect(stop(transcript(EDIT()))).toMatch(/animator review gate/);
    expect(
      stop(transcript(EDIT()), { agent_type: "front-end-developer" })
    ).toMatch(/animator review gate/);
  });

  it("the animator editing something with no motion is not held", () => {
    const label = call("Edit", {
      file_path: "/r/src/pages/x.tsx",
      old_string: '<Label htmlFor="a">',
      new_string: "<Label>",
    });
    expect(stop(transcript(ANIMATOR_INDEX(), label))).toBeNull();
  });

  it("blocks the main session working as the animator from stopping", () => {
    const why = stop(transcript(ANIMATOR_INDEX(), EDIT()));
    expect(why).toMatch(/animator review gate/);
    expect(why).toMatch(/review-animations\/SKILL\.md/);
    expect(why).toMatch(/reducedMotion/);
    expect(why).toMatch(/emil-design-eng/);
  });

  it("blocks a spawned animator by its type, with no index read", () => {
    expect(
      verdict(
        {
          hook_event_name: "SubagentStop",
          agent_type: "animator",
          agent_transcript_path: "/a.jsonl",
          last_assistant_message: PROOF,
        },
        { readTranscript: () => transcript(EDIT()) }
      )
    ).toMatch(/animator review gate/);
  });

  it("all four steps but no proof still blocks, naming the proof", () => {
    const why = stop(transcript(ANIMATOR_INDEX(), EDIT(), REVIEWS()));
    expect(why).toMatch(/Approve or Block/);
    expect(why).not.toMatch(/transitions-polish\/SKILL/);
  });

  it("passes with the steps and the proof in the final message", () => {
    expect(
      stop(transcript(ANIMATOR_INDEX(), EDIT(), REVIEWS()), {
        last_assistant_message: PROOF,
      })
    ).toBeNull();
  });

  it("proof given earlier, after the last edit, holds for later turns", () => {
    expect(
      stop(transcript(ANIMATOR_INDEX(), EDIT(), REVIEWS(), said(PROOF)))
    ).toBeNull();
  });

  it("does not let a second stop through", () => {
    expect(
      stop(transcript(ANIMATOR_INDEX(), EDIT()), { stop_hook_active: true })
    ).toMatch(/animator review gate/);
  });

  it("blocks a report through SendMessage or room_post, passes other tools", () => {
    const report = (tool_name, tool_input) =>
      verdict(
        {
          hook_event_name: "PreToolUse",
          transcript_path: "/t.jsonl",
          tool_name,
          tool_input,
        },
        { readTranscript: () => transcript(ANIMATOR_INDEX(), EDIT()) }
      );
    expect(report("SendMessage", { message: "done" })).toMatch(/reporting/);
    expect(report("mcp__room__room_post", { text: "done" })).toMatch(
      /reporting/
    );
    expect(report("Read", { file_path: "/r/x" })).toBeNull();
  });

  it("an unreadable transcript passes", () => {
    expect(
      verdict(
        { hook_event_name: "Stop", transcript_path: "/t.jsonl" },
        {
          readTranscript: () => {
            throw new Error("gone");
          },
        }
      )
    ).toBeNull();
  });
});

describe("asking the owner, and handing the review to a subagent", () => {
  const ARMED = () => transcript(ANIMATOR_INDEX(), EDIT());
  const HANDOFF = (input = {}) =>
    call("Agent", {
      subagent_type: "animator",
      prompt: "Run steps 5 and 6 on the setup route motion",
      ...input,
    });
  /** A transcript whose entries carry timestamps, one second apart. */
  const timed = (start, ...groups) =>
    groups
      .flat()
      .map((line, i) =>
        JSON.stringify({
          ...JSON.parse(line),
          timestamp: new Date(start + i * 1000).toISOString(),
        })
      )
      .join("\n");
  const prompt = (text) => [
    JSON.stringify({ type: "user", message: { content: text } }),
  ];
  const subStop = (own, parent, extra = {}) =>
    verdict(
      {
        hook_event_name: "SubagentStop",
        agent_type: "animator",
        transcript_path: "/main.jsonl",
        agent_transcript_path: "/sub.jsonl",
        last_assistant_message: "",
        ...extra,
      },
      { readTranscript: (p) => (p === "/sub.jsonl" ? own : parent) }
    );

  it("a stop starting BLOCKED passes, and the next stop is still held", () => {
    expect(
      stop(ARMED(), { last_assistant_message: "BLOCKED (high): which curve?" })
    ).toBeNull();
    expect(
      stop(ARMED(), { last_assistant_message: "**BLOCKED**: which curve?" })
    ).toBeNull();
    expect(stop(ARMED(), { last_assistant_message: "Done." })).toMatch(
      /animator review gate/
    );
  });

  it("a room post with needs_human passes; a plain one does not", () => {
    const post = (tool_input) =>
      verdict(
        {
          hook_event_name: "PreToolUse",
          transcript_path: "/t.jsonl",
          tool_name: "mcp__room__room_post",
          tool_input,
        },
        { readTranscript: () => ARMED() }
      );
    expect(
      post({ text: "For you: which curve?", needs_human: true })
    ).toBeNull();
    expect(post({ text: "Built it." })).toMatch(/reporting/);
  });

  it("handing the review to an animator subagent frees the session", () => {
    expect(stop(transcript(ARMED(), HANDOFF()))).toBeNull();
    expect(stop(transcript(ARMED(), HANDOFF({ model: "opus" })))).toBeNull();
  });

  it("a hand-off off Opus, to another agent, or before the last edit does not count", () => {
    expect(stop(transcript(ARMED(), HANDOFF({ model: "sonnet" })))).toMatch(
      /animator review gate/
    );
    expect(
      stop(transcript(ARMED(), HANDOFF({ subagent_type: "general-purpose" })))
    ).toMatch(/animator review gate/);
    expect(stop(transcript(ARMED(), HANDOFF(), EDIT()))).toMatch(
      /animator review gate/
    );
  });

  const START = Date.parse("2026-10-09T20:00:00Z");
  const PARENT = timed(START, ANIMATOR_INDEX(), EDIT(), HANDOFF());

  it("the review subagent, with no edit of its own, must do the four steps", () => {
    const own = timed(
      START + 60_000,
      prompt("Run steps 5 and 6 on the setup route motion"),
      READ("review-animations")
    );
    const why = subStop(own, PARENT, { last_assistant_message: PROOF });
    expect(why).toMatch(/transitions-polish\/SKILL\.md/);
    expect(why).not.toMatch(/review-animations\/SKILL\.md/);
  });

  it("the review subagent passes with the steps and the proof", () => {
    const own = timed(
      START + 60_000,
      prompt("Run steps 5 and 6 on the setup route motion"),
      REVIEWS().split("\n")
    );
    expect(subStop(own, PARENT, { last_assistant_message: PROOF })).toBeNull();
    expect(subStop(own, PARENT)).toMatch(/Approve or Block/);
  });

  it("an unrelated animator-typed agent with no edits passes", () => {
    const own = timed(START + 60_000, prompt("Suggest the next prompt"));
    expect(subStop(own, PARENT)).toBeNull();
  });

  it("a subagent that started before the parent's last edit is not the review", () => {
    const own = timed(
      START - 60_000,
      prompt("Run steps 5 and 6 on the setup route motion")
    );
    expect(subStop(own, PARENT)).toBeNull();
  });
});
