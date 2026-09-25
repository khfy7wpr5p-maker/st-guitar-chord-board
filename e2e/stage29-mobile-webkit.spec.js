import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__CHORD_BOARD_AUDIO_CALLS__ = [];
    window.ST_GUITAR_AUDIO = {
      capabilities: { offlineReady: true },
      playChord(payload) {
        window.__CHORD_BOARD_AUDIO_CALLS__.push(payload);
        return Promise.resolve({ ok:true });
      }
    };
  });
});

async function dispatchSwipe(page, { fromX, toX, fromY = 240, toY = 240 }) {
  await page.locator("#chord-button").evaluate((element, gesture) => {
    const common = {
      bubbles:true,
      cancelable:true,
      pointerId:7,
      pointerType:"touch",
      isPrimary:true
    };
    element.dispatchEvent(new PointerEvent("pointerdown", {
      ...common,
      clientX:gesture.fromX,
      clientY:gesture.fromY,
      buttons:1
    }));
    element.dispatchEvent(new PointerEvent("pointerup", {
      ...common,
      clientX:gesture.toX,
      clientY:gesture.toY,
      buttons:0
    }));
  }, { fromX, toX, fromY, toY });
}

test("VoiceOver semantics expose one chord control with six-string detail and zero visible geometry", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready","true");

  const board=page.locator("#chord-button");
  const description=page.locator("#chord-accessibility-description");
  const live=page.locator("#chord-accessibility-status");

  await expect(board).toHaveAttribute("aria-describedby","chord-accessibility-description");
  await expect(board).toHaveAttribute("aria-label","C, Do majör, pozisyon 1 / 3");
  await expect(page.locator("#strings")).toHaveAttribute("aria-hidden","true");
  await expect(description).toHaveText(
    "6. tel çalınmaz. 5. tel, 3. perde, 3. parmak. 4. tel, 2. perde, 2. parmak. 3. tel açık. 2. tel, 1. perde, 1. parmak. 1. tel açık. Akoru çalmak için çift dokunun."
  );
  await expect(live).toHaveText("");

  const stringOrder=await description.evaluate(element => {
    const text=element.textContent || "";
    return [6,5,4,3,2,1].map(stringNumber=>text.indexOf(`${stringNumber}. tel`));
  });
  for (let i=1;i<stringOrder.length;i+=1) {
    expect(stringOrder[i]).toBeGreaterThan(stringOrder[i-1]);
  }

  const hiddenGeometry=await page.evaluate(() => {
    const ids=["chord-accessibility-description","chord-accessibility-status"];
    return ids.map(id => {
      const element=document.getElementById(id);
      const style=getComputedStyle(element);
      const rect=element.getBoundingClientRect();
      return {
        id,
        position:style.position,
        width:rect.width,
        height:rect.height,
        overflow:style.overflow
      };
    });
  });
  for (const item of hiddenGeometry) {
    expect(item.position).toBe("absolute");
    expect(item.width).toBeLessThanOrEqual(1);
    expect(item.height).toBeLessThanOrEqual(1);
    expect(item.overflow).toBe("hidden");
  }
});

test("VoiceOver description follows chord and voicing changes without replay announcements", async ({ page }) => {
  await page.goto("/");
  const board=page.locator("#chord-button");
  const description=page.locator("#chord-accessibility-description");
  const live=page.locator("#chord-accessibility-status");

  await page.locator("#chord-search").fill("Am");
  await expect(board).toHaveAttribute("aria-label","Am, La minör, pozisyon 1 / 3");
  await expect(live).toHaveText("Am, La minör, pozisyon 1 / 3");
  const firstDescription=await description.textContent();

  await page.locator("#next").tap();
  await expect(board).toHaveAttribute("aria-label","Am, La minör, pozisyon 2 / 3");
  await expect(live).toHaveText("Am, La minör, pozisyon 2 / 3");
  const secondDescription=await description.textContent();
  expect(secondDescription).not.toBe(firstDescription);

  const liveBeforePlay=await live.textContent();
  const descriptionBeforePlay=await description.textContent();
  await board.tap();
  expect(await page.evaluate(() => window.__CHORD_BOARD_AUDIO_CALLS__.length)).toBe(1);
  await expect(live).toHaveText(liveBeforePlay || "");
  await expect(description).toHaveText(descriptionBeforePlay || "");

  await page.locator("#prev").tap();
  await expect(board).toHaveAttribute("aria-label","Am, La minör, pozisyon 1 / 3");
  await expect(live).toHaveText("Am, La minör, pozisyon 1 / 3");
});

test("relation, suggestion and swipe paths keep VoiceOver state synchronized", async ({ page }) => {
  await page.goto("/");
  const board=page.locator("#chord-button");
  const live=page.locator("#chord-accessibility-status");

  await page.locator("#chord-search").fill("A");
  await page.locator('#suggestions .suggestion[data-symbol="A7"]').tap();
  await expect(board).toHaveAttribute("aria-label","A7, La yedili, pozisyon 1 / 3");
  await expect(live).toHaveText("A7, La yedili, pozisyon 1 / 3");

  await page.locator("#chord-search").fill("C");
  await page.locator('#relation .relation-card[data-symbol="Am"]').tap();
  await expect(board).toHaveAttribute("aria-label","Am, La minör, pozisyon 1 / 3");
  await expect(live).toHaveText("Am, La minör, pozisyon 1 / 3");

  await dispatchSwipe(page,{fromX:310,toX:120});
  await expect(board).toHaveAttribute("aria-label","Am, La minör, pozisyon 2 / 3");
  await expect(live).toHaveText("Am, La minör, pozisyon 2 / 3");
  expect(await page.evaluate(() => window.__CHORD_BOARD_AUDIO_CALLS__.length)).toBe(0);
});
