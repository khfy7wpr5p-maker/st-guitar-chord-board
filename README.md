# ST Guitar Chord Board

Offline-first, phone-first interactive guitar chord surface.

**Live app:** https://st-guitar-chord-board.onrender.com

## Current status — Stage 19

The app targets:

- **12 chromatic roots**
- **8 chord families:** major, minor, 7, maj7, m7, sus2, sus4, power chord (5)
- **96 searchable chord symbols**
- original 84 chords keep **3+ exact guitar voicings**
- the 12 power chords use **exactly 2 guitar positions**
- Turkish reading shown for every selected chord
- compact same-root chord-family suggestions
- curated open/open-region first voicings for common guitar chords
- finger numbers and barre metadata
- exact string/fret -> MIDI playback payloads
- phone-first large tactile chord surface with a real six-string chord diagram
- no required backend or Render dependency
- CI cross-checks against pinned ST fretboard, harmony and fingering authorities
- editor-first audio routing avoids suspended Score Audio guitar profiles
- explicit relative major/minor relation for basic major/minor chords
- iPhone-safe standalone PWA shell with safe-area/touch contracts
- offline app-shell fallback with same-origin bounded caching
- WebKit iPhone-profile browser smoke tests
- Chromium service-worker offline reload smoke test
- pinned build-time local guitar soundfont vendoring path
- same-origin local smplr bridge with explicit offlineReady capability
- enharmonic display spelling preserved for flat chord input
- Tonal.js development/CI theory cross-check across all 96 canonical chords and displayed voicings
- horizontal swipe navigation between chord voicings on the large chord surface
- last selected chord spelling and voicing restored locally across reloads/offline relaunches
- verified static release build with packaged `electric_guitar_jazz` soundfont
- standalone Web Audio guitar bridge for published builds
- CI-qualified online + offline packaged-sample playback path
- live static deployment with automatic main-branch updates

### Search and naming rule

Search is symbol-first:

- `Am` → **La minör**
- `E` → **Mi majör**
- `A5` → **La beş**
- `B5` → **Si beş**
- `C5` → **Do beş**
- `G7` → **Sol yedili**
- `Bb5` → **Si bemol beş**
- `Ebmaj7` → **Mi bemol majör yedili**

When a valid chord is entered, the compact suggestion strip shows the selected chord first and then the other supported qualities on the same root.

Enharmonic spelling is presentation-safe: `Bb5` and `A#5` use the same physical pitch/fret identity, but the interface keeps the spelling the user entered. Flat input also keeps flat same-root suggestions such as `Bb / Bbm / Bb7 / ... / Bb5`.

### Power chords

Power chords are a deliberately smaller product family:

- 12 roots: `C5` through `B5`
- harmonic set: root + perfect fifth
- displayed guitar shape may repeat the root at the octave
- exactly two positions:
  1. root on string 6
  2. root on string 5

Examples:

```text
A5: 5-7-7-x-x-x   | x-0-2-2-x-x
B5: 7-9-9-x-x-x   | x-2-4-4-x-x
C5: 8-10-10-x-x-x | x-3-5-5-x-x
```

Power chords do not receive relative-major/minor relation cards.

### Chord relations

The product does not use the vague label “equivalent chord”. Relations are explicit:

- `C` → **Göreli minör: Am — La minör**
- `Am` → **Göreli majör: C — Do majör**

This relation is shown only for basic major/minor chords.

### Guitar voicings

The original 84 chord identities retain the existing 3+ voicing rule. Power chords are the only current exception and intentionally expose exactly two positions.

CI verifies:

- all 96 canonical chords remain searchable;
- every displayed voicing contains exactly the requested pitch classes;
- all 12 power chords have exactly two positions;
- generated frets stay within the bounded guitar range;
- common open shapes remain prioritized.

The button contains no “Play” or “Dokun” label. Touching the chord surface itself is the play action.

On touch devices, swipe left/right directly on the large chord surface to move between voicings. Vertical gestures remain available for page scrolling. A recognized swipe suppresses the synthetic click that would otherwise play the chord accidentally. The existing ‹ / › controls remain available.

## Audio

Audio routing prefers the editor-owned `ST_GUITAR_AUDIO.playChord(...)` bridge. The board reports “çevrimdışı hazır” only when that host explicitly declares `capabilities.offlineReady: true`.

See [docs/AUDIO-INTEGRATION.md](docs/AUDIO-INTEGRATION.md).

Local offline-audio packaging is documented in [docs/LOCAL-AUDIO-PACKAGING.md](docs/LOCAL-AUDIO-PACKAGING.md).

Authority compatibility is documented in [docs/AUTHORITY-CROSSCHECK.md](docs/AUTHORITY-CROSSCHECK.md).

Tonal theory validation and its runtime isolation boundary are documented in [docs/TONAL-THEORY-VALIDATION.md](docs/TONAL-THEORY-VALIDATION.md).

Mobile/browser qualification is documented in [docs/MOBILE-QUALIFICATION.md](docs/MOBILE-QUALIFICATION.md).

## Run

```bash
npm test
npm run build:release
npm run serve:release
```

Open `http://localhost:4174` for the generated release build.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Cloud services may be added later for accounts or sync without becoming a prerequisite for chord lookup or playback.


### Stage 15 — Tonal theory validation ✅
Implemented:
- pinned `tonal@6.4.3` as a development-only dependency;
- all 96 canonical chord identities are independently cross-checked against Tonal pitch classes;
- every displayed guitar voicing is cross-checked directly against the Tonal chord identity;
- power chords use Tonal's standard `5` chord definition;
- enharmonic display aliases are validated through the existing canonical ST identity;
- CI guards that Tonal is not imported by the browser app or service-worker app shell.

Runtime contract:
- ST remains authoritative for product vocabulary, Turkish naming, guitar voicings, fingering and playback payloads;
- Tonal is a development/CI regression oracle only;
- installed/offline use requires no Tonal CDN, npm runtime, backend or network connection.


### Stage 16 — swipe voicing navigation ✅
Implemented:
- swipe left selects the next voicing;
- swipe right selects the previous voicing;
- navigation is bounded at the first/last voicing;
- vertical gestures remain available for scrolling;
- recognized swipe suppresses the following synthetic click;
- normal tap-to-play and existing ‹ / › controls remain unchanged;
- WebKit iPhone smoke covers horizontal navigation, click suppression and vertical-gesture rejection.


### Stage 17 — restore last selection ✅
Implemented:
- the last valid displayed chord symbol and voicing index are stored in browser `localStorage`;
- enharmonic display spelling is preserved, e.g. `Bb5` restores as `Bb5`, not `A#5`;
- reload restores the exact selected voicing;
- offline PWA reload restores the same selection from device-local state;
- malformed JSON, unknown chords, unavailable storage, negative/fractional indices, or out-of-range voicing indices fall back safely to `C / 1`;
- no account, backend, Render service, sync service, or new UI control is required.

Storage key:
`st-guitar-chord-board:last-selection:v1`


### Stage 18 — publishable offline-audio release build ✅
Implemented:
- `npm run build:release` vendors the pinned guitar soundfont, verifies its canonical Git blob hash, and emits a static `dist/` package;
- release builds enable a standalone same-origin MIDI.js soundfont bridge while source/development builds leave it disabled;
- an editor-provided `ST_GUITAR_AUDIO` bridge still has priority and is never overwritten;
- release Service Worker installation requires the packaged soundfont to be successfully cached;
- the generated `release-manifest.json` records version, runtime files, soundfont bytes, source commit and verified blob hash;
- release artifacts contain runtime files only; development-only Tonal validation code is excluded;
- CI opens the built `dist`, loads and decodes the real packaged guitar samples, confirms successful chord playback, disables networking, reloads, and confirms the packaged playback path again;
- CI uploads `st-guitar-chord-board-release` as the deployable static artifact.

Current automated release qualification does not replace the final physical iPhone/Safari audible-playback check.


### Stage 19 — live static deployment ✅
Implemented:
- production static site is hosted at `https://st-guitar-chord-board.onrender.com`;
- source repository is `khfy7wpr5p-maker/st-guitar-chord-board`;
- deployment tracks the `main` branch;
- auto-deploy is enabled for new commits;
- Render executes `npm install --no-audit --no-fund && npm run build:release`;
- only `dist/` is published;
- first live deploy used commit `02a1ddf49a30ee22146bd463a0f87ca673a39bd5`;
- live build logs confirm the 2,330,622-byte soundfont and pinned Git blob hash before publication.

Deployment details are documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
