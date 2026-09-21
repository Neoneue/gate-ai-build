import { expect, type Page, test } from "@playwright/test";

/* Browser smoke tier. Eight flows, one file. Every flow collects page errors
 * and console `error` entries and asserts the collection is empty, plus that
 * `<main>` rendered non-empty text. Nothing is ignored: a console error in a
 * design mockup is a real defect. */

type ErrorSink = { errors: string[] };

function watchConsole(page: Page): ErrorSink {
  const sink: ErrorSink = { errors: [] };
  page.on("pageerror", (err) => {
    sink.errors.push(`pageerror: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      sink.errors.push(`console.error: ${msg.text()}`);
    }
  });
  return sink;
}

async function expectMainRendered(page: Page) {
  const main = page.locator("main");
  await expect(main).toBeVisible();
  await expect
    .poll(async () => (await main.innerText()).trim().length)
    .toBeGreaterThan(0);
}

function expectNoErrors(sink: ErrorSink) {
  expect(sink.errors, sink.errors.join("\n")).toEqual([]);
}

const SIDEBAR = 'aside[aria-label="Primary navigation"] nav';

const TIER_ROOTS = [
  "/overview",
  "/overview-default",
  "/overview-enterprise",
] as const;

test.describe("smoke", () => {
  test("a. root redirects to /overview and the sidebar renders", async ({
    page,
  }) => {
    const sink = watchConsole(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/overview$/);
    await expect(page.locator(SIDEBAR)).toBeVisible();
    await expectMainRendered(page);
    expectNoErrors(sink);
  });

  test("b. sidebar walk across every tier root", async ({ page }) => {
    test.slow();
    const sink = watchConsole(page);
    for (const root of TIER_ROOTS) {
      await page.goto(root);
      await expectMainRendered(page);
      const hrefs = await page
        .locator(`${SIDEBAR} a[href]`)
        .evaluateAll((nodes) =>
          nodes
            .map((n) => (n as HTMLAnchorElement).getAttribute("href") ?? "")
            .filter((h) => h.startsWith("/"))
        );
      expect(hrefs.length).toBeGreaterThan(5);
      for (const href of [...new Set(hrefs)]) {
        const link = page.locator(`${SIDEBAR} a[href="${href}"]`).first();
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${href}(\\?|$)`));
        await expectMainRendered(page);
      }
    }
    expectNoErrors(sink);
  });

  test("c. enterprise role switch hides Billing and Team", async ({ page }) => {
    const sink = watchConsole(page);
    await page.goto("/overview-enterprise");
    await expectMainRendered(page);

    const billingLink = page.locator(
      `${SIDEBAR} a[href="/billing-enterprise"]`
    );
    const teamsLink = page.locator(`${SIDEBAR} a[href="/teams-enterprise"]`);
    const membersLink = page.locator(
      `${SIDEBAR} a[href="/members-enterprise"]`
    );
    expect(await billingLink.count()).toBeGreaterThan(0);
    expect(await membersLink.count()).toBeGreaterThan(0);

    const pickRole = async (name: string) => {
      await page.locator('[aria-label="Viewing as"]').click();
      await page
        .locator('[role="listbox"]:visible [role="option"]', { hasText: name })
        .first()
        .click();
    };

    // Manager: `team` (Members) and `billing` drop out of the rail.
    await pickRole("Manager");
    await expect(billingLink).toHaveCount(0);
    await expect(membersLink).toHaveCount(0);
    expect(await teamsLink.count()).toBeGreaterThan(0);

    // Member: Teams goes too.
    await pickRole("Member");
    await expect(billingLink).toHaveCount(0);
    await expect(teamsLink).toHaveCount(0);

    // Hidden by URL as well. The view role is in-memory (teams-store), so a
    // full reload would reset it to admin: sit ON Billing as admin, then drop
    // to Member and let the chrome guard bounce us to the tier overview.
    await page.goto("/billing-enterprise");
    await expectMainRendered(page);
    await pickRole("Member");
    await expect(page).toHaveURL(/\/overview-enterprise$/);
    await expectMainRendered(page);
    expectNoErrors(sink);
  });

  test("d. messages filter then drill in", async ({ page }) => {
    const sink = watchConsole(page);
    await page.goto("/messages");
    await expectMainRendered(page);

    const rows = page.locator("main table tbody tr");
    const before = await rows.count();
    expect(before).toBeGreaterThan(0);

    await page.getByRole("button", { name: /^Filters/ }).click();
    await page.locator('[aria-label="Key"]').click();
    await page
      .locator('[role="listbox"]:visible [role="option"]')
      .nth(1)
      .click();
    await page.getByRole("button", { name: "Apply" }).click();
    await expect.poll(async () => rows.count()).not.toBe(before);

    await page.goto("/messages");
    const drillIn = page.locator('a[href*="/messages-findings/"]').first();
    const href = await drillIn.getAttribute("href");
    const requestId = (href ?? "").split("/messages-findings/")[1] ?? "";
    expect(requestId.length).toBeGreaterThan(0);
    await drillIn.click();
    await expect(page).toHaveURL(/\/messages-findings\//);
    await expectMainRendered(page);
    await expect(page.locator("main")).toContainText(requestId);
    expectNoErrors(sink);
  });

  test("e. teams detail roster search", async ({ page }) => {
    const sink = watchConsole(page);
    await page.goto("/teams-enterprise");
    await expectMainRendered(page);

    await page.locator('main a[href^="/teams-enterprise/"]').first().click();
    await expect(page).toHaveURL(/\/teams-enterprise\/.+/);
    await expectMainRendered(page);

    await page.getByRole("tab", { name: /Members/ }).click();
    const search = page.getByRole("searchbox", { name: "Search members" });
    await expect(search).toBeVisible();
    const rosterRows = page
      .locator("table")
      .filter({ has: page.getByRole("columnheader", { name: "Joined" }) })
      .first()
      .locator("tbody tr");
    const before = await rosterRows.count();
    expect(before).toBeGreaterThan(0);

    await search.fill("zzzqqqnotamember");
    await expect.poll(async () => rosterRows.count()).toBeLessThan(before);

    await search.fill("");
    await expect.poll(async () => rosterRows.count()).toBe(before);
    expectNoErrors(sink);
  });

  test("f. billing ?state= previews", async ({ page }) => {
    const sink = watchConsole(page);
    const previews: Array<[string, string]> = [
      ["/billing", "revoked"],
      ["/billing-enterprise", "active"],
      ["/billing-enterprise", "granted"],
      ["/billing-enterprise", "unprovisioned"],
      ["/billing-enterprise", "past-due"],
    ];
    for (const [path, state] of previews) {
      await page.goto(`${path}?state=${state}`);
      await expectMainRendered(page);
      expect(new URL(page.url()).searchParams.get("state")).toBe(state);
    }
    expectNoErrors(sink);
  });

  test("g. theme toggle persists across reload", async ({ page }) => {
    const sink = watchConsole(page);
    await page.goto("/overview");
    await expectMainRendered(page);

    const html = page.locator("html");
    const wasDark = await html.evaluate((el) => el.classList.contains("dark"));
    await page
      .getByRole("button", { name: /Switch to (dark|light) theme/ })
      .click();
    await expect
      .poll(async () => html.evaluate((el) => el.classList.contains("dark")))
      .toBe(!wasDark);

    const stored = await page.evaluate(() => localStorage.getItem("theme"));
    expect(stored).toBe(wasDark ? "light" : "dark");

    await page.reload();
    await expectMainRendered(page);
    await expect
      .poll(async () => html.evaluate((el) => el.classList.contains("dark")))
      .toBe(!wasDark);
    expectNoErrors(sink);
  });

  test("h. mobile nav drawer opens and closes on resize", async ({ page }) => {
    const sink = watchConsole(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/overview");
    await expectMainRendered(page);

    await page.locator('[aria-label="Open navigation menu"]').click();
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(drawer).toHaveCount(0);
    await expectMainRendered(page);
    expectNoErrors(sink);
  });
});
