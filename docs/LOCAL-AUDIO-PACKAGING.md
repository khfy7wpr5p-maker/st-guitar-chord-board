# Local guitar audio packaging

Stage 12 provides an explicit path to package the editor-style guitar soundfont locally without committing the large generated audio blob to Git.

## Source pin

The optional guitar asset is pinned to:

- repository: `gleitz/midi-js-soundfonts`
- commit: `044fab8e1456bfafc5776e86dfd6bb8697149aef`
- file: `FluidR3_GM/electric_guitar_jazz-mp3.js`
- Git blob SHA-1: `2c0ef6f12d5a260982520130c97905e5931a60d4`

Run:

```bash
npm run vendor:guitar-audio
```

The script downloads from the immutable commit URL, recomputes the canonical Git blob SHA-1, and writes only a matching file to:

```text
vendor/audio/electric_guitar_jazz-mp3.js
```

The generated asset is intentionally ignored by Git.

## Service-worker behavior

The regular application shell installs even when the optional audio asset is absent.

If the vendored soundfont is present when the app is served, the service worker attempts to pre-cache it. Failure to find the optional file does not invalidate installation of the chord-board shell.

## Editor / smplr bridge

The product exposes a version-agnostic helper:

```js
import { installLocalSmplrGuitarBridge } from "./src/local-smplr-guitar-bridge.js";
import { Soundfont } from "smplr";

await installLocalSmplrGuitarBridge({
  audioContext: SuiOscillator.audio,
  createSoundfont({ audioContext, instrumentUrl }) {
    // Matches the existing editor's smplr constructor usage.
    return new Soundfont(audioContext, { instrumentUrl });
  }
});
```

The helper requires a same-origin relative `instrumentUrl` and publishes:

```js
window.ST_GUITAR_AUDIO.capabilities.offlineReady === true
```

only for that locally vendored bridge.

## License / attribution

See `THIRD_PARTY_NOTICES.md` and `vendor/audio/source.json`.

The source project states that FluidR3_GM-derived sample assets are CC BY 3.0. The packaging repository's own software license is MIT. Preserve the sample attribution in distributed builds.

## Qualification boundary

The presence of the vendor script is not itself proof of an offline production build.

A production candidate must demonstrate all of the following in the built artifact:

1. the verified soundfont file exists at the local runtime path;
2. the editor bridge uses that local path;
3. the service worker has cached it;
4. the app is relaunched with network disabled;
5. chord playback still produces the guitar sound.

The final item remains a physical-device qualification gate.
