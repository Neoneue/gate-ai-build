// @vitest-environment happy-dom
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHAT_SEED_CONVERSATIONS } from "@/data/gate-chat";
import { renderRoute, resetViewRole } from "@/test/render";
import { chatStore } from "./chat-store";
import { CHAT_COPY } from "./copy";

/* The Gate Chat surface, mounted through the real route tree. UI only: these
 * assert the states the production site draws, that every tier and role
 * reaches the page, and that nothing reaches for the network. */

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  cleanup();
  resetViewRole();
  chatStore.reset();
  vi.unstubAllGlobals();
});

const COMPARISON = CHAT_SEED_CONVERSATIONS[0];
const REDACTED = CHAT_SEED_CONVERSATIONS[1];

describe("Gate Chat routes", () => {
  it("opens a new conversation on the landing, with the seeded history", async () => {
    await renderRoute("/chat");
    expect(
      await screen.findByRole("heading", { name: CHAT_COPY.landingTitle })
    ).toBeTruthy();
    expect(screen.getByPlaceholderText("Message Gate Chat")).toBeTruthy();
    const rail = screen.getAllByRole("complementary", {
      name: "Gate Chat navigation",
    })[0];
    for (const seed of CHAT_SEED_CONVERSATIONS) {
      expect(
        within(rail).getByRole("button", { name: seed.title })
      ).toBeTruthy();
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders a seeded comparison thread with both lanes and every usage state", async () => {
    const { container } = await renderRoute(`/chat/${COMPARISON.id}`);
    expect(
      await screen.findByRole("heading", { level: 1, name: COMPARISON.title })
    ).toBeTruthy();
    expect(container.querySelectorAll("[data-slot=chat-lane]")).toHaveLength(4);
    // The DeepSeek lane is still settling.
    expect(screen.getAllByText(CHAT_COPY.costPending).length).toBeGreaterThan(
      0
    );
    // The image went to the vision lane and was withheld from the other.
    expect(screen.getAllByText(`${CHAT_COPY.attachmentNoVision}:`).length).toBe(
      1
    );
    expect(
      screen.getAllByText(`${CHAT_COPY.attachmentSentAsImage}:`).length
    ).toBe(1);
    const viewLinks = screen.getAllByRole("link", {
      name: CHAT_COPY.viewMessage,
    });
    expect(viewLinks[0].getAttribute("href")).toMatch(/^\/messages-findings\//);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("names the verdict on a redacted lane and offers Pro on the Free twin", async () => {
    const { container } = await renderRoute(`/chat-free/${REDACTED.id}`);
    expect(await screen.findByText("Redacted: personal data")).toBeTruthy();
    const upgrade = [...container.querySelectorAll("a")].filter(
      (anchor) => anchor.textContent === CHAT_COPY.upgrade
    );
    // Header (xl+) and the rail's credits block (below xl).
    expect(upgrade).toHaveLength(2);
    for (const link of upgrade) {
      expect(link.getAttribute("href")).toBe("/billing-free");
    }
  });

  it("offers no upgrade on Pro or Enterprise", async () => {
    for (const path of ["/chat", "/chat-enterprise"]) {
      await renderRoute(path);
      await screen.findByRole("heading", { name: CHAT_COPY.landingTitle });
      expect(screen.queryAllByText(CHAT_COPY.upgrade)).toHaveLength(0);
      cleanup();
    }
  });

  it("says an unknown conversation could not be loaded", async () => {
    await renderRoute("/chat/chat_does_not_exist");
    expect(
      await screen.findByText("This conversation couldn’t be loaded.")
    ).toBeTruthy();
  });
});

describe("no chatting", () => {
  it("keeps the draft and adds no turn when sent", async () => {
    const { container } = await renderRoute("/chat");
    const field = (await screen.findByPlaceholderText(
      "Message Gate Chat"
    )) as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: "Hello Gate" } });
    fireEvent.keyDown(field, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: CHAT_COPY.sendPrompt }));
    expect(field.value).toBe("Hello Gate");
    expect(container.querySelectorAll("[data-slot=chat-lane]")).toHaveLength(0);
    expect(
      screen.getByRole("heading", { name: CHAT_COPY.landingTitle })
    ).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("seeds the draft from a starter prompt without sending it", async () => {
    await renderRoute("/chat");
    const starter = await screen.findByRole("button", {
      name: "Compare two models on a technical decision",
    });
    fireEvent.click(starter);
    const field = screen.getByPlaceholderText(
      "Message Gate Chat"
    ) as HTMLTextAreaElement;
    expect(field.value).toBe("Compare two models on a technical decision");
  });
});

describe("top bar", () => {
  it("collapses and expands the chat rail from the top-bar toggle", async () => {
    const { container } = await renderRoute(`/chat/${COMPARISON.id}`);
    const toggle = await screen.findByRole("button", {
      name: "Collapse sidebar",
    });
    const rail = () =>
      container.querySelector(
        "aside[data-slot=chat-sidebar].hidden"
      ) as HTMLElement;
    expect(rail().className).toContain("w-72");
    fireEvent.click(toggle);
    expect(rail().className).toContain("w-16");
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(rail().className).toContain("w-72");
  });

  it("draws the logo mark, never the full lockup", async () => {
    const { container } = await renderRoute("/chat");
    await screen.findByRole("heading", { name: CHAT_COPY.landingTitle });
    const header = container.querySelector("header") as HTMLElement;
    const images = [...header.querySelectorAll("img")].map((img) =>
      img.getAttribute("src")
    );
    expect(images).toEqual(["/gate-ai-logo-mark.png"]);
    expect(container.innerHTML).not.toContain("/gate-ai-logo.png");
    expect(container.innerHTML).not.toContain("/gate-ai-logo-dark.png");
  });
});

describe("every tier and role reaches Gate Chat", () => {
  const cases = [
    ["/chat", "admin"],
    ["/chat", "manager"],
    ["/chat", "member"],
    ["/chat-enterprise", "admin"],
    ["/chat-enterprise", "manager"],
    ["/chat-enterprise", "member"],
    ["/chat-free", undefined],
    ["/chat-default", undefined],
  ] as const;

  it.each(cases)("%s as %s renders the page", async (path, role) => {
    await renderRoute(path, role ? { role } : {});
    expect(
      await screen.findByRole("heading", { name: CHAT_COPY.landingTitle })
    ).toBeTruthy();
  });

  it.each([
    ["/overview", "/chat"],
    ["/overview-free", "/chat-free"],
    ["/overview-default", "/chat-default"],
    ["/overview-enterprise", "/chat-enterprise"],
  ])("the %s rail opens %s in a new tab", async (overview, chatPath) => {
    const { container } = await renderRoute(overview);
    await screen.findAllByText("Gate Chat");
    const anchors = container.querySelectorAll<HTMLAnchorElement>(
      `nav a[href="${chatPath}"]`
    );
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      expect(anchor.getAttribute("target")).toBe("_blank");
      expect(anchor.getAttribute("rel")).toBe("noreferrer");
    }
  });
});
