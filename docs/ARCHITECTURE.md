# Architecture

## Product rule

The chord board is an offline-first, phone-first instrument surface. The selected chord is the primary large tactile control. There is no required backend.

## Runtime flow

```text
Symbol search input
  -> Local 96-chord catalog
  -> same-root suggestion family
  -> Chord parser / normalizer
  -> Turkish chord reading
  -> Explicit relation layer
       -> same-root family
       -> relative major/minor for basic triads only
  -> Voicing provider
       -> curated common open/open-region voicing when available
       -> curated C-family alternatives
       -> deterministic movable A/E/D-family generator
  -> Fingering / barre metadata
  -> Large chord button
  -> exact MIDI notes for selected string/fret voicing
  -> AudioAdapter
       -> preferred: ST editor / ST Score Audio guitar bridge
       -> standalone release: packaged MIDI.js guitar soundfont via Web Audio
       -> development fallback only: Web Audio oscillator
```

## Implemented stages

### Stage 0 — contracts ✅
- chord identity
- supported quality vocabulary
- voicing shape contract
- host audio adapter contract
- offline-first policy

### Stage 1 — validated vertical slice ✅
- C-family vertical slice
- >=3 exact voicings per chord
- finger numbers
- exact MIDI derivation
- large phone control
- local search
- service-worker shell

### Stage 2 — 84-chord deterministic expansion ✅
- 12 roots × 7 chord families
- three movable shape families per quality
- generated frets bounded to 0..20
- exact pitch-class equality required in CI

### Stage 3 — ST audio contract integration ✅
- direct `ST_SCORE_AUDIO_ENGINE.audition()` adapter
- exact MIDI + physical string/fret evidence
- polyphonic chord dispatch
- editor-owned guitar bridge retained

### Stage 4 — tactile guitar diagram ✅
- six-string SVG chord chart
- open/mute markers
- finger numbers
- barre geometry
- automatic base-fret window

### Stage 5 — Turkish chord naming ✅
- symbol-first search
- Turkish reading under every selected symbol
- note-set search removed from product scope

### Stage 6 — search UX + common guitar positions
- offline 84-chord catalog
- compact same-root suggestion family
- selected symbol ranked first
- curated first-position/open alternatives for common A/E/D/G/B/F shapes
- deterministic movable shapes retained as additional variations
- no server dependency

## Next stages

### Stage 7 — engine authority cross-check ✅
Pinned compatibility baselines now cross-check product data against:
- `musicxml-to-guitar-tab-engine` standard tuning, six-string layout and 0..20 fret bounds;
- `st-guitar-harmonic-engine` exact major/minor/7/maj7/m7 and sus2/sus4 interval templates;
- `st-guitar-fingering-training` deterministic four-finger/barre resource boundary.

Every displayed voicing is checked in CI. The learned fingering ranker remains explicitly outside runtime because its source repository still records runtime/production authorization as false.

The chord-board runtime remains local; Stage 7 adds compatibility guards, not a backend or cross-repository runtime dependency.

### Stage 8 — audio qualification routing ✅ / mobile qualification remaining
Implemented:
- editor-owned guitar sampler/MIDI bridge is the first production route;
- ST Score Audio classical-guitar route is gated on `ACTIVE + QUALIFIED` when profile inspection exists;
- current suspended Score Audio guitar profile is automatically skipped;
- legacy score-audio hosts without profile inspection remain compatible;
- development oscillator remains non-production fallback.

Still remaining:
- physical iPhone touch/layout qualification;
- confirmation that the editor's guitar sound assets are packaged/cached for true offline playback;
- cache/version migration qualification.

### Stage 9 — chord relationship layer ✅
Implemented:
- existing same-root family remains a search/navigation category;
- basic major chords expose one relative-minor relation;
- basic minor chords expose one relative-major relation;
- relation mapping is reciprocal across all 12 canonical roots;
- seventh and suspended chords do not receive fabricated context-free relations;
- dominant-to-tonic evidence is deliberately excluded from the single-chord UI because the Harmonic Engine requires explicit tonal context and adjacency.

The UI uses precise labels such as **Göreli majör** and **Göreli minör** and does not call distinct harmonies “equivalent”.

## Non-goals
- server-side chord calculation
- Render dependency for core use
- account/login in core
- AI-required chord lookup
- note-set chord search
- silent substitution of a different voicing


### Stage 10 — mobile PWA + offline capability contract ✅
Implemented:
- standalone portrait PWA manifest with local id/scope;
- iPhone standalone metadata and `viewport-fit=cover`;
- safe-area padding for notched devices;
- >=44 px generic touch target floor and touch-action hardening;
- same-origin bounded service-worker caching;
- offline navigation fallback to the cached app shell;
- old cache cleanup and immediate service-worker activation;
- editor audio bridge may explicitly declare `capabilities.offlineReady`;
- UI never claims offline guitar timbre unless the host declares it.

Not yet claimed:
- physical iPhone/Safari qualification;
- offline availability of the editor's `smplr electric_guitar_jazz` assets. Current editor evidence proves use of that sampler, but not local packaging of its soundfont assets.


### Stage 11 — automated mobile browser qualification ✅
Implemented:
- Playwright 1.63.0 pinned as the browser test authority;
- WebKit with the Playwright iPhone 13 device profile validates the core mobile interaction flow;
- large-button MIDI dispatch is verified through an editor-style host bridge;
- Chromium separately validates real service-worker control and offline app-shell reload because Playwright service-worker support is Chromium-only;
- browser tests run alongside Node unit/authority tests in CI.

Boundary:
- this is automated WebKit/mobile-browser evidence, not a physical iPhone/Safari qualification;
- guitar soundfont offline availability remains unproven until the editor host packages the assets locally and declares `offlineReady:true`.


### Stage 12 — local guitar soundfont packaging path ✅
Implemented:
- optional build-time vendor command for `electric_guitar_jazz`;
- immutable source commit and Git blob SHA-1 pin;
- downloaded bytes are rejected unless the canonical Git blob hash matches;
- generated large audio asset is kept out of source control;
- source/license provenance is checked into the repository;
- a same-origin local smplr bridge publishes the existing `ST_GUITAR_AUDIO` contract;
- the local bridge declares `offlineReady:true` only because its instrument URL is forced to a relative same-origin path;
- service worker pre-caches the local soundfont when present but does not fail shell installation when it is absent.

Remaining qualification:
- execute the vendor step in the actual distributable build;
- bind the editor to the local bridge;
- verify cached guitar playback after network removal on a physical iPhone.


### Stage 13 — power chords ✅
Implemented:
- product catalog expands from 84 to 96 chord symbols;
- adds the `5` power-chord family across all 12 roots;
- power-chord interval contract is `[0,7]` (root + perfect fifth);
- the octave root may be doubled in the guitar voicing;
- each power chord exposes exactly two positions, not three:
  - root on string 6;
  - root on string 5;
- requested examples are fixed in tests:
  - `A5 = 5-7-7-x-x-x / x-0-2-2-x-x`;
  - `B5 = 7-9-9-x-x-x / x-2-4-4-x-x`;
  - `C5 = 8-10-10-x-x-x / x-3-5-5-x-x`;
- Turkish readings include `La beş`, `Si beş`, `Do beş`;
- power chords do not receive relative-major/minor relation cards;
- open-root power diagrams remain anchored at fret 1;
- WebKit iPhone smoke covers the two-position A5 flow.

Authority boundary:
- the pinned Harmonic Engine source does not define power chords in the reviewed template set;
- therefore `5 = [0,7]` is recorded as a Chord Board product extension rather than falsely attributed to the Harmonic Engine.


### Stage 14 — enharmonic display spelling ✅
Implemented:
- canonical pitch identity remains sharp-based internally for deterministic fret/MIDI behavior;
- a separate presentation parse preserves the user's accidental spelling;
- common flat roots `Db, Eb, Gb, Ab, Bb` remain visible as entered;
- Turkish readings follow the displayed spelling, e.g. `Bb5 → Si bemol beş`;
- same-root suggestion families preserve flat spelling;
- partial flat lookup such as `Bbma` resolves to `Bbmaj7`;
- audio payload carries both canonical `symbol` and user-facing `displaySymbol`;
- enharmonic aliases resolve to identical guitar voicings and MIDI;
- WebKit iPhone smoke verifies `Bb5` display, suggestions and canonical audio identity.

Contract example:
```text
input/display: Bb5
canonical identity: A#5
Turkish reading: Si bemol beş
voicing/MIDI: identical to A#5
```

This is a display/spelling layer only; it does not duplicate the 96 canonical chord identities.


### Stage 16 — swipe voicing navigation ✅
Implemented:
- the large chord surface accepts touch/pen pointer gestures;
- swipe left selects the next voicing;
- swipe right selects the previous voicing;
- a 48 px horizontal threshold plus axis-dominance check rejects small/diagonal gestures;
- vertical gestures remain scroll-friendly through `touch-action: pan-y`;
- recognized swipes suppress the following synthetic click so changing position does not accidentally play the chord;
- normal tap-to-play remains unchanged;
- existing previous/next buttons remain available and share the same bounded voicing-change path;
- WebKit iPhone smoke covers left swipe, right swipe, click suppression and vertical-gesture rejection.

Boundary:
- swipe is bounded at the first/last voicing; it does not wrap around.


### Stage 17 — device-local selection restore ✅
Implemented:
- a small `selection-state` module owns persisted selection validation;
- persisted state contains only `display symbol + voicing index`;
- restore validates the chord through the existing presentation parser and validates the index against the current voicing provider;
- invalid/stale state never enters the runtime selection path and falls back to `C / first voicing`;
- localStorage access is failure-contained so private/restricted storage modes do not block app startup;
- all successful chord selections and voicing changes persist immediately;
- service-worker app shell caches the state module for offline startup;
- WebKit reload and Chromium forced-offline reload verify restoration.

Privacy/runtime boundary:
- state remains on the device;
- no user identity, analytics, cloud sync, or backend dependency is introduced.


### Stage 18 — publishable release build + packaged guitar audio ✅
Implemented:
- one-command `npm run build:release` pipeline;
- immutable soundfont source and Git-blob verification before packaging;
- clean static `dist/` output with an explicit runtime-file allowlist;
- development-only theory/validation modules excluded from the release artifact;
- release-only config enables standalone guitar audio without changing source-development behavior;
- standalone MIDI.js soundfont bridge maps exact MIDI to local note samples and decodes them through Web Audio;
- editor-owned `ST_GUITAR_AUDIO` remains authoritative when present;
- release Service Worker requires the local soundfont cache entry instead of silently tolerating absence;
- release manifest records version, runtime file set, source commit, soundfont byte count and blob hash;
- dedicated Chromium release qualification proves local sample loading/decode/playback, Service Worker caching, network removal, offline reload and playback-path completion;
- CI publishes the static `dist/` tree as `st-guitar-chord-board-release`.

Verified release soundfont:
- instrument: `electric_guitar_jazz`;
- size: `2,330,622` bytes;
- Git blob SHA-1: `2c0ef6f12d5a260982520130c97905e5931a60d4`.

Remaining boundary:
- actual audible output quality and first-gesture behavior still require a physical iPhone/Safari qualification before v1.0.


### Stage 19 — production static deployment ✅
Implemented:
- live HTTPS site at `https://st-guitar-chord-board.onrender.com`;
- Render Static Site connected directly to GitHub `main`;
- automatic deploys on new main commits;
- production build command is the qualified Stage 18 `build:release` pipeline;
- only generated `dist/` assets are published;
- no backend/runtime server dependency was introduced;
- first deploy of commit `02a1ddf49a30ee22146bd463a0f87ca673a39bd5` reached Render `live` state;
- provider logs independently confirm soundfont size and Git-blob verification during the live build.

Deployment is hosting infrastructure only; core use remains offline-first after the PWA assets have been cached.


### 0.18.1 — standalone soundfont accidental mapping hotfix ✅
Root cause:
- product MIDI identity is chromatic and spelling-independent;
- the standalone bridge converted chromatic MIDI to sharp note names;
- the pinned MIDI.js soundfont indexes black-key samples with flat names;
- a missing single sample rejected the chord's `Promise.all`, so many chords produced no audio.

Fix:
- standalone sample lookup now uses the soundfont-native pitch-class vocabulary `C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B`;
- harmonic/chord identity and user-facing enharmonic spelling are unchanged;
- no duplicate audio assets are introduced;
- exhaustive release coverage verifies all MIDI notes used by all voicings across all 96 canonical chords;
- offline cache version is rotated so installed PWAs update the bridge.


### Stage 21 — curated voicing selection and ordering ✅
Runtime selection policy:
- curated open/open-region voicing remains first when one exists;
- C-family reviewed definitions remain explicit three-position authorities;
- each movable A/E/D-family template produces all octave-equivalent transpositions congruent to the requested root while keeping every originally played fret inside 0..20;
- negative played frets invalidate a placement; `-1` is preserved only for strings that were already muted;
- exact fret-vector duplicates are removed;
- remaining candidates are ranked deterministically by lower practical base fret, lower maximum fret, lower fret span and stable source order;
- the selected list is capped at exactly three positions for every non-power chord;
- power chords keep their independent exactly-two-position contract.

Catalog invariant:
`84 non-power × 3 + 12 power × 2 = 276` displayed voicings.

Persistence/release compatibility:
- a previously stored fourth non-power position migrates to the new third position without weakening malformed-state rejection;
- Service Worker cache rotates to `st-guitar-chord-board-v14`;
- release `0.19.0` keeps the existing pinned 2,330,622-byte `electric_guitar_jazz` soundfont;
- GitHub Pages remains the static/offline distribution target; no Render dependency is introduced.
