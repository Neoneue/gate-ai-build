import { expect, test } from "vitest";
import { budgetBand, budgetStatus } from "@/pages/teams/budget-band";

test("exactly at the cap is over, below the warn line is under", () => {
  expect(budgetBand(500, 500, 80)).toBe("over");
  expect(budgetBand(499.99, 500, 80)).toBe("warned");
  expect(budgetBand(400, 500, 80)).toBe("warned");
  expect(budgetBand(399.99, 500, 80)).toBe("under");
  expect(budgetBand(0, 0, 80)).toBe("under");
});

test("status word follows band and enforcement", () => {
  expect(budgetStatus(100, 500, 80, "hard")).toBe("ok");
  expect(budgetStatus(400, 500, 80, "hard")).toBe("warning");
  expect(budgetStatus(400, 500, 80, "soft")).toBe("warning");
  expect(budgetStatus(500, 500, 80, "hard")).toBe("blocking");
  expect(budgetStatus(500, 500, 80, "soft")).toBe("exceeded");
  expect(budgetStatus(615, 500, 80, "soft")).toBe("exceeded");
});
