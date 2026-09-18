import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const OUTPUT = "test-results/ui-validation";

test.beforeAll(async () => {
  await mkdir(OUTPUT, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.ST_GUITAR_AUDIO = {
      capabilities: { offlineReady: true },
      playChord() { return Promise.resolve({ ok:true }); }
    };
  });
});

async function assertPhoneLayout(page) {
  const layout = await page.evaluate(() => {
    const app = document.querySelector("#app").getBoundingClientRect();
    const board = document.querySelector("#chord-button").getBoundingClientRect();
    const search = document.querySelector("#chord-search").getBoundingClientRect();
    const variants = document.querySelector(".variants").getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      appLeft: app.left,
      appRight: app.right,
      boardLeft: board.left,
      boardRight: board.right,
      boardHeight: board.height,
      searchLeft: search.left,
      searchRight: search.right,
      variantsLeft: variants.left,
      variantsRight: variants.right
    };
  });

  expect(layout.bodyScrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.appLeft).toBeGreaterThanOrEqual(0);
  expect(layout.appRight).toBeLessThanOrEqual(layout.viewportWidth + 0.5);
  expect(layout.boardLeft).toBeGreaterThanOrEqual(0);
  expect(layout.boardRight).toBeLessThanOrEqual(layout.viewportWidth + 0.5);
  expect(layout.boardHeight).toBeGreaterThan(300);
  expect(layout.searchLeft).toBeGreaterThanOrEqual(0);
  expect(layout.searchRight).toBeLessThanOrEqual(layout.viewportWidth + 0.5);
  expect(layout.variantsLeft).toBeGreaterThanOrEqual(0);
  expect(layout.variantsRight).toBeLessThanOrEqual(layout.viewportWidth + 0.5);
}

test("visual validation: default chord board on iPhone", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready","true");
  await expect(page.locator("#chord-symbol")).toHaveText("C");
  await expect(page.locator("#chord-reading")).toHaveText("Do majör");
  await expect(page.locator(".chord-diagram")).toBeVisible();
  await assertPhoneLayout(page);
  await page.screenshot({ path:`${OUTPUT}/iphone-default-c.png`, fullPage:true });
});

test("visual validation: Bb5 second position and restored state", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("Bb5");
  await page.locator("#next").tap();

  await expect(page.locator("#chord-symbol")).toHaveText("Bb5");
  await expect(page.locator("#chord-reading")).toHaveText("Si bemol beş");
  await expect(page.locator("#variant-count")).toHaveText("2 / 2");
  await expect(page.locator("#relation")).toBeHidden();
  await expect(page.locator(".chord-diagram")).toBeVisible();
  await assertPhoneLayout(page);

  await page.reload();
  await expect(page.locator("#chord-symbol")).toHaveText("Bb5");
  await expect(page.locator("#variant-count")).toHaveText("2 / 2");
  await assertPhoneLayout(page);

  await page.screenshot({ path:`${OUTPUT}/iphone-bb5-position-2-restored.png`, fullPage:true });
});
