# Deployment

## Production URL

```text
https://st-guitar-chord-board.onrender.com
```

The site is a static PWA. No application server, database, account service, or Render web service is required.

## Hosting

- provider: Render Static Site
- source: `https://github.com/khfy7wpr5p-maker/st-guitar-chord-board`
- branch: `main`
- auto-deploy: enabled
- publish directory: `dist`

Build command:

```bash
npm install --no-audit --no-fund && npm run build:release
```

## Release guarantees

The hosted build uses the same Stage 18 release pipeline as CI:

1. download the pinned `electric_guitar_jazz` soundfont;
2. verify Git blob SHA-1 `2c0ef6f12d5a260982520130c97905e5931a60d4`;
3. generate a clean runtime-only `dist/`;
4. enable standalone local guitar audio;
5. require the soundfont in the release Service Worker cache;
6. publish `dist/` over HTTPS.

Verified soundfont size:

```text
2,330,622 bytes
```

## First production deployment

The first Stage 19 deployment built:

```text
02a1ddf49a30ee22146bd463a0f87ca673a39bd5
```

Render reported the deploy as `live`. Build logs recorded the verified soundfont hash, release version `0.18.0`, and successful upload.

## Continuous deployment

Every new commit merged to `main` triggers a new static-site deploy automatically.

Production deploys must continue to use `npm run build:release`; publishing the source tree directly would disable the release-only audio configuration and is not supported.

## Qualification boundary

Automated browser and release qualification already covers packaged-audio loading, decoding, Service Worker caching, network removal, and offline reload.

The remaining release gate before v1.0 is a physical iPhone/Safari check for:

- first tap audio unlock;
- audible guitar timbre;
- installed PWA relaunch;
- offline audible playback;
- final touch/layout inspection.


## 0.18.1 full-chord audio hotfix

Release `0.18.1` corrects the standalone MIDI.js sample-name mapping.

The packaged soundfont uses:
`Db, Eb, Gb, Ab, Bb`

rather than:
`C#, D#, F#, G#, A#`

for accidental sample keys.

No additional audio files are added. The same 2,330,622-byte soundfont is reused.

Release qualification now enumerates all 96 canonical chord identities and every available voicing and verifies that every generated MIDI note resolves to a real packaged sample.

The Service Worker cache identifier is rotated to `st-guitar-chord-board-v13` to prevent existing PWA installations from retaining the old bridge.


## GitHub Pages — free distribution path

A GitHub Pages workflow is stored at:

```text
.github/workflows/pages.yml
```

It runs on each push to `main` and uses the qualified release pipeline:

```bash
npm install --no-audit --no-fund
npm run build:release
```

The generated `dist/` directory is uploaded as the Pages artifact and deployed with GitHub's official Pages actions.

### One-time activation

GitHub requires Pages to be enabled once for the repository:

1. open the repository on GitHub;
2. open **Settings**;
3. select **Pages**;
4. under **Build and deployment**, set **Source** to **GitHub Actions**.

After that, pushes to `main` deploy automatically.

Expected public URL:

```text
https://khfy7wpr5p-maker.github.io/st-guitar-chord-board/
```

### Project-subpath safety

The application uses relative paths for:
- manifest;
- stylesheet;
- JavaScript entry point;
- Service Worker;
- runtime modules;
- packaged soundfont.

The PWA manifest also uses relative `id`, `start_url`, and `scope`, so deployment under the GitHub Pages project path does not require a second build variant.

### Offline sharing

GitHub Pages is needed only for initial delivery and updates.

Once the user opens the app online and the release Service Worker has installed successfully, the app shell and the packaged guitar soundfont are cached locally. The installed PWA can then be reopened without network access.

Render remains available during migration and should only be disabled after the Pages URL has been activated and verified.
