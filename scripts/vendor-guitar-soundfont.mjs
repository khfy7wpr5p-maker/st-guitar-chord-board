import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const GUITAR_SOUNDFONT_SOURCE = Object.freeze({
  repository: "gleitz/midi-js-soundfonts",
  commit: "044fab8e1456bfafc5776e86dfd6bb8697149aef",
  path: "FluidR3_GM/electric_guitar_jazz-mp3.js",
  blobSha1: "2c0ef6f12d5a260982520130c97905e5931a60d4",
  runtimePath: "./vendor/audio/electric_guitar_jazz-mp3.js",
  sourceUrl: "https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/044fab8e1456bfafc5776e86dfd6bb8697149aef/FluidR3_GM/electric_guitar_jazz-mp3.js"
});

export function gitBlobSha1(bytes) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return createHash("sha1").update(header).update(buffer).digest("hex");
}

export async function downloadVerifiedSoundfont({
  fetchImpl = globalThis.fetch,
  outputPath = resolve("vendor/audio/electric_guitar_jazz-mp3.js")
} = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
  const response = await fetchImpl(GUITAR_SOUNDFONT_SOURCE.sourceUrl);
  if (!response?.ok) throw new Error(`soundfont download failed: HTTP ${response?.status ?? "unknown"}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = gitBlobSha1(bytes);
  if (actual !== GUITAR_SOUNDFONT_SOURCE.blobSha1) {
    throw new Error(`soundfont blob mismatch: expected ${GUITAR_SOUNDFONT_SOURCE.blobSha1}, got ${actual}`);
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  return Object.freeze({
    outputPath,
    bytes: bytes.length,
    blobSha1: actual,
    sourceCommit: GUITAR_SOUNDFONT_SOURCE.commit
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  downloadVerifiedSoundfont()
    .then(result => {
      console.log(`Vendored guitar soundfont: ${result.bytes} bytes -> ${result.outputPath}`);
      console.log(`Verified Git blob: ${result.blobSha1}`);
    })
    .catch(error => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
