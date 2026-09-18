import test from "node:test";
import assert from "node:assert/strict";
import { gitBlobSha1, downloadVerifiedSoundfont, GUITAR_SOUNDFONT_SOURCE } from "../scripts/vendor-guitar-soundfont.mjs";

test("git blob verifier matches canonical git object framing", () => {
  assert.equal(gitBlobSha1(Buffer.from("test\n")), "9daeafb9864cf43055ae93beb0afd6c7d144bfa4");
});

test("vendor rejects bytes that do not match the pinned soundfont blob", async () => {
  const fakeFetch = async () => ({
    ok: true,
    async arrayBuffer() { return Uint8Array.from([1,2,3]).buffer; }
  });
  await assert.rejects(
    () => downloadVerifiedSoundfont({ fetchImpl: fakeFetch, outputPath: "/tmp/should-not-write-soundfont.js" }),
    /soundfont blob mismatch/
  );
});

test("soundfont source is pinned to immutable commit and local runtime path", () => {
  assert.match(GUITAR_SOUNDFONT_SOURCE.commit,/^[0-9a-f]{40}$/);
  assert.match(GUITAR_SOUNDFONT_SOURCE.blobSha1,/^[0-9a-f]{40}$/);
  assert.equal(GUITAR_SOUNDFONT_SOURCE.runtimePath,"./vendor/audio/electric_guitar_jazz-mp3.js");
  assert.match(GUITAR_SOUNDFONT_SOURCE.sourceUrl,new RegExp(GUITAR_SOUNDFONT_SOURCE.commit));
});
