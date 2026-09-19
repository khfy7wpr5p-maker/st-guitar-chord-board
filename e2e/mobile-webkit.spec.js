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

  await expect(page.locator("#variant-count")).toHaveText("1 / 3");
  await page.locator("#next").tap();
  await expect(page.locator("#variant-count")).toHaveText("2 / 3");

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



async function dispatchSwipe(page, { fromX, toX, fromY = 240, toY = 240 }) {
  await page.locator("#chord-button").evaluate((element, gesture) => {
    const common = {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true
    };
    element.dispatchEvent(new PointerEvent("pointerdown", {
      ...common,
      clientX: gesture.fromX,
      clientY: gesture.fromY,
      buttons: 1
    }));
    element.dispatchEvent(new PointerEvent("pointerup", {
      ...common,
      clientX: gesture.toX,
      clientY: gesture.toY,
      buttons: 0
    }));
  }, { fromX, toX, fromY, toY });
}

test("horizontal swipe changes voicing without triggering chord audio", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("A5");
  await expect(page.locator("#variant-count")).toHaveText("1 / 2");

  await dispatchSwipe(page, { fromX: 310, toX: 120 });
  await page.locator("#chord-button").dispatchEvent("click");

  await expect(page.locator("#variant-count")).toHaveText("2 / 2");
  expect(await page.evaluate(() => window.__CHORD_BOARD_AUDIO_CALLS__.length)).toBe(0);

  await dispatchSwipe(page, { fromX: 120, toX: 310 });
  await page.locator("#chord-button").dispatchEvent("click");

  await expect(page.locator("#variant-count")).toHaveText("1 / 2");
  expect(await page.evaluate(() => window.__CHORD_BOARD_AUDIO_CALLS__.length)).toBe(0);
});

test("vertical gesture does not change voicing", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("A5");
  await expect(page.locator("#variant-count")).toHaveText("1 / 2");

  await dispatchSwipe(page, { fromX: 220, toX: 228, fromY: 140, toY: 330 });

  await expect(page.locator("#variant-count")).toHaveText("1 / 2");
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


test("last selected chord and voicing restore after reload", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("Bb5");
  await page.locator("#next").tap();

  await expect(page.locator("#chord-symbol")).toHaveText("Bb5");
  await expect(page.locator("#variant-count")).toHaveText("2 / 2");

  await page.reload();

  await expect(page.locator("#chord-search")).toHaveValue("Bb5");
  await expect(page.locator("#chord-symbol")).toHaveText("Bb5");
  await expect(page.locator("#chord-reading")).toHaveText("Si bemol beş");
  await expect(page.locator("#variant-count")).toHaveText("2 / 2");
});

test("invalid persisted selection falls back safely to C first voicing", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("st-guitar-chord-board:last-selection:v1", JSON.stringify({
      symbol: "NotAChord",
      voicingIndex: 999
    }));
  });

  await page.reload();

  await expect(page.locator("#chord-search")).toHaveValue("C");
  await expect(page.locator("#chord-symbol")).toHaveText("C");
  await expect(page.locator("#chord-reading")).toHaveText("Do majör");
  await expect(page.locator("#variant-count")).toHaveText("1 / 3");
});

test("normal chords stop at exactly three positions and never expose a fourth", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("A");
  await expect(page.locator("#variant-count")).toHaveText("1 / 3");

  await page.locator("#next").tap();
  await expect(page.locator("#variant-count")).toHaveText("2 / 3");
  await page.locator("#next").tap();
  await expect(page.locator("#variant-count")).toHaveText("3 / 3");
  await page.locator("#next").tap();
  await expect(page.locator("#variant-count")).toHaveText("3 / 3");
});


test("extended chord family search, Turkish label and playback work on iPhone WebKit", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("Cm7b5");

  await expect(page.locator("#chord-symbol")).toHaveText("Cm7b5");
  await expect(page.locator("#chord-reading")).toHaveText("Do minör yedili bemol beş");
  await expect(page.locator("#variant-count")).toHaveText("1 / 3");
  await expect(page.locator("#relation")).toBeHidden();

  await page.locator("#chord-button").tap();
  const call=await page.evaluate(() => window.__CHORD_BOARD_AUDIO_CALLS__.at(-1));
  expect(call.symbol).toBe("Cm7b5");
  expect([...new Set(call.midis.map(midi => midi % 12))].sort((x,y)=>x-y)).toEqual([0,3,6,10]);
});


test("root search exposes all 15 chord families in the horizontal suggestion strip", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chord-search").fill("C");

  const suggestions=page.locator("#suggestions .suggestion");
  await expect(suggestions).toHaveCount(15);
  for (const symbol of ["C6","Cm6","C9","Cadd9","Cdim","Caug","Cm7b5"]) {
    await expect(page.locator(`#suggestions .suggestion[data-symbol="${symbol}"]`)).toHaveCount(1);
  }
});


test("ST logo opens the same-page chromatic tuner and closes it cleanly", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator,"mediaDevices",{
      configurable:true,
      value:{
        getUserMedia() {
          return Promise.reject(new DOMException("denied","NotAllowedError"));
        }
      }
    });
  });

  await page.goto("/");
  const button=page.locator("#tuner-button");
  await expect(button).toBeVisible();
  await expect(button.locator("img")).toHaveAttribute("src","./icon-192.png");

  await button.tap();
  const panel=page.locator("#tuner-panel");
  await expect(panel).toBeVisible();
  await expect(button).toHaveAttribute("aria-expanded","true");
  await expect(page.locator("#tuner-status")).toHaveText("Mikrofon izni verilmedi.");
  await expect(page.locator("#tuner-note-ring .tuner-clock-note")).toHaveCount(12);

  await page.locator("#tuner-close").tap();
  await expect(panel).toBeHidden();
  await expect(button).toHaveAttribute("aria-expanded","false");
});


test("search and tuner logo stay on the same top row on iPhone", async ({ page }) => {
  await page.goto("/");
  const layout=await page.evaluate(() => {
    const search=document.querySelector("#chord-search").getBoundingClientRect();
    const tuner=document.querySelector("#tuner-button").getBoundingClientRect();
    return {
      searchTop:search.top,
      searchBottom:search.bottom,
      searchRight:search.right,
      tunerTop:tuner.top,
      tunerBottom:tuner.bottom,
      tunerLeft:tuner.left,
      tunerWidth:tuner.width,
      tunerHeight:tuner.height
    };
  });
  expect(Math.abs(layout.searchTop-layout.tunerTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(layout.searchBottom-layout.tunerBottom)).toBeLessThanOrEqual(1);
  expect(layout.searchRight).toBeLessThanOrEqual(layout.tunerLeft);
  expect(layout.tunerWidth).toBe(48);
  expect(layout.tunerHeight).toBe(48);
});
