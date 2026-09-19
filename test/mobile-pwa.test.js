import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("PWA manifest is standalone portrait and scoped locally", () => {
  const manifest=JSON.parse(readFileSync(new URL("../manifest.webmanifest",import.meta.url),"utf8"));
  assert.equal(manifest.id,"./");
  assert.equal(manifest.start_url,"./");
  assert.equal(manifest.scope,"./");
  assert.equal(manifest.display,"standalone");
  assert.equal(manifest.orientation,"portrait");
  assert.equal(manifest.lang,"tr");
});

test("iPhone safe-area and standalone metadata are present", () => {
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/apple-mobile-web-app-capable/);
  assert.match(css,/safe-area-inset-top/);
  assert.match(css,/touch-action:manipulation/);
  assert.match(css,/min-height:44px/);
});

test("service worker keeps offline app shell bounded to same-origin requests", () => {
  const sw=readFileSync(new URL("../service-worker.js",import.meta.url),"utf8");
  assert.match(sw,/APP_SHELL/);
  assert.match(sw,/st-guitar-chord-board-v19/);
  assert.match(sw,/url\.origin!==self\.location\.origin/);
  assert.match(sw,/event\.request\.mode==="navigate"/);
  assert.match(sw,/caches\.match\("\.\/index\.html"\)/);
  assert.match(sw,/OPTIONAL_LOCAL_AUDIO/);
  assert.match(sw,/electric_guitar_jazz-mp3\.js/);
  assert.match(sw,/cache\.add\(asset\)\.catch\(\(\)=>null\)/);
});
