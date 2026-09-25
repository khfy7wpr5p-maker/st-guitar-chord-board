import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RUNTIME_SRC_FILES } from "../scripts/build-release.mjs";

test("VoiceOver description stays screen-reader-only and owns the chord button semantics", () => {
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(
    html,
    /id="chord-button"[^>]*aria-describedby="chord-accessibility-description"/
  );
  assert.match(
    html,
    /id="chord-accessibility-description"[^>]*class="sr-only"/
  );
  assert.match(
    html,
    /id="chord-accessibility-status"[^>]*class="sr-only"[^>]*aria-live="polite"/
  );
  assert.match(html,/id="strings"[^>]*aria-hidden="true"/);
});

test("accessibility-only markup introduces no literal visible escape text", () => {
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.equal(html.includes("\\n"),false);
});

test("accessibility runtime model is packaged for release and offline app-shell use", () => {
  const sw=readFileSync(new URL("../service-worker.js",import.meta.url),"utf8");
  assert.match(sw,/st-guitar-chord-board-v28/);
  assert.match(sw,/src\/accessibility-model\.js/);
  assert.ok(RUNTIME_SRC_FILES.includes("accessibility-model.js"));
});
