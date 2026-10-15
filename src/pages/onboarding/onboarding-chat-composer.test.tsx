// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PAID_MODEL_REFUSAL } from "@/data/onboarding-chat-script";
import { buildChatCatalog } from "@/pages/chat/chat-data";
import { CHAT_COPY } from "@/pages/chat/copy";
import type { ChatModel } from "@/pages/chat/types";
import { OnboardingChatComposer } from "./onboarding-chat-composer";

/* The onboarding composer's two modes (owner 2026-10-13): desktop is the real
 * Gate Chat's toolbar (attach, a picker per lane, add a model to compare);
 * the phone demo stays guided (one lane and attach, no compare; attach is
 * back since owner 2026-10-15). */

afterEach(cleanup);

const catalog = [...buildChatCatalog(new Set()).values()].filter(
  (model) => model.available
);
const free: ChatModel = { ...catalog[0], isFree: true, price: "Free" };
const second: ChatModel = { ...catalog[1], isFree: true, price: "Free" };

const renderComposer = (
  props: Partial<Parameters<typeof OnboardingChatComposer>[0]>
) =>
  render(
    <MemoryRouter>
      <OnboardingChatComposer
        catalog={[free, second, ...catalog.slice(2)]}
        onSend={() => true}
        {...props}
      />
    </MemoryRouter>
  );

describe("OnboardingChatComposer", () => {
  it("desktop shows attach, the model picker and add a model", () => {
    renderComposer({
      models: [free],
      onAddComparisonModel: vi.fn(),
      onSelectLaneModel: vi.fn(),
    });
    expect(
      screen.getByRole("button", { name: CHAT_COPY.attachFile })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: new RegExp(free.label) })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: CHAT_COPY.addComparisonModel })
    ).toBeTruthy();
  });

  it("desktop compares two lanes, with a remove key and no third lane", () => {
    renderComposer({
      models: [free, second],
      onAddComparisonModel: vi.fn(),
      onRemoveComparisonModel: vi.fn(),
      onSelectLaneModel: vi.fn(),
    });
    expect(
      screen.getByRole("button", { name: CHAT_COPY.removeComparisonModel })
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: CHAT_COPY.addComparisonModel })
    ).toBeNull();
  });

  it("a refused send keeps typing on and disables send", () => {
    const onSend = vi.fn(() => true);
    renderComposer({
      models: [free, catalog[2]],
      onSelectLaneModel: vi.fn(),
      onSend,
      refusedPlaceholder: PAID_MODEL_REFUSAL,
    });
    const field = screen.getByPlaceholderText(PAID_MODEL_REFUSAL);
    fireEvent.change(field, { target: { value: "hello" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(onSend).not.toHaveBeenCalled();
    expect(
      (
        screen.getByRole("button", {
          name: CHAT_COPY.sendPrompt,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it("the phone demo keeps one lane and attach, no compare", () => {
    renderComposer({ models: [free], onSelectModel: vi.fn() });
    expect(
      screen.getByRole("button", { name: CHAT_COPY.attachFile })
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: CHAT_COPY.addComparisonModel })
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: new RegExp(free.label) })
    ).toBeTruthy();
  });
});
