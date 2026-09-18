# Local guitar audio packaging

Stage 18 turns the earlier local-audio path into a verified distributable build.

## Pinned source

The packaged instrument remains pinned to:

- repository: `gleitz/midi-js-soundfonts`
- commit: `044fab8e1456bfafc5776e86dfd6bb8697149aef`
- file: `FluidR3_GM/electric_guitar_jazz-mp3.js`
- Git blob SHA-1: `2c0ef6f12d5a260982520130c97905e5931a60d4`

The source asset is not committed to this repository.

## Build the release

Run:

```bash
npm run build:release
```

That command:

1. downloads the soundfont from the immutable source commit;
2. recomputes and verifies the canonical Git blob SHA-1;
3. creates a clean `dist/` directory;
4. copies only browser runtime files;
5. places the verified soundfont at `dist/vendor/audio/electric_guitar_jazz-mp3.js`;
6. enables the standalone release audio bridge;
7. changes the release Service Worker so the soundfont is a required cache entry;
8. writes `dist/release-manifest.json` with provenance and size data.

The generated `dist/` and vendored source asset remain ignored by Git.

## Standalone release bridge

Published builds no longer require the editor or `smplr` runtime in order to play the packaged instrument.

The release-only bridge:

```text
local MIDI.js soundfont
  -> note-name lookup from exact MIDI
  -> base64 MP3 sample
  -> Web Audio decodeAudioData
  -> AudioBufferSourceNode
  -> chord playback
```

It publishes the existing host contract:

```js
window.ST_GUITAR_AUDIO.capabilities.offlineReady === true
window.ST_GUITAR_AUDIO.capabilities.source === "standalone-midi-js-soundfont"
```

If an editor already supplies `window.ST_GUITAR_AUDIO`, the standalone installer leaves that bridge untouched.

## Development behavior

The checked-in `src/release-config.js` keeps standalone release audio disabled. This prevents ordinary source development from claiming packaged offline guitar audio when the generated asset is absent.

The release builder writes an enabled copy only inside `dist/`.

## Service Worker contract

Source/development mode treats the large soundfont as optional.

The generated release build sets the Service Worker release switch to required. Service Worker installation therefore fails rather than falsely claiming offline readiness when the packaged soundfont cannot be cached.

## Automated release qualification

CI now performs a dedicated release job:

- builds the real `dist/` package;
- verifies the pinned soundfont;
- serves `dist/` through Chromium;
- confirms the standalone bridge reports offline readiness;
- confirms the soundfont exists and is present in Cache Storage;
- plays an A5 through the real local sample/decode path;
- disables networking and reloads the PWA;
- plays again through the cached packaged path;
- uploads `dist/` as the `st-guitar-chord-board-release` artifact.

This proves the browser audio pipeline completes with the packaged sample both online and after network removal in the automated Chromium environment.

## License / attribution

See `THIRD_PARTY_NOTICES.md` and `vendor/audio/source.json`.

The source repository identifies FluidR3_GM-derived sample assets as CC BY 3.0. Preserve attribution in every distributed build.

## Remaining physical-device gate

Automated release qualification is not a substitute for listening on a physical iPhone.

Before a public v1.0 release, verify on real iPhone/Safari:

1. install/open the PWA;
2. tap several chords and confirm audible guitar timbre;
3. change voicings and repeat;
4. disconnect the network;
5. fully relaunch the installed PWA;
6. confirm the same guitar timbre remains audible.
