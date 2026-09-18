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
