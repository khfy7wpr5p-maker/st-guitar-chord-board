import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__CHORD_BOARD_AUDIO_CALLS__ = [];
    window.ST_GUITAR_AUDIO = {
      capabilities: { offlineReady: true },
      playChord(payload) {
        window.__CHORD_BOARD_AUDIO_CALLS__.push(payload);
        return Promise.resolve({ ok: true });
      }
    };
  });
});

test("iPhone WebKit chord search, relation, variation and audio payload", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");

  const search = page.locator("#chord-search");
  await search.fill("Am");

  await expect(page.locator("#chord-symbol")).toHaveText("Am");
  await expect(page.locator("#chord-reading")).toHaveText("La minör");
  await expect(page.locator("#status")).toHaveText("Gitar sesi bağlı · çevrimdışı hazır");

  const suggestions = page.locator("#suggestions .suggestion");
  await expect(suggestions.first()).toContainText("Am");
  await expect(page.locator('#suggestions .suggestion[data-symbol="A"]')).toBeVisible();
  await expect(page.locator('#suggestions .suggestion[data-symbol="A7"]')).toBeVisible();
  await expect(page.locator('#suggestions .suggestion[data-symbol="A5"]')).toBeVisible();

  const relation = page.locator("#relation .relation-card");
  await expect(relation).toBeVisible();
  await expect(relation).toContainText("Göreli majör");
  await expect(relation).toContainText("C");
  await expect(relation).toContainText("Do majör");

  await expect(page.locator("#variant-count")).toContainText("1 /");
  await page.locator("#next").tap();
  await expect(page.locator("#variant-count")).toContainText("2 /");

  await page.locator("#chord-button").tap();
  const calls = await page.evaluate(() => window.__CHORD_BOARD_AUDIO_CALLS__);
  expect(calls).toHaveLength(1);
  expect(calls[0].symbol).toBe("Am");
  expect(calls[0].displaySymbol).toBe("Am");
  expect(calls[0].voicingIndex).toBe(1);
  expect(Array.isArray(calls[0].midis)).toBeTruthy();
  expect(calls[0].midis.length).toBeGreaterThanOrEqual(3);
  expect(calls[0].positions.length).toBe(calls[0].midis.length);
});

test("power chord flow exposes exactly two positions", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("A5");

  await expect(page.locator("#chord-symbol")).toHaveText("A5");
  await expect(page.locator("#chord-reading")).toHaveText("La beş");
  await expect(page.locator("#variant-count")).toHaveText("1 / 2");
  await expect(page.locator("#relation")).toBeHidden();

  await page.locator("#next").tap();
  await expect(page.locator("#variant-count")).toHaveText("2 / 2");

  await page.locator("#chord-button").tap();
  const call = await page.evaluate(() => window.__CHORD_BOARD_AUDIO_CALLS__.at(-1));
  expect(call.symbol).toBe("A5");
  expect(call.displaySymbol).toBe("A5");
  expect(call.voicingIndex).toBe(1);
  expect(call.midis).toHaveLength(3);
  expect([...new Set(call.midis.map(midi => midi % 12))].sort((a,b)=>a-b)).toEqual([4,9]);
});

test("flat power chord spelling stays visible while audio identity remains canonical", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("Bb5");

  await expect(page.locator("#chord-symbol")).toHaveText("Bb5");
  await expect(page.locator("#chord-reading")).toHaveText("Si bemol beş");
  await expect(page.locator("#variant-count")).toHaveText("1 / 2");
  await expect(page.locator('#suggestions .suggestion[data-symbol="Bb"]')).toBeVisible();
  await expect(page.locator('#suggestions .suggestion[data-symbol="Bbm"]')).toBeVisible();
  await expect(page.locator('#suggestions .suggestion[data-symbol="Bb5"]')).toBeVisible();

  await page.locator("#chord-button").tap();
  const call = await page.evaluate(() => window.__CHORD_BOARD_AUDIO_CALLS__.at(-1));
  expect(call.symbol).toBe("A#5");
  expect(call.displaySymbol).toBe("Bb5");
  expect(call.midis).toHaveLength(3);
  expect([...new Set(call.midis.map(midi => midi % 12))].sort((a,b)=>a-b)).toEqual([5,10]);
});

test("relative relation navigation stays within the large-button flow", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("C");

  const relation = page.locator('#relation .relation-card[data-symbol="Am"]');
  await expect(relation).toBeVisible();
  await relation.tap();

  await expect(page.locator("#chord-symbol")).toHaveText("Am");
  await expect(page.locator("#chord-reading")).toHaveText("La minör");
  await expect(page.locator("#chord-search")).toHaveValue("Am");
});

test("mobile layout keeps the primary chord button inside the phone viewport width", async ({ page }) => {
  await page.goto("/");
  const result = await page.locator("#chord-button").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      viewport: window.innerWidth,
      minHeight: rect.height
    };
  });
  expect(result.left).toBeGreaterThanOrEqual(0);
  expect(result.right).toBeLessThanOrEqual(result.viewport + 0.5);
  expect(result.minHeight).toBeGreaterThan(300);
});
