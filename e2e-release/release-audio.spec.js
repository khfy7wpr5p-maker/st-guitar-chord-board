import { test, expect } from "@playwright/test";

const SOUNDFONT_PATH = "/vendor/audio/electric_guitar_jazz-mp3.js";

async function ensureServiceWorkerControl(page) {
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
    await page.reload({waitUntil:"domcontentloaded"});
    await expect(page.locator("#app")).toHaveAttribute("data-ready","true");
  }
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBeTruthy();
}

test("release build uses packaged guitar soundfont and survives offline reload", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready","true");
  await expect(page.locator("#status")).toHaveText("Gitar sesi bağlı · çevrimdışı hazır");

  const bridge = await page.evaluate(() => ({
    source: window.ST_GUITAR_AUDIO?.capabilities?.source,
    offlineReady: window.ST_GUITAR_AUDIO?.capabilities?.offlineReady,
    instrumentUrl: window.ST_GUITAR_AUDIO?.capabilities?.instrumentUrl
  }));
  expect(bridge).toEqual({
    source:"standalone-midi-js-soundfont",
    offlineReady:true,
    instrumentUrl:"./vendor/audio/electric_guitar_jazz-mp3.js"
  });

  const assetResponse = await page.request.get(SOUNDFONT_PATH);
  expect(assetResponse.ok()).toBeTruthy();
  expect(Number(assetResponse.headers()["content-length"] || 0)).toBeGreaterThan(100_000);

  await ensureServiceWorkerControl(page);
  const cached = await page.evaluate(async path => {
    const absolute = new URL(path, location.origin).href;
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      if (await cache.match(absolute)) return true;
    }
    return false;
  }, SOUNDFONT_PATH);
  expect(cached).toBeTruthy();

  await page.locator("#chord-search").fill("A5");
  const board = page.locator("#chord-button");
  await board.click();
  await expect(board).toHaveClass(/pressed/);

  await context.setOffline(true);
  await page.reload({waitUntil:"domcontentloaded"});
  await expect(page.locator("#app")).toHaveAttribute("data-ready","true");
  await expect(page.locator("#status")).toHaveText("Gitar sesi bağlı · çevrimdışı hazır");
  await expect(page.locator("#chord-symbol")).toHaveText("A5");

  const offlineBoard = page.locator("#chord-button");
  await offlineBoard.click();
  await expect(offlineBoard).toHaveClass(/pressed/);

  await context.setOffline(false);
});

test("release manifest pins the verified soundfont provenance", async ({ request }) => {
  const response=await request.get("/release-manifest.json");
  expect(response.ok()).toBeTruthy();
  const manifest=await response.json();
  expect(manifest.version).toBe("0.19.0");
  expect(manifest.builtFor).toBe("static-offline-pwa");
  expect(manifest.soundfont.instrument).toBe("electric_guitar_jazz");
  expect(manifest.soundfont.gitBlobSha1).toBe("2c0ef6f12d5a260982520130c97905e5931a60d4");
  expect(manifest.soundfont.bytes).toBeGreaterThan(100_000);
});


test("packaged soundfont covers every MIDI note used by all 96 chord voicings", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready","true");

  const coverage = await page.evaluate(async () => {
    const [{ CHORD_SYMBOLS }, { getVoicings, voicingMidi }, audio] = await Promise.all([
      import("/src/chord-catalog.js"),
      import("/src/voicing-library.js"),
      import("/src/standalone-guitar-audio.js")
    ]);
    const instrument = await audio.loadMidiJsInstrument(
      window,
      "./vendor/audio/electric_guitar_jazz-mp3.js"
    );

    const missing = [];
    let voicingCount = 0;
    for (const symbol of CHORD_SYMBOLS) {
      for (const voicing of getVoicings(symbol)) {
        voicingCount += 1;
        for (const midi of voicingMidi(voicing)) {
          const noteName = audio.midiToNoteName(midi);
          if (!instrument[noteName]) missing.push({ symbol, midi, noteName });
        }
      }
    }

    return {
      chordCount: CHORD_SYMBOLS.length,
      voicingCount,
      missing
    };
  });

  expect(coverage.chordCount).toBe(96);
  expect(coverage.voicingCount).toBe(276);
  expect(coverage.missing).toEqual([]);
});
