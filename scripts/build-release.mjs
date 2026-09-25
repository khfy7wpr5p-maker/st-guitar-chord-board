import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  GUITAR_SOUNDFONT_SOURCE,
  gitBlobSha1
} from "./vendor-guitar-soundfont.mjs";

export { gitBlobSha1 };

const ROOT_FILES = Object.freeze([
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "service-worker.js",
  "apple-touch-icon.png",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "favicon.ico",
  "icon-192.png",
  "icon-512.png",
  "maskable-icon-512.png",
  "THIRD_PARTY_NOTICES.md"
]);

export const RUNTIME_SRC_FILES = Object.freeze([
  "app.js",
  "accessibility-model.js",
  "audio-adapter.js",
  "tuner.js",
  "tuner-core.js",
  "chord-catalog.js",
  "chord-core.js",
  "chord-labels-tr.js",
  "chord-relations.js",
  "curated-open-voicings.js",
  "diagram-model.js",
  "movable-voicings.js",
  "power-voicings.js",
  "release-config.js",
  "selection-state.js",
  "standalone-guitar-audio.js",
  "voicing-library.js"
]);

const RELEASE_CONFIG = `export const RELEASE_AUDIO = Object.freeze({
  enabled: true,
  instrumentUrl: "./vendor/audio/electric_guitar_jazz-mp3.js"
});
`;

export async function buildRelease({
  rootDir = resolve("."),
  distDir = resolve("dist"),
  expectedSoundfontBlobSha1 = GUITAR_SOUNDFONT_SOURCE.blobSha1,
  sourceCommit = GUITAR_SOUNDFONT_SOURCE.commit,
  packageVersion,
  runtimeSrcFiles = RUNTIME_SRC_FILES
} = {}) {
  const soundfontPath = join(rootDir,"vendor/audio/electric_guitar_jazz-mp3.js");
  const soundfontBytes = await readFile(soundfontPath);
  const actualSha = gitBlobSha1(soundfontBytes);
  if (actualSha !== expectedSoundfontBlobSha1) {
    throw new Error(`release soundfont blob mismatch: expected ${expectedSoundfontBlobSha1}, got ${actualSha}`);
  }

  let version = packageVersion;
  if (!version) {
    const pkg = JSON.parse(await readFile(join(rootDir,"package.json"),"utf8"));
    version = pkg.version;
  }

  await rm(distDir,{recursive:true,force:true});
  await mkdir(distDir,{recursive:true});

  for (const file of ROOT_FILES) {
    await cp(join(rootDir,file),join(distDir,file));
  }

  await mkdir(join(distDir,"src"),{recursive:true});
  for (const file of runtimeSrcFiles) {
    await cp(join(rootDir,"src",file),join(distDir,"src",file));
  }

  await mkdir(join(distDir,"vendor/audio"),{recursive:true});
  await cp(join(rootDir,"vendor/audio/source.json"),join(distDir,"vendor/audio/source.json"));
  await writeFile(join(distDir,"vendor/audio/electric_guitar_jazz-mp3.js"),soundfontBytes);
  await writeFile(join(distDir,"src/release-config.js"),RELEASE_CONFIG);

  const swPath = join(distDir,"service-worker.js");
  const serviceWorker = await readFile(swPath,"utf8");
  const releaseServiceWorker = serviceWorker.replace(
    "const RELEASE_REQUIRES_LOCAL_AUDIO=false;",
    "const RELEASE_REQUIRES_LOCAL_AUDIO=true;"
  );
  if (releaseServiceWorker === serviceWorker) {
    throw new Error("service worker release-audio switch was not found");
  }
  await writeFile(swPath,releaseServiceWorker);

  const manifest = {
    schemaVersion:1,
    version,
    builtFor:"static-offline-pwa",
    runtimeFiles:[...runtimeSrcFiles],
    soundfont:{
      instrument:"electric_guitar_jazz",
      gitBlobSha1:actualSha,
      bytes:soundfontBytes.length,
      sourceCommit
    }
  };
  await writeFile(join(distDir,"release-manifest.json"),JSON.stringify(manifest,null,2)+"\n");

  return Object.freeze({
    distDir,
    version,
    soundfontGitBlobSha1:actualSha,
    soundfontBytes:soundfontBytes.length
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  buildRelease()
    .then(result => {
      console.log(`Release build ready: ${result.distDir}`);
      console.log(`Version: ${result.version}`);
      console.log(`Soundfont: ${result.soundfontBytes} bytes, ${result.soundfontGitBlobSha1}`);
    })
    .catch(error => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
