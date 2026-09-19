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

test("visual validation: A second position starts at fret five with weighted strings", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("A");
  await page.locator("#next").tap();

  await expect(page.locator("#chord-symbol")).toHaveText("A");
  await expect(page.locator("#variant-count")).toHaveText("2 / 3");
  const diagram=page.locator(".chord-diagram");
  await expect(diagram).toHaveAttribute("data-base-fret","5");
  await expect(diagram).toHaveAttribute("aria-label","Gitar akor diyagramı, 5. perdeden");
  await expect(page.locator(".nut-line")).toHaveCount(0);

  const widths=await page.locator(".string-line").evaluateAll(lines =>
    lines.map(line=>Number(line.getAttribute("stroke-width")))
  );
  expect(widths).toHaveLength(6);
  expect(widths[0]).toBeGreaterThan(widths.at(-1));

  await assertPhoneLayout(page);
  await page.screenshot({ path:`${OUTPUT}/iphone-a-position-2-fret-5.png`, fullPage:true });
});

test("runtime fingering: open G shows bass-to-treble 3-2-4", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("G");

  await expect(page.locator("#variant-count")).toHaveText("1 / 3");
  await expect(page.locator('.finger-position[data-string="6"] .finger-number')).toHaveText("3");
  await expect(page.locator('.finger-position[data-string="5"] .finger-number')).toHaveText("2");
  await expect(page.locator('.finger-position[data-string="1"] .finger-number')).toHaveText("4");
});

test("runtime fingering: E third position renders index barre plus 2-3-4", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("E");
  await page.locator("#next").tap();
  await page.locator("#next").tap();

  await expect(page.locator("#variant-count")).toHaveText("3 / 3");
  await expect(page.locator(".chord-diagram")).toHaveAttribute("data-base-fret","7");
  await expect(page.locator('.barre-mark[data-finger="1"]')).toHaveCount(1);
  await expect(page.locator('.finger-position[data-string="4"] .finger-number')).toHaveText("2");
  await expect(page.locator('.finger-position[data-string="3"] .finger-number')).toHaveText("3");
  await expect(page.locator('.finger-position[data-string="2"] .finger-number')).toHaveText("4");
});

test("runtime fingering: D second position renders index barre plus 2-3-4", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("D");
  await page.locator("#next").tap();

  await expect(page.locator("#variant-count")).toHaveText("2 / 3");
  await expect(page.locator(".chord-diagram")).toHaveAttribute("data-base-fret","5");
  await expect(page.locator('.barre-mark[data-finger="1"]')).toHaveCount(1);
  await expect(page.locator('.finger-position[data-string="4"] .finger-number')).toHaveText("2");
  await expect(page.locator('.finger-position[data-string="3"] .finger-number')).toHaveText("3");
  await expect(page.locator('.finger-position[data-string="2"] .finger-number')).toHaveText("4");
});
