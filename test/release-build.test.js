import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function loadBuildModule() {
  try {
    return await import("../scripts/build-release.mjs");
  } catch (error) {
    assert.fail(`release build module is required: ${error?.message || error}`);
  }
}

test("release build emits enabled local-audio config and verified manifest", async () => {
  const mod=await loadBuildModule();
  const root=await mkdtemp(join(tmpdir(),"chord-board-release-"));
  try {
    await mkdir(join(root,"src"),{recursive:true});
    await mkdir(join(root,"vendor/audio"),{recursive:true});
    for (const [path,content] of [
      ["index.html","<html></html>"],
      ["styles.css","body{}"],
      ["manifest.webmanifest","{}"],
      ["service-worker.js",""],
      ["THIRD_PARTY_NOTICES.md","notice"],
      ["src/app.js",""],
      ["src/release-config.js","export const RELEASE_AUDIO={enabled:false};"],
      ["vendor/audio/source.json","{}"]
    ]) {
      const full=join(root,path);
      await mkdir(full.substring(0,full.lastIndexOf("/")),{recursive:true}).catch(()=>{});
      await writeFile(full,content);
    }
    const soundfont=Buffer.from("fixture-soundfont");
    await writeFile(join(root,"vendor/audio/electric_guitar_jazz-mp3.js"),soundfont);

    const dist=join(root,"dist");
    const result=await mod.buildRelease({
      rootDir:root,
      distDir:dist,
      expectedSoundfontBlobSha1:mod.gitBlobSha1(soundfont),
      sourceCommit:"fixture-commit",
      packageVersion:"9.9.9"
    });

    await access(join(dist,"vendor/audio/electric_guitar_jazz-mp3.js"));
    const config=await readFile(join(dist,"src/release-config.js"),"utf8");
    assert.match(config,/enabled:\s*true/);
    const manifest=JSON.parse(await readFile(join(dist,"release-manifest.json"),"utf8"));
    assert.equal(manifest.version,"9.9.9");
    assert.equal(manifest.soundfont.gitBlobSha1,result.soundfontGitBlobSha1);
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});
