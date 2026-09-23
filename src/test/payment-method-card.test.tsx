// @vitest-environment happy-dom
/**
 * Payment method card: the action belongs to the card-on-file row.
 *
 * The rule under test is placement, not copy. The button acts on THIS card
 * on file, so it sits inside the `bg-card-muted` row beside the brand badge
 * and the digits, and the card has no CardFooter at all. A second saved card
 * would take its own row action; one footer button could not say which card
 * it meant.
 *
 * Both states ship the same shape: `Update card` (default) and `Add card`
 * (`empty`, which is the Free page's pattern verbatim). The Free page owns a
 * local copy of the empty card, so its source is asserted for parity here
 * rather than mounted: the two must never diverge again.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { PaymentMethodCard } from "@/pages/billing/PaymentMethodCard";

/** The card-on-file row: the inset block inside CardContent. */
const ROW = '[data-slot="card-content"] > .bg-card-muted';

afterEach(() => {
  document.body.innerHTML = "";
});

test("default state: Update card renders inside the row, not a footer", () => {
  const { container } = render(<PaymentMethodCard />);
  const row = container.querySelector(ROW);
  const button = screen.getByRole("button", { name: /update card/i });

  expect(row).not.toBeNull();
  expect(row?.contains(button)).toBe(true);
  // Same row as the brand badge and the digits, so all three read as one line.
  expect(row?.textContent).toContain("VISA");
  expect(row?.textContent).toContain("4242");
  expect(container.querySelector('[data-slot="card-footer"]')).toBeNull();
});

test("empty state: Add card renders inside the row, not a footer", () => {
  const { container } = render(<PaymentMethodCard empty />);
  const row = container.querySelector(ROW);
  const button = screen.getByRole("button", { name: /add card/i });

  expect(row).not.toBeNull();
  expect(row?.contains(button)).toBe(true);
  expect(row?.textContent).toContain("CARD");
  expect(row?.textContent).toContain("No payment method on file");
  expect(container.querySelector('[data-slot="card-footer"]')).toBeNull();
});

test("the row pushes the action right and survives a narrow container", () => {
  const { container } = render(<PaymentMethodCard />);
  const row = container.querySelector(ROW);
  const button = screen.getByRole("button", { name: /update card/i });

  // ml-auto is what closes the row on the right; flex-wrap is what keeps a
  // narrow container from squeezing the text and the button together.
  expect(button.className).toContain("ml-auto");
  expect(button.className).toContain("shrink-0");
  expect(row?.className).toContain("flex-wrap");
});

test("Free page keeps the same shape: action in the row, no footer", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/pages/BillingFree.tsx"),
    "utf8"
  );
  const card = source.slice(source.indexOf("function PaymentMethodCard()"));
  const body = card.slice(0, card.indexOf("\n}"));

  expect(body).toContain("No payment method on file");
  expect(body).toContain("Add card");
  expect(body).toContain("ml-auto");
  expect(body).not.toContain("<CardFooter");
});
