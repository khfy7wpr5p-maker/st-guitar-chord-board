import { test, expect } from "@playwright/test";

test("cached app shell reloads while browser context is offline", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");

  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active?.state !== "activated") {
      await new Promise(resolve => {
        const worker = registration.installing || registration.waiting;
        if (!worker) return resolve();
        worker.addEventListener("statechange", () => {
          if (worker.state === "activated") resolve();
        });
      });
    }
  });

  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload();
    await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  }

  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBeTruthy();

  await page.locator("#chord-search").fill("A5");
  await page.locator("#next").click();
  await expect(page.locator("#variant-count")).toHaveText("2 / 2");

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#chord-search")).toHaveValue("A5");
  await expect(page.locator("#chord-symbol")).toHaveText("A5");
  await expect(page.locator("#chord-reading")).toHaveText("La beş");
  await expect(page.locator("#variant-count")).toHaveText("2 / 2");

  await context.setOffline(false);
});
