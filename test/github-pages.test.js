import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("GitHub Pages workflow builds the qualified release and deploys dist", async () => {
  let workflow;
  try {
    workflow = await readFile(".github/workflows/pages.yml","utf8");
  } catch (error) {
    assert.fail("missing GitHub Pages workflow: " + (error?.message || error));
  }
  assert.match(workflow,/branches:\s*\[main\]/);
  assert.match(workflow,/npm run build:release/);
  assert.match(workflow,/actions\/configure-pages@v5/);
  assert.match(workflow,/actions\/upload-pages-artifact@v4/);
  assert.match(workflow,/path:\s*dist/);
  assert.match(workflow,/actions\/deploy-pages@v4/);
  assert.match(workflow,/pages:\s*write/);
  assert.match(workflow,/id-token:\s*write/);
});

test("release asset paths are project-subpath safe for GitHub Pages", async () => {
  const [index, manifest, serviceWorker, releaseConfig] = await Promise.all([
    readFile("index.html","utf8"),
    readFile("manifest.webmanifest","utf8"),
    readFile("service-worker.js","utf8"),
    readFile("src/release-config.js","utf8")
  ]);

  for (const value of ["./manifest.webmanifest","./styles.css","./src/app.js","./service-worker.js"]) {
    assert.ok(index.includes(value), "missing relative asset path: " + value);
  }

  const pwa=JSON.parse(manifest);
  assert.equal(pwa.id,"./");
  assert.equal(pwa.start_url,"./");
  assert.equal(pwa.scope,"./");
  assert.ok(serviceWorker.includes('const APP_SHELL=["./"'));
  assert.doesNotMatch(serviceWorker,/https?:\/\//);
  assert.ok(releaseConfig.includes('instrumentUrl: "./vendor/audio/electric_guitar_jazz-mp3.js"'));
});
