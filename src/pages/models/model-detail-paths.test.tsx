// @vitest-environment happy-dom
/**
 * Two detail pages per model, chosen by the path that opened it.
 *
 * Product facts asserted:
 * - a card in "Free models from Gate" opens the FREE page: the constellation
 *   id with its copy button, a "Pay as you go version" link carrying the
 *   catalog id, "Free" in the Input / Output tiles, and the constellation id
 *   in the Example request snippet;
 * - that link switches to the PAID page of the same model: catalog id, list
 *   prices, no pay as you go line, a "Free version" link back, snippet on
 *   the catalog id;
 * - a catalog row opens the paid page directly; when the model has a free
 *   companion, that page carries a "Free version" link with the
 *   constellation id, and the link switches to the free page;
 * - a paid page of a model without a free companion has no such line;
 * - the same holds on every Models surface (Pro, Default, Free, Enterprise).
 */

import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { FREE_MODELS, findFreeModel } from "@/data/free-models";
import { MODELS } from "@/data/models";
import { renderRoute } from "@/test/render";

const QWEN = FREE_MODELS[0];
// Any catalog model with no free companion.
const NO_COMPANION = MODELS.find((m) => !findFreeModel(m.id));
const SURFACES = [
  "/models",
  "/models-default",
  "/models-free",
  "/models-enterprise",
];

afterEach(cleanup);

/** The KPI tile value under an Eyebrow label. */
function kpi(label: string): string {
  const eyebrow = screen
    .getAllByText(label)
    .find((el) => el.closest("[class*='p-4']")?.textContent?.startsWith(label));
  return eyebrow?.parentElement?.textContent?.slice(label.length) ?? "";
}

function codeSample(): string {
  return screen.getByRole("region", { name: "Code sample" }).textContent ?? "";
}

async function openCatalogRow(
  user: ReturnType<typeof userEvent.setup>,
  id: string,
  name: string
) {
  await user.type(
    await screen.findByRole("searchbox", { name: "Search models" }),
    id
  );
  const row = await waitFor(() => {
    const el = document.querySelector<HTMLElement>(`[data-model-row="${id}"]`);
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  await user.click(row);
  return screen.findByRole("heading", { level: 2, name });
}

async function openFreeCard(user: ReturnType<typeof userEvent.setup>) {
  const card = await waitFor(() => {
    const el = document.querySelector<HTMLElement>(
      `[data-free-model="${QWEN.id}"]`
    );
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  await user.click(card);
  await screen.findByRole("heading", { level: 2, name: "Qwen3.8 Flash" });
}

describe.each(SURFACES)("model detail paths on %s", (path) => {
  it("free card opens the free page; its link opens the paid page", async () => {
    const user = userEvent.setup();
    await renderRoute(path);
    await openFreeCard(user);

    // Free page.
    expect(screen.getByText(QWEN.constellationId)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: `Copy ${QWEN.constellationId}` })
    ).toBeTruthy();
    expect(screen.getByText(/Pay as you go version:/)).toBeTruthy();
    expect(kpi("Input")).toBe("Free");
    expect(kpi("Output")).toBe("Free");
    expect(codeSample()).toContain(QWEN.constellationId);

    // Switch to paid.
    await user.click(
      screen.getByRole("button", {
        name: `Open pay as you go version, ${QWEN.id}`,
      })
    );
    await waitFor(() =>
      expect(screen.queryByText(/Pay as you go version:/)).toBeNull()
    );
    expect(
      screen.getByRole("button", { name: `Copy ${QWEN.id}` })
    ).toBeTruthy();
    // The constellation id survives only as the "Free version" link, never
    // as the handle.
    expect(
      screen.queryByRole("button", { name: `Copy ${QWEN.constellationId}` })
    ).toBeNull();
    expect(screen.getByText(/Free version:/)).toBeTruthy();
    expect(kpi("Input")).toMatch(/^\$/);
    expect(kpi("Output")).toMatch(/^\$/);
    expect(codeSample()).toContain(QWEN.id);
    expect(codeSample()).not.toContain(QWEN.constellationId);
  });

  it("catalog row opens the paid page; its Free version link opens the free page", async () => {
    const user = userEvent.setup();
    await renderRoute(path);
    const heading = await openCatalogRow(user, QWEN.id, "Qwen3.8 Flash");
    const hero = heading.closest("div")?.parentElement as HTMLElement;
    expect(within(hero).getByText(QWEN.id)).toBeTruthy();
    expect(screen.queryByText(/Pay as you go version:/)).toBeNull();
    expect(screen.getByText(/Free version:/)).toBeTruthy();
    expect(kpi("Input")).toMatch(/^\$/);
    expect(kpi("Output")).toMatch(/^\$/);

    // Switch to free.
    await user.click(
      screen.getByRole("button", {
        name: `Open free version, ${QWEN.constellationId}`,
      })
    );
    await waitFor(() => expect(screen.queryByText(/Free version:/)).toBeNull());
    expect(
      screen.getByRole("button", { name: `Copy ${QWEN.constellationId}` })
    ).toBeTruthy();
    expect(screen.getByText(/Pay as you go version:/)).toBeTruthy();
    expect(kpi("Input")).toBe("Free");
    expect(kpi("Output")).toBe("Free");
    expect(codeSample()).toContain(QWEN.constellationId);
  });

  it("paid page of a model without a free companion has no Free version line", async () => {
    expect(NO_COMPANION).toBeDefined();
    const model = NO_COMPANION as NonNullable<typeof NO_COMPANION>;
    const user = userEvent.setup();
    await renderRoute(path);
    await openCatalogRow(user, model.id, model.name);
    expect(
      screen.getByRole("button", { name: `Copy ${model.id}` })
    ).toBeTruthy();
    expect(screen.queryByText(/Free version:/)).toBeNull();
    expect(screen.queryByText(/Pay as you go version:/)).toBeNull();
  });
});
