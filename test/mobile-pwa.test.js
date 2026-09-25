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
  assert.deepEqual(manifest.icons,[
    {src:"./icon-192.png",sizes:"192x192",type:"image/png",purpose:"any"},
    {src:"./icon-512.png",sizes:"512x512",type:"image/png",purpose:"any"},
    {src:"./maskable-icon-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"}
  ]);
});

test("iPhone safe-area, standalone metadata and brand icons are present", () => {
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/apple-mobile-web-app-capable/);
  assert.match(html,/apple-touch-icon/);
  assert.match(html,/\.\/apple-touch-icon\.png/);
  assert.match(html,/\.\/favicon-32x32\.png/);
  assert.match(html,/\.\/favicon-16x16\.png/);
  assert.match(html,/\.\/favicon\.ico/);
  assert.match(html,/id="tuner-button"/);
  assert.match(html,/id="tuner-panel"/);
  assert.match(html,/styles\.css\?v=24-1/);
  assert.match(html,/src\/app\.js\?v=24-1/);
  assert.match(html,/service-worker\.js\?v=24-1/);
  assert.match(css,/safe-area-inset-top/);
  assert.match(css,/\.tuner-dial/);
  assert.match(css,/touch-action:manipulation/);
  assert.match(css,/min-height:44px/);
});

test("service worker keeps offline app shell bounded to same-origin requests", () => {
  const sw=readFileSync(new URL("../service-worker.js",import.meta.url),"utf8");
  assert.match(sw,/APP_SHELL/);
  assert.match(sw,/st-guitar-chord-board-v28/);
  assert.match(sw,/apple-touch-icon\.png/);
  assert.match(sw,/icon-192\.png/);
  assert.match(sw,/icon-512\.png/);
  assert.match(sw,/maskable-icon-512\.png/);
  assert.match(sw,/src\/tuner\.js/);
  assert.match(sw,/src\/tuner-core\.js/);\n  assert.match(sw,/src\/accessibility-model\.js/);
  assert.match(sw,/styles\.css\?v=24-1/);
  assert.match(sw,/src\/app\.js\?v=24-1/);
  assert.match(sw,/NETWORK_FIRST_DESTINATIONS/);
  assert.match(sw,/request\.destination/);
  assert.match(sw,/url\.origin!==self\.location\.origin/);
  assert.match(sw,/event\.request\.mode==="navigate"/);
  assert.match(sw,/caches\.match\("\.\/index\.html"\)/);
  assert.match(sw,/OPTIONAL_LOCAL_AUDIO/);
  assert.match(sw,/electric_guitar_jazz-mp3\.js/);
  assert.match(sw,/cache\.add\(asset\)\.catch\(\(\)=>null\)/);
});
